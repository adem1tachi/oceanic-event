"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { TopicCard, type TopicItem } from "./TopicCard";
import { CheckCircle2, ArrowDown, Award } from "lucide-react";

export interface VoteData {
  topic_id: string;
  topic_slug: string;
  topic_position: number;
  count: number;
}

export interface VotingSectionProps {
  initialTopics: TopicItem[];
  initialCounts: VoteData[];
}

const LOCAL_STORAGE_VOTE_KEY = "forma_tech_voted_topic";
const POLL_INTERVAL_MS = 5000;

export function VotingSection({
  initialTopics,
  initialCounts,
}: VotingSectionProps) {
  const t = useTranslations();

  // State
  const [counts, setCounts] = useState<VoteData[]>(initialCounts);
  const [votedTopicSlug, setVotedTopicSlug] = useState<string | null>(null);
  const [hasVotedAny, setHasVotedAny] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  // Read returning visitor state from localStorage on client mount
  useEffect(() => {
    try {
      const savedVotedSlug = localStorage.getItem(LOCAL_STORAGE_VOTE_KEY);
      if (savedVotedSlug) {
        setVotedTopicSlug(savedVotedSlug);
        setHasVotedAny(true);
      }
    } catch {
      // LocalStorage access may fail in private browsing mode; fail gracefully
    }
  }, []);

  // Fetch updated results from API endpoint
  const fetchResults = useCallback(async (showIndicator = false) => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return; // Save bandwidth and server load when tab is inactive
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return; // Skip poll if offline
    }

    if (showIndicator) setIsRefreshing(true);

    try {
      const res = await fetch("/api/results", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          setCounts(data.results);
        }
      }
    } catch {
      // Polling network errors handled silently; UI keeps existing data
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  // Polling setup: every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchResults(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [fetchResults]);

  // Compute total votes
  const totalVotes = counts.reduce((acc, curr) => acc + Number(curr.count), 0);

  // Compute leading topic
  const leadingTopic = counts.reduce<VoteData | null>((prev, current) => {
    if (!prev) return current;
    return Number(current.count) > Number(prev.count) ? current : prev;
  }, null);

  // Handle vote with Optimistic UI updates
  const handleVote = async (topicId: string, slug: string) => {
    if (hasVotedAny || isVoting) return;

    setIsVoting(true);
    setVoteFeedback(null);

    // 1. Optimistic UI update
    setVotedTopicSlug(slug);
    setHasVotedAny(true);
    setCounts((prev) =>
      prev.map((item) =>
        item.topic_id === topicId
          ? { ...item, count: Number(item.count) + 1 }
          : item
      )
    );

    // Save to localStorage for single-vote persistence
    try {
      localStorage.setItem(LOCAL_STORAGE_VOTE_KEY, slug);
    } catch {
      // Ignore storage errors
    }

    // 2. Perform server mutation
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });

      if (!res.ok) {
        setVoteFeedback(t("voting.voteError"));
      } else {
        setVoteFeedback(t("voting.voteRecorded"));
        // Re-fetch latest accurate totals from DB
        fetchResults(false);
      }
    } catch {
      setVoteFeedback(t("voting.voteError"));
    } finally {
      setIsVoting(false);
      setTimeout(() => setVoteFeedback(null), 4000);
    }
  };

  return (
    <section id="voting" className="w-full text-start scroll-mt-24 overflow-hidden" aria-labelledby="voting-heading">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange-gold/15 text-brand-orange-gold border border-brand-orange-gold/30 text-xs font-bold uppercase tracking-wider mb-3">
          <Award className="w-3.5 h-3.5" />
          <span>{t("voting.badge")}</span>
        </div>
        <h2
          id="voting-heading"
          className="text-2xl sm:text-3xl font-black text-token-primary tracking-tight"
        >
          {t("voting.title")}
        </h2>
        <p className="text-xs sm:text-sm text-token-secondary mt-2 leading-relaxed">
          {t("voting.subtitle")}
        </p>
      </div>

      {/* Temporary feedback banner */}
      {voteFeedback && (
        <div
          role="status"
          className="mb-6 p-4 rounded-xl bg-emerald-950/40 text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-2 shadow-xs transition-all border border-emerald-500/30"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{voteFeedback}</span>
        </div>
      )}

      {/* 3 Topic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {initialTopics.map((topic) => {
          const countData = counts.find((c) => c.topic_id === topic.id);
          const voteCount = countData ? Number(countData.count) : 0;
          const isVoted = votedTopicSlug === topic.slug;
          const isLeading = leadingTopic?.topic_id === topic.id && totalVotes > 0;

          return (
            <TopicCard
              key={topic.id}
              topic={topic}
              voteCount={voteCount}
              totalVotes={totalVotes}
              isVoted={isVoted}
              isLeading={isLeading}
              hasVotedAny={hasVotedAny}
              isVoting={isVoting}
              onVote={handleVote}
            />
          );
        })}
      </div>

      {/* Small action button below cards once user has voted */}
      {hasVotedAny && (
        <div className="mt-8 flex justify-center">
          <a
            href="#register"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange-rust to-brand-orange-gold hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
          >
            <span>{t("voting.goToRegister")}</span>
            <ArrowDown className="w-3.5 h-3.5 text-white" />
          </a>
        </div>
      )}
    </section>
  );
}
