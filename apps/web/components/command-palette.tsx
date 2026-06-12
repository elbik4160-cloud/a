"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  Layers,
  Store,
  MessageSquare,
  BarChart3,
  Radio,
  UserPlus,
  Phone,
  User,
} from "lucide-react"
import { searchLeads, type LeadSearchResult } from "@/app/actions/search"
import { stageLabel, stageColor } from "@/components/my-leads/stage-colors"

const NAV = [
  { href: "/dashboard", label: "الرئيسية / Dashboard", icon: LayoutDashboard },
  { href: "/my-leads", label: "عملائي / My Leads", icon: Layers },
  { href: "/resale-market", label: "سوق الإعادة / Resale", icon: Store },
  { href: "/chat", label: "المجموعة / Group Chat", icon: MessageSquare },
]

const NAV_ADMIN = [
  { href: "/leads", label: "العملاء المحتملون / Leads", icon: UserPlus },
  { href: "/reports", label: "التقارير / Reports", icon: BarChart3 },
  { href: "/admin/watchdog", label: "المراقبة / Watchdog", icon: Radio },
]

export function CommandPalette({ role }: { role: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<LeadSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Debounced lead search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const rows = await searchLeads(query)
        setResults(rows)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery("")
      router.push(href)
    },
    [router],
  )

  const navItems = role === "admin" ? [...NAV, ...NAV_ADMIN] : NAV

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="ابحث عن عميل أو صفحة... / Search leads or pages..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{searching ? "جارٍ البحث..." : "لا توجد نتائج / No results"}</CommandEmpty>

        {results.length > 0 && (
          <>
            <CommandGroup heading="العملاء / Leads">
              {results.map((lead) => (
                <CommandItem
                  key={`lead-${lead.id}`}
                  value={`${lead.name} ${lead.phone} ${lead.project ?? ""}`}
                  onSelect={() => go(role === "admin" ? "/leads" : "/my-leads")}
                  className="flex items-center gap-3"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${stageColor(lead.status)}22` }}
                  >
                    <User className="h-3.5 w-3.5" style={{ color: stageColor(lead.status) }} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{lead.name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                      {lead.project ? ` · ${lead.project}` : ""}
                    </span>
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${stageColor(lead.status)}22`,
                      color: stageColor(lead.status),
                    }}
                  >
                    {stageLabel(lead.status, "ar")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="التنقل / Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.href} value={item.label} onSelect={() => go(item.href)}>
              <item.icon className="ml-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
