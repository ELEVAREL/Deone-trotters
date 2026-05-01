import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { isStripeConfigured } from "@/lib/stripe";
import { BUSINESS } from "@/lib/menu";
import { PayButton } from "./pay-button";
import type { CartLine, OrderRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, amount_cents, currency, items, notes, paid_at, created_at")
    .eq("id", id)
    .maybeSingle<OrderRow>();

  if (!order) notFound();

  if (order.status === "paid") {
    return (
      <main className="min-h-screen grid place-items-center px-5">
        <div className="card p-10 text-center max-w-md w-full fade-up">
          <div className="text-5xl mb-3">✓</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Already paid</h1>
          <p className="mt-2 text-[color:var(--ink-mute)]">
            This order has been settled. Thank you!
          </p>
        </div>
      </main>
    );
  }

  const items = order.items as CartLine[];
  const stripeReady = isStripeConfigured();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-5 border-b border-[color:var(--line)] flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          {BUSINESS.name}
        </Link>
        <span className="chip">Secure checkout</span>
      </header>

      <section className="flex-1 grid place-items-center px-5 py-10">
        <div className="w-full max-w-md fade-up">
          <div className="text-center mb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--rust)] font-semibold">
              Your order
            </div>
            <h1 className="h-display text-4xl mt-2">Confirm & pay</h1>
            <p className="mt-2 text-[color:var(--ink-mute)] text-sm">
              Scanned from the counter. Tap below. The kitchen gets a green light the
              moment your card clears.
            </p>
          </div>

          {sp.cancelled && (
            <div className="mb-4 p-3 rounded-xl bg-[color:var(--cream)] border border-[color:var(--gold-soft)] text-sm text-[color:var(--rust-deep)]">
              Payment cancelled. You can try again below.
            </div>
          )}

          <div className="card p-5 sm:p-6">
            <ul className="divide-y divide-[color:var(--line)]">
              {items.map((line) => (
                <li
                  key={line.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-medium">{line.name}</div>
                    <div className="text-xs text-[color:var(--ink-mute)]">
                      {line.qty} × {formatPrice(line.priceCents)}
                    </div>
                  </div>
                  <div className="font-display font-semibold">
                    {formatPrice(line.priceCents * line.qty)}
                  </div>
                </li>
              ))}
            </ul>
            {order.notes && (
              <div className="mt-4 p-3 rounded-xl bg-[color:var(--bg-warm)] border border-[color:var(--line)] text-sm">
                <span className="text-[color:var(--ink-mute)] text-xs uppercase tracking-wider">
                  Notes
                </span>
                <div className="mt-0.5">{order.notes}</div>
              </div>
            )}
            <hr className="divider my-4" />
            <div className="flex items-center justify-between">
              <span className="text-[color:var(--ink-mute)]">Total</span>
              <span className="font-display text-2xl font-bold">
                {formatPrice(order.amount_cents, order.currency)}
              </span>
            </div>
          </div>

          {stripeReady ? (
            <PayButton orderId={order.id} />
          ) : (
            <div className="mt-5 p-4 rounded-xl bg-[color:var(--cream)] border border-[color:var(--gold-soft)] text-sm">
              <strong className="text-[color:var(--rust-deep)]">Demo mode.</strong> Stripe
              keys aren&apos;t added yet. Add{" "}
              <code className="text-xs bg-[color:var(--paper)] px-1.5 py-0.5 rounded border border-[color:var(--line)]">
                STRIPE_SECRET_KEY
              </code>{" "}
              in Vercel to enable real card payments.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
