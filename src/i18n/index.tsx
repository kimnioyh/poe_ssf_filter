import { createContext, useContext, useState, type ReactNode } from 'react'
import { en, type MessageKey } from './en'
import { ko } from './ko'

export type Locale = 'en' | 'ko'
const dicts: Record<Locale, Record<MessageKey, string>> = { en, ko }

interface Ctx {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<Ctx | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  const t = (key: MessageKey, vars?: Record<string, string | number>) => {
    let s = dicts[locale][key] ?? en[key]
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
    return s
  }
  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function useI18n(): Ctx {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider')
  return ctx
}
