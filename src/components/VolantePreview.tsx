import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import {
  getLotteryGameById,
  LotteryGameId,
  MONTHS_SHORT_PT_BR,
} from '../data/lotteryGames';
import {
  formatLotteryNumber,
  GeneratedBet,
  getSlipGridNumbers,
  LotecaColumn,
} from '../utils/lotteryEngine';
import { SLIP_SPECS } from '../utils/slipGeometry';

interface VolantePreviewProps {
  gameId: LotteryGameId;
  activeBet: GeneratedBet | null;
  batchTotal: number;
  selectedBatchIndex: number;
  onSelectBatchIndex: (index: number) => void;
  revealedNumbers: number[];
  revealedClovers: number[];
  revealedLotecaCount: number;
  isAnimating: boolean;
  onOpenPdfModal: () => void;
}

export function VolantePreview({
  gameId,
  activeBet,
  batchTotal,
  selectedBatchIndex,
  onSelectBatchIndex,
  revealedNumbers,
  revealedClovers,
  revealedLotecaCount,
  isAnimating,
  onOpenPdfModal,
}: VolantePreviewProps) {
  const game = getLotteryGameById(gameId);
  const gridNumbers = getSlipGridNumbers(gameId);
  const markedSet = new Set(revealedNumbers);
  const markedClovers = new Set(revealedClovers);

  const showExtraMonth =
    game.hasLuckyMonth &&
    activeBet?.luckyMonthIndex !== undefined &&
    (!isAnimating || revealedNumbers.length >= (activeBet?.numbers.length ?? 0));

  const showHeartTeam =
    game.hasHeartTeam &&
    activeBet?.heartTeamName !== undefined &&
    (!isAnimating || revealedNumbers.length >= (activeBet?.numbers.length ?? 0));

  return (
    <section
      id="volante"
      aria-labelledby="titulo-volante"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between scroll-mt-20"
    >
      <div>
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2
              id="titulo-volante"
              className="font-display text-lg font-bold text-slate-950"
            >
              Prévia do Volante Oficial
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
              {game.name} · Marcação óptica padrão Caixa
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPdfModal}
            disabled={!activeBet || isAnimating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Calibrar PDF</span>
          </button>
        </div>

        {/* Physical paper card representation */}
        <div className="mt-4 bg-[#FCFBF7] border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-dashed border-slate-300">
            <span
              className="font-display text-xs font-bold tracking-wide uppercase"
              style={{ color: game.accentText }}
            >
              {game.name} —{' '}
              {batchTotal > 1
                ? `Sorteio ${selectedBatchIndex + 1} de ${batchTotal}`
                : 'Jogo 1'}
            </span>
            <div className="flex items-center gap-1.5">
              {batchTotal > 1 && !isAnimating && (
                <div className="inline-flex items-center gap-0.5 mr-1">
                  <button
                    type="button"
                    aria-label="Ver sorteio anterior no volante"
                    disabled={selectedBatchIndex <= 0}
                    onClick={() => onSelectBatchIndex(selectedBatchIndex - 1)}
                    className="p-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Ver próximo sorteio no volante"
                    disabled={selectedBatchIndex >= batchTotal - 1}
                    onClick={() => onSelectBatchIndex(selectedBatchIndex + 1)}
                    className="p-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {activeBet
                  ? `Semente ${activeBet.seedFingerprint}`
                  : 'Aguardando sorteio'}
              </span>
            </div>
          </div>

          {game.kind === 'loteca' ? (
            <div className="space-y-1.5" data-testid="volante-loteca-grid">
              <div className="grid grid-cols-[3.5rem_1fr_1fr_1fr] gap-1.5 text-[11px] font-mono font-semibold text-slate-500 pb-1 border-b border-slate-200 text-center">
                <span className="text-left">JOGO</span>
                <span>COL 1</span>
                <span>MEIO</span>
                <span>COL 2</span>
              </div>
              {Array.from({ length: 14 }, (_, idx) => {
                const matchPred =
                  idx < revealedLotecaCount
                    ? activeBet?.lotecaMatches?.[idx]
                    : undefined;
                const cols: readonly LotecaColumn[] = ['1', 'X', '2'];
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-[3.5rem_1fr_1fr_1fr] gap-1.5 items-center text-xs font-mono tabular-nums"
                  >
                    <span className="text-slate-600 font-medium">
                      {formatLotteryNumber(idx + 1)}
                    </span>
                    {cols.map((col) => {
                      const isMarked = Boolean(matchPred?.columns.includes(col));
                      return (
                        <div
                          key={col}
                          className={`h-5 rounded-[3px] flex items-center justify-center text-[11px] font-semibold transition-colors duration-150 ${
                            isMarked
                              ? 'bg-slate-950 text-white'
                              : 'bg-white border border-slate-300 text-slate-400'
                          }`}
                        >
                          {col}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              data-testid="volante-numbers-grid"
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${game.gridCols}, minmax(0, 1fr))`,
              }}
            >
              {gridNumbers.map((num) => {
                const isMarked = markedSet.has(num);
                return (
                  <div
                    key={num}
                    className={`h-6 sm:h-7 rounded-[3px] flex items-center justify-center font-mono text-[11px] sm:text-xs font-semibold tabular-nums transition-all duration-150 ${
                      isMarked
                        ? 'bg-slate-950 text-white scale-[1.03]'
                        : 'bg-white border border-slate-200 text-slate-500'
                    }`}
                  >
                    {formatLotteryNumber(num, game.zeroPaddedDigits)}
                  </div>
                );
              })}
            </div>
          )}

          {/* +Milionária: Trevos da Sorte */}
          {game.hasClovers && (
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300">
              <p className="text-[11px] font-semibold text-slate-600 mb-2">
                Trevos da Sorte (1 a 6)
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((t) => {
                  const isMarked = markedClovers.has(t);
                  return (
                    <div
                      key={t}
                      className={`h-7 rounded-[3px] flex items-center justify-center font-mono text-xs font-semibold tabular-nums transition-colors ${
                        isMarked
                          ? 'bg-slate-950 text-white'
                          : 'bg-white border border-slate-200 text-slate-500'
                      }`}
                    >
                      T{t}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dia de Sorte: Meses */}
          {game.hasLuckyMonth && (
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300">
              <p className="text-[11px] font-semibold text-slate-600 mb-2">
                Mês de Sorte
              </p>
              <div className="grid grid-cols-6 gap-1">
                {MONTHS_SHORT_PT_BR.map((label, mIdx) => {
                  const isMarked =
                    showExtraMonth && activeBet?.luckyMonthIndex === mIdx;
                  return (
                    <div
                      key={label}
                      className={`h-6 rounded-[3px] flex items-center justify-center font-mono text-[10px] font-semibold transition-colors ${
                        isMarked
                          ? 'bg-slate-950 text-white'
                          : 'bg-white border border-slate-200 text-slate-500'
                      }`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timemania: Time do Coração */}
          {game.hasHeartTeam && (
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300">
              <p className="text-[11px] font-semibold text-slate-600 mb-1.5">
                Time do Coração
              </p>
              <div className="px-3 py-2 rounded bg-white border border-slate-200 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {showHeartTeam && activeBet?.heartTeamName
                  ? `${formatLotteryNumber((activeBet.heartTeamIndex ?? 0) + 1)} — ${activeBet.heartTeamName}`
                  : 'Aguardando sorteio do clube'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-200/80">
            <dt className="text-slate-500">Cartão oficial</dt>
            <dd className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
              {SLIP_SPECS[gameId].cardWidthMm} × {SLIP_SPECS[gameId].cardHeightMm} mm
            </dd>
          </div>
          <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-200/80">
            <dt className="text-slate-500">Capacidade</dt>
            <dd className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
              Até {game.maxBetsPerSlip} {game.maxBetsPerSlip === 1 ? 'jogo' : 'jogos'}
            </dd>
          </div>
          <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-200/80">
            <dt className="text-slate-500">Escala PDF</dt>
            <dd className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
              100% · A4
            </dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500 leading-relaxed">
          As marcações em preto sólido simulam o preenchimento óptico aceito nos terminais das lotéricas. Use <strong className="text-slate-700 font-semibold">Calibrar PDF</strong> para ajustar a posição em milímetros para sua impressora.
        </p>
      </div>
    </section>
  );
}
