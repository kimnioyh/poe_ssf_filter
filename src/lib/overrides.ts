import type { Unique } from './types'

// Manual owned-state overrides, layered on top of the uploaded CSV so the
// collection can be updated mid-farm without re-exporting from the ladder.
// Stored under their own localStorage key (collection data, NOT part of the
// shareable Settings), keyed per unique so they survive CSV re-uploads.
export type OwnedOverrides = Record<string, boolean>

const KEY = 'poe-ssf-owned-overrides'

/** Stable identity for one CSV row (same-name variants differ by base/disamb). */
export const overrideKey = (u: Pick<Unique, 'name' | 'baseItem' | 'disambiguation'>) =>
  `${u.name}|${u.baseItem}|${u.disambiguation}`

export const applyOverrides = (uniques: Unique[], ov: OwnedOverrides): Unique[] =>
  uniques.map((u) => {
    const o = ov[overrideKey(u)]
    return o === undefined ? u : { ...u, owned: o }
  })

export function loadOverrides(): OwnedOverrides {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as OwnedOverrides) : {}
  } catch {
    return {}
  }
}

export function saveOverrides(ov: OwnedOverrides) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ov))
  } catch {
    /* private mode / quota — ignore */
  }
}
