import { useState } from 'react'
import { BookOpen, Plus, Zap } from 'lucide-react'
import FaqKpiCard from '../components/faq/FaqKpiCard'
import FaqFilters, { FaqTable } from '../components/faq/FaqTable'
import FaqFormModal from '../components/faq/FaqFormModal'
import Toast from '../components/faq/Toast'
import ConfirmDialog from '../components/common/ConfirmDialog'
import useFaqs from '../hooks/useFaqs'
import useToast from '../hooks/useToast'

const EMPTY_FORM = { question: '', answer: '', category: 'Courses', status: 'active' }

/**
 * FAQ Management screen — knowledge-base statistics, search + filters,
 * the FAQ table with add / edit / delete, and the assistant performance
 * callout. Every mutation is optimistic through useFaqs.
 */
export default function FAQManagement() {
  const {
    isLoading,
    error,
    reload,
    kpis,
    rows,
    query,
    setQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    clearFilters,
    page,
    setPage,
    totalPages,
    rangeFrom,
    rangeTo,
    totalFiltered,
    createFaq,
    updateFaq,
    deleteFaq,
  } = useFaqs()

  const { toast, notify } = useToast()

  // null | 'add' | the FAQ being edited
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const hasFilters =
    query.trim() !== '' || categoryFilter !== 'all' || statusFilter !== 'active' || sort !== 'updated'

  // KPI tiles stay in skeleton mode while loading AND after a failed
  // load — an unconfirmed 0 must never render as a real value.
  const kpisLoading = isLoading || Boolean(error)

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (faq) => {
    setEditing(faq)
    setFormOpen(true)
  }

  const handleSave = async (values) => {
    setSaving(true)
    try {
      if (editing) {
        await updateFaq(editing.id, values)
        notify('FAQ updated in the ArcLite database')
      } else {
        await createFaq(values)
        notify('FAQ saved to the ArcLite database')
      }
      setFormOpen(false)
      setEditing(null)
    } catch (error) {
      notify(error.message || 'Could not save the FAQ. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteFaq(pendingDelete.id)
      notify('FAQ item deleted successfully')
      setPendingDelete(null)
    } catch (error) {
      notify(
        error?.response?.data?.error ||
          error.message ||
          'Could not delete the FAQ. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-app-bg" data-purpose="faq-management">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-7">
        {/* Header + add button */}
        <section aria-label="FAQ Management Header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1d163d] border border-purple-500/40 shrink-0 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/40">
              <BookOpen aria-hidden="true" className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                FAQ Management
              </h1>
              <p className="text-sm text-[#8b85a6] mt-1 max-w-2xl leading-relaxed">
                Manage your FAQ knowledge base to ensure Arc Lite provides accurate and relevant
                answers.
              </p>
            </div>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-purple-950/50 hover:brightness-110 active:scale-95 transition-all duration-150 w-full sm:w-auto"
            onClick={openAdd}
            type="button"
          >
            <Plus aria-hidden="true" className="w-4 h-4" strokeWidth={2.5} />
            <span>Add New FAQ</span>
          </button>
        </section>

        {/* KPI tiles */}
        <section aria-label="Key FAQ Statistics" className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {kpis.map((kpi, index) => (
            <FaqKpiCard kpi={kpi} loading={kpisLoading} wide={index === kpis.length - 1} key={kpi.id} />
          ))}
        </section>

        {/* Search + filters */}
        <FaqFilters
          category={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onClear={() => {
            clearFilters()
            notify('Filters have been cleared')
          }}
          onQueryChange={setQuery}
          onSortChange={setSort}
          onStatusChange={setStatusFilter}
          query={query}
          sort={sort}
          status={statusFilter}
        />

        {/* Table — or the load-error panel while the knowledge base is unavailable */}
        {error ? (
          <section
            aria-label="FAQ loading error"
            className="bg-[#120e24] border border-[#251c45] rounded-2xl px-6 py-16 text-center shadow-xl shadow-black/20"
          >
            <p className="text-sm font-medium text-white mb-1">Couldn't load the FAQ knowledge base</p>
            <p className="text-xs text-[#9490b3] mb-4 max-w-md mx-auto leading-relaxed">{error}</p>
            <button
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:hover:bg-purple-600"
              disabled={isLoading}
              onClick={reload}
              type="button"
            >
              {isLoading ? 'Retrying…' : 'Retry'}
            </button>
          </section>
        ) : (
          <FaqTable
            hasFilters={hasFilters}
            onDelete={setPendingDelete}
            onEdit={openEdit}
            onPageChange={setPage}
            page={page}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            rows={rows}
            totalFiltered={totalFiltered}
            totalPages={totalPages}
            isLoading={isLoading}
          />
        )}

        {/* Performance callout */}
        <section className="bg-gradient-to-r from-[#171035] to-[#120c2c] border border-[#251c45] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Zap aria-hidden="true" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">FAQs Performing Well</h3>
              <p className="text-xs text-[#8b85a6] mt-0.5">
                Your assistant is answering 98% of questions correctly using these entries.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            ● 98% Match Rate
          </span>
        </section>
      </main>

      {/* Add / Edit dialog — mounted only while open so form state seeds fresh */}
      {formOpen && (
        <FaqFormModal
          initial={editing ?? EMPTY_FORM}
          key={editing ? editing.id : 'new'}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        confirmLabel={deleting ? 'Deleting…' : 'Delete FAQ'}
        message={
          pendingDelete
            ? `“${pendingDelete.question}” will be removed from the ArcLite AI knowledge base and will no longer be used to answer visitors.`
            : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        open={Boolean(pendingDelete)}
        title="Delete FAQ Entry?"
      />

      {/* Success toast */}
      <Toast toast={toast} />
    </div>
  )
}
