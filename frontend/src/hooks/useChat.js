
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as chatService from '../services/chatService'
import { createId } from '../utils/helpers'
import { AUTH_EVENT } from '../utils/constants'

/**
 * useChat — owns all chat screen state (history, active conversation,
 * sending, feedback) and keeps the UI decoupled from data fetching.
 *
 * Session routing lives in chatService: staff loads/mutates the staff
 * history endpoints, signed-out visitors the visitor-scoped public
 * ones (anonymous X-Visitor-ID). Both render through the same sidebar
 * model, so this hook treats them identically.
 */

/**
 * Collect the Neon row ids behind one UI conversation. A UI thread can
 * span several rows (one Q/A pair each); history-loaded threads have a
 * single row id that also equals their conversation id.
 */
function threadBackendIds(conversation) {
  if (!conversation) return []

  const ids = []
  for (const message of conversation.messages) {
    const id = message.backendConversationId
    if (id != null && !ids.includes(String(id))) ids.push(String(id))
  }
  return ids
}
export default function useChat() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const viewportRef = useRef(null)

  // Mirrors isSending so callbacks with stale closures (loadHistory)
  // can tell whether a send owns the conversation list right now.
  const sendingRef = useRef(false)

  // Read-latest mirror of conversations for callbacks that need the
  // current list without adding it to their dependency array.
  const conversationsRef = useRef(conversations)
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  // History load — real Neon records for everyone: staff pull the full
  // feed, signed-out visitors pull only their own browser's rows via
  // the anonymous visitor id, so history survives a page refresh with
  // no login. Reloads when the session changes so history appears
  // right after login (and swaps scope on logout).
  useEffect(() => {
    let cancelled = false

    const loadHistory = () => {
      setIsLoading(true)
      // The list is about to be replaced — a stale selection (e.g. after
      // logout, when conversations are cleared) would make the next
      // sendMessage append to a conversation that no longer exists.
      setActiveId(null)

      chatService
        .getConversations()
        .then((list) => {
          // A send in flight owns the list — the initial fetch resolving
          // right after the user's first message must not clobber it.
          if (!cancelled && !sendingRef.current) setConversations(list)
        })
        .catch(() => {
          // Request failed (offline, backend down): start from an
          // empty sidebar rather than stale in-memory threads.
          if (!cancelled && !sendingRef.current) setConversations([])
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    }

    loadHistory()
    window.addEventListener(AUTH_EVENT, loadHistory)

    return () => {
      cancelled = true
      window.removeEventListener(AUTH_EVENT, loadHistory)
    }
  }, [])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  )

  /** Pinned first, then original order; filtered by sidebar search. */
  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = query
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.messages.some((m) => m.text.toLowerCase().includes(query)),
        )
      : conversations

    return [...filtered].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned),
    )
  }, [conversations, search])

  /** Group headings (Today, Yesterday, etc.). */
  const groupedConversations = useMemo(() => {
    const groups = []

    for (const conv of visibleConversations) {
      const group = conv.group || 'Today'
      const bucket = groups.find((g) => g.label === group)

      if (bucket) {
        bucket.items.push(conv)
      } else {
        groups.push({ label: group, items: [conv] })
      }
    }

    return groups
  }, [visibleConversations])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = viewportRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [])

  /** Start a fresh conversation. */
  const newChat = useCallback(() => {
    setActiveId(null)
    setSearch('')
  }, [])

  const selectConversation = useCallback(
    (id) => {
      setActiveId(id)
      scrollToBottom()
    },
    [scrollToBottom],
  )

  /**
   * Send a message and receive a response from the Flask AI engine.
   */
  const sendMessage = useCallback(
    async (rawText) => {
      const text = rawText.trim()

      if (!text || isSending) return

      const userMessage = {
        id: createId(),
        role: 'user',
        text,
        createdAt: Date.now(),
      }

      let convId = activeId

      if (!convId) {
        const title =
          text.length > 48 ? `${text.slice(0, 48)}…` : text

        const created = await chatService.createConversation(title)

        convId = created.id

        setConversations((prev) => [
          { ...created, messages: [userMessage] },
          ...prev,
        ])

        setActiveId(convId)
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, userMessage] }
              : c,
          ),
        )
      }

      scrollToBottom()
      sendingRef.current = true
      setIsSending(true)

      try {
        const reply = await chatService.sendMessage(convId, text)

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, reply] }
              : c,
          ),
        )

        scrollToBottom()
      } catch (error) {
        console.error('Chat API error:', error)

        const errorMessage = {
          id: createId(),
          role: 'assistant',
          text:
            "I'm having trouble connecting to the Arc Lite server. Please try again.",
          createdAt: Date.now(),
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, errorMessage] }
              : c,
          ),
        )

        scrollToBottom()
      } finally {
        sendingRef.current = false
        setIsSending(false)
      }
    },
    [activeId, isSending, scrollToBottom],
  )

  /**
   * Save thumbs-up/down feedback in Neon through Flask.
   * Uses the real backend conversation ID returned by /api/chat.
   */
  const setFeedback = useCallback(
    async (conversationId, messageId, value) => {
      const conversation = conversations.find(
        (c) => c.id === conversationId,
      )

      const message = conversation?.messages.find(
        (m) => m.id === messageId,
      )

      if (!message) {
        console.error('Assistant message not found.')
        return
      }

      const backendConversationId = message.backendConversationId

      if (!backendConversationId) {
        console.error('Backend conversation ID not found.')
        return
      }

      // Clicking the same button again clears the local selection.
      const nextFeedback =
        message.feedback === value ? null : value

      // Update the UI immediately.
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== conversationId
            ? c
            : {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, feedback: nextFeedback }
                    : m,
                ),
              },
        ),
      )

      try {
        // The current backend supports up/down, not clearing a rating.
        if (nextFeedback !== null) {
          await chatService.sendFeedback(
            backendConversationId,
            nextFeedback,
          )
        }
      } catch (error) {
        console.error('Feedback API error:', error)

        // Restore the previous UI selection if saving failed.
        setConversations((prev) =>
          prev.map((c) =>
            c.id !== conversationId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId
                      ? { ...m, feedback: message.feedback ?? null }
                      : m,
                  ),
                },
          ),
        )
      }
    },
    [conversations],
  )

  /** Delete one message from a conversation. */
  const deleteMessage = useCallback(
    (conversationId, messageId) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== conversationId
            ? c
            : {
                ...c,
                messages: c.messages.filter(
                  (m) => m.id !== messageId,
                ),
              },
        ),
      )
    },
    [],
  )

  /** Copy message text to clipboard. */
  const copyMessage = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }, [])

  /**
   * Soft-delete a conversation from history. Hides every Neon row of the
   * thread (is_hidden = TRUE — rows are kept for Analytics), then drops
   * it from the UI. If any row fails to hide, the conversation stays so
   * "deleted" rows never reappear after a reload.
   */
  const removeConversation = useCallback(
    async (conversationId) => {
      const conversation = conversationsRef.current.find(
        (c) => c.id === conversationId,
      )

      if (!conversation) return

      const backendIds = threadBackendIds(conversation)

      // Thread with no server rows behind it (the send failed before
      // Neon logged it): nothing to hide, drop it locally.
      if (backendIds.length === 0) {
        setConversations((prev) =>
          prev.filter((c) => c.id !== conversationId),
        )

        setActiveId((current) =>
          current === conversationId ? null : current,
        )
        return
      }

      const results = await Promise.allSettled(
        backendIds.map((id) => chatService.deleteConversation(id)),
      )

      if (results.some((result) => result.status === 'rejected')) {
        console.error('Some conversation rows could not be hidden.')
        return
      }

      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationId),
      )

      setActiveId((current) =>
        current === conversationId ? null : current,
      )
    },
    [],
  )

  /**
   * Clear the entire chat history. Hides every Neon row of every thread
   * and removes only threads whose rows all hid successfully; threads
   * with no server rows are dropped locally.
   */
  const clearHistory = useCallback(
    async () => {
      const threads = conversationsRef.current
      const backendIds = [
        ...new Set(threads.flatMap((c) => threadBackendIds(c))),
      ]

      // Nothing was ever logged to Neon (failed sends): local clear.
      if (backendIds.length === 0) {
        setConversations([])
        setActiveId(null)
        return
      }

      const results = await Promise.allSettled(
        backendIds.map((id) => chatService.deleteConversation(id)),
      )

      const failedIds = new Set(
        results
          .map((result, index) =>
            result.status === 'rejected' ? backendIds[index] : null,
          )
          .filter(Boolean),
      )

      // Keep any thread that still has a row left behind in Neon.
      setConversations((prev) =>
        prev.filter(
          (c) => !threadBackendIds(c).some((id) => failedIds.has(id)),
        ),
      )

      setActiveId(null)
    },
    [],
  )

  /** Pin or unpin a conversation, persisting the flag to Neon. */
  const togglePin = useCallback(
    async (conversationId) => {
      const conversation = conversationsRef.current.find(
        (c) => c.id === conversationId,
      )

      if (!conversation) return

      const next = !conversation.pinned

      // Optimistic update, reverted if the save fails.
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, pinned: next }
            : c,
        ),
      )

      // Rename/Pin act on the thread's first row: titles and pins are
      // per-conversation in the UI, so only the opening Q/A carries them.
      const backendId = threadBackendIds(conversation)[0]

      // Session-only thread (no Neon row): the local update stands,
      // nothing to persist.
      if (!backendId) return

      try {
        await chatService.updateConversation(backendId, {
          isPinned: next,
        })
      } catch (error) {
        console.error('Pin API error:', error)

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, pinned: conversation.pinned }
              : c,
          ),
        )
      }
    },
    [],
  )

  /** Rename a conversation, persisting the custom title to Neon. */
  const renameConversation = useCallback(
    async (conversationId, title) => {
      const next = title.trim()

      if (!next) return

      const conversation = conversationsRef.current.find(
        (c) => c.id === conversationId,
      )

      // Optimistic update, reverted if the save fails.
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, title: next }
            : c,
        ),
      )

      const backendId = threadBackendIds(conversation)[0]

      // Session-only thread (no Neon row): the local update stands,
      // nothing to persist.
      if (!backendId) return

      try {
        await chatService.updateConversation(backendId, { title: next })
      } catch (error) {
        console.error('Rename API error:', error)

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, title: conversation.title }
              : c,
          ),
        )
      }
    },
    [],
  )

  return {
    conversations: groupedConversations,
    activeConversation,
    activeId,
    search,
    setSearch,
    isLoading,
    isSending,
    viewportRef,
    newChat,
    selectConversation,
    sendMessage,
    setFeedback,
    deleteMessage,
    copyMessage,
    removeConversation,
    clearHistory,
    togglePin,
    renameConversation,
  }
}
