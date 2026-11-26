import { AnimatePresence, motion } from 'motion/react';
import {
  BINGO_SPIN_DURATION_MS,
  formatBingoNumber,
  getBingoBallTheme,
  getDecadeLabelForNumber,
} from '../utils/bingoEngine';

interface BingoRouletteProps {
  isSpinning: boolean;
  spinCycle: number;
  rollingNumber: number;
  lastDrawnNumber: number | null;
  drawnCount: number;
  remainingCount: number;
  recentNumbers: number[];
}

// 12 decorative numbered balls tumbling inside the bingo roulette drum
const DRUM_BALLS = [
  { id: 1, num: 7, angle: 0, radius: 46, color: '#0F5132' },
  { id: 2, num: 14, angle: 30, radius: 58, color: '#1D4ED8' },
  { id: 3, num: 23, angle: 60, radius: 34, color: '#B91C1C' },
  { id: 4, num: 38, angle: 90, radius: 60, color: '#B45309' },
  { id: 5, num: 45, angle: 120, radius: 42, color: '#6D28D9' },
  { id: 6, num: 52, angle: 150, radius: 56, color: '#0F766E' },
  { id: 7, num: 61, angle: 180, radius: 28, color: '#BE123C' },
  { id: 8, num: 74, angle: 210, radius: 58, color: '#3730A3' },
  { id: 9, num: 86, angle: 240, radius: 44, color: '#C2410C' },
  { id: 10, num: 93, angle: 270, radius: 56, color: '#1E293B' },
  { id: 11, num: 19, angle: 300, radius: 36, color: '#1D4ED8' },
  { id: 12, num: 68, angle: 330, radius: 52, color: '#BE123C' },
];

