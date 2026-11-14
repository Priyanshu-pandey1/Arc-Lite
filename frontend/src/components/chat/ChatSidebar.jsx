import { useEffect, useRef } from 'react'
import { Search, SquarePen, Trash2, X } from 'lucide-react'
import ChatHistoryItem from './ChatHistoryItem'

/**
 * Left sidebar: New Chat, search box, grouped chat history, delete history.
 * Rendered as a static column on lg+ and an overlay drawer on smaller screens.
 */
export default function ChatSidebar({
  open,
  onClose,
  groups,
  activeId,
  search,
  onSearchChange,
  onNewChat,
  onSelect,
  onTogglePin,
  onRename,
  onDeleteConversation,
  onRequestClearHistory,
  isLoading,
}) {
  const searchRef = useRef(null)
  const shouldFocusSearch = useRef(false)

  // After "New Chat" from the drawer, move focus into the search field once.
  useEffect(() => {
    if (activeId === null && shouldFocusSearch.current) {
      searchRef.current?.focus()
      shouldFocusSearch.current = false
    }
  }, [activeId])

  const handleNewChat = () => {
    shouldFocusSearch.current = true
    onNewChat()
    if (window.innerWidth < 1024) onClose()
  }

  const hasChats = groups.some((group) => group.items.length > 0)

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cxBackdrop(open)}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cxAside(open)}
        data-purpose="chat-history-sidebar"
      >
        <div className="p-3 space-y-3 overflow-y-auto">
          {/* New Chat + mobile close */}
          <div className="flex items-center justify-between gap-2">
            <button
              className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm font-medium text-white bg-app-card hover:bg-app-hover border border-app-border rounded-xl transition-colors"
              onClick={handleNewChat}
              type="button"
            >
              <SquarePen aria-hidden="true" className="w-4 h-4 text-purple-400" />
              <span>New Chat</span>
            </button>
            <button
              aria-label="Close sidebar"
              className="lg:hidden p-2 text-app-muted hover:text-white rounded-lg hover:bg-app-hover"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>

          {/* Search chats */}
          <div className="relative">
            <input
              className="w-full bg-app-input border border-app-border text-xs rounded-lg py-2 pl-3 pr-8 text-white placeholder-app-muted focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search chats..."
              ref={searchRef}
              type="search"
              value={search}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
              <Search aria-hidden="true" className="w-3.5 h-3.5 text-app-muted" />
            </div>
          </div>

          {/* Chat history */}
          <div className="pt-2">
            {isLoading ? (
              <p className="px-3 py-2 text-xs text-app-muted italic">Loading chats…</p>
            ) : !hasChats ? (
              <p className="px-3 py-2 text-xs text-app-muted italic">
                {search ? 'No chats match your search' : 'No chat history'}
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="mb-3">
                  <p className="px-2 text-xs font-semibold text-app-muted uppercase tracking-wider mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((conversation) => (
                      <ChatHistoryItem
                        conversation={conversation}
                        isActive={conversation.id === activeId}
                        key={conversation.id}
                        onDelete={onDeleteConversation}
                        onRename={onRename}
                        onSelect={(id) => {
                          onSelect(id)
                          if (window.innerWidth < 1024) onClose()
                        }}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom action: clear history */}
        <div className="p-3 border-t border-app-border">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-300 hover:text-white bg-app-card hover:bg-app-hover border border-app-border rounded-xl transition-colors"
            disabled={!hasChats}
            onClick={onRequestClearHistory}
            type="button"
          >
            <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
            Delete Chat History
          </button>
        </div>
      </aside>
    </>
  )
}

function cxBackdrop(open) {
  return [
    'fixed inset-0 bg-black/70 z-40 lg:hidden transition-opacity',
    open ? 'block' : 'hidden',
  ].join(' ')
}

function cxAside(open) {
  return [
    'fixed inset-y-0 left-0 top-14 lg:top-0 lg:static z-40 w-72 bg-app-surface border-r border-app-border',
    'flex flex-col justify-between transform transition-transform duration-200 ease-in-out',
    open ? 'translate-x-0' : '-translate-x-full',
    'lg:translate-x-0',
  ].join(' ')
}
