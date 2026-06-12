"use client"

import { useState, useTransition } from "react"
import type { Lead } from "@crm/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  createLead,
  assignLead,
  smartAssignLeads,
} from "@/app/actions/leads"
import { LEAD_SOURCES, PIPELINE_STAGES, STAGE_STYLES, findBilingual } from "@crm/shared-lib"
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, combinePhone } from "@crm/shared-lib"
import { ImportLeadsDialog } from "@/components/import-leads-dialog"
import { toast } from "sonner"
import { Plus, Sparkles, Loader2, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@crm/shared-lib"

type Member = { id: string; name: string; email: string; role: string }

export function LeadsView({
  initialLeads,
  members,
}: {
  initialLeads: Lead[]
  members: Member[]
}) {
  const router = useRouter()
  const [leads] = useState<Lead[]>(initialLeads)
  const [pending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)

  const unassigned = leads.filter((l) => !l.assignedToId)

  function handleSmartAssign() {
    startTransition(async () => {
      const res = await smartAssignLeads()
      if (res?.error) toast.error(res.error)
      else {
        toast.success(`تم توزيع ${res.assigned} عميل / Assigned ${res.assigned} leads`)
        router.refresh()
      }
    })
  }

  function handleAssign(leadId: number, userId: string) {
    startTransition(async () => {
      const res = await assignLead(leadId, userId)
      if (res?.error) toast.error(res.error)
      else {
        toast.success("تم التعيين / Assigned")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={handleSmartAssign} disabled={pending || unassigned.length === 0} variant="secondary">
            {pending ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Sparkles className="ml-1 h-4 w-4" />}
            توزيع ذكي / Smart Assign
          </Button>
        </div>
        <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onDone={() => router.refresh()} />
        <ImportLeadsDialog onDone={() => router.refresh()} />
      </div>

      <Tabs defaultValue="unassigned">
        <TabsList>
          <TabsTrigger value="unassigned">
            غير معين / Unassigned
            <Badge variant="secondary" className="mr-1.5">
              {unassigned.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            الكل / All
            <Badge variant="secondary" className="mr-1.5">
              {leads.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unassigned" className="mt-3">
          <LeadsTable leads={unassigned} members={members} onAssign={handleAssign} pending={pending} />
        </TabsContent>
        <TabsContent value="all" className="mt-3">
          <LeadsTable leads={leads} members={members} onAssign={handleAssign} pending={pending} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LeadsTable({
  leads,
  members,
  onAssign,
  pending,
}: {
  leads: Lead[]
  members: Member[]
  onAssign: (leadId: number, userId: string) => void
  pending: boolean
}) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-muted-foreground">
        <UserCheck className="mb-2 h-8 w-8" />
        <p>لا يوجد عملاء / No leads</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-right text-sm">
        <thead className="border-b bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5 font-medium">الاسم / Name</th>
            <th className="px-3 py-2.5 font-medium">الهاتف / Phone</th>
            <th className="px-3 py-2.5 font-medium">المصدر / Source</th>
            <th className="px-3 py-2.5 font-medium">المرحلة / Stage</th>
            <th className="px-3 py-2.5 font-medium">التعيين / Assign</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const stage = findBilingual(PIPELINE_STAGES, lead.status)
            const style = STAGE_STYLES[lead.status]
            return (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-medium text-foreground">{lead.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground" dir="ltr">
                  {lead.phone}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {findBilingual(LEAD_SOURCES, lead.source)?.ar ?? lead.source}
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium", style?.badge)}>
                    {stage?.ar} / {stage?.en}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Select
                    value={lead.assignedToId ?? ""}
                    onValueChange={(v) => onAssign(lead.id, v)}
                    disabled={pending}
                  >
                    <SelectTrigger className="h-8 w-44">
                      <SelectValue placeholder="اختر مندوب / Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} {m.role === "admin" ? "(مدير)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AddLeadDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: "",
    phoneCode: DEFAULT_COUNTRY_CODE,
    phone: "",
    phone2Code: DEFAULT_COUNTRY_CODE,
    phone2: "",
    project: "",
    unitType: "",
    budget: "",
    area: "",
    source: "Other",
    notes: "",
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await createLead({
        name: form.name,
        phone: combinePhone(form.phoneCode, form.phone),
        phone2: form.phone2 ? combinePhone(form.phone2Code, form.phone2) : "",
        project: form.project,
        unitType: form.unitType,
        budget: form.budget,
        area: form.area,
        source: form.source,
        notes: form.notes,
      })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("تمت إضافة العميل / Lead added")
        setForm({
          name: "",
          phoneCode: DEFAULT_COUNTRY_CODE,
          phone: "",
          phone2Code: DEFAULT_COUNTRY_CODE,
          phone2: "",
          project: "",
          unitType: "",
          budget: "",
          area: "",
          source: "Other",
          notes: "",
        })
        onOpenChange(false)
        onDone()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="ml-1 h-4 w-4" />
          إضافة عميل / Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="text-right">
          <DialogTitle>إضافة عميل محتمل / Add Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="الاسم / Name *">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الهاتف / Phone *">
              <div className="flex gap-1.5" dir="ltr">
                <CountrySelect value={form.phoneCode} onChange={(v) => set("phoneCode", v)} />
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  dir="ltr"
                  inputMode="tel"
                  placeholder="1001234567"
                  required
                />
              </div>
            </Field>
            <Field label="هاتف 2 / Phone 2">
              <div className="flex gap-1.5" dir="ltr">
                <CountrySelect value={form.phone2Code} onChange={(v) => set("phone2Code", v)} />
                <Input
                  value={form.phone2}
                  onChange={(e) => set("phone2", e.target.value)}
                  dir="ltr"
                  inputMode="tel"
                  placeholder="1001234567"
                />
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المشروع / Project">
              <Input value={form.project} onChange={(e) => set("project", e.target.value)} />
            </Field>
            <Field label="نوع الوحدة / Unit type">
              <Input value={form.unitType} onChange={(e) => set("unitType", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الميزانية / Budget">
              <Input value={form.budget} onChange={(e) => set("budget", e.target.value)} />
            </Field>
            <Field label="المنطقة / Area">
              <Input value={form.area} onChange={(e) => set("area", e.target.value)} />
            </Field>
          </div>
          <Field label="المصدر / Source">
            <Select value={form.source} onValueChange={(v) => set("source", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.ar} / {s.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="ملاحظات / Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
              حفظ / Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // De-duplicate by dialing code so values stay unique (e.g. US/Canada both "+1").
  const seen = new Set<string>()
  const options = COUNTRY_CODES.filter((c) => {
    if (seen.has(c.code)) return false
    seen.add(c.code)
    return true
  })
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[5.5rem] shrink-0 font-mono" aria-label="رمز الدولة / Country code">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-mono">{c.code}</span>{" "}
            <span className="text-muted-foreground">{c.en}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
