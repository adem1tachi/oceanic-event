"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert, Sparkles } from "lucide-react";

const SLICE_COLORS = [
  "#0A1124",
  "#0E3B4F",
  "#12223B",
  "#B5500C",
  "#0A1124",
  "#CD6E10",
  "#12223B",
  "#0E3B4F",
];

export function SpinningWheel() {
  const t = useTranslations("wheel");
  const [showToast, setShowToast] = useState(false);

  const slices = [
    { label: t("slices.slice1"), color: SLICE_COLORS[0], textColor: "#ffffff" },
    { label: t("slices.slice2"), color: SLICE_COLORS[1], textColor: "#ffffff" },
    { label: t("slices.slice3"), color: SLICE_COLORS[2], textColor: "#ffffff" },
    { label: t("slices.slice4"), color: SLICE_COLORS[3], textColor: "#ffffff" },
    { label: t("slices.slice5"), color: SLICE_COLORS[4], textColor: "#ffffff" },
    { label: t("slices.slice6"), color: SLICE_COLORS[5], textColor: "#ffffff" },
    { label: t("slices.slice7"), color: SLICE_COLORS[6], textColor: "#ffffff" },
    { label: t("slices.slice8"), color: SLICE_COLORS[7], textColor: "#ffffff" },
  ];

  const totalSlices = slices.length;
  const sliceAngle = 360 / totalSlices;

  const handleAttemptSpin = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4500);
  };

  return (
    <section
      id="wheel"
      className="w-full text-center scroll-mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#12223B] via-[#12223B] to-[#0E3B4F]/70 border border-white/10 p-6 sm:p-12 shadow-xl"
      aria-labelledby="wheel-heading"
    >
      {/* Section Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange-gold/15 text-brand-orange-gold border border-brand-orange-gold/30 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t("badge")}</span>
        </div>
        <h2
          id="wheel-heading"
          className="text-2xl sm:text-3xl font-black text-token-primary tracking-tight"
        >
          {t("title")}
        </h2>
        <p className="text-xs sm:text-sm text-token-secondary mt-2 max-w-xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* Main Wheel Container */}
      <div className="relative w-full max-w-[min(88vw,330px)] sm:max-w-md mx-auto aspect-square flex items-center justify-center p-1 sm:p-4">
        {/* Subtle Outer Neon Ring */}
        <div
          className="absolute inset-2 sm:inset-4 rounded-full border-2 border-dashed border-brand-orange-gold/30 animate-[spin_60s_linear_infinite] pointer-events-none"
          aria-hidden="true"
        />

        {/* The Graphic Circular Wheel */}
        <div
          onClick={handleAttemptSpin}
          className="relative w-full h-full max-w-[420px] max-h-[420px] rounded-full shadow-2xl overflow-hidden border-4 sm:border-8 border-[#12223B] ring-2 sm:ring-4 ring-white/10 hover:ring-brand-orange-gold/40 transition-all select-none cursor-pointer"
          role="img"
          aria-label={t("title")}
        >
          {/* Wheel SVG with slices */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full origin-center animate-[spin_40s_linear_infinite] will-change-transform"
          >
            <circle cx="200" cy="200" r="195" fill="#0A1124" stroke="#12223B" strokeWidth="3" />
            <g transform="translate(200, 200)">
              {slices.map((slice, index) => {
                const startAngle = (index * sliceAngle * Math.PI) / 180;
                const endAngle = ((index + 1) * sliceAngle * Math.PI) / 180;
                const x1 = 195 * Math.cos(startAngle);
                const y1 = 195 * Math.sin(startAngle);
                const x2 = 195 * Math.cos(endAngle);
                const y2 = 195 * Math.sin(endAngle);
                const textAngle = index * sliceAngle + sliceAngle / 2;

                return (
                  <g key={index}>
                    <path
                      d={`M 0 0 L ${x1} ${y1} A 195 195 0 0 1 ${x2} ${y2} Z`}
                      fill={slice.color}
                      stroke="rgba(234, 240, 246, 0.2)"
                      strokeWidth="1.5"
                    />
                    {/* Slice Label */}
                    <g transform={`rotate(${textAngle}) translate(110, 0)`}>
                      <text
                        x="0"
                        y="4"
                        fill={slice.textColor}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="font-sans select-none tracking-tight"
                      >
                        {slice.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Inner Center Hub */}
            <circle cx="200" cy="200" r="44" fill="#0A1124" stroke="#E88607" strokeWidth="2.5" />
            <circle cx="200" cy="200" r="38" fill="#12223B" />
            <text
              x="200"
              y="198"
              fill="#EAF0F6"
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
              className="font-mono tracking-widest uppercase"
            >
              OCEANIC
            </text>
            <text
              x="200"
              y="212"
              fill="#E88607"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              RAFFLE
            </text>
          </svg>

          {/* Top Pointer Ticker */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-brand-orange-gold drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* Fair Draw Notice Below Wheel */}
      <div className="mt-6 flex flex-col items-center justify-center gap-2 max-w-md mx-auto px-4">
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0A1124] border border-white/10 shadow-sm text-xs sm:text-sm text-token-primary font-semibold">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange-gold"></span>
          </span>
          <span>{t("fairMessage")}</span>
        </div>
      </div>

      {/* Toast Notice when visitor tries to spin */}
      {showToast && (
        <div
          role="status"
          className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed text-slate-200">
            {t("lockedTooltip")}
          </span>
        </div>
      )}
    </section>
  );
}
