import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as faqService from '../services/faqService'
import { FAQ_KPIS } from '../services/faqMock'

/** Rows shown per table page (matches the design's 1–5 footer). */
const PAGE_SIZE = 5

const byNewest = (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
const byOldest = (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)
const byAlpha = (a, b) => a.question.localeCompare(b.question)

/**
 * useFaqs — owns the whole FAQ Management screen state: the entries,
 * the search / category / status / sort filters, pagination, the KPI
 * numbers derived from the list, and the add / edit / delete actions.
 */
export default function useFaqs() {
  const [faqs, setFaqs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  // Default view = active FAQs only: soft-deleted (inactive) entries
  // must not reappear in the normal list after a page refresh.
  const [statusFilter, setStatusFilter] = useState('active')
  const [sort, setSort] = useState('updated')
  const [page, setPage] = useState(1)

  /** Identifies the latest load so a superseded retry can't win a race. */
  const latestLoadRef = useRef(0)

  /** Ids deleted during this session — any re-sync (post-delete or
   *  manual retry) must keep them out of the list until a full page
   *  reload, even under the "All"/"Inactive" status filters. */
  const deletedIdsRef = useRef(new Set())

  /** Pull the human-readable message out of an axios/service error. */
  const toErrorMessage = (requestError, fallback) =>
    requestError?.response?.data?.error ||
    requestError?.response?.data?.message ||
    requestError?.message ||
    fallback

  /** GET /api/faqs — also the retry path after a failed load. */
  const load = useCallback(() => {
    const loadId = ++latestLoadRef.current
    setIsLoading(true)
    setError(null)

    faqService
      .getFaqs()
      .then((rows) => {
        if (loadId === latestLoadRef.current) {
          setFaqs(rows.filter((row) => !deletedIdsRef.current.has(String(row.id))))
        }
      })
      .catch((requestError) => {
        if (loadId === latestLoadRef.current) {
          setError(
            toErrorMessage(requestError, 'Could not load the FAQ knowledge base. Please try again.'),
          )
        }
      })
      .finally(() => {
        if (loadId === latestLoadRef.current) setIsLoading(false)
      })
  }, [])

  /** Fetch once on mount. StrictMode's double mount shares one request
   *  via the service-level dedupe, so no duplicate network call. */
  useEffect(() => {
    load()
  }, [load])

  /** Applying any filter returns to the first page. */
  const applyFilter = useCallback((setter) => (value) => {
    setter(value)
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setQuery('')
    setCategoryFilter('all')
    setStatusFilter('active')
    setSort('updated')
    setPage(1)
  }, [])

  /** Re-sync with the server after a confirmed mutation without
   *  flipping the table into its skeleton state. A failure here is
   *  non-fatal: the mutation already succeeded and its result is
   *  already reflected optimistically. */
  const syncQuietly = useCallback(() => {
    faqService
      .getFaqs()
      .then((rows) => {
        setFaqs(rows.filter((row) => !deletedIdsRef.current.has(String(row.id))))
      })
      .catch(() => {})
  }, [])

  /** Entries matching every active filter, in the requested order. */
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = faqs.filter((row) => {
      const matchesQuery =
        !needle ||
        row.question.toLowerCase().includes(needle) ||
        row.answer.toLowerCase().includes(needle)
      const matchesCategory = categoryFilter === 'all' || row.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      return matchesQuery && matchesCategory && matchesStatus
    })

    const sorted = [...rows]
    if (sort === 'oldest') sorted.sort(byOldest)
    else if (sort === 'alpha') sorted.sort(byAlpha)
    else sorted.sort(byNewest)
    return sorted
  }, [faqs, query, categoryFilter, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeFrom = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(currentPage * PAGE_SIZE, filtered.length)

  /** KPI tiles are counts off the live list, not hardcoded numbers. */
  const kpis = useMemo(
    () =>
      FAQ_KPIS.map((kpi) => ({
        ...kpi,
        value:
          kpi.id === 'total'
            ? faqs.length
            : faqs.filter((row) => row.category === kpi.id).length,
      })),
    [faqs],
  )

  const createFaq = useCallback(async (input) => {
    const created = await faqService.createFaq(input)
    setFaqs((prev) => [created, ...prev])
    return created
  }, [])

  const updateFaq = useCallback(async (id, input) => {
    const updated = await faqService.updateFaq(id, input)
    setFaqs((prev) => prev.map((row) => (row.id === id ? updated : row)))
    return updated
  }, [])

  const deleteFaq = useCallback(async (id) => {
    await faqService.deleteFaq(id)
    deletedIdsRef.current.add(String(id))
    setFaqs((prev) => prev.filter((row) => String(row.id) !== String(id)))
    syncQuietly()
  }, [syncQuietly])

  return {
    // data
    isLoading,
    error,
    reload: load,
    kpis,
    rows,
    // filters
    query,
    setQuery: applyFilter(setQuery),
    categoryFilter,
    setCategoryFilter: applyFilter(setCategoryFilter),
    statusFilter,
    setStatusFilter: applyFilter(setStatusFilter),
    sort,
    setSort: applyFilter(setSort),
    clearFilters,
    // pagination
    page: currentPage,
    setPage,
    totalPages,
    rangeFrom,
    rangeTo,
    totalFiltered: filtered.length,
    // actions
    createFaq,
    updateFaq,
    deleteFaq,
  }
}
