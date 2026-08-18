import type { BaseStatus } from './completion'
import { completedBases, incompleteBases } from './completion'

const quote = (bases: string[]) => bases.map((b) => `"${b}"`).join(' ')

/** BaseType is ALWAYS English (game filter matches internal English names). */
function block(comment: string, verb: 'Show' | 'Hide', bases: string[], extra = ''): string {
  if (bases.length === 0) return ''
  const lines = [
    `# ${comment}`,
    verb,
    `    Rarity Unique`,
    `    BaseType == ${quote(bases)}`,
  ]
  if (extra) lines.push(`    ${extra}`)
  return lines.join('\n') + '\n\n'
}

/** Generate the two prepended blocks (does not include the base filter). */
export function buildBlocks(bases: BaseStatus[]): string {
  const show = block(
    'SSF still-needed uniques (generated)',
    'Show',
    incompleteBases(bases),
    'SetBorderColor 255 200 0',
  )
  const hide = block('SSF collected-base hide (generated)', 'Hide', completedBases(bases))
  return show + hide
}

/** Prepend generated blocks to the uploaded/fetched NeverSink filter text. */
export function buildFilter(bases: BaseStatus[], baseFilterText: string): string {
  return buildBlocks(bases) + baseFilterText
}
