import { OrderPad } from "./order-pad";
import { MENU } from "@/lib/menu";

export const metadata = { title: "Take an order" };

export default function OrderPage() {
  return <OrderPad menu={MENU} />;
}
