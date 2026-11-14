import { WELCOME_CHIPS } from '../../utils/constants'

/**
 * Welcome/hero state shown before any message is sent.
 */
export default function WelcomeHero({ onPickChip }) {
  return (
    <div className="m-auto w-full max-w-2xl py-12 flex flex-col items-center text-center">
      {/* Brand block + intro copy */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-400 opacity-20 blur-sm" />
              <div className="relative w-full h-full rounded-2xl bg-app-card border border-app-border flex items-center justify-center shadow-lg">
                <img alt="Arc Lite Logo" className="w-full h-full object-contain p-1" src="/logo.png" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight flex items-baseline gap-2">
              <span className="text-white">Arc</span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #c084fc 0%, #a855f7 40%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Lite
              </span>
            </h1>
          </div>
          <p className="mt-1 text-[10px] sm:text-xs tracking-[0.25em] font-semibold text-app-muted uppercase pl-0.5">
            Ask • Learn • Explore
          </p>
        </div>

        <div className="hidden md:block w-px h-10 bg-app-border" />

        <p className="text-xs sm:text-sm text-app-muted max-w-xs sm:max-w-sm">
          Your AI-powered FAQ assistant for ArchintX. Ask questions about courses, certificates,
          jobs, and your account. Get answers from our FAQ knowledge base.
        </p>
      </div>

      {/* Feature chips */}
      <div className="flex flex-col items-center justify-center gap-2 max-w-xl mb-4 w-full select-none">
        {WELCOME_CHIPS.map((row, rowIndex) => (
          <div className="flex flex-wrap items-center justify-center gap-2" key={rowIndex}>
            {row.map((chip) => (
              <button
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-app-surface border border-app-border text-slate-200 hover:border-violet-500 hover:text-white transition-colors"
                key={chip}
                onClick={() => onPickChip(chip)}
                type="button"
              >
                {chip}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
