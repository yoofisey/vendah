"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { initializePaystackCharge } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStorefrontUrl } from "@/lib/tenant";
import { validateDiscountCode, incrementDiscountUsage } from "@/lib/discounts";
import { validateAndRedeemGiftCard } from "@/lib/gift-cards";
import {
  getLoyaltySettings,
  getMemberBalance,
  validateAndRedeemPoints,
} from "@/lib/loyalty";
import { sendLowStockAlert, LOW_STOCK_THRESHOLD } from "@/lib/low-stock-alerts";
import {
  sendNewOrderNotificationToMerchant,
  sendOrderConfirmation,
} from "@/lib/fulfilment";


const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  tenantId: z.string().uuid(),
  cart: z.array(cartItemSchema).min(1).max(50),
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(30),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  notes: z.string().max(1000),
  paymentMethod: z.enum(["card", "mtn", "vodafone", "airteltigo", "cod"]),
  momoPhone: z.string().trim().max(15).optional(),
  shippingZoneId: z.string().uuid().optional(),
  giftCardCode: z.string().trim().max(20).optional(),
  loyaltyEmail: z.string().email().max(200).optional().or(z.literal("")),
  loyaltyPoints: z.number().int().min(0).optional().default(0),
});

const MOMO_PROVIDERS: Record<string, string> = {
  mtn: "mtn",
  vodafone: "vod",
  airteltigo: "atl",
};

export type CheckoutState = { error?: string; redirectUrl?: string };

