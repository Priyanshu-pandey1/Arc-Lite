import { Pencil, Search, Trash2 } from 'lucide-react'
import { FAQ_CATEGORIES, FAQ_SORT_OPTIONS, FAQ_STATUS_OPTIONS } from '../../services/faqMock'

const selectClass =
  'w-full sm:w-auto appearance-none bg-[#130f28] border border-[#251c45] hover:border-[#352963] rounded-xl px-4 py-2.5 pr-9 text-xs sm:text-sm font-medium text-slate-200 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 cursor-pointer transition-colors'

const chevronClass =
  'pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#9490b3]'

function Select({ id, value, onChange, options, ariaLabel }) {
  return (
    <div className="relative flex-1 sm:flex-initial">
      <select
        aria-label={ariaLabel}
        className={selectClass}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className={chevronClass} aria-hidden="true">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

/**
 * Search, category / status / sort dropdowns and the reset button —
 * the filter bar above the FAQ table.
 */
export default function FaqFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  onClear,
}) {
  return (
    <section aria-label="Search and Filter Controls" className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
          <Search aria-hidden="true" className="w-5 h-5" />
        </div>
        <input
          aria-label="Search FAQs"
          className="w-full pl-11 pr-4 py-2.5 bg-[#130f28] border border-[#251c45] hover:border-[#352963] rounded-xl text-sm text-slate-100 placeholder-[#9490b3] focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search FAQs..."
          type="text"
          value={query}
        />
      </div>

      {/* Dropdowns + clear */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
        <Select
          ariaLabel="Filter by category"
          id="faq-category-filter"
          onChange={onCategoryChange}
          options={[
            { value: 'all', label: 'All Categories' },
            ...FAQ_CATEGORIES.map((name) => ({ value: name, label: name })),
          ]}
          value={category}
        />
        <Select
          ariaLabel="Filter by status"
          id="faq-status-filter"
          onChange={onStatusChange}
          options={FAQ_STATUS_OPTIONS}
          value={status}
        />
        <Select
          ariaLabel="Sort FAQs"
          id="faq-sort-filter"
          onChange={onSortChange}
          options={FAQ_SORT_OPTIONS}
          value={sort}
        />
        <button
          className="px-3.5 py-2.5 bg-[#130f28] hover:bg-[#181233] border border-[#251c45] rounded-xl text-xs sm:text-sm text-[#9490b3] hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          onClick={onClear}
          title="Reset Filters"
          type="button"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Clear Filters</span>
        </button>
      </div>
    </section>
  )
}

const CATEGORY_STYLES = {
  Courses: 'bg-purple-950 text-purple-300 border-purple-700/50',
  Certificates: 'bg-emerald-950 text-emerald-300 border-emerald-700/50',
  Jobs: 'bg-amber-950 text-amber-300 border-amber-700/50',
  Account: 'bg-blue-950 text-blue-300 border-blue-700/50',
}

function CategoryPill({ category }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
        CATEGORY_STYLES[category] ?? 'bg-slate-800 text-slate-300 border-slate-600/60'
      }`}
    >
      {category}
    </span>
  )
}

function StatusCell({ status }) {
  const active = status === 'active'
  return (
    <span
      className={`inline-flex items-center text-xs font-medium gap-1.5 ${
        active ? 'text-emerald-400' : 'text-slate-500'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ActionButtons({ onEdit, onDelete, compact = false }) {
  const size = compact ? 'p-2' : 'p-1.5'
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        aria-label="Edit FAQ"
        className={`${size} rounded-lg bg-purple-950/40 text-purple-300 hover:text-white hover:bg-purple-700/60 transition-colors`}
        onClick={onEdit}
        title="Edit FAQ"
        type="button"
      >
        <Pencil aria-hidden="true" className="w-4 h-4" />
      </button>
      <button
        aria-label="Delete FAQ"
        className={`${size} rounded-lg bg-rose-950/30 text-rose-400 hover:text-rose-200 hover:bg-rose-700/50 transition-colors`}
        onClick={onDelete}
        title="Delete FAQ"
        type="button"
      >
        <Trash2 aria-hidden="true" className="w-4 h-4" />
      </button>
    </div>
  )
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="py-16 px-6 text-center">
      <p className="text-sm font-medium text-white mb-1">No FAQs found</p>
      <p className="text-xs text-[#9490b3] mb-4">
        {hasFilters
          ? 'No entries match your current search and filters.'
          : 'Your knowledge base is empty — add your first FAQ to get started.'}
      </p>
      {hasFilters && (
        <button
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
          onClick={onClear}
          type="button"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}

const skeletonBar = 'rounded bg-[#251c45] animate-pulse'

/**
 * Placeholder rows shown while GET /api/faqs is in flight — mirrors the
 * desktop table and mobile card layouts so the frame doesn't jump when
 * real rows arrive. Replaces the previous plain "Loading FAQs…" text.
 */
function TableSkeleton() {
  return (
    <div aria-label="Loading FAQs" aria-live="polite" role="status">
      <span className="sr-only">Loading FAQs…</span>

      {/* Desktop — one shimmering row per expected table column */}
      <div aria-hidden="true" className="hidden md:block">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className={`flex items-center gap-6 px-6 py-[1.15rem] ${
              index < 4 ? 'border-b border-[#1e1738]/50' : ''
            }`}
            key={index}
          >
            <div className={`${skeletonBar} h-4 flex-[3] max-w-[260px]`} />
            <div className={`${skeletonBar} h-4 flex-[3]`} />
            <div className={`${skeletonBar} h-5 w-20 rounded-full`} />
            <div className={`${skeletonBar} h-4 w-16`} />
            <div className={`${skeletonBar} h-4 w-24`} />
            <div className="flex-1" />
          </div>
        ))}
      </div>

      {/* Mobile — stacked card placeholders */}
      <div aria-hidden="true" className="md:hidden divide-y divide-[#251c45]/60">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="p-4 space-y-2.5" key={index}>
            <div className={`${skeletonBar} h-3 w-20`} />
            <div className={`${skeletonBar} h-4 w-3/4`} />
            <div className={`${skeletonBar} h-5 w-28 rounded-full`} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1.5">
      <button
        aria-label="Previous page"
        className="w-8 h-8 rounded-lg bg-[#251c45]/40 hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors disabled:opacity-40 disabled:hover:bg-[#251c45]/40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        ‹
      </button>

      {pages.map((number) => (
        <button
          aria-current={number === page ? 'page' : undefined}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors ${
            number === page
              ? 'bg-purple-600 text-white font-medium shadow-lg shadow-purple-950/60'
              : 'text-[#9490b3] hover:bg-[#130f28] hover:text-white'
          }`}
          key={number}
          onClick={() => onPageChange(number)}
          type="button"
        >
          {number}
        </button>
      ))}

      <button
        aria-label="Next page"
        className="w-8 h-8 rounded-lg bg-[#251c45]/40 hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors disabled:opacity-40 disabled:hover:bg-[#251c45]/40"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        ›
      </button>
    </nav>
  )
}

/**
 * FAQ knowledge table: desktop table view, the mobile card list from the
 * phone mockup, and the "Showing X–Y of Z" pagination footer.
 */
export function FaqTable({ rows, isLoading, hasFilters, page, totalPages, rangeFrom, rangeTo, totalFiltered, onClear, onEdit, onDelete, onPageChange }) {
  const body = isLoading ? (
    <TableSkeleton />
  ) : rows.length === 0 ? (
    <EmptyState hasFilters={hasFilters} onClear={onClear} />
  ) : (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#251c45]/80 text-xs font-semibold uppercase tracking-wider text-[#9490b3] bg-[#100b21]">
              <th className="py-4 px-6 w-3/12" scope="col">Question</th>
              <th className="py-4 px-6 w-3/12" scope="col">Answer Preview</th>
              <th className="py-4 px-6 w-2/12" scope="col">Category</th>
              <th className="py-4 px-6 w-1/12" scope="col">Status</th>
              <th className="py-4 px-6 w-2/12" scope="col">Last Updated</th>
              <th className="py-4 px-6 w-1/12 text-right" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1738]/50 text-sm">
            {rows.map((faq) => (
              <tr className="hover:bg-[#181233]/70 transition-colors" key={faq.id}>
                <td className="py-4 px-6 font-medium text-white max-w-[260px]">
                  <span className="block truncate" title={faq.question}>
                    {faq.question}
                  </span>
                </td>
                <td className="py-4 px-6 text-[#9490b3] max-w-xs">
                  <span className="block truncate" title={faq.answer}>
                    {faq.answer}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <CategoryPill category={faq.category} />
                </td>
                <td className="py-4 px-6">
                  <StatusCell status={faq.status} />
                </td>
                <td className="py-4 px-6 text-[#9490b3] text-xs whitespace-nowrap">
                  {formatDate(faq.updatedAt)}
                </td>
                <td className="py-4 px-6 text-right">
                  <ActionButtons
                    onDelete={() => onDelete(faq)}
                    onEdit={() => onEdit(faq)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="block md:hidden divide-y divide-[#251c45]/60">
        {rows.map((faq) => (
          <div className="p-4" key={faq.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 pr-2 min-w-0">
                <span className="text-xs uppercase text-[#9490b3] tracking-wider font-semibold block mb-1">
                  Question
                </span>
                <p className="text-sm font-medium text-white leading-snug break-words">
                  {faq.question}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <CategoryPill category={faq.category} />
                  <StatusCell status={faq.status} />
                  <span className="text-[11px] text-[#9490b3]">{formatDate(faq.updatedAt)}</span>
                </div>
              </div>
              <ActionButtons
                compact
                onDelete={() => onDelete(faq)}
                onEdit={() => onEdit(faq)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer / pagination */}
      <div className="px-6 py-4 border-t border-[#251c45]/70 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#9490b3] text-center sm:text-left">
          Showing <span className="font-medium text-white">{rangeFrom}–{rangeTo}</span> of{' '}
          <span className="font-medium text-white">{totalFiltered}</span> FAQs
        </p>
        <Pagination onPageChange={onPageChange} page={page} totalPages={totalPages} />
      </div>
    </>
  )

  return (
    <section
      aria-label="FAQ Knowledge Table"
      className="bg-[#120e24] border border-[#251c45] rounded-2xl overflow-hidden shadow-xl shadow-black/20"
    >
      {body}
    </section>
  )
}
