"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FormaTechLogo } from "./FormaTechLogo";

export function Header() {
  const t = useTranslations("header");

  return (
    <header className="w-full border-b border-white/10 bg-[#0A1124]/90 backdrop-blur-md sticky top-0 z-40 shadow-md transition-colors">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Co-Header: OCEANIC x FormaTech 2026 */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-4 group focus-visible:outline-2 focus-visible:outline-highlight rounded-lg p-0.5 sm:p-1 transition-opacity hover:opacity-95 shrink-0"
          aria-label="OCEANIC x Formatech 2026"
        >
          {/* OCEANIC Logo - Crisp white in dark theme */}
          <div className="relative flex items-center justify-center h-8 w-20 sm:h-10 sm:w-28 shrink-0">
            <Image
              src="/logo-oceanic.png"
              alt={t("oceanicBadge")}
              width={112}
              height={44}
              priority
              className="object-contain max-h-full max-w-full brightness-0 invert drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
            />
          </div>

          {/* Elegant Divider */}
          <div className="h-5 sm:h-6 w-px bg-white/20 shrink-0" aria-hidden="true" />

          {/* FormaTech Expo Logo */}
          <div className="flex items-center justify-center shrink-0">
            <FormaTechLogo className="h-6 sm:h-8 w-auto text-[#EAF0F6]" />
          </div>
        </Link>

        {/* Right Actions: Language Switcher */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
