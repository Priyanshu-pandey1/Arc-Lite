import { Lock } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Staff-only lock screen shown on the FAQ Management and Analytics
 * routes when nobody is signed in.
 *
 * The message states plainly that the screen is for staff/admin and
 * that a login is required first. "Staff Sign In" opens the login
 * dialog over this screen (via `?login=1`) so the guarded URL is kept —
 * signing in swaps the lock for the real screen with no navigation.
 */
export default function StaffOnlyGate({ title }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const openLogin = () => {
    const next = new URLSearchParams(searchParams)
    next.set('login', '1')
    setSearchParams(next, { replace: false })
  }

  return (
    <div
      className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-app-bg"
      data-purpose="staff-only-gate"
    >
      <div className="w-full max-w-md rounded-2xl bg-app-card border border-app-border p-8 text-center shadow-xl shadow-black/40">
        <span className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 glow-purple">
          <Lock aria-hidden="true" className="w-6 h-6" />
        </span>

        <h1 className="text-xl font-bold text-white mb-2">Staff Only</h1>
        <p className="text-sm text-app-muted leading-relaxed mb-1">
          <span className="font-semibold text-slate-200">{title}</span> is only for staff or admin
          — this page is restricted.
        </p>
        <p className="text-xs text-app-muted mb-6">
          You need to log in first. Sign in with your staff or admin account to continue; the
          public chat stays open to everyone.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 shadow-lg shadow-purple-950/60 transition-colors"
            onClick={openLogin}
            type="button"
          >
            Login to Continue
          </button>
          <button
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-app-surface hover:bg-app-hover border border-app-border transition-colors"
            onClick={() => navigate('/')}
            type="button"
          >
            Back to Chat
          </button>
        </div>
      </div>
    </div>
  )
}
