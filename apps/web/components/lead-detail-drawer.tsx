"use client"

import { useEffect, useState, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  getLeadDetail,
  logActivity,
  startDelay,
  cancelDelay,
} from "@/app/actions/leads"
import { getLeadComments, addComment, markCommentRead } from "@/app/actions/comments"
import type { Lead, LeadActivity, LeadDelay, Comment } from "@crm/db"
import {
  ACTIVITY_TYPES,
  DELAY_REASONS,
  LEAD_SOURCES,
  PIPELINE_STAGES,
  findBilingual,
  STAGE_STYLES,
} from "@crm/shared-lib"
import { toast } from "sonner"
import { Phone, Building2, Banknote, MapPin, Clock, Pause, Play, Loader2, MessageSquarePlus, Send } from "lucide-react"
import { cn } from "@crm/shared-lib"

type Detail = { lead: Lead; activities: LeadActivity[]; activeDelay: LeadDelay | null }

const ACTIVITY_TYPE_AR: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((a) => [a.value, `${a.ar} / ${a.en}`]),
)

export function LeadDetailDrawer({
  leadId,
  open,
  onOpenChange,
  canManage,
  role,
}: {
  leadId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
  role: string
}) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  // activity form
  const [actType, setActType] = useState("Call")
  const [actNotes, setActNotes] = useState("")
  const [actNext, setActNext] = useState("")
  const [actFollowUp, setActFollowUp] = useState("")

  // delay form
  const [delayReason, setDelayReason] = useState("Busy")
  const [delayNote, setDelayNote] = useState("")
  const [delayResume, setDelayResume] = useState("")

  // comments
  const [leadComments, setLeadComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")

  useEffect(() => {
    if (!open || leadId == null) {
      setDetail(null)
      setLeadComments([])
      return
    }
    setLoading(true)
    getLeadDetail(leadId)
      .then((d) => setDetail(d as Detail))
      .catch(() => toast.error("تعذر تحميل البيانات / Failed to load"))
      .finally(() => setLoading(false))
    getLeadComments(leadId)
      .then((c) => setLeadComments(c as Comment[]))
      .catch(() => {})
  }, [open, leadId])

  function refresh() {
    if (leadId == null) return
    getLeadDetail(leadId).then((d) => setDetail(d as Detail))
    getLeadComments(leadId).then((c) => setLeadComments(c as Comment[]))
  }

  function submitComment() {
    if (leadId == null || !lead) return
    const text = commentText.trim()
    if (!text) return
    if (!lead.assignedToId) {
      toast.error("عيّن العميل أولاً / Assign the lead first")
      return
    }
    startTransition(async () => {
      const res = await addComment({ toUserId: lead.assignedToId!, leadId, text })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("تم إرسال التعليق / Comment sent")
        setCommentText("")
        refresh()
      }
    })
  }

  function submitActivity() {
    if (leadId == null) return
    if (!actType) return
    startTransition(async () => {
      const res = await logActivity({
        leadId,
        type: actType,
        notes: actNotes,
        nextAction: actNext,
        followUpAt: actFollowUp || null,
      })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("تم تسجيل النشاط / Activity logged")
        setActNotes("")
        setActNext("")
        setActFollowUp("")
        refresh()
      }
    })
  }

  function submitDelay() {
    if (leadId == null) return
    if (!delayResume) {
      toast.error("اختر تاريخ الاستئناف / Pick a resume date")
      return
    }
    startTransition(async () => {
      const res = await startDelay({
        leadId,
        reason: delayReason,
        reasonNote: delayNote,
        resumeAt: delayResume,
      })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("تم تأجيل العميل / Lead delayed")
        setDelayNote("")
        setDelayResume("")
        refresh()
      }
    })
  }

  function endDelay() {
    if (leadId == null) return
    startTransition(async () => {
      await cancelDelay(leadId)
      toast.success("تم استئناف العميل / Lead resumed")
      refresh()
    })
  }

  const lead = detail?.lead
  const stage = lead ? findBilingual(PIPELINE_STAGES, lead.status) : undefined
  const stageStyle = lead ? STAGE_STYLES[lead.status] : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
        {loading || !lead ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader className="text-right">
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="text-xl">{lead.name}</SheetTitle>
                {stage && (
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium", stageStyle?.badge)}>
                    {stage.ar} / {stage.en}
                  </span>
                )}
              </div>
              <SheetDescription className="sr-only">تفاصيل العميل المحتمل / Lead details</SheetDescription>
            </SheetHeader>

            {/* Lead summary */}
            <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <InfoRow icon={Phone} label="الهاتف / Phone" value={lead.phone} ltr />
              {lead.phone2 && <InfoRow icon={Phone} label="هاتف 2 / Phone 2" value={lead.phone2} ltr />}
              {lead.project && <InfoRow icon={Building2} label="المشروع / Project" value={lead.project} />}
              {lead.budget && <InfoRow icon={Banknote} label="الميزانية / Budget" value={lead.budget} />}
              {lead.area && <InfoRow icon={MapPin} label="المنطقة / Area" value={lead.area} />}
              <InfoRow
                icon={Clock}
                label="المصدر / Source"
                value={findBilingual(LEAD_SOURCES, lead.source)?.ar ?? lead.source}
              />
            </div>

            {/* Active delay banner */}
            {detail?.activeDelay && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  <span>
                    مؤجل حتى / Delayed until{" "}
                    {new Date(detail.activeDelay.resumeAt).toLocaleString("ar-EG")}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={endDelay} disabled={pending}>
                  <Play className="ml-1 h-3.5 w-3.5" />
                  استئناف / Resume
                </Button>
              </div>
            )}

            <Tabs defaultValue="activity" className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="activity" className="flex-1">
                  النشاط / Activity
                </TabsTrigger>
                <TabsTrigger value="log" className="flex-1">
                  تسجيل / Log
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex-1">
                  تعليقات / Comments
                  {leadComments.length > 0 && (
                    <span className="mr-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                      {leadComments.length}
                    </span>
                  )}
                </TabsTrigger>
                {!detail?.activeDelay && (
                  <TabsTrigger value="delay" className="flex-1">
                    تأجيل / Delay
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Timeline */}
              <TabsContent value="activity" className="mt-3">
                {detail && detail.activities.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {detail.activities.map((a) => (
                      <div key={a.id} className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary">{ACTIVITY_TYPE_AR[a.type] ?? a.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.createdAt).toLocaleString("ar-EG")}
                          </span>
                        </div>
                        {a.notes && <p className="text-foreground">{a.notes}</p>}
                        {a.nextAction && (
                          <p className="text-xs text-muted-foreground">
                            الخطوة التالية / Next: {a.nextAction}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground">{a.userName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    لا يوجد نشاط بعد / No activity yet
                  </p>
                )}
              </TabsContent>

              {/* Log activity */}
              <TabsContent value="log" className="mt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>النوع / Type</Label>
                  <Select value={actType} onValueChange={setActType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.ar} / {t.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>ملاحظات / Notes</Label>
                  <Textarea value={actNotes} onChange={(e) => setActNotes(e.target.value)} rows={3} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>الخطوة التالية / Next action</Label>
                  <Input value={actNext} onChange={(e) => setActNext(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>موعد المتابعة / Follow-up</Label>
                  <Input
                    type="datetime-local"
                    value={actFollowUp}
                    onChange={(e) => setActFollowUp(e.target.value)}
                  />
                </div>
                <Button onClick={submitActivity} disabled={pending}>
                  {pending && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
                  حفظ النشاط / Save activity
                </Button>
              </TabsContent>

              {/* Comments thread */}
              <TabsContent value="comments" className="mt-3 flex flex-col gap-3">
                {leadComments.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {leadComments.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "flex flex-col gap-1 rounded-lg border p-3 text-sm",
                          !c.isRead && c.toUserId !== c.fromUserId && "border-primary/40 bg-primary/5",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 font-medium">
                            <MessageSquarePlus className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.fromUserName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleString("ar-EG")}
                          </span>
                        </div>
                        <p className="text-foreground">{c.text}</p>
                        {role !== "admin" && !c.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 self-start px-2 text-xs"
                            onClick={() =>
                              startTransition(async () => {
                                await markCommentRead(c.id)
                                refresh()
                              })
                            }
                            disabled={pending}
                          >
                            تحديد كمقروء / Mark read
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    لا توجد تعليقات / No comments yet
                  </p>
                )}

                {role === "admin" && (
                  <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
                    <Label>تعليق للمندوب / Comment to rep</Label>
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      placeholder="اكتب توجيهاً للمندوب… / Write an instruction…"
                    />
                    <Button onClick={submitComment} disabled={pending} size="sm" className="self-start">
                      {pending ? (
                        <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="ml-1 h-4 w-4" />
                      )}
                      إرسال / Send
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Delay */}
              <TabsContent value="delay" className="mt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>السبب / Reason</Label>
                  <Select value={delayReason} onValueChange={setDelayReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.ar} / {r.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>ملاحظة / Note</Label>
                  <Textarea value={delayNote} onChange={(e) => setDelayNote(e.target.value)} rows={2} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>استئناف في / Resume at</Label>
                  <Input
                    type="datetime-local"
                    value={delayResume}
                    onChange={(e) => setDelayResume(e.target.value)}
                  />
                </div>
                <Button onClick={submitDelay} disabled={pending} variant="secondary">
                  {pending && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
                  <Pause className="ml-1 h-4 w-4" />
                  تأجيل / Delay lead
                </Button>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              {role === "admin" ? "صلاحية مدير / Admin" : "مندوب / Sales"} ·{" "}
              {lead.assignedToName ? `معين لـ / Assigned to ${lead.assignedToName}` : "غير معين / Unassigned"}
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  ltr?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="font-medium text-foreground" dir={ltr ? "ltr" : undefined}>
        {value}
      </span>
    </div>
  )
}
