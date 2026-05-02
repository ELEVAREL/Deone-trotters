"use client";
import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type Cart = Record<string, number>;

const CATEGORY_LABEL: Record<MenuItem["category"], string> = {
  mains: "Splits",
  sides: "Sides",
  drinks: "Drinks",
  desserts: "Desserts",
};

export function InvoiceModal({
  menu,
  initialCart,
  initialNotes,
  onClose,
  onSent,
}: {
  menu: MenuItem[];
  initialCart?: Cart;
  initialNotes?: string;
  onClose: () => void;
  onSent: (info: { id: string; payUrl: string; amountCents: number; email: string }) => void;
}) {
  const [cart, setCart] = useState<Cart>(initialCart ?? {});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupSlot, setPickupSlot] = useState<string>("asap");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = menu
    .filter((m) => cart[m.id] && cart[m.id] > 0)
    .map((m) => ({ ...m, qty: cart[m.id] }));
  const total = lines.reduce((s, l) => s + l.priceCents * l.qty, 0);

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

  function pickupSlots(): Array<{ value: string; label: string }> {
    const slots: Array<{ value: string; label: string }> = [
      { value: "asap", label: "When ready" },
      { value: "later", label: "Pick a time" },
    ];
    return slots;
  }

  const [pickedTime, setPickedTime] = useState<string>("");

  function pickupAtIso(): string | null {
    if (pickupSlot === "asap") return null;
    if (pickupSlot === "later" && pickedTime) {
      return new Date(pickedTime).toISOString();
    }
    return null;
  }

  async function send() {
    if (lines.length === 0) {
      setError("Cart is empty.");
      return;
    }
    if (!name.trim()) {
      setError("Customer name needed.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Valid email needed — that's where the payment link goes.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          pickupAt: pickupAtIso() ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send invoice");
      onSent({ id: data.id, payUrl: data.payUrl, amountCents: data.amountCents, email: email.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl card p-5 sm:p-7 fade-up my-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--rust)] font-semibold">
              Phone order
            </div>
            <h3 className="font-display text-2xl italic mt-1"><span className="gilt">Send invoice</span></h3>
            <p className="text-xs text-[color:var(--ink-mute)] mt-1">
              Email goes out the second you tap Send. They pay on our site, you see ✓ in History.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-full text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] hover:bg-[color:var(--bg-warm)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Cart side */}
          <div>
            <Heading>Their order</Heading>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 -mr-1">
              {(Object.keys(CATEGORY_LABEL) as MenuItem["category"][]).map((cat) => {
                const items = menu.filter((m) => m.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)] mt-3 mb-1.5">
                      {CATEGORY_LABEL[cat]}
                    </div>
                    {items.map((item) => {
                      const qty = cart[item.id] ?? 0;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg transition ${
                            qty > 0 ? "bg-[color:var(--cream)]" : "hover:bg-[color:var(--bg-warm)]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{item.name}</div>
                            <div className="text-[11px] text-[color:var(--ink-mute)]">
                              {formatPrice(item.priceCents)}
                            </div>
                          </div>
                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => sub(item.id)}
                                className="w-7 h-7 rounded-full bg-[color:var(--bg-warm)] border border-[color:var(--line)] grid place-items-center text-base leading-none"
                              >
                                −
                              </button>
                              <span className="font-display font-bold text-sm w-5 text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => add(item.id)}
                                className="w-7 h-7 rounded-full bg-[color:var(--rust)] text-[color:var(--bg)] grid place-items-center text-base leading-none"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => add(item.id)}
                              className="text-xs uppercase tracking-wider text-[color:var(--gold)] hover:text-[color:var(--gold-soft)] px-2"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[color:var(--line)] flex items-baseline justify-between">
              <span className="text-xs text-[color:var(--ink-mute)] uppercase tracking-wider">
                Total
              </span>
              <span className="font-display text-2xl font-bold gilt italic">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Customer side */}
          <div className="space-y-3">
            <Heading>Customer</Heading>
            <Field label="Name">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoFocus
                placeholder="Maya Williams"
              />
            </Field>
            <Field label="Email (link goes here)">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </Field>
            <Field label="Pickup">
              <select
                className="input"
                value={pickupSlot}
                onChange={(e) => setPickupSlot(e.target.value)}
              >
                {pickupSlots().map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            {pickupSlot === "later" && (
              <Field label="Pickup time">
                <input
                  type="datetime-local"
                  className="input"
                  value={pickedTime}
                  onChange={(e) => setPickedTime(e.target.value)}
                />
              </Field>
            )}
            <Field label="Note for the kitchen (optional)">
              <textarea
                className="input resize-none text-sm"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </Field>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-[color:var(--rust-deep)] bg-[color:var(--cream)] border border-[color:var(--rust-deep)] rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={send}
            disabled={submitting || lines.length === 0}
            className="btn btn-primary flex-1 !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending…" : `Send invoice · ${formatPrice(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--rust)] font-semibold mb-2">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

export function InvoiceSentToast({
  email,
  payUrl,
  onClose,
}: {
  email: string;
  payUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div className="relative card p-7 max-w-md w-full text-center fade-up">
        <div className="w-14 h-14 rounded-full bg-[color:var(--olive)] text-[color:var(--bg)] grid place-items-center mx-auto mb-3 text-2xl font-bold glow-paid">
          ✓
        </div>
        <h3 className="font-display text-2xl italic"><span className="gilt">Invoice sent</span></h3>
        <p className="text-sm text-[color:var(--ink-mute)] mt-2">
          Payment link is on its way to <span className="text-[color:var(--ink)] font-medium">{email}</span>.
        </p>
        <div className="mt-4 p-2.5 rounded-lg bg-[color:var(--bg-warm)] border border-[color:var(--line)] text-xs text-[color:var(--ink-soft)] break-all">
          {payUrl}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(payUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="btn btn-ghost flex-1 !py-2 !text-sm"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <button onClick={onClose} className="btn btn-primary flex-1 !py-2 !text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