export function BingoRoulette({
  isSpinning,
  spinCycle,
  rollingNumber,
  lastDrawnNumber,
  drawnCount,
  remainingCount,
  recentNumbers,
}: BingoRouletteProps) {
  const activeBallTheme =
    lastDrawnNumber !== null ? getBingoBallTheme(lastDrawnNumber) : null;

  return (
    <div className="space-y-5">
      {/* Classic Bingo Hall Roulette Drum */}
      <div
        data-testid="bingo-roulette-stage"
        className="relative rounded-xl bg-[#0F5132] p-5 text-white overflow-hidden"
      >
        <div className="flex items-center justify-between text-xs text-emerald-100/90 mb-3">
          <span className="font-semibold">Roleta de Bingo</span>
          <span className="font-mono tabular-nums">
            {remainingCount} {remainingCount === 1 ? 'bola restante' : 'bolas restantes'}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-1">
          {/* Spinning Metallic Cage + Tumbling Balls */}
          <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Outer Brass Bezel */}
            <div
              className="absolute inset-0 rounded-full border-4 border-amber-400/90 bg-slate-950/35 shadow-inner"
              aria-hidden="true"
            />

            {/* Rotating Roulette Cage Spokes & Rim */}
            <motion.svg
              viewBox="0 0 200 200"
              className="absolute inset-0 w-full h-full pointer-events-none"
              animate={{
                rotate: isSpinning ? spinCycle * 720 + 720 : spinCycle * 720,
              }}
              transition={
                isSpinning
                  ? {
                      duration: BINGO_SPIN_DURATION_MS / 1000,
                      ease: [0.16, 1, 0.3, 1],
                    }
                  : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
              }
              aria-hidden="true"
            >
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeDasharray="10 6"
                opacity="0.7"
              />
              <circle
                cx="100"
                cy="100"
                r="72"
                fill="none"
                stroke="#D1FAE5"
                strokeWidth="1.2"
                opacity="0.35"
              />
              {[0, 45, 90, 135].map((deg) => (
                <line
                  key={deg}
                  x1="100"
                  y1="14"
                  x2="100"
                  y2="186"
                  stroke="#FCD34D"
                  strokeWidth="1.5"
                  opacity="0.3"
                  transform={`rotate(${deg} 100 100)`}
                />
              ))}
              {/* Brass pocket markers around rim */}
              {Array.from({ length: 12 }, (_, i) => {
                const rad = (i * 30 * Math.PI) / 180;
                const cx = 100 + Math.cos(rad) * 88;
                const cy = 100 + Math.sin(rad) * 88;
                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="3.2"
                    fill="#FDE68A"
                    opacity="0.9"
                  />
                );
              })}
            </motion.svg>

            {/* Orbiting Tumbling Balls Inside Drum */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                rotate: isSpinning ? -(spinCycle * 540 + 540) : -(spinCycle * 540),
              }}
              transition={
                isSpinning
                  ? {
                      duration: BINGO_SPIN_DURATION_MS / 1000,
                      ease: [0.16, 1, 0.3, 1],
                    }
                  : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
              }
              aria-hidden="true"
            >
              {DRUM_BALLS.map((ball, idx) => {
                const rad = (ball.angle * Math.PI) / 180;
                const offsetX = Math.cos(rad) * ball.radius;
                const offsetY = Math.sin(rad) * ball.radius;
                return (
                  <motion.div
                    key={ball.id}
                    animate={
                      isSpinning
                        ? {
                            scale: [1, 1.15, 0.92, 1.08, 1],
                            x: [offsetX, offsetX * 0.72, offsetX * 1.08, offsetX],
                            y: [offsetY, offsetY * 1.08, offsetY * 0.72, offsetY],
                          }
                        : { scale: 1, x: offsetX, y: offsetY }
                    }
                    transition={
                      isSpinning
                        ? {
                            duration: 0.65,
                            repeat: 2,
                            delay: (idx % 4) * 0.05,
                            ease: 'easeInOut',
                          }
                        : { duration: 0.3 }
                    }
                    className="absolute top-1/2 left-1/2 -ml-3.5 -mt-3.5 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-md border border-white/50 tabular-nums"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${ball.color}, #020617 135%)`,
                    }}
                  >
                    {formatBingoNumber(ball.num)}
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Central Chute / Active Drawn Ball Spotlight */}
            <div className="relative z-10 w-24 h-24 rounded-full bg-slate-950/75 border-2 border-amber-300/80 flex items-center justify-center shadow-lg">
              <AnimatePresence mode="wait">
                {isSpinning ? (
                  <motion.div
                    key="rolling"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      transition: { duration: 0.14 },
                    }}
                    exit={{
                      scale: 0.75,
                      opacity: 0,
                      transition: { duration: 0.12 },
                    }}
                    className="w-20 h-20 rounded-full bg-amber-400 text-slate-950 flex flex-col items-center justify-center shadow-md border-2 border-white animate-pulse"
                  >
                    <span className="font-mono text-2xl font-extrabold tabular-nums leading-none">
                      {formatBingoNumber(rollingNumber)}
                    </span>
                    <span className="text-[9px] font-bold mt-0.5 text-slate-900">
                      Girando...
                    </span>
                  </motion.div>
                ) : lastDrawnNumber !== null && activeBallTheme ? (
                  <motion.div
                    key={`drawn-${lastDrawnNumber}`}
                    data-testid="bingo-highlighted-ball"
                    initial={{ scale: 0.4, y: -14, opacity: 0 }}
                    animate={{
                      scale: 1,
                      y: 0,
                      opacity: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 380,
                        damping: 20,
                      },
                    }}
                    exit={{
                      scale: 0.75,
                      opacity: 0,
                      transition: { duration: 0.12 },
                    }}
                    className="w-21 h-21 rounded-full flex flex-col items-center justify-center shadow-xl border-3 border-white"
                    style={{
                      background: `radial-gradient(circle at 32% 28%, ${activeBallTheme.bg}, #020617 150%)`,
                      color: activeBallTheme.text,
                    }}
                  >
                    <span className="w-13 h-13 rounded-full bg-white text-slate-950 flex items-center justify-center font-mono text-2xl font-extrabold tabular-nums shadow-inner">
                      {formatBingoNumber(lastDrawnNumber)}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: { duration: 0.18 },
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.85,
                      transition: { duration: 0.12 },
                    }}
                    className="text-center px-2"
                  >
                    <span className="block font-mono text-xl font-bold text-amber-200 tabular-nums">
                      01–99
                    </span>
                    <span className="block text-[10px] text-emerald-100/80 mt-0.5">
                      Pronto
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Highlighted Drawn Ball Callout Banner */}
          <div
            aria-live="polite"
            className="mt-4 w-full rounded-lg bg-white/10 border border-white/15 px-4 py-3 text-center"
          >
            {isSpinning ? (
              <p className="text-sm font-semibold text-amber-200">
                Misturando as bolas na roleta...
              </p>
            ) : lastDrawnNumber !== null ? (
              <div className="space-y-0.5">
                <p className="text-xs text-emerald-100/90 tabular-nums">
                  Bola retirada · {drawnCount}ª chamada · Coluna{' '}
                  {getDecadeLabelForNumber(lastDrawnNumber)}
                </p>
                <p className="font-display text-xl font-bold text-white tabular-nums">
                  Número {formatBingoNumber(lastDrawnNumber)}
                </p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-emerald-100/90">
                Clique em <strong className="text-white">Sortear Bola</strong> para
                girar a roleta e retirar o primeiro número.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Drawn Balls Strip */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
          <span className="font-semibold text-slate-800">
            Últimas bolas sorteadas
          </span>
          <span className="font-mono tabular-nums text-slate-500">
            {drawnCount} de 99
          </span>
        </div>

        {recentNumbers.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            Nenhuma bola sorteada nesta rodada ainda.
          </p>
        ) : (
          <div
            data-testid="bingo-recent-balls"
            className="flex flex-wrap items-center gap-2"
          >
            {recentNumbers.map((num, idx) => {
              const theme = getBingoBallTheme(num);
              const isLatest = idx === 0;
              return (
                <span
                  key={num}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold tabular-nums transition-transform ${
                    isLatest
                      ? 'ring-2 ring-offset-2 ring-slate-950 scale-105'
                      : 'opacity-90'
                  }`}
                  style={{
                    backgroundColor: theme.bg,
                    color: theme.text,
                  }}
                  title={`Bola ${formatBingoNumber(num)} (${getDecadeLabelForNumber(num)})`}
                >
                  {formatBingoNumber(num)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
