const RAW_BASE =
  'https://raw.githubusercontent.com/NeverSinkDev/NeverSink-Filter/master'

// ponytail: master 브랜치 고정. 파일명 리네임되면 이 목록만 수정.
export const PRESETS = [
  { id: '0-SOFT', label: '0 - Soft' },
  { id: '1-REGULAR', label: '1 - Regular' },
  { id: '2-SEMI-STRICT', label: '2 - Semi-Strict' },
  { id: '3-STRICT', label: '3 - Strict' },
  { id: '4-VERY-STRICT', label: '4 - Very Strict' },
  { id: '5-UBER-STRICT', label: '5 - Uber Strict' },
  { id: '6-UBER-PLUS-STRICT', label: '6 - Uber-Plus Strict' },
] as const

export type PresetId = (typeof PRESETS)[number]['id']

export async function fetchPreset(id: PresetId): Promise<string> {
  const url = `${RAW_BASE}/${encodeURIComponent(`NeverSink's filter - ${id}.filter`)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`프리셋 다운로드 실패 (${res.status})`)
  return res.text()
}

/**
 * Scan a filter for the unique BaseTypes it HIDES (read-only; never edits it).
 * A `Hide` block with `Rarity Unique` and BaseTypes -> those bases are hidden.
 * A `Rarity Unique` Hide with no BaseType -> catch-all: all uniques hidden (`all`).
 */
export function parseHiddenUniqueBases(filter: string): { bases: Set<string>; all: boolean } {
  const bases = new Set<string>()
  let all = false
  let cur: string[] | null = null
  let curType: 'Show' | 'Hide' | null = null

  const flush = () => {
    if (curType !== 'Hide' || !cur) return
    const hidesUnique = cur.some((l) => /^\s*Rarity\b/.test(l) && /\bUnique\b/.test(l))
    if (!hidesUnique) return
    const baseLines = cur.filter((l) => /^\s*BaseType\b/.test(l))
    if (baseLines.length === 0) all = true
    else for (const bl of baseLines) for (const m of bl.matchAll(/"([^"]+)"/g)) bases.add(m[1])
  }

  for (const line of filter.split(/\r?\n/)) {
    const m = /^(Show|Hide)\b/.exec(line)
    if (m) {
      flush()
      curType = m[1] as 'Show' | 'Hide'
      cur = [line]
    } else if (cur) {
      cur.push(line)
    }
  }
  flush()
  return { bases, all }
}
