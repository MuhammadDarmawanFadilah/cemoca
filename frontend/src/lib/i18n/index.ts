import { en } from './translations/en';
import { id } from './translations/id';
import { ja } from './translations/ja';
import { th } from './translations/th';
import { vi } from './translations/vi';
import { km } from './translations/km';
import { zh } from './translations/zh';
import { tl } from './translations/tl';
import { hi } from './translations/hi';
import { ko } from './translations/ko';

export type SupportedLocale = 'id' | 'en' | 'ja' | 'th' | 'vi' | 'km' | 'zh' | 'tl' | 'hi' | 'ko';

// Define a flexible translation structure type
type TranslationStructure = {
  [key: string]: string | TranslationStructure;
};

// Use the structure of the English translation as the type
export type TranslationKeys = typeof en;

export const translations: Record<SupportedLocale, TranslationStructure> = {
  id,
  en,
  ja,
  th,
  vi,
  km,
  zh,
  tl,
  hi,
  ko,
};

export const localeNames: Record<SupportedLocale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
  ja: '日本語',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  km: 'ខ្មែរ',
  zh: '中文',
  tl: 'Filipino',
  hi: 'हिन्दी',
  ko: '한국어',
};

export const localeFlags: Record<SupportedLocale, string> = {
  id: '🇮🇩',
  en: '🇺🇸',
  ja: '🇯🇵',
  th: '🇹🇭',
  vi: '🇻🇳',
  km: '🇰🇭',
  zh: '🇨🇳',
  tl: '🇵🇭',
  hi: '🇮🇳',
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

export { en, id, ja, th, vi, km, zh, tl, hi, ko };
export type { TranslationStructure };
