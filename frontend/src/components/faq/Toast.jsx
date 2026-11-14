import { Check } from 'lucide-react'

/**
 * Bottom-right success toast (the FAQ Management design's notification).
 * The parent passes `{ id, message }` or null; a new id makes a repeated
 * message slide in again.
 */
export default function Toast({ toast }) {
  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 bg-[#130e26] border border-[#271e4a] px-4 py-3 rounded-xl shadow-lg shadow-purple-950/40 flex items-center gap-3 transition-all duration-300 pointer-events-none ${
        toast ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      }`}
      role="status"
    >
      <span className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
        <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
      </span>
      <span className="text-xs font-medium text-white">{toast?.message ?? ''}</span>
    </div>
  )
}
