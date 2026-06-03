import { useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  DOC_TYPES,
  DOC_TYPE_LABELS,
} from '../../constants/colors.js'
import { getDomains, getInstitutions } from '../../api/documents.js'

const YEAR_MIN = 2015
const YEAR_MAX = 2025

function SectionTitle({ children }) {
  return <h3 className="section-label mb-3">{children}</h3>
}

function Checkbox({ checked, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-1 text-sm text-gray-900 transition-colors duration-200 hover:bg-gray-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox-custom"
      />
      <span className="flex-1 leading-snug">{label}</span>
      {typeof count === 'number' && (
        <span className="font-mono text-[10px] text-gray-400">{count}</span>
      )}
    </label>
  )
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer le filtre ${label}`}
        className="rounded-full p-0.5 text-teal-600 transition-colors duration-200 hover:bg-teal-100 hover:text-teal-800"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
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
      className="switch-track"
      data-checked={checked}
    >
      <span className="switch-thumb" />
    </button>
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
    filters.type.length ||
    filters.domain_id ||
    filters.institution_id ||
    filters.year_from ||
    filters.year_to ||
    filters.ai_only

  const visibleDomains = showAllDomains ? domains : domains.slice(0, 5)
  const visibleInstitutions = showAllInstitutions
    ? institutions
    : institutions.slice(0, 4)

  return (
    <aside
      className={clsx(
        'w-full space-y-7 lg:w-60 lg:shrink-0',
        'lg:border-r lg:border-gray-200/60 lg:bg-white lg:pr-6',
        className,
      )}
    >
      {onClose && (
        <div className="mb-2 flex items-center justify-between lg:hidden">
          <h2 className="font-serif text-lg font-semibold text-gray-900">Filtres</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Fermer les filtres"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {hasActiveFilters ? (
        <div className="rounded-xl border border-gray-200/60 bg-gray-50/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Filtres actifs</SectionTitle>
            <button
              type="button"
              onClick={resetFilters}
              className="font-mono text-[10px] uppercase tracking-wider text-teal-600 transition-colors duration-200 hover:text-teal-500"
            >
              Tout effacer
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
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
                label={`${filters.year_from || YEAR_MIN}–${filters.year_to || YEAR_MAX}`}
                onRemove={() => {
                  setFilter('year_from', '')
                  setFilter('year_to', '')
                }}
              />
            )}
            {filters.ai_only && (
              <FilterChip
                label="Avec IA"
                onRemove={() => setFilter('ai_only', false)}
              />
            )}
          </div>
        </div>
      ) : null}

      <div>
        <SectionTitle>Type de travail</SectionTitle>
        <div className="space-y-0.5">
          {DOC_TYPES.map((type) => (
            <Checkbox
              key={type}
              label={DOC_TYPE_LABELS[type]}
              checked={filters.type.includes(type)}
              onChange={() => toggleType(type)}
            />
          ))}
        </div>
      </div>

      {domains.length > 0 && (
        <div>
          <SectionTitle>Domaine</SectionTitle>
          <div className="space-y-0.5">
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
          {domains.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllDomains((v) => !v)}
              className="mt-2 font-mono text-[10px] uppercase tracking-wider text-teal-600 transition-colors duration-200 hover:text-teal-500"
            >
              {showAllDomains ? 'Réduire' : `${domains.length - 5} autres →`}
            </button>
          )}
        </div>
      )}

      {institutions.length > 0 && (
        <div>
          <SectionTitle>Institution</SectionTitle>
          <div className="space-y-0.5">
            {visibleInstitutions.map((i) => (
              <Checkbox
                key={i.id}
                label={i.acronym || i.name}
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
          {institutions.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllInstitutions((v) => !v)}
              className="mt-2 font-mono text-[10px] uppercase tracking-wider text-teal-600 transition-colors duration-200 hover:text-teal-500"
            >
              {showAllInstitutions
                ? 'Réduire'
                : `${institutions.length - 4} autres →`}
            </button>
          )}
        </div>
      )}

      <div>
        <SectionTitle>Année de publication</SectionTitle>
        <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-gray-500">
          <span className="rounded-md bg-gray-50 px-2 py-0.5">
            {filters.year_from || YEAR_MIN}
          </span>
          <span className="text-gray-300">—</span>
          <span className="rounded-md bg-gray-50 px-2 py-0.5">
            {filters.year_to || YEAR_MAX}
          </span>
        </div>
        <div className="space-y-3">
          <input
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={filters.year_from || YEAR_MIN}
            onChange={(e) => {
              const v = Math.min(
                Number(e.target.value),
                Number(filters.year_to || YEAR_MAX),
              )
              setFilter('year_from', v === YEAR_MIN ? '' : String(v))
            }}
            className="range-teal"
            aria-label="Année de début"
          />
          <input
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={filters.year_to || YEAR_MAX}
            onChange={(e) => {
              const v = Math.max(
                Number(e.target.value),
                Number(filters.year_from || YEAR_MIN),
              )
              setFilter('year_to', v === YEAR_MAX ? '' : String(v))
            }}
            className="range-teal"
            aria-label="Année de fin"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/60 bg-white p-4">
        <SectionTitle>Métadonnées</SectionTitle>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-gray-900">
          <span>Avec IA extractée</span>
          <IaSwitch
            checked={filters.ai_only}
            onChange={() => setFilter('ai_only', !filters.ai_only)}
          />
        </label>
      </div>
    </aside>
  )
}
