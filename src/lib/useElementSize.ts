import { useEffect, useState } from 'react'

export function useElementSize<T extends HTMLElement>(ref: React.RefObject<T | null>): {
  width: number
  height: number
} {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const r = el.getBoundingClientRect()
      setSize({ width: r.width, height: r.height })
    }

    update()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update)
      ro.observe(el)
    }
    window.addEventListener('resize', update)

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return size
}
