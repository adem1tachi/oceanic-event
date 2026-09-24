"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Trophy, BarChart3, Award } from "lucide-react";
import type { VoteData } from "@/components/VotingSection";

export interface ResultsOverviewProps {
  results: VoteData[];
}

export function ResultsOverview({ results }: ResultsOverviewProps) {
  const t = useTranslations();

  const totalVotes = results.reduce((acc, curr) => acc + Number(curr.count), 0);

  // Find leading topic
  const leading = results.reduce<VoteData | null>((prev, curr) => {
    if (!prev) return curr;
    return Number(curr.count) > Number(prev.count) ? curr : prev;
  }, null);

  const leadingTopicName =
    leading && totalVotes > 0
      ? t(`topics.${leading.topic_slug}.title`)
      : t("topics.topic-a.title");

  return (
    <div className="flex flex-col gap-6 text-start">
      {/* Leading Course Topic Banner */}
      <div className="p-5 sm:p-6 rounded-xl bg-action text-action-fg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-highlight/20 text-highlight-subtle flex items-center justify-center shrink-0 border border-white/10">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="highlight" size="sm" className="font-bold">
                {t("results.leadingBadge")}
              </Badge>
              <span className="text-xs text-white/70">
                {t("admin.totalVotesCount", { count: totalVotes })}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold mt-1 text-white tracking-tight">
              {t("admin.courseSelectedBanner", { topic: leadingTopicName })}
            </h2>
          </div>
        </div>
      </div>

      {/* Breakdown per topic */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-token-primary flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-highlight" />
            <span>{t("admin.resultsCardTitle")}</span>
          </h3>
          <span className="text-xs font-semibold text-token-muted">
            {t("results.totalVotes")}: {totalVotes}
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {results.map((topic) => {
            const count = Number(topic.count);
            const percentage =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isLeading = leading?.topic_id === topic.topic_id && totalVotes > 0;
            const title = t(`topics.${topic.topic_slug}.title`);

            return (
              <div key={topic.topic_id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-token-primary">{title}</span>
                    {isLeading && (
                      <Badge variant="highlight" size="sm" className="gap-1 text-[10px]">
                        <Award className="w-2.5 h-2.5" />
                        <span>{t("results.leadingBadge")}</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-token-muted font-normal">
                      {t("results.voteCount", { count })}
                    </span>
                    <span className="text-token-primary font-black w-10 text-end">
                      {percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-bg-surface-raised rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLeading ? "bg-highlight" : "bg-token-muted"
                    }`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
