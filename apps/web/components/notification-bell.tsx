"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications"
import { Bell, UserPlus, MessageSquare, RotateCcw, Building2, CheckCheck } from "lucide-react"
import { cn } from "@crm/shared-lib"

type Notif = {
  id: number
  title: string
  titleAr: string
  body: string
  bodyAr: string
  type: string
  isRead: boolean
  createdAt: string | Date
}

const ICONS: Record<string, typeof Bell> = {
  assignment: UserPlus,
  comment: MessageSquare,
  delay_resume: RotateCcw,
  resale_assigned: Building2,
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data, mutate } = useSWR<Notif[]>(
    "notifications",
    () => getMyNotifications() as Promise<Notif[]>,
    { refreshInterval: 20000 },
  )

  const notifs = data ?? []
  const unread = notifs.filter((n) => !n.isRead).length

  async function handleRead(id: number) {
    await markNotificationRead(id)
    mutate()
  }

  async function handleReadAll() {
    await markAllNotificationsRead()
    mutate()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="الإشعارات / Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">الإشعارات / Notifications</span>
          {unread > 0 && (
            <button
              onClick={handleReadAll}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              تعليم الكل / Mark all
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifs.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              لا توجد إشعارات / No notifications
            </p>
          ) : (
            notifs.map((n) => {
              const Icon = ICONS[n.type] ?? Bell
              return (
                <button
                  key={n.id}
                  onClick={() => handleRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b px-3 py-2.5 text-right transition-colors hover:bg-muted/50 last:border-0",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {n.titleAr} / {n.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{n.bodyAr}</span>
                  </span>
                  {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
