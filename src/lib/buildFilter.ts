const BEGIN = '# >>> POE-SSF-FILTER GENERATED (do not edit this region) >>>'
const END = '# <<< POE-SSF-FILTER GENERATED <<<'

const quote = (bases: string[]) => bases.map((b) => `"${b}"`).join(' ')

export interface CurrencyHide {
  base: string
  /** hide when StackSize <= maxStack; undefined = hide entirely. */
  maxStack?: number
}

/** One Hide block per distinct stack threshold (entire-hide grouped together). */
function currencyBlocks(hides: CurrencyHide[]): string {
  if (hides.length === 0) return ''
  const byThreshold = new Map<number | undefined, string[]>()
  for (const h of hides) {
    const arr = byThreshold.get(h.maxStack)
    if (arr) arr.push(h.base)
    else byThreshold.set(h.maxStack, [h.base])
  }
  let out = ''
  for (const [th, bases] of byThreshold) {
    const lines = [
      `# SSF currency hide (generated)${th != null ? ` — StackSize <= ${th}` : ''}`,
      'Hide',
      '    Class == "Stackable Currency"',
      `    BaseType == ${quote(bases)}`,
    ]
    if (th != null) lines.push(`    StackSize <= ${th}`)
    out += lines.join('\n') + '\n\n'
  }
  return out
}

/** Hide specific divination cards by name (Class "Divination Card"). */
function divCardBlock(cards: string[]): string {
  if (cards.length === 0) return ''
  return [
    '# SSF divination card hide (generated)',
    'Hide',
    '    Class == "Divination Card"',
    `    BaseType == ${quote(cards)}`,
  ].join('\n') + '\n\n'
}

/** BaseType is ALWAYS English (game filter matches internal English names). */
function block(comment: string, verb: 'Show' | 'Hide', bases: string[], extra: string[] = []): string {
  if (bases.length === 0) return ''
  const lines = [
    `# ${comment}`,
    verb,
    `    Rarity Unique`,
    `    BaseType == ${quote(bases)}`,
    ...extra.map((e) => `    ${e}`),
  ]
  return lines.join('\n') + '\n\n'
}

export interface HighlightOpts {
  bases: string[]
  minIlvl?: number
  maxIlvl?: number
}

/** Force-show + highlight specific base items (non-unique, non-corrupted). */
function highlightBlock({ bases, minIlvl, maxIlvl }: HighlightOpts): string {
  if (bases.length === 0) return ''
  const lines = [
    '# SSF base highlight (generated)',
    'Show',
    `    BaseType == ${quote(bases)}`,
    '    Rarity Normal Magic Rare',
    '    Corrupted False',
  ]
  if (minIlvl != null) lines.push(`    ItemLevel >= ${minIlvl}`)
  if (maxIlvl != null) lines.push(`    ItemLevel <= ${maxIlvl}`)
  lines.push(
    '    SetBorderColor 0 180 255',
    '    SetFontSize 40',
    '    MinimapIcon 1 Cyan Diamond',
    '    PlayEffect Cyan',
  )
  return lines.join('\n') + '\n\n'
}

/** Force-show ONLY the uniques on the given bases (no Normal/Magic/Rare). */
function uniqueHighlightBlock(bases: string[]): string {
  if (bases.length === 0) return ''
  return [
    '# SSF unique highlight (generated)',
    'Show',
    `    BaseType == ${quote(bases)}`,
    '    Rarity Unique',
    '    SetBorderColor 255 0 255',
    '    SetFontSize 45',
    '    MinimapIcon 0 Pink Star',
    '    PlayEffect Pink',
  ].join('\n') + '\n\n'
}

/**
 * Generate the prepended blocks, wrapped in sentinel markers.
 * @param showBases still-needed unique bases to force-show + emphasize
 * @param hideBases fully-collected unique bases to hide
 * @param highlightBases specific base items to highlight (Normal/Magic/Rare)
 */
export function buildBlocks(
  showBases: string[],
  hideBases: string[],
  highlight: HighlightOpts = { bases: [] },
  currencyHides: CurrencyHide[] = [],
  uniqueHighlight: string[] = [],
  divCards: string[] = [],
  alertNeeded = false,
): string {
  // Loud alert (toggle): a busy screen easily swallows the one drop this tool
  // exists to surface, so opt into minimap icon + sound + beam.
  const showExtra = ['SetBorderColor 255 200 0']
  if (alertNeeded)
    showExtra.push(
      'SetFontSize 45',
      'MinimapIcon 0 Yellow Star',
      'PlayEffect Yellow',
      'PlayAlertSound 6 300',
    )
  const show = block('SSF still-needed uniques (generated)', 'Show', showBases, showExtra)
  const hide = block('SSF collected-base hide (generated)', 'Hide', hideBases)
  return `${BEGIN}\n\n${currencyBlocks(currencyHides)}${divCardBlock(divCards)}${uniqueHighlightBlock(uniqueHighlight)}${highlightBlock(highlight)}${show}${hide}${END}\n\n`
}

/** Remove a previously generated region so re-applying stays idempotent. */
export function stripGenerated(text: string): string {
  const re = new RegExp(`${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}\\n*`, 'g')
  return text.replace(re, '')
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Prepend generated blocks, stripping any prior region first (idempotent). */
export function buildFilter(
  showBases: string[],
  hideBases: string[],
  baseFilterText: string,
  highlight: HighlightOpts = { bases: [] },
  currencyHides: CurrencyHide[] = [],
  uniqueHighlight: string[] = [],
  divCards: string[] = [],
  alertNeeded = false,
): string {
  return buildBlocks(showBases, hideBases, highlight, currencyHides, uniqueHighlight, divCards, alertNeeded) + stripGenerated(baseFilterText)
}
