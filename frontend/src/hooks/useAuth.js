import { useEffect, useState } from 'react'
import { isLoggedIn } from '../services/authService'
import { AUTH_EVENT } from '../utils/constants'

/**
 * useAuth — reactive staff session flag. The raw isLoggedIn() read only
 * tells you the state at call time, so authService announces changes
 * with a window event (and the `storage` event covers other tabs).
 */
export default function useAuth() {
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn())

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn())
    window.addEventListener(AUTH_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return { isLoggedIn: loggedIn }
}
