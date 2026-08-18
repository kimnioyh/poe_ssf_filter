import assert from 'node:assert'
import type { Unique } from './types'
import { computeBases, completedBases, incompleteBases } from './completion'
import { buildBlocks, buildFilter } from './buildFilter'

const u = (name: string, baseItem: string, grouping: string, owned: boolean, category = 'Amulet'): Unique => ({
  name, baseItem, category, grouping, owned,
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

// If Uber toggled OFF and its unique were unowned, base must stay incomplete.
const optsNoUber = { includeGroupings: new Set(['T2', 'T3', 'T4']), excludeCategories: new Set<string>() }
const onyx2 = computeBases(data, optsNoUber).find((b) => b.baseItem === 'Onyx Amulet')!
assert.equal(onyx2.total, 2, 'Uber excluded when toggled off')
assert.equal(onyx2.complete, true)

// buildBlocks: English BaseType, Show for incomplete + Hide for complete.
const blocks = buildBlocks(bases)
assert.match(blocks, /Show[\s\S]*BaseType == "Paua Amulet"/, 'incomplete base -> Show')
assert.match(blocks, /Hide[\s\S]*BaseType == "Onyx Amulet"/, 'complete base -> Hide')
assert.match(blocks, /Rarity Unique/)

// category exclusion drops the base entirely.
const optsExcl = { includeGroupings: opts.includeGroupings, excludeCategories: new Set(['Amulet']) }
assert.equal(computeBases(data, optsExcl).length, 0, 'excluded category -> no bases')

// Idempotency: re-applying to an already-modified filter must not stack blocks.
const nsFilter = 'Show # existing rule\n    Rarity Rare\n'
const once = buildFilter(bases, nsFilter)
const twice = buildFilter(bases, once)
assert.equal(once, twice, 're-applying buildFilter must be idempotent')
assert.equal(once.match(/POE-SSF-FILTER GENERATED \(do not edit/g)?.length, 1, 'exactly one generated region')
assert.ok(once.endsWith(nsFilter), 'original filter text preserved at the end')

console.log('completion.test.ts: all assertions passed')
