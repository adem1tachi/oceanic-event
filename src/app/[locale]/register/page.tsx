import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { RegisterForm } from "@/components/RegisterForm";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  let isRegistrationOpen = true;
  let topics: { slug: string; title?: string }[] = [];

  try {
    const supabase = createServerSupabaseClient();
    const { data: settingsData } = await supabase
      .from("app_settings")
      .select("is_registration_open")
      .eq("id", 1)
      .maybeSingle();

    if (settingsData && settingsData.is_registration_open !== undefined) {
      isRegistrationOpen = settingsData.is_registration_open;
    }

    const { data: topicsData } = await supabase
      .from("topics")
      .select("slug, title")
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (topicsData) {
      topics = topicsData.map((item) => ({
        slug: item.slug,
        title: item.title || undefined,
      }));
    }
  } catch (err) {
    console.warn("[RegisterPage] Supabase error:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <OfflineBanner />
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:py-10 flex flex-col">
        {/* Back navigation */}
        <div className="mb-4 text-start">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-token-muted hover:text-token-primary transition-colors p-1.5 rounded-lg hover:bg-bg-surface-raised focus-visible:outline-highlight"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("registerPage.backToHome")}</span>
          </Link>
        </div>

        {/* Form Component */}
        <RegisterForm isRegistrationOpen={isRegistrationOpen} topics={topics} />
      </main>

      <footer className="w-full border-t border-border bg-bg-surface py-6 text-center text-xs text-token-muted">
        <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
