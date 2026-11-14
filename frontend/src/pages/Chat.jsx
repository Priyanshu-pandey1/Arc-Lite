import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import ChatSidebar from '../components/chat/ChatSidebar'
import WelcomeHero from '../components/chat/WelcomeHero'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInputBar from '../components/chat/ChatInputBar'
import ConfirmDialog from '../components/common/ConfirmDialog'
import useChat from '../hooks/useChat'

/**
 * Public Chat screen — sidebar history + conversation viewport + prompt bar.
 * The mobile drawer is controlled by MainLayout so the header button can open it.
 */
export default function Chat() {
  const { sidebarOpen, setSidebarOpen } = useOutletContext()
  const [draft, setDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null) // conversation | 'all' | null

  const chat = useChat()
  const { viewportRef, activeConversation, isSending } = chat
  const messages = activeConversation?.messages ?? []

  // Keep the newest message in view whenever the stream or typing state changes.
  const messageCount = messages.length
  useEffect(() => {
    const el = viewportRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messageCount, isSending, viewportRef])

  const submit = (text) => {
    chat.sendMessage(text)
    setDraft('')
  }

  const confirmDelete = () => {
    if (pendingDelete === 'all') chat.clearHistory()
    else if (pendingDelete) chat.removeConversation(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <div className="relative flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
      <ChatSidebar
        activeId={chat.activeId}
        groups={chat.conversations}
        isLoading={chat.isLoading}
        onClose={() => setSidebarOpen(false)}
        onDeleteConversation={setPendingDelete}
        onNewChat={chat.newChat}
        onSelect={chat.selectConversation}
        onRename={chat.renameConversation}
        onRequestClearHistory={() => setPendingDelete('all')}
        onSearchChange={chat.setSearch}
        onTogglePin={chat.togglePin}
        open={sidebarOpen}
        search={chat.search}
      />

      {/* Main chat viewport */}
      <main
        className="flex-1 flex flex-col h-full bg-app-bg overflow-hidden relative min-w-0"
        data-purpose="chat-viewport"
      >
        <div
          className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 flex flex-col justify-between"
          ref={viewportRef}
        >
          {messages.length === 0 ? (
            <WelcomeHero onPickChip={(chip) => setDraft(`Explore ${chip}`)} />
          ) : (
            <div className="w-full max-w-3xl mx-auto space-y-6 pb-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isUser={message.role === 'user'}
                  onCopy={chat.copyMessage}
                  onFeedback={(value) => chat.setFeedback(activeConversation.id, message.id, value)}
                  onRetry={() => {
                    // Re-send the user text that precedes this answer
                    const index = messages.findIndex((m) => m.id === message.id)
                    const previous = messages[index - 1]
                    if (previous) chat.sendMessage(previous.text)
                  }}
                  onDelete={() => chat.deleteMessage(activeConversation.id, message.id)}
                />
              ))}

              {isSending && (
                <div className="flex items-center space-x-1.5 text-app-muted text-sm pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </div>
          )}
        </div>

        <ChatInputBar
          isSending={isSending}
          onChange={setDraft}
          onSubmit={submit}
          value={draft}
        />
      </main>

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        message={
          pendingDelete === 'all'
            ? 'This will remove every conversation from your chat history. Deleted chats are kept internally for analytics, but will no longer appear here.'
            : pendingDelete
              ? `Remove "${pendingDelete.title}" from your chat history? It will no longer appear in this list.`
              : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        open={Boolean(pendingDelete)}
        title={pendingDelete === 'all' ? 'Delete chat history?' : 'Delete conversation?'}
      />
    </div>
  )
}
