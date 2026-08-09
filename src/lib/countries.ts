// Country dial codes for the phone input. Kuwait is the default.
export type Country = {
  code: string; // ISO-2
  dial: string; // calling code, no +
  flag: string; // emoji
  name: string; // English
  nameAr: string; // Arabic
};

export const DEFAULT_DIAL = "965"; // Kuwait

export const COUNTRIES: Country[] = [
  { code: "KW", dial: "965", flag: "🇰🇼", name: "Kuwait", nameAr: "الكويت" },
  { code: "SA", dial: "966", flag: "🇸🇦", name: "Saudi Arabia", nameAr: "السعودية" },
  { code: "AE", dial: "971", flag: "🇦🇪", name: "UAE", nameAr: "الإمارات" },
  { code: "QA", dial: "974", flag: "🇶🇦", name: "Qatar", nameAr: "قطر" },
  { code: "BH", dial: "973", flag: "🇧🇭", name: "Bahrain", nameAr: "البحرين" },
  { code: "OM", dial: "968", flag: "🇴🇲", name: "Oman", nameAr: "عُمان" },
  { code: "EG", dial: "20", flag: "🇪🇬", name: "Egypt", nameAr: "مصر" },
  { code: "JO", dial: "962", flag: "🇯🇴", name: "Jordan", nameAr: "الأردن" },
  { code: "LB", dial: "961", flag: "🇱🇧", name: "Lebanon", nameAr: "لبنان" },
  { code: "IQ", dial: "964", flag: "🇮🇶", name: "Iraq", nameAr: "العراق" },
  { code: "SY", dial: "963", flag: "🇸🇾", name: "Syria", nameAr: "سوريا" },
  { code: "IN", dial: "91", flag: "🇮🇳", name: "India", nameAr: "الهند" },
  { code: "PK", dial: "92", flag: "🇵🇰", name: "Pakistan", nameAr: "باكستان" },
  { code: "PH", dial: "63", flag: "🇵🇭", name: "Philippines", nameAr: "الفلبين" },
  { code: "BD", dial: "880", flag: "🇧🇩", name: "Bangladesh", nameAr: "بنغلاديش" },
  { code: "LK", dial: "94", flag: "🇱🇰", name: "Sri Lanka", nameAr: "سريلانكا" },
  { code: "NP", dial: "977", flag: "🇳🇵", name: "Nepal", nameAr: "نيبال" },
  { code: "TR", dial: "90", flag: "🇹🇷", name: "Türkiye", nameAr: "تركيا" },
  { code: "GB", dial: "44", flag: "🇬🇧", name: "United Kingdom", nameAr: "بريطانيا" },
  { code: "US", dial: "1", flag: "🇺🇸", name: "United States", nameAr: "أمريكا" },
];

export function countryByDial(dial: string): Country | undefined {
  return COUNTRIES.find((c) => c.dial === dial);
}
