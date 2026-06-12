"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Layers, MessageSquare } from "lucide-react"
import { cn } from "@crm/shared-lib"

type Action = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  color: string
}

export function QuickActionFab({ role }: { role: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const actions: Action[] = [
    { label: "مساحة العمل / Workspace", icon: Layers, href: "/workspace", color: "bg-blue-500" },
    { label: "المجموعة / Chat", icon: MessageSquare, href: "/chat", color: "bg-violet-500" },
  ]

  function go(a: Action) {
    setOpen(false)
    if (a.href) router.push(a.href)
    else a.onClick?.()
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse items-start gap-3">
        <motion.button
          aria-label="إجراءات سريعة / Quick actions"
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.9 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
        >
          <motion.span animate={{ rotate: open ? 135 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {open &&
            actions.map((a, i) => {
              const Icon = a.icon
              return (
                <motion.button
                  key={a.href ?? a.label}
                  initial={{ opacity: 0, y: 12, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.8 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 320, damping: 22 }}
                  onClick={() => go(a)}
                  className="flex items-center gap-3"
                >
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md", a.color)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-lg bg-card px-3 py-1.5 text-sm font-medium text-card-foreground shadow-md">
                    {a.label}
                  </span>
                </motion.button>
              )
            })}
        </AnimatePresence>
      </div>
    </>
  )
}
