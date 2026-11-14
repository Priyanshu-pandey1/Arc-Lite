import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, X } from 'lucide-react'
import AuthInput from './AuthInput'
import * as authService from '../../services/authService'
import { cx } from '../../utils/helpers'

const VIEWS = {
  login: {
    title: 'Staff Login',
    subtitle: 'Access your Arc Lite staff dashboard.',
  },
  forgot: {
    title: 'Reset Password',
    subtitle: 'Enter your registered staff email address to receive password reset instructions.',
  },
}

/**
 * Staff authentication modal rendered over the Chat screen (matches the
 * Stitch "Staff Login" design). Contains the Login and Forgot Password
 * views; Escape, the backdrop and the × all close it.
 */
export default function AuthModal({ onClose }) {
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [message, setMessage] = useState('')

  // Escape closes the modal (mounted fresh on each open, so state starts clean).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleLogin = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      await authService.login(email, password)
      setStatus('done')
      setMessage('Signed in successfully.')
      setTimeout(onClose, 700)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Sign in failed. Please try again.')
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      await authService.requestPasswordReset(email)
      setStatus('done')
      setMessage(`If an account exists for ${email}, a reset link has been sent.`)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Could not send the reset link. Please try again.')
    }
  }

  const busy = status === 'loading'
  const info = VIEWS[view]

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      data-purpose="staff-auth-modal"
      role="dialog"
    >
      {/* Backdrop */}
      <button
        aria-label="Close login dialog"
        className="fixed inset-0 bg-[#04020a]/80 backdrop-blur-[3px] transition-opacity cursor-default"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />

      {/* Modal card */}
      <div className="relative w-full max-w-[430px] rounded-2xl bg-[#0e0921] border border-[#231846] shadow-2xl shadow-purple-950/40 p-6 sm:p-8 z-10 my-auto text-white">
        <button
          aria-label="Close modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-app-hover/60 transition-colors focus:outline-none"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="w-5 h-5" strokeWidth={2.2} />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-1 pr-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">{info.title}</h2>
          <p className="text-xs sm:text-sm text-slate-400">{info.subtitle}</p>
        </div>

        {view === 'login' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <AuthInput
              autoComplete="email"
              icon={Mail}
              id="staff-email"
              label="Email Address"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email address"
              required
              type="email"
              value={email}
            />

            <AuthInput
              autoComplete="current-password"
              icon={Lock}
              id="staff-password"
              label="Enter Password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
            >
              {/* Show/hide password toggle */}
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="ml-2 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-app-hover/60 transition-colors shrink-0 focus:outline-none"
                onClick={() => setShowPassword((shown) => !shown)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="w-4 h-4" strokeWidth={1.8} />
                ) : (
                  <Eye aria-hidden="true" className="w-4 h-4" strokeWidth={1.8} />
                )}
              </button>
            </AuthInput>

            {message && (
              <p
                className={cx(
                  'text-xs text-center',
                  status === 'error' ? 'text-rose-400' : 'text-emerald-400',
                )}
              >
                {message}
              </p>
            )}

            <div className="pt-2">
              <button
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#6d28d9] hover:bg-[#7c3aed] active:bg-[#5b21b6] transition-colors shadow-lg shadow-purple-950/60 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60 disabled:cursor-wait"
                disabled={busy}
                type="submit"
              >
                {busy ? 'Signing in…' : 'Sign In'}
              </button>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">Forgot password? </span>
              <button
                className="text-xs text-[#a855f7] hover:text-[#c084fc] font-medium transition-colors cursor-pointer focus:outline-none underline-offset-2 hover:underline"
                onClick={() => {
                  setView('forgot')
                  setStatus('idle')
                  setMessage('')
                }}
                type="button"
              >
                Click here to reset
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleReset}>
            <AuthInput
              autoComplete="email"
              icon={Mail}
              id="reset-email"
              label="Email Address"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email address"
              required
              type="email"
              value={email}
            />

            {message && (
              <p
                className={cx(
                  'text-xs text-center',
                  status === 'error' ? 'text-rose-400' : 'text-emerald-400',
                )}
              >
                {message}
              </p>
            )}

            <div className="pt-2">
              <button
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#6d28d9] hover:bg-[#7c3aed] active:bg-[#5b21b6] transition-colors shadow-lg shadow-purple-950/60 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60 disabled:cursor-wait"
                disabled={busy}
                type="submit"
              >
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                className="text-xs text-[#a855f7] hover:text-[#c084fc] font-medium transition-colors cursor-pointer focus:outline-none inline-flex items-center gap-1.5"
                onClick={() => {
                  setView('login')
                  setStatus('idle')
                  setMessage('')
                }}
                type="button"
              >
                <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2} />
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
