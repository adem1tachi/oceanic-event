"use client";

import { useTranslations } from "next-intl";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { CheckCircle2, Award, ArrowUpRight } from "lucide-react";

export interface TopicItem {
  id: string;
  slug: string;
  position: number;
}

export interface TopicCardProps {
  topic: TopicItem;
  voteCount: number;
  totalVotes: number;
  isVoted: boolean;
  isLeading: boolean;
  hasVotedAny: boolean;
  isVoting: boolean;
  onVote: (topicId: string, slug: string) => void;
}

export function TopicCard({
  topic,
  voteCount,
  totalVotes,
  isVoted,
  isLeading,
  hasVotedAny,
  isVoting,
  onVote,
}: TopicCardProps) {
  const t = useTranslations();
  const title = t(`topics.${topic.slug}.title`);
  const tagline = t(`topics.${topic.slug}.tagline`);
  const description = t(`topics.${topic.slug}.description`);

  // Calculate percentage safely
  const percentage =
    totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <Card
      as="div"
      interactive={!isVoting}
      selected={isVoted}
      onClick={() => {
        if (!isVoting) {
          onVote(topic.id, topic.slug);
        }
      }}
      className={`group relative flex flex-col justify-between overflow-hidden border-2 p-5 sm:p-6 transition-all duration-200 select-none ${
        isVoted
          ? "border-action bg-bg-surface ring-2 ring-action/20 shadow-md"
          : isLeading && hasVotedAny
          ? "border-highlight/60 bg-highlight-subtle/20"
          : "border-border hover:border-token-muted hover:shadow-sm"
      }`}
    >
      <div>
        {/* Top Badges & Indicators */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="neutral" size="sm">
              #{topic.position}
            </Badge>

            {isLeading && hasVotedAny && (
              <Badge variant="highlight" size="sm" className="gap-1">
                <Award className="w-3 h-3" />
                <span>{t("results.leadingBadge")}</span>
              </Badge>
            )}

            {isVoted && (
              <Badge variant="success" size="sm" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t("voting.votedBadge")}</span>
              </Badge>
            )}
          </div>

          {!hasVotedAny && (
            <span className="text-xs font-semibold text-token-muted group-hover:text-action flex items-center transition-colors">
              <span className="hidden sm:inline me-1">{t("voting.voteButton")}</span>
              <ArrowUpRight className="w-4 h-4 rtl:-scale-x-100" />
            </span>
          )}
        </div>

        {/* Topic Title & Tagline */}
        <h3 className="text-lg sm:text-xl font-bold text-token-primary tracking-tight leading-snug group-hover:text-action transition-colors">
          {title}
        </h3>

        <p className="text-xs sm:text-sm font-medium text-highlight mt-1">
          {tagline}
        </p>

        <p className="text-xs sm:text-sm text-token-secondary mt-2.5 line-clamp-3 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Live Results Bar (Visible after voting or for returning voters) */}
      {hasVotedAny && (
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs font-bold text-token-secondary mb-1.5">
            <span className="text-token-muted">
              {t("results.voteCount", { count: voteCount })}
            </span>
            <span className="text-sm font-extrabold text-token-primary">
              {t("results.percentage", { percent: percentage })}
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div
            className="w-full bg-border rounded-full h-3 overflow-hidden relative"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${title}: ${percentage}%`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isVoted
                  ? "bg-action"
                  : isLeading
                  ? "bg-highlight"
                  : "bg-token-muted"
              }`}
              style={{ width: `${Math.max(percentage, 3)}%` }}
            />
          </div>
        </div>
      )}

      {/* Mobile-friendly Tap Target CTA if not yet voted */}
      {!hasVotedAny && (
        <div className="mt-4 pt-3 border-t border-border/60">
          <button
            type="button"
            className="w-full text-xs font-bold py-2 px-3 rounded bg-bg-surface-raised text-token-primary group-hover:bg-action group-hover:text-action-fg transition-colors flex items-center justify-center gap-1"
          >
            <span>{t("voting.voteButton")}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </button>
        </div>
      )}
    </Card>
  );
}
