"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { BUSINESS } from "@/lib/menu";

type Cart = Record<string, number>;

const CATEGORY_LABEL: Record<MenuItem["category"], string> = {
  mains: "Splits",
  sides: "Sides",
  drinks: "Drinks",
  desserts: "Desserts",
};

const CATEGORY_ORDER: MenuItem["category"][] = ["mains", "sides", "drinks", "desserts"];

export function PreorderClient({ menu }: { menu: MenuItem[] }) {
  const [cart, setCart] = useState<Cart>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupSlot, setPickupSlot] = useState<string>("asap");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"build" | "details">("build");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function pickupSlots(): Array<{ value: string; label: string }> {
    const slots: Array<{ value: string; label: string }> = [
      { value: "asap", label: "As soon as possible (≈ 30 min)" },
    ];
    const now = new Date();
    // Next 8 half-hour slots, starting 30 min from now, rounded up.
    const start = new Date(now.getTime() + 30 * 60_000);
    start.setSeconds(0, 0);
    const minutes = start.getMinutes();
    if (minutes > 30) start.setHours(start.getHours() + 1, 0);
    else if (minutes > 0) start.setMinutes(30);
    for (let i = 0; i < 8; i++) {
      const t = new Date(start.getTime() + i * 30 * 60_000);
      const value = t.toISOString();
      const label = t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      slots.push({ value, label });
    }
    return slots;
  }

  function pickupAtIso(): string | null {
    if (pickupSlot === "asap") {
      return new Date(Date.now() + 30 * 60_000).toISOString();
    }
    return pickupSlot;
  }

  async function submit() {
    if (lines.length === 0) {
      setError("Add at least one item.");
      return;
    }
    if (!name.trim()) {
      setError("We need your name for the bag.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Valid phone, please — we text when it's ready.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          notes: notes.trim() || undefined,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
          pickupAt: pickupAtIso(),
          orderType: "preorder",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order");
      window.location.href = `/pay/${data.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-[color:var(--line)] flex items-center justify-between gap-3 bg-[color:var(--paper)]/85 backdrop-blur sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[color:var(--rust)] grid place-items-center text-[color:var(--bg)] font-display font-bold">
            D
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold">{BUSINESS.name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">
              Pre-order pickup
            </div>
          </div>
        </Link>
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--ink-mute)] hover:text-[color:var(--gold)] transition px-2"
        >
          ← Menu
        </Link>
      </header>

      {step === "build" ? (
        <BuildStep
          menu={menu}
          cart={cart}
          add={add}
          sub={sub}
          lines={lines}
          total={total}
          itemCount={itemCount}
          notes={notes}
          setNotes={setNotes}
          onContinue={() => {
            if (lines.length === 0) return;
            setStep("details");
          }}
        />
      ) : (
        <DetailsStep
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          pickupSlot={pickupSlot}
          setPickupSlot={setPickupSlot}
          slots={pickupSlots()}
          notes={notes}
          setNotes={setNotes}
          lines={lines}
          total={total}
          submitting={submitting}
          error={error}
          onBack={() => setStep("build")}
          onSubmit={submit}
        />
      )}
    </main>
  );
}

function BuildStep({
  menu,
  cart,
  add,
  sub,
  lines,
  total,
  itemCount,
  notes,
  setNotes,
  onContinue,
}: {
  menu: MenuItem[];
  cart: Cart;
  add: (id: string) => void;
  sub: (id: string) => void;
  lines: Array<MenuItem & { qty: number }>;
  total: number;
  itemCount: number;
  notes: string;
  setNotes: (s: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-0">
      <section className="px-5 sm:px-8 py-7 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--rust)] font-semibold">
            Pre-order pickup
          </div>
          <h1 className="h-display text-4xl sm:text-5xl mt-2 italic">
            <span className="gilt">Smell it cooking</span>
            <br />
            <span className="text-[color:var(--ink)] not-italic font-bold tracking-tight">
              on your way over.
            </span>
          </h1>
          <p className="mt-3 text-[color:var(--ink-mute)] max-w-lg">
            Build your order, pay now, pick a time. We text you when it&apos;s
            in the bag.
          </p>
        </div>

        <div className="mt-9 space-y-10">
          {CATEGORY_ORDER.map((cat) => {
            const items = menu.filter((m) => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="font-display text-xl italic mb-4 flex items-center gap-3">
                  <span className="gilt">{CATEGORY_LABEL[cat]}</span>
                  <span className="flex-1 h-px bg-[color:var(--line)]" />
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item) => {
                    const qty = cart[item.id] ?? 0;
                    return (
                      <article
                        key={item.id}
                        className={`card p-4 transition flex flex-col gap-3 ${
                          qty > 0 ? "ring-2 ring-[color:var(--rust)]" : ""
                        }`}
                      >
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-display text-base font-semibold leading-tight">
                              {item.name}
                            </div>
                            <p className="text-xs text-[color:var(--ink-mute)] mt-1 line-clamp-3">
                              {item.description}
                            </p>
                          </div>
                          <div className="font-display text-[color:var(--gold)] font-bold whitespace-nowrap">
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
                                className="w-9 h-9 rounded-full bg-[color:var(--rust)] text-[color:var(--bg)] grid place-items-center text-lg leading-none hover:bg-[color:var(--rust-deep)]"
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
              </div>
            );
          })}
        </div>
      </section>

      <aside className="border-t lg:border-t-0 lg:border-l border-[color:var(--line)] bg-[color:var(--paper)] flex flex-col lg:sticky lg:top-[68px] lg:h-[calc(100vh-68px)]">
        <div className="px-5 py-4 border-b border-[color:var(--line)]">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">
            Your order
          </div>
          <div className="font-display text-2xl font-bold mt-0.5">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {lines.length === 0 ? (
            <div className="text-sm text-[color:var(--ink-mute)] text-center py-12 italic">
              Pick a split. We&apos;ll do the rest.
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--line)]">
              {lines.map((l) => (
                <li key={l.id} className="py-3 flex justify-between gap-3 items-center">
                  <div className="min-w-0">
                    <div className="font-medium text-sm leading-tight truncate">
                      {l.name}
                    </div>
                    <div className="text-xs text-[color:var(--ink-mute)] mt-0.5">
                      {l.qty} × {formatPrice(l.priceCents)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
            placeholder="Sides, allergies, anything special?"
            rows={2}
            className="input resize-none text-sm"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--ink-mute)] text-sm">Total</span>
            <span className="font-display text-3xl font-bold gilt italic">
              {formatPrice(total)}
            </span>
          </div>
          <button
            onClick={onContinue}
            disabled={lines.length === 0}
            className="btn btn-primary w-full !py-4 !text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </aside>
    </div>
  );
}

function DetailsStep({
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  pickupSlot,
  setPickupSlot,
  slots,
  notes,
  setNotes,
  lines,
  total,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  name: string;
  setName: (s: string) => void;
  phone: string;
  setPhone: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  pickupSlot: string;
  setPickupSlot: (s: string) => void;
  slots: Array<{ value: string; label: string }>;
  notes: string;
  setNotes: (s: string) => void;
  lines: Array<MenuItem & { qty: number }>;
  total: number;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <section className="flex-1 grid place-items-center px-5 py-10 sm:py-14 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md fade-up">
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--rust)] font-semibold">
            Almost there
          </div>
          <h1 className="h-display text-4xl mt-2 italic">
            <span className="gilt">Where to find you</span>
          </h1>
        </div>

        <div className="card p-5 sm:p-6 space-y-4">
          <Field label="Name (for the bag)">
            <input
              className="input"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
            />
          </Field>
          <Field label="Phone (we text when it's ready)">
            <input
              className="input"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="(555) 123-4567"
            />
          </Field>
          <Field label="Email (receipt — optional)">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="optional"
            />
          </Field>
          <Field label="Pickup time">
            <select
              className="input"
              value={pickupSlot}
              onChange={(e) => setPickupSlot(e.target.value)}
            >
              {slots.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea
              className="input resize-none text-sm"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Sides, allergies, anything special?"
            />
          </Field>
        </div>

        <div className="card p-5 mt-4">
          <ul className="divide-y divide-[color:var(--line)] mb-3">
            {lines.map((l) => (
              <li key={l.id} className="py-2 flex justify-between gap-3 text-sm">
                <span className="truncate">
                  <span className="font-medium">{l.name}</span>{" "}
                  <span className="text-[color:var(--ink-mute)]">× {l.qty}</span>
                </span>
                <span className="font-display font-semibold">
                  {formatPrice(l.priceCents * l.qty)}
                </span>
              </li>
            ))}
          </ul>
          <hr className="divider mb-3" />
          <div className="flex items-end justify-between">
            <span className="text-[color:var(--ink-mute)] text-sm">Total</span>
            <span className="font-display text-3xl font-bold gilt italic">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-[color:var(--rust-deep)] bg-[color:var(--cream)] border border-[color:var(--rust-deep)] rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onBack}
            disabled={submitting}
            className="btn btn-ghost"
          >
            ← Edit
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="btn btn-primary flex-1 !py-4 !text-base disabled:opacity-50 disabled:cursor-wait"
          >
            {submitting ? "Sending…" : `Pay ${formatPrice(total)} →`}
          </button>
        </div>

        <p className="mt-4 text-[11px] text-center text-[color:var(--ink-mute)] tracking-wide">
          Secured by Stripe · Card details never touch our server
        </p>
      </div>
    </section>
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
