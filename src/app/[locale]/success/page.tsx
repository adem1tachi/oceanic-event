import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Download, BookOpen, ArrowLeft } from "lucide-react";

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
        <div className="w-full bg-[#12223B] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col items-center">
          {/* Success Checkmark Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 ring-8 ring-emerald-500/10">
            <CheckCircle className="w-9 h-9" aria-hidden="true" />
          </div>

          {/* Badge & Title */}
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
            {t("success.badge")}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t("success.title")}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed max-w-md">
            {t("success.message")}
          </p>

          {/* PDF Download Action Box */}
          <div className="w-full my-6 p-4 rounded-2xl bg-[#0A1124] border border-brand-orange-gold/30 text-start">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-brand-orange-gold shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  OCEANIC Guide Formatech 2026 (PDF)
                </span>
              </div>
              <a
                href="/oceanic-guide-2026.pdf"
                download="OCEANIC-Guide-Formatech-2026.pdf"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange-rust via-brand-orange-amber to-brand-orange-gold hover:brightness-110 text-white text-xs font-bold shadow-md transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{t("success.downloadButton")}</span>
              </a>
            </div>
          </div>

          {/* What happens next steps */}
          <div className="w-full text-start mb-8 border-t border-white/10 pt-5">
            <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3">
              {t("success.whatNextTitle")}
            </h2>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-white shrink-0">
                  1
                </span>
                <span className="pt-0.5">{t("success.whatNextStep1")}</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-white shrink-0">
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
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t("success.viewResultsButton")}</span>
              </Button>
            </Link>

            <p className="text-xs text-slate-400">
              {t("success.changeVoteNote")}
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-white/10 bg-[#0A1124] py-4 text-center text-xs text-slate-400">
        <p>FormaTech 2026 • Stand OCEANIC A12</p>
      </footer>
    </div>
  );
}
