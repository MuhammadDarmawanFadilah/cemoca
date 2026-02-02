"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SupportedLocale, 
  TranslationStructure, 
  defaultLocale, 
  getTranslation, 
  getNestedValue,
  localeNames,
  localeFlags 
} from '@/lib/i18n';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: TranslationStructure;
  localeNames: Record<SupportedLocale, string>;
  localeFlags: Record<SupportedLocale, string>;
  supportedLocales: SupportedLocale[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'app_locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(defaultLocale);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null;
    if (savedLocale && ['id', 'en', 'ja', 'th', 'vi', 'km', 'zh', 'tl', 'hi', 'ko'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    setIsHydrated(true);
  }, []);

  // Save locale to localStorage when it changes
  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    
    // Update HTML lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  // Get translations for current locale
  const translations = useMemo(() => getTranslation(locale), [locale]);

  // Translation function with parameter support
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(translations, key);
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }
    
    return value;
  }, [translations]);

  const supportedLocales: SupportedLocale[] = ['id', 'en', 'ja', 'th', 'vi', 'km', 'zh', 'tl', 'hi', 'ko'];

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    translations,
    localeNames,
    localeFlags,
    supportedLocales,
  }), [locale, setLocale, t, translations]);

  // Prevent hydration mismatch
  if (!isHydrated) {
    return (
      <LanguageContext.Provider value={{
        locale: defaultLocale,
        setLocale: () => {},
        t: (key) => key,
        translations: getTranslation(defaultLocale),
        localeNames,
        localeFlags,
        supportedLocales,
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for simple translation access
export function useTranslation() {
  const { t, locale } = useLanguage();
  return { t, locale };
}
