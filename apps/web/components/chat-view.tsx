"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Send, MoreVertical, Trash2, VolumeX, Volume2, Ban, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import {
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
  getChatRoster,
  setChatMute,
  setChatBan,
} from "@/app/actions/chat"

type Message = {
  id: number
  userId: string
  name: string
  role: string
  messageText: string
  isDeleted: boolean
  createdAt: string | Date
}

type RosterEntry = {
  id: string
  name: string
  role: string
  isMuted: boolean
  isBanned: boolean
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

function timeLabel(d: string | Date) {
  return new Date(d).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
}

export function ChatView({
  meId,
  isAdmin,
  initialMessages,
}: {
  meId: string
  isAdmin: boolean
  initialMessages: Message[]
}) {
  const [text, setText] = useState("")
  const [pending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: messages = initialMessages, mutate } = useSWR<Message[]>(
    "chat-messages",
    () => getChatMessages() as Promise<Message[]>,
    { refreshInterval: 4000, fallbackData: initialMessages },
  )

  const { data: roster = [], mutate: mutateRoster } = useSWR<RosterEntry[]>(
    isAdmin ? "chat-roster" : null,
    () => getChatRoster() as Promise<RosterEntry[]>,
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSend() {
    const value = text.trim()
    if (!value) return
    setText("")
    startTransition(async () => {
      const res = await sendChatMessage(value)
      if (res?.error) {
        toast.error(res.error)
        setText(value)
      } else {
        mutate()
      }
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const res = await deleteChatMessage(id)
      if (res && "error" in res && res.error) toast.error(res.error)
      else mutate()
    })
  }

  function handleMute(userId: string, mute: boolean) {
    startTransition(async () => {
      await setChatMute(userId, mute)
      toast.success(mute ? "تم كتم العضو / Muted" : "تم رفع الكتم / Unmuted")
      mutateRoster()
    })
  }

  function handleBan(userId: string, ban: boolean) {
    startTransition(async () => {
      await setChatBan(userId, ban)
      toast.success(ban ? "تم حظر العضو / Banned" : "تم رفع الحظر / Unbanned")
      mutateRoster()
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <Card className="flex h-[70vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              لا توجد رسائل بعد / No messages yet
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.userId === meId
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className={`group max-w-[75%] ${mine ? "items-end text-left" : "items-start"}`}>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium">{m.name}</span>
                      {m.role === "admin" && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                          مدير
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{timeLabel(m.createdAt)}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
                        mine ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {m.isDeleted ? (
                        <span className="italic opacity-70">رسالة محذوفة / Message deleted</span>
                      ) : (
                        <span className="whitespace-pre-wrap break-words">{m.messageText}</span>
                      )}
                      {!m.isDeleted && (mine || isAdmin) && (
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="حذف الرسالة"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex items-center gap-2 border-t p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="اكتب رسالة... / Type a message..."
            disabled={pending}
          />
          <Button onClick={handleSend} disabled={pending || !text.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {isAdmin && (
        <Card className="h-[70vh] overflow-y-auto p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            إدارة الأعضاء / Moderation
          </h2>
          <div className="space-y-2">
            {roster.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <div className="flex gap-1">
                    {r.isMuted && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px] text-amber-600">
                        مكتوم
                      </Badge>
                    )}
                    {r.isBanned && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px] text-rose-600">
                        محظور
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMute(r.id, !r.isMuted)}>
                      {r.isMuted ? (
                        <>
                          <Volume2 className="ml-2 h-4 w-4" /> رفع الكتم / Unmute
                        </>
                      ) : (
                        <>
                          <VolumeX className="ml-2 h-4 w-4" /> كتم / Mute
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBan(r.id, !r.isBanned)}
                      className={r.isBanned ? "" : "text-destructive"}
                    >
                      <Ban className="ml-2 h-4 w-4" />
                      {r.isBanned ? "رفع الحظر / Unban" : "حظر / Ban"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
