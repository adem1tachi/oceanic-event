"use client";
/* eslint-disable @next/next/no-img-element */

import { useTranslations } from "next-intl";
import { Card } from "./ui/Card";
import { Award, Check, Lock, BookOpen } from "lucide-react";

export interface TopicItem {
  id: string;
  slug: string;
  position: number;
  title?: string;
  description?: string;
  imageUrl?: string;
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
  const title = topic.title || t(`topics.${topic.slug}.title`);
  const description = topic.description || t(`topics.${topic.slug}.description`);

  // Calculate percentage safely
  const percentage =
    totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  const handleClick = () => {
    // Visitor can vote ONLY if they haven't voted yet and not currently submitting
    if (!hasVotedAny && !isVoting) {
      onVote(topic.id, topic.slug);
    }
  };

  return (
    <Card
      as="div"
      interactive={!hasVotedAny && !isVoting}
      selected={isVoted}
      onClick={handleClick}
      className={`group relative flex flex-col justify-between overflow-hidden transition-all duration-200 select-none ${
        isVoted
          ? "border-2 border-brand-orange-gold shadow-[0_0_24px_rgba(232,134,7,0.25)] bg-[#0A1124]"
          : isLeading && hasVotedAny
          ? "border border-brand-orange-gold/40 bg-[#0A1124] shadow-sm"
          : hasVotedAny
          ? "border border-white/10 bg-[#0A1124] opacity-80"
          : "border border-white/10 hover:border-brand-orange-amber/60 hover:shadow-lg bg-[#0A1124]"
      }`}
    >
      <div>
        {/* Full-width 4:3 Landscape Image */}
        <div className="relative w-full aspect-[4/3] bg-slate-900 overflow-hidden">
          {topic.imageUrl && !topic.imageUrl.startsWith("data:") ? (
            <img
              src={topic.imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-[#12223B] text-slate-500">
              <BookOpen className="w-10 h-10 stroke-1 text-slate-500" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Topic Title & Description */}
        <div className="p-4 sm:p-6 pb-0">
          <h3 className="text-base sm:text-xl font-black text-token-primary tracking-tight leading-snug group-hover:text-brand-orange-gold transition-colors">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-token-secondary mt-2 sm:mt-2.5 line-clamp-3 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 pt-3 sm:pt-5">
        {/* Real-time Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-token-secondary mb-1.5">
            <span className="text-slate-400 font-medium">
              {t("results.voteCount", { count: voteCount })}
            </span>
            <span className="text-sm font-extrabold text-brand-orange-gold">
              {t("results.percentage", { percent: percentage })}
            </span>
          </div>

          {/* Animated Real-time Progress Bar with Teal Track & Gold/Rust Fill */}
          <div
            className="w-full bg-[#0E3B4F] rounded-full h-2.5 overflow-hidden relative border border-white/5"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${title}: ${percentage}%`}
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isVoted
                  ? "bg-gradient-to-r from-brand-orange-rust via-brand-orange-amber to-brand-orange-gold shadow-[0_0_10px_rgba(232,134,7,0.5)]"
                  : isLeading
                  ? "bg-gradient-to-r from-brand-orange-rust to-brand-orange-gold"
                  : "bg-gradient-to-r from-slate-600 to-slate-400"
              }`}
              style={{ width: `${Math.max(percentage, totalVotes > 0 ? 3 : 0)}%` }}
            />
          </div>
        </div>

        {/* Vote Button with Disabled State after voting */}
        <div className="mt-4 pt-1">
          {!hasVotedAny ? (
            <button
              type="button"
              disabled={isVoting}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="w-full min-h-[44px] text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-orange-rust to-brand-orange-amber hover:brightness-110 active:scale-[0.99] text-white transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Award className="w-4 h-4 text-white/90" />
              <span>{isVoting ? t("voting.votingInProgress") : t("voting.voteButton")}</span>
            </button>
          ) : isVoted ? (
            <button
              type="button"
              disabled
              className="w-full text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl bg-brand-orange-gold/15 text-brand-orange-gold border border-brand-orange-gold/40 flex items-center justify-center gap-1.5 cursor-not-allowed shadow-none"
            >
              <Check className="w-4 h-4 text-brand-orange-gold" />
              <span>{t("voting.votedButton")}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full text-xs sm:text-sm font-medium py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60 shadow-none"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("voting.votedOtherButton")}</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
