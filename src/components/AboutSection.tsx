"use client";

import { useTranslations } from "next-intl";
import { Gem, GraduationCap, Bell } from "lucide-react";
import Image from "next/image";

export function AboutSection() {
  const t = useTranslations("about");

  const divisions = [
    {
      key: "conseil",
      icon: Gem,
      iconBg: "bg-brand-orange-gold/15 text-brand-orange-gold group-hover:bg-brand-orange-gold group-hover:text-brand-navy-dark",
      tagBg: "bg-white/10 text-slate-200 border border-white/10",
    },
    {
      key: "formation",
      icon: GraduationCap,
      iconBg: "bg-brand-orange-rust/20 text-brand-orange-gold group-hover:bg-brand-orange-gold group-hover:text-brand-navy-dark",
      tagBg: "bg-white/10 text-slate-200 border border-white/10",
    },
    {
      key: "veille",
      icon: Bell,
      iconBg: "bg-brand-navy-petrol/40 text-brand-orange-gold group-hover:bg-brand-orange-gold group-hover:text-brand-navy-dark",
      tagBg: "bg-white/10 text-slate-200 border border-white/10",
    },
  ];

  return (
    <section
      id="about"
      className="w-full text-start scroll-mt-24 overflow-hidden rounded-3xl bg-[#12223B] border border-white/10 p-6 sm:p-12 shadow-xl relative"
      aria-labelledby="about-heading"
    >
      <div className="depth-lines" aria-hidden="true" />
      <div className="w-full max-w-4xl mx-auto relative z-10">
        {/* Category Badge Pill */}
        <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-brand-orange-gold/15 text-brand-orange-gold border border-brand-orange-gold/30 text-xs font-bold uppercase tracking-wider mb-3">
          <span>{t("badge")}</span>
        </div>

        {/* Brand Heading with Logo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2
            id="about-heading"
            className="text-2xl sm:text-3xl font-black text-token-primary tracking-tight leading-tight"
          >
            {t("title")}
          </h2>

          <div className="relative h-10 w-24 sm:h-12 sm:w-28 shrink-0 flex items-center justify-center">
            <Image
              src="/logo-oceanic.png"
              alt="OCEANIC Logo"
              width={112}
              height={44}
              className="object-contain max-h-full max-w-full brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]"
            />
          </div>
        </div>

        {/* 3-4 lines about OCEANIC */}
        <p className="text-sm sm:text-base text-token-secondary leading-relaxed max-w-3xl mb-8">
          {t("intro")}
        </p>

        {/* The 3 Divisions Heading */}
        <h3 className="text-base sm:text-lg font-bold text-token-primary mb-4 flex items-center gap-2">
          <span>{t("divisionsHeading")}</span>
        </h3>

        {/* The 3 Divisions as Cards with Distinct Icons & Learn More Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {divisions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="rounded-2xl bg-[#0A1124] border border-white/10 p-4 sm:p-6 shadow-md hover:border-brand-orange-gold/50 hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${item.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${item.tagBg}`}
                    >
                      {t(`${item.key}.tag`)}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-token-primary group-hover:text-brand-orange-gold transition-colors">
                    {t(`${item.key}.title`)}
                  </h4>

                  <p className="text-xs sm:text-sm text-token-secondary mt-2 leading-relaxed">
                    {t(`${item.key}.desc`)}
                  </p>
                </div>

                <div className="mt-5 sm:mt-6 pt-3 border-t border-white/10">
                  <a
                    href={t(`${item.key}.url`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-white/5 text-token-primary text-xs font-bold border border-white/10 hover:bg-gradient-to-r hover:from-brand-orange-rust hover:to-brand-orange-gold hover:border-transparent hover:text-white transition-all text-center"
                  >
                    <span>{t("seeMore")}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
