"use client";

import { useState } from "react";
import { AdminSidebar, AdminTab } from "./AdminSidebar";
import { AdminStatsTab } from "./AdminStatsTab";
import { AdminParticipantsTab } from "./AdminParticipantsTab";
import { AdminSettingsTab } from "./AdminSettingsTab";
import type { AppSettings } from "@/lib/settings";
import type { SiteAnalyticsSummary } from "@/app/[locale]/admin/page";

interface AdminDashboardClientProps {
  adminEmail: string | null;
  initialParticipants: any[];
  initialSettings: AppSettings;
  initialAnalytics: SiteAnalyticsSummary;
}

export function AdminDashboardClient({
  adminEmail,
  initialParticipants,
  initialSettings,
  initialAnalytics,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const [participants, setParticipants] = useState<any[]>(initialParticipants);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  // When backup is restored, trigger browser refresh to reload fresh data from database
  const handleBackupRestored = () => {
    window.location.reload();
  };

  return (
    <div dir="ltr" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row antialiased text-left font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        adminEmail={adminEmail}
      />

      {/* Main Tab Content Area */}
      <main className="flex-1 w-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {activeTab === "stats" && (
          <AdminStatsTab
            analytics={initialAnalytics}
            participants={participants}
          />
        )}

        {activeTab === "participants" && (
          <AdminParticipantsTab
            initialParticipants={participants}
            initialStatuses={settings.contactStatuses}
            onStatusesUpdated={(nextStatuses) =>
              setSettings((prev) => ({
                ...prev,
                contactStatuses: nextStatuses,
              }))
            }
          />
        )}

        {activeTab === "settings" && (
          <AdminSettingsTab
            initialSettings={settings}
            onSettingsUpdated={setSettings}
            onBackupRestored={handleBackupRestored}
          />
        )}
      </main>
    </div>
  );
}
