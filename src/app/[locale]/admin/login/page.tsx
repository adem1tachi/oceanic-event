"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { adminLoginSchema } from "@/lib/validators";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = adminLoginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Authenticate with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !data.user) {
        setError(t("invalidCredentials"));
        setIsSubmitting(false);
        return;
      }

      // Verify that this user exists in the admins allowlist
      const { data: adminRecord, error: adminCheckError } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminCheckError || !adminRecord) {
        // Not an authorized admin - immediately sign them out
        await supabase.auth.signOut();
        setError(t("unauthorized"));
        setIsSubmitting(false);
        return;
      }

      // Successful admin login
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Login failure:", err);
      setError("An unexpected error occurred during login.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-token-muted hover:text-token-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>Back to Public Site</span>
          </Link>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-action text-action-fg flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-token-primary tracking-tight">
            {t("loginTitle")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-token-secondary">
            {t("loginSubtitle")}
          </p>
        </div>

        <div className="mt-8 bg-bg-surface py-8 px-6 sm:px-10 rounded-xl border border-border shadow-sm">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-feedback-error-subtle border border-feedback-error/30 text-feedback-error text-xs sm:text-sm font-semibold flex items-start gap-2.5"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5 text-start">
            <Input
              label={t("emailLabel")}
              type="email"
              placeholder="admin@formatech.dz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isSubmitting}
            />

            <Input
              label={t("passwordLabel")}
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full font-bold mt-2"
            >
              {isSubmitting ? t("loggingIn") : t("loginButton")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
