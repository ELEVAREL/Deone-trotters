import { NextRequest } from "next/server";
import {
  checkPin,
  setOrderPadAuthCookie,
  clearOrderPadAuthCookie,
} from "@/lib/order-pad-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tiny in-memory throttle. Per-IP. 10 attempts per 5 minutes.
const ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
function throttle(ip: string): boolean {
  const now = Date.now();
  const window = 5 * 60 * 1000;
  const entry = ATTEMPTS.get(ip);
  if (!entry || entry.resetAt < now) {
    ATTEMPTS.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  entry.count += 1;
  return entry.count <= 10;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!throttle(ip)) {
    return Response.json({ error: "Too many attempts. Try again in 5 minutes." }, { status: 429 });
  }
  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.pin || !checkPin(body.pin)) {
    return Response.json({ error: "Wrong PIN" }, { status: 401 });
  }
  await setOrderPadAuthCookie();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await clearOrderPadAuthCookie();
  return Response.json({ ok: true });
}
