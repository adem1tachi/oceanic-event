"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = (nextLocale: "en" | "ar") => {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 bg-white/10 border border-white/10 p-0.5 sm:p-1 rounded-lg text-xs font-semibold backdrop-blur-sm">
      <Globe className="w-3.5 h-3.5 text-brand-orange-gold ms-1 me-0.5 shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => toggleLocale("en")}
        disabled={isPending}
        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md transition-all text-[11px] sm:text-xs ${
          locale === "en"
            ? "bg-brand-orange-gold text-brand-navy-dark shadow-xs font-bold"
            : "text-slate-300 hover:text-white"
        }`}
        aria-label="Switch language to English"
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => toggleLocale("ar")}
        disabled={isPending}
        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md transition-all text-[11px] sm:text-xs ${
          locale === "ar"
            ? "bg-brand-orange-gold text-brand-navy-dark shadow-xs font-bold"
            : "text-slate-300 hover:text-white"
        }`}
        aria-label="تغيير اللغة إلى العربية"
        aria-pressed={locale === "ar"}
      >
        العربية
      </button>
    </div>
  );
}
