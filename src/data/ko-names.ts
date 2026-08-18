// EN -> KO display names. Used for on-screen display only.
// Filter output NEVER uses this (BaseType stays English).
import baseTranslations from './base_translations.json'
import uniqueTranslations from './unique-translations.json'

// Base type names from base_translations.json (covers 542/543 CSV bases).
// Add manual overrides / missing entries (e.g. "Synthesised Map") below the spread.
export const koBaseNames: Record<string, string> = {
  ...baseTranslations,
}

// Unique names scraped from poedb /kr/ (1158/1162; 4 have no KO on poedb -> EN fallback).
export const koUniqueNames: Record<string, string> = {
  ...uniqueTranslations,
}
