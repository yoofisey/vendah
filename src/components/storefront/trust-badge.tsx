import {
  ShieldCheckIcon,
  CheckBadgeIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";

export function TrustBadgeStrip({
  sellerVerified,
}: {
  sellerVerified: boolean;
}) {
  const badges = [
    { icon: ShieldCheckIcon, label: "Secure Checkout" },
    ...(sellerVerified
      ? [{ icon: CheckBadgeIcon, label: "Verified Seller" }]
      : []),
    { icon: TruckIcon, label: "Fast Delivery" },
  ];

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-charcoal/10 bg-cream px-4 py-3">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-soft"
        >
          <badge.icon className="h-4 w-4 shrink-0 text-pine" />
          {badge.label}
        </span>
      ))}
    </div>
  );
}
