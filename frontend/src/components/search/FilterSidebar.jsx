import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  DOC_TYPES,
  DOC_TYPE_COLORS,
  DOC_TYPE_LABELS,
} from '../../constants/colors.js'
import { getDomains, getInstitutions } from '../../api/documents.js'

const YEAR_MIN = 2015
const YEAR_MAX = new Date().getFullYear()

function FilterSection({ title, children, className = '' }) {
  return (
    <section className={clsx('py-4 first:pt-0 last:pb-0', className)}>
      <h3 className="section-label mb-3">{title}</h3>
      {children}
    </section>
  )
}

function Checkbox({ checked, onChange, label, accent }) {
  return (
    <label className="flex min-h-[40px] cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-gray-900 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-navy-700/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox-custom"
      />
      {accent && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />
      )}
      <span className="flex-1 leading-snug">{label}</span>
    </label>
  )
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer le filtre ${label}`}
        className="shrink-0 rounded-full p-0.5 text-teal-600 transition-colors duration-200 hover:bg-teal-100 hover:text-teal-800"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  )
}

function IaSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="switch-track shrink-0"
      data-checked={checked}
    >
      <span className="switch-thumb" />
    </button>
  )
}

function YearSelect({ value, onChange, label, options }) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50/80 py-2 pl-3 pr-8 text-sm text-gray-900 transition-all duration-200 focus:border-teal-400 focus:bg-white focus:ring-1 focus:ring-teal-500/20 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-100 dark:focus:border-teal-400 dark:focus:bg-navy-800"
      >
        {options.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function FilterSidebar({
  filters,
  setFilter,
  resetFilters,
  className = '',
  onClose,
}) {
  const [domains, setDomains] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [showAllDomains, setShowAllDomains] = useState(false)
  const [showAllInstitutions, setShowAllInstitutions] = useState(false)
  const [yearNote, setYearNote] = useState('')

  const years = useMemo(
    () => Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i),
    [],
  )

  useEffect(() => {
    getDomains().then(({ data }) => data && setDomains(data))
    getInstitutions().then(({ data }) => data && setInstitutions(data))
  }, [])

  const toggleType = (type) => {
    const next = filters.type.includes(type)
      ? filters.type.filter((t) => t !== type)
      : [...filters.type, type]
    setFilter('type', next)
  }

  const domainName = domains.find((d) => String(d.id) === filters.domain_id)?.name
  const institutionName = institutions.find(
    (i) => String(i.id) === filters.institution_id,
  )?.name

  const hasActiveFilters =
    filters.type.length > 0 ||
    filters.domain_id ||
    filters.institution_id ||
    filters.year_from ||
    filters.year_to ||
    filters.ai_only

  const visibleDomains = showAllDomains ? domains : domains.slice(0, 6)
  const visibleInstitutions = showAllInstitutions
    ? institutions
    : institutions.slice(0, 5)

  const yearFrom = filters.year_from || String(YEAR_MIN)
  const yearTo = filters.year_to || String(YEAR_MAX)

  // Borne une année dans l'intervalle réaliste [YEAR_MIN, YEAR_MAX]
  const clampYear = (value) =>
    Math.min(YEAR_MAX, Math.max(YEAR_MIN, Number(value) || YEAR_MIN))

  const handleYearFrom = (value) => {
    const from = clampYear(value)
    const to = Number(filters.year_to || YEAR_MAX)
    setFilter('year_from', from <= YEAR_MIN ? '' : String(Math.min(from, to)))
    if (from > to) {
      setFilter('year_to', String(from))
      setYearNote('« De » ne peut pas dépasser « À » — bornes ajustées.')
    } else {
      setYearNote('')
    }
  }

  const handleYearTo = (value) => {
    const to = clampYear(value)
    const from = Number(filters.year_from || YEAR_MIN)
    setFilter('year_to', to >= YEAR_MAX ? '' : String(Math.max(to, from)))
    if (to < from) {
      setFilter('year_from', String(to))
      setYearNote('« À » ne peut pas être inférieur à « De » — bornes ajustées.')
    } else {
      setYearNote('')
    }
  }

  const panelClass = onClose
    ? 'space-y-1'
    : 'lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:rounded-xl lg:border lg:border-gray-200/60 lg:bg-white lg:p-5 lg:shadow-card dark:lg:border-navy-700 dark:lg:bg-navy-800'

  return (
    <aside className={clsx('w-full shrink-0 lg:w-72', className)}>
      <div className={panelClass}>
        {/* En-tête */}
        <div
          className={clsx(
            'mb-1 flex items-center justify-between gap-3',
            !onClose && 'border-b border-gray-100 pb-4 dark:border-navy-700 lg:mb-2',
          )}
        >
          <h2 className="font-serif text-lg font-semibold text-gray-900 dark:text-gray-100">Filtres</h2>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="font-mono text-[10px] uppercase tracking-wider text-teal-600 transition-colors duration-200 hover:text-teal-500"
              >
                Tout effacer
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Fermer les filtres"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Chips actifs */}
        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl bg-teal-50/50 p-3 ring-1 ring-teal-100/80 dark:bg-teal-500/10 dark:ring-teal-500/20">
            {filters.type.map((t) => (
              <FilterChip
                key={t}
                label={DOC_TYPE_LABELS[t]}
                onRemove={() =>
                  setFilter(
                    'type',
                    filters.type.filter((x) => x !== t),
                  )
                }
              />
            ))}
            {filters.domain_id && (
              <FilterChip
                label={domainName || 'Domaine'}
                onRemove={() => setFilter('domain_id', '')}
              />
            )}
            {filters.institution_id && (
              <FilterChip
                label={institutionName || 'Institution'}
                onRemove={() => setFilter('institution_id', '')}
              />
            )}
            {(filters.year_from || filters.year_to) && (
              <FilterChip
                label={`${filters.year_from || YEAR_MIN} – ${filters.year_to || YEAR_MAX}`}
                onRemove={() => {
                  setFilter('year_from', '')
                  setFilter('year_to', '')
                }}
              />
            )}
            {filters.ai_only && (
              <FilterChip
                label="Métadonnées IA"
                onRemove={() => setFilter('ai_only', false)}
              />
            )}
          </div>
        )}

        <div className="divide-y divide-gray-100 dark:divide-navy-700">
          <FilterSection title="Type de travail">
            <div className="-mx-2">
              {DOC_TYPES.map((type) => (
                <Checkbox
                  key={type}
                  label={DOC_TYPE_LABELS[type]}
                  accent={DOC_TYPE_COLORS[type]?.text}
                  checked={filters.type.includes(type)}
                  onChange={() => toggleType(type)}
                />
              ))}
            </div>
          </FilterSection>

          {domains.length > 0 && (
            <FilterSection title="Domaine">
              <div className="-mx-2">
                {visibleDomains.map((d) => (
                  <Checkbox
                    key={d.id}
                    label={d.name}
                    checked={filters.domain_id === String(d.id)}
                    onChange={() =>
                      setFilter(
                        'domain_id',
                        filters.domain_id === String(d.id) ? '' : String(d.id),
                      )
                    }
                  />
                ))}
              </div>
              {domains.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllDomains((v) => !v)}
                  className="mt-2 px-2 font-mono text-[10px] uppercase tracking-wider text-teal-600 transition-colors duration-200 hover:text-teal-500"
                >
                  {showAllDomains ? 'Réduire' : `+ ${domains.length - 6} domaines`}
                </button>
              )}
            </FilterSection>
          )}

          {institutions.length > 0 && (
            <FilterSection title="Institution">
              <div className="-mx-2">
                {visibleInstitutions.map((i) => (
                  <Checkbox
                    key={i.id}
                    label={i.acronym ? `${i.acronym} — ${i.name}` : i.name}
                    checked={filters.institution_id === String(i.id)}
                    onChange={() =>
                      setFilter(
                        'institution_id',
                        filters.institution_id === String(i.id) ? '' : String(i.id),
                      )
                    }
                  />
                ))}
              </div>
              {institutions.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllInstitutions((v) => !v)}
                  className="mt-2 px-2 font-mono text-[10px] uppercase tracking-wider text-teal-600 transition-colors duration-200 hover:text-teal-500"
                >
                  {showAllInstitutions
                    ? 'Réduire'
                    : `+ ${institutions.length - 5} institutions`}
                </button>
              )}
            </FilterSection>
          )}

          <FilterSection title="Année de publication">
            <div className="flex items-end gap-3">
              <YearSelect
                label="De"
                value={yearFrom}
                onChange={handleYearFrom}
                options={years}
              />
              <span className="pb-2.5 font-mono text-xs text-gray-300" aria-hidden="true">
                →
              </span>
              <YearSelect
                label="À"
                value={yearTo}
                onChange={handleYearTo}
                options={years}
              />
            </div>
            <p
              aria-live="polite"
              className={clsx(
                'mt-2 text-xs text-amber-dark transition-opacity duration-200',
                yearNote ? 'opacity-100' : 'sr-only opacity-0',
              )}
            >
              {yearNote}
            </p>
          </FilterSection>

          <FilterSection title="Métadonnées">
            <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-gray-900 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-navy-700/60">
              <span className="flex items-center gap-2">
                <span className="badge-ai shrink-0">IA</span>
                Extraction automatique
              </span>
              <IaSwitch
                checked={filters.ai_only}
                onChange={() => setFilter('ai_only', !filters.ai_only)}
              />
            </label>
          </FilterSection>
        </div>
      </div>
    </aside>
  )
}
