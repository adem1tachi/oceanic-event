"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, LogOut, Tv, ArrowLeft } from "lucide-react";
import { useState } from "react";

export interface AdminHeaderProps {
  adminEmail?: string | null;
}

export function AdminHeader({ adminEmail }: AdminHeaderProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full border-b border-border bg-bg-surface sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-token-muted hover:text-token-primary p-1.5 rounded-md hover:bg-bg-surface-raised flex items-center gap-1 transition-colors"
            title="Back to Public Site"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span className="hidden sm:inline">Public Site</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-action text-action-fg flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-token-primary tracking-tight">
              {t("title")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {adminEmail && (
            <span className="text-xs text-token-muted hidden md:inline truncate max-w-[200px]">
              {adminEmail}
            </span>
          )}

          <Link href="/admin/projector">
            <Button size="sm" variant="secondary" className="gap-1.5 font-semibold text-xs">
              <Tv className="w-3.5 h-3.5 text-highlight" />
              <span className="hidden sm:inline">{t("navProjector")}</span>
            </Button>
          </Link>

          <LanguageSwitcher />

          <Button
            size="sm"
            variant="outline"
            onClick={handleLogout}
            isLoading={isLoggingOut}
            className="text-xs font-semibold gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("logoutButton")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
