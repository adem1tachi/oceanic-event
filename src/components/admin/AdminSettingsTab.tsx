"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { AppSettings, CustomTopicConfig } from "@/lib/settings";
import {
  Download,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ImageIcon,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react";

interface AdminSettingsTabProps {
  initialSettings: AppSettings;
  onSettingsUpdated?: (newSettings: AppSettings) => void;
  onBackupRestored?: () => void;
}

export function AdminSettingsTab({
  initialSettings,
  onSettingsUpdated,
  onBackupRestored,
}: AdminSettingsTabProps) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [topics, setTopics] = useState<CustomTopicConfig[]>(
    initialSettings.topics || []
  );
  const [uploadingTopicIndex, setUploadingTopicIndex] = useState<number | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // 1. Toggle Registration
  const handleToggleRegistration = async () => {
    const nextState = !settings.isRegistrationOpen;
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRegistrationOpen: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updated = { ...settings, isRegistrationOpen: nextState };
        setSettings(updated);
        if (onSettingsUpdated) onSettingsUpdated(updated);
        showNotification(
          nextState
            ? "Registration form is now open."
            : "Registration form is now closed."
        );
      } else {
        showNotification(data.error || "Failed to update status.", "error");
      }
    } catch {
      showNotification("Server connection error.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveEventDate = async (newDate: string) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDate: newDate }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updated = { ...settings, eventDate: newDate };
        setSettings(updated);
        if (onSettingsUpdated) onSettingsUpdated(updated);
        showNotification("Event date updated successfully.");
      } else {
        showNotification(data.error || "Failed to update event date.", "error");
      }
    } catch {
      showNotification("Server connection error.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 2. Export CSV
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const res = await fetch("/api/admin/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `participants-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification("CSV export completed.");
    } catch {
      showNotification("Error during CSV export.", "error");
    } finally {
      setIsExportingCsv(false);
    }
  };

  // 3. Export Full Backup JSON
  const handleExportBackup = async () => {
    setIsExportingBackup(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification("Backup file exported.");
    } catch {
      showNotification("Error during backup export.", "error");
    } finally {
      setIsExportingBackup(false);
    }
  };

  // 4. Import / Restore Backup JSON
  const handleRestoreBackup = async () => {
    if (!selectedBackupFile) {
      showNotification("Please select a JSON backup file first.", "error");
      return;
    }

    const confirmRestore = window.confirm(
      "Are you sure you want to restore this backup? Existing participants will be merged."
    );
    if (!confirmRestore) return;

    setIsRestoringBackup(true);
    try {
      const fileText = await selectedBackupFile.text();
      const backupJson = JSON.parse(fileText);

      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupJson),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message || "Backup restored successfully.");
        setSelectedBackupFile(null);
        if (onBackupRestored) {
          onBackupRestored();
        } else {
          setTimeout(() => window.location.reload(), 1200);
        }
      } else {
        showNotification(data.error || "Failed to restore backup.", "error");
      }
    } catch {
      showNotification("Invalid backup file format.", "error");
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // 5. Topic Fields
  const handleTopicFieldChange = (
    index: number,
    field: keyof CustomTopicConfig,
    value: string
  ) => {
    setTopics((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleImageFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = "";

    setUploadingTopicIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const currentTopic = topics[index];
      formData.append("topicSlug", currentTopic?.slug || `topic-${index + 1}`);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        handleTopicFieldChange(index, "imageUrl", data.url);
        showNotification("Image uploaded to Supabase Storage.");
      } else {
        showNotification(data.error || "Failed to upload image.", "error");
      }
    } catch (err: any) {
      showNotification("Upload failed: " + (err?.message || "Network error"), "error");
    } finally {
      setUploadingTopicIndex(null);
    }
  };

  const handleSaveTopics = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updated = { ...settings, topics };
        setSettings(updated);
        if (onSettingsUpdated) onSettingsUpdated(updated);
        showNotification("Topics saved successfully.");
      } else {
        showNotification(data.error || "Failed to save topics.", "error");
      }
    } catch {
      showNotification("Server connection error.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      </div>

      {/* Global Feedback */}
      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Registration Status Switch & Event Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Registration */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Registration Form
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  settings.isRegistrationOpen
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {settings.isRegistrationOpen ? "Open" : "Closed"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {settings.isRegistrationOpen
                ? "The registration form is currently open to visitors on the landing page."
                : "The registration form is closed to visitors and not accepting new submissions."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleRegistration}
            disabled={isSavingSettings}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 self-start ${
              settings.isRegistrationOpen
                ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {settings.isRegistrationOpen ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span>Close Registration</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span>Open Registration</span>
              </>
            )}
          </button>
        </div>

        {/* Event Timer */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Event Countdown Timer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Set the target date and time for the event. The homepage countdown timer will update automatically.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <input
              type="datetime-local"
              value={settings.eventDate ? new Date(new Date(settings.eventDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
              onChange={(e) => {
                if (e.target.value) {
                  const newDate = new Date(e.target.value).toISOString();
                  handleSaveEventDate(newDate);
                }
              }}
              disabled={isSavingSettings}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            {isSavingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>
        </div>
      </div>

      {/* 2. Data Export & Backup Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Data & Backups
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* CSV Export */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Participants (CSV)
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Export participants in Excel format.
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              {isExportingCsv ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download CSV</span>
            </button>
          </div>

          {/* Backup Export */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Full Backup (JSON)
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Export all data and configurations.
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={isExportingBackup}
              className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              {isExportingBackup ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Export Backup</span>
            </button>
          </div>

          {/* Backup Restore */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Restore Backup
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Restore from a previous JSON backup.
              </span>
            </div>
            <div className="mt-2 space-y-2">
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedBackupFile(e.target.files[0]);
                }}
                className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-200 file:text-[11px] file:bg-white file:text-slate-700"
              />
              {selectedBackupFile && (
                <button
                  type="button"
                  onClick={handleRestoreBackup}
                  disabled={isRestoringBackup}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 text-xs font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Confirm Restore</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Configure the 3 Topics (Homepage) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Training Topics (Landing Page)
          </h2>
          <button
            type="button"
            onClick={handleSaveTopics}
            disabled={isSavingSettings}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isSavingSettings ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Topics</span>
          </button>
        </div>

        {/* 3 Topics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {topics.map((topic, index) => (
            <div
              key={topic.id || topic.slug || index}
              className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Topic #{index + 1}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {topic.slug}
                  </span>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Title
                  </label>
                  <input
                    type="text"
                    value={topic.title || ""}
                    onChange={(e) =>
                      handleTopicFieldChange(index, "title", e.target.value)
                    }
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={topic.description || ""}
                    onChange={(e) =>
                      handleTopicFieldChange(index, "description", e.target.value)
                    }
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Supabase Storage Image */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                    <span>صورة الموضوع (Supabase Storage)</span>
                    {topic.imageUrl && (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> تم الرفع للتخزين السحابي
                      </span>
                    )}
                  </label>

                  {topic.imageUrl ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 flex items-center gap-3">
                      {/* Image Thumbnail */}
                      <div className="relative h-14 w-14 rounded-md overflow-hidden border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center">
                        <img
                          src={topic.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      {/* Image Details & Actions */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-slate-500 truncate text-left dir-ltr" title={topic.imageUrl}>
                          {topic.imageUrl}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {/* Change button */}
                          <label
                            className={`px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium cursor-pointer inline-flex items-center gap-1 ${
                              uploadingTopicIndex === index ? "opacity-50 pointer-events-none" : ""
                            }`}
                          >
                            {uploadingTopicIndex === index ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-brand-navy-petrol" />
                                <span>جارٍ الرفع...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3" />
                                <span>تغيير الصورة</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingTopicIndex === index}
                              onChange={(e) => handleImageFileChange(index, e)}
                              className="hidden"
                            />
                          </label>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleTopicFieldChange(index, "imageUrl", "")}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label
                        className={`w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-brand-navy-petrol/60 hover:bg-slate-50/80 rounded-lg cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors ${
                          uploadingTopicIndex === index ? "opacity-50 pointer-events-none bg-slate-50" : "bg-white"
                        }`}
                      >
                        {uploadingTopicIndex === index ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-brand-navy-petrol" />
                            <span className="text-xs font-semibold text-slate-700">جارٍ الرفع إلى Supabase Storage...</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <ImageIcon className="w-4 h-4 text-brand-navy-dark" />
                              <span className="text-xs font-semibold text-brand-navy-dark">رفع صورة عبر Supabase Storage</span>
                            </div>
                            <span className="text-[10px] text-slate-400">يدعم PNG, JPG, WEBP, SVG حتى 5MB</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingTopicIndex === index}
                          onChange={(e) => handleImageFileChange(index, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
