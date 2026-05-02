import { Resend } from "resend";

let cached: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Resend not configured. Set RESEND_API_KEY.");
  }
  cached = new Resend(key);
  return cached;
}

// "From" address. Defaults to onboarding@resend.dev (works without domain
// verification but routes through Resend's shared domain — fine for testing).
// Set RESEND_FROM in env to your verified domain when ready, e.g.:
//   "Deone's Gourmet Trotters <orders@deones.example>"
export function getResendFrom(): string {
  return (
    process.env.RESEND_FROM ??
    "Deone's Gourmet Trotters <onboarding@resend.dev>"
  );
}
