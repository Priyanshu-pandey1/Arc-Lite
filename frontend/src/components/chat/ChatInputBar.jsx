import { useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Mic, Plus } from 'lucide-react'
import { REPLY_MODES } from '../../utils/constants'
import useClickOutside from '../../hooks/useClickOutside'
import { cx } from '../../utils/helpers'

/**
 * Bottom prompt bar: attachment, text input, reply-mode pill,
 * voice input and the send button, plus the disclaimer footer.
 */
export default function ChatInputBar({ value, onChange, onSubmit, isSending }) {
  const [mode, setMode] = useState(REPLY_MODES[0])
  const [modeOpen, setModeOpen] = useState(false)
  const modeRef = useRef(null)
  useClickOutside(modeRef, () => setModeOpen(false), modeOpen)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!value.trim() || isSending) return
    onSubmit(value)
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-3 pt-2" data-purpose="chat-input-container">
      <form
        className="relative flex items-center bg-app-input border border-app-border rounded-full px-2 py-1.5 focus-within:border-violet-600 focus-within:ring-1 focus-within:ring-violet-600 transition-all shadow-lg"
        onSubmit={handleSubmit}
      >
        <button
          aria-label="Add attachment"
          className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-app-hover transition-colors shrink-0"
          type="button"
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
        </button>

        <input
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent border-0 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-0 px-2 py-1"
          onChange={(e) => onChange(e.target.value)}
          placeholder="Message AI Chat."
          type="text"
          value={value}
        />

        <div className="flex items-center space-x-1 shrink-0">
          {/* Reply-mode pill */}
          <div className="relative hidden sm:block" ref={modeRef}>
            <button
              className="flex items-center space-x-1.5 px-3 py-1 bg-app-card hover:bg-app-hover text-slate-200 text-xs font-medium rounded-full border border-app-border/80 transition-colors"
              onClick={() => setModeOpen((open) => !open)}
              type="button"
            >
              <span>{mode}</span>
              <ChevronDown aria-hidden="true" className="w-3 h-3 text-app-muted" />
            </button>
            {modeOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-32 rounded-xl bg-app-card border border-app-border shadow-xl shadow-black/60 py-1 z-50">
                {REPLY_MODES.map((option) => (
                  <button
                    className={cx(
                      'w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-app-hover',
                      option === mode ? 'text-white' : 'text-slate-300',
                    )}
                    key={option}
                    onClick={() => {
                      setMode(option)
                      setModeOpen(false)
                    }}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice input */}
          <button
            aria-label="Voice input"
            className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-app-hover transition-colors"
            type="button"
          >
            <Mic aria-hidden="true" className="w-4 h-4" />
          </button>

          {/* Send */}
          <button
            aria-label="Send message"
            className={cx(
              'w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors focus:ring-2 focus:ring-violet-400',
              isSending && 'opacity-60 cursor-wait',
            )}
            disabled={isSending}
            id="sendBtn"
            type="submit"
          >
            <ArrowUp aria-hidden="true" className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </form>

      <p className="text-center text-[10px] sm:text-[11px] text-app-muted/80 mt-2 px-2">
        AI Chat can make mistakes. By messaging AI Chat, you agree to our{' '}
        <a className="underline hover:text-white" href="#terms">
          Terms of Service
        </a>
        , and acknowledge our{' '}
        <a className="underline hover:text-white" href="#privacy">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  )
}
