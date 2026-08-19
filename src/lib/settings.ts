// Persisted / shareable user settings. filterText & uniques are NOT stored
// (too large / re-fetchable); only the knobs are.
export interface Settings {
  preset: string
  include: string[]
  exclude: string[]
  excludeLeagues: string[]
  scopeHidden: boolean
  protectTop: boolean
  alertNeeded: boolean
  currencyHide: Record<string, string>
  highlightBases: string[]
  uniqueBases: string[]
  divCards: string[]
  minIlvl: string
  maxIlvl: string
}

const KEY = 'poe-ssf-settings'

// btoa can't handle unicode directly; escape/unescape is the standard workaround.
export const encodeSettings = (s: Settings) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(s))))

export function decodeSettings(raw: string): Partial<Settings> | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(raw))))
  } catch {
    return null
  }
}

/** URL hash (#s=…) wins over localStorage so shared links override saved prefs. */
export function loadSettings(): Partial<Settings> | null {
  const m = location.hash.match(/[#&]s=([^&]+)/)
  if (m) return decodeSettings(m[1])
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<Settings>) : null
  } catch {
    return null
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* private mode / quota — ignore */
  }
}

export function shareUrl(s: Settings): string {
  return `${location.origin}${location.pathname}#s=${encodeSettings(s)}`
}
