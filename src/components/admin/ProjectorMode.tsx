"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import {
  Trophy,
  Sparkles,
  ArrowLeft,
  Maximize2,
  Minimize2,
  RefreshCcw,
  Volume2,
  VolumeX,
  Award,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export interface ProjectorParticipant {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  position?: string;
  phone: string;
  email?: string | null;
  desired_topic?: string | null;
}

export interface ProjectorWinner {
  id: string;
  participantId: string;
  name: string;
  phone: string;
  company?: string;
  position?: string;
  drawRound: number;
  drawnAt: string;
}

export interface LeadingTopicInfo {
  slug: string;
  title: string;
  votesCount?: number;
}

export interface ProjectorModeProps {
  initialWinners: ProjectorWinner[];
  allParticipants: ProjectorParticipant[];
  leadingTopic: LeadingTopicInfo;
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

// High-tension Web Audio mechanical clicker, lever pull, and fanfare synthesizer
class ProjectorAudio {
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

  // Realistic mechanical slot machine lever ratchet & clunk sound
  public playLeverPull() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Triple mechanical ratchet click
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(340 - i * 40, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.035);
      }

      // Heavy bottom latch clunk
      const clunkTime = now + 0.16;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(150, clunkTime);
      osc2.frequency.exponentialRampToValueAtTime(45, clunkTime + 0.11);
      gain2.gain.setValueAtTime(0.3, clunkTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, clunkTime + 0.13);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(clunkTime);
      osc2.stop(clunkTime + 0.13);
    } catch {}
  }

  // Wheel peg click with speed-dependent pitch and volume
  public playTick(velocity: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 420 + Math.min(Math.max(velocity, 0) * 16, 520);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.038);

      const vol = velocity < 3 ? 0.35 : Math.min(0.25, 0.09 + velocity * 0.007);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.038);
    } catch {}
  }

  // Celebratory golden fanfare chord (C5, E5, G5, C6)
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

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
      });
    } catch {}
  }
}

