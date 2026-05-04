import { getSupabaseAdmin } from "./supabase";
import { BUSINESS as SEED } from "./menu";

export type BusinessHours = { day: string; open: string; close: string };

export type BusinessInfo = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  instagram: string;
  hours: BusinessHours[];
};

const FALLBACK: BusinessInfo = {
  name: SEED.name,
  tagline: SEED.tagline ?? "",
  address: SEED.address ?? "",
  phone: SEED.phone ?? "",
  instagram: SEED.instagram ?? "",
  hours: SEED.hours ?? [],
};

export async function getBusinessInfo(): Promise<BusinessInfo> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("business_info")
      .select("name, tagline, address, phone, instagram, hours")
      .eq("id", 1)
      .maybeSingle<BusinessInfo>();
    if (error || !data) throw error ?? new Error("no row");
    return {
      name: data.name || FALLBACK.name,
      tagline: data.tagline ?? "",
      address: data.address ?? "",
      phone: data.phone ?? "",
      instagram: data.instagram ?? "",
      hours: Array.isArray(data.hours) ? data.hours : [],
    };
  } catch {
    return FALLBACK;
  }
}
