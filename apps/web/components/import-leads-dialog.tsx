"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { importLeads } from "@/app/actions/leads"
import { toast } from "sonner"
import { Upload, Loader2, FileSpreadsheet } from "lucide-react"

type ParsedRow = {
  name?: string
  phone?: string
  phone2?: string
  project?: string
  unitType?: string
  budget?: string
  area?: string
  source?: string
  notes?: string
}

// Maps common Arabic/English header variants to our field keys.
const HEADER_MAP: Record<string, keyof ParsedRow> = {
  name: "name",
  "الاسم": "name",
  phone: "phone",
  "الهاتف": "phone",
  "رقم": "phone",
  "mobile": "phone",
  phone2: "phone2",
  "هاتف2": "phone2",
  project: "project",
  "المشروع": "project",
  unittype: "unitType",
  "unit type": "unitType",
  "نوع الوحدة": "unitType",
  budget: "budget",
  "الميزانية": "budget",
  area: "area",
  "المنطقة": "area",
  source: "source",
  "المصدر": "source",
  notes: "notes",
  "ملاحظات": "notes",
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []
  const splitLine = (line: string) =>
    line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
  const headers = splitLine(lines[0]).map((h) => HEADER_MAP[h.toLowerCase()] ?? null)
  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i])
    const row: ParsedRow = {}
    headers.forEach((key, idx) => {
      if (key) row[key] = cells[idx] ?? ""
    })
    if (row.name || row.phone) rows.push(row)
  }
  return rows
}

export function ImportLeadsDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState("")
  const [pending, startTransition] = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result ?? ""))
      if (parsed.length === 0) {
        toast.error("لم يتم العثور على صفوف صالحة / No valid rows found")
      }
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  function submit() {
    if (rows.length === 0) {
      toast.error("اختر ملف CSV أولاً / Select a CSV file first")
      return
    }
    startTransition(async () => {
      const res = await importLeads(rows as Parameters<typeof importLeads>[0])
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(
          `تم استيراد ${res.imported} وتخطي ${res.skipped} / Imported ${res.imported}, skipped ${res.skipped}`,
        )
        setRows([])
        setFileName("")
        setOpen(false)
        onDone()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="ml-1 h-4 w-4" />
          استيراد CSV / Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-right">
          <DialogTitle>استيراد العملاء / Import Leads</DialogTitle>
          <DialogDescription>
            ملف CSV بصف عناوين: name, phone, project, unitType, budget, area, source, notes
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground hover:bg-muted/40">
            <FileSpreadsheet className="h-7 w-7" />
            <span>{fileName || "اختر ملف CSV / Choose CSV file"}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
          {rows.length > 0 && (
            <p className="text-sm text-foreground">
              {rows.length} صف جاهز للاستيراد / {rows.length} rows ready
            </p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || rows.length === 0}>
            {pending && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
            استيراد / Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
