import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Trophy, PhoneCall, BarChart2 } from "lucide-react";

export default async function SuccessPage({
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

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-10 sm:py-16 flex flex-col items-center justify-center text-center">
        <div className="w-full bg-bg-surface border border-border rounded-2xl p-6 sm:p-10 shadow-sm flex flex-col items-center">
          {/* Success Checkmark Icon */}
          <div className="w-16 h-16 rounded-full bg-feedback-success-subtle text-feedback-success flex items-center justify-center mb-5 ring-8 ring-feedback-success-subtle/50">
            <CheckCircle className="w-9 h-9" aria-hidden="true" />
          </div>

          {/* Badge & Title */}
          <span className="text-xs font-bold uppercase tracking-widest text-feedback-success mb-1">
            {t("success.badge")}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-token-primary tracking-tight">
            {t("success.title")}
          </h1>

          <p className="text-sm sm:text-base text-token-secondary mt-3 leading-relaxed max-w-md">
            {t("success.message")}
          </p>

          <div className="w-full my-6 p-4 rounded-xl bg-highlight-subtle border border-highlight/20 text-start">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-highlight shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold text-token-primary leading-relaxed">
                {t("success.prizeReminder")}
              </p>
            </div>
          </div>

          {/* What happens next steps */}
          <div className="w-full text-start mb-8 border-t border-border pt-5">
            <h2 className="text-xs uppercase tracking-widest font-bold text-token-muted mb-3">
              {t("success.whatNextTitle")}
            </h2>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5 text-xs text-token-secondary">
                <span className="w-5 h-5 rounded-full bg-bg-surface-raised border border-border flex items-center justify-center font-bold text-token-primary shrink-0">
                  1
                </span>
                <span className="pt-0.5">{t("success.whatNextStep1")}</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-token-secondary">
                <span className="w-5 h-5 rounded-full bg-bg-surface-raised border border-border flex items-center justify-center font-bold text-token-primary shrink-0">
                  2
                </span>
                <span className="pt-0.5">{t("success.whatNextStep2")}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-3">
            <Link href="/" className="w-full">
              <Button size="lg" className="w-full font-bold gap-2">
                <BarChart2 className="w-4 h-4" />
                <span>{t("success.viewResultsButton")}</span>
              </Button>
            </Link>

            <p className="text-xs text-token-muted">
              {t("success.changeVoteNote")}
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-border bg-bg-surface py-4 text-center text-xs text-token-muted">
        <p>FormaTech 2026 • Trade Event Stand</p>
      </footer>
    </div>
  );
}
