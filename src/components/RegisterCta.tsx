"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "./ui/Button";

export interface RegisterCtaProps {
  leadingTopicSlug: string;
}

export function RegisterCta({ leadingTopicSlug }: RegisterCtaProps) {
  const t = useTranslations();

  // Resolve the translated title of the leading course
  const topicTitle = leadingTopicSlug
    ? t(`topics.${leadingTopicSlug}.title`)
    : t("topics.topic-a.title");

  return (
    <aside
      aria-label="Prize Draw Registration Call to Action"
      className="w-full my-8 p-6 sm:p-8 rounded-xl bg-action text-action-fg shadow-xl relative overflow-hidden transition-all animate-in slide-in-from-bottom-4 duration-500 text-start"
    >
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("hero.badge")}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
          {t("cta.headline", { topic: topicTitle })}
        </h2>

        <p className="text-sm sm:text-base text-white/80 mt-2 leading-relaxed">
          {t("cta.subtext")}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-action hover:bg-white/90 font-bold shadow-md gap-2"
            >
              <span>{t("cta.button")}</span>
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Subtle geometric decorative token in background */}
      <div
        className="absolute -end-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none"
        aria-hidden="true"
      />
    </aside>
  );
}
