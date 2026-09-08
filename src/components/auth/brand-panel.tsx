import Link from "next/link";
import { VenfiiLogo } from "@/components/venfii-logo";

export function BrandPanel({
  eyebrow,
  title,
  subtitle,
  stats,
  quote,
  footer,
  footerLink,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  stats?: { icon: React.ReactNode; value: string; label: string; delta: string }[];
  quote?: { text: string; author: string };
  footer?: string;
  footerLink?: { label: string; href: string };
}) {
  return (
    <aside className="relative hidden overflow-hidden bg-[linear-gradient(165deg,#1b4332_0%,#163a2b_48%,#0f2c20_100%)] text-white lg:flex lg:flex-col lg:px-14 lg:py-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 85% 4%, rgba(212,160,23,0.2), transparent 40%), radial-gradient(circle at 6% 92%, rgba(45,106,79,0.5), transparent 55%), linear-gradient(115deg, rgba(255,255,255,0.05) 0%, transparent 28%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="pointer-events-none absolute -bottom-44 -right-32 h-[26rem] w-[26rem] rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-[18rem] w-[18rem] rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -top-24 right-1/3 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative z-10 flex flex-1 flex-col justify-between gap-16">
        <Link href="/" className="w-fit">
          <VenfiiLogo onDark />
        </Link>

        <div className="max-w-md">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-[1.12] tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              {subtitle}
            </p>
          )}

          {stats && (
            <div className="mt-10 space-y-5">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="flex max-w-sm items-center gap-4 rounded-xl border border-white/15 bg-white/10 p-5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] backdrop-blur-md animate-float"
                  style={{ animationDelay: `${i * 0.8}s` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/25 text-gold-light shadow-inner">
                    {stat.icon}
                  </span>
                  <div>
                    <p className="font-heading text-2xl font-semibold leading-tight">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-sm text-white/70">
                      {stat.label} ·{" "}
                      <span className="text-gold-light">{stat.delta}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quote && (
            <figure className="mt-10 border-l-2 border-gold/70 pl-5">
              <blockquote className="text-[15px] leading-relaxed text-white/85">
                “{quote.text}”
              </blockquote>
              <figcaption className="mt-2 text-sm text-white/55">
                {quote.author}
              </figcaption>
            </figure>
          )}
        </div>

        {footer && (
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gold/60" />
            <p className="text-sm text-white/60">
              {footer}
              {footerLink && (
                <>
                  {" "}
                  <Link
                    href={footerLink.href}
                    className="font-medium text-gold-light underline-offset-4 hover:underline"
                  >
                    {footerLink.label}
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
