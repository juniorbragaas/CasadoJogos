import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dices,
  LayoutGrid,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BINGO_SPIN_DURATION_MS,
  BINGO_TOTAL,
  BingoRouletteTick,
  canGenerateBingoCard,
  computeBingoRouletteTickSchedule,
  drawNextBingoNumber,
  formatBingoNumber,
  getBingoBallTheme,
  getBingoDecadeColumns,
  getDecadeLabelForNumber,
  getRemainingBingoNumbers,
  INITIAL_BINGO_GAME_NUMBER,
} from '../utils/bingoEngine';
import { BingoRoulette } from './BingoRoulette';
import { BingoCardModal } from './BingoCardModal';

export interface BingoLastWinnerNotice {
  finishedGameNumber: number;
  winnerName: string;
  totalBalls: number;
  lastBall: number | null;
}

interface BingoViewProps {
  gameNumber: number;
  drawnNumbers: number[];
  hasWinner: boolean;
  winnerName: string;
  lastWinnerNotice: BingoLastWinnerNotice | null;
  isSpinning: boolean;
  spinCycle: number;
  rollingNumber: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onDrawBall: () => void;
  onDeclareWinner: (name: string) => void;
  onCancelWinner: () => void;
  onDismissLastWinner: () => void;
  onRestartGame: () => void;
}

