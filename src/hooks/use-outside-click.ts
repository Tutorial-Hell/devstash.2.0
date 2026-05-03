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

export function useOutsideClickMulti(
  refs: Array<{ current: HTMLElement | null }>,
  onClose: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const inside = refs.some((ref) => ref.current?.contains(target))
      if (!inside) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
    // refs is an array of stable ref objects; .current values are read inside the handler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, enabled])
}
