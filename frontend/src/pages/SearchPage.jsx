import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import Seo from '../components/Seo.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import SearchBar from '../components/search/SearchBar.jsx'
import FilterSidebar from '../components/search/FilterSidebar.jsx'
import DocumentCard from '../components/ui/DocumentCard.jsx'
import SkeletonCard from '../components/ui/SkeletonCard.jsx'
import AnimatedCounter from '../components/ui/AnimatedCounter.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { SORT_OPTIONS } from '../constants/colors.js'
import { useSearch } from '../hooks/useSearch.js'

function ResultCount({ total, loading, query }) {
  if (loading) {
    return (
      <p className="text-sm text-gray-500" aria-live="polite" aria-atomic="true">
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />
          Recherche en cours…
        </span>
      </p>
    )
  }

  return (
    <p className="text-sm text-gray-500" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`${total}-${query}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="inline"
        >
          <span className="font-mono font-semibold text-gray-900">
            <AnimatedCounter value={total} duration={0.8} />
          </span>{' '}
          résultat{total > 1 ? 's' : ''}
          {query && (
            <>
              {' '}pour «{' '}
              <span className="font-medium text-gray-900">{query}</span> »
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </p>
  )
}

function EmptyState({ query, onSuggest }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-navy-700 dark:bg-navy-800">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50">
        <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9 text-gray-400" aria-hidden="true">
          <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M32 32l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 20h12M20 14v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>
      <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">
        Aucun résultat{query ? ` pour « ${query} »` : ''}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
        Essayez d&apos;élargir vos critères, de retirer un filtre ou de modifier vos mots-clés.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {['machine learning', 'biologie', 'économie'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggest(s)}
            className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm text-gray-700 transition-all duration-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SearchPage() {
  const {
    results,
    total,
    perPage,
    loading,
    filters,
    setFilter,
    setQuery,
    setPage,
    resetFilters,
  } = useSearch()

  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilterCount =
    filters.type.length +
    (filters.domain_id ? 1 : 0) +
    (filters.institution_id ? 1 : 0) +
    (filters.year_from || filters.year_to ? 1 : 0) +
    (filters.ai_only ? 1 : 0)

  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Seo
        title={filters.q ? `Recherche : ${filters.q}` : 'Recherche'}
        description="Explorez les thèses, mémoires et articles académiques par type, domaine, institution et année."
      />
      <Navbar />

      {/* Topbar recherche — navy profond */}
      <div className="border-b border-white/[0.06] bg-navy-900">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6">
          <SearchBar
            key={filters.q}
            size="sm"
            initialValue={filters.q}
            onChange={setQuery}
            onSearch={(v) => setFilter('q', v)}
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-10 lg:py-8">
        {/* Sidebar desktop */}
        <FilterSidebar
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          className="hidden lg:block"
        />

        <section className="min-w-0 flex-1">
          {/* Header résultats + tri */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <ResultCount total={total} loading={loading} query={filters.q} />

            <div className="flex items-center gap-3">
              {/* Bouton filtres mobile */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-teal-300 hover:text-gray-900 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-teal-500/40 lg:hidden"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Filtres
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1.5 font-mono text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <label className="flex items-center gap-2 text-sm text-gray-500">
                <span className="hidden sm:inline">Trier par</span>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 transition-all duration-200 focus:border-teal-400 focus:shadow-teal focus:ring-1 focus:ring-teal-500/20 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Grille résultats */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} detailed />
              ))}
            </div>
          ) : total === 0 ? (
            <EmptyState query={filters.q} onSuggest={(s) => setFilter('q', s)} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {results.map((doc, i) => (
                  <DocumentCard key={doc.id} document={doc} detailed index={i} />
                ))}
              </div>

              <div className="mt-10">
                <Pagination
                  page={filters.page}
                  total={total}
                  perPage={perPage}
                  onChange={setPage}
                />
              </div>
            </>
          )}
        </section>
      </main>

      {/* Bottom sheet filtres — mobile */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm lg:hidden"
              onClick={() => setFiltersOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-gray-200/60 bg-white p-5 shadow-navy dark:border-navy-700 dark:bg-navy-900 lg:hidden"
            >
              <FilterSidebar
                filters={filters}
                setFilter={setFilter}
                resetFilters={resetFilters}
                onClose={() => setFiltersOpen(false)}
              />
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className={clsx('btn-primary mt-6 w-full')}
              >
                Voir {loading ? '…' : total} résultat{total > 1 ? 's' : ''}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
