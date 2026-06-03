import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchDocuments } from '../api/documents.js'

const DEFAULT_SORT = 'relevance'
const PER_PAGE = 12

// Lit l'état des filtres depuis les URL searchParams (partageables)
function parseFilters(params) {
  return {
    q: params.get('q') || '',
    type: params.getAll('type'),
    domain_id: params.get('domain_id') || '',
    institution_id: params.get('institution_id') || '',
    year_from: params.get('year_from') || '',
    year_to: params.get('year_to') || '',
    sort: params.get('sort') || DEFAULT_SORT,
    ai_only: params.get('ai_only') === 'true',
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1),
  }
}

// Construit les params API à partir des filtres (omet les valeurs vides/défaut)
function toApiParams(filters) {
  const out = { page: filters.page, per_page: PER_PAGE, sort: filters.sort }
  if (filters.q) out.q = filters.q
  if (filters.type.length) out.type = filters.type
  if (filters.domain_id) out.domain_id = filters.domain_id
  if (filters.institution_id) out.institution_id = filters.institution_id
  if (filters.year_from) out.year_from = filters.year_from
  if (filters.year_to) out.year_to = filters.year_to
  if (filters.ai_only) out.ai_only = true
  return out
}

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sérialise pour comparaison stable dans les deps
  const paramsKey = searchParams.toString()

  useEffect(() => {
    let active = true
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true)
    setError(null)
    /* eslint-enable react-hooks/set-state-in-effect */
    searchDocuments(toApiParams(parseFilters(new URLSearchParams(paramsKey)))).then(
      ({ data, error }) => {
        if (!active) return
        if (data) {
          setResults(data.documents || [])
          setTotal(data.total || 0)
          setPerPage(data.per_page || PER_PAGE)
        } else {
          setResults([])
          setTotal(0)
          setError(error)
        }
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
  }, [paramsKey])

  // Met à jour un filtre dans l'URL ; remet page=1 sauf si on change la page
  const setFilter = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (key !== 'page') next.delete('page')

          next.delete(key)
          if (Array.isArray(value)) {
            value.forEach((v) => v !== '' && next.append(key, v))
          } else if (value === '' || value === false || value == null) {
            // suppression : ne rien réécrire
          } else {
            next.set(key, value)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setPage = useCallback((p) => setFilter('page', String(p)), [setFilter])

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  // Debounce 300ms sur le champ q uniquement
  const debounceRef = useRef(null)
  const setQuery = useCallback(
    (value) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => setFilter('q', value), 300)
    },
    [setFilter],
  )

  return {
    results,
    total,
    perPage,
    loading,
    error,
    filters,
    setFilter,
    setQuery,
    setPage,
    resetFilters,
  }
}
