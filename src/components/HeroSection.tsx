"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FormaTechLogo } from "./FormaTechLogo";
import { CountdownTimer } from "./CountdownTimer";
// Lucide icons removed from badge and buttons per design requirements

export function HeroSection({ eventDate }: { eventDate?: string }) {
  const t = useTranslations("hero");

  return (
    <section className="relative isolate w-full text-center flex flex-col items-center pt-7 pb-9 sm:pt-14 sm:pb-16 px-3.5 sm:px-8 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/30 shadow-xl bg-slate-900">
      {/* Background Image: Crisp, visible, realistic maritime logistics port */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <Image
          src="/hero-bg.webp"
          alt="OCEANIC Port & Maritime Logistics"
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover object-center transform scale-100"
        />
        {/* Cinematic dark maritime overlay that reveals the port details while maintaining contrast */}
        <div className="absolute inset-0 bg-[#0A1124]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1124]/90 via-transparent to-[#0A1124]/60" />
        <div className="depth-lines" aria-hidden="true" />
      </div>

      {/* Foreground Content with explicit z-10 */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Event Top Badge (Glass Pill) */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-brand-orange-gold text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-5 sm:mb-6 shadow-sm">
          <span>{t("badge")}</span>
        </div>

        {/* Co-Branding Logos Section: Frosted Glass Capsule */}
        <div className="inline-flex items-center justify-center gap-2.5 sm:gap-6 mb-5 sm:mb-6 px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-lg max-w-full">
          {/* OCEANIC Logo */}
          <div className="relative h-9 w-22 sm:h-14 sm:w-36 flex items-center justify-center shrink-0">
            <Image
              src="/logo-oceanic.png"
              alt="OCEANIC Logo"
              width={140}
              height={56}
              priority
              className="object-contain max-h-full max-w-full"
            />
          </div>

          {/* Partnership Cross */}
          <span className="text-slate-400 font-bold text-xs sm:text-base select-none shrink-0" aria-hidden="true">
            ✕
          </span>

          {/* FormaTech Logo */}
          <div className="flex items-center justify-center shrink-0">
            <FormaTechLogo className="h-7 sm:h-12 w-auto text-brand-navy-dark" />
          </div>
        </div>

        {/* Hero Headline Title */}
        <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2] max-w-3xl mx-auto px-1 sm:px-4 drop-shadow-md mt-1">
          {t.rich("title", {
            gold: (chunks) => (
              <span className="text-brand-orange-gold inline-block">
                {chunks}
              </span>
            ),
            gradient: (chunks) => (
              <span className="bg-gradient-to-r from-[#F59E0B] via-[#E88607] to-[#CD6E10] bg-clip-text text-transparent inline-block">
                {chunks}
              </span>
            ),
            accent: (chunks) => (
              <span className="text-amber-300 inline-block">
                {chunks}
              </span>
            ),
          })}
        </h1>

        {/* Hero Subtitle */}
        <p className="text-xs sm:text-base md:text-lg text-slate-200 mt-3 sm:mt-4 mb-6 sm:mb-8 max-w-2xl mx-auto px-1 sm:px-4 leading-relaxed font-medium drop-shadow-sm">
          {t("subtitle")}
        </p>

        {/* Countdown Timer (time remaining before the draw) */}
        <div className="w-full mb-6 sm:mb-8 overflow-hidden">
          <CountdownTimer eventDate={eventDate} theme="glass-dark" />
        </div>

        {/* Quick Jump Action Pills: Stack on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none px-2 sm:px-4">
          <a
            href="#register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-brand-orange-rust via-brand-orange-amber to-brand-orange-gold hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.99] border border-white/20"
          >
            <span>{t("downloadAction")}</span>
          </a>

          <a
            href="#about"
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs sm:text-sm font-bold hover:shadow-lg transition-all active:scale-[0.99] shadow-md"
          >
            <span>{t("aboutAction")}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
