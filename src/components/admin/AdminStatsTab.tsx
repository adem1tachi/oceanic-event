"use client";

import { useMemo, useState } from "react";
import type { SiteAnalyticsSummary } from "@/app/[locale]/admin/page";
import {
  BarChart3,
  Users,
  RefreshCw,
  ExternalLink,
  Clock,
  Download,
  Building,
  Layers,
} from "lucide-react";

interface AdminStatsTabProps {
  analytics: SiteAnalyticsSummary;
  participants: any[];
}

export function AdminStatsTab({
  analytics,
  participants,
}: AdminStatsTabProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    time: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const totalContacts = participants.length;

  // Department distribution breakdown from registered participants
  const departmentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach((p) => {
      const dept = p.desired_topic?.trim();
      if (dept) {
        counts[dept] = (counts[dept] || 0) + 1;
      }
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries.map(([dept, count]) => ({
      name: dept,
      count,
      percentage: totalContacts > 0 ? Math.round((count / totalContacts) * 100) : 0,
    }));
  }, [participants, totalContacts]);

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
    <div className="space-y-6 text-left font-sans">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Traffic & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visitor traffic, guide downloads, and official website engagement
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Tracking Active</span>
        </div>
      </div>

      {/* 5 Real-Time KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Total Site Visits */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">
            Total Site Visits
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {analytics.totalVisits}
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            All page views
          </span>
        </div>

        {/* 2. Unique Visitors */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">
            Unique Visitors
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {analytics.uniqueVisitors}
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Distinct devices
          </span>
        </div>

        {/* 3. Return Rate % */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">
            Return Rate
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {analytics.returnRate}%
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <RefreshCw className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {analytics.returningVisitors} returning visitors
          </span>
        </div>

        {/* 4. Official Website Clicks */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">
            Official Website Clicks
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {analytics.officialClicks}
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ExternalLink className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            oceanic-dz.com links
          </span>
        </div>

        {/* 5. Guide Recipients (Participants) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-xs text-slate-500 font-medium block">
            Guide Recipients
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono">
              {totalContacts}
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Download className="w-4 h-4" />
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            PDF booklet leads
          </span>
        </div>
      </div>

      {/* TIMELINE CHART */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Registrations & Activity by Hour
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Fair hours (08:00 – 18:00)
          </span>
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
                {hoveredPoint.time}: {hoveredPoint.count} registrations
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEPARTMENT INTEREST BREAKDOWN */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Department & Specialty Breakdown
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {totalContacts} total requests
          </span>
        </div>

        {departmentBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No department data recorded yet.
          </div>
        ) : (
          <div className="space-y-3.5">
            {departmentBreakdown.map((dept, idx) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-400 font-mono text-[11px]">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {dept.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-slate-500">{dept.count} requests</span>
                    <span className="font-bold text-slate-900">{dept.percentage}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.max(dept.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
