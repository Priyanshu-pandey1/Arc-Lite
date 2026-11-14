import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Centered confirmation dialog used for destructive actions
 * (delete conversation, clear history, delete FAQ, ...).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-2xl bg-app-card border border-app-border shadow-2xl shadow-black/60 p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-9 h-9 shrink-0 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle aria-hidden="true" className="w-5 h-5" />
          </span>
          <h2 className="text-white font-semibold text-base">{title}</h2>
        </div>

        <p className="text-sm text-app-muted mb-5">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-app-surface hover:bg-app-hover border border-app-border rounded-xl transition-colors"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
