import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Custom hook for app translations
 * Automatically loads saved language preference
 */
export const useAppTranslation = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguageCode = await AsyncStorage.getItem("appLanguageCode");
      if (savedLanguageCode && i18n.language !== savedLanguageCode) {
        await i18n.changeLanguage(savedLanguageCode);
      }
    } catch (error) {
      console.log("Error loading language:", error);
    }
  };

  return { t, i18n };
};
