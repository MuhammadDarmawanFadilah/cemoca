import { en } from './translations/en';
import { id } from './translations/id';
import { zh } from './translations/zh';
import { ja } from './translations/ja';
import { ko } from './translations/ko';

export type SupportedLocale = 'en' | 'id' | 'zh' | 'ja' | 'ko';

// Define a flexible translation structure type
type TranslationStructure = {
  [key: string]: string | TranslationStructure;
};

// Use the structure of the English translation as the type
export type TranslationKeys = typeof en;

export const translations: Record<SupportedLocale, TranslationStructure> = {
  en,
  id,
  zh,
  ja,
  ko,
};

export const localeNames: Record<SupportedLocale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

export const localeFlags: Record<SupportedLocale, string> = {
  en: '🇺🇸',
  id: '🇮🇩',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
};

export const defaultLocale: SupportedLocale = 'en';

export function getTranslation(locale: SupportedLocale): TranslationStructure {
  return translations[locale] || translations[defaultLocale];
}

// Type-safe nested key access helper
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? `${F}${D}${Join<Extract<R, string[]>, D>}`
    : never
  : string;

export type TranslationKey = Join<PathsToStringProps<TranslationKeys>, '.'>;

// Get nested value from object using dot notation
export function getNestedValue<T>(obj: T, path: string): string {
  const keys = path.split('.');
  let value: unknown = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path; // Return the key itself if not found
    }
  }
  
  return typeof value === 'string' ? value : path;
}

export { en, id, zh, ja, ko };
export type { TranslationStructure };
