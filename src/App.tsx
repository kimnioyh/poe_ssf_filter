import { useMemo, useState } from 'react'
import { useI18n } from './i18n'
import { parseCsv } from './lib/parseCsv'
import { computeBases, completedBases, incompleteBases, facets } from './lib/completion'
import { buildFilter, buildBlocks } from './lib/buildFilter'
import { localizeBase } from './lib/nameMap'
import { NON_DROPPABLE_GROUPINGS, type Unique } from './lib/types'
import { PRESETS, fetchPreset, type PresetId } from './lib/neversink'

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

  function loadCsv(file: File) {
    file.text().then((text) => {
      const parsed = parseCsv(text)
      setUniques(parsed)
      // default: everything droppable except vaal/recipe groupings.
      const g = facets(parsed).groupings.filter((x) => !NON_DROPPABLE_GROUPINGS.includes(x as never))
      setInclude(new Set(g))
      setExclude(new Set())
    })
  }

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
                  {localizeBase(c, locale)}
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
                    {localizeBase(b.baseItem, locale)} <em>{t('ownedOf', { owned: b.owned, total: b.total })}</em>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2>{t('step4')}</h2>
            <button
              disabled={!filterText}
              onClick={() => filterText && download('SSF-modified.filter', buildFilter(bases, filterText))}
            >
              {t('download')}
            </button>
            <button onClick={() => download('SSF-blocks.filter', buildBlocks(bases))}>
              {t('downloadBlocks')}
            </button>
            {!filterText && <span className="hint">{t('noFilter')}</span>}
            <pre className="preview">{buildBlocks(bases)}</pre>
          </section>
        </>
      )}
    </main>
  )
}
