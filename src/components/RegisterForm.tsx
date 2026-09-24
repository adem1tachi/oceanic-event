"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { registrationSchema } from "@/lib/validators";
import { normalizeAlgerianPhone } from "@/lib/phone";
import { Check, ShieldCheck, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [botField, setBotField] = useState("");

  // Validation & Submission States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field blur validation helper
  const validateField = (field: string) => {
    const values = {
      fullName,
      phone,
      email,
      consent,
      locale,
      botField,
    };

    const res = registrationSchema.safeParse(values);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === field);
      if (issue) {
        setErrors((prev) => ({ ...prev, [field]: t(issue.message as any) }));
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
      fullName,
      phone,
      email: email.trim() || undefined,
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
          newErrors[fieldName] = t(issue.message as any);
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
          setServerError(t("register.duplicatePhone"));
        } else if (data.errors && typeof data.errors === "object") {
          // Map server-side zod validation errors if any
          const mappedErrors: Record<string, string> = {};
          for (const [key, msg] of Object.entries(data.errors)) {
            mappedErrors[key] = t(msg as any);
          }
          setErrors(mappedErrors);
        } else {
          setServerError(t("register.genericError"));
        }
        return;
      }

      // Successful registration - navigate to success screen
      router.push("/success");
    } catch (err) {
      console.error("Client registration fetch failed:", err);
      setServerError(t("register.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full flex flex-col gap-5 text-start"
    >
      {/* Honeypot Bot Trap Field (Hidden from real users) */}
      <div className="sr-honeypot" aria-hidden="true">
        <label htmlFor="user_website">Website or Fax</label>
        <input
          id="user_website"
          type="text"
          name="website"
          value={botField}
          onChange={(e) => setBotField(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-feedback-error-subtle border border-feedback-error/30 text-feedback-error text-sm font-semibold flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Full Name */}
      <Input
        label={t("register.fullNameLabel")}
        placeholder={t("register.fullNamePlaceholder")}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        onBlur={() => validateField("fullName")}
        error={errors.fullName}
        required
        disabled={isSubmitting}
        autoComplete="name"
        autoCapitalize="words"
      />

      {/* Algerian Mobile Phone */}
      <Input
        label={t("register.phoneLabel")}
        placeholder={t("register.phonePlaceholder")}
        hint={t("register.phoneHint")}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onBlur={() => validateField("phone")}
        error={errors.phone}
        required
        disabled={isSubmitting}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        dir="ltr"
        className="text-start"
      />

      {/* Optional Email */}
      <Input
        label={t("register.emailLabel")}
        placeholder={t("register.emailPlaceholder")}
        hint={t("register.emailHint")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => validateField("email")}
        error={errors.email}
        disabled={isSubmitting}
        type="email"
        inputMode="email"
        autoComplete="email"
        dir="ltr"
        className="text-start"
      />

      {/* Consent Checkbox */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (errors.consent && e.target.checked) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.consent;
                  return next;
                });
              }
            }}
            disabled={isSubmitting}
            className="mt-1 h-5 w-5 rounded border-border-strong text-action focus:ring-highlight shrink-0 cursor-pointer"
          />
          <span className="text-xs sm:text-sm text-token-secondary leading-normal">
            {t("register.consentLabel")}
          </span>
        </label>

        {errors.consent && (
          <p role="alert" className="text-xs font-semibold text-feedback-error ms-8">
            {errors.consent}
          </p>
        )}
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-xs text-token-muted mt-1">
        <ShieldCheck className="w-4 h-4 shrink-0 text-token-secondary" />
        <span>Your data is confidential and used exclusively for this event raffle.</span>
      </div>

      {/* Submit Button */}
      <div className="mt-4">
        <Button
          type="submit"
          size="lg"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full text-base font-bold shadow-md"
        >
          {isSubmitting
            ? t("register.submittingButton")
            : t("register.submitButton")}
        </Button>
      </div>
    </form>
  );
}
