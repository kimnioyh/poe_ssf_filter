import type { Locale } from '../i18n'
import { koBaseNames, koUniqueNames } from '../data/ko-names'

// Display-only localization. Falls back to the English canonical name when a
// KO mapping is missing. NEVER used for filter output (BaseType stays English).
export const localizeBase = (en: string, locale: Locale) =>
  locale === 'ko' ? koBaseNames[en] ?? en : en

export const localizeUnique = (en: string, locale: Locale) =>
  locale === 'ko' ? koUniqueNames[en] ?? en : en
