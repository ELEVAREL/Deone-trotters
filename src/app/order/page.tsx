import { OrderPad } from "./order-pad";
import { PinGate } from "./pin-gate";
import { listMenuItemsAdmin } from "@/lib/menu-db";
import { isOrderPadAuthed } from "@/lib/order-pad-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Take an order" };

export default async function OrderPage() {
  const authed = await isOrderPadAuthed();
  if (!authed) return <PinGate />;
  const menu = await listMenuItemsAdmin();
  return <OrderPad menu={menu} />;
}
