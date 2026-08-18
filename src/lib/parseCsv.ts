import Papa from 'papaparse'
import type { Unique } from './types'

/** Parse the unique-collection CSV export into Unique[]. */
export function parseCsv(text: string): Unique[] {
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })
  return data
    .filter((r) => r.name && r.baseItem)
    .map((r) => ({
      name: r.name,
      baseItem: r.baseItem,
      category: r.category ?? '',
      grouping: r.grouping ?? '',
      owned: r.owned === '1',
      disambiguation: r.disambiguation ?? '',
      tier: r.tier ?? '',
    }))
}
