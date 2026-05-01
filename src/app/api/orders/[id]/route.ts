import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]">
) {
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, amount_cents, currency, items, notes, paid_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("orders.get error", error);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
