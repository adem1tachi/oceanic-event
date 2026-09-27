"use client";

import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function CountdownTimer({
  eventDate,
  theme = "glass-dark",
}: {
  eventDate?: string;
  theme?: "glass-dark" | "light";
}) {
  const t = useTranslations("hero");

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: false,
  });

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const now = new Date();
      let target: Date;

      if (eventDate) {
        target = new Date(eventDate);
      } else {
        // Fallback: Set target draw time to 17:00 (5:00 PM) today, or tomorrow if 17:00 has already passed
        target = new Date();
        target.setHours(17, 0, 0, 0);
        if (now.getTime() > target.getTime()) {
          target.setDate(target.getDate() + 1);
        }
      }

      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isComplete: true,
        };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return {
        days,
        hours,
        minutes,
        seconds,
        isComplete: false,
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Tick every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  const isDark = theme === "glass-dark";

  if (!mounted) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-pulse" aria-hidden="true">
        <div className={`h-4 w-32 rounded-full mb-3 ${isDark ? "bg-white/20" : "bg-slate-200/80"}`} />
        <div className="flex items-start justify-center gap-1 sm:gap-2.5 md:gap-3.5 max-w-full">
          {[0, 1, 2, 3].map((i) => (
            <Fragment key={i}>
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl backdrop-blur-md border ${
                    isDark
                      ? "bg-white/15 border-white/25 shadow-lg"
                      : "bg-white/70 border-white/80 shadow-xs"
                  }`}
                />
                <div className={`h-3 w-8 rounded-full mt-1.5 sm:mt-2 ${isDark ? "bg-white/20" : "bg-slate-200/80"}`} />
              </div>
              {i < 3 && (
                <div
                  className={`flex items-center justify-center h-12 sm:h-20 font-bold text-base sm:text-2xl select-none shrink-0 ${
                    isDark ? "text-white/60" : "text-slate-300"
                  }`}
                >
                  :
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: t("days") },
    { value: timeLeft.hours, label: t("hours") },
    { value: timeLeft.minutes, label: t("minutes") },
    { value: timeLeft.seconds, label: t("seconds") },
  ];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Single minimal title above timer */}
      <span
        className={`text-xs sm:text-sm font-semibold mb-3 tracking-wide select-none ${
          isDark ? "text-slate-200 drop-shadow-sm" : "text-slate-600"
        }`}
      >
        {t("countdownTitle")}
      </span>

      {/* iPhone-style timer blocks with colons */}
      <div className="flex items-start justify-center gap-1 sm:gap-2.5 md:gap-3.5 max-w-full" role="timer" aria-live="off">
        {timeUnits.map((unit, index) => (
          <Fragment key={index}>
            {/* Number Card + Label Below */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl backdrop-blur-md border flex items-center justify-center ${
                  isDark
                    ? "bg-[#0A1124]/85 border-white/15 shadow-lg"
                    : "bg-white/80 border-white/90 ring-1 ring-slate-900/5 shadow-xs"
                }`}
              >
                <span
                  className={`text-xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight leading-none ${
                    isDark ? "text-brand-orange-gold drop-shadow-[0_2px_12px_rgba(232,134,7,0.3)]" : "text-brand-navy-dark"
                  }`}
                >
                  {formatNumber(unit.value)}
                </span>
              </div>
              <span
                className={`text-[10px] sm:text-xs font-semibold mt-1.5 sm:mt-2 select-none tracking-wide ${
                  isDark ? "text-slate-300 drop-shadow-sm" : "text-slate-600"
                }`}
              >
                {unit.label}
              </span>
            </div>

            {/* Separator Colon between cards */}
            {index < timeUnits.length - 1 && (
              <div
                className={`flex items-center justify-center h-12 sm:h-20 font-bold text-base sm:text-2xl select-none shrink-0 ${
                  isDark ? "text-brand-orange-gold/60" : "text-slate-400"
                }`}
                aria-hidden="true"
              >
                :
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
