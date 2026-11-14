import { Award, Briefcase, GraduationCap, MessageSquare, User } from 'lucide-react'
import { formatNumber, sparklinePaths } from '../../utils/chart'

const ICONS = {
  message: MessageSquare,
  graduation: GraduationCap,
  award: Award,
  briefcase: Briefcase,
  user: User,
}

/**
 * One FAQ statistics tile: coloured icon chip, count, trend delta and a
 * sparkline — the KeyFAQStats row from the FAQ Management design.
 * The fifth tile spans both columns on mobile, as in the mockup.
 * While `loading`, the count, delta and sparkline are replaced with
 * shimmering skeleton placeholders — real (possibly zero) values only
 * render once the API response has actually arrived.
 */
export default function FaqKpiCard({ kpi, wide = false, loading = false }) {
  const Icon = ICONS[kpi.icon] ?? MessageSquare
  const { line, area } = sparklinePaths(kpi.series)
  const gradientId = `faq-grad-${kpi.id}`

  return (
    <article
      className={`${
        wide ? 'col-span-2 lg:col-span-1 ' : ''
      }bg-[#120e24] hover:bg-[#16122d] border border-[#251c45] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200`}
    >
      <div>
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${kpi.chip}`}>
            <Icon aria-hidden="true" className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <span className="text-xs font-medium text-[#8b85a6] truncate">{kpi.label}</span>
        </div>
        {loading ? (
          <>
            <div aria-hidden="true" className="h-8 w-16 rounded-lg bg-[#251c45] animate-pulse" />
            <span className="sr-only">Loading {kpi.label} count…</span>
          </>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {formatNumber(kpi.value)}
            </span>
            <span className="text-xs font-semibold text-emerald-400">{kpi.delta}</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {loading ? (
        <div aria-hidden="true" className="mt-3 w-full h-8 rounded-lg bg-[#251c45]/70 animate-pulse" />
      ) : (
        <div className="mt-3 w-full h-8 overflow-hidden">
          <svg
            aria-hidden="true"
            className="w-full h-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 100 28"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={kpi.line} stopOpacity="0.3" />
                <stop offset="100%" stopColor={kpi.line} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={line} fill="none" stroke={kpi.line} strokeLinecap="round" strokeWidth="2.5" />
            <path d={area} fill={`url(#${gradientId})`} />
          </svg>
        </div>
      )}
    </article>
  )
}
