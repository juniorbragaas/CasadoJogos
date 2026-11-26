import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Clover,
  Copy,
  Dices,
  FastForward,
  Printer,
  RefreshCw,
  Shield,
  Calendar,
  Minus,
  Plus,
} from 'lucide-react';
import {
  getLotteryGameById,
  INSPIRATION_PHRASES,
  LotteryGameId,
} from '../data/lotteryGames';
import {
  clampDrawCount,
  formatBatchPlainText,
  formatLotteryNumber,
  GeneratedBet,
  LotecaColumn,
  MAX_DRAW_COUNT,
} from '../utils/lotteryEngine';

interface DrawStageProps {
  gameId: LotteryGameId;
  phrase: string;
  onPhraseChange: (value: string) => void;
  phraseError: string | null;
  pickCount: number;
  onPickCountChange: (count: number) => void;
  cloversCount: number;
  onCloversCountChange: (count: number) => void;
  lotecaDuplos: number;
  onLotecaDuplosChange: (count: number) => void;
  lotecaTriplos: number;
  onLotecaTriplosChange: (count: number) => void;
  variationIndex: number;
  drawCount: number;
  onDrawCountChange: (count: number) => void;
  isAnimating: boolean;
  rollingValue: string;
  activeBet: GeneratedBet | null;
  activeBatch: GeneratedBet[];
  selectedBatchIndex: number;
  onSelectBatchIndex: (index: number) => void;
  revealedNumbers: number[];
  revealedClovers: number[];
  revealedLotecaCount: number;
  onDraw: (nextVariation?: boolean) => void;
  onSkipAnimation: () => void;
  onOpenPdfModal: () => void;
}

