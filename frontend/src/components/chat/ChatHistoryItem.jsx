import { useLayoutEffect, useRef, useState } from 'react'
import { MoreVertical, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'
import { cx } from '../../utils/helpers'

/**
 * One row in the chat history list: title + option menu
 * (Pin/Unpin · Rename · Delete).
 */
export default function ChatHistoryItem({
  conversation,
  isActive,
  onSelect,
  onTogglePin,
  onRename,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuUp, setMenuUp] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(conversation.title)
  const itemRef = useRef(null)
  const menuRef = useRef(null)
  useClickOutside(itemRef, () => setMenuOpen(false), menuOpen)

  // The menu lives inside the sidebar's overflow-y-auto scroller, so it gets
  // clipped near the bottom. Measure it on open and flip upward when needed.
  useLayoutEffect(() => {
    if (!menuOpen || !menuRef.current) return
    const menu = menuRef.current
    const scroller = menu.closest('[class*="overflow-y-auto"]')
    if (!scroller) return
    const menuRect = menu.getBoundingClientRect()
    const scrollerRect = scroller.getBoundingClientRect()
    setMenuUp(menuRect.bottom > scrollerRect.bottom && menuRect.top - menuRect.height >= scrollerRect.top)
  }, [menuOpen])

  const commitRename = () => {
    if (draft.trim()) onRename(conversation.id, draft)
    else setDraft(conversation.title)
    setRenaming(false)
  }

  return (
    <div
      className={cx(
        'relative group flex items-center justify-between rounded-lg border transition-colors px-3 py-2 text-xs',
        isActive
          ? 'bg-app-hover border-app-border text-white'
          : 'bg-app-card/80 hover:bg-app-hover border-transparent hover:border-app-border text-slate-200',
      )}
      ref={itemRef}
    >
      {renaming ? (
        <input
          autoFocus
          className="flex-1 min-w-0 bg-app-input border border-violet-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
          value={draft}
          onBlur={commitRename}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              setDraft(conversation.title)
              setRenaming(false)
            }
          }}
        />
      ) : (
        <button
          className="flex-1 min-w-0 text-left truncate flex items-center gap-1.5 focus:outline-none"
          onClick={() => onSelect(conversation.id)}
          type="button"
        >
          {conversation.pinned && (
            <Pin aria-hidden="true" className="w-3 h-3 text-purple-400 shrink-0" fill="currentColor" />
          )}
          <span className="truncate">{conversation.title}</span>
        </button>
      )}

      <button
        aria-label="More options"
        className={cx(
          'p-1 text-app-muted hover:text-white rounded transition-opacity group-hover:opacity-100 focus:opacity-100',
          menuOpen ? 'opacity-100' : 'opacity-70',
        )}
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <MoreVertical aria-hidden="true" className="w-3.5 h-3.5" />
      </button>

      {menuOpen && (
        <div
          className={cx(
            'absolute right-2 z-50 w-36 rounded-lg bg-app-card border border-app-border shadow-xl py-1 text-xs text-slate-200',
            menuUp ? 'bottom-8' : 'top-8',
          )}
          ref={menuRef}
        >
          <button
            className="w-full flex items-center px-3 py-1.5 hover:bg-app-hover text-left transition-colors gap-2"
            onClick={() => {
              onTogglePin(conversation.id)
              setMenuOpen(false)
            }}
            type="button"
          >
            {conversation.pinned ? (
              <PinOff aria-hidden="true" className="w-3 h-3 text-app-muted" />
            ) : (
              <Pin aria-hidden="true" className="w-3 h-3 text-app-muted" fill="currentColor" />
            )}
            <span>{conversation.pinned ? 'Unpin' : 'Pin'}</span>
          </button>

          <button
            className="w-full flex items-center px-3 py-1.5 hover:bg-app-hover text-left transition-colors gap-2"
            onClick={() => {
              setDraft(conversation.title)
              setRenaming(true)
              setMenuOpen(false)
            }}
            type="button"
          >
            <Pencil aria-hidden="true" className="w-3 h-3 text-app-muted" />
            <span>Rename</span>
          </button>

          <button
            className="w-full flex items-center px-3 py-1.5 hover:bg-app-hover text-left transition-colors gap-2 text-rose-400 hover:text-rose-300"
            onClick={() => {
              setMenuOpen(false)
              onDelete(conversation)
            }}
            type="button"
          >
            <Trash2 aria-hidden="true" className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}
