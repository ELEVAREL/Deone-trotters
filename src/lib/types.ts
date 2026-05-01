export type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: "mains" | "sides" | "drinks" | "desserts";
  image?: string;
};

export type CartLine = {
  id: string;
  name: string;
  priceCents: number;
  qty: number;
};

export type OrderStatus = "pending" | "paid" | "cancelled" | "expired";

export type OrderRow = {
  id: string;
  created_at: string;
  paid_at: string | null;
  status: OrderStatus;
  amount_cents: number;
  currency: string;
  items: CartLine[];
  customer_email: string | null;
  customer_name: string | null;
  notes: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
};
