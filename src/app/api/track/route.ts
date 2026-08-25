import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path, referrer, visitor_id } = body as {
      path?: string;
      referrer?: string;
      visitor_id?: string;
    };
    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const host = request.headers.get("host") ?? "";
    const subdomain = host.split(".")[0] || "";

    const admin = createAdminClient();
    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("subdomain", subdomain)
      .maybeSingle();

    if (!tenant) {
      return NextResponse.json({ error: "tenant not found" }, { status: 404 });
    }

    const { error } = await admin.from("page_views").insert({
      tenant_id: tenant.id,
      path,
      referrer: referrer || null,
      visitor_id: visitor_id || null,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
