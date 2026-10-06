import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { HeroSection } from "@/components/HeroSection";
import { ThreeDCardCarousel } from "@/components/ThreeDCardCarousel";
import { RegisterForm } from "@/components/RegisterForm";
import { AboutSection } from "@/components/AboutSection";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getInitialData(): Promise<{
  appSettings: { isRegistrationOpen: boolean; eventDate: string | undefined };
}> {
  const fallbackSettings = { isRegistrationOpen: true, eventDate: undefined };
  try {
    const supabase = createServerSupabaseClient();

    const { data: settingsData } = await supabase
      .from("app_settings")
      .select("is_registration_open, event_date")
      .eq("id", 1)
      .maybeSingle();

    return {
      appSettings: {
        isRegistrationOpen: settingsData?.is_registration_open ?? true,
        eventDate: settingsData?.event_date || undefined,
      },
    };
  } catch (err) {
    console.warn("Could not connect to Supabase during SSR, using fallback:", err);
    return {
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
  const { appSettings } = await getInitialData();

  return (
    <div className="min-h-screen flex flex-col bg-bg selection:bg-highlight-subtle selection:text-highlight overflow-x-clip max-w-full relative">
      {/* Real-time traffic & outbound link click analytics */}
      <AnalyticsTracker />

      {/* Oceanic depth lines ambient texture */}
      <div className="fixed inset-0 pointer-events-none depth-lines opacity-20 z-0" aria-hidden="true" />

      {/* Offline Connectivity Notification Banner */}
      <OfflineBanner />

      {/* Global Header with Co-Branded Logos & Language Switcher */}
      <Header />

      {/* Main Visitor Landing Content */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-12 flex flex-col gap-16 sm:gap-24 overflow-x-clip">
        {/* ① Hero Section: Logos, Tagline, Countdown Timer & Jump Buttons */}
        <HeroSection eventDate={appSettings.eventDate} />

        {/* Subtle Divider */}
        <div className="w-full flex items-center justify-center -my-4 sm:-my-6" aria-hidden="true">
          <div className="w-full max-w-xs sm:max-w-md h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* ② 3D Card Carousel: 3 Circularly Animated Cards Highlighting the Guide */}
        <ThreeDCardCarousel />

        {/* Subtle Divider */}
        <div className="w-full flex items-center justify-center -my-4 sm:-my-6" aria-hidden="true">
          <div className="w-full max-w-xs sm:max-w-md h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* ③ Registration Form with 9 Hardcoded Departments & Auto PDF Download */}
        <RegisterForm isRegistrationOpen={appSettings.isRegistrationOpen} />

        {/* Subtle Divider */}
        <div className="w-full flex items-center justify-center -my-4 sm:-my-6" aria-hidden="true">
          <div className="w-full max-w-xs sm:max-w-md h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* ④ About Us: OCEANIC Divisions & Official Website Links */}
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
