import { TOP_TIERS, type CompletionOptions, type Unique } from './types'

export interface BaseStatus {
  baseItem: string
  category: string
  owned: number
  total: number // droppable uniques on this base (per options)
  uniques: Unique[] // droppable uniques on this base
  complete: boolean
}

/**
 * Group uniques by baseItem, keep only "droppable" ones (grouping selected +
 * category not excluded), and classify each base as complete (all owned) or not.
 * Bases with no droppable uniques are omitted (neither hidden nor shown).
 */
export function computeBases(uniques: Unique[], opts: CompletionOptions): BaseStatus[] {
  const byBase = new Map<string, Unique[]>()
  for (const u of uniques) {
    if (opts.excludeCategories.has(u.category)) continue
    if (u.league && opts.excludeLeagues.has(u.league)) continue
    if (!opts.includeGroupings.has(u.grouping)) continue
    const arr = byBase.get(u.baseItem)
    if (arr) arr.push(u)
    else byBase.set(u.baseItem, [u])
  }

  const out: BaseStatus[] = []
  for (const [baseItem, list] of byBase) {
    const owned = list.filter((u) => u.owned).length
    out.push({
      baseItem,
      category: list[0].category,
      owned,
      total: list.length,
      uniques: list,
      complete: owned === list.length,
    })
  }
  out.sort((a, b) => a.baseItem.localeCompare(b.baseItem))
  return out
}

export const completedBases = (bases: BaseStatus[]) =>
  bases.filter((b) => b.complete).map((b) => b.baseItem)

export const incompleteBases = (bases: BaseStatus[]) =>
  bases.filter((b) => !b.complete).map((b) => b.baseItem)

/**
 * Completed bases to actually hide. When `protectTop`, bases that can drop a
 * top-tier (T0–T2) unique are kept visible even if fully collected.
 */
export const hideableBases = (bases: BaseStatus[], protectTop: boolean) =>
  bases
    .filter((b) => b.complete && (!protectTop || !b.uniques.some((u) => TOP_TIERS.has(u.tier))))
    .map((b) => b.baseItem)

/** Distinct grouping / category / league values present, for building UI toggles. */
export function facets(uniques: Unique[]) {
  const groupings = new Set<string>()
  const categories = new Set<string>()
  const leagues = new Set<string>()
  for (const u of uniques) {
    if (u.grouping) groupings.add(u.grouping)
    if (u.category) categories.add(u.category)
    if (u.league) leagues.add(u.league)
  }
  return {
    groupings: [...groupings].sort(),
    categories: [...categories].sort(),
    leagues: [...leagues].sort(),
  }
}
