import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Language = "en" | "hi" | "mr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("en");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("appLanguage");
      if (savedLanguage) {
        const langCode = getLanguageCode(savedLanguage);
        setLanguageState(langCode);
        i18n.changeLanguage(langCode);
      }
    } catch (error) {
      console.log("Error loading language:", error);
    }
  };

  const getLanguageCode = (langName: string): Language => {
    switch (langName.toLowerCase()) {
      case "hindi":
        return "hi";
      case "marathi":
        return "mr";
      default:
        return "en";
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await i18n.changeLanguage(lang);

      // Store language name for compatibility
      const langName =
        lang === "hi" ? "Hindi" : lang === "mr" ? "Marathi" : "English";
      await AsyncStorage.setItem("appLanguage", langName);
      await AsyncStorage.setItem("appLanguageCode", lang);
    } catch (error) {
      console.log("Error saving language:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
