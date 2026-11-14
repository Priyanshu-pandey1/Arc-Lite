/**
 * Average Response Time card: one row per category with the backend's
 * NULL-safe AVG(response_time_ms). Categories where every response
 * time is NULL show a dash instead of a fake 0.
 */
export default function ResponseTimeCard({ categories }) {
  const known = categories.filter((category) => category.averageResponseTimeMs != null)
  const max = known.reduce((peak, category) => Math.max(peak, category.averageResponseTimeMs), 0)

  return (
    <article
      className="lg:col-span-4 bg-[#120e24] border border-[#251c45] rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
      data-purpose="response-time-card"
    >
      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 flex items-center justify-center">
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white">Avg. Response Time</h2>
      </div>

      {/* Category rows */}
      {categories.length === 0 ? (
        <p className="text-xs text-[#8b85a6] my-auto">No conversations in this period.</p>
      ) : (
        <div className="space-y-4 my-auto">
          {categories.map((category) => (
            <div key={category.name}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center space-x-2 text-slate-200 font-medium">
                  <span className={`w-2 h-2 rounded-full shadow-sm ${category.dot}`} />
                  <span>{category.name}</span>
                </span>
                <span className="text-white font-semibold">
                  {category.averageResponseTimeMs != null
                    ? `${category.averageResponseTimeMs} ms`
                    : '—'}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1b1535] overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                  style={{
                    width:
                      category.averageResponseTimeMs != null && max > 0
                        ? `${Math.round((category.averageResponseTimeMs / max) * 100)}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#676182] mt-5">Measured per question, per category</p>
    </article>
  )
}
