/**
 * Verdict Breakdown card: answered / unclear / refused counts with
 * zero-safe percentages and slim progress bars, computed by the
 * backend for the selected period.
 */
const VERDICTS = [
  { id: 'answered', label: 'Answered', bar: 'bg-emerald-500' },
  { id: 'unclear', label: 'Unclear', bar: 'bg-amber-500' },
  { id: 'refused', label: 'Refused', bar: 'bg-rose-500' },
]

export default function VerdictBreakdownCard({ overall }) {
  return (
    <article
      className="lg:col-span-4 bg-[#120e24] border border-[#251c45] rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
      data-purpose="verdict-breakdown-card"
    >
      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40 flex items-center justify-center">
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white">Verdict Breakdown</h2>
      </div>

      {/* Verdict rows */}
      <div className="space-y-4 my-auto">
        {VERDICTS.map((verdict) => {
          const count = overall[verdict.id]
          const percentValue = overall[`${verdict.id}_percent`]
          return (
            <div key={verdict.id}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center space-x-2 text-slate-200 font-medium">
                  <span className={`w-2 h-2 rounded-full ${verdict.bar}`} />
                  <span>{verdict.label}</span>
                </span>
                <span className="text-[#8b85a6]">
                  <span className="text-white font-semibold">{count}</span>
                  {' · '}
                  {percentValue}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1b1535] overflow-hidden">
                <div
                  className={`h-full rounded-full ${verdict.bar} transition-all duration-500`}
                  style={{ width: `${percentValue}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-[#676182] mt-5">
        {overall.total} conversation{overall.total === 1 ? '' : 's'} in this period
      </p>
    </article>
  )
}
