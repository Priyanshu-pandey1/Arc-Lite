import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { FAQ_CATEGORIES } from '../../services/faqMock'

const EMPTY = { question: '', answer: '', category: 'Courses', status: 'active' }

const inputClass =
  'w-full px-3.5 py-2.5 bg-[#0e0922] border border-[#271e4a] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors'

/**
 * Add / Edit FAQ dialog from the FAQ Management design.
 *
 * The parent mounts this conditionally with a `key`, so the form state
 * seeds straight from `initial` on mount — no effect round-trip. Escape
 * and the backdrop both close it; `onSave` receives the form values and
 * the parent owns the saving state.
 */
export default function FaqFormModal({ initial = EMPTY, saving = false, onClose, onSave }) {
  const [values, setValues] = useState(() => initial ?? EMPTY)

  // Escape closes (mounted fresh on every open, so state starts clean).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const set = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!values.question.trim() || !values.answer.trim() || saving) return
    onSave({
      ...values,
      question: values.question.trim(),
      answer: values.answer.trim(),
    })
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      data-purpose="faq-form-modal"
      role="dialog"
    >
      {/* Backdrop */}
      <button
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-default"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#130e26] border border-[#271e4a] shadow-2xl shadow-black/60 p-6 z-10 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#271e4a] pb-4 mb-5">
          <h3 className="text-lg font-bold text-white">{initial.id ? 'Edit FAQ' : 'Add New FAQ'}</h3>
          <button
            aria-label="Close dialog"
            className="text-[#9490b3] hover:text-white transition-colors"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider text-[#9490b3] mb-1.5"
              htmlFor="faq-question"
            >
              Question
            </label>
            <input
              autoFocus
              className={inputClass}
              id="faq-question"
              onChange={set('question')}
              placeholder="e.g. How do I get verified?"
              required
              type="text"
              value={values.question}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider text-[#9490b3] mb-1.5"
              htmlFor="faq-answer"
            >
              Answer Preview / Text
            </label>
            <textarea
              className={`${inputClass} resize-y min-h-28`}
              id="faq-answer"
              onChange={set('answer')}
              placeholder="Provide a concise and accurate response..."
              required
              rows={4}
              value={values.answer}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-[#9490b3] mb-1.5"
                htmlFor="faq-category"
              >
                Category
              </label>
              <select
                className={`${inputClass} appearance-none cursor-pointer`}
                id="faq-category"
                onChange={set('category')}
                value={values.category}
              >
                {FAQ_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-[#9490b3] mb-1.5"
                htmlFor="faq-status"
              >
                Status
              </label>
              <select
                className={`${inputClass} appearance-none cursor-pointer`}
                id="faq-status"
                onChange={set('status')}
                value={values.status}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#271e4a] mt-6">
            <button
              className="px-4 py-2 rounded-xl text-sm text-[#9490b3] hover:text-white hover:bg-[#1f1640] transition-colors disabled:opacity-60"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-950/60 transition-colors disabled:opacity-60 disabled:cursor-wait"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Saving…' : 'Save FAQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
