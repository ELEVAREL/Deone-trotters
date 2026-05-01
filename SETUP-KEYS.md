# Going Live — Add Grandma's Keys

The site is fully built and deployed. To accept real card payments, three keys
need to be added in **Vercel → Project → Settings → Environment Variables**.
Until they're added, the QR code shows up but checkout will say "Demo mode".

> Anything below this line is paste-once-and-done. No code changes needed.

---

## 1. Supabase service role key (one-time)

The Supabase project `deones-gourmet-trotters` is already provisioned and the
schema is applied. We just need the secret service-role key so the server can
read and write orders.

1. Open <https://supabase.com/dashboard/project/bvoikfzgtukzllsvpeqw/settings/api>
2. Under **Project API keys**, copy the **`service_role`** key (the one labelled `secret`).
3. In Vercel → Project → Settings → Environment Variables, add:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://bvoikfzgtukzllsvpeqw.supabase.co` | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | _(paste the secret)_ | Production, Preview, Development |

---

## 2. Stripe keys (grandma's account)

1. Log in to her Stripe dashboard → <https://dashboard.stripe.com/apikeys>
2. Copy the **Secret key** (`sk_live_...`) and **Publishable key** (`pk_live_...`).
3. Add to Vercel:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |

> Tip: Use **test** keys (`sk_test_...`, `pk_test_...`) on the Preview/Development
> environments so you can practice with Stripe's test card `4242 4242 4242 4242`.

---

## 3. Stripe webhook (so the order pad lights up green when paid)

1. Open <https://dashboard.stripe.com/webhooks>.
2. Click **+ Add endpoint**.
3. Endpoint URL: `https://YOUR-DOMAIN/api/webhook`
   - Replace `YOUR-DOMAIN` with the production URL Vercel gave you.
4. Events to send: select **`checkout.session.completed`** and **`checkout.session.expired`**.
5. Click **Add endpoint**, then on the new endpoint page click **Reveal** under
   **Signing secret** and copy the value (starts with `whsec_...`).
6. Add to Vercel:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |

---

## 4. Redeploy

After adding env vars, in Vercel hit **Deployments → ⋯ → Redeploy** on the
latest deploy so the new keys take effect. Done.

---

## Quick test (after going live)

1. Open `https://YOUR-DOMAIN/order` on the tablet/phone grandma will use.
2. Tap a few items → **Generate QR to pay**.
3. Scan the QR with another phone → pay with `4242 4242 4242 4242` (test mode)
   or a real card (live mode).
4. The QR screen flips to a green ✓ within a few seconds — that's the webhook
   firing and the order pad polling Supabase.

If the green ✓ doesn't appear, check **Stripe → Webhooks → your endpoint →
Recent deliveries** for errors, and **Vercel → Logs** for `/api/webhook`.

---

## Editing the menu

Open `src/lib/menu.ts`. Each item has `id`, `name`, `description`,
`priceCents` (1295 = $12.95), and a `category` of `mains | sides | drinks |
desserts`. Push to `main` and Vercel auto-deploys.

## Editing hours, address, contact

Same file — `src/lib/menu.ts`, the `BUSINESS` object at the bottom.

## Adding the site to grandma's home screen (PWA)

- **iPhone:** open the site in Safari → Share → **Add to Home Screen**.
- **Android:** open in Chrome → menu → **Install app**.

It launches like a native app, full-screen, with the Deone's icon.
