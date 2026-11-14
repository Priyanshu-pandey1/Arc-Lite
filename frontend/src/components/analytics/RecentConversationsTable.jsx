import { ThumbsDown, ThumbsUp } from 'lucide-react'

const CATEGORY_STYLES = {
  Courses: 'bg-purple-950 text-purple-300 border-purple-700/60',
  Certificates: 'bg-cyan-950 text-cyan-300 border-cyan-700/60',
  Jobs: 'bg-orange-950 text-orange-300 border-orange-700/60',
  Account: 'bg-blue-950 text-blue-300 border-blue-700/60',
}

const STATUS_STYLES = {
  Answered: 'bg-emerald-950/60 text-emerald-400 border-emerald-600/50',
  Unclear: 'bg-amber-950/60 text-amber-400 border-amber-600/50',
  Unanswered: 'bg-rose-950/60 text-rose-400 border-rose-600/50',
}

/**
 * Recent Conversations table (bottom-left, 8-column span): question,
 * category pill, status pill, feedback icon, date. Horizontally
 * scrollable inside the card on small screens — the page itself
 * never scrolls sideways.
 */
export default function RecentConversationsTable({ rows }) {
  return (
    <article
      className="lg:col-span-8 bg-[#120e24] border border-[#251c45] rounded-2xl p-5 sm:p-6"
      data-purpose="recent-conversations-table"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40 flex items-center justify-center">
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white">Recent Conversations</h2>
        </div>
        <a className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center group" href="#view-all">
          View All <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar -mx-2 sm:mx-0">
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[580px]">
          <thead>
            <tr className="text-[#8b85a6] border-b border-[#251c45]/70 pb-2">
              <th className="pb-3 px-2 font-medium" scope="col">User Question</th>
              <th className="pb-3 px-2 font-medium" scope="col">Category</th>
              <th className="pb-3 px-2 font-medium" scope="col">Status</th>
              <th className="pb-3 px-2 font-medium text-center" scope="col">Feedback</th>
              <th className="pb-3 px-2 font-medium text-right" scope="col">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1738]/50">
            {rows.map((row) => (
              <tr className="hover:bg-[#181333]/50 transition-colors" key={row.id ?? `${row.question}-${row.date}`}>
                <td className="py-3.5 px-2 font-medium text-slate-100 truncate max-w-[210px]">
                  {row.question}
                </td>
                <td className="py-3.5 px-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_STYLES[row.category] ?? 'bg-slate-800 text-slate-300 border-slate-600/60'}`}>
                    {row.category}
                  </span>
                </td>
                <td className="py-3.5 px-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[row.status] ?? STATUS_STYLES.Answered}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3.5 px-2 text-center">
                  {row.feedback ? (
                    <span className={`inline-flex ${row.feedback === 'down' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {row.feedback === 'down' ? (
                        <ThumbsDown aria-label="Negative feedback" className="w-4 h-4" fill="currentColor" />
                      ) : (
                        <ThumbsUp aria-label="Positive feedback" className="w-4 h-4" fill="currentColor" />
                      )}
                    </span>
                  ) : (
                    <span aria-label="No feedback yet" className="text-[#4d4768]">—</span>
                  )}
                </td>
                <td className="py-3.5 px-2 text-right text-[#8b85a6]">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
