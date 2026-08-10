// Blue Point Laundry price list. Prices are integer fils (1 KWD = 1000 fils),
// transcribed from the official Blue Point price sheets.
//
// EXTRA_ITEMS (src/lib/extraItems.ts) are additional catalogue items with photos
// but no fixed price — the shop sets the price when adding them to an order.
//
// Most garments have three service prices: washing+ironing, dryclean+ironing,
// and iron-only. A price of null means the service isn't offered for that item.
// "Cleaning" items (shoes/bags) have a single "starting from" price.

import { EXTRA_ITEMS } from "./extraItems";

export type ServicePrices = {
  wash: number | null; // washing & ironing
  dryclean: number | null; // dryclean & ironing
  iron: number | null; // iron only
};

export type PriceItem = {
  key: string;
  en: string;
  ar: string;
  prices?: ServicePrices; // for garments
  from?: number; // for cleaning items (single "starting from" price)
  image?: string; // optional product photo (path under /public)
};

export type PriceCategory = {
  key: string;
  en: string;
  ar: string;
  kind: "garment" | "cleaning";
  items: PriceItem[];
};

const p = (wash: number | null, dryclean: number | null, iron: number | null): ServicePrices => ({
  wash,
  dryclean,
  iron,
});

export const PRICE_CATEGORIES: PriceCategory[] = [
  {
    key: "men",
    en: "Men",
    ar: "رجالي",
    kind: "garment",
    items: [
      { key: "dishdasha_summer", en: "Summer Dishdasha", ar: "دشداشة صيفية", prices: p(700, 750, 400), image: "/items/dishdasha_summer.jpg" },
      { key: "dishdasha_winter", en: "Winter Dishdasha", ar: "دشداشة شتوية", prices: p(900, 900, 500), image: "/items/dishdasha_winter.jpg" },
      { key: "ghutra", en: "Ghutra / Shemagh", ar: "غترة / شماغ", prices: p(400, 500, 300), image: "/items/ghutra.jpg" },
      { key: "shirt", en: "Shirt", ar: "قميص", prices: p(600, 750, 300), image: "/items/shirt.jpg" },
      { key: "tshirt", en: "T-Shirt", ar: "تي شرت", prices: p(600, 1000, 300), image: "/items/tshirt.jpg" },
      { key: "short", en: "Short", ar: "شورت", prices: p(500, 750, 250), image: "/items/short.jpg" },
      { key: "sports_shirt", en: "Sports Shirt", ar: "قميص رياضي", prices: p(900, 1000, 500) },
      { key: "sweatpants", en: "Sweatpants", ar: "بنطلون رياضي", prices: p(600, 750, 300) },
      { key: "tracksuit", en: "Tracksuit", ar: "بدلة رياضة", prices: p(1500, 1750, 800), image: "/items/tracksuit.jpg" },
      { key: "military_suit", en: "Military Suit", ar: "بدلة عسكرية", prices: p(2000, 2000, 1000) },
      { key: "jacket", en: "Jacket", ar: "جاكيت", prices: p(1500, 1500, 750), image: "/items/jacket.jpg" },
      { key: "men_suit_2", en: "Men Suit (2 pcs)", ar: "بدلة رجالية (قطعتين)", prices: p(2000, 2000, 1250), image: "/items/men_suit_2.jpg" },
      { key: "men_suit_3", en: "Men Suit (3 pcs)", ar: "بدلة رجالية (٣ قطع)", prices: p(2500, 2500, 1500), image: "/items/men_suit_3.jpg" },
      { key: "overcoat", en: "Over Coat", ar: "بالطو", prices: p(2000, 2500, 1250), image: "/items/overcoat.jpg" },
      { key: "tie", en: "Tie", ar: "ربطة عنق", prices: p(500, 500, 250), image: "/items/tie.jpg" },
      { key: "cap", en: "Cap", ar: "طاقية / قحفية", prices: p(100, null, null), image: "/items/cap.jpg" },
    ],
  },
  {
    key: "women",
    en: "Women",
    ar: "نسائي",
    kind: "garment",
    items: [
      { key: "dress", en: "Normal Dress", ar: "فستان عادي", prices: p(1500, 1500, 750), image: "/items/dress.jpg" },
      { key: "blouse", en: "Normal Blouse", ar: "بلوزة عادية", prices: p(750, 1000, 400), image: "/items/blouse.jpg" },
      { key: "blouse_silk", en: "Silk Blouse", ar: "بلوزة حرير", prices: p(1250, 1250, 600), image: "/items/blouse_silk.jpg" },
      { key: "skirt", en: "Normal Skirt", ar: "تنورة عادية", prices: p(1000, 1250, 600), image: "/items/skirt.jpg" },
      { key: "skirt_silk", en: "Silk Skirt", ar: "تنورة حرير", prices: p(1500, 1500, 1000) },
      { key: "ladies_suit_2", en: "Ladies Suit (2 pcs)", ar: "بدلة نسائية (قطعتين)", prices: p(2000, 1250, 1250), image: "/items/ladies_suit_2.jpg" },
      { key: "abaya", en: "Abaya", ar: "عباية", prices: p(1250, 2000, 750), image: "/items/abaya.jpg" },
      { key: "hijab", en: "Scarf / Hijab", ar: "حجاب", prices: p(600, 750, 350), image: "/items/hijab.jpg" },
    ],
  },
  {
    key: "children",
    en: "Children",
    ar: "أطفال",
    kind: "garment",
    items: [
      { key: "child_pieces", en: "Children's Pieces", ar: "قطع للأطفال", prices: p(400, 600, 250), image: "/items/child_pieces.jpg" },
      { key: "child_jacket", en: "Children's Jacket", ar: "جاكيت أطفال", prices: p(750, 1000, 500), image: "/items/child_jacket.jpg" },
    ],
  },
  {
    key: "household",
    en: "Household",
    ar: "منزلي",
    kind: "garment",
    items: [
      { key: "duvet_single", en: "Duvet / Blanket (Single)", ar: "لحاف / بطانية (مفرد)", prices: p(2000, 2000, null), image: "/items/duvet_single.jpg" },
      { key: "duvet_double", en: "Duvet / Blanket (Double)", ar: "لحاف / بطانية (مزدوج)", prices: p(2500, 2500, null), image: "/items/duvet_double.jpg" },
      { key: "sheet_single", en: "Bed Sheet (Single)", ar: "شرشف (مفرد)", prices: p(750, 1000, 400), image: "/items/sheet_single.jpg" },
      { key: "sheet_double", en: "Bed Sheet (Double)", ar: "شرشف (مزدوج)", prices: p(1000, 1250, 600), image: "/items/sheet_double.jpg" },
      { key: "pillow", en: "Pillow", ar: "مخدة", prices: p(750, 1000, null), image: "/items/pillow.jpg" },
      { key: "pillow_case", en: "Pillow Case", ar: "وجه مخدة", prices: p(300, 500, 250), image: "/items/pillow_case.jpg" },
    ],
  },
  {
    key: "cleaning",
    en: "Cleaning",
    ar: "تنظيف",
    kind: "cleaning",
    items: [
      { key: "shoe_regular", en: "Regular Shoe Cleaning", ar: "تنظيف حذاء عادي", from: 3000 },
      { key: "shoe_suede", en: "Suede Shoe Cleaning (brand)", ar: "تنظيف حذاء شامواه (ماركة)", from: 7000 },
      { key: "shoe_extension", en: "Shoe Extension", ar: "توسعة حذاء", from: 5000 },
      { key: "bag_small", en: "Bag Cleaning (Small)", ar: "تنظيف شنطة (صغير)", from: 10000 },
      { key: "bag_big", en: "Bag Cleaning (Big)", ar: "تنظيف شنطة (كبير)", from: 20000 },
      { key: "bag_travel", en: "Travel Bag Cleaning", ar: "تنظيف شنطة سفر", from: 9000 },
      { key: "bag_dressing", en: "Bag Dressing", ar: "تلبيس شنطة", from: 10000 },
      { key: "cap_cleaning", en: "Cap Cleaning", ar: "تنظيف كاب", from: 2500 },
      { key: "belt_cleaning", en: "Belt Cleaning", ar: "تنظيف حزام", from: 5000 },
    ],
  },
];

