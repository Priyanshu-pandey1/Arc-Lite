
import api from './api'
import { AUTH_EVENT } from '../utils/constants'

/** Notify the application when authentication changes. */
function announceAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT))
}

/** Real staff login using Flask and Neon PostgreSQL. */
export async function login(email, password) {
  try {
    const { data } = await api.post('/auth/login', {
      email,
      password,
    })

    // Store the JWT returned by Flask.
    localStorage.setItem('arc_lite_token', data.token)

    // Store staff information for the frontend.
    localStorage.setItem(
      'arc_lite_staff',
      JSON.stringify(data.staff)
    )

    announceAuthChange()

    return data
  } catch (error) {
    const message =
      error.response?.data?.error ||
      'Unable to sign in. Please try again.'

    throw new Error(message)
  }
}

/** Password reset is not implemented in the backend yet. */
export async function requestPasswordReset() {
  throw new Error(
    'Password reset is not available yet. Please contact the administrator.'
  )
}

/** Clear the staff session. */
export function logout() {
  localStorage.removeItem('arc_lite_token')
  localStorage.removeItem('arc_lite_staff')
  announceAuthChange()
}

/** Check whether a staff JWT exists. */
export function isLoggedIn() {
  return Boolean(localStorage.getItem('arc_lite_token'))
}
