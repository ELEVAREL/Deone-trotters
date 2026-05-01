"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import type { MenuItem, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { BUSINESS } from "@/lib/menu";

type Cart = Record<string, number>;

const CATEGORY_LABEL: Record<MenuItem["category"], string> = {
  mains: "Mains",
  sides: "Sides",
  drinks: "Drinks",
  desserts: "Desserts",
};

export function OrderPad({ menu }: { menu: MenuItem[] }) {
  const [cart, setCart] = useState<Cart>({});
  const [notes, setNotes] = useState("");
  const [activeCat, setActiveCat] = useState<MenuItem["category"]>("mains");
  const [view, setView] = useState<"build" | "qr">("build");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const lines = useMemo(
    () =>
      menu
        .filter((m) => cart[m.id] && cart[m.id] > 0)
        .map((m) => ({ ...m, qty: cart[m.id] })),
    [menu, cart]
  );
  const total = useMemo(
    () => lines.reduce((s, l) => s + l.priceCents * l.qty, 0),
    [lines]
  );
  const itemCount = useMemo(
    () => Object.values(cart).reduce((s, q) => s + q, 0),
    [cart]
  );

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }
  function sub(id: string) {
    setCart((c) => {
      const next = { ...c };
      const v = (next[id] ?? 0) - 1;
      if (v <= 0) delete next[id];
      else next[id] = v;
      return next;
    });
  }
  function clear() {
    setCart({});
    setNotes("");
  }

  async function generateQR() {
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      const url = `${window.location.origin}/pay/${data.id}`;
      const qr = await QRCode.toDataURL(url, {
        margin: 1,
        width: 720,
        color: { dark: "#1c1410", light: "#fffaf2" },
      });
      setOrderId(data.id);
      setPayUrl(url);
      setQrDataUrl(qr);
      setStatus("pending");
      setView("qr");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate QR");
    } finally {
      setSubmitting(false);
    }
  }

  // Poll for paid status while QR is showing.
  useEffect(() => {
    if (view !== "qr" || !orderId || status === "paid") return;
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.status && data.status !== status) {
          setStatus(data.status as OrderStatus);
        }
      } catch {
        /* network blip — keep polling */
      }
    }
    tick();
    pollRef.current = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [view, orderId, status]);

  function newOrder() {
    setCart({});
    setNotes("");
    setOrderId(null);
    setPayUrl(null);
    setQrDataUrl(null);
    setStatus("pending");
    setView("build");
  }

  if (view === "qr" && qrDataUrl && payUrl) {
    return (
      <QRView
        qr={qrDataUrl}
        payUrl={payUrl}
        total={total}
        status={status}
        onNew={newOrder}
        onBack={() => setView("build")}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-[color:var(--line)] flex items-center justify-between gap-3 bg-[color:var(--paper)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[color:var(--rust)] grid place-items-center text-[color:var(--paper)] font-display font-bold">
            D
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold">{BUSINESS.name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">
              Order pad
            </div>
          </div>
        </Link>
        <button
          onClick={clear}
          disabled={itemCount === 0}
          className="btn btn-ghost !py-2 !px-3 !text-xs disabled:opacity-40"
        >
          Clear
        </button>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-0">
        {/* Menu pad */}
        <section className="px-5 sm:px-8 py-6 lg:overflow-y-auto pb-32 lg:pb-6">
          <div className="flex gap-2 flex-wrap mb-5 sticky top-0 bg-[color:var(--bg)] py-2 -mx-2 px-2 z-10">
            {(Object.keys(CATEGORY_LABEL) as MenuItem["category"][]).map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${
                  activeCat === c
                    ? "bg-[color:var(--rust)] text-[color:var(--bg)] border-[color:var(--rust-deep)]"
                    : "bg-[color:var(--paper)] text-[color:var(--ink-soft)] border-[color:var(--line)] hover:border-[color:var(--rust-deep)]"
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {menu
              .filter((m) => m.category === activeCat)
              .map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <article
                    key={item.id}
                    className={`card p-4 transition flex flex-col gap-3 ${
                      qty > 0 ? "ring-2 ring-[color:var(--rust)]" : ""
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="font-display text-base font-semibold leading-tight">
                          {item.name}
                        </div>
                        <p className="text-xs text-[color:var(--ink-mute)] mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <div className="font-display text-[color:var(--rust)] font-bold whitespace-nowrap">
                        {formatPrice(item.priceCents)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {qty > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => sub(item.id)}
                            className="w-9 h-9 rounded-full bg-[color:var(--bg-warm)] border border-[color:var(--line)] grid place-items-center text-lg leading-none hover:bg-[color:var(--cream)]"
                            aria-label={`Remove one ${item.name}`}
                          >
                            −
                          </button>
                          <span className="font-display font-bold text-lg w-8 text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() => add(item.id)}
                            className="w-9 h-9 rounded-full bg-[color:var(--rust)] text-[color:var(--paper)] grid place-items-center text-lg leading-none hover:bg-[color:var(--rust-deep)]"
                            aria-label={`Add another ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => add(item.id)}
                          className="btn btn-ghost !py-2 !px-3 !text-sm"
                        >
                          + Add
                        </button>
                      )}
                      {qty > 0 && (
                        <span className="text-xs text-[color:var(--ink-mute)]">
                          {formatPrice(item.priceCents * qty)}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        {/* Cart sidebar */}
        <aside id="cart" className="border-t lg:border-t-0 lg:border-l border-[color:var(--line)] bg-[color:var(--paper)] flex flex-col scroll-mt-4">
          <div className="px-5 py-4 border-b border-[color:var(--line)]">
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">
              Order
            </div>
            <div className="font-display text-2xl font-bold mt-0.5">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {lines.length === 0 ? (
              <div className="text-sm text-[color:var(--ink-mute)] text-center py-12">
                Tap items on the left to start the ticket.
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--line)]">
                {lines.map((l) => (
                  <li key={l.id} className="py-3 flex justify-between gap-3 items-center">
                    <div>
                      <div className="font-medium text-sm leading-tight">{l.name}</div>
                      <div className="text-xs text-[color:var(--ink-mute)] mt-0.5">
                        {l.qty} × {formatPrice(l.priceCents)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => sub(l.id)}
                        className="w-7 h-7 rounded-full border border-[color:var(--line)] grid place-items-center"
                        aria-label="Remove"
                      >
                        −
                      </button>
                      <span className="font-display font-semibold text-sm">
                        {formatPrice(l.priceCents * l.qty)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-[color:var(--line)] px-5 py-4 space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for the kitchen (allergies, sub a side…)"
              rows={2}
              className="input resize-none text-sm"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-[color:var(--ink-mute)] text-sm">Total</span>
              <span className="font-display text-3xl font-bold">
                {formatPrice(total)}
              </span>
            </div>
            {error && <p className="text-sm text-[color:var(--rust-deep)]">{error}</p>}
            <button
              onClick={generateQR}
              disabled={lines.length === 0 || submitting}
              className="btn btn-primary w-full !py-4 !text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Generating…" : "Generate QR to pay"}
            </button>
            <p className="text-xs text-[color:var(--ink-mute)] text-center">
              Customer scans, pays on their phone, you see ✓ here.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA — keeps cart one tap away */}
      {itemCount > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--line)] bg-[color:var(--paper)]/95 backdrop-blur px-4 py-3 fade-up">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">
                {itemCount} {itemCount === 1 ? "item" : "items"} · ready to ring up
              </div>
              <div className="font-display text-xl font-bold leading-tight truncate">
                {formatPrice(total)}
              </div>
            </div>
            <button
              onClick={() => {
                document.getElementById("cart")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="btn btn-primary !py-3 !px-5 !text-sm shrink-0"
            >
              Review & QR →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function QRView({
  qr,
  payUrl,
  total,
  status,
  onNew,
  onBack,
}: {
  qr: string;
  payUrl: string;
  total: number;
  status: OrderStatus;
  onNew: () => void;
  onBack: () => void;
}) {
  const paid = status === "paid";
  return (
    <main className="min-h-screen grid place-items-center px-5 py-10 bg-[color:var(--bg)] relative overflow-hidden">
      {/* Ambient gold mist */}
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.18)_0%,transparent_60%)]" />
      </div>

      <div className="relative w-full max-w-md card p-6 sm:p-9 fade-up">
        {/* Top corner gold accents */}
        <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[color:var(--rust)] rounded-tl" />
        <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[color:var(--rust)] rounded-tr" />
        <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[color:var(--rust)] rounded-bl" />
        <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[color:var(--rust)] rounded-br" />

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-sm text-[color:var(--ink-mute)] hover:text-[color:var(--gold)] transition gold-underline"
          >
            ← Edit
          </button>
          <span
            className={`chip ${
              paid
                ? "!bg-[color:var(--olive)] !text-[color:var(--bg)] !border-[color:var(--olive)]"
                : ""
            }`}
          >
            {paid ? "Paid ✓" : "● Awaiting"}
          </span>
        </div>

        <div className="text-center mb-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--rust)] font-semibold">
            Total Due
          </div>
          <div className="font-display text-6xl font-bold mt-2 gilt italic leading-none">
            {formatPrice(total)}
          </div>
        </div>

        <div
          className={`relative aspect-square rounded-[var(--radius)] grid place-items-center bg-[color:var(--paper)] border-2 border-[color:var(--rust)] overflow-hidden transition ${
            paid ? "glow-paid" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Scan to pay" className="w-full h-full object-contain p-3" />
          {paid && (
            <div className="absolute inset-0 grid place-items-center bg-[color:var(--olive)]/95 text-[color:var(--ink)] fade-up">
              <div className="text-center">
                <div className="text-8xl font-bold leading-none">✓</div>
                <div className="font-display text-4xl italic mt-3">Paid.</div>
                <div className="text-sm opacity-90 mt-2">Card cleared. Plate it up.</div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-[color:var(--ink-mute)] mt-6 leading-relaxed">
          {paid
            ? "Receipt is in their inbox. Hit new order below."
            : "Hand the screen across. Camera app. Scan. Done."}
        </p>

        <div className="flex flex-col gap-3 mt-6">
          <button onClick={onNew} className="btn btn-primary w-full !py-4">
            {paid ? "New order →" : "Cancel & new order"}
          </button>
          <a
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-xs text-[color:var(--ink-mute)] hover:text-[color:var(--gold)] transition tracking-wide"
          >
            Open pay link manually ↗
          </a>
        </div>
      </div>
    </main>
  );
}
