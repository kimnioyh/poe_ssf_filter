// Curated currency list for the hide-by-stack feature.
// `en` MUST be the exact in-game BaseType (used in the filter). `ko` is display only
// (official names from poedb.tw/kr/Stackable_Currency).
export interface Currency {
  en: string
  ko: string
  junk?: boolean // part of the "junk" quick-preset
}

export const CURRENCIES: Currency[] = [
  { en: 'Scroll of Wisdom', ko: '감정 주문서', junk: true },
  { en: 'Portal Scroll', ko: '포탈 주문서', junk: true },
  { en: 'Orb of Transmutation', ko: '진화의 오브', junk: true },
  { en: 'Orb of Augmentation', ko: '확장의 오브', junk: true },
  { en: "Blacksmith's Whetstone", ko: '대장장이의 숫돌', junk: true },
  { en: "Armourer's Scrap", ko: '방어구 장인의 고철', junk: true },
  { en: 'Transmutation Shard', ko: '진화의 파편', junk: true },
  { en: 'Alteration Shard', ko: '변화의 파편', junk: true },
  { en: 'Alchemy Shard', ko: '연금술의 파편', junk: true },
  { en: 'Orb of Alteration', ko: '변화의 오브' },
  { en: 'Orb of Chance', ko: '기회의 오브' },
  { en: 'Chromatic Orb', ko: '색채의 오브' },
  { en: "Jeweller's Orb", ko: '쥬얼러 오브' },
  { en: 'Orb of Fusing', ko: '연결의 오브' },
  { en: 'Orb of Alchemy', ko: '연금술의 오브' },
  { en: "Cartographer's Chisel", ko: '지도제작자의 끌' },
  { en: "Glassblower's Bauble", ko: '유리직공의 방울' },
  { en: "Gemcutter's Prism", ko: '세공사의 프리즘' },
  { en: 'Orb of Scouring', ko: '정제의 오브' },
  { en: 'Orb of Regret', ko: '후회의 오브' },
  { en: 'Blessed Orb', ko: '축복의 오브' },
  { en: 'Regal Orb', ko: '제왕의 오브' },
  { en: 'Orb of Annulment', ko: '소멸의 오브' },
  { en: 'Orb of Binding', ko: '속박의 오브' },
  { en: 'Orb of Horizons', ko: '지평의 오브' },
  { en: 'Vaal Orb', ko: '바알 오브' },
  { en: 'Chaos Orb', ko: '카오스 오브' },
]

export const JUNK_CURRENCY = CURRENCIES.filter((c) => c.junk).map((c) => c.en)
