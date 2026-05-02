// Branded HTML email templates for Deone's Gourmet Trotters.
//
// Constraints we design around:
// - All styles inline (most clients strip <style>).
// - Tables for layout (still required for Outlook).
// - System-font stack only — Fraunces won't render in Gmail / Outlook /
//   Apple Mail; we approximate with Georgia for headings.
// - Solid hex colors only. Some clients drop CSS variables and complex
//   gradients. Background-color works everywhere; we add a tasteful
//   gradient via a tiny SVG fallback.
// - Safe widths: 600px max, scales down on mobile via media queries
//   that we DO inline as a single <style> tag inside <head>.
// - Plain-text fallbacks always included for accessibility + spam score.

import type { CartLine, OrderRow } from "./types";

const COLORS = {
  bg: "#0a0806",
  paper: "#1a1510",
  warm: "#14100a",
  ink: "#f4e7c0",
  inkSoft: "#c9b88a",
  inkMute: "#8a7a5a",
  line: "#2e2618",
  rust: "#d4af37",
  rustDeep: "#b8902a",
  gold: "#e9c75c",
  goldSoft: "#f5dc8a",
  cream: "#241a0e",
  olive: "#5fa850",
  oliveDeep: "#427a35",
} as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Reusable building blocks ---------------------------------------------------

function head(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(title)}</title>
  <style>
    @media (max-width: 620px) {
      .container { width: 100% !important; }
      .px-32 { padding-left: 22px !important; padding-right: 22px !important; }
      .py-32 { padding-top: 22px !important; padding-bottom: 22px !important; }
      .h-display { font-size: 28px !important; line-height: 32px !important; }
      .total { font-size: 28px !important; }
      .btn { padding: 14px 22px !important; font-size: 15px !important; }
    }
    a { color: ${COLORS.gold}; }
    body { margin: 0; padding: 0; background: ${COLORS.bg}; }
  </style>
</head>`;
}

function header(): string {
  // Brand mark: dark plate, gold rim, serif "D"
  // Inline SVG keeps it crisp without external assets.
  return `<tr>
    <td align="center" style="padding: 36px 32px 24px; border-bottom: 1px solid ${COLORS.line}; background: ${COLORS.paper};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <div style="display:inline-block; width: 56px; height: 56px; background: ${COLORS.rust}; border-radius: 999px; line-height: 56px; font-family: Georgia, 'Times New Roman', serif; font-weight: 900; font-size: 28px; color: ${COLORS.bg}; box-shadow: 0 0 0 2px ${COLORS.rustDeep};">D</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 14px;">
            <div style="font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-style: italic; font-size: 22px; color: ${COLORS.ink}; letter-spacing: -0.01em;">Deone's Gourmet Trotters</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 6px;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${COLORS.inkMute}; letter-spacing: 0.28em; text-transform: uppercase;">Slow food &middot; served loud</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function footer(orderId?: string): string {
  return `<tr>
    <td align="center" class="px-32" style="padding: 22px 32px; border-top: 1px solid ${COLORS.line}; background: ${COLORS.paper};">
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${COLORS.inkMute}; letter-spacing: 0.16em; text-transform: uppercase;">
        ${orderId ? `Order #${escapeHtml(orderId.slice(0, 8))} &middot; ` : ""}deones-gourmet-trotters.vercel.app
      </div>
      <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 12px; color: ${COLORS.inkMute}; margin-top: 8px;">
        Three generations of recipes. Cast iron. Six hours.
      </div>
    </td>
  </tr>`;
}

function shell(opts: { title: string; orderId?: string; body: string }): string {
  return `${head(opts.title)}
<body style="margin:0; padding:0; background: ${COLORS.bg};">
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${escapeHtml(opts.title)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${COLORS.bg};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 100%; background: ${COLORS.paper}; border: 1px solid ${COLORS.line}; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 60px -24px rgba(0,0,0,0.6);">
          ${header()}
          ${opts.body}
          ${footer(opts.orderId)}
        </table>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: ${COLORS.inkMute}; margin-top: 14px; letter-spacing: 0.12em;">
          You're receiving this because you placed an order or are listed as staff.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function pillTag(label: string, color: string, bg: string): string {
  return `<span style="display: inline-block; padding: 5px 12px; background: ${bg}; color: ${color}; border-radius: 999px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;">${escapeHtml(label)}</span>`;
}

