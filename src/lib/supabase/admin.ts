import { createClient } from "@supabase/supabase-js";

// Service-role client for trusted server-side operations that must bypass RLS
// (e.g. order creation during checkout). Never expose to the client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
