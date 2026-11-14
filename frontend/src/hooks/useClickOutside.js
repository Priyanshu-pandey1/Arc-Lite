import { useEffect, useRef } from 'react'

/**
 * Calls handler when a click lands outside every referenced element.
 * Used to close the header hamburger menu and per-chat option menus.
 */
export default function useClickOutside(refs, handler, active = true) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!active) return undefined
    const listener = (event) => {
      const list = Array.isArray(refs) ? refs : [refs]
      const inside = list.some((ref) => ref.current && ref.current.contains(event.target))
      if (!inside) handlerRef.current(event)
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [refs, active])
}
