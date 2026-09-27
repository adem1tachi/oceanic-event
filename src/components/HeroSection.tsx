"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FormaTechLogo } from "./FormaTechLogo";
import { CountdownTimer } from "./CountdownTimer";
import { Sparkles, ArrowDown, Award } from "lucide-react";

export function HeroSection({ eventDate }: { eventDate?: string }) {
  const t = useTranslations("hero");

  return (
    <section className="relative isolate w-full text-center flex flex-col items-center pt-7 pb-9 sm:pt-14 sm:pb-16 px-3.5 sm:px-8 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/30 shadow-xl bg-slate-900">
      {/* Background Image: Crisp, visible, realistic maritime logistics port */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <Image
          src="/hero-bg.jpg"
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
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-brand-orange-gold text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-5 sm:mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-orange-gold" aria-hidden="true" />
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

        {/* Short Tagline */}
        <div className="max-w-2xl mx-auto px-2 sm:px-4 mb-2">
          <p className="text-xs sm:text-base md:text-lg font-bold text-brand-orange-gold drop-shadow-sm">
            {t("tagline")}
          </p>
        </div>

        {/* Hero Headline Hook */}
        <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2] max-w-3xl mx-auto px-1 sm:px-4 drop-shadow-md">
          {t("hook")}
        </h1>

        {/* Prize sentence / explanation */}
        <p className="text-xs sm:text-base md:text-lg text-slate-200 mt-2.5 sm:mt-3 mb-6 sm:mb-8 max-w-2xl mx-auto px-1 sm:px-4 leading-relaxed font-medium drop-shadow-sm">
          {t("prizeSentence")}
        </p>

        {/* Countdown Timer (time remaining before the draw) */}
        <div className="w-full mb-6 sm:mb-8 overflow-hidden">
          <CountdownTimer eventDate={eventDate} theme="glass-dark" />
        </div>

        {/* Quick Jump Action Pills: Stack on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none px-2 sm:px-4">
          <a
            href="#voting"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-brand-orange-rust via-brand-orange-amber to-brand-orange-gold hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.99] border border-white/20"
          >
            <Award className="w-4 h-4 text-white" />
            <span>{t("voteAction")}</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </a>

          <a
            href="#register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs sm:text-sm font-bold hover:shadow-lg transition-all active:scale-[0.99] shadow-md"
          >
            <span>{t("registerAction")}</span>
            <ArrowDown className="w-3.5 h-3.5 text-white/80" />
          </a>
        </div>
      </div>
    </section>
  );
}
