import {
  Anchor,
  Compass,
  Crown,
  Diamond,
  Flame,
  Flower2,
  Heart,
  Moon,
  Music,
  Rocket,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Zap,
  Clover,
} from 'lucide-react';
import {
  BuiltinMemoryIconKey,
  MemoryFigure,
} from '../utils/memoryGameEngine';

const BUILTIN_ICONS: Record<BuiltinMemoryIconKey, typeof Sun> = {
  sun: Sun,
  star: Star,
  heart: Heart,
  rocket: Rocket,
  crown: Crown,
  diamond: Diamond,
  moon: Moon,
  bolt: Zap,
  clover: Clover,
  trophy: Trophy,
  music: Music,
  anchor: Anchor,
  flame: Flame,
  flower: Flower2,
  compass: Compass,
  butterfly: Sparkles,
};

/**
 * Custom Royal Blue card back with white frame border, centered white-outlined circle,
 * and crisp white "M" monogram. Scales cleanly to any card size via pure SVG.
 */
export function MemoryCardBackBlueM() {
  return (
    <svg
      viewBox="0 0 120 160"
      className="w-full h-full block select-none"
      role="img"
      aria-label="Verso da carta azul com M branco"
    >
      <defs>
        <linearGradient id="memBlueCardBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="55%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <radialGradient id="memBlueGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Deep Royal Blue Card Surface */}
      <rect width="120" height="160" rx="10" fill="url(#memBlueCardBg)" />
      <rect width="120" height="160" rx="10" fill="url(#memBlueGlow)" />

      {/* Outer crisp white border */}
      <rect
        x="5"
        y="5"
        width="110"
        height="150"
        rx="7"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeOpacity="0.96"
      />
      {/* Subtle inner white hairline */}
      <rect
        x="10.5"
        y="10.5"
        width="99"
        height="139"
        rx="4.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        strokeOpacity="0.45"
      />

      {/* Decorative corner dots */}
      <circle cx="17" cy="17" r="2" fill="#FFFFFF" fillOpacity="0.7" />
      <circle cx="103" cy="17" r="2" fill="#FFFFFF" fillOpacity="0.7" />
      <circle cx="17" cy="143" r="2" fill="#FFFFFF" fillOpacity="0.7" />
      <circle cx="103" cy="143" r="2" fill="#FFFFFF" fillOpacity="0.7" />

      {/* Centered Circle with White Outline & White "M" */}
      <circle
        cx="60"
        cy="80"
        r="32"
        fill="#1E40AF"
        fillOpacity="0.65"
        stroke="#FFFFFF"
        strokeWidth="3.2"
      />
      <text
        x="60"
        y="93"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Bricolage Grotesque, Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="40"
      >
        M
      </text>
    </svg>
  );
}

interface MemoryFigureFaceProps {
  figure: MemoryFigure;
  compact: boolean;
  isMatched: boolean;
}

export function MemoryFigureFace({
  figure,
  compact,
  isMatched,
}: MemoryFigureFaceProps) {
  if (figure.kind === 'custom' && figure.imageUrl) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-white overflow-hidden ${
          isMatched ? 'ring-2 ring-inset ring-emerald-500' : ''
        }`}
      >
        <img
          src={figure.imageUrl}
          alt={figure.name}
          referrerPolicy="no-referrer"
          draggable={false}
          className="w-full h-full object-contain p-1 select-none"
        />
      </div>
    );
  }

  const Icon = figure.iconKey ? BUILTIN_ICONS[figure.iconKey] : Star;
  const accent = figure.accentColor ?? '#1D4ED8';
  const bgTint = figure.bgTint ?? '#EFF6FF';

  return (
    <div
      style={{ backgroundColor: bgTint }}
      className={`w-full h-full flex flex-col items-center justify-center p-1.5 sm:p-2.5 select-none border-2 ${
        isMatched ? 'border-emerald-500' : 'border-white'
      }`}
    >
      <span
        style={{ backgroundColor: '#FFFFFF', color: accent }}
        className={`${
          compact ? 'w-8 h-8' : 'w-12 h-12 sm:w-14 sm:h-14'
        } rounded-full flex items-center justify-center shadow-xs border border-slate-200/80 shrink-0`}
      >
        <Icon
          className={compact ? 'w-4 h-4' : 'w-6 h-6 sm:w-7 sm:h-7'}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </span>
      {!compact && (
        <span
          style={{ color: accent }}
          className="mt-1.5 text-[10px] sm:text-xs font-bold tracking-tight text-center leading-tight line-clamp-1"
        >
          {figure.name}
        </span>
      )}
    </div>
  );
}
