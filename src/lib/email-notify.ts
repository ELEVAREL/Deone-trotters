// Fire-and-forget admin notifications. Never throws; failures are logged.
// We don't want a flaky email service to break the actual order flow.

import { getResend, isResendConfigured, getResendFrom } from "./resend";
import {
  buildAdminNotificationEmail,
  type AdminEventKind,
  type AdminNotificationParams,
} from "./email-templates";
import { getBaseUrl } from "./format";

const FALLBACK_ADMINS = [
  "jiggetnr@rickover.navy.mil",
  "flavornews@gmail.com",
  "itsnyriian@gmail.com",
];

export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_NOTIFY_EMAILS;
  if (!env) return FALLBACK_ADMINS;
  const list = env
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  return list.length > 0 ? list : FALLBACK_ADMINS;
}

export async function notifyAdmins(
  kind: AdminEventKind,
  order: AdminNotificationParams["order"]
): Promise<void> {
  if (!isResendConfigured()) {
    console.log(`[notifyAdmins] skipped ${kind} — RESEND_API_KEY not set`);
    return;
  }
  const recipients = getAdminEmails();
  if (recipients.length === 0) {
    console.log(`[notifyAdmins] skipped ${kind} — no admin recipients`);
    return;
  }

  try {
    const { subject, html, text } = buildAdminNotificationEmail({
      kind,
      order,
      baseUrl: getBaseUrl(),
    });
    const resend = getResend();
    const result = await resend.emails.send({
      from: getResendFrom(),
      to: recipients,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error(`[notifyAdmins] ${kind} send error`, result.error);
    } else {
      console.log(`[notifyAdmins] ${kind} sent to ${recipients.length} admin(s)`);
    }
  } catch (err) {
    console.error(`[notifyAdmins] ${kind} failed`, err);
  }
}
