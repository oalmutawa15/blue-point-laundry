// Customer laundry preferences shown on the Preferences screen and to the shop
// on each order. Set once, saved on the account, editable anytime.
export type PrefOption = { key: string; en: string; ar: string };
export type PrefGroup = {
  key: "ghotra" | "nasha" | "kawi" | "perfume";
  en: string;
  ar: string;
  options: PrefOption[];
};

export const PREF_GROUPS: PrefGroup[] = [
  {
    key: "ghotra",
    en: "Ghotra Type",
    ar: "نوع الغترة",
    options: [
      { key: "square", en: "Square", ar: "مربعة" },
      { key: "square_mirzam", en: "Square Mirzam", ar: "مربعة مرزام" },
      { key: "straight", en: "Straight", ar: "مستقيمة" },
      { key: "merzam", en: "Merzam", ar: "مرزام" },
    ],
  },
  {
    key: "nasha",
    en: "Starch",
    ar: "النشا",
    options: [
      { key: "without", en: "No starch", ar: "بدون نشا" },
      { key: "light", en: "Light starch", ar: "نشا خفيف" },
      { key: "medium", en: "Medium starch", ar: "نشا وسط" },
      { key: "heavy", en: "Heavy starch", ar: "نشا كثيف" },
    ],
  },
  {
    key: "kawi",
    en: "Ironing",
    ar: "الكوي",
    options: [
      { key: "seven", en: "Seven", ar: "سبعة" },
      { key: "square", en: "Square", ar: "مربع" },
    ],
  },
  {
    key: "perfume",
    en: "Perfume",
    ar: "العطر",
    options: [
      { key: "no", en: "No Perfume", ar: "بدون عطر" },
      { key: "yes", en: "With Perfume", ar: "مع عطر" },
    ],
  },
];

// Preferences stored on profiles.preferences (jsonb). `notes` is free text;
// `lang` is the saved UI language (see saveLangPreference) — kept here so it is
// not overwritten when laundry preferences are saved.
export type Preferences = Partial<Record<PrefGroup["key"], string>> & {
  notes?: string;
  lang?: string;
};

// Label for a stored option value, in the given language ("" if unset).
export function prefLabel(groupKey: PrefGroup["key"], value: string | undefined, lang: "ar" | "en"): string {
  if (!value) return "";
  const g = PREF_GROUPS.find((x) => x.key === groupKey);
  const o = g?.options.find((x) => x.key === value);
  return o ? (lang === "ar" ? o.ar : o.en) : "";
}
