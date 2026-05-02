"use client";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { CartLine, OrderStatus } from "@/lib/types";

type Row = {
  id: string;
  status: OrderStatus;
  amount_cents: number;
  currency: string;
  items: CartLine[];
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  pickup_at: string | null;
  order_type: "in_person" | "preorder";
  created_at: string;
  paid_at: string | null;
};

type Filter = "all" | "pending" | "paid";

export function OrderHistory({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  async function load(f: Filter = filter) {
    setError(null);
    try {
      const res = await fetch(`/api/orders?status=${f}&limit=100`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Could not load orders");
      const data: Row[] = await res.json();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders");
    }
  }

  useEffect(() => { load(filter); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  // Auto-refresh every 12 seconds while the drawer is open so new pre-orders
  // and just-paid statuses bubble up without a manual refresh.
  useEffect(() => {
    const t = setInterval(() => load(filter), 12_000);
    return () => clearInterval(t);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [filter]);

  const totals = rows?.reduce(
    (acc, r) => {
      if (r.status === "paid") {
        acc.paidCount += 1;
        acc.paidAmount += r.amount_cents;
      } else if (r.status === "pending") {
        acc.pendingCount += 1;
        acc.pendingAmount += r.amount_cents;
      }
      return acc;
    },
    { paidCount: 0, paidAmount: 0, pendingCount: 0, pendingAmount: 0 }
  );

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <aside className="relative w-full sm:max-w-2xl bg-[color:var(--bg)] border-l border-[color:var(--line)] flex flex-col shadow-2xl fade-up">
        <header className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[color:var(--line)] bg-[color:var(--paper)]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--rust)] font-semibold">
              History
            </div>
            <h2 className="font-display text-2xl italic"><span className="gilt">The book</span></h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-full text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] hover:bg-[color:var(--bg-warm)]"
            aria-label="Close history"
          >
            ✕
          </button>
        </header>

        {totals && (
          <div className="grid grid-cols-2 gap-3 px-5 sm:px-7 py-4 border-b border-[color:var(--line)] bg-[color:var(--bg-warm)]">
            <Stat label="Paid" count={totals.paidCount} amount={totals.paidAmount} accent="olive" />
            <Stat label="Pending" count={totals.pendingCount} amount={totals.pendingAmount} accent="gold" />
          </div>
        )}

        <div className="flex gap-2 px-5 sm:px-7 py-3 border-b border-[color:var(--line)]">
          {(["all", "pending", "paid"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                filter === f
                  ? "bg-[color:var(--rust)] text-[color:var(--bg)] border border-[color:var(--rust-deep)]"
                  : "bg-[color:var(--paper)] text-[color:var(--ink-soft)] border border-[color:var(--line)] hover:border-[color:var(--rust-deep)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && (
          <div className="px-5 sm:px-7 pt-4">
            <p className="text-sm text-[color:var(--rust-deep)] bg-[color:var(--cream)] border border-[color:var(--rust-deep)] rounded-xl px-3 py-2">
              {error}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4">
          {rows === null ? (
            <p className="text-sm text-[color:var(--ink-mute)] py-12 text-center">Loading orders…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[color:var(--ink-mute)] py-12 text-center italic">
              Nothing in the book yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <OrderRow
                  key={r.id}
                  row={r}
                  open={openId === r.id}
                  onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function Stat({
  label,
  count,
  amount,
  accent,
}: {
  label: string;
  count: number;
  amount: number;
  accent: "olive" | "gold";
}) {
  const accentColor = accent === "olive" ? "var(--olive)" : "var(--gold)";
  return (
    <div className="card p-3 sm:p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">{label}</div>
      <div className="flex items-baseline justify-between gap-2 mt-1">
        <span className="font-display text-2xl font-bold" style={{ color: accentColor }}>
          {count}
        </span>
        <span className="font-display text-sm font-semibold text-[color:var(--ink)]">
          {formatPrice(amount)}
        </span>
      </div>
    </div>
  );
}

function OrderRow({
  row,
  open,
  onToggle,
}: {
  row: Row;
  open: boolean;
  onToggle: () => void;
}) {
  const items = row.items as CartLine[];
  const itemSummary = items.map((i) => `${i.qty}× ${i.name}`).join(", ");
  const isPaid = row.status === "paid";

  return (
    <li className={`card overflow-hidden ${isPaid ? "" : "ring-1 ring-[color:var(--rust-deep)]"}`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-[color:var(--bg-warm)]/50 transition"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={row.status} />
            {row.order_type === "preorder" && (
              <span className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--gold)] bg-[color:var(--cream)] border border-[color:var(--rust-deep)] px-2 py-0.5 rounded-full font-semibold">
                Pre-order
              </span>
            )}
            <span className="text-[10px] text-[color:var(--ink-mute)]">
              {timeAgo(row.created_at)}
            </span>
          </div>
          <div className="text-sm text-[color:var(--ink)] truncate">
            {row.customer_name ? (
              <span className="font-medium">{row.customer_name}</span>
            ) : (
              <span className="italic text-[color:var(--ink-mute)]">Walk-in</span>
            )}
            <span className="text-[color:var(--ink-mute)]"> · {itemSummary}</span>
          </div>
        </div>
        <div className="font-display text-lg font-bold text-[color:var(--gold)] shrink-0">
          {formatPrice(row.amount_cents, row.currency)}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[color:var(--line)] space-y-3 fade-up">
          <ul className="divide-y divide-[color:var(--line)]">
            {items.map((l, i) => (
              <li key={`${l.id}-${i}`} className="py-2 flex justify-between items-baseline text-sm">
                <span>
                  <span className="font-medium">{l.name}</span>{" "}
                  <span className="text-[color:var(--ink-mute)]">× {l.qty}</span>
                </span>
                <span className="font-display font-semibold">
                  {formatPrice(l.priceCents * l.qty)}
                </span>
              </li>
            ))}
          </ul>

          {row.notes && (
            <div className="p-2.5 rounded-lg bg-[color:var(--bg-warm)] border border-[color:var(--line)] text-sm">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">Note</div>
              <div className="text-[color:var(--ink-soft)] italic mt-0.5">&ldquo;{row.notes}&rdquo;</div>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-2 text-xs">
            {row.customer_phone && <Detail label="Phone" value={row.customer_phone} />}
            {row.customer_email && <Detail label="Email" value={row.customer_email} />}
            {row.pickup_at && (
              <Detail
                label="Pickup"
                value={new Date(row.pickup_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              />
            )}
            {row.paid_at && (
              <Detail
                label="Paid"
                value={new Date(row.paid_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              />
            )}
            <Detail label="Order #" value={row.id.slice(0, 8)} mono />
          </dl>

          {!isPaid && (
            <div className="flex gap-2">
              <a
                href={`/pay/${row.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost !py-2 !px-3 !text-xs flex-1"
              >
                Open pay link ↗
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/pay/${row.id}`);
                }}
                className="btn btn-ghost !py-2 !px-3 !text-xs flex-1"
              >
                Copy link
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const map = {
    paid: { label: "Paid", bg: "var(--olive)", color: "var(--bg)" },
    pending: { label: "Pending", bg: "var(--rust-deep)", color: "var(--bg)" },
    cancelled: { label: "Cancelled", bg: "var(--ink-mute)", color: "var(--bg)" },
    expired: { label: "Expired", bg: "var(--ink-mute)", color: "var(--bg)" },
  } as const;
  const s = map[status];
  return (
    <span
      className="text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 rounded-full font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">{label}</dt>
      <dd className={`text-[color:var(--ink)] ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
