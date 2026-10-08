"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Globe,
  ShieldCheck,
  Boxes,
  Truck,
  Anchor,
  Scale,
  BadgeDollarSign,
  Briefcase,
} from "lucide-react";

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
    icon: Globe,
    titleKey: "card1_title",
    tagKey: "card1_tag",
    descKey: "card1_desc",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    gradient: "from-brand-navy-dark via-[#132238] to-[#0A1124]",
  },
  {
    id: 1,
    icon: ShieldCheck,
    titleKey: "card2_title",
    tagKey: "card2_tag",
    descKey: "card2_desc",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    gradient: "from-brand-navy-dark via-[#0d2a2d] to-[#0A1124]",
  },
  {
    id: 2,
    icon: Boxes,
    titleKey: "card3_title",
    tagKey: "card3_tag",
    descKey: "card3_desc",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    gradient: "from-brand-navy-dark via-[#0d2740] to-[#0A1124]",
  },
  {
    id: 3,
    icon: Truck,
    titleKey: "card4_title",
    tagKey: "card4_tag",
    descKey: "card4_desc",
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    gradient: "from-brand-navy-dark via-[#2b1e16] to-[#0A1124]",
  },
  {
    id: 4,
    icon: Anchor,
    titleKey: "card5_title",
    tagKey: "card5_tag",
    descKey: "card5_desc",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    gradient: "from-brand-navy-dark via-[#0d2d3a] to-[#0A1124]",
  },
  {
    id: 5,
    icon: Scale,
    titleKey: "card6_title",
    tagKey: "card6_tag",
    descKey: "card6_desc",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    gradient: "from-brand-navy-dark via-[#211a36] to-[#0A1124]",
  },
  {
    id: 6,
    icon: BadgeDollarSign,
    titleKey: "card7_title",
    tagKey: "card7_tag",
    descKey: "card7_desc",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    gradient: "from-brand-navy-dark via-[#0f2930] to-[#0A1124]",
  },
  {
    id: 7,
    icon: Briefcase,
    titleKey: "card8_title",
    tagKey: "card8_tag",
    descKey: "card8_desc",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    gradient: "from-brand-navy-dark via-[#2d1825] to-[#0A1124]",
  },
];

