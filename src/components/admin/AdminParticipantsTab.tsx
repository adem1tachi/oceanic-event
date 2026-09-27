"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Phone,
  Building,
  Briefcase,
  Download,
  ExternalLink,
} from "lucide-react";

export interface FormattedParticipant {
  id: string;
  lastName: string;
  firstName: string;
  position: string;
  company: string;
  whatsapp: string;
  desiredTopic: string;
  peopleCount: number;
  status: "new" | "contacted" | "winner";
  createdAt: string;
}

interface AdminParticipantsTabProps {
  initialParticipants: any[];
  winners: any[];
  initialStatuses?: Record<string, "new" | "contacted" | "winner">;
  onStatusesUpdated?: (statuses: Record<string, "new" | "contacted" | "winner">) => void;
}

export function AdminParticipantsTab({
  initialParticipants,
  winners,
  initialStatuses = {},
  onStatusesUpdated,
}: AdminParticipantsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statuses, setStatuses] = useState<
    Record<string, "new" | "contacted" | "winner">
  >(initialStatuses);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Synchronize statuses whenever initialStatuses changes (e.g., when draw is reset)
  useEffect(() => {
    setStatuses(initialStatuses);
  }, [initialStatuses]);

  const winnerIds = useMemo(
    () => new Set(winners.map((w) => w.participant_id || w.participantId)),
    [winners]
  );

  // Format and parse all participants
  const formattedParticipants = useMemo<FormattedParticipant[]>(() => {
    return initialParticipants.map((p) => {
      let firstName = p.first_name || "";
      let lastName = p.last_name || "";
      let position = p.position || "";
      let company = p.company || "";
      let desiredTopic = p.desired_topic || "";
      let peopleCount = p.people_count || 1;

      if (!firstName && p.full_name) {
        let nameStr = p.full_name;
        if (nameStr.includes(" | ")) {
          const parts = nameStr.split(" | ");
          nameStr = parts[0];
          for (let i = 1; i < parts.length; i++) {
            if (parts[i].startsWith("Org: "))
              company = parts[i].replace("Org: ", "").trim();
            else if (parts[i].startsWith("Pos: "))
              position = parts[i].replace("Pos: ", "").trim();
          }
        }
        const nameParts = nameStr.trim().split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || nameParts[0];
      }

      if (!desiredTopic && p.email && p.email.startsWith("Topic: ")) {
        const match = p.email.match(/Topic:\s*([^(|]+)(?:\(x?(\d+)\))?/);
        if (match) {
          desiredTopic = match[1].trim();
          if (match[2]) peopleCount = parseInt(match[2], 10) || 1;
        }
      }

      const isWinner = winnerIds.has(p.id);
      const currentStatus: "new" | "contacted" | "winner" = isWinner
        ? "winner"
        : statuses[p.id] === "winner"
        ? "new"
        : statuses[p.id] || "new";

      return {
        id: p.id,
        firstName: firstName || "—",
        lastName: lastName || "—",
        position: position || "—",
        company: company || "—",
        whatsapp: p.phone,
        desiredTopic: desiredTopic || "—",
        peopleCount: peopleCount || 1,
        status: currentStatus,
        createdAt: p.created_at || new Date().toISOString(),
      };
    });
  }, [initialParticipants, winnerIds, statuses]);

  // Extract distinct topics for filtering
  const distinctTopics = useMemo(() => {
    const set = new Set<string>();
    formattedParticipants.forEach((p) => {
      if (p.desiredTopic && p.desiredTopic !== "—") {
        set.add(p.desiredTopic);
      }
    });
    return Array.from(set);
  }, [formattedParticipants]);

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return formattedParticipants.filter((p) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.company.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query) ||
        p.whatsapp.includes(query);

      const matchesTopic =
        topicFilter === "all" ||
        (topicFilter === "none" && p.desiredTopic === "—") ||
        p.desiredTopic.toLowerCase().includes(topicFilter.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesTopic && matchesStatus;
    });
  }, [formattedParticipants, searchQuery, topicFilter, statusFilter]);

  const handleStatusChange = async (
    participantId: string,
    newStatus: "new" | "contacted"
  ) => {
    // Strictly prevent manual change to "winner"
    if (newStatus !== "new" && newStatus !== "contacted") return;

    setIsUpdatingStatus(participantId);
    const nextStatuses: Record<string, "new" | "contacted" | "winner"> = {
      ...statuses,
      [participantId]: newStatus,
    };
    setStatuses(nextStatuses);
    if (onStatusesUpdated) {
      onStatusesUpdated(nextStatuses);
    }

    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactStatuses: nextStatuses }),
      });
    } catch (err) {
      console.error("Error saving status change:", err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanNumber}`;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Participants
          </h1>
        </div>

        <a
          href="/api/admin/export"
          download
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, position, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors bg-slate-50/50"
            />
          </div>

          {/* Filter by Desired Training */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors bg-slate-50/50"
            >
              <option value="all">All Topics</option>
              {distinctTopics.map((t, idx) => (
                <option key={idx} value={t}>
                  {t}
                </option>
              ))}
              <option value="none">Unspecified</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors bg-slate-50/50"
            >
              <option value="all">All Statuses</option>
              <option value="new">🔵 New</option>
              <option value="contacted">🟡 Contacted</option>
              <option value="winner">🟢 Winner</option>
            </select>
          </div>
        </div>

        {/* Results Count Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong>{filteredParticipants.length}</strong> of{" "}
            <strong>{formattedParticipants.length}</strong> participants
          </span>
          {(searchQuery || topicFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setTopicFilter("all");
                setStatusFilter("all");
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* FULL PARTICIPANTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-left">#</th>
                <th className="py-3 px-3 text-left">Last Name</th>
                <th className="py-3 px-3 text-left">First Name</th>
                <th className="py-3 px-3 text-left">Position</th>
                <th className="py-3 px-3 text-left">Company</th>
                <th className="py-3 px-3 text-left">WhatsApp</th>
                <th className="py-3 px-3 text-left">Desired Topic</th>
                <th className="py-3 px-3 text-center">People</th>
                <th className="py-3 px-3 text-left">Status</th>
                <th className="py-3 px-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No participants match your criteria.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, index) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {index + 1}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {p.lastName}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {p.firstName}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 max-w-[130px] truncate" title={p.position}>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{p.position}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 max-w-[130px] truncate" title={p.company}>
                      <span className="inline-flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{p.company}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-900 whitespace-nowrap">
                      <a
                        href={getWhatsAppLink(p.whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium text-[11px]"
                        title="Open WhatsApp chat"
                      >
                        <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{p.whatsapp}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                      </a>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 max-w-[150px] truncate" title={p.desiredTopic}>
                      {p.desiredTopic}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[11px]">
                        {p.peopleCount}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      {p.status === "winner" ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 select-none shadow-2xs"
                          title="Winner (Selected by Raffle Wheel)"
                        >
                          🟢 Winner
                        </span>
                      ) : (
                        <select
                          value={p.status}
                          disabled={isUpdatingStatus === p.id}
                          onChange={(e) =>
                            handleStatusChange(
                              p.id,
                              e.target.value as "new" | "contacted"
                            )
                          }
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border focus:outline-none cursor-pointer transition-colors ${
                            p.status === "contacted"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          <option value="new">🔵 New</option>
                          <option value="contacted">🟡 Contacted</option>
                        </select>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
