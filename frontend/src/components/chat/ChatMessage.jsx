import { useState } from 'react'
import {
  Check,
  Clipboard,
  Info,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { cx } from '../../utils/helpers'

function IconButton({ label, onClick, active, children }) {
  return (
    <button
      className={cx(
        'p-1 transition-colors',
        active ? 'text-violet-400' : 'text-app-muted hover:text-white',
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}

/**
 * A single chat bubble: user messages right-aligned in a pill,
 * assistant answers left-aligned as plain text with an action row
 * (copy, details, feedback, delete).
 */
export default function ChatMessage({ message, isUser, onRetry, onDelete, onCopy, onFeedback }) {
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleCopy = async () => {
    const ok = await onCopy(message.text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end space-y-1 animate-message">
        <div className="px-4 py-2 bg-app-pill text-white text-sm rounded-2xl rounded-tr-sm max-w-[80%] break-words">
          {message.text}
        </div>
        <div className="flex items-center space-x-2 text-app-muted pr-1 pt-0.5">
          <IconButton label="Retry" onClick={onRetry}>
            <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton label="Delete" onClick={onDelete}>
            <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start space-y-1 animate-message">
      <div className="text-white text-sm sm:text-base font-medium max-w-[90%] break-words">
        {message.text}
      </div>

      {showDetails && message.source && (
        <div className="mt-1 w-full max-w-[90%] rounded-lg bg-app-card border border-app-border px-3 py-2 text-[11px] text-app-muted space-y-0.5">
          <p>
            Matched category:{' '}
            <span className="text-slate-200">{message.source.category}</span>
          </p>
          <p>
            Similarity score:{' '}
            <span className="text-slate-200">
              {Number.isFinite(message.source.confidence)
                ? `${Math.round(message.source.confidence * 100)}%`
                : 'not stored for past chats'}
            </span>
          </p>
          <p>
            Verdict:{' '}
            <span className="text-slate-200 capitalize">
              {message.source.verdict ?? message.status ?? '—'}
            </span>
          </p>
          {Number.isFinite(message.source.responseTimeMs) && (
            <p>
              Response time:{' '}
              <span className="text-slate-200">
                {Math.round(message.source.responseTimeMs)} ms
              </span>
            </p>
          )}
          <p>
            Asked:{' '}
            <span className="text-slate-200">
              {new Date(message.createdAt).toLocaleString()}
            </span>
          </p>
        </div>
      )}

      <div className="flex items-center space-x-2.5 text-app-muted pt-1">
        <IconButton label={copied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
          {copied ? (
            <Check aria-hidden="true" className="w-3.5 h-3.5 text-violet-400" />
          ) : (
            <Clipboard aria-hidden="true" className="w-3.5 h-3.5" />
          )}
        </IconButton>

        {message.source && (
          <IconButton
            label="Details"
            active={showDetails}
            onClick={() => setShowDetails((open) => !open)}
          >
            <Info aria-hidden="true" className="w-3.5 h-3.5" />
          </IconButton>
        )}

        <IconButton
          label="Good answer"
          active={message.feedback === 'up'}
          onClick={() => onFeedback('up')}
        >
          <ThumbsUp aria-hidden="true" className="w-3.5 h-3.5" fill={message.feedback === 'up' ? 'currentColor' : 'none'} />
        </IconButton>

        <IconButton
          label="Bad answer"
          active={message.feedback === 'down'}
          onClick={() => onFeedback('down')}
        >
          <ThumbsDown aria-hidden="true" className="w-3.5 h-3.5" fill={message.feedback === 'down' ? 'currentColor' : 'none'} />
        </IconButton>

        <IconButton label="Delete" onClick={onDelete}>
          <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </div>
  )
}
