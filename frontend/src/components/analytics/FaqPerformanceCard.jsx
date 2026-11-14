/**
 * "FAQs Performing Well!" highlight card (bottom-right, gradient
 * surface): glowing check badge, decorative bar graph, and accuracy
 * copy — per the design's faq-performance-card.
 */
export default function FaqPerformanceCard({ accuracy }) {
  return (
    <article
      className="lg:col-span-4 rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-[#1b123d] via-[#150f2f] to-[#120d29] border border-purple-900/40 shadow-xl flex flex-col justify-between"
      data-purpose="faq-performance-card"
    >
      {/* Badge + decorative bars */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
          <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div aria-hidden="true" className="flex items-end space-x-1.5 opacity-80 pr-1">
          <div className="w-2.5 h-6 bg-gradient-to-t from-purple-800 to-purple-600 rounded-t-sm" />
          <div className="w-2.5 h-10 bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-sm" />
          <div className="w-2.5 h-14 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm" />
          <div className="w-2.5 h-8 bg-gradient-to-t from-purple-800 to-purple-500 rounded-t-sm" />
        </div>
      </div>

      {/* Body */}
      <div className="space-y-1.5 mt-2 mb-1">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">FAQs Performing Well!</h3>
        <p className="text-xs sm:text-sm text-[#8b85a6] leading-relaxed max-w-xs">
          Your assistant is answering <span className="text-emerald-400 font-semibold">{accuracy}%</span> of
          questions correctly.
        </p>
      </div>

      {/* Ambient glow */}
      <div aria-hidden="true" className="absolute -bottom-10 -right-10 w-36 h-36 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
    </article>
  )
}
