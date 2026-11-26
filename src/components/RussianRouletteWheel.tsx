import { useEffect, useRef } from 'react';
import {
  easeOutQuart,
  getInnerMedallionLocalAngle,
  getOuterMedallionAngle,
  INNER_RING_COUNT,
  OUTER_RING_COUNT,
  ROULETTE_SPIN_DURATION_MS,
  ROULETTE_STEP_DEG,
} from '../utils/russianRouletteEngine';

export interface SpinAnimationPlan {
  id: number;
  startPointerDeg: number;
  targetPointerDeg: number;
  startInnerRingDeg: number;
  targetInnerRingDeg: number;
  secondaryPointerDeg: number | null;
  pair: [number, number];
}

interface RussianRouletteWheelProps {
  isSpinning: boolean;
  canSpin: boolean;
  spinPlan: SpinAnimationPlan | null;
  pointerDeg: number;
  innerRingDeg: number;
  secondaryPointerDeg: number | null;
  drawnPair: [number, number] | null;
  selectedNumber: number | null;
  chosenCardNumbers: number[];
  soundEnabled: boolean;
  onSpinRequest: () => void;
  onSpinComplete: (plan: SpinAnimationPlan) => void;
}

const CX = 270;
const CY = 270;
const OUTER_RING_R = 212;
const INNER_RING_R = 148;
const OUTER_BALL_R = 14.8;
const INNER_BALL_R = 12.6;

interface MedallionSlot {
  cardNumber: number;
  angleDeg: number;
  x: number;
  y: number;
  isRed: boolean;
}

const OUTER_SLOTS: MedallionSlot[] = Array.from(
  { length: OUTER_RING_COUNT },
  (_, idx) => {
    const cardNumber = idx + 1;
    const angleDeg = getOuterMedallionAngle(cardNumber);
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      cardNumber,
      angleDeg,
      x: CX + OUTER_RING_R * Math.cos(rad),
      y: CY + OUTER_RING_R * Math.sin(rad),
      isRed: cardNumber % 2 === 1,
    };
  }
);

const INNER_SLOTS: MedallionSlot[] = Array.from(
  { length: INNER_RING_COUNT },
  (_, idx) => {
    const cardNumber = OUTER_RING_COUNT + idx + 1;
    const angleDeg = getInnerMedallionLocalAngle(cardNumber);
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      cardNumber,
      angleDeg,
      x: CX + INNER_RING_R * Math.cos(rad),
      y: CY + INNER_RING_R * Math.sin(rad),
      isRed: cardNumber % 2 === 1,
    };
  }
);

function playRouletteTick(audioCtxRef: { current: AudioContext | null }) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.028);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Ignore audio context restrictions quietly
  }
}

export function playRouletteChime(type: 'stop' | 'reveal') {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const freqs = type === 'stop' ? [523.25, 659.25, 783.99] : [587.33, 880, 1174.66];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 750);
  } catch {
    // Ignore audio errors quietly
  }
}

