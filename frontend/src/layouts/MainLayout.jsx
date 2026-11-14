import { useCallback, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader'
import AuthModal from '../components/auth/AuthModal'

/** Search param that marks the staff login dialog as open. */
export const LOGIN_PARAM = 'login'

/** Strip the login param from a search string, keeping any others. */
function withoutLoginParam(search) {
  const params = new URLSearchParams(search)
  params.delete(LOGIN_PARAM)
  const query = params.toString()
  return query ? `?${query}` : ''
}

/**
 * Shell shared by every screen: fixed-height column with the
 * application header on top and the routed page below.
 *
 * The Staff Login dialog is open whenever `?login=1` is present. Keeping
 * it in the search string (rather than a /login route) means the page
 * underneath never unmounts — opening the dialog over Chat no longer
 * remounts it, so the draft, scroll position and loaded history all
 * survive. Closing simply drops the param, so the URL doubles as the
 * "return to" address and the browser Back button closes the dialog.
 */
export default function MainLayout() {
  // Sidebar drawer state lives here so the header toggle (mobile)
  // can open the chat history drawer on the Chat screen.
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const authOpen = new URLSearchParams(location.search).get(LOGIN_PARAM) === '1'

  /** Close the dialog while staying on the current page. */
  const closeAuth = useCallback(() => {
    navigate({ pathname: window.location.pathname, search: withoutLoginParam(window.location.search) }, { replace: true })
  }, [navigate])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AppHeader onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </div>

      {/* Mounted only while open so every visit starts on the Login view */}
      {authOpen && <AuthModal onClose={closeAuth} />}
    </div>
  )
}
