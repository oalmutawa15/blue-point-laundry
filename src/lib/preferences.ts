// Customer laundry preferences shown on the Preferences screen.
export type PrefOption = { key: string; en: string; ar: string };
export type PrefGroup = { key: "ghotra" | "nasha" | "perfume"; en: string; ar: string; options: PrefOption[] };

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
    en: "Nasha Amount",
    ar: "كمية النشا",
    options: [
      { key: "without", en: "Without Nasha", ar: "بدون نشا" },
      { key: "lite", en: "Lite Nasha", ar: "نشا خفيف" },
      { key: "moderate", en: "Moderate Nasha", ar: "نشا متوسط" },
      { key: "extra", en: "Extra Nasha", ar: "نشا زيادة" },
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

export type Preferences = Partial<Record<PrefGroup["key"], string>>;
