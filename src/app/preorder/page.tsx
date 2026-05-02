import { listMenuItemsPublic } from "@/lib/menu-db";
import { PreorderClient } from "./preorder-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Pre-order",
  description: "Pre-order pick-up. Pay now, smell it cooking on your way over.",
};

export default async function PreorderPage() {
  const menu = await listMenuItemsPublic();
  return <PreorderClient menu={menu} />;
}
