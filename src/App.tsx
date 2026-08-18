import { useEffect, useMemo, useState } from 'react'
import { useI18n, type Locale } from './i18n'
import { parseCsv } from './lib/parseCsv'
import sampleCsv from '../sample-uniques.csv?raw'
import baseTranslations from './data/base_translations.json'
import { computeBases, completedBases, incompleteBases, hideableBases, facets } from './lib/completion'
import { buildFilter, buildBlocks } from './lib/buildFilter'
import { localizeBase, localizeUnique, localizeCategory, uniqueImage } from './lib/nameMap'
import { NON_DROPPABLE_GROUPINGS, type Unique } from './lib/types'
import { PRESETS, fetchPreset, parseHiddenUniqueBases, type PresetId } from './lib/neversink'

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
    <div className="card">
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
  const [filterText, setFilterText] = useState<string | null>(null)
  const [preset, setPreset] = useState<PresetId>('1-REGULAR')
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSample, setIsSample] = useState(false)

  const { groupings, categories } = useMemo(
    () => (uniques ? facets(uniques) : { groupings: [], categories: [] }),
    [uniques],
  )

  const bases = useMemo(
    () => (uniques ? computeBases(uniques, { includeGroupings: include, excludeCategories: exclude }) : []),
    [uniques, include, exclude],
  )
  const done = completedBases(bases)
  const need = incompleteBases(bases)

  // Scope emphasis to uniques NeverSink actually hides (reads filter, never edits it).
  const [scopeHidden, setScopeHidden] = useState(true)
  const hidden = useMemo(
    () => (filterText ? parseHiddenUniqueBases(filterText) : null),
    [filterText],
  )
  const showBases = useMemo(() => {
    if (scopeHidden && hidden && !hidden.all) return need.filter((b) => hidden.bases.has(b))
    return need
  }, [need, scopeHidden, hidden])

  // Never hide bases that can drop a top-tier (T0–T2) unique.
  const [protectTop, setProtectTop] = useState(true)
  const hideBases = useMemo(() => hideableBases(bases, protectTop), [bases, protectTop])

  // Base-item highlight (non-unique). Searchable over EN/KO names.
  const [query, setQuery] = useState('')
  const [highlightBases, setHighlightBases] = useState<string[]>([])
  const [minIlvl, setMinIlvl] = useState('')
  const [maxIlvl, setMaxIlvl] = useState('')
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
  }
  const removeBase = (en: string) => setHighlightBases((p) => p.filter((b) => b !== en))

  // Owned uniques grouped by category (curation view; independent of filter options).
  const ownedByCat = useMemo(() => {
    const m = new Map<string, Unique[]>()
    for (const u of uniques ?? []) {
      if (!u.owned) continue
      const arr = m.get(u.category)
      if (arr) arr.push(u)
      else m.set(u.category, [u])
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [uniques])

  function applyUniques(parsed: Unique[], sample: boolean) {
    setUniques(parsed)
    // default: everything droppable except vaal/recipe groupings.
    const g = facets(parsed).groupings.filter((x) => !NON_DROPPABLE_GROUPINGS.includes(x as never))
    setInclude(new Set(g))
    setExclude(new Set())
    setIsSample(sample)
  }

  function loadCsv(file: File) {
    file.text().then((text) => applyUniques(parseCsv(text), false))
  }

  // Load the bundled all-unowned sample by default so the app isn't empty.
  useEffect(() => {
    applyUniques(parseCsv(sampleCsv), true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          <button className={locale === 'en' ? 'on' : ''} onClick={() => setLocale('en')}>EN</button>
          <button className={locale === 'ko' ? 'on' : ''} onClick={() => setLocale('ko')}>한국어</button>
        </div>
      </header>

      {isSample && <div className="notice">{t('sampleNotice')}</div>}

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
            <h2>{t('ownedByCategory')}</h2>
            {ownedByCat.length === 0 ? (
              <p className="hint">{t('noOwned')}</p>
            ) : (
              ownedByCat.map(([cat, list]) => (
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

          <section>
            <h2>{t('baseHighlight')}</h2>
            <p className="hint">{t('baseHighlightHelp')}</p>
            <input
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
            {matches.length > 0 && (
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
                download('SSF-modified.filter', buildFilter(showBases, hideBases, filterText, highlight))
              }
            >
              {t('download')}
            </button>
            <button onClick={() => download('SSF-blocks.filter', buildBlocks(showBases, hideBases, highlight))}>
              {t('downloadBlocks')}
            </button>
            {!filterText && <span className="hint">{t('noFilter')}</span>}
            <pre className="preview">{buildBlocks(showBases, hideBases, highlight)}</pre>
          </section>
        </>
      )}
    </main>
  )
}
