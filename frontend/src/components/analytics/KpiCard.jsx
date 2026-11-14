import { ArrowDownRight, ArrowUpRight, Check, HelpCircle, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react'
import { formatNumber, sparklinePaths } from '../../utils/chart'

const ICONS = {
  messages: MessageSquare,
  check: Check,
  help: HelpCircle,
  thumbUp: ThumbsUp,
  thumbDown: ThumbsDown,
}

const isDown = (id) => id === 'unanswered' || id === 'negative'

/**
 * One KPI tile: icon chip, value, delta arrow, and a tiny sparkline —
 * exactly as in the design's KeyMetricsKPI section.
 */
export default function KpiCard({ kpi }) {
  const Icon = ICONS[kpi.icon] ?? MessageSquare
  const { line, area } = sparklinePaths(kpi.series)
  const gradientId = `grad-${kpi.id}`
  const down = isDown(kpi.id)

  return (
    <article
      className={`${
        kpi.id === 'negative' ? 'col-span-2 sm:col-span-1 ' : ''
      }bg-[#120e24] hover:bg-[#16122d] border border-[#251c45] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200`}
    >
      <div>
        <div className="flex items-center space-x-2 text-xs font-medium text-[#8b85a6] mb-2.5">
          <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${kpi.chip}`}>
            <Icon aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2.5} />
          </span>
          <span className="truncate">{kpi.label}</span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {formatNumber(kpi.value)}
          </span>
          <span className={`text-xs font-semibold flex items-center ${kpi.deltaTone}`}>
            {down ? (
              <ArrowDownRight aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2.5} />
            ) : (
              <ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
            {kpi.delta}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3 pt-1">
        <svg aria-hidden="true" className="w-full h-9 overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 100 28">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={kpi.line} stopOpacity="0.3" />
              <stop offset="100%" stopColor={kpi.line} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={line} fill="none" stroke={kpi.line} strokeLinecap="round" strokeWidth="2" />
          <path d={area} fill={`url(#${gradientId})`} />
        </svg>
      </div>
    </article>
  )
}
