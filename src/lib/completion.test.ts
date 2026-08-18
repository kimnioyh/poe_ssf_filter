import assert from 'node:assert'
import type { Unique } from './types'
import { computeBases, completedBases, incompleteBases, hideableBases } from './completion'
import { buildBlocks, buildFilter } from './buildFilter'
import { parseHiddenUniqueBases } from './neversink'

const u = (name: string, baseItem: string, grouping: string, owned: boolean, category = 'Amulet', tier = '3'): Unique => ({
  name, baseItem, category, grouping, owned, disambiguation: '', tier,
})

const data: Unique[] = [
  // Onyx Amulet: 2 droppable owned + 1 Uber (owned) + 1 Recipe (not owned)
  u('A', 'Onyx Amulet', 'T3', true),
  u('B', 'Onyx Amulet', 'T2', true),
  u('C', 'Onyx Amulet', 'Uber', true),
  u('RecipeOnly', 'Onyx Amulet', 'Recipe', false),
  // Paua Amulet: one droppable, not owned -> incomplete
  u('D', 'Paua Amulet', 'T4', false),
]

// Default droppable set: everything except Recipe/Vaal_Orb.
const opts = {
  includeGroupings: new Set(['T2', 'T3', 'T4', 'Uber']),
  excludeCategories: new Set<string>(),
}

const bases = computeBases(data, opts)

// Onyx Amulet: Recipe unique excluded, remaining 3 all owned -> complete.
const onyx = bases.find((b) => b.baseItem === 'Onyx Amulet')!
assert.equal(onyx.total, 3, 'Recipe grouping should be excluded from droppable set')
assert.equal(onyx.complete, true, 'Onyx Amulet all droppable owned -> complete')

// Paua Amulet incomplete.
assert.deepEqual(incompleteBases(bases), ['Paua Amulet'])
assert.deepEqual(completedBases(bases), ['Onyx Amulet'])

// protectTop: a completed base with a T0–T2 unique is not hidden when protecting.
const tierData: Unique[] = [
  u('Top', 'Gold Amulet', 'T2', true, 'Amulet', '1'), // tier 1 -> protected
  u('Low', 'Jade Amulet', 'T4', true, 'Amulet', '4'), // tier 4 -> hideable
]
const tierBases = computeBases(tierData, opts)
assert.deepEqual(hideableBases(tierBases, false).sort(), ['Gold Amulet', 'Jade Amulet'], 'no protection -> both hidden')
assert.deepEqual(hideableBases(tierBases, true), ['Jade Amulet'], 'protection keeps T0–T2 base visible')

// If Uber toggled OFF and its unique were unowned, base must stay incomplete.
const optsNoUber = { includeGroupings: new Set(['T2', 'T3', 'T4']), excludeCategories: new Set<string>() }
const onyx2 = computeBases(data, optsNoUber).find((b) => b.baseItem === 'Onyx Amulet')!
assert.equal(onyx2.total, 2, 'Uber excluded when toggled off')
assert.equal(onyx2.complete, true)

// buildBlocks: English BaseType, Show for incomplete + Hide for complete.
const need = incompleteBases(bases)
const done = completedBases(bases)
const blocks = buildBlocks(need, done)
assert.match(blocks, /Show[\s\S]*BaseType == "Paua Amulet"/, 'incomplete base -> Show')
assert.match(blocks, /Hide[\s\S]*BaseType == "Onyx Amulet"/, 'complete base -> Hide')
assert.match(blocks, /Rarity Unique/)

// base highlight: non-unique, non-corrupted Show block for searched bases.
const withHl = buildBlocks(need, done, { bases: ['Two-Toned Boots', 'Vaal Regalia'] })
assert.match(withHl, /Show[\s\S]*BaseType == "Two-Toned Boots" "Vaal Regalia"/, 'highlight bases listed')
assert.match(withHl, /Rarity Normal Magic Rare/, 'highlight targets non-unique rarities')
assert.match(withHl, /Corrupted False/, 'highlight excludes corrupted')
assert.doesNotMatch(buildBlocks(need, done), /Corrupted False/, 'no highlight block when none selected')

// currency hide: grouped by stack threshold; StackSize only when set.
const cur = buildBlocks(need, done, { bases: [] }, [
  { base: 'Scroll of Wisdom' },
  { base: 'Portal Scroll' },
  { base: 'Orb of Alteration', maxStack: 5 },
])
assert.match(cur, /Class == "Stackable Currency"[\s\S]*BaseType == "Scroll of Wisdom" "Portal Scroll"/, 'hide-all group')
assert.match(cur, /BaseType == "Orb of Alteration"\n\s*StackSize <= 5/, 'threshold group has StackSize')
assert.doesNotMatch(buildBlocks(need, done), /Stackable Currency/, 'no currency block when none selected')

// ilvl bounds only appear when set.
const withIlvl = buildBlocks(need, done, { bases: ['Vaal Regalia'], minIlvl: 84 })
assert.match(withIlvl, /ItemLevel >= 84/, 'min ilvl added')
assert.doesNotMatch(withIlvl, /ItemLevel <=/, 'max ilvl omitted when unset')
assert.match(
  buildBlocks(need, done, { bases: ['Vaal Regalia'], minIlvl: 84, maxIlvl: 86 }),
  /ItemLevel >= 84[\s\S]*ItemLevel <= 86/,
  'both bounds when set',
)

// category exclusion drops the base entirely.
const optsExcl = { includeGroupings: opts.includeGroupings, excludeCategories: new Set(['Amulet']) }
assert.equal(computeBases(data, optsExcl).length, 0, 'excluded category -> no bases')

// Idempotency: re-applying to an already-modified filter must not stack blocks.
const nsFilter = 'Show # existing rule\n    Rarity Rare\n'
const once = buildFilter(need, done, nsFilter)
const twice = buildFilter(need, done, once)
assert.equal(once, twice, 're-applying buildFilter must be idempotent')
assert.equal(once.match(/POE-SSF-FILTER GENERATED \(do not edit/g)?.length, 1, 'exactly one generated region')
assert.ok(once.endsWith(nsFilter), 'original filter text preserved at the end')

// parseHiddenUniqueBases: only Hide blocks with Rarity Unique count.
const nsSample = [
  'Show # shown unique',
  '\tRarity Unique',
  '\tBaseType == "Onyx Amulet"',
  '',
  'Hide # hideable uniques',
  '\tRarity Unique',
  '\tBaseType == "Coral Amulet" "Despot Axe"',
  '',
  'Hide # non-unique hide (ignored)',
  '\tRarity <= Normal',
  '\tBaseType == "Wool Shoes"',
].join('\n')
const hidden = parseHiddenUniqueBases(nsSample)
assert.ok(hidden.bases.has('Coral Amulet') && hidden.bases.has('Despot Axe'), 'unique Hide bases collected')
assert.ok(!hidden.bases.has('Onyx Amulet'), 'Show block not counted as hidden')
assert.ok(!hidden.bases.has('Wool Shoes'), 'non-unique Hide ignored')
assert.equal(hidden.all, false, 'no catch-all when every unique Hide has BaseType')
// catch-all: rarity-only unique Hide
assert.equal(parseHiddenUniqueBases('Hide\n\tRarity Unique\n').all, true, 'rarity-only unique Hide -> all')

console.log('completion.test.ts: all assertions passed')
