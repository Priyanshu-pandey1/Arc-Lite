import { smoothLine } from '../../utils/chart'

const SERIES = [
  { key: 'total', color: '#8b5cf6', glow: 'glow-purple', width: 2.6, dot: 4.5, peak: '#a78bfa' },
  { key: 'answered', color: '#10b981', glow: 'glow-emerald', width: 2.6, dot: 4, peak: '#34d399' },
  { key: 'unanswered', color: '#f97316', glow: '', width: 2.4, dot: 3.5, peak: '#fb923c' },
]

const LEGENDS = [
  { label: 'Total', dot: 'bg-purple-500 shadow-purple-500/50' },
  { label: 'Answered', dot: 'bg-emerald-500 shadow-emerald-500/50' },
  { label: 'Unanswered', dot: 'bg-orange-500 shadow-orange-500/50' },
]

// Chart geometry (matches the design's 650×250 viewBox)
const X0 = 55
const X1 = 620
const Y_BASE = 218 // value 0
const Y_TOP = 22

// Real conversation counts are far below the design mock's 1000, so
// the y-axis is derived from the data: a friendly integer step with
// ~4 gridlines that always covers the largest plotted value.
function axisStep(maxValue) {
  const raw = Math.max(maxValue, 1) / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const scaled = raw / magnitude
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10
  return Math.max(1, Math.round(nice * magnitude))
}

function axisMax(maxValue, step) {
  return Math.max(Math.ceil(Math.max(maxValue, 1) / step) * step, step)
}

const toX = (index, count) =>
  count <= 1 ? (X0 + X1) / 2 : X0 + (index * (X1 - X0)) / (count - 1)

const toY = (value, max) => Y_BASE - (Math.min(value, max) / max) * (Y_BASE - Y_TOP)

/**
 * Conversation Activity spline chart: gridlines, three data series
 * with glow, dots (peak point highlighted), and date labels — all
 * computed from the selected period's real activity buckets.
 */
export default function ActivityChart({ activity }) {
  const { labels, total, answered, unanswered } = activity
  const seriesData = { total, answered, unanswered }

  const peakValue = Math.max(...total, ...answered, ...unanswered, 0)
  const step = axisStep(peakValue)
  const max = axisMax(peakValue, step)
  const ticks = []
  for (let value = max; value >= 0; value -= step) ticks.push(value)

  return (
    <article
      className="lg:col-span-7 bg-[#120e24] border border-[#251c45] rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
      data-purpose="conversation-activity-chart"
    >
      {/* Header with legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40 flex items-center justify-center">
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white">Conversation Activity</h2>
        </div>
        <div className="flex items-center space-x-4 text-xs font-medium text-[#8b85a6]">
          {LEGENDS.map((legend) => (
            <span className="flex items-center space-x-1.5" key={legend.label}>
              <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${legend.dot}`} />
              <span>{legend.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full relative mt-2">
        {labels.length === 0 ? (
          <div className="h-56 sm:h-64 flex items-center justify-center text-sm text-[#8b85a6]">
            No activity in this period.
          </div>
        ) : (
          <svg
            aria-label="Conversation activity over the selected period"
            className="w-full h-56 sm:h-64"
            fill="none"
            role="img"
            viewBox="0 0 650 250"
          >
            {/* Y-axis gridlines + labels */}
            {ticks.map((tick) => {
              const y = toY(tick, max)
              return (
                <g key={tick}>
                  <text fill="#676182" fontFamily="sans-serif" fontSize="11" textAnchor="end" x="32" y={y + 3}>
                    {tick.toLocaleString('en-US')}
                  </text>
                  <line
                    stroke={tick === 0 ? '#251c45' : '#1d163a'}
                    strokeDasharray={tick === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                    x1="42"
                    x2="630"
                    y1={y}
                    y2={y}
                  />
                </g>
              )
            })}

            {/* X-axis date labels */}
            {labels.map((label, i) => (
              <text fill="#8b85a6" fontSize="10.5" key={`${label}-${i}`} textAnchor="middle" x={toX(i, labels.length)} y="240">
                {label}
              </text>
            ))}

            {/* Data series */}
            {SERIES.map((series) => {
              const values = seriesData[series.key]
              const points = values.map((value, i) => ({ x: toX(i, values.length), y: toY(value, max) }))
              const peakIndex = values.indexOf(Math.max(...values))
              return (
                <g key={series.key}>
                  <path
                    className={series.glow}
                    d={smoothLine(points)}
                    fill="none"
                    stroke={series.color}
                    strokeLinecap="round"
                    strokeWidth={series.width}
                  />
                  {points.map((point, i) => (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      fill={i === peakIndex ? series.peak : series.color}
                      key={`${series.key}-${i}`}
                      r={i === peakIndex ? series.dot + 0.5 : series.dot}
                      stroke="#120e24"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </article>
  )
}