export async function submitCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    return { error: "Your cart is empty or invalid." };
  }

  const parsed = checkoutSchema.safeParse({
    tenantId: String(formData.get("tenantId") ?? ""),
    cart: payload,
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    deliveryMethod: String(formData.get("deliveryMethod") ?? ""),
    notes: String(formData.get("notes") ?? "").trim(),
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    momoPhone: String(formData.get("momoPhone") ?? "").trim(),
    shippingZoneId: String(formData.get("shippingZoneId") ?? "").trim() || undefined,
    giftCardCode: String(formData.get("giftCardCode") ?? "").trim() || undefined,
    loyaltyEmail: String(formData.get("loyaltyEmail") ?? "").trim(),
    loyaltyPoints: Number(formData.get("loyaltyPoints") ?? 0),
  });
  if (!parsed.success) return { error: "Please check the details you entered." };
  const data = parsed.data;

  const isMomo =
    data.paymentMethod === "mtn" ||
    data.paymentMethod === "vodafone" ||
    data.paymentMethod === "airteltigo";
  const isCod = data.paymentMethod === "cod";
  if (isMomo && !/^0\d{9}$/.test(data.momoPhone ?? "")) {
    return { error: "Enter a valid 10-digit mobile money number." };
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select(
      "id, name, subdomain, status, paystack_subaccount_code, delivery_fee_minor"
    )
    .eq("id", data.tenantId)
    .maybeSingle();
  if (!tenant || tenant.status !== "active") {
    return { error: "This shop isn't accepting orders yet." };
  }
  if (!tenant.subdomain) {
    return { error: "This shop hasn't finished setting up." };
  }
  if (!tenant.paystack_subaccount_code && !isCod) {
    return {
      error:
        "This shop isn't set up to take payments yet. Please try again later.",
    };
  }

  const ids = data.cart.map((c) => c.productId);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, price_minor, currency, stock, attributes, status")
    .in("id", ids)
    .eq("tenant_id", tenant.id);
  if (productsError || !products || products.length !== data.cart.length) {
    return { error: "Some items in your cart are no longer available." };
  }

  const variantIds = data.cart
    .map((c) => c.variantId)
    .filter((id): id is string => !!id);
  const { data: variants } = variantIds.length > 0
    ? await admin
        .from("product_variants")
        .select("id, product_id, name, price_override_minor, stock, attributes")
        .in("id", variantIds)
    : { data: null };
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  const byId = new Map(products.map((p) => [p.id, p]));
  for (const c of data.cart) {
    const product = byId.get(c.productId)!;
    if (product.status !== "active") {
      return { error: `${product.name} is no longer available.` };
    }
    if (c.variantId) {
      const variant = variantMap.get(c.variantId);
      if (!variant) {
        return { error: `Variant for ${product.name} is no longer available.` };
      }
      if (variant.stock < c.quantity) {
        return { error: `Only ${variant.stock} left of ${product.name} (${variant.name}).` };
      }
    } else {
      if (product.stock < c.quantity) {
        return { error: `Only ${product.stock} left of ${product.name}.` };
      }
    }
  }

  const subtotal = data.cart.reduce((sum, c) => {
    const product = byId.get(c.productId)!;
    const variant = c.variantId ? variantMap.get(c.variantId) : null;
    const price = variant?.price_override_minor ?? Number(product.price_minor);
    return sum + price * c.quantity;
  }, 0);

  const { data: taxRateRows } = await admin
    .from("tax_rates")
    .select("id, name, rate_pct, applies_to")
    .eq("tenant_id", tenant.id)
    .eq("active", true);

  const applicableTaxRate = (taxRateRows ?? []).find(
    (r) => r.applies_to === "all"
  );
  const taxMinor = applicableTaxRate
    ? Math.round((subtotal * Number(applicableTaxRate.rate_pct)) / 10000)
    : 0;

  let deliveryFeeMinor = 0;
  let shippingZoneId: string | null = null;

  if (data.deliveryMethod === "delivery") {
    if (data.shippingZoneId) {
      const { data: zone } = await admin
        .from("shipping_zones")
        .select("id, fee_minor, free_above_minor")
        .eq("id", data.shippingZoneId)
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .maybeSingle();

      if (zone) {
        shippingZoneId = zone.id;
        const freeAbove = zone.free_above_minor;
        deliveryFeeMinor =
          freeAbove !== null && subtotal >= freeAbove ? 0 : Number(zone.fee_minor);
      } else {
        deliveryFeeMinor = Number(tenant.delivery_fee_minor ?? 0);
      }
    } else {
      deliveryFeeMinor = Number(tenant.delivery_fee_minor ?? 0);
    }
  }

  const discountCodeRaw = String(formData.get("discountCode") ?? "").trim();
  let discountMinor = 0;
  let appliedDiscountCode: string | null = null;

  if (discountCodeRaw) {
    const discount = await validateDiscountCode(
      tenant.id,
      discountCodeRaw,
      subtotal
    );
    if (!discount.valid) return { error: discount.error };
    discountMinor = discount.discountMinor;
    appliedDiscountCode = discountCodeRaw.toUpperCase().trim();
  }

  // Gift card redemption reduces the amount due after discount.
  let giftCardMinor = 0;
  let appliedGiftCardId: string | null = null;
  const dueAfterDiscount = Math.max(
    0,
    subtotal + deliveryFeeMinor + taxMinor - discountMinor
  );
  if (data.giftCardCode) {
    const gc = await validateAndRedeemGiftCard(
      tenant.id,
      data.giftCardCode,
      dueAfterDiscount
    );
    if (!gc.valid) return { error: gc.error };
    giftCardMinor = gc.appliedMinor;
    appliedGiftCardId = gc.id;
  }

  // Loyalty point redemption reduces the amount due further.
  let loyaltyCreditMinor = 0;
  let loyaltyPointsUsed = 0;
  let loyaltyPointsToMinor = 0;
  let loyaltyEmailUsed: string | null = null;
  const afterGiftCard = Math.max(0, dueAfterDiscount - giftCardMinor);
  if (data.loyaltyPoints > 0 && data.loyaltyEmail) {
    const settings = await getLoyaltySettings(tenant.id);
    if (!settings?.enabled) {
      return { error: "Loyalty points aren't enabled for this shop." };
    }
    loyaltyPointsToMinor = settings.points_to_minor;
    const balance = await getMemberBalance(tenant.id, data.loyaltyEmail);
    if (data.loyaltyPoints > balance) {
      return { error: "You don't have enough points for that redemption." };
    }
    loyaltyCreditMinor = Math.min(
      afterGiftCard,
      data.loyaltyPoints * settings.points_to_minor
    );
    loyaltyPointsUsed = Math.ceil(loyaltyCreditMinor / settings.points_to_minor);
    loyaltyEmailUsed = data.loyaltyEmail.trim();
    if (loyaltyCreditMinor < data.loyaltyPoints * settings.points_to_minor) {
      // Cap points actually used to those covering the remaining total.
      loyaltyPointsUsed = Math.max(
        1,
        Math.ceil(loyaltyCreditMinor / settings.points_to_minor)
      );
    }
  }

  const total = Math.max(0, afterGiftCard - loyaltyCreditMinor);

  const orderReference = `VH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const rollbackGiftCard = async () => {
    if (appliedGiftCardId) {
      await admin.rpc("restore_gift_card", {
        p_gift_card_id: appliedGiftCardId,
      } as never);
    }
  };
  const rollbackLoyalty = async (orderId: string) => {
    if (loyaltyEmailUsed && loyaltyPointsUsed > 0) {
      await admin.rpc("refund_loyalty_points", {
        p_tenant_id: tenant.id,
        p_email: loyaltyEmailUsed,
        p_points: loyaltyPointsUsed,
        p_order_id: orderId,
        p_reason: "checkout-refund",
      } as never);
    }
  };
  const { data: order } = await admin
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      reference: orderReference,
      customer_name: data.name,
      customer_phone: data.phone || null,
      customer_email: data.email,
      status: "pending",
      subtotal_minor: subtotal,
      delivery_fee_minor: deliveryFeeMinor,
      tax_minor: taxMinor,
      tax_rate_name: applicableTaxRate?.name ?? null,
      shipping_zone_id: shippingZoneId,
      total_minor: total,
      currency: "GHS",
      delivery_method: data.deliveryMethod,
      notes: data.notes || null,
      discount_code: appliedDiscountCode,
      discount_minor: discountMinor,
      gift_card_id: appliedGiftCardId,
      gift_card_minor: giftCardMinor,
      loyalty_points_redeemed: loyaltyPointsUsed,
      loyalty_credit_minor: loyaltyCreditMinor,
      payment_method: data.paymentMethod,
    })
    .select("*")
    .single();
  if (!order) {
    await rollbackGiftCard();
    return { error: "Couldn't create your order. Try again." };
  }

  // Actually consume the loyalty points for this order (peeked earlier). If the
  // balance changed in the meantime and redemption fails, abort and restore gift
  // card + points.
  if (loyaltyPointsUsed > 0 && loyaltyEmailUsed && loyaltyPointsToMinor > 0) {
    const redeemed = await validateAndRedeemPoints(
      tenant.id,
      loyaltyEmailUsed,
      loyaltyPointsUsed,
      order.id,
      loyaltyPointsToMinor
    );
    if (!redeemed.valid) {
      await admin.from("orders").delete().eq("id", order.id);
      await rollbackGiftCard();
      await rollbackLoyalty(order.id);
      return { error: redeemed.error };
    }
    if (redeemed.creditMinor !== loyaltyCreditMinor) {
      // Reconcile the recorded credit with what was actually applied.
      await admin
        .from("orders")
        .update({ loyalty_credit_minor: redeemed.creditMinor })
        .eq("id", order.id);
    }
  }

  const orderItems = data.cart.map((c) => {
    const product = byId.get(c.productId)!;
    const variant = c.variantId ? variantMap.get(c.variantId) : null;
    return {
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      variant_id: c.variantId ?? null,
      price_minor: variant?.price_override_minor ?? Number(product.price_minor),
      quantity: c.quantity,
      attributes: variant?.attributes ?? product.attributes ?? {},
    };
  });
  await admin.from("order_items").insert(orderItems);

  if (isCod) {
    // No online payment: reserve stock now, record collection on delivery,
    // and notify both parties immediately.
    try {
      for (const c of data.cart) {
        if (c.variantId) {
          await admin.rpc("decrement_variant_stock", {
            p_variant_id: c.variantId,
            p_quantity: c.quantity,
          });
        } else {
          await admin.rpc("decrement_stock", {
            p_product_id: c.productId,
            p_quantity: c.quantity,
          });
        }
      }
    } catch {
      await admin.from("orders").delete().eq("id", order.id);
      await rollbackGiftCard();
      await rollbackLoyalty(order.id);
      return { error: "Some items just went out of stock. Please try again." };
    }

    const { data: fresh } = await admin
      .from("products")
      .select("id, name, stock")
      .in(
        "id",
        data.cart.map((c) => c.productId)
      );
    for (const product of fresh ?? []) {
      if (Number(product.stock) <= LOW_STOCK_THRESHOLD) {
        await sendLowStockAlert(tenant.id, product.name, Number(product.stock));
      }
    }
    if (appliedDiscountCode) {
      await incrementDiscountUsage(tenant.id, appliedDiscountCode);
    }

    await sendOrderConfirmation(order, orderItems);
    await sendNewOrderNotificationToMerchant(order, orderItems);

    return {
      redirectUrl: `${getStorefrontUrl(
        tenant.subdomain
      )}/checkout/success?order=${orderReference}&cod=1`,
    };
  }

  const reference = `VH-${randomUUID()}`;
  const { data: transaction, error: txError } = await admin
    .from("transactions")
    .insert({
      tenant_id: tenant.id,
      order_id: order.id,
      provider: "paystack",
      provider_reference: reference,
      amount_minor: total,
      currency: "GHS",
      status: "initiated",
    })
    .select("id")
    .single();
  if (txError || !transaction) {
    await admin.from("orders").delete().eq("id", order.id);
    await rollbackGiftCard();
    await rollbackLoyalty(order.id);
    return { error: "Couldn't start checkout. Try again." };
  }

  const callbackUrl = `${getStorefrontUrl(
    tenant.subdomain
  )}/checkout/success?order=${orderReference}`;
  try {
    const init = await initializePaystackCharge({
      email: data.email,
      amountMinor: total,
      reference,
      callbackUrl,
      subaccount: tenant.paystack_subaccount_code,
      channels: isMomo ? ["mobile_money"] : ["card"],
      ...(isMomo
        ? { mobileMoney: { phone: data.momoPhone!, provider: MOMO_PROVIDERS[data.paymentMethod] } }
        : {}),
      metadata: {
        orderId: order.id,
        tenantId: tenant.id,
        method: data.paymentMethod,
      },
    });
    await admin
      .from("transactions")
      .update({
        payload: {
          authorization_url: init.authorization_url,
          channel: isMomo ? "mobile_money" : "card",
          method: data.paymentMethod,
          momo_phone: isMomo ? data.momoPhone : null,
        },
      })
      .eq("id", transaction.id);
    return { redirectUrl: init.authorization_url };
  } catch {
    await admin.from("transactions").delete().eq("order_id", order.id);
    await admin.from("orders").delete().eq("id", order.id);
    return { error: "Payment could not be started. Please try again." };
  }
}
