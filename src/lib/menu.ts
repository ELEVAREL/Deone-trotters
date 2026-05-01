import type { MenuItem } from "./types";

// Edit this file to update the menu. Prices are in cents (1295 = $12.95).
export const MENU: MenuItem[] = [
  {
    id: "trotters-classic",
    name: "Classic Gourmet Trotters",
    description: "Slow-braised pork trotters in Deone's signature gravy, served over rice.",
    priceCents: 1895,
    category: "mains",
  },
  {
    id: "trotters-spicy",
    name: "Cajun Spiced Trotters",
    description: "Trotters with a deep cajun rub, sweet onion, and fire-roasted peppers.",
    priceCents: 1995,
    category: "mains",
  },
  {
    id: "oxtail",
    name: "Sunday Oxtail",
    description: "Fall-apart oxtail in red wine and tomato. The whole house smells like Sunday.",
    priceCents: 2295,
    category: "mains",
  },
  {
    id: "smothered-chicken",
    name: "Smothered Chicken",
    description: "Bone-in thighs and onion gravy, the way Deone's mama made it.",
    priceCents: 1695,
    category: "mains",
  },
  {
    id: "mac-cheese",
    name: "Three-Cheese Mac",
    description: "Sharp cheddar, gruyère, and parmesan. Crispy top, creamy middle.",
    priceCents: 795,
    category: "sides",
  },
  {
    id: "collards",
    name: "Slow Collards",
    description: "Six hours, smoked turkey, a splash of vinegar.",
    priceCents: 695,
    category: "sides",
  },
  {
    id: "cornbread",
    name: "Honey Cornbread",
    description: "Cast-iron baked, drizzled with honey butter.",
    priceCents: 495,
    category: "sides",
  },
  {
    id: "candied-yams",
    name: "Candied Yams",
    description: "Brown sugar, butter, cinnamon. Don't ask, just order.",
    priceCents: 595,
    category: "sides",
  },
  {
    id: "sweet-tea",
    name: "Sweet Tea",
    description: "Brewed strong. Sweetened right.",
    priceCents: 350,
    category: "drinks",
  },
  {
    id: "lemonade",
    name: "Pink Lemonade",
    description: "House-made, real lemons, a hint of strawberry.",
    priceCents: 395,
    category: "drinks",
  },
  {
    id: "peach-cobbler",
    name: "Peach Cobbler",
    description: "Warm, with a buttered crust. Add ice cream — please.",
    priceCents: 695,
    category: "desserts",
  },
  {
    id: "banana-pudding",
    name: "Banana Pudding",
    description: "Layered, chilled, the right amount of vanilla wafer.",
    priceCents: 595,
    category: "desserts",
  },
];

export const BUSINESS = {
  name: "Deone's Gourmet Trotters",
  tagline: "Soul food, slow-cooked, served with love.",
  story:
    "Three generations of recipes from Deone's kitchen — passed down, written by hand, finally served to you.",
  hours: [
    { day: "Tue – Thu", open: "11:00 AM", close: "8:00 PM" },
    { day: "Fri – Sat", open: "11:00 AM", close: "10:00 PM" },
    { day: "Sunday", open: "12:00 PM", close: "7:00 PM" },
    { day: "Monday", open: "Closed", close: "" },
  ],
  address: "Update this in src/lib/menu.ts",
  phone: "(000) 000-0000",
  instagram: "@deonesgourmet",
};
