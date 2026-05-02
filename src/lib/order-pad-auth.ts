import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "order_pad_auth";
const TOKEN_TTL_DAYS = 30;

function getSecret(): string {
  // Use ORDER_PAD_SECRET if defined, else derive from the PIN, else a dev default.
  return (
    process.env.ORDER_PAD_SECRET ||
    `pin:${process.env.ORDER_PAD_PIN ?? "0000"}:supperclub`
  );
}

export function getOrderPadPin(): string {
  return process.env.ORDER_PAD_PIN ?? "0000";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function makeToken(): string {
  const payload = `pad-${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return false;
    }
  } catch {
    return false;
  }
  // payload format: pad-<ms>
  const ms = Number(payload.split("-")[1]);
  if (!Number.isFinite(ms)) return false;
  const ageDays = (Date.now() - ms) / (1000 * 60 * 60 * 24);
  return ageDays <= TOKEN_TTL_DAYS;
}

export async function isOrderPadAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function setOrderPadAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearOrderPadAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function checkPin(pin: string): boolean {
  const expected = getOrderPadPin();
  if (typeof pin !== "string" || pin.length === 0) return false;
  if (pin.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(pin), Buffer.from(expected));
  } catch {
    return false;
  }
}
