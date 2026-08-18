// EN -> KO display names. Used for on-screen display only.
// Filter output NEVER uses this (BaseType stays English).
import baseTranslations from './base_translations.json'

// Base type names from base_translations.json (covers 542/543 CSV bases).
// Add manual overrides / missing entries (e.g. "Synthesised Map") below the spread.
export const koBaseNames: Record<string, string> = {
  ...baseTranslations,
}

// Unique item names are not in base_translations.json — fill in later.
export const koUniqueNames: Record<string, string> = {
  // 'Headhunter': '헤드헌터',
}