export function ProjectorMode({
  initialWinners,
  allParticipants,
  leadingTopic,
}: ProjectorModeProps) {
  const [winners, setWinners] = useState<ProjectorWinner[]>(initialWinners);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLeverPulling, setIsLeverPulling] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentDrawnWinner, setCurrentDrawnWinner] = useState<ProjectorWinner | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  // Wheel animation states
  const [wheelRotation, setWheelRotation] = useState(0);
  const [displayedNames, setDisplayedNames] = useState<string[]>([]);

  const animRef = useRef<number | null>(null);
  const wheelDiskRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelRotationRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);
  const lastPegRef = useRef<number>(-1);
  const audioRef = useRef<ProjectorAudio | null>(null);

  // Audio setup
  useEffect(() => {
    audioRef.current = new ProjectorAudio();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.enabled = soundEnabled;
    }
  }, [soundEnabled]);

  // Fullscreen listeners & auto-enter
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Attempt immediate fullscreen upon mount
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // Auto-enter fullscreen upon first user gesture if browser blocked initial call
    const tryAutoFullscreen = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    window.addEventListener("click", tryAutoFullscreen, { once: true });
    window.addEventListener("keydown", tryAutoFullscreen, { once: true });

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("click", tryAutoFullscreen);
      window.removeEventListener("keydown", tryAutoFullscreen);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Winner participant IDs
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

  // Initialize candidate slots on wheel
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

  // Format phone for public projection (showing first 4 and last 2 digits)
  const formatProjectorPhone = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.length >= 9) {
      const start = clean.slice(0, 4);
      const end = clean.slice(-2);
      return `${start} •• •• ${end}`;
    }
    return phone;
  };

  // Canvas confetti particle animation
  const triggerConfettiAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#F59E0B", // Gold
      "#EF4444", // Red
      "#3B82F6", // Blue
      "#10B981", // Emerald
      "#8B5CF6", // Purple
      "#FBBF24", // Amber
      "#FFFFFF", // White
    ];

    const particleCount = 200;
    const particles: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rotation: number;
      vRotation: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 500,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 120,
        w: Math.random() * 11 + 7,
        h: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: Math.random() * -16 - 5,
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 14,
        opacity: 1,
      });
    }

    const startTime = performance.now();
    const duration = 4800;

    const renderConfetti = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = elapsed > duration - 1200 ? (duration - elapsed) / 1200 : 1;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.vx *= 0.985; // Air resistance
        p.rotation += p.vRotation;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, fade * p.opacity);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      requestAnimationFrame(renderConfetti);
    };

    requestAnimationFrame(renderConfetti);
  };

  // Triggered by pulling the mechanical lever
  const handlePullLever = () => {
    if (isDrawing || isLeverPulling) return;
    if (eligibleParticipants.length === 0) {
      setFeedback({
        message: "تم سحب جميع المشاركين المؤهلين في هذه الجولة.",
        type: "warning",
      });
      return;
    }

    // 1. Physical lever animation & sound
    setIsLeverPulling(true);
    if (audioRef.current) {
      audioRef.current.playLeverPull();
    }

    // Lever springs back after mechanical throw
    setTimeout(() => {
      setIsLeverPulling(false);
    }, 420);

    // 2. Launch high-tension wheel animation
    startWheelSpin();
  };

  const startWheelSpin = () => {
    setIsDrawing(true);
    setFeedback(null);
    setCurrentDrawnWinner(null);
    setShowCelebrationModal(false);

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    // Refresh candidate slots for the new spin
    const freshSlots: string[] = [];
    for (let i = 0; i < WHEEL_SEGMENTS_COUNT; i++) {
      freshSlots.push(candidateNames[i % candidateNames.length] || "—");
    }
    setDisplayedNames(freshSlots);

    // 1. Initial rotational physics
    const initialAngle = wheelRotationRef.current;
    let currentAngle = initialAngle;
    let lastAngle = initialAngle;
    let currentVelocity = 6;
    let velocity = 6;
    const maxVelocity = 24; // ~1440 deg/sec
    const acceleration = 1.0;
    const startSpinTime = performance.now();
    const minFastSpinDuration = 1800; // 1.8s energetic fast spin
    lastPegRef.current = Math.floor(initialAngle / (360 / WHEEL_SEGMENTS_COUNT));

    let phase: "spin" | "decel" = "spin";
    let winnerData: {
      newWinnerObj: ProjectorWinner;
      finalWinnerName: string;
    } | null = null;

    let decelStartAngle = 0;
    let decelTotalDistance = 0;
    let decelStartTime = 0;
    const decelDuration = 5600; // 5.6s dramatic high-tension crawl

    // 2. Request winner from backend
    fetch("/api/admin/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerCount: 1, count: 1 }),
    })
      .then(async (res) => {
        const data = await res.json();
        return { ok: res.ok, data };
      })
      .catch((err) => ({ ok: false, error: err }))
      .then((result: any) => {
        let serverWinner = null;
        if (result?.ok && result?.data?.winners && result.data.winners.length > 0) {
          serverWinner = result.data.winners[0];
        }

        if (!serverWinner) {
          console.error("Backend draw failed or returned no winner:", result);
          setIsDrawing(false);
          setFeedback({
            message: result?.data?.error || "فشل السحب من قاعدة البيانات، يرجى المحاولة مرة أخرى.",
            type: "error",
          });
          if (animRef.current) {
            cancelAnimationFrame(animRef.current);
            animRef.current = null;
          }
          return;
        }

        // Find matching participant in allParticipants
        const matched = allParticipants.find((p) => p.id === serverWinner.participant_id);
        let company = matched?.company || "";
        let position = matched?.position || "";
        let finalWinnerName = serverWinner.full_name || (matched?.first_name && matched?.last_name ? `${matched.first_name} ${matched.last_name}` : matched?.full_name || "Winner");

        if (!company && finalWinnerName.includes(" | ")) {
          const parts = finalWinnerName.split(" | ");
          for (let i = 1; i < parts.length; i++) {
            if (parts[i].startsWith("Org: ")) company = parts[i].replace("Org: ", "").trim();
            else if (parts[i].startsWith("Pos: ")) position = parts[i].replace("Pos: ", "").trim();
          }
        }

        const newWinnerObj: ProjectorWinner = {
          id: serverWinner.id,
          participantId: serverWinner.participant_id,
          name: finalWinnerName.split(" | ")[0].trim(),
          phone: serverWinner.phone || matched?.phone || "",
          company: company || undefined,
          position: position || undefined,
          drawRound: serverWinner.draw_round || winners.length + 1,
          drawnAt: serverWinner.drawn_at || new Date().toISOString(),
        };

        winnerData = { newWinnerObj, finalWinnerName: newWinnerObj.name };
      });

    // 3. Animation loop: 60/120fps hardware vsync
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

          // Target slice centered at 12 o'clock (270°)
          const targetMod = (360 - ((targetSlice * sliceAngle) % 360)) % 360;
          const currentMod = currentAngle % 360;
          const diff = (targetMod - currentMod + 360) % 360;

          // Add 5 full turns (1800°) for intense suspense
          decelTotalDistance = 5 * 360 + diff;
          decelStartAngle = currentAngle;
          decelStartTime = timestamp;
          phase = "decel";
        }
      } else if (phase === "decel") {
        const elapsedDecel = timestamp - decelStartTime;
        const progress = Math.min(elapsedDecel / decelDuration, 1);

        // Agonizing crawl deceleration curve
        const base = 1 - Math.pow(1 - progress, 2.7);

        // Micro-settle oscillation at the very end
        let eased = base;
        if (progress > 0.95) {
          const settleProgress = (progress - 0.95) / 0.05;
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
          // Finished: perfectly stopped at target angle
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
            // Prepend new winner to the top of the list!
            setWinners((prev) => [newWinnerObj, ...prev]);
            setCurrentDrawnWinner(newWinnerObj);
            setShowCelebrationModal(true);
            triggerConfettiAnimation();
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

      // Spring flipper deflection
      const offset = ((currentAngle % sliceAngle) + sliceAngle) % sliceAngle;
      let pointerAngle = 0;
      if (offset >= 0 && offset < 9) {
        pointerAngle = (1 - offset / 9) * 18;
      } else if (offset >= 9 && offset < 16) {
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

  // Reset the draw directly from the stage
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
        setShowCelebrationModal(false);
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

        const allNames = allParticipants.map((p) => {
          if (p.first_name && p.last_name) return `${p.first_name} ${p.last_name}`;
          if (p.full_name) return p.full_name.split(" | ")[0].trim();
          return "Participant";
        });
        const initialSlots: string[] = [];
        for (let i = 0; i < WHEEL_SEGMENTS_COUNT; i++) {
          initialSlots.push(allNames[i % allNames.length] || "—");
        }
        setDisplayedNames(initialSlots);

        setFeedback({ message: "تمت إعادة ضبط السحب وتصفير الفائزين بنجاح.", type: "success" });
      } else {
        setFeedback({ message: "فشلت عملية إعادة الضبط.", type: "error" });
      }
    } catch {
      setFeedback({ message: "تعذر الاتصال بالخادم.", type: "error" });
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden relative"
    >
      {/* Canvas Confetti Overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Background Radial Glow Effects for High-Contrast Stage Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-blue-600/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* TOP HEADER & STAGE TOOLBAR */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-4">
        {/* Left Side: Exit Button & Stage Indicator */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 ltr:rotate-180" />
            <span>العودة للوحة الإدارة</span>
          </Link>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>بث العرض المباشر (Live Stage)</span>
          </div>
        </div>

        {/* Right Side Controls: Sound, Fullscreen, Reset */}
        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            title={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">الصوت مفعل</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">مكتوم</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          {winners.length > 0 && (
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-400 hover:bg-red-900/60 hover:text-red-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط السحب</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-colors cursor-pointer"
            title="تبديل ملء الشاشة"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">إنهاء ملء الشاشة</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">ملء الشاشة</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Feedback Alert */}
      {feedback && (
        <div className="max-w-4xl mx-auto mt-3 px-4 w-full z-40">
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-md ${
              feedback.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border border-emerald-500/40"
                : feedback.type === "warning"
                ? "bg-amber-950/90 text-amber-200 border border-amber-500/40"
                : "bg-red-950/90 text-red-200 border border-red-500/40"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN STAGE CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col justify-between gap-6 z-10">
        
        {/* 1. WINNING TOPIC HERO BANNER (عرض الموضوع الفائز) */}
        <section
          aria-label="Winning Training Topic"
          className="relative rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-slate-900/90 border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.15)] backdrop-blur-md overflow-hidden"
        >
          {/* Subtle Golden Glow Accent */}
          <div className="absolute -top-12 right-1/4 w-72 h-32 bg-amber-500/20 blur-2xl rounded-full pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-black tracking-wider uppercase mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>الموضوع التدريبي الفائز باختيار الجمهور</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                  {leadingTopic.title || "الذكاء الاصطناعي التوليدي والنماذج اللغوية في بيئات العمل"}
                </h1>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  المشاركون المؤهلون
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {eligibleParticipants.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. THE STAGE SPLIT: HALF-WHEEL WITH LEVER (LEFT 8 COLS) & WINNERS BOARD (RIGHT 4 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center my-auto w-full">
          
          {/* LEFT: THE SUSPENSE HALF-WHEEL DOME & MECHANICAL LEVER (8 COLS) */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center">
            
            <div className="flex items-end justify-center gap-4 sm:gap-8 w-full max-w-3xl">
              
              {/* THE HALF-WHEEL DOME CONTAINER (TOP-HALF ONLY) */}
              <div className="relative w-full max-w-[540px] sm:max-w-[620px] lg:max-w-[680px] h-[270px] sm:h-[310px] lg:h-[345px] overflow-hidden flex justify-center items-start pt-3 select-none">
                
                {/* Top Center Spring-Loaded Mechanical Pointer (Flipper) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                  <div
                    ref={pointerRef}
                    className="flex flex-col items-center will-change-transform drop-shadow-xl"
                    style={{ transformOrigin: "top center" }}
                  >
                    {/* Metallic Pivot Hub */}
                    <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-amber-400 shadow-xl flex items-center justify-center -mb-1 z-10">
                      <div className="w-2 h-2 rounded-full bg-amber-300 shadow-xs" />
                    </div>
                    {/* Needle Blade */}
                    <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[32px] border-t-red-600 drop-shadow-2xl" />
                  </div>
                </div>

                {/* Massive Stationary Outer Glowing Frame (Holds full circle, bottom half clipped by container) */}
                <div
                  className={`relative w-[540px] sm:w-[620px] lg:w-[680px] h-[540px] sm:h-[620px] lg:h-[680px] shrink-0 rounded-full border-4 sm:border-8 border-slate-900 ring-4 overflow-hidden isolate transition-all duration-500 ${
                    isDrawing
                      ? "ring-amber-400/80 shadow-[0_0_80px_rgba(245,158,11,0.4)]"
                      : "ring-slate-800 shadow-[0_0_40px_rgba(10,17,36,0.7)]"
                  }`}
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
                      <circle cx="200" cy="200" r="195" fill="#0A1124" stroke="#1e293b" strokeWidth="2" />
                      <g transform="translate(200, 200)">
                        {Array.from({ length: WHEEL_SEGMENTS_COUNT }).map((_, index) => {
                          const sliceAngle = 360 / WHEEL_SEGMENTS_COUNT; // 45°
                          const baseStartAngle = 270 - sliceAngle / 2; // 247.5°
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
                                  fontSize="11"
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
                              <circle cx={px} cy={py + 1.2} r="5" fill="#000000" opacity="0.6" />
                              <circle cx={px} cy={py} r="4.5" fill="#D97706" />
                              <circle cx={px - 0.8} cy={py - 0.8} r="2.8" fill="#FDE68A" />
                              <circle cx={px - 1.2} cy={py - 1.2} r="1.2" fill="#FFFFFF" />
                            </g>
                          );
                        })}
                      </g>

                      {/* Inner Center Hub (sits on the horizon of the half-dome) */}
                      <circle cx="200" cy="200" r="46" fill="#0A1124" stroke="#ffffff" strokeWidth="3" />
                      <circle cx="200" cy="200" r="40" fill="#12223B" />
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
                        fill="#F59E0B"
                        fontSize="8.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="font-sans uppercase tracking-wider"
                      >
                        FORMATECH
                      </text>
                    </svg>
                  </div>
                </div>

                {/* Bottom Stage Cutline Pedestal Glow */}
                <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none border-b-2 border-amber-500/40" />
              </div>

              {/* THE MECHANICAL LEVER (العتلة) - POSITIONED BESIDE THE WHEEL */}
              <div className="flex flex-col items-center justify-end shrink-0 pb-2">
                {/* Pull Guidance Indicator */}
                <div
                  className={`text-center mb-2 transition-opacity duration-300 ${
                    isDrawing ? "opacity-30" : "opacity-100 animate-bounce"
                  }`}
                >
                  <span className="text-[11px] font-black text-amber-400 block tracking-wider uppercase">
                    اسحب العتلة
                  </span>
                  <ChevronDown className="w-5 h-5 text-amber-400 mx-auto -mt-1" />
                </div>

                {/* The Physical Lever Arm Assembly */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="اسحب العتلة لتدوير العجلة"
                  aria-disabled={isDrawing || eligibleParticipants.length === 0}
                  onClick={handlePullLever}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePullLever();
                    }
                  }}
                  className={`group relative flex flex-col items-center select-none cursor-pointer focus:outline-none ${
                    isDrawing || eligibleParticipants.length === 0
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : "cursor-pointer"
                  }`}
                >
                  {/* Lever Arm (Shaft & Grip Knob) that rotates when pulled */}
                  <div
                    className="flex flex-col items-center will-change-transform transition-transform duration-300 ease-out origin-bottom"
                    style={{
                      transform: isLeverPulling
                        ? "rotate(52deg) translateY(24px) scaleY(0.92)"
                        : "rotate(0deg)",
                      transformOrigin: "center 210px",
                    }}
                  >
                    {/* 3D Glossy Grip Knob (Ball) */}
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-950 p-1 shadow-2xl group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] transition-all">
                      {/* Specular Highlight on Knob */}
                      <div className="w-4 h-4 rounded-full bg-white/70 blur-[1px] absolute top-2 right-2.5" />
                      <div className="w-full h-full rounded-full border border-white/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white/90 drop-shadow-md" />
                      </div>
                    </div>

                    {/* Chromed Metallic Shaft */}
                    <div className="w-4 h-40 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-500 rounded-b-md shadow-lg border-x border-slate-400 relative">
                      <div className="absolute inset-y-0 left-1 w-1 bg-white/80" />
                    </div>
                  </div>

                  {/* Heavy Steel Pivot Housing & Base */}
                  <div className="w-16 h-14 -mt-2 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-2 border-slate-600 shadow-2xl flex flex-col items-center justify-center relative z-10">
                    {/* Metallic Pivot Pin */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border border-amber-200 shadow-inner flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-900" />
                    </div>

                    {/* Status Indicator LED */}
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isDrawing
                            ? "bg-red-500 animate-ping"
                            : eligibleParticipants.length === 0
                            ? "bg-slate-500"
                            : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Lever Base Subtitle */}
                <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold tracking-widest uppercase">
                  PULL ARM
                </span>
              </div>

            </div>

          </div>

          {/* RIGHT: WINNERS BOARD (COMPACT & SLEEK 4 COLS) */}
          <div className="lg:col-span-4 h-full flex flex-col justify-start">
            
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-2xl backdrop-blur-md flex flex-col h-[340px] sm:h-[370px]">
              
              {/* Board Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    قائمة الفائزين بالسحب
                  </h2>
                </div>

                <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold font-mono">
                  {winners.length} فائزين
                </div>
              </div>

              {/* Scrollable List Ordered from Top to Bottom (Latest First) */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-right custom-scrollbar">
                {winners.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                    <Trophy className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                    <p className="text-xs font-bold text-slate-400">
                      في انتظار سحب أول فائز...
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      اسحب العتلة لبدء السحب المباشر!
                    </p>
                  </div>
                ) : (
                  winners.map((winner, idx) => {
                    const isLatest = idx === 0;
                    const medalNumber = winners.length - idx;

                    return (
                      <div
                        key={winner.id || idx}
                        className={`p-2.5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                          isLatest
                            ? "bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-800/90 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-in slide-in-from-top-3"
                            : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        {/* Winner Rank Badge and Name */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black font-mono shrink-0 ${
                                idx === 0
                                  ? "bg-amber-400 text-slate-950 shadow-xs"
                                  : idx === 1
                                  ? "bg-slate-300 text-slate-950"
                                  : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {medalNumber}
                            </span>
                            <h3 className="text-sm font-bold text-white tracking-tight truncate">
                              {winner.name}
                            </h3>
                          </div>

                          <span className="font-mono text-[11px] text-amber-300/90 font-bold dir-ltr shrink-0">
                            {formatProjectorPhone(winner.phone)}
                          </span>
                        </div>

                        {/* Extra Details: Company & Time */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span className="truncate max-w-[180px]">
                            {winner.company ? (
                              <strong className="text-slate-300 font-medium">
                                {winner.company} {winner.position ? `• ${winner.position}` : ""}
                              </strong>
                            ) : (
                              "مشارك في الفعالية"
                            )}
                          </span>

                          <span className="font-mono text-[9px] text-slate-500 shrink-0">
                            {new Date(winner.drawnAt).toLocaleTimeString("ar-DZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* 3. CELEBRATION WINNER SPOTLIGHT MODAL */}
      {showCelebrationModal && currentDrawnWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 shadow-[0_0_80px_rgba(245,158,11,0.4)] text-center animate-in zoom-in-95 duration-300">
            {/* Close Modal Button */}
            <button
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Golden Trophy */}
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 p-1 shadow-2xl shadow-amber-500/40 mb-5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black tracking-widest uppercase mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>مبارك للفائز بالسحب!</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              {currentDrawnWinner.name}
            </h2>

            {currentDrawnWinner.company && (
              <p className="text-base text-amber-200/90 font-semibold mb-2">
                {currentDrawnWinner.company} {currentDrawnWinner.position ? `• ${currentDrawnWinner.position}` : ""}
              </p>
            )}

            <p className="font-mono text-sm text-slate-400 mb-6 dir-ltr">
              {formatProjectorPhone(currentDrawnWinner.phone)}
            </p>

            <button
              type="button"
              onClick={() => setShowCelebrationModal(false)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
            >
              متابعة السحب
            </button>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="تأكيد إعادة ضبط السحب"
        description="هل أنت متأكد من رغبتك في تفريغ قائمة الفائزين وإعادة ضبط العجلة من جديد؟"
      >
        <div className="space-y-4 pt-2 text-right">
          <p className="text-xs text-slate-400 leading-relaxed">
            سيتم حذف جميع الفائزين في هذا السحب وإعادتهم إلى الحالة الافتراضية المؤهلة. لا يمكن التراجع عن هذا الإجراء.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
            >
              إلغاء
            </button>

            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetDraw}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 text-xs font-semibold disabled:opacity-50"
            >
              {isResetting ? "جاري إعادة الضبط..." : "تأكيد إعادة الضبط"}
            </button>
          </div>
        </div>
      </Modal>

      {/* FOOTER BRANDING */}
      <footer className="px-6 py-3 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-600">
        OCEANIC x FORMATECH 2026 • المعرض الدولي للتكوين والتكنولوجيات
      </footer>
    </div>
  );
}
