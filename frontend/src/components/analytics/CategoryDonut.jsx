import { formatNumber } from '../../utils/chart'

// Circle geometry from the design: r=38, stroke-width=14
const R = 38
const CIRCUMFERENCE = 2 * Math.PI * R // ~238.76
const GAP = 1.1 // small visual gap between segments

/**
 * Category Distribution donut: segments are computed from the period's
 * percentages (design uses fixed 32/28/24/16 arcs for 7D) with the
 * total conversations in the center.
 */
export default function CategoryDonut({ categories, totalConversations }) {
  // Precompute each segment's dash offset (pure, no mutation during render)
  const segments = categories.reduce(
    (acc, category) => {
      const length = (category.percent / 100) * CIRCUMFERENCE
      acc.items.push({ category, length, dashOffset: -acc.running })
      acc.running += length + GAP
      return acc
    },
    { items: [], running: 0 },
  ).items

  return (
    <article
      className="lg:col-span-5 bg-[#120e24] border border-[#251c45] rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
      data-purpose="category-distribution-chart"
    >
      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 flex items-center justify-center">
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white">Category Distribution</h2>
      </div>

      {/* Donut + legend */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-around gap-6 py-2 my-auto">
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
          <svg aria-hidden="true" className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r={R} stroke="#1b1535" strokeWidth="14" />
            {segments.map(({ category, length, dashOffset }) => (
              <circle
                cx="50"
                cy="50"
                strokeDasharray={`${length.toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
                strokeDashoffset={dashOffset.toFixed(1)}
                fill="none"
                key={category.name}
                r={R}
                stroke={category.color}
                strokeLinecap="round"
                strokeWidth="14"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-white tracking-tight leading-tight">
              {formatNumber(totalConversations)}
            </span>
            <span className="text-[11px] font-medium text-[#8b85a6] uppercase tracking-wider">Total</span>
          </div>
        </div>

        <div className="space-y-3 w-full sm:w-auto min-w-[130px]">
          {categories.map((category) => (
            <div className="flex items-center justify-between space-x-3 text-xs" key={category.name}>
              <span className="flex items-center space-x-2 text-slate-200">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${category.dot}`} />
                <span>{category.name}</span>
              </span>
              <span className="font-bold text-white">{category.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
