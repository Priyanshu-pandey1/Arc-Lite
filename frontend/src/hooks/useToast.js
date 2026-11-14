import { useCallback, useEffect, useRef, useState } from 'react'

const TOAST_DURATION = 2800

/**
 * useToast — bottom-right success notifications used by the FAQ screen.
 * Each call gets a fresh id so repeating the same message re-animates.
 */
export default function useToast(duration = TOAST_DURATION) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const notify = useCallback(
    (message) => {
      setToast({ id: Date.now(), message })
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setToast(null), duration)
    },
    [duration],
  )

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { toast, notify }
}
