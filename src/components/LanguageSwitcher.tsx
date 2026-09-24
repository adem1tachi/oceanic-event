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
    <div className="flex items-center gap-1 bg-bg-surface-raised border border-border p-1 rounded-md text-xs font-semibold">
      <Globe className="w-3.5 h-3.5 text-token-muted ms-1.5 me-1" aria-hidden="true" />
      <button
        type="button"
        onClick={() => toggleLocale("en")}
        disabled={isPending}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "en"
            ? "bg-bg-surface text-token-primary shadow-xs border border-border font-bold"
            : "text-token-secondary hover:text-token-primary"
        }`}
        aria-label="Switch language to English"
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <span className="text-border-strong select-none">|</span>
      <button
        type="button"
        onClick={() => toggleLocale("ar")}
        disabled={isPending}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "ar"
            ? "bg-bg-surface text-token-primary shadow-xs border border-border font-bold"
            : "text-token-secondary hover:text-token-primary"
        }`}
        aria-label="تغيير اللغة إلى العربية"
        aria-pressed={locale === "ar"}
      >
        العربية
      </button>
    </div>
  );
}
