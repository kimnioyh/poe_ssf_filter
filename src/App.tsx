import { useEffect, useMemo, useState } from 'react'
import { useI18n, type Locale } from './i18n'
import { parseCsv } from './lib/parseCsv'
import sampleCsv from '../sample-uniques.csv?raw'
import baseTranslations from './data/base_translations.json'
import divCardNames from './data/div-cards.json'
import { CHANGELOG } from './data/changelog'
import { CURRENCIES, JUNK_CURRENCY } from './data/currencies'
import { FEEDBACK_URL } from './data/config'
import { computeBases, completedBases, incompleteBases, hideableBases, facets } from './lib/completion'
import { buildFilter, buildBlocks } from './lib/buildFilter'
import { localizeBase, localizeUnique, localizeCategory, uniqueImage } from './lib/nameMap'
import { NON_DROPPABLE_GROUPINGS, type Unique } from './lib/types'
import { PRESETS, fetchPreset, parseHiddenUniqueBases, type PresetId } from './lib/neversink'
import { loadSettings, saveSettings, shareUrl, type Settings } from './lib/settings'

// Saved prefs (localStorage) or a shared #s= link. filterText/uniques excluded.
const STORED = loadSettings()

/** One unique row: icon + localized name + disambiguation label. */
function UniqueItem({ u, locale }: { u: Unique; locale: Locale }) {
  const img = uniqueImage(u.name)
  return (
    <li>
      {img && <img src={`${import.meta.env.BASE_URL}${img}`} alt="" loading="lazy" />}
      {localizeUnique(u.name, locale)}
      {u.disambiguation && <span className="disamb">{u.disambiguation}</span>}
    </li>
  )
}

