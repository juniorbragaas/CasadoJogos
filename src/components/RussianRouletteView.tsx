import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ClipboardList,
  Dices,
  Gift,
  Lock,
  RotateCcw,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  computeWheelSpinTargets,
  drawTwoRouletteNumbers,
  formatCardNumber,
  getChosenRouletteNumbers,
  getPrizeDescription,
  PrizeCard,
  RouletteDrawRecord,
  TOTAL_ROULETTE_CARDS,
} from '../utils/russianRouletteEngine';
import {
  playRouletteChime,
  RussianRouletteWheel,
  SpinAnimationPlan,
} from './RussianRouletteWheel';
import { RussianRoulettePrizesView } from './RussianRoulettePrizesView';

export type RussianRouletteSubmenu = 'cadastro' | 'sorteio';

type DrawPhase = 'idle' | 'spinning' | 'choose' | 'revealed';

interface RussianRouletteViewProps {
  activeSubmenu: RussianRouletteSubmenu;
  prizeCards: PrizeCard[];
  history: RouletteDrawRecord[];
  onChangeSubmenu: (submenu: RussianRouletteSubmenu) => void;
  onSaveCard: (cardNumber: number, description: string) => void;
  onShuffleCards: () => void;
  onRestoreDefaultCards: () => void;
  onClearAllCards: () => void;
  onAddHistoryRecord: (record: RouletteDrawRecord) => void;
  onClearHistory: () => void;
}

