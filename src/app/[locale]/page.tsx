import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { HowItWorks } from "@/components/HowItWorks";
import { VotingSection, type VoteData } from "@/components/VotingSection";
import type { TopicItem } from "@/components/TopicCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const FALLBACK_TOPICS: TopicItem[] = [
  { id: "11111111-1111-1111-1111-111111111111", slug: "topic-a", position: 1 },
  { id: "22222222-2222-2222-2222-222222222222", slug: "topic-b", position: 2 },
  { id: "33333333-3333-3333-3333-333333333333", slug: "topic-c", position: 3 },
];

async function getInitialData(): Promise<{
  topics: TopicItem[];
  counts: VoteData[];
}> {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch active topics
    const { data: topicsData, error: topicsError } = await supabase
      .from("topics")
      .select("id, slug, position")
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (topicsError || !topicsData || topicsData.length === 0) {
      console.warn("Using fallback topics data:", topicsError?.message);
      return {
        topics: FALLBACK_TOPICS,
        counts: FALLBACK_TOPICS.map((t) => ({
          topic_id: t.id,
          topic_slug: t.slug,
          topic_position: t.position,
          count: 0,
        })),
      };
    }

    const topics: TopicItem[] = topicsData.map((t) => ({
      id: t.id,
      slug: t.slug,
      position: t.position,
    }));

    // 2. Fetch vote counts from view
    const { data: countsData, error: countsError } = await supabase
      .from("vote_counts")
      .select("topic_id, topic_slug, topic_position, count");

    if (countsError || !countsData) {
      return {
        topics,
        counts: topics.map((t) => ({
          topic_id: t.id,
          topic_slug: t.slug,
          topic_position: t.position,
          count: 0,
        })),
      };
    }

    return {
      topics,
      counts: countsData.map((c) => ({
        topic_id: c.topic_id,
        topic_slug: c.topic_slug,
        topic_position: c.topic_position,
        count: Number(c.count),
      })),
    };
  } catch (err) {
    console.warn("Could not connect to Supabase during SSR, using fallback:", err);
    return {
      topics: FALLBACK_TOPICS,
      counts: FALLBACK_TOPICS.map((t) => ({
        topic_id: t.id,
        topic_slug: t.slug,
        topic_position: t.position,
        count: 0,
      })),
    };
  }
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const { topics, counts } = await getInitialData();

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <OfflineBanner />
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
        {/* Hero Section */}
        <section className="text-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-highlight-subtle text-highlight text-xs font-bold uppercase tracking-wider mb-4 border border-highlight/20">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-token-primary tracking-tight leading-[1.15]">
            {t("hero.hook")}
          </h1>

          <p className="text-base sm:text-lg text-token-secondary mt-3 max-w-2xl leading-relaxed">
            {t("hero.prizeSentence")}
          </p>
        </section>

        {/* Voting & Live Results Interactive Component */}
        <VotingSection initialTopics={topics} initialCounts={counts} />

        {/* How It Works Explainer */}
        <HowItWorks />
      </main>

      <footer className="w-full border-t border-border bg-bg-surface py-6 mt-12 text-center text-xs text-token-muted">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Forma Tak Trade Event. All rights reserved.</p>
          <p>Optimized for Mobile at Event Stand</p>
        </div>
      </footer>
    </div>
  );
}
