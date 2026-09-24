"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { formatAlgerianPhoneDisplay } from "@/lib/phone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Download, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";

export interface ParticipantItem {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  locale: string;
  created_at: string;
}

export interface ParticipantsTableProps {
  participants: ParticipantItem[];
}

const ITEMS_PER_PAGE = 10;

export function ParticipantsTable({ participants }: ParticipantsTableProps) {
  const t = useTranslations("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter participants by name or phone
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
    );
  }, [participants, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1); // Reset to first page upon filtering
  };

  return (
    <Card className="p-5 sm:p-6 text-start flex flex-col gap-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-highlight" />
          <h3 className="text-base font-bold text-token-primary">
            {t("participantsTitle")}
          </h3>
          <Badge variant="neutral" size="sm">
            {filtered.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/admin/export" download className="w-full sm:w-auto">
            <Button size="sm" variant="secondary" className="w-full sm:w-auto gap-1.5 font-bold text-xs">
              <Download className="w-3.5 h-3.5" />
              <span>{t("exportCsvButton")}</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="ps-9 text-sm"
        />
        <Search className="w-4 h-4 text-token-muted absolute start-3 top-3.5 pointer-events-none" />
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-start text-xs sm:text-sm">
          <thead className="bg-bg-surface-raised border-b border-border text-token-muted font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 text-start">{t("tableHeadName")}</th>
              <th className="py-3 px-4 text-start">{t("tableHeadPhone")}</th>
              <th className="py-3 px-4 text-start">{t("tableHeadEmail")}</th>
              <th className="py-3 px-4 text-start">{t("tableHeadLocale")}</th>
              <th className="py-3 px-4 text-start">{t("tableHeadTime")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-bg-surface text-token-primary">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-token-muted text-sm">
                  {t("tableEmpty")}
                </td>
              </tr>
            ) : (
              paginated.map((p) => {
                const date = new Date(p.created_at);
                const formattedTime = date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const formattedDate = date.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <tr key={p.id} className="hover:bg-bg-surface-raised/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-token-primary">
                      {p.full_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-token-secondary" dir="ltr">
                      {formatAlgerianPhoneDisplay(p.phone)}
                    </td>
                    <td className="py-3 px-4 text-token-secondary truncate max-w-[150px]">
                      {p.email || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral" size="sm" className="uppercase font-bold">
                        {p.locale}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-token-muted text-xs whitespace-nowrap">
                      {formattedDate} {formattedTime}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-token-muted font-medium">
            {t("paginationPage", { current: currentPage, total: totalPages })}
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t("paginationPrev")}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 text-xs gap-1"
            >
              <span>{t("paginationNext")}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
