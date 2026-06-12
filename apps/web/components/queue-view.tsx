"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { releaseClient } from "@/app/actions/queue"
import { submitFeedback } from "@/app/actions/feedback"
import { CLIENT_STATUSES } from "@crm/shared-lib"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Phone, Clock, ListChecks, MessageSquarePlus, XCircle } from "lucide-react"

type QueueItem = {
  lockId: number
  clientId: string
  lockTime: Date
  clientName: string | null
  phone: string | null
  countryCode: string | null
  request: string | null
  notes: string | null
  expiresAt: Date
}

function Countdown({ expiresAt }: { expiresAt: Date }) {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setRemaining(new Date(expiresAt).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const expired = remaining <= 0
  const totalSec = Math.max(0, Math.floor(remaining / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
        expired ? "bg-destructive/10 text-destructive" : min < 5 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      {expired ? "انتهى الوقت" : `${min}:${sec.toString().padStart(2, "0")}`}
    </span>
  )
}

export function QueueView({ initialQueue }: { initialQueue: QueueItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedbackTarget, setFeedbackTarget] = useState<QueueItem | null>(null)
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")

  // Refresh the server data periodically so expired locks drop off.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000)
    return () => clearInterval(id)
  }, [router])

  const handleRelease = useCallback(
    (item: QueueItem) => {
      startTransition(async () => {
        const res = await releaseClient(item.clientId, false)
        if (!res.ok) {
          toast.error(res.error ?? "تعذر تحرير العميل")
        } else {
          toast.success("تم تحرير العميل")
          router.refresh()
        }
      })
    },
    [router],
  )

  function openFeedback(item: QueueItem) {
    setFeedbackTarget(item)
    setStatus("")
    setNotes("")
  }

  function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!feedbackTarget) return
    if (!status) {
      toast.error("اختر حالة العميل")
      return
    }
    startTransition(async () => {
      const res = await submitFeedback({
        clientId: feedbackTarget.clientId,
        clientStatus: status,
        notes,
      })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("تم حفظ التقييم وتحرير العميل")
        setFeedbackTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">قائمة العمل</h2>
        <p className="text-sm text-muted-foreground">العملاء الذين تعمل عليهم حالياً</p>
      </div>

      {initialQueue.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              قائمة عملك فارغة. اذهب إلى صفحة العملاء واضغط "ابدأ العمل" لإضافة عميل.
            </p>
            <Button variant="outline" onClick={() => router.push("/clients")}>
              تصفح العملاء
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {initialQueue.map((item) => (
            <Card key={item.lockId}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{item.clientName ?? "عميل"}</span>
                  <span className="text-xs text-muted-foreground">{item.clientId}</span>
                </div>
                <Countdown expiresAt={item.expiresAt} />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {item.phone && (
                  <a
                    href={`tel:${item.countryCode ?? ""}${item.phone}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">
                      {item.countryCode ? `${item.countryCode} ` : ""}
                      {item.phone}
                    </span>
                  </a>
                )}
                {item.request && (
                  <p className="rounded-md bg-muted/50 p-2 text-sm text-foreground">{item.request}</p>
                )}
                {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}

                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={() => openFeedback(item)} disabled={pending}>
                    <MessageSquarePlus className="ml-1 h-4 w-4" />
                    إضافة تقييم
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRelease(item)} disabled={pending}>
                    <XCircle className="ml-1 h-4 w-4" />
                    تحرير
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!feedbackTarget} onOpenChange={(o) => !o && setFeedbackTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تقييم العميل: {feedbackTarget?.clientName}</DialogTitle>
            <DialogDescription>سجّل نتيجة المكالمة. سيتم تحرير العميل من قائمتك بعد الحفظ.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>حالة العميل *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fb-notes">ملاحظات</Label>
              <Textarea
                id="fb-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="تفاصيل المكالمة، الاتفاقات، موعد المتابعة..."
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "جاري الحفظ..." : "حفظ التقييم"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
