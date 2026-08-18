const BEGIN = '# >>> POE-SSF-FILTER GENERATED (do not edit this region) >>>'
const END = '# <<< POE-SSF-FILTER GENERATED <<<'

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

/**
 * Generate the two prepended blocks, wrapped in sentinel markers.
 * @param showBases still-needed bases to force-show + emphasize
 * @param hideBases fully-collected bases to hide
 */
export function buildBlocks(showBases: string[], hideBases: string[]): string {
  const show = block(
    'SSF still-needed uniques (generated)',
    'Show',
    showBases,
    'SetBorderColor 255 200 0',
  )
  const hide = block('SSF collected-base hide (generated)', 'Hide', hideBases)
  return `${BEGIN}\n\n${show}${hide}${END}\n\n`
}

/** Remove a previously generated region so re-applying stays idempotent. */
export function stripGenerated(text: string): string {
  const re = new RegExp(`${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}\\n*`, 'g')
  return text.replace(re, '')
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Prepend generated blocks, stripping any prior region first (idempotent). */
export function buildFilter(showBases: string[], hideBases: string[], baseFilterText: string): string {
  return buildBlocks(showBases, hideBases) + stripGenerated(baseFilterText)
}