export function DrawStage({
  gameId,
  phrase,
  onPhraseChange,
  phraseError,
  pickCount,
  onPickCountChange,
  cloversCount,
  onCloversCountChange,
  lotecaDuplos,
  onLotecaDuplosChange,
  lotecaTriplos,
  onLotecaTriplosChange,
  variationIndex,
  drawCount,
  onDrawCountChange,
  isAnimating,
  rollingValue,
  activeBet,
  activeBatch,
  selectedBatchIndex,
  onSelectBatchIndex,
  revealedNumbers,
  revealedClovers,
  revealedLotecaCount,
  onDraw,
  onSkipAnimation,
  onOpenPdfModal,
}: DrawStageProps) {
  const game = getLotteryGameById(gameId);
  const [copied, setCopied] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [gameId]);

  const handleCopy = async () => {
    const listToCopy =
      activeBatch.length > 0 ? activeBatch : activeBet ? [activeBet] : [];
    if (listToCopy.length === 0) return;
    try {
      await navigator.clipboard.writeText(formatBatchPlainText(listToCopy));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored quietly
    }
  };

  const estimatedSlips = Math.ceil(drawCount / game.maxBetsPerSlip);
  const isBatchView = activeBatch.length > 1 || (isAnimating && drawCount > 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDraw(false);
  };

  const showCompleteExtras =
    Boolean(activeBet) &&
    (!isAnimating ||
      (game.kind === 'numbers' &&
        revealedNumbers.length >= (activeBet?.numbers.length ?? 0)));

  const totalNumbersCount = activeBet?.numbers.length ?? pickCount;
  const isCompactBalls = totalNumbersCount > 20;

  return (
    <section
      id="gerador"
      aria-labelledby="titulo-gerador"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 scroll-mt-20 flex flex-col justify-between"
    >
      <div>
        {/* Active Game Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-slate-200">
          <div className="w-20 h-15 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            {imgFailed ? (
              <div
                className="w-full h-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: game.softBg,
                  color: game.accentText,
                }}
              >
                {game.name}
              </div>
            ) : (
              <img
                src={game.image}
                alt={`Imagem representativa da ${game.name}`}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className={`w-full h-full object-cover ${game.imagePosition ?? 'object-center'}`}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h2
                id="titulo-gerador"
                className="font-display text-xl sm:text-2xl font-bold text-slate-950"
              >
                {game.name}
              </h2>
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: game.accentText }}
              >
                {game.shortRule}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {game.description}
            </p>
          </div>
        </div>

        {/* Phrase + Official Parameters Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <label
                htmlFor="frase-aleatoriedade"
                className="text-sm font-semibold text-slate-900"
              >
                Frase da sorte para gerar a aleatoriedade
              </label>
              <span className="text-xs text-slate-500 tabular-nums">
                {phrase.trim().length > 0
                  ? `Variação #${variationIndex}`
                  : 'Obrigatório'}
              </span>
            </div>

            <input
              id="frase-aleatoriedade"
              type="text"
              value={phrase}
              onChange={(e) => onPhraseChange(e.target.value)}
              placeholder="Ex.: Prosperidade e saúde para minha família em 2026"
              aria-invalid={Boolean(phraseError)}
              aria-describedby={
                phraseError ? 'erro-frase-aleatoriedade' : 'ajuda-frase-aleatoriedade'
              }
              className={`w-full px-3.5 py-2.5 text-sm sm:text-base text-slate-950 bg-white rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                phraseError
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/10'
              }`}
            />

            {phraseError ? (
              <p
                id="erro-frase-aleatoriedade"
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-700"
              >
                {phraseError}
              </p>
            ) : (
              <p
                id="ajuda-frase-aleatoriedade"
                className="mt-1.5 text-xs text-slate-500"
              >
                Cada frase é transformada em uma semente criptográfica de 128 bits para sortear dezenas únicas sem repetição.
              </p>
            )}

            {/* Interactive phrase suggestions (functional buttons) */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1">Sugestões:</span>
              {INSPIRATION_PHRASES.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onPhraseChange(suggestion)}
                  className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer truncate max-w-[260px]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Official Rule Parameters per Game */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {game.kind === 'numbers' && !game.fixedPick && (
              <div>
                <label
                  htmlFor="qtd-dezenas"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Quantidade de dezenas ({game.minPick} a {game.maxPick})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="qtd-dezenas"
                    type="range"
                    min={game.minPick}
                    max={game.maxPick}
                    value={pickCount}
                    onChange={(e) => onPickCountChange(Number(e.target.value))}
                    className="flex-1 accent-slate-900 cursor-pointer"
                    style={{ accentColor: game.officialColor }}
                  />
                  <span className="font-mono text-sm font-bold text-slate-900 tabular-nums w-16 text-right">
                    {pickCount} dez.
                  </span>
                </div>
              </div>
            )}

            {game.kind === 'numbers' && game.fixedPick && (
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Regra de marcação
                </span>
                <p className="text-sm text-slate-800 font-medium tabular-nums">
                  {game.defaultPick} dezenas fixas por aposta
                  {game.hasHeartTeam ? ' + 1 Time do Coração' : ''}
                </p>
              </div>
            )}

            {game.hasClovers && (
              <div>
                <label
                  htmlFor="qtd-trevos"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Trevos da Sorte ({game.cloversMin} a {game.cloversMax})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="qtd-trevos"
                    type="range"
                    min={game.cloversMin ?? 2}
                    max={game.cloversMax ?? 6}
                    value={cloversCount}
                    onChange={(e) => onCloversCountChange(Number(e.target.value))}
                    className="flex-1 cursor-pointer"
                    style={{ accentColor: game.officialColor }}
                  />
                  <span className="font-mono text-sm font-bold text-slate-900 tabular-nums w-16 text-right">
                    {cloversCount} trevos
                  </span>
                </div>
              </div>
            )}

            {game.kind === 'loteca' && (
              <>
                <div>
                  <label
                    htmlFor="loteca-duplos"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Jogos Duplos (mín. 1 se 0 triplos)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="loteca-duplos"
                      type="range"
                      min={lotecaTriplos > 0 ? 0 : 1}
                      max={5}
                      value={lotecaDuplos}
                      onChange={(e) => onLotecaDuplosChange(Number(e.target.value))}
                      className="flex-1 cursor-pointer"
                      style={{ accentColor: game.officialColor }}
                    />
                    <span className="font-mono text-sm font-bold text-slate-900 tabular-nums w-16 text-right">
                      {lotecaDuplos} {lotecaDuplos === 1 ? 'duplo' : 'duplos'}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="loteca-triplos"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Jogos Triplos (0 a 3)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="loteca-triplos"
                      type="range"
                      min={0}
                      max={3}
                      value={lotecaTriplos}
                      onChange={(e) => onLotecaTriplosChange(Number(e.target.value))}
                      className="flex-1 cursor-pointer"
                      style={{ accentColor: game.officialColor }}
                    />
                    <span className="font-mono text-sm font-bold text-slate-900 tabular-nums w-16 text-right">
                      {lotecaTriplos} {lotecaTriplos === 1 ? 'triplo' : 'triplos'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Multi-Draw Selector (1 to N sorteios) */}
          <div className="pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <label
                htmlFor="qtd-sorteios"
                className="text-xs font-semibold text-slate-700"
              >
                Quantidade de sorteios (1 a {MAX_DRAW_COUNT})
              </label>
              <span className="text-xs text-slate-500 tabular-nums">
                {drawCount === 1
                  ? '1 volante oficial'
                  : `${drawCount} sorteios · ${estimatedSlips} ${
                      estimatedSlips === 1 ? 'volante oficial' : 'volantes oficiais'
                    }`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden">
                <button
                  type="button"
                  aria-label="Diminuir quantidade de sorteios"
                  onClick={() => onDrawCountChange(clampDrawCount(drawCount - 1))}
                  disabled={drawCount <= 1 || isAnimating}
                  className="px-2.5 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <input
                  id="qtd-sorteios"
                  type="number"
                  min={1}
                  max={MAX_DRAW_COUNT}
                  value={drawCount}
                  disabled={isAnimating}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      onDrawCountChange(clampDrawCount(parsed));
                    }
                  }}
                  className="w-14 text-center font-mono text-sm font-bold text-slate-900 tabular-nums py-1.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Aumentar quantidade de sorteios"
                  onClick={() => onDrawCountChange(clampDrawCount(drawCount + 1))}
                  disabled={drawCount >= MAX_DRAW_COUNT || isAnimating}
                  className="px-2.5 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Atalhos de quantidade de sorteios"
              >
                {[1, 3, 5, 10].map((preset) => {
                  const active = drawCount === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isAnimating}
                      onClick={() => onDrawCountChange(preset)}
                      className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer tabular-nums ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {preset}x
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Primary Submit CTA */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isAnimating}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity duration-150 hover:opacity-90 disabled:opacity-60 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              style={{ backgroundColor: game.officialColor }}
            >
              <Dices className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isAnimating
                  ? drawCount > 1
                    ? `Sorteando ${drawCount} jogos...`
                    : 'Sorteando números...'
                  : drawCount > 1
                    ? `Sortear ${drawCount} Jogos`
                    : 'Sortear Números'}
              </span>
            </button>

            {isAnimating && (
              <button
                type="button"
                onClick={onSkipAnimation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Revelar tudo</span>
              </button>
            )}

            {!isAnimating && activeBet && activeBet.gameId === gameId && (
              <button
                type="button"
                onClick={() => onDraw(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{drawCount > 1 ? `Gerar novos ${drawCount}` : 'Nova variação'}</span>
              </button>
            )}
          </div>
        </form>

        {/* Animated Draw Arena */}
        <div
          aria-live="polite"
          data-testid="draw-arena"
          className="mt-6 pt-5 border-t border-slate-200"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-display text-base font-bold text-slate-900">
              {isAnimating
                ? drawCount > 1
                  ? `Sorteando lote (${activeBatch.length} de ${drawCount} jogos)`
                  : 'Globo em movimento — sorteando dezenas'
                : activeBatch.length > 1 && activeBatch[0]?.gameId === gameId
                  ? `${activeBatch.length} sorteios gerados`
                  : activeBet && activeBet.gameId === gameId
                    ? 'Números sorteados'
                    : 'Resultado do sorteio'}
            </h3>

            {activeBet && activeBet.gameId === gameId && (
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {activeBatch.length > 1
                  ? `Exibindo Jogo ${selectedBatchIndex + 1}/${activeBatch.length} no volante`
                  : `Código ${activeBet.seedFingerprint} · Var. #${activeBet.variationIndex}`}
              </span>
            )}
          </div>

          {/* Kinetic Rolling Drum Display during animation */}
          <AnimatePresence>
            {isAnimating && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="mb-4 p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                    className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-base font-bold text-white shadow-sm shrink-0 tabular-nums"
                    style={{ backgroundColor: game.officialColor }}
                  >
                    {rollingValue}
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Selecionando combinações oficiais...
                    </p>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {drawCount > 1
                        ? `${activeBatch.length} de ${drawCount} sorteios concluídos`
                        : game.kind === 'loteca'
                          ? `${revealedLotecaCount} de 14 jogos definidos`
                          : `${revealedNumbers.length} de ${totalNumbersCount} dezenas reveladas`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty waiting state */}
          {(!activeBet || activeBet.gameId !== gameId) && activeBatch.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50/60">
              <p className="text-sm font-medium text-slate-700">
                Digite sua frase da sorte acima e clique em Sortear Números.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                As dezenas aparecerão aqui com animação e serão marcadas automaticamente no volante oficial ao lado.
              </p>
            </div>
          ) : isBatchView && activeBatch.length > 0 && activeBatch[0]?.gameId === gameId ? (
            /* Multi-Draw Batch List (click any draw to inspect on the Volante preview) */
            <div
              data-testid="drawn-batch-list"
              className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1"
            >
              {activeBatch.map((bet, idx) => {
                const isSelected = idx === selectedBatchIndex;
                return (
                  <motion.button
                    key={bet.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => onSelectBatchIndex(idx)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50 border-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-display text-xs font-bold text-slate-900 tabular-nums">
                        Sorteio {idx + 1} de {activeBatch.length}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                        Cód. {bet.seedFingerprint} · Var. #{bet.variationIndex}
                        {isSelected ? ' · No volante' : ''}
                      </span>
                    </div>

                    {game.kind === 'loteca' && bet.lotecaMatches ? (
                      <div className="flex flex-wrap gap-1 font-mono text-[11px] tabular-nums">
                        {bet.lotecaMatches.map((m) => (
                          <span
                            key={m.matchNumber}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold"
                          >
                            J{formatLotteryNumber(m.matchNumber)}:{m.columns.join('')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {bet.numbers.map((num) => (
                            <span
                              key={`${bet.id}-${num}`}
                              className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold text-white tabular-nums"
                              style={{ backgroundColor: game.officialColor }}
                            >
                              {formatLotteryNumber(num, game.zeroPaddedDigits)}
                            </span>
                          ))}
                        </div>
                        {(bet.clovers?.length ||
                          bet.luckyMonthName ||
                          bet.heartTeamName) && (
                          <p className="text-xs font-medium text-slate-700 tabular-nums">
                            {bet.clovers?.length
                              ? `Trevos: ${bet.clovers.join(', ')}`
                              : null}
                            {bet.luckyMonthName
                              ? `Mês de Sorte: ${bet.luckyMonthName}`
                              : null}
                            {bet.heartTeamName
                              ? `Time do Coração: ${formatLotteryNumber(
                                  (bet.heartTeamIndex ?? 0) + 1
                                )} — ${bet.heartTeamName}`
                              : null}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ) : game.kind === 'loteca' && activeBet?.lotecaMatches ? (
            /* Loteca 14-Match Reveal Grid */
            <div
              data-testid="drawn-loteca-results"
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              {activeBet.lotecaMatches.slice(0, revealedLotecaCount).map((match) => {
                const cols: readonly LotecaColumn[] = ['1', 'X', '2'];
                return (
                  <motion.div
                    key={match.matchNumber}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                  >
                    <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                      Jogo {formatLotteryNumber(match.matchNumber)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {cols.map((col) => {
                        const hit = match.columns.includes(col);
                        return (
                          <span
                            key={col}
                            className={`w-7 h-6 rounded text-xs font-mono font-bold flex items-center justify-center ${
                              hit
                                ? 'text-white'
                                : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                            style={hit ? { backgroundColor: game.officialColor } : undefined}
                          >
                            {col}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : activeBet ? (
            /* Numerical Balls Reveal */
            <div>
              <div
                data-testid="drawn-numbers-list"
                className={`flex flex-wrap ${isCompactBalls ? 'gap-1.5' : 'gap-2.5'}`}
              >
                {revealedNumbers.map((num, idx) => (
                  <motion.div
                    key={`${activeBet.id}-${num}`}
                    initial={{ opacity: 0, scale: 0.5, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 26,
                      delay: isCompactBalls ? 0 : Math.min(idx * 0.015, 0.15),
                    }}
                    className={`${
                      isCompactBalls
                        ? 'w-9 h-9 text-xs'
                        : 'w-12 h-12 sm:w-13 sm:h-13 text-base sm:text-lg'
                    } rounded-full flex items-center justify-center font-mono font-bold text-white shadow-sm tabular-nums select-all`}
                    style={{ backgroundColor: game.officialColor }}
                  >
                    {formatLotteryNumber(num, game.zeroPaddedDigits)}
                  </motion.div>
                ))}
              </div>

              {/* Extra Matrix Reveals (+Milionária Trevos, Dia de Sorte Mês, Timemania Time) */}
              {game.hasClovers && revealedClovers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Trevos da Sorte
                  </p>
                  <div className="flex flex-wrap gap-2" data-testid="drawn-clovers-list">
                    {revealedClovers.map((clover) => (
                      <motion.div
                        key={`clover-${clover}`}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold text-slate-900 bg-slate-100 border border-slate-200 tabular-nums"
                      >
                        <Clover
                          className="w-4 h-4"
                          style={{ color: game.officialColor }}
                          aria-hidden="true"
                        />
                        <span>Trevo {clover}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {showCompleteExtras && activeBet.luckyMonthName && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2.5"
                >
                  <Calendar
                    className="w-4 h-4 shrink-0"
                    style={{ color: game.officialColor }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    Mês de Sorte:
                  </span>
                  <span
                    data-testid="drawn-lucky-month"
                    className="font-display text-base font-bold text-slate-950"
                  >
                    {activeBet.luckyMonthName}
                  </span>
                </motion.div>
              )}

              {showCompleteExtras && activeBet.heartTeamName && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2.5"
                >
                  <Shield
                    className="w-4 h-4 shrink-0"
                    style={{ color: game.officialColor }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    Time do Coração:
                  </span>
                  <span
                    data-testid="drawn-heart-team"
                    className="font-display text-base font-bold text-slate-950 tabular-nums"
                  >
                    {formatLotteryNumber((activeBet.heartTeamIndex ?? 0) + 1)} —{' '}
                    {activeBet.heartTeamName}
                  </span>
                </motion.div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Post-Draw Action Bar */}
      {activeBet && activeBet.gameId === gameId && !isAnimating && (
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            {activeBatch.length > 1
              ? `${activeBatch.length} apostas salvas automaticamente no histórico local.`
              : 'Aposta salva automaticamente no histórico local deste dispositivo.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{activeBatch.length > 1 ? 'Copiar todos' : 'Copiar'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenPdfModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: game.officialColor }}
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {activeBatch.length > 1
                  ? `Salvar ${activeBatch.length} Jogos em PDF`
                  : 'Salvar PDF p/ Cartão'}
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