export type PriceService = "wash" | "dryclean" | "iron";

export type FlatPriceItem = PriceItem & {
  categoryKey: string;
  categoryEn: string;
  categoryAr: string;
  kind: PriceCategory["kind"];
};

// Preferred display order (matches the order the item photos were provided,
// Summer Dishdasha first). Items not listed keep their natural order, after.
const DISPLAY_ORDER: string[] = [
  // Official price-sheet items with photos (Summer Dishdasha first).
  "dishdasha_summer", "ghutra", "shirt", "tshirt", "pillow_case", "blouse",
  "duvet_double", "hijab", "jacket", "abaya", "sheet_double", "cap", "short",
  "dress", "men_suit_2", "dishdasha_winter", "sheet_single", "child_pieces",
  "overcoat", "skirt", "pillow", "blouse_silk", "duvet_single", "child_jacket",
  "tie", "men_suit_3", "ladies_suit_2", "tracksuit",
  // Extra items with photos, in the order the customer supplied them.
  "daraa_special_2", "bathrobe", "daraa", "gilet", "tracksuit_trouser",
  "leather_shoes", "blanket_special", "bra", "child_fancy_dress",
  "child_dishdasha", "pillow_special_small", "jean_jacket", "child_shorts",
  "pyjamas", "boiler_suit", "duvet_special", "blanket_children",
  "tracksuit_jacket", "child_sweater", "fancy_tshirt", "fancy_dress",
  "long_shirt", "silk_nightgown", "vest", "bath_towel_large", "shoes_trainer",
  "duvet_children", "party_dress", "sofa_cover_large", "toys", "shawl",
  "dress_pleated", "tablecloth_ornate", "child_shirt", "officer_cap",
  "school_uniform", "besht", "child_gutra", "saree", "doctors_coat", "ihram",
  "dungaree", "tablecloth_normal", "hand_towel", "child_skirt",
  "officer_trouser", "officer_shirt", "besht_winter", "niqab", "dress_special",
];

