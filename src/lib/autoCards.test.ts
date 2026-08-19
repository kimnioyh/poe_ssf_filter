import assert from 'node:assert'
import type { Unique } from './types'
import { ownedRewardCards } from './autoCards'

const u = (name: string, owned: boolean): Unique => ({
  name, baseItem: 'Base', category: 'Amulet', grouping: 'T3', owned, disambiguation: '', tier: '3', league: '',
})
const card = (en: string, cls: string, reward: string) => ({ en, cls, reward })

const uniques = [
  u('Headhunter', true),
  u('Mageblood', false),
  u('Grand Spectrum', true), // multi-variant name: one owned…
  u('Grand Spectrum', false), // …one not -> NOT fully owned
]
const cards = [
  card('The Doctor', 'uniqueitem', 'Headhunter'), // owned -> hide
  card('The Apothecary', 'uniqueitem', 'Mageblood'), // not owned -> keep
  card('The Cacophony', 'uniqueitem', 'Grand Spectrum'), // partially owned -> keep
  card('Arrogance of the Vaal', 'uniqueitem', 'Item'), // generic reward -> keep
  card("Akil's Prophecy", 'rareitem', 'Headhunter'), // non-unique cls -> keep
]

assert.deepEqual(
  ownedRewardCards(cards, uniques).map((c) => c.en),
  ['The Doctor'],
  'only fully-owned, specific unique rewards qualify',
)
assert.deepEqual(ownedRewardCards(cards, []), [], 'no uniques loaded -> nothing auto-hidden')

// All variants owned -> multi-variant name qualifies.
const allSpectrum = [u('Grand Spectrum', true), u('Grand Spectrum', true)]
assert.deepEqual(
  ownedRewardCards(cards, allSpectrum).map((c) => c.en),
  ['The Cacophony'],
  'every same-name variant owned -> card hidden',
)

console.log('autoCards.test.ts: all assertions passed')
