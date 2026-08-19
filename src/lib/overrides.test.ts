import assert from 'node:assert'
import type { Unique } from './types'
import { applyOverrides, overrideKey } from './overrides'

const u = (name: string, owned: boolean, disambiguation = '', baseItem = 'Base'): Unique => ({
  name, baseItem, category: 'Amulet', grouping: 'T3', owned, disambiguation, tier: '3', league: '',
})

const data = [
  u('Headhunter', false),
  u('Grand Spectrum', false, 'Crit'),
  u('Grand Spectrum', true, 'Elemental'),
]

// No overrides -> untouched (same objects, no copies).
assert.deepEqual(applyOverrides(data, {}), data)
assert.equal(applyOverrides(data, {})[0], data[0], 'no override -> same object')

// Override flips only the matching variant.
const flipped = applyOverrides(data, { [overrideKey(data[0])]: true, [overrideKey(data[2])]: false })
assert.equal(flipped[0].owned, true, 'Headhunter overridden to owned')
assert.equal(flipped[1].owned, false, 'untouched variant keeps CSV value')
assert.equal(flipped[2].owned, false, 'Elemental variant overridden to unowned')

// Same-name variants get distinct keys.
assert.notEqual(overrideKey(data[1]), overrideKey(data[2]), 'disambiguation separates keys')

// Stale keys (from an older CSV) are ignored.
assert.deepEqual(applyOverrides(data, { 'Gone|Base|': true }), data)

console.log('overrides.test.ts: all assertions passed')
