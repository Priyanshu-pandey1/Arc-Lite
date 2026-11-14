import { BarChart3, AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import PeriodFilter from '../components/analytics/PeriodFilter'
import KpiCard from '../components/analytics/KpiCard'
import ActivityChart from '../components/analytics/ActivityChart'
import CategoryDonut from '../components/analytics/CategoryDonut'
import RecentConversationsTable from '../components/analytics/RecentConversationsTable'
import FaqPerformanceCard from '../components/analytics/FaqPerformanceCard'
import VerdictBreakdownCard from '../components/analytics/VerdictBreakdownCard'
import ResponseTimeCard from '../components/analytics/ResponseTimeCard'
import NegativeFeedbackCard from '../components/analytics/NegativeFeedbackCard'
import useAnalytics from '../hooks/useAnalytics'

/**
 * Analytics Dashboard screen — KPI tiles, activity + distribution
 * charts, verdict/response-time/negative-feedback detail cards, the
 * recent conversations table, and the FAQ performance card.
 * The 7D / 30D / 90D / ALL filter refetches every dataset from
 * GET /api/analytics (real Neon data, never mock samples).
 */
export default function Analytics() {
  const { period, setPeriod, data, isLoading, error, retry } = useAnalytics()

  return (
    <div className="flex-1 overflow-y-auto bg-app-bg" data-purpose="analytics-dashboard">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Header + time filter */}
        <section aria-label="Dashboard Overview Header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400 mt-1 sm:mt-0 shrink-0">
              <BarChart3 aria-hidden="true" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Analytics Dashboard</h1>
              <p className="text-xs sm:text-sm text-[#8b85a6] mt-0.5 max-w-xl">
                Monitor conversations, evaluate answer quality, and understand what users are asking.
              </p>
            </div>
          </div>
          <PeriodFilter onChange={setPeriod} period={period} />
        </section>

        {isLoading ? (
          <div aria-label="Loading analytics" className="flex items-center justify-center py-24 text-sm text-[#8b85a6]" role="status">
            Loading analytics…
          </div>
        ) : error ? (
          /* Meaningful error state: keeps the header/filter usable and
             offers a retry that refetches the same period. */
          <section
            aria-label="Analytics error"
            className="flex flex-col items-center justify-center text-center py-20 px-6 bg-[#120e24] border border-[#251c45] rounded-2xl"
            role="alert"
          >
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle aria-hidden="true" className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white">Couldn&apos;t load analytics</h2>
            <p className="text-sm text-[#8b85a6] mt-1 max-w-md">{error}</p>
            <button
              className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              onClick={retry}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          </section>
        ) : !data || data.totalConversations === 0 ? (
          /* Empty state: no conversations (or none in the period). */
          <section
            aria-label="No analytics data"
            className="flex flex-col items-center justify-center text-center py-20 px-6 bg-[#120e24] border border-[#251c45] rounded-2xl"
            data-purpose="analytics-empty-state"
          >
            <div className="w-12 h-12 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center mb-4">
              <Inbox aria-hidden="true" className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white">No conversations yet</h2>
            <p className="text-sm text-[#8b85a6] mt-1 max-w-md">
              There is no analytics data for the selected period. Statistics will appear as soon as
              visitors start chatting with the assistant.
            </p>
          </section>
        ) : (
          <>
            {/* KPI tiles */}
            <section aria-label="Key Performance Indicators" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {data.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </section>

            {/* Charts row */}
            <section aria-label="Visual Analytics Charts" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <ActivityChart activity={data.activity} />
              <CategoryDonut categories={data.categories} totalConversations={data.totalConversations} />
            </section>

            {/* Detail cards: verdict split, response times, negative feedback */}
            <section aria-label="Verdict and Performance Details" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <VerdictBreakdownCard overall={data.overall} />
              <ResponseTimeCard categories={data.categories} />
              <NegativeFeedbackCard rows={data.negativeFeedback} />
            </section>

            {/* Bottom row */}
            <section aria-label="Recent Logs and Performance Summary" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <RecentConversationsTable rows={data.recent} />
              <FaqPerformanceCard accuracy={data.accuracy} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
