"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useLang } from "@crm/shared-lib"
import { Moon, Sun, Languages } from "lucide-react"

/**
 * Light/Dark theme toggle + Arabic/English language toggle.
 * The language toggle also keeps the document <html> dir/lang in sync so the
 * whole app flips between RTL and LTR.
 */
export function HeaderControls() {
  const { resolvedTheme, setTheme } = useTheme()
  const { lang, toggle } = useLang()

  // Keep the document direction/lang aligned with the selected language.
  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = lang === "ar" ? "rtl" : "ltr"
  }, [lang])

  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "تفعيل الوضع الفاتح / Switch to light mode" : "تفعيل الوضع الداكن / Switch to dark mode"}
        title={isDark ? "الوضع الفاتح / Light" : "الوضع الداكن / Dark"}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        className="gap-1.5 font-semibold"
        aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
        title={lang === "ar" ? "English" : "العربية"}
      >
        <Languages className="h-4 w-4" />
        <span>{lang === "ar" ? "EN" : "ع"}</span>
      </Button>
    </div>
  )
}
