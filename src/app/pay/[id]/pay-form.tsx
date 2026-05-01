"use client";
import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { formatPrice } from "@/lib/format";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripeJS(publishableKey: string) {
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

const appearance: StripeElementsOptions["appearance"] = {
  theme: "night",
  labels: "floating",
  variables: {
    colorPrimary: "#d4af37",
    colorBackground: "#1a1510",
    colorText: "#f4e7c0",
    colorDanger: "#e57c57",
    fontFamily: "'Manrope', system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
    fontSizeBase: "15px",
  },
  rules: {
    ".Input": {
      backgroundColor: "#14100a",
      border: "1px solid #2e2618",
      color: "#f4e7c0",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #d4af37",
      boxShadow: "0 0 0 3px rgba(212, 175, 55, 0.18)",
    },
    ".Label": {
      color: "#c9b88a",
      fontWeight: "500",
    },
    ".Tab": {
      backgroundColor: "#14100a",
      border: "1px solid #2e2618",
      color: "#c9b88a",
    },
    ".Tab:hover": {
      borderColor: "#b8902a",
      color: "#f4e7c0",
    },
    ".Tab--selected": {
      backgroundColor: "#241a0e",
      borderColor: "#d4af37",
      color: "#e9c75c",
    },
    ".TabIcon--selected": { fill: "#d4af37" },
    ".Block": {
      backgroundColor: "#14100a",
      borderColor: "#2e2618",
    },
  },
};

export function PayForm({
  orderId,
  amountCents,
  currency,
  publishableKey,
  clientSecret,
  returnUrl,
}: {
  orderId: string;
  amountCents: number;
  currency: string;
  publishableKey: string;
  clientSecret: string;
  returnUrl: string;
}) {
  const stripe = getStripeJS(publishableKey);
  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
    loader: "auto",
  };

  return (
    <Elements stripe={stripe} options={options}>
      <Inner
        orderId={orderId}
        amountCents={amountCents}
        currency={currency}
        returnUrl={returnUrl}
      />
    </Elements>
  );
}

function Inner({
  amountCents,
  currency,
  returnUrl,
}: {
  orderId: string;
  amountCents: number;
  currency: string;
  returnUrl: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      // Stay on this page for instant-success methods (cards). Stripe redirects
      // to return_url for methods that need a redirect (3DS, bank wallets).
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "Payment could not be completed.");
      setSubmitting(false);
      return;
    }
    // PaymentIntent succeeded inline (no redirect needed) — go to success.
    window.location.href = returnUrl;
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div className="min-h-[260px]">
        <PaymentElement
          onReady={() => setReady(true)}
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
            wallets: { applePay: "auto", googlePay: "auto" },
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-[color:var(--rust-deep)] bg-[color:var(--cream)] border border-[color:var(--rust-deep)] rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !ready || submitting}
        className="btn btn-primary w-full !py-4 !text-base disabled:opacity-50 disabled:cursor-wait"
      >
        {submitting
          ? "Processing…"
          : `Pay ${formatPrice(amountCents, currency)}`}
      </button>

      <p className="text-center text-[11px] text-[color:var(--ink-mute)] tracking-wide">
        Secured by Stripe · Card details never touch our server
      </p>
    </form>
  );
}
