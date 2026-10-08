"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "./ui/Input";
import { registrationSchema } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building,
  Briefcase,
  Users,
  BookOpen,
  Award,
} from "lucide-react";

export const DEPARTMENTS = [
  "Achat et commerce international",
  "Transport et logistique",
  "Transport maritime des marchandises",
  "Dédouanement",
  "Supply chain management",
  "Gestion des ports maritimes",
  "Comptabilité",
  "Marketing et commercial",
  "Fiscalité",
];

interface RegisterFormProps {
  isRegistrationOpen?: boolean;
}

export function RegisterForm({
  isRegistrationOpen = true,
}: RegisterFormProps) {
  const t = useTranslations("register");
  const locale = useLocale();

  // Form Fields State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [desiredTopic, setDesiredTopic] = useState("");
  const [peopleCount, setPeopleCount] = useState<number | string>(1);
  const [consent, setConsent] = useState(true);
  const [botField, setBotField] = useState("");

  // Validation & Submission States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Field validation helper on blur
  const validateField = (field: string) => {
    const values = {
      firstName,
      lastName,
      position,
      company,
      whatsapp,
      desiredTopic,
      peopleCount: Number(peopleCount) || 1,
      consent,
      locale,
      botField,
    };

    const res = registrationSchema.safeParse(values);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === field);
      if (issue) {
        setErrors((prev) => ({ ...prev, [field]: "invalid" }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Client-side schema validation
    const formData = {
      firstName,
      lastName,
      position,
      company,
      whatsapp,
      desiredTopic: desiredTopic || undefined,
      peopleCount: Number(peopleCount) || 1,
      consent,
      locale,
      botField,
    };

    const parseResult = registrationSchema.safeParse(formData);

    if (!parseResult.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const fieldName = String(issue.path[0]);
        if (!newErrors[fieldName]) {
          newErrors[fieldName] = "invalid";
        }
      }
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 || data.code === "DUPLICATE_PHONE") {
          setServerError(t("duplicatePhone"));
        } else if (data.errors) {
          setErrors(data.errors);
        } else {
          setServerError(data.error || t("genericError"));
        }
        return;
      }

      // Success: Automatically trigger browser download of the PDF booklet
      if (typeof document !== "undefined") {
        try {
          const downloadLink = document.createElement("a");
          downloadLink.href = "/oceanic-guide-2026.pdf";
          downloadLink.download = "OCEANIC-Guide-Formatech-2026.pdf";
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (downloadErr) {
          console.warn("[RegisterForm] Auto-download triggered via browser:", downloadErr);
        }
      }

      // Save submitted state to show the confirmation message
      setSubmittedData({
        firstName,
        lastName,
        position,
        company,
        whatsapp,
        desiredTopic,
        peopleCount: Number(peopleCount) || 1,
      });
    } catch {
      setServerError(t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted, display the Confirmation Card with Firm Contact Info
  if (submittedData) {
    return (
      <section
        id="register"
        className="w-full scroll-mt-24"
        aria-labelledby="confirmation-heading"
      >
        <div className="w-full max-w-2xl mx-auto rounded-3xl bg-[#12223B] border border-emerald-500/30 p-6 sm:p-10 shadow-xl relative overflow-hidden text-start">
          {/* Decorative Corner Glow */}
          <div
            className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Success Header Badge */}
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-4">
            <span>{t("confirmation.badge")}</span>
          </div>

          <h2
            id="confirmation-heading"
            className="text-2xl sm:text-3xl font-black text-token-primary tracking-tight"
          >
            {t("confirmation.title")}
          </h2>

          <p className="text-sm sm:text-base text-token-secondary mt-2 leading-relaxed">
            {t("confirmation.subtitle")}
          </p>

          {/* Participant Details Summary Box */}
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#0A1124] border border-white/10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t("confirmation.summaryTitle")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block">{t("confirmation.nameLabel")}:</span>
                <span className="font-bold text-token-primary">
                  {submittedData.firstName} {submittedData.lastName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">{t("confirmation.orgLabel")}:</span>
                <span className="font-bold text-token-primary">
                  {submittedData.company} • {submittedData.position}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">{t("confirmation.whatsappLabel")}:</span>
                <span className="font-bold text-brand-orange-gold font-mono dir-ltr inline-block">
                  {submittedData.whatsapp}
                </span>
              </div>
              {submittedData.desiredTopic && (
                <div>
                  <span className="text-slate-400 block">{t("confirmation.topicLabel")}:</span>
                  <span className="font-bold text-token-primary">
                    {submittedData.desiredTopic}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FIRM CONTACT INFO BOX (OCEANIC) */}
          <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-[#0A1124] border border-brand-orange-gold/30 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-brand-orange-gold" />
              <h3 className="font-black text-base sm:text-lg tracking-tight text-token-primary">
                {t("confirmation.firmCardTitle")}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              {t("confirmation.firmDesc")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-orange-rust shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-200">{t("confirmation.firmStandLabel")}</span>
                  <span className="text-slate-300">{t("confirmation.firmStand")}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-200">{t("confirmation.firmPhoneLabel")}</span>
                  <span className="text-slate-300 font-mono dir-ltr block">{t("confirmation.firmPhone")}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-200">{t("confirmation.firmEmailLabel")}</span>
                  <span className="text-slate-300">{t("confirmation.firmEmail")}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-200">{t("confirmation.firmWebsiteLabel")}</span>
                  <a
                    href="https://www.oceanic-dz.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-300 hover:underline"
                  >
                    {t("confirmation.firmWebsite")}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons with direct PDF download */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <a
              href="/oceanic-guide-2026.pdf"
              download="OCEANIC-Guide-Formatech-2026.pdf"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-brand-orange-rust via-brand-orange-amber to-brand-orange-gold hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.99]"
            >
              <span>{t("confirmation.downloadAgain")}</span>
            </a>
            <a
              href="#cards-showcase"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold text-center border border-white/15 transition-colors shadow-xs"
            >
              {t("confirmation.viewResultsAction")}
            </a>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            {t("confirmation.downloadNotice")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="register"
      className="w-full scroll-mt-24 text-start overflow-hidden"
      aria-labelledby="register-heading"
    >
      <div className="w-full max-w-2xl mx-auto rounded-2xl sm:rounded-3xl bg-[#12223B] shadow-xl border border-white/10 p-4 sm:p-10 relative overflow-hidden">
        {/* Section Heading with Badge */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-brand-orange-gold/15 text-brand-orange-gold border border-brand-orange-gold/30 text-xs font-bold uppercase tracking-wider mb-3">
            <span>{t("badge")}</span>
          </div>
          <h2
            id="register-heading"
            className="text-2xl sm:text-3xl font-black text-token-primary tracking-tight"
          >
            {t("title")}
          </h2>

          <p className="text-xs sm:text-sm text-token-secondary mt-2 leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Global Server Error Banner */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-feedback-error-subtle border border-feedback-error/30 text-xs sm:text-sm font-semibold text-feedback-error flex items-start gap-2.5"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {!isRegistrationOpen ? (
          <div
            role="status"
            className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start space-y-3"
          >
            <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400 font-bold text-sm sm:text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                {locale === "ar"
                  ? "تم إغلاق استمارة التسجيل في السحب حالياً"
                  : "Registration for the draw is currently closed"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-token-secondary leading-relaxed">
              {locale === "ar"
                ? "نشكركم على اهتمامكم وتواجدكم معنا في جناح OCEANIC ضمن معرض Formatech 2026. تم إيقاف استقبال المشاركات الجديدة في سحب اليوم. ترقبوا إعلان الفائزين عند اختتام المعرض!"
                : "Thank you for visiting the OCEANIC stand at Formatech 2026. Submissions for today's raffle draw are currently closed. Stay tuned for the winners announcement at the end of the fair!"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Honeypot field (hidden from real users, traps bots) */}
            <div aria-hidden="true" className="sr-honeypot">
              <label htmlFor="website_hp">Leave empty</label>
              <input
                type="text"
                id="website_hp"
                name="website_hp"
                tabIndex={-1}
                autoComplete="off"
                value={botField}
                onChange={(e) => setBotField(e.target.value)}
              />
            </div>

            {/* Row 1: First Name & Last Name (Required) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-bold text-token-primary mb-1.5"
                >
                  {t("firstNameLabel")} <span className="text-feedback-error">*</span>
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder={t("firstNamePlaceholder")}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.firstName;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => validateField("firstName")}
                  error={errors.firstName}
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-bold text-token-primary mb-1.5"
                >
                  {t("lastNameLabel")} <span className="text-feedback-error">*</span>
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  placeholder={t("lastNamePlaceholder")}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.lastName;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => validateField("lastName")}
                  error={errors.lastName}
                />
              </div>
            </div>

            {/* Row 2: Position & Company (Required) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="position"
                  className="block text-xs font-bold text-token-primary mb-1.5 flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5 text-token-muted" />
                  <span>{t("positionLabel")} <span className="text-feedback-error">*</span></span>
                </label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  required
                  placeholder={t("positionPlaceholder")}
                  value={position}
                  onChange={(e) => {
                    setPosition(e.target.value);
                    if (errors.position) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.position;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => validateField("position")}
                  error={errors.position}
                />
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="block text-xs font-bold text-token-primary mb-1.5 flex items-center gap-1"
                >
                  <Building className="w-3.5 h-3.5 text-token-muted" />
                  <span>{t("companyLabel")} <span className="text-feedback-error">*</span></span>
                </label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  required
                  placeholder={t("companyPlaceholder")}
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.company;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => validateField("company")}
                  error={errors.company}
                />
              </div>
            </div>

            {/* Row 3: WhatsApp Number (Required) */}
            <div>
              <label
                htmlFor="whatsapp"
                className="block text-xs font-bold text-token-primary mb-1.5 flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("whatsappLabel")} <span className="text-feedback-error">*</span></span>
              </label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                autoComplete="tel"
                placeholder={t("whatsappPlaceholder")}
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  if (errors.whatsapp) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.whatsapp;
                      return next;
                    });
                  }
                }}
                onBlur={() => validateField("whatsapp")}
                error={errors.whatsapp}
              />
            </div>

            {/* Optional Section Divider */}
            <div className="pt-4 pb-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                {t("optionalSectionTitle")}
              </span>

              {/* Row 4: Desired Training Topic (List/Dropdown) & People Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="desiredTopic"
                    className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t("desiredTopicLabel")}</span>
                  </label>
                  <select
                    id="desiredTopic"
                    name="desiredTopic"
                    value={desiredTopic}
                    onChange={(e) => {
                      setDesiredTopic(e.target.value);
                      if (errors.desiredTopic) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.desiredTopic;
                          return next;
                        });
                      }
                    }}
                    className={`w-full rounded-xl border border-white/15 px-3.5 py-3 text-xs sm:text-sm text-token-primary bg-[#0A1124] outline-none transition-all ${
                      errors.desiredTopic
                        ? "border-red-500 bg-red-950/20"
                        : "hover:border-white/25 focus:border-brand-orange-gold focus:ring-2 focus:ring-brand-orange-gold/30"
                    }`}
                  >
                    <option value="" className="bg-[#0A1124] text-slate-400">
                      {t("desiredTopicPlaceholder")}
                    </option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-[#0A1124] text-white">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="peopleCount"
                    className="block text-xs font-semibold text-token-primary mb-1.5 flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5 text-brand-orange-gold" />
                    <span>{t("peopleCountLabel")}</span>
                  </label>
                  <input
                    type="number"
                    id="peopleCount"
                    name="peopleCount"
                    min={1}
                    max={100}
                    placeholder={t("peopleCountPlaceholder")}
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#0A1124] hover:border-white/25 px-3.5 py-3 text-xs sm:text-sm text-token-primary focus:border-brand-orange-gold focus:ring-2 focus:ring-brand-orange-gold/30 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (errors.consent) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.consent;
                        return next;
                      });
                    }
                  }}
                  className={`mt-0.5 h-4 w-4 rounded accent-brand-orange-gold transition ${
                    errors.consent
                      ? "ring-2 ring-red-500 border-red-500 text-red-600"
                      : "border-white/20 bg-[#0A1124] text-brand-orange-gold focus:ring-brand-orange-gold"
                  }`}
                />
                <span className="text-xs text-token-secondary leading-normal">
                  {t("consentLabel")}
                </span>
              </label>
            </div>

            {/* Submit Button with Signature Gradient */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[50px] font-black text-sm sm:text-base py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-orange-rust via-brand-orange-amber to-brand-orange-gold hover:brightness-110 text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t("submittingButton") : t("submitButton")}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
