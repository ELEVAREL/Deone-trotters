import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatPrice, getBaseUrl } from "@/lib/format";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { BUSINESS } from "@/lib/menu";
import { PayForm } from "./pay-form";
import type { CartLine, OrderRow } from "@/lib/types";

export const dynamic = "force-dynamic";

async function ensurePaymentIntent(order: OrderRow): Promise<{
  clientSecret: string;
} | null> {
  if (!isStripeConfigured()) return null;
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  if (order.stripe_payment_intent) {
    try {
      const existing = await stripe.paymentIntents.retrieve(order.stripe_payment_intent);
      if (
        existing.status === "requires_payment_method" ||
        existing.status === "requires_confirmation" ||
        existing.status === "requires_action"
      ) {
        if (existing.amount !== order.amount_cents) {
          await stripe.paymentIntents.update(existing.id, {
            amount: order.amount_cents,
          });
        }
        return { clientSecret: existing.client_secret as string };
      }
    } catch {
      // fall through to create new
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: order.amount_cents,
    currency: order.currency,
    automatic_payment_methods: { enabled: true },
    metadata: { order_id: order.id },
    description: `Deone's Gourmet Trotters · order ${order.id.slice(0, 8)}`,
  });
  await supabase
    .from("orders")
    .update({ stripe_payment_intent: intent.id })
    .eq("id", order.id);
  return { clientSecret: intent.client_secret as string };
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, amount_cents, currency, items, notes, paid_at, created_at, stripe_payment_intent"
    )
    .eq("id", id)
    .maybeSingle<OrderRow>();

  if (!order) notFound();

  if (order.status === "paid") {
    return (
      <main className="min-h-screen grid place-items-center px-5">
        <div className="card p-10 text-center max-w-md w-full fade-up">
          <div className="w-14 h-14 rounded-full bg-[color:var(--olive)] text-[color:var(--bg)] grid place-items-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight italic gilt">
            Already paid
          </h1>
          <p className="mt-2 text-[color:var(--ink-mute)]">
            This order is settled. Thank you.
          </p>
          <Link href="/" className="btn btn-ghost mt-6">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const items = order.items as CartLine[];
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const stripeReady = isStripeConfigured() && !!publishableKey;

  const intent = stripeReady ? await ensurePaymentIntent(order) : null;
  const returnUrl = `${getBaseUrl()}/success?order=${order.id}`;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-5 border-b border-[color:var(--line)] flex items-center justify-between bg-[color:var(--paper)]/80 backdrop-blur sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[color:var(--rust)] grid place-items-center text-[color:var(--bg)] font-display font-bold">
            D
          </div>
          <span className="font-display text-base font-bold tracking-tight">
            {BUSINESS.name}
          </span>
        </Link>
        <span className="chip">● Secure checkout</span>
      </header>

      <section className="flex-1 grid place-items-center px-5 py-10 sm:py-14 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 60%)",
          }}
        />

        <div className="relative w-full max-w-md fade-up">
          <div className="text-center mb-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--rust)] font-semibold">
              Your Order
            </div>
            <h1 className="h-display text-5xl mt-2 italic">
              <span className="gilt">Pay the bill</span>
            </h1>
            <p className="mt-3 text-[color:var(--ink-mute)] text-sm leading-relaxed">
              Pay here. Card, Apple Pay, or Google Pay. The kitchen lights up
              green the second your card clears.
            </p>
          </div>

          <div className="card p-5 sm:p-6">
            <ul className="divide-y divide-[color:var(--line)]">
              {items.map((line) => (
                <li
                  key={line.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{line.name}</div>
                    <div className="text-xs text-[color:var(--ink-mute)] mt-0.5">
                      {line.qty} × {formatPrice(line.priceCents)}
                    </div>
                  </div>
                  <div className="font-display font-semibold text-[color:var(--ink)] shrink-0">
                    {formatPrice(line.priceCents * line.qty)}
                  </div>
                </li>
              ))}
            </ul>
            {order.notes && (
              <div className="mt-4 p-3 rounded-xl bg-[color:var(--bg-warm)] border border-[color:var(--line)] text-sm">
                <span className="text-[color:var(--ink-mute)] text-[10px] uppercase tracking-[0.2em]">
                  Kitchen Note
                </span>
                <div className="mt-1 text-[color:var(--ink-soft)] italic">
                  &ldquo;{order.notes}&rdquo;
                </div>
              </div>
            )}
            <hr className="divider my-5" />
            <div className="flex items-end justify-between">
              <span className="text-[color:var(--ink-mute)] text-sm">Total</span>
              <span className="font-display text-3xl font-bold gilt italic">
                {formatPrice(order.amount_cents, order.currency)}
              </span>
            </div>
          </div>

          {stripeReady && intent ? (
            <PayForm
              orderId={order.id}
              amountCents={order.amount_cents}
              currency={order.currency}
              publishableKey={publishableKey}
              clientSecret={intent.clientSecret}
              returnUrl={returnUrl}
            />
          ) : (
            <div className="mt-5 p-4 rounded-xl bg-[color:var(--cream)] border border-[color:var(--rust-deep)] text-sm">
              <strong className="text-[color:var(--gold)]">Demo mode.</strong>{" "}
              <span className="text-[color:var(--ink-soft)]">
                Stripe keys aren&apos;t fully wired yet. Add{" "}
                <code className="text-xs bg-[color:var(--paper)] px-1.5 py-0.5 rounded border border-[color:var(--line)]">
                  STRIPE_SECRET_KEY
                </code>{" "}
                +{" "}
                <code className="text-xs bg-[color:var(--paper)] px-1.5 py-0.5 rounded border border-[color:var(--line)]">
                  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                </code>{" "}
                in Vercel to enable in-app payments.
              </span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
