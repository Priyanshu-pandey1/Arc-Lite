import useAuth from '../../hooks/useAuth'
import StaffOnlyGate from './StaffOnlyGate'

/**
 * Route guard for the staff screens (FAQ Management, Analytics).
 * Signed out → the lock screen; signed in → the real screen.
 * @param {{ title: string, children: import('react').ReactNode }} props
 */
export default function RequireStaff({ title, children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <StaffOnlyGate title={title} />
}
