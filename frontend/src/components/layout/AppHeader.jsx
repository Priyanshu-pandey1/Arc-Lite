import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { List, LogOut, Menu } from 'lucide-react'
import { NAV_ITEMS } from '../../utils/constants'
import useClickOutside from '../../hooks/useClickOutside'
import useAuth from '../../hooks/useAuth'
import * as authService from '../../services/authService'
import { cx } from '../../utils/helpers'

/**
 * Application header — same logo, navigation and controls on every screen.
 *
 * "Login" opens the staff dialog via the `?login=1` search param (so the
 * page underneath never remounts). Once signed in it becomes "Logout".
 * @param {() => void} [onToggleSidebar] mobile chat-history drawer toggle
 */
export default function AppHeader({ onToggleSidebar }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen)

  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const openLogin = () => {
    const next = new URLSearchParams(searchParams)
    next.set('login', '1')
    setSearchParams(next, { replace: false })
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/', { replace: true })
  }

  const navLinkClass = ({ isActive }) =>
    cx(
      'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
      isActive ? 'text-white bg-app-card/60' : 'text-app-muted hover:text-white hover:bg-app-hover/50',
    )

  const dropdownLinkClass = ({ isActive }) =>
    cx(
      'flex items-center px-4 py-2.5 text-sm transition-colors',
      isActive ? 'text-white hover:bg-app-hover' : 'text-slate-300 hover:text-white hover:bg-app-hover',
    )

  return (
    <header
      className="relative z-30 flex items-center justify-between px-4 lg:px-6 h-14 bg-app-bg border-b border-app-border shrink-0 select-none"
      data-purpose="application-header"
    >
      {/* Left: sidebar toggle (mobile), brand logo, desktop nav */}
      <div className="flex items-center space-x-6">
        <button
          aria-label="Open chat history sidebar"
          className="lg:hidden p-1.5 text-app-muted hover:text-white rounded-lg hover:bg-app-hover transition-colors"
          onClick={onToggleSidebar}
          type="button"
        >
          <List aria-hidden="true" className="w-5 h-5" />
        </button>

        <Link className="flex items-center space-x-2 text-white font-semibold tracking-tight text-lg" to="/">
          <img src="/logo.png" alt="Arc Lite Logo" className="w-7 h-7 object-contain rounded-full" />
          <span className="hidden sm:inline font-bold tracking-wide">
            <span className="text-white">Arc</span>
            <span style={{ color: 'rgb(170, 89, 248)' }}>Lite</span>
          </span>
        </Link>

        <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {NAV_ITEMS.map((item) => (
            <NavLink className={navLinkClass} end key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right: Login / Logout + hamburger dropdown */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {isLoggedIn ? (
          <button
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-app-muted hover:text-rose-400 transition-colors"
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        ) : (
          <button
            className="px-2.5 py-1 text-sm font-medium text-app-muted hover:text-white transition-colors"
            onClick={openLogin}
            type="button"
          >
            Login
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            aria-expanded={menuOpen}
            aria-label="Toggle primary menu"
            className="p-1.5 text-app-muted hover:text-white rounded-lg hover:bg-app-hover transition-colors"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <Menu aria-hidden="true" className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-app-card border border-app-border shadow-xl shadow-black/60 py-2 z-50">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  className={dropdownLinkClass}
                  end
                  key={item.to}
                  onClick={() => setMenuOpen(false)}
                  to={item.to}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cx(
                          'w-2 h-2 rounded-full mr-2.5',
                          isActive ? 'bg-violet-400' : 'bg-slate-600',
                        )}
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
