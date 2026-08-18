export interface Unique {
  name: string
  baseItem: string
  category: string
  grouping: string
  owned: boolean
  /** distinguishes same-name variants (e.g. Grand Spectrum). may be empty. */
  disambiguation: string
  /** FilterBlade unique tier "0".."5" (0 = top). may be empty. */
  tier: string
}

/** Top unique tiers protected from hiding by the "never hide" toggle. */
export const TOP_TIERS = new Set(['0', '1', '2'])

/** grouping values that cannot drop from normal monster kills. */
export const NON_DROPPABLE_GROUPINGS = ['Vaal_Orb', 'Recipe'] as const

export interface CompletionOptions {
  /** groupings counted as "droppable in my farming context". */
  includeGroupings: Set<string>
  /** categories excluded from hide/show entirely (e.g. Jewel/Map/Flask). */
  excludeCategories: Set<string>
}
