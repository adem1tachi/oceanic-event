"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import {
  Trophy,
  Sparkles,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Users,
  Volume2,
  VolumeX,
  Tv,
} from "lucide-react";
import { Modal } from "../ui/Modal";

export interface WinnerSummary {
  id: string;
  participantId: string;
  name: string;
  phone?: string;
  drawnAt: string;
}

interface AdminRaffleTabProps {
  initialWinners: any[];
  allParticipants: any[];
  onWinnerDrawn?: (newWinner: WinnerSummary) => void;
  onResetComplete?: () => void;
}

const WHEEL_SEGMENTS_COUNT = 8;
const SLICE_COLORS = [
  "#0A1124",
  "#0E3B4F",
  "#12223B",
  "#B5500C",
  "#0A1124",
  "#CD6E10",
  "#12223B",
  "#0E3B4F",
];

// High-tension Web Audio mechanical clicker & fanfare synthesizer (zero external assets, 0ms lag)
class WheelAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  // Crisp mechanical tactile click whose pitch and timbre scale dynamically with wheel rotational speed
  public playTick(velocity: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pitch shifts: rapid bright click at speed, heavy tactile thunk when creeping
      const baseFreq = 420 + Math.min(Math.max(velocity, 0) * 16, 500);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.038);

      // Volume is punchier when crawling to maximize suspense and room silence
      const vol = velocity < 3 ? 0.32 : Math.min(0.25, 0.09 + velocity * 0.007);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.038);
    } catch {}
  }

  // Celebratory golden fanfare chord (C5, E5, G5, C6) with natural resonance
  public playFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.75);
      });
    } catch {}
  }
}