// All price-list items flattened, tagged with their category — for the shop
// search/grid, sorted into the preferred display order.
export function allPriceItems(): FlatPriceItem[] {
  const items = PRICE_CATEGORIES.flatMap((c) =>
    c.items.map((it) => ({
      ...it,
      categoryKey: c.key,
      categoryEn: c.en,
      categoryAr: c.ar,
      kind: c.kind,
    })),
  );
  // Merge in the extra (photo-only, no fixed price) items, tagged with their
  // category so they show up in the shop grid alongside the priced items.
  const catByKey = new Map(PRICE_CATEGORIES.map((c) => [c.key, c]));
  for (const ex of EXTRA_ITEMS) {
    const c = catByKey.get(ex.categoryKey);
    if (!c) continue;
    items.push({
      key: ex.key,
      en: ex.en,
      ar: ex.ar,
      image: ex.image,
      categoryKey: c.key,
      categoryEn: c.en,
      categoryAr: c.ar,
      kind: c.kind,
    });
  }
  const rank = (k: string) => {
    const i = DISPLAY_ORDER.indexOf(k);
    return i === -1 ? DISPLAY_ORDER.length : i;
  };
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => rank(a.it.key) - rank(b.it.key) || a.i - b.i)
    .map(({ it }) => it);
}

// The unit price (fils) for an item + service. Cleaning items ignore the service.
export function priceForItem(
  item: { prices?: ServicePrices; from?: number },
  service: PriceService,
): number | null {
  if (item.from != null) return item.from;
  return item.prices ? item.prices[service] : null;
}
