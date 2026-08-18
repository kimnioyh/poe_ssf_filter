import type { Locale } from '../i18n'
import { koBaseNames, koUniqueNames } from '../data/ko-names'
import uniqueImages from '../data/unique-images.json'

// Display-only localization. Falls back to the English canonical name when a
// KO mapping is missing. NEVER used for filter output (BaseType stays English).
export const localizeBase = (en: string, locale: Locale) =>
  locale === 'ko' ? koBaseNames[en] ?? en : en

export const localizeUnique = (en: string, locale: Locale) =>
  locale === 'ko' ? koUniqueNames[en] ?? en : en

// Item art path (served from public/). undefined when not scraped.
export const uniqueImage = (en: string): string | undefined =>
  (uniqueImages as Record<string, string>)[en]
