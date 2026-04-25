import { createContext, useContext, useState, useEffect, useCallback } from "react";
import ms from "../translations/ms.js";
import en from "../translations/en.js";
import zh from "../translations/zh.js";
import ta from "../translations/ta.js";

const translations = { ms, en, zh, ta };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("warkahbiz_language") || "ms";
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem("warkahbiz_language", lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key) => {
      const result = translations[language]?.[key];
      if (!result) return translations.en?.[key] || key;
      return result;
    },
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used inside LanguageProvider");
  return context;
};
