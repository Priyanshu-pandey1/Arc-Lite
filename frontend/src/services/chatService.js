
import api from './api'
import { isLoggedIn } from './authService'

/**
 * Chat service — the single boundary between the chat screen and the
 * Flask/Neon backend.
 *
 * Conversation history lives in Neon (every POST /chat logs a row in
 * the conversations table) and is served through two route families:
 *
 * - Signed-in staff  -> /conversations (staff JWT), the full feed.
 * - Signed-out       -> /public/conversations, scoped to this browser's
 *   visitors            anonymous visitor id (X-Visitor-ID, see
 *                       services/visitorId.js) — same UI fields, but a
 *                       visitor only ever receives their own rows.
 *
 * Which family is used is decided here from the session state, so the
 * chat hook never has to care. Rename/Pin persist via PATCH and Delete
 * is a soft-delete: DELETE flags is_hidden = TRUE in Neon so rows stay
 * in the database for Analytics but leave the sidebar. A UI conversation
 * can span several Neon rows (one per Q/A pair), so the hook resolves
 * thread → row ids via messages' backendConversationId.
 */

/** Conversation route family matching the current session. */
function historyBase() {
  return isLoggedIn() ? '/conversations' : '/public/conversations'
}

/** Map one Neon conversations row to the UI conversation model. */
function toConversation(row) {
  const createdAt = Date.parse(row.created_at)
  const defaultTitle =
    row.question.length > 48 ? `${row.question.slice(0, 48)}…` : row.question

  return {
    id: String(row.id),
    // Custom title from Neon when renamed; otherwise generated from the
    // question — same 48-char truncation rule as live sends.
    title: row.title?.trim() || defaultTitle,
    pinned: Boolean(row.is_pinned),
    group: groupLabel(createdAt),
    createdAt,
    verdict: row.verdict,
    messages: [
      {
        id: `msg-${row.id}-u`,
        role: 'user',
        text: row.question,
        createdAt,
      },
      {
        id: `msg-${row.id}-a`,
        role: 'assistant',
        text: row.answer,
        createdAt,
        status: row.verdict,
        feedback: row.rating ?? null,
        backendConversationId: row.id,
        source: {
          category: row.category ?? 'Not matched',
          // Similarity is not stored in the conversations table.
          confidence: null,
          verdict: row.verdict,
          responseTimeMs: row.response_time_ms,
        },
      },
    ],
  }
}

/** Sidebar group heading derived from the record's timestamp. */
function groupLabel(createdAtMs) {
  if (!Number.isFinite(createdAtMs)) return 'Older'

  const date = new Date(createdAtMs)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, yesterday)) return 'Yesterday'
  return 'Older'
}

/**
 * Conversation history for the current session: staff see the full
 * feed, visitors see only their own browser's rows. Newest first.
 */
export async function getConversations() {
  const { data } = await api.get(historyBase())
  return data.map(toConversation)
}

/** Send a question to the real Flask AI engine. */
export async function sendMessage(conversationId, text) {
  const { data } = await api.post('/chat', {
    question: text,
  })

  return {
    id: `msg-${Date.now().toString(36)}`,
    role: 'assistant',
    text: data.answer,
    status: data.status,
    source: {
      category: data.category || 'Not matched',
      confidence: Number(data.similarity_score ?? 0),
      verdict: data.status,
      responseTimeMs: data.response_time_ms,
    },
    conversationId,
    backendConversationId: data.conversation_id,
    createdAt: Date.now(),
  }
}

/**
 * Start a conversation object locally. Neon rows are created by
 * POST /chat itself when the question is saved, so there is no
 * separate create endpoint to call here.
 */
export function createConversation(title) {
  return {
    id: `conv-${Date.now().toString(36)}`,
    title,
    pinned: false,
    group: 'Today',
    messages: [],
  }
}

/** Save feedback in Neon through Flask (up/down only, per the backend). */
export async function sendFeedback(conversationId, value) {
  const { data } = await api.post(
    `/chat/${conversationId}/rate`,
    { rating: value },
  )

  return data
}

/**
 * Rename and/or pin a conversation. Sends the backend's snake_case
 * fields; both are optional so callers can patch only one. Visitors
 * hit the ownership-checked public route, staff the staff route.
 */
export async function updateConversation(backendId, patch) {
  const body = {}

  if (patch.title !== undefined) body.title = patch.title
  if (patch.isPinned !== undefined) body.is_pinned = patch.isPinned

  const { data } = await api.patch(
    `${historyBase()}/${backendId}`,
    body,
  )
  return data
}

/**
 * Soft-delete a conversation: the backend flags is_hidden = TRUE so the
 * row leaves the sidebar but stays in Neon for Analytics. Visitors may
 * only hide rows their own visitor id owns. Safe to call repeatedly —
 * already-hidden rows respond with 404 but achieve the requested end
 * state.
 */
export async function deleteConversation(backendId) {
  const { data } = await api.delete(`${historyBase()}/${backendId}`)
  return data
}