function itemsTable(items: CartLine[]): string {
  const rows = items
    .map(
      (l) => `<tr>
        <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.line}; vertical-align: top;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 600; font-size: 15px; color: ${COLORS.ink};">${escapeHtml(l.name)}</div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: ${COLORS.inkMute}; margin-top: 2px;">${l.qty} &times; ${formatUsd(l.priceCents)}</div>
        </td>
        <td align="right" style="padding: 12px 0; border-bottom: 1px solid ${COLORS.line}; vertical-align: top; font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 16px; color: ${COLORS.gold}; white-space: nowrap;">
          ${formatUsd(l.priceCents * l.qty)}
        </td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`;
}

function totalLine(amountCents: number): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 14px;">
    <tr>
      <td style="padding-top: 14px; border-top: 1px solid ${COLORS.line};">
        <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: ${COLORS.inkMute}; letter-spacing: 0.22em; text-transform: uppercase;">Total</span>
      </td>
      <td align="right" style="padding-top: 14px; border-top: 1px solid ${COLORS.line};">
        <span class="total" style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 700; font-size: 32px; color: ${COLORS.gold}; line-height: 1; letter-spacing: -0.01em;">${formatUsd(amountCents)}</span>
      </td>
    </tr>
  </table>`;
}

function goldButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
    <tr>
      <td align="center" bgcolor="${COLORS.rust}" style="border-radius: 999px; background: ${COLORS.rust}; mso-padding-alt: 16px 32px;">
        <a class="btn" href="${escapeHtml(href)}" target="_blank" rel="noopener" style="display: inline-block; padding: 16px 32px; background: ${COLORS.rust}; color: ${COLORS.bg} !important; text-decoration: none; border-radius: 999px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: 0.01em; box-shadow: inset 0 1px 0 rgba(255,240,200,0.4), 0 8px 22px -10px rgba(212,175,55,0.5);">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function detailGrid(
  rows: Array<{ label: string; value: string; mono?: boolean }>
): string {
  const cells = rows
    .map(
      (r) => `<tr>
        <td style="padding: 8px 0; vertical-align: top; width: 120px;">
          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; color: ${COLORS.inkMute}; letter-spacing: 0.22em; text-transform: uppercase;">${escapeHtml(r.label)}</span>
        </td>
        <td style="padding: 8px 0; vertical-align: top; font-family: ${r.mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}; font-size: 14px; color: ${COLORS.ink};">
          ${escapeHtml(r.value)}
        </td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table>`;
}

// =====================================================================
// 1. Customer invoice email — sent when grandma uses Send Invoice.
// =====================================================================

export type CustomerInvoiceParams = {
  order: Pick<OrderRow, "id" | "amount_cents" | "items" | "customer_name" | "pickup_at" | "notes">;
  payUrl: string;
};

export function buildCustomerInvoiceEmail(p: CustomerInvoiceParams): {
  subject: string;
  html: string;
  text: string;
} {
  const total = formatUsd(p.order.amount_cents);
  const name = p.order.customer_name?.trim() || "there";
  const pickup = p.order.pickup_at ? formatDateTime(p.order.pickup_at) : null;
  const items = p.order.items as CartLine[];

  const subject = `Your invoice from Deone's Gourmet Trotters · ${total}`;

  const body = `<tr>
    <td class="px-32 py-32" style="padding: 36px 40px;">
      <div style="text-align: center; margin-bottom: 24px;">
        ${pillTag("Invoice", COLORS.gold, COLORS.cream)}
      </div>
      <h1 class="h-display" style="margin: 0; text-align: center; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 700; font-size: 36px; line-height: 38px; color: ${COLORS.ink}; letter-spacing: -0.02em;">
        Hi ${escapeHtml(name)}.
      </h1>
      <p style="margin: 14px 0 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.55; color: ${COLORS.inkSoft};">
        Your invoice from Deone is ready.<br>
        Tap below to pay &mdash; on our site, no redirect.
      </p>

      <div style="height: 28px; line-height: 28px;">&nbsp;</div>

      ${itemsTable(items)}
      ${totalLine(p.order.amount_cents)}

      ${
        pickup
          ? `<div style="margin-top: 22px; padding: 14px 16px; background: ${COLORS.cream}; border: 1px solid ${COLORS.rustDeep}; border-radius: 12px;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; color: ${COLORS.gold}; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700;">Pickup</div>
              <div style="font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 18px; color: ${COLORS.ink}; margin-top: 4px;">${escapeHtml(pickup)}</div>
            </div>`
          : ""
      }

      ${
        p.order.notes
          ? `<div style="margin-top: 14px; padding: 12px 14px; background: ${COLORS.warm}; border: 1px solid ${COLORS.line}; border-radius: 10px;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; color: ${COLORS.inkMute}; letter-spacing: 0.22em; text-transform: uppercase;">Note</div>
              <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 14px; color: ${COLORS.inkSoft}; margin-top: 4px;">&ldquo;${escapeHtml(p.order.notes)}&rdquo;</div>
            </div>`
          : ""
      }

      <div style="height: 32px; line-height: 32px;">&nbsp;</div>

      ${goldButton(p.payUrl, `Pay ${total}`)}

      <p style="margin: 22px 0 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: ${COLORS.inkMute}; line-height: 1.55;">
        Or paste this link into your browser:<br>
        <span style="color: ${COLORS.inkSoft}; word-break: break-all;">${escapeHtml(p.payUrl)}</span>
      </p>

      <p style="margin: 18px 0 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: ${COLORS.inkMute};">
        Secured by Stripe &middot; Card details never touch our server.
      </p>
    </td>
  </tr>`;

  const html = shell({ title: subject, orderId: p.order.id, body });

  const text = [
    `Hi ${name},`,
    ``,
    `Your invoice from Deone's Gourmet Trotters.`,
    ``,
    ...items.map(
      (l) =>
        `${l.qty} × ${l.name} — ${formatUsd(l.priceCents * l.qty)}`
    ),
    ``,
    `Total: ${total}`,
    ...(pickup ? [`Pickup: ${pickup}`] : []),
    ...(p.order.notes ? [`Note: "${p.order.notes}"`] : []),
    ``,
    `Pay here: ${p.payUrl}`,
    ``,
    `Order #${p.order.id.slice(0, 8)}`,
  ].join("\n");

  return { subject, html, text };
}

