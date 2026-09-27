import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { HeroSection } from "@/components/HeroSection";
import { VotingSection, type VoteData } from "@/components/VotingSection";
import { RegisterForm } from "@/components/RegisterForm";
import { SpinningWheel } from "@/components/SpinningWheel";
import { AboutSection } from "@/components/AboutSection";
import type { TopicItem } from "@/components/TopicCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FALLBACK_TOPICS: TopicItem[] = [
  { id: "11111111-1111-1111-1111-111111111111", slug: "topic-a", position: 1 },
  { id: "22222222-2222-2222-2222-222222222222", slug: "topic-b", position: 2 },
  { id: "33333333-3333-3333-3333-333333333333", slug: "topic-c", position: 3 },
];

async function getInitialData(): Promise<{
  topics: TopicItem[];
  counts: VoteData[];
  appSettings: { isRegistrationOpen: boolean; eventDate: string | undefined };
}> {
  const fallbackSettings = { isRegistrationOpen: true, eventDate: undefined };
  try {
    const supabase = createServerSupabaseClient();

    // Fetch settings
    const { data: settingsData } = await supabase
      .from("app_settings")
      .select("is_registration_open, event_date")
      .eq("id", 1)
      .single();

    const appSettings = {
      isRegistrationOpen: settingsData?.is_registration_open ?? true,
      eventDate: settingsData?.event_date || undefined,
    };

    // 1. Fetch active topics
    const { data: topicsData, error: topicsError } = await supabase
      .from("topics")
      .select("id, slug, position, title, description, image_url")
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
        appSettings,
      };
    }

    const topics: TopicItem[] = topicsData.map((t) => ({
      id: t.id,
      slug: t.slug,
      position: t.position,
      title: t.title || undefined,
      description: t.description || undefined,
      imageUrl: t.image_url || undefined,
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
        appSettings,
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
      appSettings,
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
      appSettings: fallbackSettings,
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
  const { topics, counts, appSettings } = await getInitialData();

  return (
    <div className="min-h-screen flex flex-col bg-bg selection:bg-highlight-subtle selection:text-highlight overflow-x-clip max-w-full relative">
      {/* Oceanic depth lines ambient texture */}
      <div className="fixed inset-0 pointer-events-none depth-lines opacity-20 z-0" aria-hidden="true" />

      {/* Offline Connectivity Notification Banner */}
      <OfflineBanner />

      {/* Global Header with Co-Branded Logos & Language Switcher */}
      <Header />

      {/* Main Visitor Landing Content */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-12 flex flex-col gap-16 sm:gap-24 overflow-x-clip">
        {/* ① Hero Section: Logos, Tagline, Countdown Timer */}
        <HeroSection eventDate={appSettings.eventDate} />

        {/* Subtle Divider */}
        <div className="w-full flex items-center justify-center -my-4 sm:-my-6" aria-hidden="true">
          <div className="w-full max-w-xs sm:max-w-md h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* ② The Vote: 3 Topics with Live Results & Disabled State After Voting */}
        <VotingSection initialTopics={topics} initialCounts={counts} />

        {/* Subtle Divider */}
        <div className="w-full flex items-center justify-center -my-4 sm:-my-6" aria-hidden="true">
          <div className="w-full max-w-xs sm:max-w-md h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* ③ Registration Form with Required/Optional Fields & Firm Contact Info Confirmation */}
        <RegisterForm isRegistrationOpen={appSettings.isRegistrationOpen} topics={topics} />

        {/* Subtle Divider */}
        <div className="w-full flex items-center justify-center -my-4 sm:-my-6" aria-hidden="true">
          <div className="w-full max-w-xs sm:max-w-md h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* ④ Spinning Wheel: Grayed out for visitors with fair notice & Admin lock */}
        <SpinningWheel />

        {/* Subtle Divider */}
        <div className="w-full flex items-center justify-center -my-4 sm:-my-6" aria-hidden="true">
          <div className="w-full max-w-xs sm:max-w-md h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* ⑤ About Us: 3-4 lines about OCEANIC and the 3 divisions as icons */}
        <AboutSection />
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#0A1124] py-8 mt-12 text-center text-xs text-token-secondary overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-token-primary">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-token-secondary font-medium">
            <span>{t("footer.standInfo")}</span>
            <span className="text-white/20 select-none hidden sm:inline">•</span>
            <a
              href="https://www.oceanic-dz.com"
              target="_blank"
              rel="noreferrer"
              className="text-brand-orange-gold hover:text-brand-orange-amber font-bold hover:underline transition-colors"
            >
              www.oceanic-dz.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