export function RussianRouletteView({
  activeSubmenu,
  prizeCards,
  history,
  onChangeSubmenu,
  onSaveCard,
  onShuffleCards,
  onRestoreDefaultCards,
  onClearAllCards,
  onAddHistoryRecord,
  onClearHistory,
}: RussianRouletteViewProps) {
  const [phase, setPhase] = useState<DrawPhase>('idle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [avoidRepeatingOpened, setAvoidRepeatingOpened] = useState(false);

  // Wheel kinematic angles
  const [pointerDeg, setPointerDeg] = useState(108); // Starts resting gracefully around 3-4 o'clock like the reference
  const [innerRingDeg, setInnerRingDeg] = useState(0);
  const [secondaryPointerDeg, setSecondaryPointerDeg] = useState<number | null>(null);
  const [spinPlan, setSpinPlan] = useState<SpinAnimationPlan | null>(null);
  const spinCounterRef = useRef(0);

  // Active round state: always 2 drawn numbers -> user chooses 1 -> clicks "Abrir Cartão" to reveal red/white card
  const [drawnPair, setDrawnPair] = useState<[number, number] | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [revealedCard, setRevealedCard] = useState<{
    number: number;
    description: string;
  } | null>(null);

  const openedCardNumbers = useMemo(
    () => getChosenRouletteNumbers(history, null),
    [history]
  );

  const chosenWheelNumbers = useMemo(
    () =>
      getChosenRouletteNumbers(
        history,
        phase === 'spinning' ? null : selectedNumber
      ),
    [history, phase, selectedNumber]
  );

  const canSpin = useMemo(() => {
    if (phase === 'spinning') return false;
    if (!avoidRepeatingOpened) return true;
    return TOTAL_ROULETTE_CARDS - openedCardNumbers.length >= 2;
  }, [phase, avoidRepeatingOpened, openedCardNumbers.length]);

  const handleStartSpin = useCallback(() => {
    if (phase === 'spinning') return;
    const excluded = avoidRepeatingOpened ? openedCardNumbers : [];
    const nextPair = drawTwoRouletteNumbers(excluded);
    if (!nextPair) return;

    const targets = computeWheelSpinTargets(pointerDeg, innerRingDeg, nextPair);
    spinCounterRef.current += 1;

    setDrawnPair(null);
    setSelectedNumber(null);
    setRevealedCard(null);
    setSecondaryPointerDeg(null);
    setSpinPlan({
      id: spinCounterRef.current,
      startPointerDeg: pointerDeg,
      targetPointerDeg: targets.nextPointerDeg,
      startInnerRingDeg: innerRingDeg,
      targetInnerRingDeg: targets.nextInnerRingDeg,
      secondaryPointerDeg: targets.secondaryPointerDeg,
      pair: nextPair,
    });
    setPhase('spinning');
  }, [phase, avoidRepeatingOpened, openedCardNumbers, pointerDeg, innerRingDeg]);

  const handleSpinComplete = useCallback(
    (completedPlan: SpinAnimationPlan) => {
      setPointerDeg(completedPlan.targetPointerDeg);
      setInnerRingDeg(completedPlan.targetInnerRingDeg);
      setSecondaryPointerDeg(completedPlan.secondaryPointerDeg);
      setDrawnPair(completedPlan.pair);
      setSelectedNumber(null);
      setRevealedCard(null);
      setPhase('choose');
      if (soundEnabled) playRouletteChime('stop');
    },
    [soundEnabled]
  );

  const handleOpenSelectedCard = useCallback(() => {
    if (phase !== 'choose' || selectedNumber === null || !drawnPair) return;
    const prizeDescription = getPrizeDescription(prizeCards, selectedNumber);
    setRevealedCard({
      number: selectedNumber,
      description: prizeDescription,
    });
    setPhase('revealed');
    if (soundEnabled) playRouletteChime('reveal');

    onAddHistoryRecord({
      id: `rr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      drawnPair,
      chosenNumber: selectedNumber,
      prizeDescription,
    });
  }, [phase, selectedNumber, drawnPair, prizeCards, soundEnabled, onAddHistoryRecord]);

  const filledCount = useMemo(
    () => prizeCards.filter((c) => c.description.trim().length > 0).length,
    [prizeCards]
  );

  return (
    <div id="roleta-russa-topo" className="space-y-6 scroll-mt-20">
      {/* Module Header & Submenu Switcher */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Roleta da Sorte — Prêmios de 1 a 60
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 tabular-nums">
            {activeSubmenu === 'sorteio'
              ? 'Giro de 8 segundos sorteando 2 números · Escolha um cartão e clique em Abrir Cartão para revelar o prêmio'
              : `Cadastre a descrição dos prêmios do Cartão 01 ao Cartão 60 (${filledCount}/60 cadastrados)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Submenu Segmented Navigation */}
          <div
            role="tablist"
            aria-label="Submenus da Roleta da Sorte"
            className="inline-flex rounded-lg border border-slate-200 bg-white p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeSubmenu === 'sorteio'}
              onClick={() => onChangeSubmenu('sorteio')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeSubmenu === 'sorteio'
                  ? 'bg-[#B91C1C] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Dices className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sorteios</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSubmenu === 'cadastro'}
              onClick={() => onChangeSubmenu('cadastro')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeSubmenu === 'cadastro'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cadastro de Prêmios</span>
            </button>
          </div>

          {activeSubmenu === 'sorteio' && (
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Desativar som da roleta' : 'Ativar som da roleta'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#B91C1C]" aria-hidden="true" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              )}
              <span>{soundEnabled ? 'Som ligado' : 'Som desligado'}</span>
            </button>
          )}
        </div>
      </section>

      {activeSubmenu === 'cadastro' ? (
        <RussianRoulettePrizesView
          prizeCards={prizeCards}
          openedCardNumbers={openedCardNumbers}
          onSaveCard={onSaveCard}
          onShuffleCards={onShuffleCards}
          onRestoreDefaults={onRestoreDefaultCards}
          onClearAllCards={onClearAllCards}
          onGoToDraw={() => onChangeSubmenu('sorteio')}
        />
      ) : (
        <div className="space-y-6">
          {/* Main 2-Column Draw Stage: Left Gold/Obsidian Wheel + Right Selection & Red Prize Card Reveal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: 8-Second Dual-Ring Roulette Wheel */}
            <section
              id="roleta-russa-roda"
              aria-label="Roleta da Sorte animada de 8 segundos"
              className="lg:col-span-7 space-y-4 scroll-mt-20"
            >
              <RussianRouletteWheel
                isSpinning={phase === 'spinning'}
                canSpin={canSpin}
                spinPlan={spinPlan}
                pointerDeg={pointerDeg}
                innerRingDeg={innerRingDeg}
                secondaryPointerDeg={secondaryPointerDeg}
                drawnPair={drawnPair}
                selectedNumber={selectedNumber}
                chosenCardNumbers={chosenWheelNumbers}
                soundEnabled={soundEnabled}
                onSpinRequest={handleStartSpin}
                onSpinComplete={handleSpinComplete}
              />

              {/* Primary Spin Controls beneath the wheel */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={avoidRepeatingOpened}
                    onChange={(e) => setAvoidRepeatingOpened(e.target.checked)}
                    disabled={phase === 'spinning'}
                    className="w-4 h-4 rounded border-slate-300 accent-[#B91C1C]"
                  />
                  <span>
                    Não repetir cartões já abertos ({TOTAL_ROULETTE_CARDS - openedCardNumbers.length} livres)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleStartSpin}
                  disabled={phase === 'spinning' || !canSpin}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs whitespace-nowrap"
                >
                  <Dices className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {phase === 'spinning'
                      ? 'Girando Roleta (8s)...'
                      : !canSpin
                        ? 'Menos de 2 cartões livres'
                        : drawnPair
                          ? 'Girar Novamente (8s)'
                          : 'Girar Roleta (8s)'}
                  </span>
                </button>
              </div>
            </section>

            {/* Right Column: 2-Number Choice -> "Abrir Cartão" -> Red Card with White Text */}
            <section
              aria-label="Escolha e revelação do cartão premiado"
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3.5">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-950">
                    Cartão do Sorteio
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    A roleta sorteia 2 números e você escolhe qual abrir.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeSubmenu('cadastro')}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-950 underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  Editar 1–60
                </button>
              </div>

              <AnimatePresence mode="wait">
                {phase === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center space-y-3"
                  >
                    <span className="w-12 h-12 rounded-full bg-[#B91C1C]/10 text-[#B91C1C] inline-flex items-center justify-center">
                      <Gift className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <div className="space-y-1">
                      <p className="font-display text-base font-bold text-slate-900">
                        Pronto para o sorteio
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Clique em <strong className="text-slate-900">GIRAR</strong> no centro da roleta. Após 8 segundos, dois números serão sorteados para você escolher qual cartão abrir.
                      </p>
                    </div>
                  </motion.div>
                )}

                {phase === 'spinning' && (
                  <motion.div
                    key="spinning"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl bg-slate-950 text-white border border-amber-500/40 p-6 text-center space-y-3"
                  >
                    <span className="w-12 h-12 rounded-full bg-amber-400/15 text-amber-300 inline-flex items-center justify-center animate-pulse">
                      <Sparkles className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <div className="space-y-1">
                      <p className="font-display text-lg font-bold text-amber-200">
                        Roleta girando...
                      </p>
                      <p className="text-xs sm:text-sm text-slate-300">
                        Aguarde os 8 segundos até o ponteiro parar nos 2 números sorteados.
                      </p>
                    </div>
                  </motion.div>
                )}

                {phase === 'choose' && drawnPair && (
                  <motion.div
                    key={`choose-${drawnPair[0]}-${drawnPair[1]}`}
                    data-testid="roleta-choice-panel"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-950 font-medium">
                      A roleta parou nos números{' '}
                      <strong className="font-mono">{formatCardNumber(drawnPair[0])}</strong> e{' '}
                      <strong className="font-mono">{formatCardNumber(drawnPair[1])}</strong>. Escolha qual cartão você quer abrir:
                    </div>

                    {/* Two Sealed Selectable Number Cards (NO prize text shown yet!) */}
                    <div
                      role="radiogroup"
                      aria-label="Escolha um dos dois números sorteados"
                      className="grid grid-cols-2 gap-3"
                    >
                      {drawnPair.map((num, idx) => {
                        const isPicked = selectedNumber === num;
                        const alreadyOpened = openedCardNumbers.includes(num);
                        const isRedSlot = num % 2 === 1;
                        return (
                          <button
                            key={num}
                            type="button"
                            role="radio"
                            aria-checked={isPicked}
                            data-testid={`roleta-option-${idx + 1}`}
                            data-card-option={num}
                            onClick={() => setSelectedNumber(num)}
                            className={`relative rounded-xl p-4 border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                              isPicked
                                ? 'border-[#B91C1C] bg-red-50/70 shadow-sm scale-[1.01]'
                                : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-[11px] font-semibold text-slate-500">
                              {idx === 0 ? '1º Número (Anel Ext.)' : '2º Número (Anel Int.)'}
                            </span>

                            <span
                              className={`w-16 h-16 rounded-full flex items-center justify-center font-mono text-2xl font-extrabold tabular-nums border-2 shadow-md ${
                                isPicked || alreadyOpened
                                  ? 'bg-white text-slate-900 border-slate-300'
                                  : isRedSlot
                                    ? 'bg-[#B91C1C] text-white border-amber-400'
                                    : 'bg-slate-900 text-white border-amber-400'
                              }`}
                            >
                              {formatCardNumber(num)}
                            </span>

                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                              <Lock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                              <span>Cartão {formatCardNumber(num)}</span>
                            </span>

                            <span className="text-[11px] text-slate-500">
                              {isPicked
                                ? 'Selecionado'
                                : alreadyOpened
                                  ? 'Já escolhido antes'
                                  : 'Clique para escolher'}
                            </span>

                            {isPicked && (
                              <CheckCircle2
                                className="w-5 h-5 text-[#B91C1C] absolute top-2.5 right-2.5"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explicit "Abrir Cartão" Button — Prize stays hidden until clicked */}
                    <button
                      type="button"
                      onClick={handleOpenSelectedCard}
                      disabled={selectedNumber === null}
                      data-testid="roleta-open-card-btn"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-bold text-white bg-[#C81E1E] hover:bg-[#991B1B] rounded-xl transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Gift className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <span>
                        {selectedNumber !== null
                          ? `Abrir Cartão ${formatCardNumber(selectedNumber)}`
                          : 'Abrir Cartão'}
                      </span>
                    </button>

                    <p className="text-[11px] text-slate-500 text-center">
                      A descrição do prêmio só é revelada após clicar em <strong className="text-slate-700">Abrir Cartão</strong>.
                    </p>
                  </motion.div>
                )}

                {phase === 'revealed' && revealedCard && drawnPair && (
                  <motion.div
                    key={`revealed-${revealedCard.number}`}
                    initial={{ opacity: 0, scale: 0.92, rotateY: -20 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="space-y-4"
                  >
                    {/* Mandatory RED Card with WHITE Text showing Card Number & Prize Description */}
                    <div
                      data-testid="roleta-revealed-card"
                      role="status"
                      className="rounded-2xl bg-[#C81E1E] text-white border-2 border-red-300/60 p-6 sm:p-7 shadow-lg text-center space-y-4"
                    >
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-bold tracking-wider uppercase text-white">
                        <Gift className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Cartão {formatCardNumber(revealedCard.number)}</span>
                      </div>

                      <div className="space-y-2 py-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/85">
                          Prêmio Revelado
                        </p>
                        <p
                          data-testid="roleta-revealed-prize-text"
                          className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-snug break-words"
                        >
                          {revealedCard.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/25 text-xs text-white/90 tabular-nums">
                        Números sorteados nesta rodada:{' '}
                        <strong className="text-white">
                          {formatCardNumber(drawnPair[0])}
                        </strong>{' '}
                        e{' '}
                        <strong className="text-white">
                          {formatCardNumber(drawnPair[1])}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartSpin}
                      disabled={!canSpin}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Novo Sorteio (8s)</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* Recent Russian Roulette Draws History */}
          <section
            aria-label="Histórico de sorteios da Roleta da Sorte"
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-950">
                  Histórico de Cartões Abertos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  {history.length === 0
                    ? 'Nenhum cartão aberto ainda.'
                    : `${history.length} ${history.length === 1 ? 'cartão revelado' : 'cartões revelados'} localmente`}
                </p>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-300 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Limpar histórico</span>
                </button>
              )}
            </div>

            {history.length > 0 && (
              <div className="divide-y divide-slate-100">
                {history.slice(0, 12).map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2.5 py-1 rounded-md bg-[#C81E1E] text-white font-mono text-xs font-bold tabular-nums shrink-0">
                        Cartão {formatCardNumber(item.chosenNumber)}
                      </span>
                      <span className="font-semibold text-slate-900 truncate">
                        {item.prizeDescription}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
                      Par sorteado: {formatCardNumber(item.drawnPair[0])} /{' '}
                      {formatCardNumber(item.drawnPair[1])}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
