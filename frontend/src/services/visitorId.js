/**
 * Anonymous visitor identity for the public chatbot.
 *
 * A random UUIDv4 is generated the first time someone opens the chat
 * and persisted in localStorage, so the same browser reuses it across
 * refreshes and later visits — no login, no email, no personal data.
 * The backend validates the format server-side (see read_visitor_id in
 * app.py) and only ever returns or mutates rows whose visitor_id
 * matches, so one visitor cannot reach another visitor's history.
 *
 * Privacy model: the id identifies a browser profile, not a verified
 * person. Anyone who obtains the id (it is sent as the X-Visitor-ID
 * header on API calls) could read that browser's history, which is why
 * it is 122 random bits with no lookup endpoint and is never combined
 * with any personal information.
 */

const STORAGE_KEY = 'arc_lite_visitor_id'

// Same format the backend enforces: lowercase UUID.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// In-memory fallback for environments where localStorage is blocked
// (fully disabled private modes): the id then survives only until the
// page is reloaded — history still works within the session.
let sessionFallbackId = null

/** Random, URL-safe, non-guessable id (UUIDv4 semantics). */
function generateVisitorId() {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    // Older browsers without randomUUID: build a UUIDv4 from
    // cryptographically strong random bytes.
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80 // RFC 4122 variant
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    }
  }

  // Last resort (no Web Crypto): still random, just not crypto-grade.
  const hex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * The visitor id for this browser: reused from localStorage when valid,
 * generated and persisted on first use, regenerated if the stored value
 * was tampered with or corrupted (the backend would reject it).
 */
export function getVisitorId() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (stored && UUID_PATTERN.test(stored)) return stored

    const fresh = generateVisitorId()
    localStorage.setItem(STORAGE_KEY, fresh)
    return fresh
  } catch {
    // localStorage unavailable: keep one id for this page session.
    if (!sessionFallbackId || !UUID_PATTERN.test(sessionFallbackId)) {
      sessionFallbackId = generateVisitorId()
    }
    return sessionFallbackId
  }
}
