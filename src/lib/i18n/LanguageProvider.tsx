"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, dir, type Dictionary, type Lang } from "./dictionaries";
import { saveLangPreference } from "@/app/actions/prefs";

const STORAGE_KEY = "bp_lang";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  dir: "rtl" | "ltr";
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLang = "ar",
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Restore saved preference on first client render.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  // Keep <html lang/dir> in sync, and persist in BOTH localStorage and a cookie.
  // The cookie lets the server render the right language on first paint, so there
  // is no flash of Arabic before switching.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = dir(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.cookie = `${STORAGE_KEY}=${lang};path=/;max-age=31536000;samesite=lax`;
  }, [lang]);

  // Persist the choice on the user's profile (for logged-in users) so
  // server-sent messages like the receipt use the same language.
  const setLang = (l: Lang) => {
    setLangState(l);
    saveLangPreference(l);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "ar" ? "en" : "ar"),
      dir: dir(lang),
      t: dictionaries[lang],
    }),
    [lang],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}