// =====================================================================
// 2. Admin notification email — sent to staff on order events.
// =====================================================================

export type AdminEventKind = "new_preorder" | "invoice_sent" | "paid";

export type AdminNotificationParams = {
  kind: AdminEventKind;
  order: Pick<
    OrderRow,
    | "id"
    | "amount_cents"
    | "items"
    | "customer_name"
    | "customer_email"
    | "customer_phone"
    | "pickup_at"
    | "notes"
    | "order_type"
    | "status"
    | "paid_at"
    | "created_at"
  >;
  baseUrl: string;
};

export function buildAdminNotificationEmail(p: AdminNotificationParams): {
  subject: string;
  html: string;
  text: string;
} {
  const total = formatUsd(p.order.amount_cents);
  const items = p.order.items as CartLine[];
  const pickup = p.order.pickup_at ? formatDateTime(p.order.pickup_at) : null;
  const customer = p.order.customer_name?.trim() || "Walk-in";

  const variant: Record<
    AdminEventKind,
    {
      tag: string;
      tagColor: string;
      tagBg: string;
      headline: string;
      sub: string;
      ctaLabel: string;
      ctaPath: string;
      subjectPrefix: string;
    }
  > = {
    new_preorder: {
      tag: "New pre-order",
      tagColor: COLORS.bg,
      tagBg: COLORS.gold,
      headline: "Fresh ticket.",
      sub: `${customer} placed a pre-order online.`,
      ctaLabel: "View in pad",
      ctaPath: "/order",
      subjectPrefix: "📜 New pre-order",
    },
    invoice_sent: {
      tag: "Invoice sent",
      tagColor: COLORS.bg,
      tagBg: COLORS.goldSoft,
      headline: "Invoice out the door.",
      sub: `${customer} has been emailed a payment link.`,
      ctaLabel: "Open pay link",
      ctaPath: `/pay/${p.order.id}`,
      subjectPrefix: "✉️ Invoice sent",
    },
    paid: {
      tag: "Paid",
      tagColor: COLORS.bg,
      tagBg: COLORS.olive,
      headline: "Card cleared.",
      sub: `${customer}'s payment came through.`,
      ctaLabel: "View in pad",
      ctaPath: "/order",
      subjectPrefix: "✅ Paid",
    },
  };
  const v = variant[p.kind];

  const subject = `${v.subjectPrefix} · ${customer} · ${total}`;
  const ctaUrl = `${p.baseUrl}${v.ctaPath}`;

  const detailRows: Array<{ label: string; value: string; mono?: boolean }> = [];
  if (p.order.customer_name) detailRows.push({ label: "Name", value: p.order.customer_name });
  if (p.order.customer_phone) detailRows.push({ label: "Phone", value: p.order.customer_phone });
  if (p.order.customer_email) detailRows.push({ label: "Email", value: p.order.customer_email });
  if (pickup) detailRows.push({ label: "Pickup", value: pickup });
  if (p.order.paid_at) detailRows.push({ label: "Paid at", value: formatDateTime(p.order.paid_at) });
  detailRows.push({ label: "Created", value: formatDateTime(p.order.created_at) });
  detailRows.push({ label: "Order #", value: p.order.id.slice(0, 8), mono: true });

  const body = `<tr>
    <td class="px-32 py-32" style="padding: 36px 40px;">
      <div style="text-align: center; margin-bottom: 22px;">
        ${pillTag(v.tag, v.tagColor, v.tagBg)}
      </div>

      <h1 class="h-display" style="margin: 0; text-align: center; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 700; font-size: 32px; line-height: 36px; color: ${COLORS.ink}; letter-spacing: -0.02em;">
        ${escapeHtml(v.headline)}
      </h1>
      <p style="margin: 12px 0 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.55; color: ${COLORS.inkSoft};">
        ${escapeHtml(v.sub)}
      </p>

      <div style="height: 28px; line-height: 28px;">&nbsp;</div>

      <div style="padding: 18px 20px; background: ${COLORS.warm}; border: 1px solid ${COLORS.line}; border-radius: 12px;">
        ${itemsTable(items)}
        ${totalLine(p.order.amount_cents)}
      </div>

      <div style="height: 18px; line-height: 18px;">&nbsp;</div>

      <div style="padding: 16px 20px; background: ${COLORS.bg}; border: 1px solid ${COLORS.line}; border-radius: 12px;">
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: ${COLORS.gold}; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700; margin-bottom: 10px;">
          Customer
        </div>
        ${detailGrid(detailRows)}
        ${
          p.order.notes
            ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${COLORS.line};">
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; color: ${COLORS.inkMute}; letter-spacing: 0.22em; text-transform: uppercase;">Note</div>
                <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 14px; color: ${COLORS.inkSoft}; margin-top: 4px;">&ldquo;${escapeHtml(p.order.notes)}&rdquo;</div>
              </div>`
            : ""
        }
      </div>

      <div style="height: 28px; line-height: 28px;">&nbsp;</div>

      ${goldButton(ctaUrl, v.ctaLabel)}
    </td>
  </tr>`;

  const html = shell({ title: subject, orderId: p.order.id, body });

  const text = [
    v.subjectPrefix,
    "",
    v.headline,
    v.sub,
    "",
    "Items:",
    ...items.map((l) => `  ${l.qty} × ${l.name} — ${formatUsd(l.priceCents * l.qty)}`),
    "",
    `Total: ${total}`,
    "",
    "Customer:",
    ...detailRows.map((r) => `  ${r.label}: ${r.value}`),
    ...(p.order.notes ? ["", `Note: "${p.order.notes}"`] : []),
    "",
    `${v.ctaLabel}: ${ctaUrl}`,
  ].join("\n");

  return { subject, html, text };
}
