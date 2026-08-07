// Kuwait areas (bilingual) with approximate centroids for map centering.
// Coordinates are approximate (area-level) — good enough to recenter the map so
// the customer can drop an exact pin.

export type Area = { en: string; ar: string; lat: number; lng: number };

export const KUWAIT_AREAS: Area[] = [
  // Capital (العاصمة)
  { en: "Kuwait City", ar: "مدينة الكويت", lat: 29.3697, lng: 47.9783 },
  { en: "Sharq", ar: "شرق", lat: 29.3797, lng: 47.986 },
  { en: "Mirqab", ar: "المرقاب", lat: 29.373, lng: 47.982 },
  { en: "Dasman", ar: "دسمان", lat: 29.386, lng: 48.001 },
  { en: "Qibla", ar: "القبلة", lat: 29.378, lng: 47.976 },
  { en: "Salhiya", ar: "الصالحية", lat: 29.376, lng: 47.984 },
  { en: "Shuwaikh", ar: "الشويخ", lat: 29.352, lng: 47.935 },
  { en: "Kaifan", ar: "كيفان", lat: 29.343, lng: 47.964 },
  { en: "Khaldiya", ar: "الخالدية", lat: 29.34, lng: 47.956 },
  { en: "Adailiya", ar: "العديلية", lat: 29.336, lng: 47.975 },
  { en: "Faiha", ar: "الفيحاء", lat: 29.348, lng: 47.976 },
  { en: "Shamiya", ar: "الشامية", lat: 29.345, lng: 47.97 },
  { en: "Nuzha", ar: "النزهة", lat: 29.354, lng: 47.976 },
  { en: "Abdullah Al-Salem", ar: "عبدالله السالم", lat: 29.351, lng: 47.984 },
  { en: "Mansuriya", ar: "المنصورية", lat: 29.362, lng: 47.984 },
  { en: "Dasma", ar: "الدسمة", lat: 29.362, lng: 47.993 },
  { en: "Daiya", ar: "الدعية", lat: 29.368, lng: 47.995 },
  { en: "Qadsiya", ar: "القادسية", lat: 29.345, lng: 47.995 },
  { en: "Rawda", ar: "الروضة", lat: 29.33, lng: 47.99 },
  { en: "Surra", ar: "السرة", lat: 29.306, lng: 47.999 },
  { en: "Qurtuba", ar: "قرطبة", lat: 29.305, lng: 47.977 },
  { en: "Yarmouk", ar: "اليرموك", lat: 29.314, lng: 47.982 },
  { en: "Sulaibikhat", ar: "الصليبخات", lat: 29.356, lng: 47.92 },
  { en: "Doha", ar: "الدوحة", lat: 29.383, lng: 47.818 },
  { en: "Jaber Al-Ahmad", ar: "جابر الأحمد", lat: 29.33, lng: 47.89 },

  // Hawalli (حولي)
  { en: "Hawalli", ar: "حولي", lat: 29.333, lng: 48.029 },
  { en: "Salmiya", ar: "السالمية", lat: 29.334, lng: 48.078 },
  { en: "Rumaithiya", ar: "الرميثية", lat: 29.31, lng: 48.074 },
  { en: "Bayan", ar: "بيان", lat: 29.304, lng: 48.049 },
  { en: "Mishref", ar: "مشرف", lat: 29.283, lng: 48.07 },
  { en: "Salwa", ar: "سلوى", lat: 29.292, lng: 48.077 },
  { en: "Jabriya", ar: "الجابرية", lat: 29.32, lng: 48.022 },
  { en: "Shaab", ar: "الشعب", lat: 29.348, lng: 48.053 },
  { en: "Nugra", ar: "النقرة", lat: 29.326, lng: 48.04 },
  { en: "Hitteen", ar: "حطين", lat: 29.288, lng: 48.043 },
  { en: "Zahra", ar: "الزهراء", lat: 29.279, lng: 48.035 },
  { en: "Salam", ar: "السلام", lat: 29.273, lng: 48.047 },
  { en: "Bidaa", ar: "البدع", lat: 29.323, lng: 48.068 },

  // Farwaniya (الفروانية)
  { en: "Farwaniya", ar: "الفروانية", lat: 29.2775, lng: 47.959 },
  { en: "Jleeb Al-Shuyoukh", ar: "جليب الشيوخ", lat: 29.265, lng: 47.92 },
  { en: "Khaitan", ar: "خيطان", lat: 29.288, lng: 47.97 },
  { en: "Abraq Khaitan", ar: "أبرق خيطان", lat: 29.279, lng: 47.956 },
  { en: "Ardiya", ar: "العارضية", lat: 29.301, lng: 47.927 },
  { en: "Rabiya", ar: "الرابية", lat: 29.295, lng: 47.945 },
  { en: "Andalus", ar: "الأندلس", lat: 29.301, lng: 47.899 },
  { en: "Rehab", ar: "الرحاب", lat: 29.29, lng: 47.913 },
  { en: "Ishbiliya", ar: "اشبيلية", lat: 29.283, lng: 47.906 },
  { en: "Firdous", ar: "الفردوس", lat: 29.296, lng: 47.888 },
  { en: "Omariya", ar: "العمرية", lat: 29.29, lng: 47.956 },
  { en: "Rai", ar: "الري", lat: 29.317, lng: 47.925 },
  { en: "Sabah Al-Nasser", ar: "صباح الناصر", lat: 29.283, lng: 47.883 },
  { en: "Dhajeej", ar: "الضجيج", lat: 29.262, lng: 47.95 },

  // Ahmadi (الأحمدي)
  { en: "Ahmadi", ar: "الأحمدي", lat: 29.077, lng: 48.084 },
  { en: "Fahaheel", ar: "الفحيحيل", lat: 29.0826, lng: 48.13 },
  { en: "Mangaf", ar: "المنقف", lat: 29.0967, lng: 48.131 },
  { en: "Abu Halifa", ar: "أبو حليفة", lat: 29.135, lng: 48.129 },
  { en: "Fintas", ar: "الفنطاس", lat: 29.172, lng: 48.122 },
  { en: "Mahboula", ar: "المهبولة", lat: 29.152, lng: 48.123 },
  { en: "Riqqa", ar: "الرقة", lat: 29.124, lng: 48.087 },
  { en: "Hadiya", ar: "هدية", lat: 29.142, lng: 48.077 },
  { en: "Sabahiya", ar: "الصباحية", lat: 29.103, lng: 48.108 },
  { en: "Egaila", ar: "العقيلة", lat: 29.183, lng: 48.1 },
  { en: "Fahad Al-Ahmad", ar: "فهد الأحمد", lat: 29.183, lng: 48.09 },
  { en: "Ali Sabah Al-Salem", ar: "علي صباح السالم", lat: 29.055, lng: 48.08 },
  { en: "Jaber Al-Ali", ar: "جابر العلي", lat: 29.147, lng: 48.1 },
  { en: "Dhaher", ar: "الظهر", lat: 29.113, lng: 48.093 },
  { en: "Wafra", ar: "الوفرة", lat: 28.64, lng: 47.93 },

  // Jahra (الجهراء)
  { en: "Jahra", ar: "الجهراء", lat: 29.3375, lng: 47.658 },
  { en: "Naeem", ar: "النعيم", lat: 29.345, lng: 47.67 },
  { en: "Qasr", ar: "القصر", lat: 29.33, lng: 47.68 },
  { en: "Waha", ar: "الواحة", lat: 29.36, lng: 47.66 },
  { en: "Oyoun", ar: "العيون", lat: 29.34, lng: 47.65 },
  { en: "Taima", ar: "تيماء", lat: 29.355, lng: 47.64 },
  { en: "Saad Al-Abdullah", ar: "سعد العبدالله", lat: 29.33, lng: 47.71 },
  { en: "Sulaibiya", ar: "الصليبية", lat: 29.28, lng: 47.81 },

  // Mubarak Al-Kabeer (مبارك الكبير)
  { en: "Mubarak Al-Kabeer", ar: "مبارك الكبير", lat: 29.256, lng: 48.084 },
  { en: "Qurain", ar: "القرين", lat: 29.254, lng: 48.087 },
  { en: "Adan", ar: "العدان", lat: 29.268, lng: 48.079 },
  { en: "Qusour", ar: "القصور", lat: 29.266, lng: 48.071 },
  { en: "Sabah Al-Salem", ar: "صباح السالم", lat: 29.256, lng: 48.073 },
  { en: "Messila", ar: "المسيلة", lat: 29.24, lng: 48.087 },
  { en: "Fnaitees", ar: "الفنيطيس", lat: 29.236, lng: 48.073 },
  { en: "Abu Fatira", ar: "أبو فطيرة", lat: 29.232, lng: 48.081 },
  { en: "Masayel", ar: "المسايل", lat: 29.226, lng: 48.085 },
];

export const KUWAIT_CENTER: [number, number] = [29.3117, 47.9774];

// Nearest area to a dropped pin (simple squared-distance).
export function nearestArea(lat: number, lng: number): Area {
  let best = KUWAIT_AREAS[0];
  let bestD = Infinity;
  for (const a of KUWAIT_AREAS) {
    const d = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

export function findAreaByEn(en: string): Area | undefined {
  return KUWAIT_AREAS.find((a) => a.en === en);
}

// Western → Arabic-Indic digits.
export function toArabicDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

export function numberRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
