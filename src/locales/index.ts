import { en, TranslationKeys } from './en';
import { or } from './or';
import { hi } from './hi';

export type Language = 'en' | 'or' | 'hi';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  short: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', short: 'EN' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', short: 'ଓଡ଼ି' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', short: 'हिं' },
];

export const translations: Record<Language, TranslationKeys> = {
  en,
  or,
  hi,
};

export { en, or, hi };
export type { TranslationKeys };
