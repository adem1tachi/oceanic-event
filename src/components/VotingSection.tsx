"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { TopicCard, type TopicItem } from "./TopicCard";
import { RegisterCta } from "./RegisterCta";
import { BarChart3, RefreshCw } from "lucide-react";

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
    } catch (err) {
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

  const leadingTopicSlug = leadingTopic?.topic_slug || "topic-a";

  // Handle vote with Optimistic UI updates
  const handleVote = async (topicId: string, slug: string) => {
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

    // Save to localStorage for UX returning visitor persistence
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
        const errorData = await res.json();
        console.error("Vote submission error:", errorData);
        setVoteFeedback(t("voting.voteError"));
      } else {
        setVoteFeedback(t("voting.voteRecorded"));
        // Re-fetch latest accurate totals from DB
        fetchResults(false);
      }
    } catch (err) {
      console.error("Vote network error:", err);
      setVoteFeedback(t("voting.voteError"));
    } finally {
      setIsVoting(false);
      // Auto clear feedback message after 3 seconds
      setTimeout(() => setVoteFeedback(null), 3000);
    }
  };

  return (
    <section className="w-full my-6 text-start" aria-labelledby="voting-heading">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <h2
            id="voting-heading"
            className="text-xl sm:text-2xl font-black text-token-primary tracking-tight"
          >
            {hasVotedAny ? t("results.title") : t("voting.title")}
          </h2>
          <p className="text-xs sm:text-sm text-token-secondary mt-1">
            {hasVotedAny ? t("results.subtitle") : t("voting.subtitle")}
          </p>
        </div>

        {hasVotedAny && (
          <div className="flex items-center gap-3 text-xs text-token-muted font-medium self-start sm:self-auto">
            <span className="flex items-center gap-1 font-bold text-token-primary">
              <BarChart3 className="w-4 h-4 text-highlight" />
              <span>{t("results.totalVotes")}: {totalVotes}</span>
            </span>
            <button
              onClick={() => fetchResults(true)}
              className="p-1.5 rounded hover:bg-bg-surface-raised transition-colors focus-visible:outline-highlight"
              title="Refresh results"
              aria-label="Refresh results"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Temporary feedback banner */}
      {voteFeedback && (
        <div
          role="status"
          className="mb-4 p-3 rounded-md bg-highlight-subtle border border-highlight/30 text-xs font-semibold text-highlight flex items-center justify-between"
        >
          <span>{voteFeedback}</span>
        </div>
      )}

      {/* 3 Large Topic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {initialTopics.map((topic) => {
          const countData = counts.find((c) => c.topic_id === topic.id);
          const voteCount = countData ? Number(countData.count) : 0;
          const isVoted = votedTopicSlug === topic.slug;
          const isLeading = leadingTopic?.topic_id === topic.id;

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

      {/* Slide-in CTA right after results are revealed */}
      {hasVotedAny && (
        <RegisterCta leadingTopicSlug={leadingTopicSlug} />
      )}
    </section>
  );
}
