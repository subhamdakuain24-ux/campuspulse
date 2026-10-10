import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  Language,
  SUPPORTED_LANGUAGES,
  translations,
  LanguageOption,
  TranslationKeys,
} from '../locales';

const STORAGE_KEY = 'campuspulse_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentLanguageOption: LanguageOption;
  supportedLanguages: LanguageOption[];
  t: (keyPath: string, fallback?: string) => string;
  translateStatus: (status?: string | null) => string;
  translateRole: (role?: string | null) => string;
  strings: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && (saved === 'en' || saved === 'or' || saved === 'hi')) {
        return saved;
      }
    } catch {
      // localStorage may be unavailable
    }
    return 'en';
  });

  const setLanguage = (newLang: Language) => {
    if (newLang === 'en' || newLang === 'or' || newLang === 'hi') {
      setLanguageState(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {
        // ignore
      }
    }
  };

  const currentLanguageOption = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const strings = useMemo(() => {
    return translations[language] || translations.en;
  }, [language]);

  const t = (keyPath: string, fallback?: string): string => {
    // 1. Try current language
    const currentVal = getNestedValue(translations[language], keyPath);
    if (currentVal !== undefined) {
      return currentVal;
    }
    // 2. Fallback to English
    const enVal = getNestedValue(translations.en, keyPath);
    if (enVal !== undefined) {
      return enVal;
    }
    // 3. Fallback provided or keyPath
    return fallback !== undefined ? fallback : keyPath;
  };

  const translateStatus = (status?: string | null): string => {
    if (!status) return '';
    const cleanStatus = status.trim();

    // Direct lookup in status keys
    const direct = getNestedValue(translations[language], `status.${cleanStatus}`);
    if (direct) return direct;

    // Direct lookup in English status keys
    const enDirect = getNestedValue(translations.en, `status.${cleanStatus}`);
    if (enDirect) return enDirect;

    // Normalization check for standard statuses
    const normalized = cleanStatus.toUpperCase().replace(/\s+/g, '_');
    const normVal = getNestedValue(translations[language], `status.${normalized}`);
    if (normVal) return normVal;

    return cleanStatus;
  };

  const translateRole = (role?: string | null): string => {
    if (!role) return '';
    const cleanRole = role.trim();
    const val = getNestedValue(translations[language], `roles.${cleanRole}`);
    if (val) return val;
    const enVal = getNestedValue(translations.en, `roles.${cleanRole}`);
    if (enVal) return enVal;
    return cleanRole;
  };

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguageOption,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t,
      translateStatus,
      translateRole,
      strings,
    }),
    [language, currentLanguageOption, strings]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  return useLanguage();
};
