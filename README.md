# Venfii — Sell Smarter

Multi-tenant e-commerce platform for Ghanaian merchants. Each seller gets a branded storefront at `<shopname>.venfii.com` with a dashboard to manage products, orders, payments and customers.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Payments:** Paystack (card + mobile money)
- **Email:** Resend (with console mock fallback)
- **Validation:** Zod

## Getting Started

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd venfii
npm install
```

2. Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

3. Run Supabase migrations (requires [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase db push
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_DOMAIN` | Apex domain (default: `venfii.com`) |
| `NEXT_PUBLIC_SITE_URL` | Full site URL for auth redirects (e.g. `http://localhost:3000`) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (server-side only) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `RESEND_API_KEY` | Resend API key (omit for console mock mode) |
| `EMAIL_FROM` | Sender address for transactional emails |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Sign in, sign up, password reset, OAuth callback
│   ├── (dashboard)/     # Merchant admin: products, orders, customers, payments, settings
│   ├── (storefront)/    # Customer-facing storefront (subdomain-based)
│   └── api/webhooks/    # Paystack webhook handler
├── components/          # Shared UI components
├── lib/                 # Utilities, DB queries, auth, billing, email, Paystack
└── proxy.ts             # Subdomain routing middleware
supabase/
└── migrations/          # SQL migrations (16 sequential files)
```

## Key Features

- **Multi-tenant subdomain routing** — each shop gets `<subdomain>.venfii.com`
- **Category-based theming** — 9 business verticals with unique color palettes
- **Product management** — images, category-specific attributes, stock tracking
- **Checkout** — Paystack card + mobile money (MTN, Vodafone, AirtelTigo)
- **Order lifecycle** — pending → paid → processing → shipped → delivered
- **Email notifications** — order confirmations, merchant alerts, status updates
- **Subscription billing** — Free, Starter, Growth, Industry tiers
- **Dashboard analytics** — KPIs, sales chart, recent orders, launch checklist

## Deployment

Deploy to [Vercel](https://vercel.com) with the Supabase integration. Set all environment variables in the Vercel dashboard.

For subdomain routing in production, configure a wildcard DNS record (`*.venfii.com`) pointing to your Vercel deployment.
