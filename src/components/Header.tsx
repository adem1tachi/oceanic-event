"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ShieldCheck } from "lucide-react";

export function Header() {
  const t = useTranslations("header");

  return (
    <header className="w-full border-b border-border bg-bg-surface sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group focus-visible:outline-2 focus-visible:outline-highlight rounded-md p-1"
        >
          <div className="w-8 h-8 rounded-md bg-action text-action-fg flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
            FT
          </div>
          <div className="text-start">
            <span className="font-extrabold text-base tracking-tight text-token-primary block leading-tight">
              {t("eventBadge")}
            </span>
            <span className="text-[10px] text-token-muted uppercase tracking-widest block font-medium">
              Tech Expo 2026
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/admin"
            className="text-xs text-token-muted hover:text-token-primary p-2 rounded-md hover:bg-bg-surface-raised flex items-center gap-1 transition-colors"
            title={t("adminLink")}
            aria-label={t("adminLink")}
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
