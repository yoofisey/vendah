import Link from "next/link";
import {
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { WhatsAppCatalogLink } from "@/components/storefront/whatsapp-share";
import type { Tenant } from "@/lib/types";

export function StorefrontFooter({ tenant }: { tenant: Tenant }) {
  const contact = tenant.contact_info ?? {};
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-charcoal/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-heading text-xl font-semibold text-charcoal">
            {tenant.name}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Shop smarter with vendah — your online storefront, delivered.
          </p>
          <div className="mt-5 flex items-center gap-2.5">
            <SocialPlaceholder label="Instagram" href="#">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
            </SocialPlaceholder>
            <SocialPlaceholder label="Facebook" href="#">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12z" />
              </svg>
            </SocialPlaceholder>
            <SocialPlaceholder label="X (Twitter)" href="#">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </SocialPlaceholder>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-charcoal">
            Quick links
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link href="/shop" className="transition duration-150 hover:text-pine">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/account" className="transition duration-150 hover:text-pine">
                Account
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="transition duration-150 hover:text-pine">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/track" className="transition duration-150 hover:text-pine">
                Track order
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-charcoal">
            Help
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link href="/delivery" className="transition duration-150 hover:text-pine">
                Delivery &amp; Returns
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition duration-150 hover:text-pine">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition duration-150 hover:text-pine">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/faq" className="transition duration-150 hover:text-pine">
                FAQs
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition duration-150 hover:text-pine">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-charcoal">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {contact.phone && (
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0 text-charcoal-mute" />
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                  className="transition duration-150 hover:text-pine"
                >
                  {contact.phone}
                </a>
              </li>
            )}
            {(contact.email || contact.whatsapp) && (
              <li className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 shrink-0 text-charcoal-mute" />
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="transition duration-150 hover:text-pine"
                  >
                    {contact.email}
                  </a>
                ) : (
                  contact.whatsapp
                )}
              </li>
            )}
            {contact.businessHours && (
              <li className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 shrink-0 text-charcoal-mute" />
                {contact.businessHours}
              </li>
            )}
            <li>
              <Link href="/contact" className="transition duration-150 hover:text-pine">
                Contact page
              </Link>
            </li>
          </ul>
          <div className="mt-4">
            <WhatsAppCatalogLink
              subdomain={tenant.subdomain!}
              businessPhone={contact.phone ?? contact.whatsapp}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-charcoal/5 py-5 text-center text-xs text-muted">
        <p>
          © {year} {tenant.name}. All rights reserved.
        </p>
        <p className="mt-1">
          Powered by <span className="font-semibold text-pine">Vendah</span>
        </p>
      </div>
    </footer>
  );
}

function SocialPlaceholder({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={`${label} (coming soon)`}
      title={`${label} — coming soon`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/15 text-charcoal-soft transition duration-150 hover:border-pine hover:text-pine"
    >
      {children}
    </a>
  );
}
