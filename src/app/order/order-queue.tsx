"use client";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/types";

type LiveOrder = {
  id: string;
  status: "paid";
  amount_cents: number;
  currency: string;
  items: CartLine[];
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  pickup_at: string | null;
  order_type: "in_person" | "preorder";
  paid_at: string | null;
  created_at: string;
  completed_at: string | null;
};

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatPickup(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderQueue({ onTakeOrder }: { onTakeOrder: () => void }) {
  const [orders, setOrders] = useState<LiveOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/orders?status=live", { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not load orders");
      }
      const data: LiveOrder[] = await res.json();
      setOrders(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders");
    }
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function markComplete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}/complete`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not mark complete");
      }
      // Optimistically drop from list (the next poll would do it anyway).
      setOrders((prev) => (prev ? prev.filter((o) => o.id !== id) : prev));
      setOpenId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark complete");
    } finally {
      setBusyId(null);
    }
  }

  const liveCount = orders?.length ?? 0;

  return (
    <main className="min-h-screen flex flex-col">
      <div className="px-5 sm:px-8 py-5 border-b border-[color:var(--line)] bg-[color:var(--paper)]">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--rust)] font-semibold">
              Live orders
            </div>
            <h1 className="font-display text-3xl font-bold mt-1 italic">
              <span className="gilt">
                {liveCount === 0 ? "All caught up" : `${liveCount} on the line`}
              </span>
            </h1>
            <p className="text-xs text-[color:var(--ink-mute)] mt-1">
              Paid orders pending pick-up. Refreshes every 5 seconds.
            </p>
          </div>
          <button onClick={onTakeOrder} className="btn btn-primary">
            + Take new order
          </button>
        </div>
      </div>

      {error && (
        <div className="px-5 sm:px-8 pt-4">
          <p className="text-sm text-[color:var(--rust-deep)] bg-[color:var(--cream)] border border-[color:var(--rust-deep)] rounded-xl px-3 py-2">
            {error}
          </p>
        </div>
      )}

      <div className="flex-1 px-5 sm:px-8 py-6 space-y-3">
        {orders === null ? (
          <p className="text-sm text-[color:var(--ink-mute)] py-12 text-center">Loading…</p>
        ) : orders.length === 0 ? (
          <EmptyQueue onTakeOrder={onTakeOrder} />
        ) : (
          orders.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              open={openId === o.id}
              onToggle={() => setOpenId((p) => (p === o.id ? null : o.id))}
              onComplete={() => markComplete(o.id)}
              busy={busyId === o.id}
            />
          ))
        )}
      </div>
    </main>
  );
}

function EmptyQueue({ onTakeOrder }: { onTakeOrder: () => void }) {
  return (
    <div className="text-center py-20 fade-up">
      <div className="text-5xl mb-3">🍽</div>
      <h2 className="font-display text-2xl italic">
        <span className="gilt">Quiet kitchen.</span>
      </h2>
      <p className="text-[color:var(--ink-mute)] text-sm mt-2 max-w-xs mx-auto">
        No live orders right now. New paid orders land here automatically.
      </p>
      <button onClick={onTakeOrder} className="btn btn-ghost mt-6">
        + Take a walk-in order
      </button>
    </div>
  );
}

function OrderRow({
  order,
  open,
  onToggle,
  onComplete,
  busy,
}: {
  order: LiveOrder;
  open: boolean;
  onToggle: () => void;
  onComplete: () => void;
  busy: boolean;
}) {
  const itemsLine = order.items
    .map((l) => `${l.qty}× ${l.name.replace("Trotter Split", "Trotter").replace(" Split", "")}`)
    .join(" · ");
  const pickup = formatPickup(order.pickup_at);
  const isPreorder = order.order_type === "preorder";

  return (
    <article className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 sm:px-5 py-4 flex items-center gap-4 hover:bg-[color:var(--bg-warm)] transition"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-lg leading-tight">
              {order.customer_name ?? "Walk-in"}
            </span>
            {isPreorder && (
              <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-[color:var(--cream)] text-[color:var(--gold)] border border-[color:var(--rust-deep)]">
                Pre-order
              </span>
            )}
            {pickup && (
              <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-[color:var(--olive)]/15 text-[color:var(--olive)] border border-[color:var(--olive)]">
                Pickup {pickup}
              </span>
            )}
          </div>
          <p className="text-sm text-[color:var(--ink-mute)] mt-1 truncate">
            {itemsLine}
          </p>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-mute)] mt-1.5">
            Paid {formatRelative(order.paid_at)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-bold text-[color:var(--gold)]">
            {formatPrice(order.amount_cents)}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-5 py-4 border-t border-[color:var(--line)] bg-[color:var(--bg-warm)] fade-up">
          {/* Items */}
          <ul className="divide-y divide-[color:var(--line)] mb-4">
            {order.items.map((l, i) => (
              <li
                key={`${l.id}-${i}`}
                className="py-2 flex items-baseline justify-between gap-3"
              >
                <span className="text-sm">
                  <span className="font-display font-bold text-[color:var(--gold)] mr-2">
                    {l.qty}×
                  </span>
                  {l.name}
                </span>
                <span className="text-sm text-[color:var(--ink-mute)] whitespace-nowrap">
                  {formatPrice(l.priceCents * l.qty)}
                </span>
              </li>
            ))}
          </ul>

          {/* Customer details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
            {order.customer_phone && (
              <DetailItem label="Phone">
                <a href={`tel:${order.customer_phone}`} className="text-[color:var(--gold)] underline-offset-4 hover:underline">
                  {order.customer_phone}
                </a>
              </DetailItem>
            )}
            {order.customer_email && (
              <DetailItem label="Email">
                <span className="break-all">{order.customer_email}</span>
              </DetailItem>
            )}
            {pickup && <DetailItem label="Pickup">{pickup}</DetailItem>}
            <DetailItem label="Order #">
              <span className="font-mono text-xs">{order.id.slice(0, 8)}</span>
            </DetailItem>
          </div>

          {order.notes && (
            <div className="mb-4 p-3 rounded-xl bg-[color:var(--cream)] border border-[color:var(--rust-deep)]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--gold)] font-semibold">
                Kitchen note
              </div>
              <div className="font-display italic text-[color:var(--ink-soft)] mt-1">
                &ldquo;{order.notes}&rdquo;
              </div>
            </div>
          )}

          <button
            onClick={onComplete}
            disabled={busy}
            className="btn w-full !py-3.5 !text-base disabled:opacity-50 disabled:cursor-wait"
            style={{
              background: busy ? "var(--bg-warm)" : "var(--olive)",
              color: busy ? "var(--ink-mute)" : "var(--bg)",
            }}
          >
            {busy ? "Marking complete…" : "✓ Mark order complete"}
          </button>
        </div>
      )}
    </article>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--ink-mute)] font-semibold">
        {label}
      </div>
      <div className="text-[color:var(--ink)] mt-0.5">{children}</div>
    </div>
  );
}