export function BingoView({
  gameNumber,
  drawnNumbers,
  hasWinner,
  winnerName,
  lastWinnerNotice,
  isSpinning,
  spinCycle,
  rollingNumber,
  soundEnabled,
  onToggleSound,
  onDrawBall,
  onDeclareWinner,
  onCancelWinner,
  onDismissLastWinner,
  onRestartGame,
}: BingoViewProps) {
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [winnerDraftName, setWinnerDraftName] = useState(winnerName);
  const [showWinnerForm, setShowWinnerForm] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  const columns = useMemo(() => getBingoDecadeColumns(), []);
  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);
  const lastDrawnNumber =
    drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;
  const remainingCount = BINGO_TOTAL - drawnNumbers.length;
  const allDrawn = remainingCount === 0;
  const cardGenerationAllowed = canGenerateBingoCard(
    drawnNumbers.length,
    isSpinning
  );
  const recentNumbers = useMemo(
    () => [...drawnNumbers].reverse().slice(0, 8),
    [drawnNumbers]
  );

  useEffect(() => {
    setWinnerDraftName(winnerName);
  }, [winnerName]);

  // Automatically close the card modal if a draw starts
  useEffect(() => {
    if (!cardGenerationAllowed && cardModalOpen) {
      setCardModalOpen(false);
    }
  }, [cardGenerationAllowed, cardModalOpen]);

  const handleConfirmWinner = (e: React.FormEvent) => {
    e.preventDefault();
    onDeclareWinner(winnerDraftName.trim());
    setShowWinnerForm(false);
    setConfirmRestart(false);
    setWinnerDraftName('');
  };

  const handleImmediateRestart = () => {
    setConfirmRestart(false);
    setShowWinnerForm(false);
    setWinnerDraftName('');
    onRestartGame();
  };

  return (
    <div className="space-y-6">
      {/* Bingo Top Control & Summary Bar */}
      <section
        id="bingo-topo"
        aria-labelledby="titulo-bingo"
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1
            id="titulo-bingo"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 headline-balance flex items-center gap-2.5 flex-wrap"
          >
            <span>Bingo — Sorteio de 1 a 99</span>
            <span
              data-testid="bingo-game-number-badge"
              className="font-mono text-sm sm:text-base font-bold text-[#0F5132] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg tabular-nums"
            >
              Jogo #{gameNumber}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 tabular-nums">
            Jogo #{gameNumber} · {drawnNumbers.length}{' '}
            {drawnNumbers.length === 1 ? 'bola sorteada' : 'bolas sorteadas'} ·{' '}
            {remainingCount} {remainingCount === 1 ? 'restante' : 'restantes'} ·{' '}
            {cardGenerationAllowed
              ? 'Cartões liberados antes do início'
              : 'Jogo em andamento (cartões bloqueados até o fim)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!cardGenerationAllowed}
            onClick={() => {
              if (!cardGenerationAllowed) return;
              setCardModalOpen(true);
            }}
            data-testid="bingo-open-card-modal-btn"
            title={
              cardGenerationAllowed
                ? `Gerar cartão de Bingo para o Jogo #${gameNumber}`
                : `Jogo #${gameNumber} em andamento — não é possível gerar cartões até encerrar e iniciar um novo jogo.`
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F5132] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 whitespace-nowrap"
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              {cardGenerationAllowed
                ? `Gerar Cartão (Jogo #${gameNumber})`
                : 'Gerar Cartão (Bloqueado)'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Desativar som do sorteio' : 'Ativar som do sorteio'}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#0F5132]" aria-hidden="true" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            )}
            <span>{soundEnabled ? 'Som ligado' : 'Som desligado'}</span>
          </button>

          {!hasWinner && drawnNumbers.length > 0 && (
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setShowWinnerForm((prev) => !prev);
                setConfirmRestart(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Houve Ganhador</span>
            </button>
          )}

          {hasWinner || allDrawn ? (
            <button
              type="button"
              onClick={handleImmediateRestart}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reiniciar Jogo</span>
            </button>
          ) : drawnNumbers.length > 0 ? (
            !confirmRestart ? (
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => {
                  setConfirmRestart(true);
                  setShowWinnerForm(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-red-300 hover:text-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reiniciar Jogo</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs font-medium text-red-900">
                  Zerar tabuleiro?
                </span>
                <button
                  type="button"
                  onClick={handleImmediateRestart}
                  className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRestart(false)}
                  className="text-xs font-medium text-slate-600 hover:underline cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )
          ) : null}
        </div>
      </section>

      {/* Optional Winner Declaration Form */}
      {showWinnerForm && !hasWinner && (
        <form
          onSubmit={handleConfirmWinner}
          className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            <label
              htmlFor="nome-ganhador-bingo"
              className="block text-xs font-bold text-amber-950 mb-1"
            >
              Confirmar ganhador do Jogo #{gameNumber} (inicia automaticamente o Jogo #{gameNumber + 1})
            </label>
            <input
              id="nome-ganhador-bingo"
              type="text"
              value={winnerDraftName}
              onChange={(e) => setWinnerDraftName(e.target.value)}
              placeholder="Ex.: Maria Silva — Cartela #14"
              className="w-full max-w-md px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F5132] hover:opacity-90 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Confirmar Ganhador
            </button>
            <button
              type="button"
              onClick={() => setShowWinnerForm(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Previous Game Winner Celebration + New Game Ready Banner */}
      {lastWinnerNotice && (
        <section
          role="status"
          data-testid="bingo-new-game-winner-banner"
          className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-950">
                Jogo #{lastWinnerNotice.finishedGameNumber} encerrado! Ganhador
                {lastWinnerNotice.winnerName
                  ? `: ${lastWinnerNotice.winnerName}`
                  : ' confirmado'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 mt-0.5 tabular-nums">
                Finalizado após {lastWinnerNotice.totalBalls}{' '}
                {lastWinnerNotice.totalBalls === 1 ? 'bola sorteada' : 'bolas sorteadas'}
                {lastWinnerNotice.lastBall !== null
                  ? ` (última bola: ${formatBingoNumber(lastWinnerNotice.lastBall)})`
                  : ''}
                . O <strong className="text-slate-950">Jogo #{gameNumber}</strong> já foi iniciado e está liberado para gerar cartões!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismissLastWinner}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            Fechar aviso
          </button>
        </section>
      )}

      {/* Winner Celebration & Restart Banner */}
      {hasWinner && (
        <section
          role="status"
          data-testid="bingo-winner-banner"
          className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-950">
                Bingo! Temos um ganhador
                {winnerName ? ` — ${winnerName}` : ''}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 mt-0.5 tabular-nums">
                Rodada encerrada após {drawnNumbers.length}{' '}
                {drawnNumbers.length === 1 ? 'bola sorteada' : 'bolas sorteadas'}
                {lastDrawnNumber !== null
                  ? ` (último número: ${formatBingoNumber(lastDrawnNumber)}).`
                  : '.'}{' '}
                Clique em Reiniciar Jogo para começar uma nova partida.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onCancelWinner}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Continuar rodada
            </button>
            <button
              type="button"
              onClick={handleImmediateRestart}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0F5132] hover:opacity-90 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Reiniciar Jogo</span>
            </button>
          </div>
        </section>
      )}

      {/* Main 2-Column Bingo Workspace: Left Roulette + Right 10-Column Decade Board */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Roulette + Primary Draw Action */}
        <section
          id="bingo-roleta"
          aria-label="Roleta e sorteio de bolas do Bingo"
          className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5 scroll-mt-20"
        >
          <BingoRoulette
            isSpinning={isSpinning}
            spinCycle={spinCycle}
            rollingNumber={rollingNumber}
            lastDrawnNumber={lastDrawnNumber}
            drawnCount={drawnNumbers.length}
            remainingCount={remainingCount}
            recentNumbers={recentNumbers}
          />

          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            {allDrawn ? (
              <div className="space-y-2.5 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  Todas as 99 bolas já foram sorteadas!
                </p>
                <button
                  type="button"
                  onClick={handleImmediateRestart}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Reiniciar Novo Jogo</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onDrawBall}
                disabled={isSpinning || hasWinner}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm sm:text-base font-bold text-white bg-[#0F5132] hover:bg-[#0c4228] rounded-xl transition-colors disabled:opacity-55 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <Dices className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>
                  {isSpinning
                    ? 'Sorteando bola...'
                    : hasWinner
                      ? 'Rodada encerrada'
                      : 'Sortear Bola'}
                </span>
              </button>
            )}

            {!hasWinner && drawnNumbers.length > 0 && !allDrawn && (
              <p className="text-[11px] text-slate-500 text-center">
                Quando alguém completar a cartela, clique em{' '}
                <strong className="text-slate-700">Houve Ganhador</strong> ou{' '}
                <strong className="text-slate-700">Reiniciar Jogo</strong>.
              </p>
            )}
          </div>
        </section>

        {/* Right Column: Official 1–99 Decade-Column Bingo Board */}
        <section
          id="bingo-tabuleiro"
          aria-labelledby="titulo-tabuleiro-bingo"
          className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between scroll-mt-20"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 mb-4">
              <div>
                <h2
                  id="titulo-tabuleiro-bingo"
                  className="font-display text-lg sm:text-xl font-bold text-slate-950"
                >
                  Tabuleiro do Bingo (01 a 99)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Cada coluna representa uma dezena (01–09, 10–19, 20–29 até 90–99).
                </p>
              </div>

              {/* Clean unboxed legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-3.5 h-3.5 rounded bg-amber-400 ring-2 ring-slate-950 inline-block"
                  />
                  <span>Última bola</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-3.5 h-3.5 rounded bg-[#0F5132] inline-block"
                  />
                  <span>Sorteada</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-block"
                  />
                  <span>Não sorteada</span>
                </span>
              </div>
            </div>

            {/* 10 Vertical Columns — One Decade Per Column */}
            <div className="overflow-x-auto pb-1">
              <div
                data-testid="bingo-board"
                className="grid grid-cols-10 gap-1.5 sm:gap-2 min-w-[600px]"
              >
                {columns.map((col) => {
                  const colTheme = getBingoBallTheme(col.min);
                  const colDrawnCount = col.numbers.filter((n) =>
                    drawnSet.has(n)
                  ).length;

                  return (
                    <div
                      key={col.decadeIndex}
                      data-testid={`bingo-col-${col.decadeIndex}`}
                      className="flex flex-col gap-1.5"
                    >
                      {/* Decade Column Header */}
                      <div
                        className="rounded-lg py-1.5 px-1 text-center border border-slate-200/80"
                        style={{ backgroundColor: colTheme.labelBg }}
                      >
                        <span
                          className="block font-mono text-[11px] sm:text-xs font-bold tabular-nums leading-tight"
                          style={{ color: colTheme.bg }}
                        >
                          {col.label}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-500 tabular-nums leading-tight mt-0.5">
                          {colDrawnCount}/{col.numbers.length}
                        </span>
                      </div>

                      {/* Numbers inside this Decade Column */}
                      <div className="flex flex-col gap-1.5">
                        {col.numbers.map((num) => {
                          const isDrawn = drawnSet.has(num);
                          const isLatest = num === lastDrawnNumber;
                          return (
                            <div
                              key={num}
                              data-testid={`bingo-cell-${num}`}
                              data-drawn={isDrawn ? 'true' : 'false'}
                              data-latest={isLatest ? 'true' : 'false'}
                              aria-label={`Número ${formatBingoNumber(num)} (${col.label}) — ${
                                isLatest
                                  ? 'última bola sorteada'
                                  : isDrawn
                                    ? 'já sorteado'
                                    : 'ainda não sorteado'
                              }`}
                              className={`h-9 sm:h-10 rounded-lg flex items-center justify-center font-mono text-xs sm:text-sm tabular-nums transition-all duration-200 select-none ${
                                isLatest
                                  ? 'bg-amber-400 text-slate-950 font-extrabold ring-2 ring-slate-950 shadow-sm scale-[1.04]'
                                  : isDrawn
                                    ? 'bg-[#0F5132] text-white font-bold shadow-2xs'
                                    : 'bg-slate-50 text-slate-400 font-medium border border-slate-200/80'
                              }`}
                            >
                              {formatBingoNumber(num)}
                            </div>
                          );
                        })}

                        {/* Column 0 (01–09) has 9 numbers; keep visual bottom alignment with 10-number columns */}
                        {col.numbers.length === 9 && (
                          <div
                            aria-hidden="true"
                            className="h-9 sm:h-10 rounded-lg border border-dashed border-slate-200/60 bg-slate-50/40"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Board Footer Status Line */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
            <span>
              {lastDrawnNumber !== null
                ? `Última marcação: ${formatBingoNumber(lastDrawnNumber)} (coluna ${getDecadeLabelForNumber(lastDrawnNumber)})`
                : 'Aguardando o primeiro número ser retirado da roleta.'}
            </span>
            <span>
              Progresso: {Math.round((drawnNumbers.length / BINGO_TOTAL) * 100)}%
            </span>
          </div>
        </section>
      </div>
      <BingoCardModal
        isOpen={cardModalOpen && cardGenerationAllowed}
        gameNumber={gameNumber}
        onClose={() => setCardModalOpen(false)}
      />
    </div>
  );
}

let sharedBingoAudioCtx: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;

function getBingoAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedBingoAudioCtx || sharedBingoAudioCtx.state === 'closed') {
    sharedBingoAudioCtx = new AudioCtx();
    sharedNoiseBuffer = null;
  }
  if (sharedBingoAudioCtx.state === 'suspended') {
    sharedBingoAudioCtx.resume().catch(() => {});
  }
  return sharedBingoAudioCtx;
}

function getClickNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer;
  }
  const length = Math.max(1, Math.floor(ctx.sampleRate * 0.03));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const decay = 1 - i / length;
    channel[i] = (Math.random() * 2 - 1) * decay * decay;
  }
  sharedNoiseBuffer = buffer;
  return buffer;
}

/**
 * Plays a realistic decelerating roulette wheel spin sound (wooden/brass peg clicks
 * + subtle mechanical rattle) across the entire draw duration until the ball is chosen.
 * Returns a cancel callback that immediately silences audio on mute, restart, or unmount.
 */
function startBingoRouletteSpinSound(schedule: BingoRouletteTick[]): () => void {
  try {
    const ctx = getBingoAudioContext();
    if (!ctx) return () => {};

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const noiseBuffer = getClickNoiseBuffer(ctx);
    const startAt = ctx.currentTime + 0.015;
    const stoppableNodes: AudioScheduledSourceNode[] = [];

    for (const tick of schedule) {
      const t = startAt + tick.timeMs / 1000;
      const p = tick.progress;

      // 1. Tactile roulette peg click (crisp pitched impulse that deepens slightly as wheel slows)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      const startFreq = 1180 - p * 300;
      const endFreq = 260 - p * 55;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.026);

      const peakGain = 0.075 + p * 0.04;
      oscGain.gain.setValueAtTime(0.0001, t);
      oscGain.gain.linearRampToValueAtTime(peakGain, t + 0.002);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.036);
      stoppableNodes.push(osc);

      // 2. Bandpass-filtered wooden/brass mechanical transient for roulette pocket realism
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 - p * 750, t);
      filter.Q.setValueAtTime(2.8, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.045 + p * 0.02, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(t);
      noise.stop(t + 0.028);
      stoppableNodes.push(noise);
    }

    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      try {
        const now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(0, now);
        for (const node of stoppableNodes) {
          try {
            node.stop(now);
          } catch {
            // Node already finished or not yet started
          }
        }
        masterGain.disconnect();
      } catch {
        // Ignore cleanup errors quietly
      }
    };
  } catch {
    return () => {};
  }
}

/**
 * Plays a gentle synthesized reveal / winner chime via Web Audio API.
 * Silently no-ops if audio is disabled or unsupported.
 */
export function playBingoTone(type: 'spin' | 'reveal' | 'winner'): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getBingoAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'spin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.028);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.032);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.036);
    } else if (type === 'reveal') {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.08, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.26);
      });
    } else {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.08, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.38);
      });
    }
  } catch {
    // Ignore audio errors quietly
  }
}

