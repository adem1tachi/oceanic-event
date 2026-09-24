"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatAlgerianPhoneDisplay } from "@/lib/phone";
import { Trophy, RefreshCcw, Sparkles, Tv, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface WinnerItem {
  id: string;
  participant_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  locale: string;
  draw_round: number;
  drawn_at: string;
}

export interface RaffleManagerProps {
  initialWinners: WinnerItem[];
  totalParticipants: number;
}

export function RaffleManager({
  initialWinners,
  totalParticipants,
}: RaffleManagerProps) {
  const t = useTranslations("admin");

  // State
  const [winners, setWinners] = useState<WinnerItem[]>(initialWinners);
  const [winnerCount, setWinnerCount] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "warning" | "error">("success");

  // Determine current round
  const maxRound = winners.reduce((max, w) => Math.max(max, w.draw_round), 0);
  const hasWinners = winners.length > 0;
  const remainingEligible = Math.max(0, totalParticipants - winners.length);

  // Trigger draw winners via API
  const handleDraw = async () => {
    if (winnerCount <= 0) return;
    setIsDrawing(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback(data.error || "Failed to draw winners");
        setFeedbackType("error");
        return;
      }

      const newlyDrawn: WinnerItem[] = data.winners || [];

      if (newlyDrawn.length === 0) {
        setFeedback(t("noEligibleLeft"));
        setFeedbackType("warning");
      } else {
        setWinners((prev) => [...prev, ...newlyDrawn]);
        if (newlyDrawn.length < winnerCount) {
          setFeedback(t("fewerEligibleWarning", { count: newlyDrawn.length }));
          setFeedbackType("warning");
        } else {
          setFeedback(`Successfully drawn ${newlyDrawn.length} winner(s)!`);
          setFeedbackType("success");
        }
      }
    } catch (err) {
      console.error("Raffle draw error:", err);
      setFeedback("Failed to connect to draw service");
      setFeedbackType("error");
    } finally {
      setIsDrawing(false);
    }
  };

  // Reset all winners via API
  const handleResetDraw = async () => {
    setIsResetting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setFeedback(data.error || "Failed to reset draw");
        setFeedbackType("error");
        return;
      }

      setWinners([]);
      setIsResetModalOpen(false);
      setFeedback("Raffle winners reset successfully.");
      setFeedbackType("success");
    } catch (err) {
      console.error("Raffle reset error:", err);
      setFeedback("Failed to reset raffle draw");
      setFeedbackType("error");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-start">
      {/* Control Panel Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-token-primary flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>{t("raffleTitle")}</span>
            </h3>
            <p className="text-xs sm:text-sm text-token-secondary mt-1">
              {t("raffleSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/projector">
              <Button size="sm" variant="secondary" className="gap-2 font-bold text-xs">
                <Tv className="w-4 h-4 text-highlight" />
                <span>{t("openProjectorButton")}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 my-4 flex-wrap text-xs">
          <Badge variant="neutral">
            Total Participants: <strong>{totalParticipants}</strong>
          </Badge>
          <Badge variant="neutral">
            Remaining Eligible: <strong>{remainingEligible}</strong>
          </Badge>
          <Badge variant={hasWinners ? "highlight" : "neutral"}>
            Total Winners: <strong>{winners.length}</strong>
          </Badge>
          {hasWinners && (
            <Badge variant="neutral">
              Current Round: <strong>Round {maxRound}</strong>
            </Badge>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-end gap-4 mt-2">
          <div className="w-full sm:w-48">
            <Input
              label={t("numberInputLabel")}
              type="number"
              min={1}
              max={50}
              value={winnerCount}
              onChange={(e) => setWinnerCount(parseInt(e.target.value, 10) || 1)}
              disabled={isDrawing || remainingEligible === 0}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!hasWinners ? (
              <Button
                size="md"
                variant="primary"
                onClick={handleDraw}
                isLoading={isDrawing}
                disabled={remainingEligible === 0}
                className="w-full sm:w-auto font-bold gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("drawButton")}</span>
              </Button>
            ) : (
              <Button
                size="md"
                variant="primary"
                onClick={handleDraw}
                isLoading={isDrawing}
                disabled={remainingEligible === 0}
                className="w-full sm:w-auto font-bold gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("drawAgainButton")}</span>
              </Button>
            )}

            {hasWinners && (
              <Button
                size="md"
                variant="outline"
                onClick={() => setIsResetModalOpen(true)}
                disabled={isDrawing || isResetting}
                className="w-full sm:w-auto text-feedback-error hover:bg-feedback-error-subtle border-border gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>{t("resetButton")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div
            role="status"
            className={`mt-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              feedbackType === "success"
                ? "bg-feedback-success-subtle text-feedback-success border border-feedback-success/30"
                : feedbackType === "warning"
                ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                : "bg-feedback-error-subtle text-feedback-error border border-feedback-error/30"
            }`}
          >
            {feedbackType === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback}</span>
          </div>
        )}
      </Card>

      {/* Winners List by Round */}
      <Card className="p-6">
        <h4 className="text-base font-bold text-token-primary mb-4 flex items-center justify-between">
          <span>Drawn Winners History</span>
          <Badge variant="highlight" size="sm">
            {winners.length} Winner(s)
          </Badge>
        </h4>

        {winners.length === 0 ? (
          <div className="py-12 text-center text-token-muted text-sm">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-token-muted opacity-40" />
            <p>{t("noWinnersYet")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from(new Set(winners.map((w) => w.draw_round)))
              .sort((a, b) => b - a)
              .map((round) => {
                const roundWinners = winners.filter(
                  (w) => w.draw_round === round
                );
                return (
                  <div
                    key={round}
                    className="border border-border rounded-lg p-4 bg-bg-surface-raised/40"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                      <span className="text-xs font-bold text-token-primary uppercase tracking-wider">
                        {t("winnersListTitle", { round })}
                      </span>
                      <span className="text-xs text-token-muted">
                        {roundWinners.length} winner(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {roundWinners.map((winner) => (
                        <div
                          key={winner.id}
                          className="p-3 rounded-md bg-bg-surface border border-border flex flex-col justify-between shadow-xs"
                        >
                          <div>
                            <span className="text-sm font-bold text-token-primary block truncate">
                              {winner.full_name}
                            </span>
                            <span
                              className="text-xs font-mono text-token-secondary block mt-0.5"
                              dir="ltr"
                            >
                              {formatAlgerianPhoneDisplay(winner.phone)}
                            </span>
                          </div>
                          {winner.email && (
                            <span className="text-[11px] text-token-muted truncate mt-1">
                              {winner.email}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={t("resetConfirmTitle")}
        description={t("resetConfirmDesc")}
      >
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsResetModalOpen(false)}
            disabled={isResetting}
          >
            {t("resetCancelButton")}
          </Button>

          <Button
            variant="danger"
            onClick={handleResetDraw}
            isLoading={isResetting}
            disabled={isResetting}
          >
            {t("resetConfirmButton")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
