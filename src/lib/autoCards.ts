import type { Unique } from './types'

export interface CardReward {
  en: string
  cls: string
  reward: string
}

/**
 * Cards whose reward is a specific unique the player already fully owns
 * (every same-name variant owned — e.g. all Grand Spectrums). In SSF a
 * duplicate unique has no value, so these cards are safe to hide.
 *
 * Conservative by design: only `cls === 'uniqueitem'` cards whose reward text
 * exactly matches a unique name in the CSV can qualify. Generic rewards
 * ("Item", "Jewel", base types) and uniques absent from the CSV never match.
 */
export function ownedRewardCards<T extends CardReward>(cards: T[], uniques: Unique[]): T[] {
  const total = new Map<string, number>()
  const owned = new Map<string, number>()
  for (const u of uniques) {
    total.set(u.name, (total.get(u.name) ?? 0) + 1)
    if (u.owned) owned.set(u.name, (owned.get(u.name) ?? 0) + 1)
  }
  return cards.filter(
    (c) => c.cls === 'uniqueitem' && total.has(c.reward) && owned.get(c.reward) === total.get(c.reward),
  )
}
