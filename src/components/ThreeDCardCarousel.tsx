"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, GraduationCap, Scale, ChevronLeft, ChevronRight, BookOpen, Download } from "lucide-react";

interface CardItem {
  id: number;
  icon: any;
  titleKey: string;
  tagKey: string;
  descKey: string;
  badgeColor: string;
  gradient: string;
}

const CARDS: CardItem[] = [
  {
    id: 0,
    icon: ShieldCheck,
    titleKey: "card1_title",
    tagKey: "card1_tag",
    descKey: "card1_desc",
    badgeColor: "bg-brand-orange-gold/20 text-brand-orange-gold border-brand-orange-gold/40",
    gradient: "from-brand-navy-dark via-[#12223B] to-[#0A1124]",
  },
  {
    id: 1,
    icon: GraduationCap,
    titleKey: "card2_title",
    tagKey: "card2_tag",
    descKey: "card2_desc",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    gradient: "from-brand-navy-dark via-[#0E2841] to-[#0A1124]",
  },
  {
    id: 2,
    icon: Scale,
    titleKey: "card3_title",
    tagKey: "card3_tag",
    descKey: "card3_desc",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    gradient: "from-brand-navy-dark via-[#102B33] to-[#0A1124]",
  },
];

export function ThreeDCardCarousel() {
  const t = useTranslations("cards3d");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance circular loop every 3.5 seconds
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CARDS.length);
    }, 3800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % CARDS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length);
  };

  return (
    <section
      id="cards-showcase"
      className="w-full text-center scroll-mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#12223B] via-[#0A1124] to-[#0A1124] border border-white/10 p-6 sm:p-12 shadow-2xl"
      aria-label="3D Cards Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-orange-gold/15 text-brand-orange-gold border border-brand-orange-gold/30 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t("badge")}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-token-primary tracking-tight">
          {t("title")}
        </h2>
        <p className="text-xs sm:text-sm text-token-secondary mt-2 max-w-xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* 3D Scene */}
      <div className="relative w-full max-w-lg mx-auto h-[340px] sm:h-[370px] flex items-center justify-center [perspective:1200px]">
        {CARDS.map((card, index) => {
          const Icon = card.icon;
          const diff = (index - activeIndex + CARDS.length) % CARDS.length;

          // 3D positioning
          let transformStyle = "";
          let zIndex = 10;
          let opacity = 0.55;
          let pointerEvents: "auto" | "none" = "auto";

          if (diff === 0) {
            // Front & Center
            transformStyle = "translateZ(0px) translateX(0%) scale(1) rotateY(0deg)";
            zIndex = 30;
            opacity = 1;
          } else if (diff === 1) {
            // Right Side
            transformStyle = "translateZ(-80px) translateX(36%) scale(0.85) rotateY(-22deg)";
            zIndex = 20;
            opacity = 0.65;
          } else {
            // Left Side (diff === 2)
            transformStyle = "translateZ(-80px) translateX(-36%) scale(0.85) rotateY(22deg)";
            zIndex = 10;
            opacity = 0.65;
          }

          const isCenter = diff === 0;

          return (
            <div
              key={card.id}
              onClick={() => {
                if (!isCenter) setActiveIndex(index);
              }}
              style={{
                transform: transformStyle,
                zIndex,
                opacity,
                transition: "all 0.75s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
              className={`absolute top-0 bottom-0 w-[84%] sm:w-[80%] max-w-[360px] rounded-3xl bg-gradient-to-b ${card.gradient} border ${
                isCenter ? "border-brand-orange-gold/50 shadow-2xl ring-1 ring-brand-orange-gold/30" : "border-white/10 shadow-lg hover:opacity-80"
              } p-6 sm:p-7 flex flex-col justify-between text-start select-none cursor-pointer backdrop-blur-md`}
            >
              <div>
                {/* Card Top Pill */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-2xl bg-white/10 text-brand-orange-gold shadow-xs`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                    {t(card.tagKey as any)}
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-2.5 leading-snug">
                  {t(card.titleKey as any)}
                </h3>

                {/* Card Description */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t(card.descKey as any)}
                </p>
              </div>

              {/* Bottom Card Action / Indicator */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-brand-orange-gold font-bold">
                <span className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("includedInBooklet")}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {index + 1} / 3
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls: Arrows and Indicators */}
      <div className="flex items-center justify-center gap-4 mt-8 relative z-10">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous card"
          className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all active:scale-95 shadow-md"
        >
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>

        {/* Indicators */}
        <div className="flex items-center gap-2">
          {CARDS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to card ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === i
                  ? "w-7 bg-brand-orange-gold shadow-sm"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next card"
          className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all active:scale-95 shadow-md"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>
    </section>
  );
}
