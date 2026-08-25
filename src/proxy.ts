import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

// Routes tenant storefronts on their subdomains:
//   shop.example.com/product/123  ->  /shop/product/123
// The apex domain serves the platform (auth, dashboard, onboarding).
export async function proxy(request: NextRequest) {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost";
  const hostname =
    request.headers.get("host")?.split(":")[0] ??
    request.nextUrl.hostname ??
    appDomain;

  if (hostname !== appDomain && hostname !== `www.${appDomain}`) {
    const prefix = hostname.endsWith(`.${appDomain}`)
      ? hostname.slice(0, -(appDomain.length + 1))
      : null;

    if (prefix && !prefix.includes(".") && prefix !== "www") {
      const url = request.nextUrl.clone();
      url.pathname = `/${prefix}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  const pathname = request.nextUrl.pathname;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (pathname === "/checkout" || pathname.includes("/checkout/actions")) {
    const { allowed, retryAfterMs } = checkRateLimit(
      `checkout:${ip}`,
      RATE_LIMITS.checkout
    );
    if (!allowed) return rateLimitResponse(retryAfterMs);
  }

  if (pathname === "/sign-in" || pathname === "/sign-up") {
    const { allowed, retryAfterMs } = checkRateLimit(
      `auth:${ip}`,
      RATE_LIMITS.auth
    );
    if (!allowed) return rateLimitResponse(retryAfterMs);
  }

  if (pathname === "/reset-password") {
    const { allowed, retryAfterMs } = checkRateLimit(
      `pwreset:${ip}`,
      RATE_LIMITS.passwordReset
    );
    if (!allowed) return rateLimitResponse(retryAfterMs);
  }

  // Platform routes: keep the Supabase auth session fresh.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