export function ThreeDCardCarousel() {
  const t = useTranslations("cards3d");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDeltaX, setDragDeltaX] = useState(0);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % CARDS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length);
  }, []);

  // Auto-advance circular loop every 3.8 seconds
  useEffect(() => {
    if (isPaused || isDragging) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CARDS.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused, isDragging, activeIndex]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    if (!hasDraggedRef.current && Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (Math.abs(deltaX) > 6) {
      hasDraggedRef.current = true;
    }
    setDragDeltaX(deltaX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (hasDraggedRef.current) {
      if (dragDeltaX < -40) {
        handleNext();
      } else if (dragDeltaX > 40) {
        handlePrev();
      }
    }
    setDragDeltaX(0);
  };

  // Mouse drag handlers for desktop swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 6) {
      hasDraggedRef.current = true;
    }
    setDragDeltaX(deltaX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (hasDraggedRef.current) {
      if (dragDeltaX < -40) {
        handleNext();
      } else if (dragDeltaX > 40) {
        handlePrev();
      }
    }
    setDragDeltaX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (hasDraggedRef.current) {
        if (dragDeltaX < -40) {
          handleNext();
        } else if (dragDeltaX > 40) {
          handlePrev();
        }
      }
      setDragDeltaX(0);
    }
    setIsPaused(false);
  };

  return (
    <section
      id="cards-showcase"
      className="w-full text-center scroll-mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#12223B] via-[#0A1124] to-[#0A1124] border border-white/10 p-5 sm:p-12 shadow-2xl select-none"
      aria-label="3D Cards Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-orange-gold/15 text-brand-orange-gold border border-brand-orange-gold/30 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
          <span>{t("badge")}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-token-primary tracking-tight">
          {t("title")}
        </h2>
        <p className="text-xs sm:text-sm text-token-secondary mt-2 max-w-xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* 3D Scene Container with Swipe/Drag Gesture Support */}
      <div
        className="relative w-full max-w-lg mx-auto h-[340px] sm:h-[370px] flex items-center justify-center [perspective:1200px] cursor-grab active:cursor-grabbing touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {CARDS.map((card, index) => {
          const Icon = card.icon;
          const count = CARDS.length;

          // Normalized circular offset: active = 0, next = 1, prev = -1
          let offset = (index - activeIndex) % count;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;

          const dragShift = isDragging ? Math.max(-45, Math.min(45, dragDeltaX * 0.2)) : 0;

          // True 3D Positioning: Center, Left, Right — all other cards hidden in queue
          let transformStyle = "";
          let zIndex = 10;
          let opacity = 0;
          let pointerEvents: "auto" | "none" = "none";

          if (offset === 0) {
            // Front & Center
            transformStyle = `translateZ(0px) translateX(${dragShift}px) scale(1) rotateY(${dragShift * 0.08}deg)`;
            zIndex = 30;
            opacity = 1;
            pointerEvents = "auto";
          } else if (offset === 1) {
            // Right Side
            transformStyle = `translateZ(-80px) translateX(calc(36% + ${dragShift}px)) scale(0.85) rotateY(-22deg)`;
            zIndex = 20;
            opacity = 0.65;
            pointerEvents = "auto";
          } else if (offset === -1) {
            // Left Side
            transformStyle = `translateZ(-80px) translateX(calc(-36% + ${dragShift}px)) scale(0.85) rotateY(22deg)`;
            zIndex = 10;
            opacity = 0.65;
            pointerEvents = "auto";
          } else {
            // Hidden in background queue
            const side = offset > 0 ? "60%" : "-60%";
            transformStyle = `translateZ(-160px) translateX(${side}) scale(0.7) rotateY(${offset > 0 ? -30 : 30}deg)`;
            zIndex = 5;
            opacity = 0;
            pointerEvents = "none";
          }

          const isCenter = offset === 0;

          return (
            <div
              key={card.id}
              onClick={() => {
                if (hasDraggedRef.current) return;
                if (!isCenter) setActiveIndex(index);
              }}
              style={{
                transform: transformStyle,
                zIndex,
                opacity,
                pointerEvents,
                transition: isDragging
                  ? "transform 0.08s ease-out"
                  : "all 0.65s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
              className={`absolute top-0 bottom-0 w-[84%] sm:w-[80%] max-w-[360px] rounded-3xl bg-gradient-to-b ${card.gradient} border ${
                isCenter
                  ? "border-brand-orange-gold/50 shadow-2xl ring-1 ring-brand-orange-gold/30"
                  : "border-white/10 shadow-lg hover:opacity-85"
              } p-6 sm:p-7 flex flex-col justify-between text-start cursor-pointer backdrop-blur-md overflow-hidden`}
            >
              {/* Luxury Large Number in Background */}
              <div
                className="absolute bottom-2 end-4 text-7xl sm:text-8xl font-black font-mono text-white/[0.05] select-none pointer-events-none tracking-tighter"
                aria-hidden="true"
              >
                0{index + 1}
              </div>

              <div className="relative z-10">
                {/* Card Top Pill */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-2xl bg-white/10 text-brand-orange-gold shadow-xs">
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
            </div>
          );
        })}
      </div>

      {/* Modern, non-intrusive pagination indicators (no buttons, no swipe text) */}
      <div className="flex items-center justify-center gap-2 mt-8 relative z-10">
        {CARDS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            aria-label={`Go to card ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeIndex === i
                ? "w-7 bg-brand-orange-gold shadow-sm shadow-brand-orange-gold/40"
                : "w-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
