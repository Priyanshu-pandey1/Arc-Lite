import api from './api'
import { TIME_PERIODS } from '../utils/constants'

/**
 * Analytics service — the single boundary between the dashboard UI and
 * the staff-only GET /api/analytics endpoint. The backend returns raw
 * metrics straight from Neon; this module maps them into the shapes
 * the existing dashboard components expect (KPI metadata, category
 * colours, status labels), so components stay presentation-only.
 */

// Static KPI presentation (icon, chip and sparkline line colour) —
// one entry per metric the dashboard tracks.
const KPI_TONES = {
  blue: { icon: 'messages', chip: 'bg-blue-950/80 text-blue-400 border-blue-800/40', line: '#8b5cf6' },
  emerald: { icon: 'check', chip: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40', line: '#10b981' },
  amber: { icon: 'help', chip: 'bg-amber-950/80 text-amber-400 border-amber-800/40', line: '#f97316' },
  cyan: { icon: 'thumbUp', chip: 'bg-blue-950/80 text-cyan-400 border-cyan-800/40', line: '#06b6d4' },
  rose: { icon: 'thumbDown', chip: 'bg-rose-950/80 text-rose-400 border-rose-800/40', line: '#f43f5e' },
}

const KPI_DEFINITIONS = [
  { id: 'total', label: 'Total Conversations', tone: 'blue', deltaTone: 'text-emerald-400' },
  { id: 'answered', label: 'Questions Answered', tone: 'emerald', deltaTone: 'text-emerald-400' },
  { id: 'unanswered', label: 'Unanswered Questions', tone: 'amber', deltaTone: 'text-orange-400' },
  { id: 'positive', label: 'Positive Feedback', tone: 'cyan', deltaTone: 'text-emerald-400' },
  { id: 'negative', label: 'Negative Feedback', tone: 'rose', deltaTone: 'text-rose-400' },
]

// Donut/legend colours per known category (design palette).
const CATEGORY_STYLES = {
  Courses: { color: '#8b5cf6', dot: 'bg-purple-500 shadow-purple-500/50' },
  Certificates: { color: '#10b981', dot: 'bg-emerald-500 shadow-emerald-500/50' },
  Jobs: { color: '#f97316', dot: 'bg-orange-500 shadow-orange-500/50' },
  Account: { color: '#3b82f6', dot: 'bg-blue-500 shadow-blue-500/50' },
}
const FALLBACK_CATEGORY_STYLE = { color: '#64748b', dot: 'bg-slate-500 shadow-slate-500/50' }

// Backend verdict -> status pill label used by the recent table.
const STATUS_BY_VERDICT = {
  answered: 'Answered',
  unclear: 'Unclear',
  refused: 'Unanswered',
}

/** "Oct 31, 2026" for a row date, per the design's table format. */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Percent change vs the previous window; '—' when not comparable. */
function deltaText(current, previous) {
  if (previous == null) return '—' // all-time has no previous window
  if (previous === 0) return current === 0 ? '0%' : '—'
  const pct = Math.round(((current - previous) / previous) * 100)
  return `${pct > 0 ? '+' : ''}${pct}%`
}

/** KPI sparklines need at least two points to draw a line. */
function padSeries(series) {
  if (Array.isArray(series) && series.length >= 2) return series
  const value = Array.isArray(series) && series.length === 1 ? series[0] : 0
  return [value, value]
}

/** Map the raw API payload onto the dashboard's component shapes. */
function present(data) {
  const overall = data.overall
  const previous = data.previous
  const activity = data.activity

  const kpiValues = {
    total: overall.total,
    answered: overall.answered,
    unanswered: overall.total - overall.answered,
    positive: overall.positive_ratings,
    negative: overall.negative_ratings,
  }
  const previousValues = previous
    ? {
        total: previous.total,
        answered: previous.answered,
        unanswered: previous.total - previous.answered,
        positive: previous.positive_ratings,
        negative: previous.negative_ratings,
      }
    : null

  const kpis = KPI_DEFINITIONS.map((kpi) => ({
    ...kpi,
    ...KPI_TONES[kpi.tone],
    value: kpiValues[kpi.id],
    delta: deltaText(kpiValues[kpi.id], previousValues?.[kpi.id]),
    series: padSeries(activity[kpi.id]),
  }))

  const categories = data.categories.map((category) => {
    const style = CATEGORY_STYLES[category.category] ?? FALLBACK_CATEGORY_STYLE
    return {
      name: category.category,
      total: category.total,
      answered: category.answered,
      unclear: category.unclear,
      refused: category.refused,
      answeredPercent: category.answered_percent,
      unclearPercent: category.unclear_percent,
      refusedPercent: category.refused_percent,
      averageResponseTimeMs: category.average_response_time_ms,
      percent: overall.total > 0
        ? Math.round((category.total / overall.total) * 100)
        : 0,
      ...style,
    }
  })

  return {
    period: data.period,
    overall,
    kpis,
    activity,
    categories,
    totalConversations: overall.total,
    accuracy: data.accuracy_percent,
    recent: data.recent.map((row) => ({
      id: row.id,
      question: row.question,
      category: row.category ?? 'Uncategorized',
      status: STATUS_BY_VERDICT[row.verdict] ?? row.verdict,
      feedback: row.rating, // 'up' | 'down' | null (never rated)
      date: row.created_at ? formatDate(row.created_at) : '—',
    })),
    negativeFeedback: data.negative_feedback.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category ?? 'Uncategorized',
      rating: row.rating,
      date: row.created_at ? formatDate(row.created_at) : '—',
    })),
  }
}

/**
 * Fetch every dashboard dataset for a time period from Neon via the
 * staff-protected /api/analytics endpoint (JWT attached by the shared
 * axios interceptor in services/api.js).
 * @param {'7D'|'30D'|'90D'|'ALL'} period
 * @returns {Promise<object>} dashboard-shaped data
 */
export async function getAnalytics(period = '7D') {
  const key = TIME_PERIODS.includes(period) ? period : '7D'
  const { data } = await api.get('/analytics', { params: { period: key.toLowerCase() } })
  return present(data)
}