export function RussianRouletteWheel({
  isSpinning,
  canSpin,
  spinPlan,
  pointerDeg,
  innerRingDeg,
  secondaryPointerDeg,
  drawnPair,
  selectedNumber,
  chosenCardNumbers,
  soundEnabled,
  onSpinRequest,
  onSpinComplete,
}: RussianRouletteWheelProps) {
  const pointerGroupRef = useRef<SVGGElement | null>(null);
  const innerRingGroupRef = useRef<SVGGElement | null>(null);
  const innerLabelRefs = useRef<Array<SVGGElement | null>>([]);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const timerLabelRef = useRef<HTMLSpanElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const onSpinCompleteRef = useRef(onSpinComplete);
  onSpinCompleteRef.current = onSpinComplete;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Apply static resting rotation whenever idle/settled
  const applyTransforms = (ptr: number, ring: number) => {
    if (pointerGroupRef.current) {
      pointerGroupRef.current.setAttribute('transform', `rotate(${ptr} ${CX} ${CY})`);
    }
    if (innerRingGroupRef.current) {
      innerRingGroupRef.current.setAttribute('transform', `rotate(${ring} ${CX} ${CY})`);
    }
    for (let i = 0; i < INNER_SLOTS.length; i++) {
      const el = innerLabelRefs.current[i];
      if (el) {
        const slot = INNER_SLOTS[i];
        el.setAttribute('transform', `rotate(${-ring} ${slot.x} ${slot.y})`);
      }
    }
  };

  useEffect(() => {
    if (!isSpinning) {
      applyTransforms(pointerDeg, innerRingDeg);
    }
  }, [isSpinning, pointerDeg, innerRingDeg]);

  // Run exact 8-second smooth quartic ease-out animation via direct SVG DOM updates
  useEffect(() => {
    if (!isSpinning || !spinPlan) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      applyTransforms(spinPlan.targetPointerDeg, spinPlan.targetInnerRingDeg);
      if (progressBarRef.current) progressBarRef.current.style.width = '100%';
      if (timerLabelRef.current) timerLabelRef.current.textContent = '8,0s / 8,0s';
      onSpinCompleteRef.current(spinPlan);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();
    let lastNotchIndex = Math.floor(spinPlan.startPointerDeg / ROULETTE_STEP_DEG);
    let lastTickTimestamp = 0;

    const step = (now: number) => {
      const elapsed = Math.min(ROULETTE_SPIN_DURATION_MS, now - startTime);
      const t = elapsed / ROULETTE_SPIN_DURATION_MS;
      const eased = easeOutQuart(t);

      const currentPtr =
        spinPlan.startPointerDeg +
        (spinPlan.targetPointerDeg - spinPlan.startPointerDeg) * eased;
      const currentRing =
        spinPlan.startInnerRingDeg +
        (spinPlan.targetInnerRingDeg - spinPlan.startInnerRingDeg) * eased;

      applyTransforms(currentPtr, currentRing);

      // Update live 8-second countdown bar & timer without triggering 60Hz React renders
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(t * 100).toFixed(1)}%`;
      }
      if (timerLabelRef.current) {
        const secs = (elapsed / 1000).toFixed(1).replace('.', ',');
        timerLabelRef.current.textContent = `${secs}s / 8,0s`;
      }

      // Mechanical click audio whenever needle passes a medallion slot (rate-limited at high speed)
      const notchIndex = Math.floor(currentPtr / ROULETTE_STEP_DEG);
      if (notchIndex !== lastNotchIndex) {
        lastNotchIndex = notchIndex;
        if (soundEnabledRef.current && now - lastTickTimestamp > 45) {
          lastTickTimestamp = now;
          playRouletteTick(audioCtxRef);
        }
      }

      if (elapsed < ROULETTE_SPIN_DURATION_MS) {
        rafId = window.requestAnimationFrame(step);
      } else {
        applyTransforms(spinPlan.targetPointerDeg, spinPlan.targetInnerRingDeg);
        if (progressBarRef.current) progressBarRef.current.style.width = '100%';
        if (timerLabelRef.current) timerLabelRef.current.textContent = '8,0s / 8,0s';
        onSpinCompleteRef.current(spinPlan);
      }
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isSpinning, spinPlan]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const chosenSet = new Set(chosenCardNumbers);

  const isHighlighted = (cardNum: number) =>
    !isSpinning && drawnPair !== null && drawnPair.includes(cardNum);

  const isChosen = (cardNum: number) =>
    !isSpinning && selectedNumber === cardNum;

  const isMarkedWhite = (cardNum: number) => chosenSet.has(cardNum);

  return (
    <div
      data-testid="russian-roulette-wheel"
      data-spinning={isSpinning ? 'true' : 'false'}
      className="rounded-2xl bg-[#0D0F14] border border-amber-500/30 p-4 sm:p-6 shadow-xl flex flex-col items-center"
    >
      {/* Top Wheel Status Bar */}
      <div className="w-full flex items-center justify-between text-xs text-amber-200/90 mb-3">
        <span className="font-semibold tracking-wide">
          Roleta da Sorte · Cartões 01 a 60
        </span>
        <span
          ref={timerLabelRef}
          data-testid="roleta-timer-readout"
          className="font-mono tabular-nums text-amber-300 font-semibold"
        >
          {isSpinning ? '0,0s / 8,0s' : drawnPair ? '8,0s / 8,0s' : 'Pronta · 8,0s'}
        </span>
      </div>

      {/* Main Concentric Gold & Obsidian Roulette Wheel SVG */}
      <div className="relative w-full max-w-[470px] aspect-square flex items-center justify-center select-none">
        <svg
          viewBox="0 0 540 540"
          className="w-full h-full drop-shadow-[0_14px_32px_rgba(0,0,0,0.65)]"
          role="img"
          aria-label="Roleta da Sorte de dois anéis com cartões numerados de 1 a 60"
        >
          <defs>
            {/* Metallic Brushed Gold Outer Rim Gradient */}
            <linearGradient id="rrGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B8862D" />
              <stop offset="22%" stopColor="#F5D782" />
              <stop offset="48%" stopColor="#A6741D" />
              <stop offset="72%" stopColor="#FBE39B" />
              <stop offset="100%" stopColor="#8A5D14" />
            </linearGradient>

            {/* Dark Obsidian Wheel Face */}
            <radialGradient id="rrWheelFace" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#161C26" />
              <stop offset="55%" stopColor="#0E1219" />
              <stop offset="100%" stopColor="#07090D" />
            </radialGradient>

            {/* Glossy Crimson Red Medallion */}
            <radialGradient id="rrRedBall" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="55%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#5C0E0E" />
            </radialGradient>

            {/* Glossy Charcoal Black Medallion */}
            <radialGradient id="rrBlackBall" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="55%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#090D16" />
            </radialGradient>

            {/* Glossy Pearl White Medallion (Already Chosen Number) */}
            <radialGradient id="rrWhiteBall" cx="35%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="68%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </radialGradient>

            {/* Needle Metallic Gold Gradient */}
            <linearGradient id="rrNeedleGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="50%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Radiant Halo Glow Filter */}
            <filter id="rrGoldGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Thick Gold Frame */}
          <circle
            cx={CX}
            cy={CY}
            r="256"
            fill="url(#rrWheelFace)"
            stroke="url(#rrGoldRim)"
            strokeWidth="16"
          />
          {/* Inner thin gold accent ring */}
          <circle
            cx={CX}
            cy={CY}
            r="242"
            fill="none"
            stroke="#D4A446"
            strokeWidth="1.2"
            opacity="0.7"
          />

          {/* Subtle Radial Spokes (12 classic divisions) */}
          {Array.from({ length: 12 }, (_, i) => {
            const rad = ((i * 30 - 90) * Math.PI) / 180;
            const x1 = CX + 56 * Math.cos(rad);
            const y1 = CY + 56 * Math.sin(rad);
            const x2 = CX + 240 * Math.cos(rad);
            const y2 = CY + 240 * Math.sin(rad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#D4A446"
                strokeWidth="0.7"
                opacity="0.14"
              />
            );
          })}

          {/* Gold Rim Cardinal & Half-Cardinal Tick Marks */}
          {Array.from({ length: 12 }, (_, i) => {
            const rad = ((i * 30 - 90) * Math.PI) / 180;
            const x1 = CX + 232 * Math.cos(rad);
            const y1 = CY + 232 * Math.sin(rad);
            const x2 = CX + 240 * Math.cos(rad);
            const y2 = CY + 240 * Math.sin(rad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#F5D782"
                strokeWidth={i % 3 === 0 ? '2' : '1.1'}
                opacity={i % 3 === 0 ? '0.85' : '0.45'}
              />
            );
          })}

          {/* Subtle Concentric Track Rings */}
          <circle
            cx={CX}
            cy={CY}
            r="182"
            fill="none"
            stroke="#D4A446"
            strokeWidth="0.9"
            opacity="0.28"
          />
          <circle
            cx={CX}
            cy={CY}
            r="116"
            fill="none"
            stroke="#D4A446"
            strokeWidth="0.9"
            opacity="0.28"
          />

          {/* Optional Secondary Pointer (only when same-ring fallback occurs after 30+ non-repeating draws) */}
          {!isSpinning && secondaryPointerDeg !== null && (
            <g transform={`rotate(${secondaryPointerDeg} ${CX} ${CY})`}>
              <polygon
                points={`${CX - 4},${CY - 44} ${CX + 4},${CY - 44} ${CX + 1},${CY - 216} ${CX - 1},${CY - 216}`}
                fill="#F59E0B"
                opacity="0.85"
              />
            </g>
          )}

          {/* Primary Golden & Crimson Pointer Arm (rendered beneath medallions so numbers stay 100% crisp) */}
          <g
            ref={pointerGroupRef}
            transform={`rotate(${pointerDeg} ${CX} ${CY})`}
          >
            {/* Counterweight stub opposite the needle (matches reference) */}
            <rect
              x={CX - 5}
              y={CY + 44}
              width="10"
              height="18"
              rx="2"
              fill="url(#rrNeedleGold)"
              stroke="#78350F"
              strokeWidth="0.8"
            />
            <circle cx={CX} cy={CY + 52} r="4.5" fill="#D97706" stroke="#FEF08A" strokeWidth="1" />

            {/* Tapered Golden Outer Shaft */}
            <polygon
              points={`${CX - 6},${CY - 42} ${CX + 6},${CY - 42} ${CX + 1.8},${CY - 228} ${CX - 1.8},${CY - 228}`}
              fill="url(#rrNeedleGold)"
              filter="url(#rrGoldGlow)"
            />
            {/* Crimson Center Line along Pointer */}
            <polygon
              points={`${CX - 2.4},${CY - 45} ${CX + 2.4},${CY - 45} ${CX + 0.8},${CY - 224} ${CX - 0.8},${CY - 224}`}
              fill="#DC2626"
            />
            {/* Reticle Ring framing Inner Ring Track */}
            <circle
              cx={CX}
              cy={CY - INNER_RING_R}
              r={INNER_BALL_R + 4.8}
              fill="none"
              stroke="#FDE68A"
              strokeWidth="2.2"
              opacity={isSpinning ? '0.55' : '0.95'}
              filter="url(#rrGoldGlow)"
            />
            {/* Radiant Tip Ring framing Outer Ring Track */}
            <circle
              cx={CX}
              cy={CY - OUTER_RING_R}
              r={OUTER_BALL_R + 4.8}
              fill="none"
              stroke="#FEF08A"
              strokeWidth="2.6"
              opacity={isSpinning ? '0.65' : '1'}
              filter="url(#rrGoldGlow)"
            />
          </g>

          {/* Outer Ring Medallions (Cards 1 to 30, stationary) */}
          <g>
            {OUTER_SLOTS.map((slot) => {
              const highlighted = isHighlighted(slot.cardNumber);
              const chosen = isChosen(slot.cardNumber);
              const markedWhite = isMarkedWhite(slot.cardNumber);
              return (
                <g
                  key={slot.cardNumber}
                  data-testid={`roleta-ball-${slot.cardNumber}`}
                  data-chosen={markedWhite ? 'true' : 'false'}
                >
                  {highlighted && (
                    <circle
                      cx={slot.x}
                      cy={slot.y}
                      r={OUTER_BALL_R + 5.5}
                      fill="none"
                      stroke={chosen ? '#FFFFFF' : '#FDE68A'}
                      strokeWidth={chosen ? '3.5' : '2.8'}
                      filter="url(#rrGoldGlow)"
                    />
                  )}
                  <circle
                    cx={slot.x}
                    cy={slot.y}
                    r={OUTER_BALL_R}
                    fill={
                      markedWhite
                        ? 'url(#rrWhiteBall)'
                        : slot.isRed
                          ? 'url(#rrRedBall)'
                          : 'url(#rrBlackBall)'
                    }
                    stroke={
                      highlighted
                        ? '#FEF08A'
                        : markedWhite
                          ? '#FFFFFF'
                          : '#B88933'
                    }
                    strokeWidth={highlighted ? '2.4' : markedWhite ? '1.6' : '1.25'}
                  />
                  <text
                    x={slot.x}
                    y={slot.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={markedWhite ? '#0F172A' : '#FFFFFF'}
                    fontSize="11.5"
                    fontWeight={markedWhite ? '800' : '700'}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {slot.cardNumber}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Inner Ring Medallions (Cards 31 to 60, counter-rotates cleanly to align 2nd ball under needle) */}
          <g
            ref={innerRingGroupRef}
            transform={`rotate(${innerRingDeg} ${CX} ${CY})`}
          >
            {INNER_SLOTS.map((slot, idx) => {
              const highlighted = isHighlighted(slot.cardNumber);
              const chosen = isChosen(slot.cardNumber);
              const markedWhite = isMarkedWhite(slot.cardNumber);
              return (
                <g
                  key={slot.cardNumber}
                  data-testid={`roleta-ball-${slot.cardNumber}`}
                  data-chosen={markedWhite ? 'true' : 'false'}
                >
                  {highlighted && (
                    <circle
                      cx={slot.x}
                      cy={slot.y}
                      r={INNER_BALL_R + 5}
                      fill="none"
                      stroke={chosen ? '#FFFFFF' : '#FDE68A'}
                      strokeWidth={chosen ? '3.2' : '2.5'}
                      filter="url(#rrGoldGlow)"
                    />
                  )}
                  <circle
                    cx={slot.x}
                    cy={slot.y}
                    r={INNER_BALL_R}
                    fill={
                      markedWhite
                        ? 'url(#rrWhiteBall)'
                        : slot.isRed
                          ? 'url(#rrRedBall)'
                          : 'url(#rrBlackBall)'
                    }
                    stroke={
                      highlighted
                        ? '#FEF08A'
                        : markedWhite
                          ? '#FFFFFF'
                          : '#B88933'
                    }
                    strokeWidth={highlighted ? '2.2' : markedWhite ? '1.5' : '1.15'}
                  />
                  <g
                    ref={(el) => {
                      innerLabelRefs.current[idx] = el;
                    }}
                    transform={`rotate(${-innerRingDeg} ${slot.x} ${slot.y})`}
                  >
                    <text
                      x={slot.x}
                      y={slot.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={markedWhite ? '#0F172A' : '#FFFFFF'}
                      fontSize="10.2"
                      fontWeight={markedWhite ? '800' : '700'}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {slot.cardNumber}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Central Obsidian Hub Frame */}
          <circle
            cx={CX}
            cy={CY}
            r="49"
            fill="#0A0D13"
            stroke="url(#rrGoldRim)"
            strokeWidth="4.5"
            filter="url(#rrGoldGlow)"
          />
          <circle
            cx={CX}
            cy={CY}
            r="42"
            fill="none"
            stroke="#FDE68A"
            strokeWidth="0.9"
            opacity="0.35"
          />
        </svg>

        {/* Accessible Interactive Center "GIRAR" Button overlaid over Hub */}
        <button
          type="button"
          onClick={onSpinRequest}
          disabled={isSpinning || !canSpin}
          aria-label={isSpinning ? 'Roleta girando' : 'Girar roleta da sorte'}
          className="absolute w-[17%] h-[17%] min-w-[74px] min-h-[74px] rounded-full bg-transparent hover:bg-amber-400/10 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <span className="font-serif text-xs sm:text-sm font-bold tracking-[0.14em] text-[#FDE68A] drop-shadow">
            {isSpinning ? 'GIRANDO' : 'GIRAR'}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-500/80 mt-1"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* 8-Second Spin Progress Bar */}
      <div className="w-full max-w-[470px] mt-4 space-y-1.5">
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-amber-500/20">
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-red-500 transition-none"
            style={{
              width: isSpinning ? '0%' : drawnPair ? '100%' : '0%',
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Anel externo: 01 a 30 · Anel interno: 31 a 60</span>
          <span
            data-testid="roleta-chosen-legend"
            className="inline-flex items-center gap-1.5 text-slate-200 font-medium tabular-nums"
          >
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300 inline-block shrink-0"
            />
            <span>Branca = já escolhida ({chosenSet.size}/60)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
