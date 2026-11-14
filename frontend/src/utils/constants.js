/**
 * Shared navigation definition — used by the header nav and hamburger menu
 * so both stay in sync across every screen.
 */
export const NAV_ITEMS = [
  { label: 'Chat', to: '/' },
  { label: 'FAQ Management', to: '/faq-management' },
  { label: 'Analytics Dashboard', to: '/analytics' },
]

/** Suggestion chips shown on the chat welcome screen. */
export const WELCOME_CHIPS = [
  ['Courses', 'Certificates', 'Jobs', 'Account'],
  ['FAQ Assistant', 'Verified FAQs', 'Feedback Enabled'],
]

/** Reply styles offered by the composer's model pill. */
export const REPLY_MODES = ['Standard', 'Fast', 'Detailed']

/**
 * Dashboard time periods (segmented filter labels). analyticsService
 * lowercases them into the ?period= values the backend accepts
 * (7d / 30d / 90d / all).
 */
export const TIME_PERIODS = ['7D', '30D', '90D', 'ALL']

/**
 * Window event fired by authService whenever the staff session changes,
 * so useAuth (and the staff-only route guards) can re-check login state.
 */
export const AUTH_EVENT = 'arc-lite-auth-changed'
