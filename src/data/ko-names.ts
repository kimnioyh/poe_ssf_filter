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

// Item categories (from CSV `category`). Small fixed set -> hand-mapped.
export const koCategories: Record<string, string> = {
  Ring: '반지', Amulet: '목걸이', Belt: '허리띠', Jewel: '주얼',
  Helmet: '투구', 'Body Armour': '갑옷', Gloves: '장갑', Boots: '장화',
  Shield: '방패', Quiver: '화살통',
  Sword: '검', Axe: '도끼', Mace: '철퇴', Dagger: '단검', Claw: '클로',
  Bow: '활', Staff: '지팡이', Wand: '마법봉', Sceptre: '셉터',
  Flask: '플라스크', Map: '지도', Contract: '계약', Tincture: '팅크',
  'Fishing Rod': '낚싯대',
}