export function useBingoController() {
  const [gameNumber, setGameNumber] = useState<number>(INITIAL_BINGO_GAME_NUMBER);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [hasWinner, setHasWinner] = useState(false);
  const [winnerName, setWinnerName] = useState('');
  const [lastWinnerNotice, setLastWinnerNotice] =
    useState<BingoLastWinnerNotice | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCycle, setSpinCycle] = useState(0);
  const [rollingNumber, setRollingNumber] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timersRef = useRef<number[]>([]);
  const stopSpinAudioRef = useRef<(() => void) | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (!soundEnabled && stopSpinAudioRef.current) {
      stopSpinAudioRef.current();
      stopSpinAudioRef.current = null;
    }
  }, [soundEnabled]);

  const stopSpinAudio = useCallback(() => {
    if (stopSpinAudioRef.current) {
      stopSpinAudioRef.current();
      stopSpinAudioRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    stopSpinAudio();
  }, [stopSpinAudio]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const drawBall = useCallback(
    (onStateChange?: (nextDrawn: number[]) => void) => {
      if (isSpinning || hasWinner) return;
      const remaining = getRemainingBingoNumbers(drawnNumbers);
      if (remaining.length === 0) return;

      const nextNum = drawNextBingoNumber(drawnNumbers);
      if (nextNum === null) return;

      setLastWinnerNotice(null);

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        const nextList = [...drawnNumbers, nextNum];
        setDrawnNumbers(nextList);
        setSpinCycle((c) => c + 1);
        onStateChange?.(nextList);
        if (soundEnabledRef.current) playBingoTone('reveal');
        return;
      }

      clearTimers();
      setIsSpinning(true);
      setSpinCycle((c) => c + 1);

      const tickSchedule = computeBingoRouletteTickSchedule(BINGO_SPIN_DURATION_MS);

      // Start sample-accurate decelerating roulette wheel sound until the ball is revealed
      if (soundEnabledRef.current) {
        stopSpinAudioRef.current = startBingoRouletteSpinSound(tickSchedule);
      }

      // Flip the visible candidate number on the central ball in sync with the roulette deceleration
      let lastPreview = -1;
      for (const tick of tickSchedule) {
        const flipTimer = window.setTimeout(() => {
          let candidate = remaining[Math.floor(Math.random() * remaining.length)];
          if (remaining.length > 1 && candidate === lastPreview) {
            candidate =
              remaining[(remaining.indexOf(candidate) + 1) % remaining.length];
          }
          lastPreview = candidate;
          setRollingNumber(candidate);
        }, tick.timeMs);
        timersRef.current.push(flipTimer);
      }

      const finishTimer = window.setTimeout(() => {
        stopSpinAudio();
        const nextList = [...drawnNumbers, nextNum];
        setDrawnNumbers(nextList);
        setIsSpinning(false);
        onStateChange?.(nextList);
        if (soundEnabledRef.current) playBingoTone('reveal');
      }, BINGO_SPIN_DURATION_MS);
      timersRef.current.push(finishTimer);
    },
    [clearTimers, drawnNumbers, hasWinner, isSpinning, stopSpinAudio]
  );

  return {
    gameNumber,
    setGameNumber,
    drawnNumbers,
    setDrawnNumbers,
    hasWinner,
    setHasWinner,
    winnerName,
    setWinnerName,
    lastWinnerNotice,
    setLastWinnerNotice,
    isSpinning,
    setIsSpinning,
    spinCycle,
    rollingNumber,
    soundEnabled,
    setSoundEnabled,
    clearTimers,
    drawBall,
  };
}