export function AdminRaffleTab({
  initialWinners,
  allParticipants,
  onWinnerDrawn,
  onResetComplete,
}: AdminRaffleTabProps) {
  const [winners, setWinners] = useState<WinnerSummary[]>(() => {
    return initialWinners.map((w: any) => ({
      id: w.id,
      participantId: w.participant_id || w.participantId,
      name: w.full_name || w.name || "Participant",
      phone: w.phone || "",
      drawnAt: w.drawn_at || new Date().toISOString(),
    }));
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [currentDrawnWinner, setCurrentDrawnWinner] = useState<WinnerSummary | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Wheel animation states
  const [wheelRotation, setWheelRotation] = useState(0);
  const [displayedNames, setDisplayedNames] = useState<string[]>([]);

  const animRef = useRef<number | null>(null);
  const wheelDiskRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<HTMLDivElement | null>(null);
  const wheelRotationRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);
  const lastPegRef = useRef<number>(-1);
  const audioRef = useRef<WheelAudio | null>(null);

  useEffect(() => {
    audioRef.current = new WheelAudio();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.enabled = soundEnabled;
    }
  }, [soundEnabled]);

  const winnerParticipantIds = useMemo(
    () => new Set(winners.map((w) => w.participantId)),
    [winners]
  );

  const eligibleParticipants = useMemo(() => {
    return allParticipants.filter((p) => !winnerParticipantIds.has(p.id));
  }, [allParticipants, winnerParticipantIds]);

  const candidateNames = useMemo(() => {
    return eligibleParticipants.map((p) => {
      if (p.first_name && p.last_name) return `${p.first_name} ${p.last_name}`;
      if (p.full_name) {
        return p.full_name.split(" | ")[0].trim();
      }
      return "Participant";
    });
  }, [eligibleParticipants]);

  // Only initialize candidate slots once or after a reset - NEVER overwrite when a winner is drawn!
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (candidateNames.length === 0) {
      setDisplayedNames(Array(WHEEL_SEGMENTS_COUNT).fill("—"));
      return;
    }

    const initialSlots: string[] = [];
    for (let i = 0; i < WHEEL_SEGMENTS_COUNT; i++) {
      initialSlots.push(candidateNames[i % candidateNames.length]);
    }
    setDisplayedNames(initialSlots);
    hasInitializedRef.current = true;
  }, [candidateNames]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, []);

  const handleDrawOne = () => {
    if (eligibleParticipants.length === 0) {
      setFeedback({
        message: "All eligible participants have been drawn.",
        type: "warning",
      });
      return;
    }

    if (isDrawing) return;

    setIsDrawing(true);
    setFeedback(null);
    setCurrentDrawnWinner(null);

    // Cancel any ongoing animation frame
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    // Refresh candidate slots for the new spin so previous winners are replaced by eligible candidates
    const freshSlots: string[] = [];
    for (let i = 0; i < WHEEL_SEGMENTS_COUNT; i++) {
      freshSlots.push(candidateNames[i % candidateNames.length] || "—");
    }
    setDisplayedNames(freshSlots);

    // 1. START SPINNING IMMEDIATELY (0ms delay!)
    const initialAngle = wheelRotationRef.current;
    let currentAngle = initialAngle;
    let lastAngle = initialAngle;
    let currentVelocity = 6;
    let velocity = 6; // Initial rotational impulse
    const maxVelocity = 24; // ~1440 deg/sec at 60fps for blazing exciting start
    const acceleration = 1.0;
    const startSpinTime = performance.now();
    const minFastSpinDuration = 1800; // Exciting fast spin for at least 1.8s
    lastPegRef.current = Math.floor(initialAngle / (360 / WHEEL_SEGMENTS_COUNT));

    let phase: "spin" | "decel" = "spin";
    let winnerData: {
      newWinnerObj: WinnerSummary;
      finalWinnerName: string;
    } | null = null;

    let decelStartAngle = 0;
    let decelTotalDistance = 0;
    let decelStartTime = 0;
    const decelDuration = 5600; // 5.6s dramatic high-tension deceleration curve

    // 2. Fetch winner concurrently in the background without blocking the spin
    const fallbackIdx = Math.floor(Math.random() * eligibleParticipants.length);
    const fallbackParticipant = eligibleParticipants[fallbackIdx];
    const fallbackName = candidateNames[fallbackIdx] || "Participant";

    fetch("/api/admin/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerCount: 1, count: 1 }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data) => {
        let serverWinner = null;
        if (data && data.winners && data.winners.length > 0) {
          serverWinner = data.winners[0];
        }

        const finalWinnerName = serverWinner?.full_name || fallbackName;
        const finalWinnerId = serverWinner?.participant_id || fallbackParticipant.id;
        const finalWinnerPhone = serverWinner?.phone || fallbackParticipant.phone;
        const finalDrawnAt = serverWinner?.drawn_at || new Date().toISOString();

        const newWinnerObj: WinnerSummary = {
          id: serverWinner?.id || Math.random().toString(),
          participantId: finalWinnerId,
          name: finalWinnerName,
          phone: finalWinnerPhone,
          drawnAt: finalDrawnAt,
        };

        winnerData = { newWinnerObj, finalWinnerName };
      });

    // 3. Animation loop: 60/120fps hardware vsync with tension curve, sound, and pointer deflection
    const step = (timestamp: number) => {
      const sliceAngle = 360 / WHEEL_SEGMENTS_COUNT; // 45°

      if (phase === "spin") {
        if (velocity < maxVelocity) {
          velocity = Math.min(velocity + acceleration, maxVelocity);
        }
        currentAngle += velocity;
        currentVelocity = velocity;

        if (wheelDiskRef.current) {
          wheelDiskRef.current.style.transform = `rotate(${currentAngle}deg)`;
        }

        const elapsed = timestamp - startSpinTime;
        // When server has responded and minimum fast-spin time has passed, transition to deceleration
        if (winnerData && elapsed >= minFastSpinDuration) {
          const { finalWinnerName } = winnerData;

          // Determine target slice for the winner
          let targetSlice = freshSlots.indexOf(finalWinnerName);
          if (targetSlice === -1) {
            targetSlice = Math.floor(Math.random() * WHEEL_SEGMENTS_COUNT);
            setDisplayedNames((prev) => {
              const next = [...prev];
              next[targetSlice] = finalWinnerName;
              return next;
            });
          }

          // Calculate rotation so targetSlice lands at 12 o'clock (270°)
          const targetMod = (360 - ((targetSlice * sliceAngle) % 360)) % 360;
          const currentMod = currentAngle % 360;
          const diff = (targetMod - currentMod + 360) % 360;

          // Add 5 full turns (1800°) for dramatic, suspenseful stop
          decelTotalDistance = 5 * 360 + diff;
          decelStartAngle = currentAngle;
          decelStartTime = timestamp;
          phase = "decel";
        }
      } else if (phase === "decel") {
        const elapsedDecel = timestamp - decelStartTime;
        const progress = Math.min(elapsedDecel / decelDuration, 1);

        // High-tension custom curve:
        // Power 2.7 gives extended suspenseful motion with an agonizing late-stage crawl
        const base = 1 - Math.pow(1 - progress, 2.7);

        // Micro-settling oscillation at the very end (progress from 0.95 to 1.0)
        let eased = base;
        if (progress > 0.95) {
          const settleProgress = (progress - 0.95) / 0.05; // 0 -> 1
          const decay = Math.exp(-settleProgress * 4);
          const wave = Math.sin(settleProgress * Math.PI);
          eased = base + (wave * decay * 1.8) / decelTotalDistance;
        }

        const nextAngle = decelStartAngle + decelTotalDistance * Math.min(eased, 1);
        currentVelocity = Math.abs(nextAngle - lastAngle);
        currentAngle = nextAngle;
        lastAngle = nextAngle;

        if (wheelDiskRef.current) {
          wheelDiskRef.current.style.transform = `rotate(${currentAngle}deg)`;
        }

        if (progress >= 1) {
          // Finished: perfectly stopped at target angle!
          const finalAngle = decelStartAngle + decelTotalDistance;
          if (wheelDiskRef.current) {
            wheelDiskRef.current.style.transform = `rotate(${finalAngle}deg)`;
          }
          if (pointerRef.current) {
            pointerRef.current.style.transform = "rotate(0deg)";
          }

          wheelRotationRef.current = finalAngle;
          setWheelRotation(finalAngle);

          if (winnerData) {
            const { newWinnerObj } = winnerData;
            setWinners((prev) => [newWinnerObj, ...prev]);
            setCurrentDrawnWinner(newWinnerObj);
            if (onWinnerDrawn) onWinnerDrawn(newWinnerObj);
          }

          if (audioRef.current) {
            audioRef.current.playFanfare();
          }

          setIsDrawing(false);
          animRef.current = null;
          return;
        }
      }

      // Check peg crossing and trigger mechanical tick
      const currentPeg = Math.floor(currentAngle / sliceAngle);
      if (currentPeg !== lastPegRef.current) {
        lastPegRef.current = currentPeg;
        if (audioRef.current) {
          audioRef.current.playTick(currentVelocity);
        }
      }

      // Dynamic mechanical flipper pointer deflection
      const offset = ((currentAngle % sliceAngle) + sliceAngle) % sliceAngle;
      let pointerAngle = 0;
      if (offset >= 0 && offset < 9) {
        // Peg pushing the flipper needle forward
        pointerAngle = (1 - offset / 9) * 18;
      } else if (offset >= 9 && offset < 16) {
        // Elastic snapback
        const snap = (offset - 9) / 7;
        pointerAngle = -7 * Math.sin(snap * Math.PI);
      }
      if (pointerRef.current) {
        pointerRef.current.style.transform = `rotate(${pointerAngle}deg)`;
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
  };

  const handleResetDraw = async () => {
    setIsResetting(true);
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        setWinners([]);
        setCurrentDrawnWinner(null);
        setWheelRotation(0);
        wheelRotationRef.current = 0;
        if (wheelDiskRef.current) {
          wheelDiskRef.current.style.transform = "rotate(0deg)";
        }
        if (pointerRef.current) {
          pointerRef.current.style.transform = "rotate(0deg)";
        }
        lastPegRef.current = -1;
        hasInitializedRef.current = false;
        setFeedback({ message: "Winners list cleared and draw reset successfully.", type: "success" });
        if (onResetComplete) onResetComplete();
      } else {
        setFeedback({ message: "Failed to reset draw.", type: "error" });
      }
    } catch {
      setFeedback({ message: "Server connection failed.", type: "error" });
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Actions Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Raffle Draw
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Projector Mode Button (Direct link for big screen presentation) */}
          <Link
            href="/admin/projector"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-2xs"
            title="Open Projector Mode"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Projector Mode</span>
          </Link>

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors shadow-2xs"
            title={soundEnabled ? "Mute Wheel Sounds" : "Enable Wheel Sounds"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          {winners.length > 0 && (
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors shadow-2xs"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : feedback.type === "warning"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: THE DRAW STAGE & HALF-WHEEL */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between min-h-[500px] relative overflow-hidden">
          {/* Top Stage Bar */}
          <div className="flex items-center justify-between gap-4 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Eligible Participants:{" "}
                <strong className="text-slate-900 font-mono">
                  {eligibleParticipants.length}
                </strong>
              </span>
            </div>

            <span className="text-xs font-medium text-slate-500 font-mono">
              Single Winner Draw
            </span>
          </div>

          {/* Center: Big Draw Trigger Button & Winner Banner */}
          <div className="my-auto py-4 text-center z-10 flex flex-col items-center">
            {currentDrawnWinner && !isDrawing ? (
              <div className="mb-5 p-5 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/70 border-2 border-amber-400 text-slate-900 max-w-sm w-full shadow-lg animate-in zoom-in-95 duration-300">
                <span className="text-[11px] font-black text-amber-800 tracking-wider uppercase block mb-1">
                  🎉 Winner Drawn!
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {currentDrawnWinner.name}
                </h2>
              </div>
            ) : null}

            {/* DRAW 1 RANDOM WINNER BUTTON */}
            <button
              type="button"
              disabled={isDrawing || eligibleParticipants.length === 0}
              onClick={handleDrawOne}
              className="px-6 py-3 rounded-xl bg-brand-navy-dark hover:bg-brand-navy-slate active:scale-95 text-white font-bold text-sm sm:text-base transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer border border-brand-navy-petrol/40"
            >
              <Sparkles className={`w-4 h-4 text-brand-orange-gold ${isDrawing ? "animate-spin" : ""}`} />
              <span>
                {isDrawing ? "Drawing..." : "Draw Random Winner"}
              </span>
            </button>
          </div>

          {/* THE HALF-WHEEL (TOP-HALF DOME) */}
          <div className="relative w-full max-w-md mx-auto h-[215px] sm:h-[245px] overflow-hidden flex justify-center items-start pt-3 select-none">
            {/* Top Center Spring-Loaded Mechanical Pointer (Flipper) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
              <div
                ref={pointerRef}
                className="flex flex-col items-center will-change-transform drop-shadow-md"
                style={{ transformOrigin: "top center" }}
              >
                {/* Mechanical Pivot Pin */}
                <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-amber-400 shadow-md flex items-center justify-center -mb-1 z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
                </div>
                {/* Flexible Needle / Flipper Blade */}
                <div className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[26px] border-t-red-600 drop-shadow-md" />
              </div>
            </div>

            {/* Stationary Circular Outer Frame (holds symmetrical shadow and stationary white border) */}
            <div
              className={`relative w-[340px] sm:w-[390px] h-[340px] sm:h-[390px] shrink-0 rounded-full border-4 sm:border-8 border-white ring-2 overflow-hidden isolate transition-all duration-300 ${
                isDrawing
                  ? "ring-amber-400/80"
                  : "ring-slate-200/80"
              }`}
              style={{
                boxShadow: isDrawing
                  ? "0 0 35px 6px rgba(245, 158, 11, 0.25), 0 0 10px 2px rgba(10, 17, 36, 0.15)"
                  : "0 0 20px 2px rgba(10, 17, 36, 0.12), 0 0 6px 1px rgba(10, 17, 36, 0.06)",
              }}
            >
              {/* Rotating Graphic Wheel Disk */}
              <div
                ref={wheelDiskRef}
                className="w-full h-full rounded-full will-change-transform"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full block">
                  <circle cx="200" cy="200" r="195" fill="#fafbfc" stroke="#e2e8f0" strokeWidth="2" />
                  <g transform="translate(200, 200)">
                    {Array.from({ length: WHEEL_SEGMENTS_COUNT }).map((_, index) => {
                      const sliceAngle = 360 / WHEEL_SEGMENTS_COUNT; // 45°
                      const baseStartAngle = 270 - sliceAngle / 2; // 247.5° so slice 0 centers at 270° (12 o'clock)
                      const startAngleDeg = baseStartAngle + index * sliceAngle;
                      const endAngleDeg = startAngleDeg + sliceAngle;
                      const midAngleDeg = startAngleDeg + sliceAngle / 2;

                      const startAngleRad = (startAngleDeg * Math.PI) / 180;
                      const endAngleRad = (endAngleDeg * Math.PI) / 180;
                      const x1 = 195 * Math.cos(startAngleRad);
                      const y1 = 195 * Math.sin(startAngleRad);
                      const x2 = 195 * Math.cos(endAngleRad);
                      const y2 = 195 * Math.sin(endAngleRad);

                      const slotName = displayedNames[index] || "—";
                      const color = SLICE_COLORS[index % SLICE_COLORS.length];

                      return (
                        <g key={index}>
                          <path
                            d={`M 0 0 L ${x1} ${y1} A 195 195 0 0 1 ${x2} ${y2} Z`}
                            fill={color}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <g transform={`rotate(${midAngleDeg}) translate(115, 0)`}>
                            <text
                              x="0"
                              y="0"
                              fill="#ffffff"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="central"
                              className="font-sans select-none tracking-tight"
                            >
                              {slotName.length > 15 ? slotName.slice(0, 14) + "…" : slotName}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* 3D Golden Mechanical Pegs on Rim between each slice */}
                    {Array.from({ length: WHEEL_SEGMENTS_COUNT }).map((_, index) => {
                      const sliceAngle = 360 / WHEEL_SEGMENTS_COUNT; // 45°
                      const baseStartAngle = 270 - sliceAngle / 2; // 247.5°
                      const pegAngleDeg = baseStartAngle + index * sliceAngle;
                      const pegRad = (pegAngleDeg * Math.PI) / 180;
                      const px = 186 * Math.cos(pegRad);
                      const py = 186 * Math.sin(pegRad);

                      return (
                        <g key={`peg-${index}`}>
                          <circle cx={px} cy={py + 1} r="4.5" fill="#0A1124" opacity="0.5" />
                          <circle cx={px} cy={py} r="4" fill="#D97706" />
                          <circle cx={px - 0.8} cy={py - 0.8} r="2.5" fill="#FDE68A" />
                          <circle cx={px - 1.2} cy={py - 1.2} r="1" fill="#FFFFFF" />
                        </g>
                      );
                    })}
                  </g>

                  {/* Inner Center Hub */}
                  <circle cx="200" cy="200" r="44" fill="#0A1124" stroke="#ffffff" strokeWidth="3" />
                  <circle cx="200" cy="200" r="38" fill="#12223B" />
                  <text
                    x="200"
                    y="198"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                    className="font-mono tracking-widest uppercase"
                  >
                    OCEANIC
                  </text>
                  <text
                    x="200"
                    y="212"
                    fill="#B5500C"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    RAFFLE
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONCISE WINNERS DISPLAY */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Winners
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700">
                {winners.length}
              </span>
            </div>

            {/* Brief Display of Winners by Name Only */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {winners.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <p className="text-xs">No winners drawn yet.</p>
                </div>
              ) : (
                winners.map((winner, idx) => (
                  <div
                    key={winner.id || idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                        {winners.length - idx}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {winner.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(winner.drawnAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center font-mono">
            Formatech 2026 • OCEANIC
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Raffle Draw"
        description="Are you sure you want to clear all winners and restart the raffle draw?"
      >
        <div className="flex items-center justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(false)}
            disabled={isResetting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResetDraw}
            disabled={isResetting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
          >
            {isResetting ? "Clearing..." : "Clear Winners"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
