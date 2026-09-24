import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { RegisterForm } from "@/components/RegisterForm";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

export default async function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <OfflineBanner />
      <Header />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 sm:py-12 flex flex-col">
        {/* Back navigation */}
        <div className="mb-6 text-start">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-token-muted hover:text-token-primary transition-colors p-1 rounded focus-visible:outline-highlight"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("register.backToResults")}</span>
          </Link>
        </div>

        {/* Card Header & Form */}
        <div className="bg-bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-sm text-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-highlight-subtle text-highlight text-xs font-bold uppercase tracking-wider mb-3 border border-highlight/20">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-token-primary tracking-tight">
            {t("register.title")}
          </h1>

          <p className="text-xs sm:text-sm text-token-secondary mt-1.5 mb-6 leading-relaxed">
            {t("register.subtitle")}
          </p>

          <RegisterForm />
        </div>
      </main>

      <footer className="w-full border-t border-border bg-bg-surface py-4 text-center text-xs text-token-muted">
        <p>Forma Tak 2026 • Stand Raffle Registration</p>
      </footer>
    </div>
  );
}
