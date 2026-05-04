import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isOrderPadAuthed } from "@/lib/order-pad-auth";
import type { BusinessHours, BusinessInfo } from "@/lib/business-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — public. Returns the business info shown in the footer.
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("business_info")
    .select("name, tagline, address, phone, instagram, hours")
    .eq("id", 1)
    .maybeSingle<BusinessInfo>();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Not initialized" }, { status: 500 });
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}

type PatchBody = Partial<{
  name: string;
  tagline: string;
  address: string;
  phone: string;
  instagram: string;
  hours: BusinessHours[];
}>;

// PATCH — staff-only. Updates any subset of fields.
export async function PATCH(req: NextRequest) {
  if (!(await isOrderPadAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const n = body.name.trim();
    if (!n) return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    if (n.length > 80) return Response.json({ error: "Name too long" }, { status: 400 });
    update.name = n;
  }
  if (body.tagline !== undefined) update.tagline = body.tagline.trim().slice(0, 200);
  if (body.address !== undefined) update.address = body.address.trim().slice(0, 200);
  if (body.phone !== undefined) update.phone = body.phone.trim().slice(0, 40);
  if (body.instagram !== undefined) update.instagram = body.instagram.trim().slice(0, 60);

  if (body.hours !== undefined) {
    if (!Array.isArray(body.hours)) {
      return Response.json({ error: "Hours must be an array" }, { status: 400 });
    }
    if (body.hours.length > 14) {
      return Response.json({ error: "Too many hours rows" }, { status: 400 });
    }
    const cleaned: BusinessHours[] = [];
    for (const row of body.hours) {
      if (!row || typeof row !== "object") continue;
      const day = String(row.day ?? "").trim().slice(0, 40);
      const open = String(row.open ?? "").trim().slice(0, 20);
      const close = String(row.close ?? "").trim().slice(0, 20);
      if (!day) continue;
      cleaned.push({ day, open, close });
    }
    update.hours = cleaned;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("business_info")
    .update(update)
    .eq("id", 1)
    .select("name, tagline, address, phone, instagram, hours")
    .single<BusinessInfo>();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