/** PoE-ladder-style item card: art on top, name + disambiguation below. */
function UniqueCard({ u, locale }: { u: Unique; locale: Locale }) {
  const img = uniqueImage(u.name)
  return (
    <div className={u.owned ? 'card' : 'card unowned'}>
      <div className="card-art">
        {img && <img src={`${import.meta.env.BASE_URL}${img}`} alt="" loading="lazy" />}
      </div>
      <div className="card-name">{localizeUnique(u.name, locale)}</div>
      {u.disambiguation && <div className="card-disamb">{u.disambiguation}</div>}
    </div>
  )
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function App() {
  const { t, locale, setLocale } = useI18n()
  const [uniques, setUniques] = useState<Unique[] | null>(null)
  const [include, setInclude] = useState<Set<string>>(new Set())
  const [exclude, setExclude] = useState<Set<string>>(new Set())
  const [excludeLeagues, setExcludeLeagues] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState<string | null>(null)
  const [preset, setPreset] = useState<PresetId>((STORED?.preset as PresetId) ?? '1-REGULAR')
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSample, setIsSample] = useState(false)
  const [view, setView] = useState<'filter' | 'collection'>('filter')
  const [showChangelog, setShowChangelog] = useState(false)

  const { groupings, categories, leagues } = useMemo(
    () => (uniques ? facets(uniques) : { groupings: [], categories: [], leagues: [] }),
    [uniques],
  )

  const bases = useMemo(
    () =>
      uniques
        ? computeBases(uniques, { includeGroupings: include, excludeCategories: exclude, excludeLeagues })
        : [],
    [uniques, include, exclude, excludeLeagues],
  )
  const done = completedBases(bases)
  const need = incompleteBases(bases)

  // Scope emphasis to uniques NeverSink actually hides (reads filter, never edits it).
  const [scopeHidden, setScopeHidden] = useState(STORED?.scopeHidden ?? true)
  const hidden = useMemo(
    () => (filterText ? parseHiddenUniqueBases(filterText) : null),
    [filterText],
  )
  const showBases = useMemo(() => {
    if (scopeHidden && hidden && !hidden.all) return need.filter((b) => hidden.bases.has(b))
    return need
  }, [need, scopeHidden, hidden])

  // Never hide bases that can drop a top-tier (T0–T2) unique.
  const [protectTop, setProtectTop] = useState(STORED?.protectTop ?? true)
  const hideBases = useMemo(() => hideableBases(bases, protectTop), [bases, protectTop])

  // Per-currency hiding. Record key present = hide; value = stack threshold ('' = hide all).
  const [currencyHide, setCurrencyHide] = useState<Record<string, string>>(STORED?.currencyHide ?? {})
  const currencyHides = useMemo(
    () =>
      Object.entries(currencyHide).map(([base, th]) => ({
        base,
        maxStack: th.trim() === '' ? undefined : Number(th),
      })),
    [currencyHide],
  )
  const toggleCurrency = (en: string) =>
    setCurrencyHide((p) => {
      const n = { ...p }
      if (en in n) delete n[en]
      else n[en] = ''
      return n
    })
  const setCurrencyThreshold = (en: string, v: string) => setCurrencyHide((p) => ({ ...p, [en]: v }))
  const selectJunkCurrency = () =>
    setCurrencyHide((p) => ({ ...p, ...Object.fromEntries(JUNK_CURRENCY.map((c) => [c, ''])) }))

  // Base-item highlight (non-unique). Searchable over EN/KO names.
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [highlightBases, setHighlightBases] = useState<string[]>(STORED?.highlightBases ?? [])
  const [minIlvl, setMinIlvl] = useState(STORED?.minIlvl ?? '')
  const [maxIlvl, setMaxIlvl] = useState(STORED?.maxIlvl ?? '')
  const highlight = useMemo(
    () => ({
      bases: highlightBases,
      minIlvl: minIlvl.trim() === '' ? undefined : Number(minIlvl),
      maxIlvl: maxIlvl.trim() === '' ? undefined : Number(maxIlvl),
    }),
    [highlightBases, minIlvl, maxIlvl],
  )
  const baseEntries = useMemo(
    () => Object.entries(baseTranslations as Record<string, string>),
    [],
  )
  const matches = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    const ql = q.toLowerCase()
    return baseEntries
      .filter(([en, ko]) => !highlightBases.includes(en) && (en.toLowerCase().includes(ql) || ko.includes(q)))
      .slice(0, 20)
  }, [query, baseEntries, highlightBases])
  const addBase = (en: string) => {
    setHighlightBases((p) => (p.includes(en) ? p : [...p, en]))
    setQuery('')
    setSearchOpen(false)
  }
  const removeBase = (en: string) => setHighlightBases((p) => p.filter((b) => b !== en))

  // Highlight-by-unique (separate block, Rarity Unique only — no Normal/Magic/Rare).
  const [uniqueBases, setUniqueBases] = useState<string[]>(STORED?.uniqueBases ?? [])
  const [uQuery, setUQuery] = useState('')
  const [uSearchOpen, setUSearchOpen] = useState(false)
  const uniqueMatches = useMemo(() => {
    const q = uQuery.trim()
    if (!q || !uniques) return []
    const ql = q.toLowerCase()
    const seen = new Set<string>()
    const out: { name: string; base: string }[] = []
    for (const u of uniques) {
      if (u.name.toLowerCase().includes(ql) || localizeUnique(u.name, 'ko').includes(q)) {
        const key = `${u.name}|${u.baseItem}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ name: u.name, base: u.baseItem })
        if (out.length >= 20) break
      }
    }
    return out
  }, [uQuery, uniques])
  const addUniqueBase = (base: string) => {
    setUniqueBases((p) => (p.includes(base) ? p : [...p, base]))
    setUQuery('')
    setUSearchOpen(false)
  }
  const removeUniqueBase = (base: string) => setUniqueBases((p) => p.filter((b) => b !== base))

  // Divination card hide. Search over EN/KO card names; selected cards are hidden.
  const [divCards, setDivCards] = useState<string[]>(STORED?.divCards ?? [])
  const [dQuery, setDQuery] = useState('')
  const [dSearchOpen, setDSearchOpen] = useState(false)
  const cardEntries = useMemo(() => Object.entries(divCardNames as Record<string, string>), [])
  const localizeCard = (en: string) => (locale === 'ko' ? (divCardNames as Record<string, string>)[en] ?? en : en)
  const cardMatches = useMemo(() => {
    const q = dQuery.trim()
    if (!q) return []
    const ql = q.toLowerCase()
    return cardEntries
      .filter(([en, ko]) => !divCards.includes(en) && (en.toLowerCase().includes(ql) || ko.includes(q)))
      .slice(0, 20)
  }, [dQuery, cardEntries, divCards])
  const addDivCard = (en: string) => {
    setDivCards((p) => (p.includes(en) ? p : [...p, en]))
    setDQuery('')
    setDSearchOpen(false)
  }
  const removeDivCard = (en: string) => setDivCards((p) => p.filter((c) => c !== en))

  // Curation view: uniques grouped by category. 'owned' = only owned, 'all' = all.
  const [collFilter, setCollFilter] = useState<'owned' | 'all'>('owned')
  const [collQuery, setCollQuery] = useState('')
  const byCat = useMemo(() => {
    const q = collQuery.trim().toLowerCase()
    const m = new Map<string, Unique[]>()
    for (const u of uniques ?? []) {
      if (collFilter === 'owned' && !u.owned) continue
      if (q && !u.name.toLowerCase().includes(q) && !localizeUnique(u.name, 'ko').toLowerCase().includes(q)) continue
      const arr = m.get(u.category)
      if (arr) arr.push(u)
      else m.set(u.category, [u])
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [uniques, collFilter, collQuery])
  const collStats = useMemo(() => {
    const total = uniques?.length ?? 0
    const owned = uniques?.filter((u) => u.owned).length ?? 0
    return { total, owned, pct: total ? Math.round((owned / total) * 100) : 0 }
  }, [uniques])

  function applyUniques(parsed: Unique[], sample: boolean) {
    setUniques(parsed)
    // default: everything droppable except vaal/recipe groupings.
    const g = facets(parsed).groupings.filter((x) => !NON_DROPPABLE_GROUPINGS.includes(x as never))
    setInclude(new Set(g))
    setExclude(new Set())
    setExcludeLeagues(new Set())
    setIsSample(sample)
  }

  function loadCsv(file: File) {
    file.text().then((text) => applyUniques(parseCsv(text), false))
  }

  // Load the bundled all-unowned sample by default, then overlay stored set-prefs
  // (applyUniques resets include/exclude/leagues to defaults; restore saved ones).
  useEffect(() => {
    applyUniques(parseCsv(sampleCsv), true)
    if (STORED?.include) setInclude(new Set(STORED.include))
    if (STORED?.exclude) setExclude(new Set(STORED.exclude))
    if (STORED?.excludeLeagues) setExcludeLeagues(new Set(STORED.excludeLeagues))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist current knobs to localStorage on any change.
  const settings: Settings = useMemo(
    () => ({
      preset,
      include: [...include],
      exclude: [...exclude],
      excludeLeagues: [...excludeLeagues],
      scopeHidden,
      protectTop,
      currencyHide,
      highlightBases,
      uniqueBases,
      divCards,
      minIlvl,
      maxIlvl,
    }),
    [preset, include, exclude, excludeLeagues, scopeHidden, protectTop, currencyHide, highlightBases, uniqueBases, divCards, minIlvl, maxIlvl],
  )
  useEffect(() => saveSettings(settings), [settings])

  const [shared, setShared] = useState(false)
  const onShare = () =>
    navigator.clipboard.writeText(shareUrl(settings)).then(() => {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    })

  const toggle = (set: Set<string>, key: string, apply: (s: Set<string>) => void) => {
    const next = new Set(set)
    next.has(key) ? next.delete(key) : next.add(key)
    apply(next)
  }

  async function onFetchPreset() {
    setFetching(true)
    setError(null)
    try {
      setFilterText(await fetchPreset(preset))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setFetching(false)
    }
  }

  return (
    <main>
      <header>
        <h1>{t('title')}</h1>
        <p className="tagline">{t('tagline')}</p>
        <div className="locale">
          {FEEDBACK_URL && (
            <a className="feedback-link" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
              {t('feedback')}
            </a>
          )}
          <button onClick={onShare}>{shared ? t('shareCopied') : t('share')}</button>
          <button onClick={() => setShowChangelog(true)}>{t('changelog')}</button>
          <button className={locale === 'en' ? 'on' : ''} onClick={() => setLocale('en')}>EN</button>
          <button className={locale === 'ko' ? 'on' : ''} onClick={() => setLocale('ko')}>한국어</button>
        </div>
      </header>

      {showChangelog && (
        <div className="modal-backdrop" onClick={() => setShowChangelog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{t('changelog')}</h2>
              <button onClick={() => setShowChangelog(false)}>✕</button>
            </div>
            <ul className="changelog">
              {CHANGELOG.map((c) => (
                <li key={c.version}>
                  <strong>{c.version}</strong> — {locale === 'ko' ? c.ko : c.en}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isSample && <div className="notice">{t('sampleNotice')}</div>}

      <nav className="tabs">
        <button className={view === 'filter' ? 'on' : ''} onClick={() => setView('filter')}>
          {t('tabFilter')}
        </button>
        <button className={view === 'collection' ? 'on' : ''} onClick={() => setView('collection')}>
          {t('tabCollection')}
        </button>
      </nav>

      {view === 'filter' && (
      <>
      <section>
        <h2>{t('step1')}</h2>
        <p className="hint">{t('csvHint')}</p>
        <input
          type="file"
          accept=".csv"
          onClick={(e) => ((e.target as HTMLInputElement).value = '')}
          onChange={(e) => e.target.files?.[0] && loadCsv(e.target.files[0])}
        />
        {uniques && <span className="ok">{t('uploaded', { n: uniques.length })}</span>}
      </section>

      {uniques && (
        <>
          <section>
            <h2>{t('step2')}</h2>
            <label className="filebtn">
              {t('uploadFilter')}
              <input
                type="file"
                accept=".filter,.txt"
                hidden
                onClick={(e) => ((e.target as HTMLInputElement).value = '')}
                onChange={(e) => e.target.files?.[0] && e.target.files[0].text().then(setFilterText)}
              />
            </label>
            <span className="or">{t('orPreset')}:</span>
            <select value={preset} onChange={(e) => setPreset(e.target.value as PresetId)}>
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <button onClick={onFetchPreset} disabled={fetching}>{fetching ? t('fetching') : t('fetch')}</button>
            {filterText && <span className="ok">{t('filterLoaded', { n: filterText.length })}</span>}
            {error && <span className="err">{error}</span>}
          </section>

          <section>
            <h2>{t('step3')}</h2>
            <fieldset>
              <legend>{t('droppableGroupings')}</legend>
              {groupings.map((g) => (
                <label key={g}>
                  <input type="checkbox" checked={include.has(g)} onChange={() => toggle(include, g, setInclude)} />
                  {g}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>{t('excludeCategories')}</legend>
              {categories.map((c) => (
                <label key={c}>
                  <input type="checkbox" checked={exclude.has(c)} onChange={() => toggle(exclude, c, setExclude)} />
                  {localizeCategory(c, locale)}
                </label>
              ))}
            </fieldset>
            {leagues.length > 0 && (
              <fieldset>
                <legend>{t('excludeLeagues')}</legend>
                {leagues.map((l) => (
                  <label key={l}>
                    <input type="checkbox" checked={excludeLeagues.has(l)} onChange={() => toggle(excludeLeagues, l, setExcludeLeagues)} />
                    {l}
                  </label>
                ))}
              </fieldset>
            )}
          </section>

          <section className="lists">
            <div>
              <h3>{t('completeBases')} ({done.length})</h3>
              <ul>{done.map((b) => <li key={b}>{localizeBase(b, locale)}</li>)}</ul>
            </div>
            <div>
              <h3>{t('incompleteBases')} ({need.length})</h3>
              <ul>
                {bases.filter((b) => !b.complete).map((b) => (
                  <li key={b.baseItem}>
                    <details>
                      <summary>
                        {localizeBase(b.baseItem, locale)}{' '}
                        <em>{t('ownedOf', { owned: b.owned, total: b.total })}</em>
                      </summary>
                      <ul className="need-detail">
                        {b.uniques
                          .filter((un) => !un.owned)
                          .map((un, i) => (
                            <UniqueItem key={`${un.name}|${un.disambiguation}|${i}`} u={un} locale={locale} />
                          ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2>{t('baseHighlight')}</h2>
            <p className="hint">{t('baseHighlightHelp')}</p>
            <input
              className="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder={t('searchPlaceholder')}
            />
            {searchOpen && matches.length > 0 && (
              <ul className="search-results">
                {matches.map(([en, ko]) => (
                  <li key={en}>
                    <button onClick={() => addBase(en)}>
                      {localizeBase(en, locale)} <span className="en">{locale === 'ko' ? en : ko}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {highlightBases.length > 0 && (
              <div className="chips">
                {highlightBases.map((en) => (
                  <span key={en} className="chip" onClick={() => removeBase(en)}>
                    {localizeBase(en, locale)} ✕
                  </span>
                ))}
              </div>
            )}
            <div className="ilvl">
              <label>
                {t('minIlvl')}
                <input type="number" min={0} max={100} value={minIlvl} onChange={(e) => setMinIlvl(e.target.value)} />
              </label>
              <label>
                {t('maxIlvl')}
                <input type="number" min={0} max={100} value={maxIlvl} onChange={(e) => setMaxIlvl(e.target.value)} />
              </label>
            </div>
          </section>

          <section>
            <h2>{t('uniqueHighlight')}</h2>
            <p className="hint">{t('uniqueHighlightHelp')}</p>
            <input
              className="search"
              value={uQuery}
              onChange={(e) => {
                setUQuery(e.target.value)
                setUSearchOpen(true)
              }}
              onFocus={() => setUSearchOpen(true)}
              onBlur={() => setTimeout(() => setUSearchOpen(false), 150)}
              placeholder={t('uniqueSearchPlaceholder')}
            />
            {uSearchOpen && uniqueMatches.length > 0 && (
              <ul className="search-results">
                {uniqueMatches.map((m) => (
                  <li key={`${m.name}|${m.base}`}>
                    <button onClick={() => addUniqueBase(m.base)}>
                      {localizeUnique(m.name, locale)}{' '}
                      <span className="en">{localizeBase(m.base, locale)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {uniqueBases.length > 0 && (
              <div className="chips">
                {uniqueBases.map((b) => (
                  <span key={b} className="chip" onClick={() => removeUniqueBase(b)}>
                    {localizeBase(b, locale)} ✕
                  </span>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2>{t('currencyHide')}</h2>
            <p className="hint">{t('currencyHideHelp')}</p>
            <button className="preset-btn" onClick={selectJunkCurrency}>{t('selectJunk')}</button>
            <div className="cur-list">
              {CURRENCIES.map((c) => {
                const on = c.en in currencyHide
                return (
                  <label key={c.en} className="cur-row">
                    <input type="checkbox" checked={on} onChange={() => toggleCurrency(c.en)} />
                    <span className="cur-name">{locale === 'ko' ? c.ko : c.en}</span>
                    <input
                      type="number"
                      className="cur-th"
                      min={1}
                      placeholder={t('stackAll')}
                      value={currencyHide[c.en] ?? ''}
                      disabled={!on}
                      onChange={(e) => setCurrencyThreshold(c.en, e.target.value)}
                    />
                  </label>
                )
              })}
            </div>
          </section>

          <section>
            <h2>{t('divCardHide')}</h2>
            <p className="hint">{t('divCardHideHelp')}</p>
            <input
              className="search"
              value={dQuery}
              onChange={(e) => {
                setDQuery(e.target.value)
                setDSearchOpen(true)
              }}
              onFocus={() => setDSearchOpen(true)}
              onBlur={() => setTimeout(() => setDSearchOpen(false), 150)}
              placeholder={t('divCardSearchPlaceholder')}
            />
            {dSearchOpen && cardMatches.length > 0 && (
              <ul className="search-results">
                {cardMatches.map(([en, ko]) => (
                  <li key={en}>
                    <button onClick={() => addDivCard(en)}>
                      {localizeCard(en)} <span className="en">{locale === 'ko' ? en : ko}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {divCards.length > 0 && (
              <div className="chips">
                {divCards.map((en) => (
                  <span key={en} className="chip" onClick={() => removeDivCard(en)}>
                    {localizeCard(en)} ✕
                  </span>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2>{t('step4')}</h2>
            <label className="scope">
              <input type="checkbox" checked={scopeHidden} onChange={() => setScopeHidden((v) => !v)} />
              {t('scopeHidden')}
            </label>
            <p className="hint">
              {t('scopeHiddenHelp')}
              {filterText && scopeHidden && (
                <> {t('scopeHiddenCount', { show: showBases.length, need: need.length })}</>
              )}
            </p>
            <label className="scope">
              <input type="checkbox" checked={protectTop} onChange={() => setProtectTop((v) => !v)} />
              {t('protectTop')}
            </label>
            <p className="hint">{t('protectTopHelp')}</p>
            <button
              disabled={!filterText}
              onClick={() =>
                filterText &&
                download('SSF-modified.filter', buildFilter(showBases, hideBases, filterText, highlight, currencyHides, uniqueBases, divCards))
              }
            >
              {t('download')}
            </button>
            <button onClick={() => download('SSF-blocks.filter', buildBlocks(showBases, hideBases, highlight, currencyHides, uniqueBases, divCards))}>
              {t('downloadBlocks')}
            </button>
            {!filterText && <span className="hint">{t('noFilter')}</span>}
            {filterText && (
              <p className="hint">
                {t('finalLines', {
                  n: buildFilter(showBases, hideBases, filterText, highlight, currencyHides, uniqueBases, divCards).split('\n').length,
                })}
              </p>
            )}
            <pre className="preview">{buildBlocks(showBases, hideBases, highlight, currencyHides, uniqueBases, divCards)}</pre>
          </section>
        </>
      )}
      </>
      )}

      {view === 'collection' && uniques && (
        <section>
          <div className="coll-head">
            <h2>{t('ownedByCategory')}</h2>
            <select value={collFilter} onChange={(e) => setCollFilter(e.target.value as 'owned' | 'all')}>
              <option value="owned">{t('collOwned')}</option>
              <option value="all">{t('collAll')}</option>
            </select>
          </div>
          <div className="progress">
            <div className="progress-bar"><span style={{ width: `${collStats.pct}%` }} /></div>
            <span className="progress-label">
              {t('collProgress', { owned: collStats.owned, total: collStats.total, pct: collStats.pct })}
            </span>
          </div>
          <input
            className="search"
            value={collQuery}
            onChange={(e) => setCollQuery(e.target.value)}
            placeholder={t('collSearchPlaceholder')}
          />
          {byCat.length === 0 ? (
            <p className="hint">{t('noOwned')}</p>
          ) : (
            byCat.map(([cat, list]) => (
              <details key={cat} className="curation" open>
                <summary>
                  {localizeCategory(cat, locale)} <em>({list.length})</em>
                </summary>
                <div className="card-grid">
                  {list.map((u, i) => (
                    <UniqueCard key={`${u.name}|${u.disambiguation}|${i}`} u={u} locale={locale} />
                  ))}
                </div>
              </details>
            ))
          )}
        </section>
      )}
    </main>
  )
}
