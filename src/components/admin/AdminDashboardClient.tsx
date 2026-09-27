"use client";

import { useState } from "react";
import { AdminSidebar, AdminTab } from "./AdminSidebar";
import { AdminStatsTab } from "./AdminStatsTab";
import { AdminParticipantsTab } from "./AdminParticipantsTab";
import { AdminRaffleTab, WinnerSummary } from "./AdminRaffleTab";
import { AdminSettingsTab } from "./AdminSettingsTab";
import type { VoteData } from "../VotingSection";
import type { AppSettings } from "@/lib/settings";

interface AdminDashboardClientProps {
  adminEmail: string | null;
  initialVoteResults: VoteData[];
  initialParticipants: any[];
  initialWinners: any[];
  initialSettings: AppSettings;
}

export function AdminDashboardClient({
  adminEmail,
  initialVoteResults,
  initialParticipants,
  initialWinners,
  initialSettings,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const [participants, setParticipants] = useState<any[]>(initialParticipants);
  const [winners, setWinners] = useState<any[]>(initialWinners);
  const [voteResults, setVoteResults] = useState<VoteData[]>(initialVoteResults);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  // Sync state when a winner is drawn in the Raffle tab
  const handleWinnerDrawn = (newWinner: WinnerSummary) => {
    setWinners((prev) => [
      {
        id: newWinner.id,
        participant_id: newWinner.participantId,
        draw_round: 1,
        drawn_at: newWinner.drawnAt,
        full_name: newWinner.name,
        phone: newWinner.phone || "",
      },
      ...prev,
    ]);

    // Update the participant's status to 'winner' in local settings
    if (newWinner.participantId) {
      setSettings((prev) => ({
        ...prev,
        contactStatuses: {
          ...prev.contactStatuses,
          [newWinner.participantId]: "winner",
        },
      }));
    }
  };

  const handleResetComplete = () => {
    // Collect all winner participant IDs before clearing
    const winnerIdsToReset = winners.map((w) => w.participant_id || w.participantId);

    setWinners([]);

    // Reset status of all winners back to default "new"
    setSettings((prev) => {
      const nextStatuses = { ...prev.contactStatuses };
      winnerIdsToReset.forEach((id) => {
        if (id) nextStatuses[id] = "new";
      });
      for (const id in nextStatuses) {
        if (nextStatuses[id] === "winner") {
          nextStatuses[id] = "new";
        }
      }
      return {
        ...prev,
        contactStatuses: nextStatuses,
      };
    });
  };

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
            voteResults={voteResults}
            participants={participants}
            winnersCount={winners.length}
            topics={settings.topics}
          />
        )}

        {activeTab === "participants" && (
          <AdminParticipantsTab
            initialParticipants={participants}
            winners={winners}
            initialStatuses={settings.contactStatuses}
            onStatusesUpdated={(nextStatuses) =>
              setSettings((prev) => ({
                ...prev,
                contactStatuses: nextStatuses,
              }))
            }
          />
        )}

        {activeTab === "raffle" && (
          <AdminRaffleTab
            initialWinners={winners}
            allParticipants={participants}
            onWinnerDrawn={handleWinnerDrawn}
            onResetComplete={handleResetComplete}
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
