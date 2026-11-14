import axios from 'axios'

import { getVisitorId } from './visitorId'

/**
 * Central Axios instance for every backend call.
 *
 * When the Flask backend is ready, set VITE_API_BASE_URL (e.g. in
 * frontend/.env) to its origin, e.g. http://localhost:5000/api.
 * JWT tokens are attached automatically once a staff member signs in.
 * The anonymous visitor id is attached to every request so public chat
 * history (and row ownership) works without any login.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arc_lite_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  config.headers['X-Visitor-ID'] = getVisitorId()
  return config
})

export default api
