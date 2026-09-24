"use client";

import { useTranslations } from "next-intl";
import { Vote, UserCheck, Trophy } from "lucide-react";

export function HowItWorks() {
  const t = useTranslations("howItWorks");

  const steps = [
    {
      icon: Vote,
      title: t("step1Title"),
      desc: t("step1Desc"),
    },
    {
      icon: UserCheck,
      title: t("step2Title"),
      desc: t("step2Desc"),
    },
    {
      icon: Trophy,
      title: t("step3Title"),
      desc: t("step3Desc"),
    },
  ];

  return (
    <section className="w-full my-6 py-6 border-y border-border bg-bg-surface-raised/50 rounded-xl px-4 sm:px-6">
      <h2 className="text-xs uppercase tracking-widest font-bold text-token-muted mb-4 text-center">
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 bg-bg-surface p-4 rounded-lg border border-border text-start shadow-xs"
            >
              <div className="w-9 h-9 rounded-md bg-highlight-subtle text-highlight flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-token-primary">
                  {step.title}
                </h3>
                <p className="text-xs text-token-secondary mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
