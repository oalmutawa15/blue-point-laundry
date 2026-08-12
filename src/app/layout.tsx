import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { dir, type Lang } from "@/lib/i18n/dictionaries";

// Tajawal supports both Arabic and Latin — one font for the whole bilingual UI.
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Blue Point Laundry — مصبغة بلو بوينت",
  description: "Laundry pickup & delivery in Kuwait — Blue Point Laundry.",
};

export const viewport: Viewport = {
  themeColor: "#154384",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Read the saved language from the cookie so the very first render matches the
  // user's choice (no flash of Arabic before switching).
  const lang: Lang = (await cookies()).get("bp_lang")?.value === "en" ? "en" : "ar";
  return (
    <html lang={lang} dir={dir(lang)} className={`${tajawal.variable} h-full`}>
      <body className="min-h-full">
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
