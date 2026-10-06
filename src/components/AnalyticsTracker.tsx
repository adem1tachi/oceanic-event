"use client";

import { useEffect } from "react";

const VISITOR_ID_KEY = "oceanic_visitor_id";
const SESSION_ID_KEY = "oceanic_session_id";

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return `v_anon_${Date.now()}`;
  }
}

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return `s_anon_${Date.now()}`;
  }
}

export function sendAnalyticsEvent(
  eventType: "page_view" | "link_click",
  details: { url?: string; metadata?: Record<string, any> } = {}
) {
  try {
    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();

    const payload = JSON.stringify({
      eventType,
      visitorId,
      sessionId,
      url: details.url || (typeof window !== "undefined" ? window.location.href : ""),
      metadata: details.metadata || {},
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    // Fail silently so user experience is never blocked
  }
}

export function AnalyticsTracker() {
  useEffect(() => {
    // 1. Log page view on mount
    sendAnalyticsEvent("page_view", {
      url: window.location.href,
      metadata: { referrer: document.referrer || null },
    });

    // 2. Global click listener for official website links (oceanic-dz.com)
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target || !target.href) return;

      if (target.href.includes("oceanic-dz.com")) {
        sendAnalyticsEvent("link_click", {
          url: target.href,
          metadata: {
            text: target.textContent?.trim().slice(0, 100) || null,
            targetPath: new URL(target.href).pathname,
          },
        });
      }
    };

    document.addEventListener("click", handleDocumentClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  return null;
}
