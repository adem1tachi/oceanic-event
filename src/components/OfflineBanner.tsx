"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const t = useTranslations("common");

  useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-feedback-error text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm text-center"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{t("offlineNotice")}</span>
    </div>
  );
}
