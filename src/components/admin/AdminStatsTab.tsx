"use client";

import { useMemo, useState } from "react";
import { VoteData } from "../VotingSection";
import {
  BarChart3,
  Users,
  Award,
  Clock,
  Trophy,
} from "lucide-react";

interface AdminStatsTabProps {
  voteResults: VoteData[];
  participants: any[];
  winnersCount: number;
  topics?: { slug: string; title: string }[];
}

export function AdminStatsTab({
  voteResults,
  participants,
  winnersCount,
  topics = [],
}: AdminStatsTabProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    time: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const totalVotes = useMemo(() => {
    return voteResults.reduce((acc, curr) => acc + Number(curr.count), 0);
  }, [voteResults]);

  const totalContacts = participants.length;

  const leadingTopic = useMemo(() => {
    if (voteResults.length === 0) return null;
    return voteResults.reduce((prev, current) =>
      Number(current.count) > Number(prev.count) ? current : prev
    );
  }, [voteResults]);

  const topicTitles = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {
      "topic-a": "الذكاء الاصطناعي التوليدي والنماذج اللغوية",
      "topic-b": "هندسة السحابة وحلول الديف أوبس (Cloud & DevOps)",
      "topic-c": "الأمن السيبراني والدفاع ضد التهديدات",
    };
    if (topics && topics.length > 0) {
      topics.forEach((t) => {
        if (t.slug && t.title) {
          map[t.slug] = t.title;
        }
      });
    }
    return map;
  }, [topics]);

  // Timeline data (08:00 to 18:00) using real participant registration timestamps
  const timelineData = useMemo(() => {
    const hours = [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
    ];

    const countsByHour: Record<string, number> = {};
    hours.forEach((h) => (countsByHour[h] = 0));

    participants.forEach((p) => {
      if (!p.created_at) return;
      try {
        const d = new Date(p.created_at);
        const h = d.getHours();
        const formattedHour = `${String(h).padStart(2, "0")}:00`;
        if (countsByHour[formattedHour] !== undefined) {
          countsByHour[formattedHour]++;
        } else if (h < 8) {
          countsByHour["08:00"]++;
        } else if (h >= 18) {
          countsByHour["18:00"]++;
        }
      } catch {
        // Skip unparseable dates
      }
    });

    return hours.map((hour) => ({
      time: hour,
      count: countsByHour[hour] || 0,
    }));
  }, [participants]);

  const maxCount = Math.max(...timelineData.map((d) => d.count), 5);
  const chartWidth = 700;
  const chartHeight = 200;
  const paddingX = 35;
  const paddingY = 25;

  const points = timelineData.map((d, index) => {
    const x =
      paddingX +
      (index / (timelineData.length - 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      (d.count / maxCount) * (chartHeight - paddingY * 2);
    return { ...d, x, y };
  });

  const pathD = points.reduce((acc, pt, index) => {
    if (index === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[index - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    chartHeight - paddingY
  } L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="space-y-6 text-left">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Statistics</h1>
      </div>

      {/* 4 Minimal KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs text-slate-500 font-medium block">Total Votes</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalVotes}</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs text-slate-500 font-medium block">Participants</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalContacts}</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs text-slate-500 font-medium block">Winners</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{winnersCount}</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Trophy className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs text-slate-500 font-medium block">Leading Topic</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm font-bold text-slate-900 truncate" title={leadingTopic?.topic_slug}>
              {leadingTopic ? (topicTitles[leadingTopic.topic_slug] || leadingTopic.topic_slug) : "—"}
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
              <Award className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* TIMELINE CHART */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Registrations by Hour
            </h2>
          </div>
        </div>

        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[550px] h-[200px]">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="areaGradientLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.5, 1].map((ratio, i) => {
                const y =
                  chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                const val = Math.round(ratio * maxCount);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              <path d={areaD} fill="url(#areaGradientLight)" />
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.time === pt.time ? "5" : "3.5"}
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <text
                    x={pt.x}
                    y={chartHeight - 6}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {pt.time}
                  </text>
                </g>
              ))}
            </svg>

            {hoveredPoint && (
              <div
                className="absolute bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-full font-mono z-20"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                }}
              >
                {hoveredPoint.time}: {hoveredPoint.count} registrants
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BAR CHART: 3 Topics */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Voting Results by Topic
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {totalVotes} total votes
          </span>
        </div>

        <div className="space-y-4">
          {voteResults.map((topic, index) => {
            const count = Number(topic.count);
            const percentage =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isLeading = leadingTopic?.topic_id === topic.topic_id && totalVotes > 0;
            const title = topicTitles[topic.topic_slug] || `Topic #${index + 1}`;

            return (
              <div key={topic.topic_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-400 font-mono">#{index + 1}</span>
                    <span className="font-semibold text-slate-800 truncate">{title}</span>
                    {isLeading && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Leading
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-slate-500">{count} votes</span>
                    <span className="font-bold text-slate-900">{percentage}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLeading ? "bg-blue-600" : "bg-slate-400"
                    }`}
                    style={{ width: `${Math.max(percentage, totalVotes > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
