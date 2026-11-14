/**
 * Negative Feedback card: every answered conversation rated 'down'
 * in the selected period (question, category, date), straight from
 * the backend's negative-feedback query.
 */
export default function NegativeFeedbackCard({ rows }) {
  return (
    <article
      className="lg:col-span-4 bg-[#120e24] border border-[#251c45] rounded-2xl p-5 sm:p-6 flex flex-col"
      data-purpose="negative-feedback-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center justify-center">
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z" />
              <path d="M7 7h0" />
              <line x1="22" y1="2" x2="11" y2="13" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white">Negative Feedback</h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/40">
          {rows.length}
        </span>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <p className="text-xs text-[#8b85a6] my-auto">
          No negative feedback in this period. 🎉
        </p>
      ) : (
        <ul className="space-y-3 my-auto max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {rows.map((row) => (
            <li className="border border-[#251c45] rounded-xl p-3 bg-[#0e0921]/60" key={row.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-slate-100 line-clamp-2">{row.question}</p>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-700/60">
                  {row.category}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-[#676182]">
                <span>{row.date}</span>
                <span className="flex items-center space-x-1 text-rose-400 font-semibold">
                  <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 3H6a2 2 0 0 0-2 2v16l8-5.7 8 5.7V5a2 2 0 0 0-2-2z" />
                  </svg>
                  <span>Thumbs down</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
