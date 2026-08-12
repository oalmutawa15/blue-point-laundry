// Customer laundry preferences shown on the Preferences screen and to the shop
// on each order. Set once, saved on the account, editable anytime. Labels are
// always shown bilingually (Arabic / English) since the terms are specialised.
export type PrefOption = { key: string; en: string; ar: string };
export type PrefGroup = {
  key: "nasha" | "kawi" | "dishdasha" | "perfume";
  en: string;
  ar: string;
  options: PrefOption[];
};

export const PREF_GROUPS: PrefGroup[] = [
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
    ar: "كوي",
    options: [
      { key: "triangle", en: "Triangle", ar: "مثلث" },
      { key: "straight", en: "Straight line", ar: "خط سيده" },
      { key: "merzam", en: "Merzam", ar: "مرزام" },
      { key: "square", en: "Square", ar: "مربع" },
    ],
  },
  {
    key: "dishdasha",
    en: "Dishdasha",
    ar: "دشاديش",
    options: [
      { key: "side", en: "Side line", ar: "خط جانبي" },
      { key: "center", en: "Center line", ar: "خط بالنص" },
      { key: "round", en: "Round press", ar: "كوي دائري" },
    ],
  },
  {
    key: "perfume",
    en: "Perfume",
    ar: "العطر",
    options: [
      { key: "no", en: "Without", ar: "بدون عطر" },
      { key: "yes", en: "With perfume", ar: "مع عطر" },
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

// Bilingual label "Arabic / English", shown everywhere for clarity.
export function biGroup(g: PrefGroup): string {
  return `${g.ar} / ${g.en}`;
}
export function biOption(o: PrefOption): string {
  return `${o.ar} / ${o.en}`;
}

// Bilingual label for a stored option value ("" if unset).
export function prefLabel(groupKey: PrefGroup["key"], value: string | undefined): string {
  if (!value) return "";
  const g = PREF_GROUPS.find((x) => x.key === groupKey);
  const o = g?.options.find((x) => x.key === value);
  return o ? biOption(o) : "";
}
