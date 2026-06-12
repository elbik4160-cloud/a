"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/**
 * Wraps page content and replays a smooth fade-rise entrance on every
 * client-side route change, giving the whole system a consistent,
 * polished feel that matches the My Leads (عملائي) experience.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [key, setKey] = useState(pathname)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setKey(pathname)
  }, [pathname])

  return (
    <div key={key} className="page-enter">
      {children}
    </div>
  )
}
