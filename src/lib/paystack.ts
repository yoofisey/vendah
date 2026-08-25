import "server-only";

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? "";
const API = "https://api.paystack.co";

export type PaystackInitInput = {
  email: string;
  amountMinor: number;
  reference: string;
  callbackUrl: string;
  subaccount?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  mobileMoney?: { phone: string; provider: string };
};

export async function initializePaystackCharge(input: PaystackInitInput): Promise<{
  authorization_url: string;
  reference: string;
  access_code: string;
}> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      reference: input.reference,
      callback_url: input.callbackUrl,
      ...(input.subaccount ? { subaccount: input.subaccount } : {}),
      ...(input.plan ? { plan: input.plan } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.channels ? { channels: input.channels } : {}),
      ...(input.mobileMoney ? { mobile_money: input.mobileMoney } : {}),
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to initialize Paystack transaction");
  }
  return json.data;
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<{
  status: string;
  reference: string;
  amount: number;
  paid_at?: string;
  [key: string]: unknown;
}> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(
    `${API}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${SECRET_KEY}` } }
  );
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to verify Paystack transaction");
  }
  return json.data;
}

export async function createPaystackSubaccount(input: {
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  percentageCharge: number;
}): Promise<{ subaccount_code: string }> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}/subaccount`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: input.businessName,
      settlement_bank: input.settlementBank,
      account_number: input.accountNumber,
      percentage_charge: input.percentageCharge,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to create subaccount");
  }
  return json.data;
}

export async function getPaystackBanks(
  currency = "GHS"
): Promise<{ code: string; name: string }[]> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}/bank?currency=${currency}`, {
    headers: { Authorization: `Bearer ${SECRET_KEY}` },
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to load banks");
  }
  return json.data;
}

export async function getPaystackPlan(
  planCode: string
): Promise<{ plan_code: string } | null> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}/plan/${encodeURIComponent(planCode)}`, {
    headers: { Authorization: `Bearer ${SECRET_KEY}` },
  });
  const json = await res.json();
  if (!res.ok || !json.status) return null;
  return json.data;
}

export async function createPaystackPlan(input: {
  name: string;
  planCode: string;
  amountMinor: number;
  interval: "monthly" | "annually";
}): Promise<{ plan_code: string }> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}/plan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      amount: input.amountMinor,
      interval: input.interval,
      currency: "GHS",
      plan_code: input.planCode,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to create Paystack plan");
  }
  return json.data;
}

export async function ensurePaystackPlan(input: {
  name: string;
  planCode: string;
  amountMinor: number;
  interval: "monthly" | "annually";
}): Promise<string> {
  const existing = await getPaystackPlan(input.planCode);
  if (existing) return existing.plan_code;
  try {
    const created = await createPaystackPlan(input);
    return created.plan_code;
  } catch {
    const retry = await getPaystackPlan(input.planCode);
    if (retry) return retry.plan_code;
    throw new Error("Failed to create Paystack plan");
  }
}

export async function changePaystackSubscriptionPlan(
  subscriptionCode: string,
  planCode: string
): Promise<void> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}/subscription/${encodeURIComponent(subscriptionCode)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan: planCode }),
  });
  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message ?? "Failed to update Paystack subscription");
  }
}

export async function cancelPaystackSubscription(
  subscriptionCode: string
): Promise<void> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}/subscription/${encodeURIComponent(subscriptionCode)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message ?? "Failed to cancel Paystack subscription");
  }
}

export async function updatePaystackSubaccountPercentage(
  subaccountCode: string,
  percentageCharge: number
): Promise<void> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}/subaccount/${encodeURIComponent(subaccountCode)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ percentage_charge: percentageCharge }),
  });
  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message ?? "Failed to update Paystack subaccount");
  }
}

export async function initiatePaystackRefund(input: {
  transaction: string;
  amountMinor?: number;
  reason?: string;
}): Promise<{ status: string; refund_reference: string }> {
  if (!SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const body: Record<string, unknown> = {
    transaction: input.transaction,
  };
  if (input.amountMinor) body.amount = input.amountMinor;
  if (input.reason) body.reason = input.reason;

  const res = await fetch(`${API}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to initiate refund");
  }
  return json.data;
}
