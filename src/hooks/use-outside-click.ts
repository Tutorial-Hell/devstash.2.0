import { useEffect, useRef } from "react"

export function useOutsideClick<T extends HTMLElement>(
  onClose: () => void,
  enabled = true
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose, enabled])

  return ref
}
