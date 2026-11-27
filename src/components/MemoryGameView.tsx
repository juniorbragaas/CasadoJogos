import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ImagePlus, Play, Trophy, Users } from 'lucide-react';
import {
  addMemoryParticipant,
  computeMemoryBoardMetrics,
  createShuffledMemoryDeck,
  DEFAULT_MEMORY_FIGURES,
  evaluateMemoryTurn,
  getMemoryChampionSummary,
  MEMORY_MAX_PAIRS,
  MEMORY_MISMATCH_DELAY_MS,
  MEMORY_PREVIEW_DURATION_MS,
  MemoryCard,
  MemoryChampionSummary,
  MemoryFigure,
  MemoryGamePhase,
  MemoryParticipant,
  removeMemoryParticipant,
  renameMemoryParticipant,
  resetParticipantScores,
} from '../utils/memoryGameEngine';
import {
  addCustomMemoryFigures,
  clearCustomMemoryFigures,
  deleteCustomMemoryFigure,
  loadCustomMemoryFigures,
  loadIncludeBuiltinsPref,
  loadMemoryParticipants,
  saveIncludeBuiltinsPref,
  saveMemoryParticipants,
} from '../utils/memoryGameDb';
import { MemoryCardBackBlueM, MemoryFigureFace } from './MemoryCardArt';
import {
  MemoryChampionModal,
  MemoryFiguresModal,
  MemoryParticipantsModal,
} from './MemoryModals';

function playMemoryAudio(kind: 'flip' | 'match' | 'mismatch' | 'start' | 'win') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const tone = (freq: number, startOffset: number, dur: number, vol = 0.05) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(vol, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + dur + 0.01);
    };

    if (kind === 'flip') {
      tone(380, 0, 0.06, 0.04);
      window.setTimeout(() => void ctx.close(), 150);
    } else if (kind === 'match') {
      tone(523.25, 0, 0.12, 0.06);
      tone(659.25, 0.09, 0.16, 0.06);
      window.setTimeout(() => void ctx.close(), 340);
    } else if (kind === 'mismatch') {
      tone(290, 0, 0.11, 0.045);
      tone(220, 0.1, 0.14, 0.045);
      window.setTimeout(() => void ctx.close(), 320);
    } else if (kind === 'start') {
      tone(440, 0, 0.08, 0.05);
      tone(554.37, 0.08, 0.1, 0.05);
      tone(659.25, 0.16, 0.14, 0.05);
      window.setTimeout(() => void ctx.close(), 400);
    } else if (kind === 'win') {
      tone(523.25, 0, 0.12, 0.06);
      tone(659.25, 0.1, 0.12, 0.06);
      tone(783.99, 0.2, 0.14, 0.06);
      tone(1046.5, 0.32, 0.28, 0.07);
      window.setTimeout(() => void ctx.close(), 700);
    }
  } catch {
    // Ignore browser autoplay restrictions
  }
}

export function MemoryGameView() {
  const [participants, setParticipants] = useState<MemoryParticipant[]>(() =>
    loadMemoryParticipants()
  );
  const [customFigures, setCustomFigures] = useState<MemoryFigure[]>([]);
  const [includeBuiltins, setIncludeBuiltins] = useState<boolean>(() =>
    loadIncludeBuiltinsPref()
  );

  const [cards, setCards] = useState<MemoryCard[]>(() =>
    createShuffledMemoryDeck([], DEFAULT_MEMORY_FIGURES, {
      maxPairs: MEMORY_MAX_PAIRS,
      includeBuiltins: true,
      roundSeed: 1,
    })
  );
  const [phase, setPhase] = useState<MemoryGamePhase>('idle');
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [isResolvingTurn, setIsResolvingTurn] = useState(false);
  const [championSummary, setChampionSummary] =
    useState<MemoryChampionSummary | null>(null);

  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [figuresModalOpen, setFiguresModalOpen] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const roundCounterRef = useRef(2);
  const timersRef = useRef<number[]>([]);
  const previewIntervalRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (previewIntervalRef.current !== null) {
      window.clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  }, []);

  // Load saved custom figures from IndexedDB on mount
  useEffect(() => {
    let active = true;
    loadCustomMemoryFigures().then((loaded) => {
      if (!active) return;
      setCustomFigures(loaded);
      if (loaded.length > 0) {
        roundCounterRef.current += 1;
        setCards(
          createShuffledMemoryDeck(loaded, DEFAULT_MEMORY_FIGURES, {
            maxPairs: MEMORY_MAX_PAIRS,
            includeBuiltins: loadIncludeBuiltinsPref(),
            roundSeed: roundCounterRef.current,
          })
        );
      }
    });
    return () => {
      active = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Persist participants to localStorage
  useEffect(() => {
    saveMemoryParticipants(participants);
  }, [participants]);

  // Persist includeBuiltins pref
  useEffect(() => {
    saveIncludeBuiltinsPref(includeBuiltins);
  }, [includeBuiltins]);

  // Lock page scrollbars while Memory Game fills the viewport
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Measure available board stage so ALL cards (up to 32) fit cleanly with zero scrollbars
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const nextW = Math.floor(rect.width);
      const nextH = Math.floor(rect.height);
      setStageSize((prev) =>
        prev.width === nextW && prev.height === nextH
          ? prev
          : { width: nextW, height: nextH }
      );
    };

    updateSize();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize);
      observer.observe(el);
    }
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  const boardMetrics = useMemo(
    () =>
      computeMemoryBoardMetrics(
        stageSize.width,
        stageSize.height,
        cards.length
      ),
    [stageSize.width, stageSize.height, cards.length]
  );

  const safePlayerIndex =
    participants.length > 0 ? currentPlayerIndex % participants.length : 0;
  const activeParticipant = participants[safePlayerIndex] ?? null;

  const totalPairs = Math.floor(cards.length / 2);
  const matchedPairs = useMemo(
    () => cards.filter((c) => c.isMatched).length / 2,
    [cards]
  );

  const totalFigurePool =
    customFigures.length + (includeBuiltins ? DEFAULT_MEMORY_FIGURES.length : 0);

  const rebuildIdleDeck = useCallback(
    (nextCustom: readonly MemoryFigure[], nextIncludeBuiltins: boolean) => {
      roundCounterRef.current += 1;
      setCards(
        createShuffledMemoryDeck(nextCustom, DEFAULT_MEMORY_FIGURES, {
          maxPairs: MEMORY_MAX_PAIRS,
          includeBuiltins: nextIncludeBuiltins,
          roundSeed: roundCounterRef.current,
        })
      );
    },
    []
  );

  const handleStartGame = useCallback(() => {
    clearAllTimers();
    playMemoryAudio('start');

    roundCounterRef.current += 1;
    const freshDeck = createShuffledMemoryDeck(
      customFigures,
      DEFAULT_MEMORY_FIGURES,
      {
        maxPairs: MEMORY_MAX_PAIRS,
        includeBuiltins,
        roundSeed: roundCounterRef.current,
      }
    );

    setChampionSummary(null);
    setParticipants((prev) => resetParticipantScores(prev));
    setCurrentPlayerIndex(0);
    setOpenIds([]);
    setIsResolvingTurn(false);
    setCards(freshDeck);
    setPhase('preview');
    setPreviewSecondsLeft(4);

    // 4-second countdown revealing all cards face-up
    const startedAt = Date.now();
    previewIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingSec = Math.max(
        0,
        Math.ceil((MEMORY_PREVIEW_DURATION_MS - elapsed) / 1000)
      );
      setPreviewSecondsLeft(remainingSec);
    }, 200);

    const endPreviewTimer = window.setTimeout(() => {
      if (previewIntervalRef.current !== null) {
        window.clearInterval(previewIntervalRef.current);
        previewIntervalRef.current = null;
      }
      setPreviewSecondsLeft(0);
      setPhase('playing');
    }, MEMORY_PREVIEW_DURATION_MS);

    timersRef.current.push(endPreviewTimer);
  }, [clearAllTimers, customFigures, includeBuiltins]);

  const handleCardClick = useCallback(
    (card: MemoryCard) => {
      if (phase !== 'playing') return;
      if (isResolvingTurn) return;
      if (card.isMatched) return;
      if (openIds.includes(card.instanceId)) return;

      playMemoryAudio('flip');

      if (openIds.length === 0) {
        setOpenIds([card.instanceId]);
        return;
      }

      if (openIds.length === 1) {
        const firstId = openIds[0];
        const secondId = card.instanceId;
        setOpenIds([firstId, secondId]);
        setIsResolvingTurn(true);

        const resolution = evaluateMemoryTurn(
          cards,
          participants,
          safePlayerIndex,
          firstId,
          secondId
        );

        if (resolution.isMatch) {
          const matchTimer = window.setTimeout(() => {
            playMemoryAudio(resolution.isGameComplete ? 'win' : 'match');
            setCards(resolution.updatedCards);
            setParticipants(resolution.updatedParticipants);
            setCurrentPlayerIndex(resolution.nextPlayerIndex);
            setOpenIds([]);
            setIsResolvingTurn(false);

            if (resolution.isGameComplete) {
              const summary = getMemoryChampionSummary(
                resolution.updatedParticipants,
                Math.floor(resolution.updatedCards.length / 2)
              );

              // Show the final matched pair briefly, then open Champion Modal AND reshuffle cards!
              const finishTimer = window.setTimeout(() => {
                setChampionSummary(summary);
                setPhase('finished');
                roundCounterRef.current += 1;
                setCards(
                  createShuffledMemoryDeck(
                    customFigures,
                    DEFAULT_MEMORY_FIGURES,
                    {
                      maxPairs: MEMORY_MAX_PAIRS,
                      includeBuiltins,
                      roundSeed: roundCounterRef.current,
                    }
                  )
                );
              }, 550);
              timersRef.current.push(finishTimer);
            }
          }, 320);

          timersRef.current.push(matchTimer);
        } else {
          const mismatchTimer = window.setTimeout(() => {
            playMemoryAudio('mismatch');
            setOpenIds([]);
            setCurrentPlayerIndex(resolution.nextPlayerIndex);
            setIsResolvingTurn(false);
          }, MEMORY_MISMATCH_DELAY_MS);

          timersRef.current.push(mismatchTimer);
        }
      }
    },
    [
      phase,
      isResolvingTurn,
      openIds,
      cards,
      participants,
      safePlayerIndex,
      customFigures,
      includeBuiltins,
    ]
  );

  // Participant modal handlers
  const handleAddParticipant = useCallback((name: string) => {
    setParticipants((prev) => addMemoryParticipant(prev, name));
  }, []);

  const handleRenameParticipant = useCallback((id: string, name: string) => {
    setParticipants((prev) => renameMemoryParticipant(prev, id, name));
  }, []);

  const handleRemoveParticipant = useCallback((id: string) => {
    setParticipants((prev) => removeMemoryParticipant(prev, id));
  }, []);

  // Figure modal handlers
  const handleUploadFigures = useCallback(
    async (files: File[]) => {
      const added = await addCustomMemoryFigures(files);
      setCustomFigures((prev) => {
        const next = [...prev, ...added];
        if (phase === 'idle' || phase === 'finished') {
          rebuildIdleDeck(next, includeBuiltins);
        }
        return next;
      });
    },
    [phase, includeBuiltins, rebuildIdleDeck]
  );

  const handleDeleteCustomFigure = useCallback(
    async (id: string) => {
      await deleteCustomMemoryFigure(id);
      setCustomFigures((prev) => {
        const next = prev.filter((f) => f.id !== id);
        if (phase === 'idle' || phase === 'finished') {
          rebuildIdleDeck(next, includeBuiltins);
        }
        return next;
      });
    },
    [phase, includeBuiltins, rebuildIdleDeck]
  );

  const handleClearCustomFigures = useCallback(async () => {
    await clearCustomMemoryFigures();
    setCustomFigures([]);
    if (phase === 'idle' || phase === 'finished') {
      rebuildIdleDeck([], true);
    }
    setIncludeBuiltins(true);
  }, [phase, rebuildIdleDeck]);

  const handleToggleIncludeBuiltins = useCallback(
    (nextValue: boolean) => {
      setIncludeBuiltins(nextValue);
      if (phase === 'idle' || phase === 'finished') {
        rebuildIdleDeck(customFigures, nextValue);
      }
    },
    [phase, customFigures, rebuildIdleDeck]
  );

  const isCompactCard =
    boardMetrics.cardWidth > 0 && boardMetrics.cardWidth < 80;

  return (
    <section
      id="jogo-memoria-mesa"
      aria-label="Jogo da Memória"
      className="relative flex-1 min-h-0 w-full my-1.5 sm:my-2 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 bg-[#F1F5F9] text-slate-900 shadow-sm flex flex-col"
    >
      {/* 1. Inline On-Screen Top Menu Bar */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-3 sm:px-5 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="font-display text-sm sm:text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap">
            Jogo da Memória
          </h1>

          {/* Live game status indicator */}
          <span
            data-testid={
              phase === 'preview' ? 'memory-preview-banner' : 'memory-status-text'
            }
            className={`text-[11px] sm:text-xs font-semibold truncate tabular-nums transition-colors ${
              phase === 'preview'
                ? 'px-2.5 py-0.5 rounded-lg bg-blue-600 text-white shadow-2xs'
                : phase === 'playing'
                  ? 'text-emerald-700'
                  : 'text-slate-500'
            }`}
          >
            {phase === 'preview'
              ? `Memorize as cartas · ${previewSecondsLeft}s`
              : phase === 'playing' && activeParticipant
                ? `Vez de ${activeParticipant.name}`
                : `${totalPairs} pares (${cards.length} cartas)`}
          </span>
        </div>

        {/* Inline Menu Options: Participantes | Figuras | Começar */}
        <div
          data-testid="memory-inline-menu"
          className="flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          <button
            type="button"
            data-testid="memory-menu-participantes-btn"
            onClick={() => setParticipantsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
            <span>Participantes</span>
          </button>

          <button
            type="button"
            data-testid="memory-menu-figuras-btn"
            onClick={() => setFiguresModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <ImagePlus className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
            <span>Figuras ({totalFigurePool})</span>
          </button>

          <button
            type="button"
            data-testid="memory-menu-comecar-btn"
            onClick={handleStartGame}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
            <span>Começar</span>
          </button>
        </div>
      </div>

      {/* 2. Main Split Workspace: Left Auto-Fitted Board (up to 32 cards) + Right Participants Scoreboard */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Left/Center: Card Board Stage */}
        <div
          ref={stageRef}
          data-testid="memory-board-stage"
          className="relative flex-1 min-w-0 min-h-0 p-2 sm:p-4 overflow-hidden flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#1E293B_0%,#0F172A_100%)]"
        >
          {boardMetrics.cardWidth > 0 && (
            <div
              data-testid="memory-card-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${boardMetrics.columns}, ${boardMetrics.cardWidth}px)`,
                gridTemplateRows: `repeat(${boardMetrics.rows}, ${boardMetrics.cardHeight}px)`,
                gap: `${boardMetrics.gap}px`,
                width: `${boardMetrics.totalWidth}px`,
                height: `${boardMetrics.totalHeight}px`,
              }}
            >
              {cards.map((card, idx) => {
                const isRevealed =
                  phase === 'preview' ||
                  card.isMatched ||
                  openIds.includes(card.instanceId);

                const canClick =
                  phase === 'playing' &&
                  !isResolvingTurn &&
                  !card.isMatched &&
                  !openIds.includes(card.instanceId);

                return (
                  <motion.div
                    key={card.instanceId}
                    layout
                    transition={{
                      layout: { type: 'spring', stiffness: 310, damping: 28 },
                    }}
                    className="bks-perspective w-full h-full"
                  >
                    <button
                      type="button"
                      data-testid={`memory-card-${idx}`}
                      data-figure-id={card.figureId}
                      data-revealed={isRevealed ? 'true' : 'false'}
                      data-matched={card.isMatched ? 'true' : 'false'}
                      disabled={!canClick && phase === 'playing' && !isRevealed}
                      onClick={() => handleCardClick(card)}
                      aria-label={
                        isRevealed
                          ? `Carta ${idx + 1}: ${card.figure.name}${card.isMatched ? ' (par encontrado)' : ''}`
                          : `Carta ${idx + 1} virada para baixo`
                      }
                      className={`group relative w-full h-full ${
                        isCompactCard ? 'rounded-md' : 'rounded-xl'
                      } text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-transform duration-150 ${
                        canClick
                          ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.97]'
                          : 'cursor-default'
                      } ${
                        card.isMatched
                          ? 'opacity-95 ring-2 ring-emerald-400 shadow-[0_6px_18px_rgba(16,185,129,0.28)]'
                          : 'shadow-[0_6px_16px_rgba(0,0,0,0.35)]'
                      }`}
                    >
                      <div
                        className={`bks-card-inner ${isRevealed ? 'bks-is-flipped' : ''}`}
                      >
                        {/* BACK FACE: Royal Blue card with white border, white circle, and white M */}
                        <div
                          className={`bks-card-face bks-card-face-back ${
                            isCompactCard ? '!rounded-md' : '!rounded-xl'
                          }`}
                        >
                          <MemoryCardBackBlueM />
                        </div>

                        {/* FRONT FACE: Figure image or vector emblem */}
                        <div
                          className={`bks-card-face bks-card-face-front bg-white ${
                            isCompactCard ? '!rounded-md' : '!rounded-xl'
                          }`}
                        >
                          <MemoryFigureFace
                            figure={card.figure}
                            compact={isCompactCard}
                            isMatched={card.isMatched}
                          />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Participants & Live Score Panel */}
        <aside
          data-testid="memory-participants-panel"
          aria-label="Placar dos participantes"
          className="w-28 sm:w-52 lg:w-64 shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden"
        >
          <div className="px-2 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between gap-1">
              <h2 className="font-display text-[11px] sm:text-sm font-bold text-slate-950 truncate">
                Participantes
              </h2>
              <Trophy className="hidden sm:block w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
            </div>
            <p
              data-testid="memory-pairs-progress"
              className="text-[10px] sm:text-xs text-slate-500 tabular-nums mt-0.5"
            >
              {matchedPairs}/{totalPairs} pares
            </p>
          </div>

          <ul className="flex-1 overflow-y-auto p-1.5 sm:p-3 space-y-1.5 sm:space-y-2">
            {participants.map((player, index) => {
              const isActiveTurn =
                (phase === 'playing' || phase === 'preview') &&
                index === safePlayerIndex;

              return (
                <li
                  key={player.id}
                  data-testid={`memory-player-row-${index}`}
                  data-active-turn={isActiveTurn ? 'true' : 'false'}
                  className={`rounded-xl border px-2 sm:px-3 py-2 transition-all ${
                    isActiveTurn
                      ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600/20 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1 min-w-0">
                      {isActiveTurn && (
                        <ArrowRight
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`text-[11px] sm:text-sm font-bold truncate ${
                          isActiveTurn ? 'text-blue-950' : 'text-slate-800'
                        }`}
                      >
                        {player.name}
                      </span>
                    </span>

                    <span
                      data-testid={`memory-player-score-${index}`}
                      className={`font-mono text-xs sm:text-sm font-bold tabular-nums shrink-0 ${
                        isActiveTurn ? 'text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      {player.score}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-0.5 text-[10px] sm:text-[11px]">
                    <span
                      className={
                        isActiveTurn
                          ? 'font-semibold text-blue-700'
                          : 'text-slate-500'
                      }
                    >
                      {isActiveTurn
                        ? phase === 'preview'
                          ? 'Inicia'
                          : 'Sua vez'
                        : 'Aguardando'}
                    </span>
                    <span className="text-slate-500 tabular-nums hidden sm:inline">
                      {player.score === 1 ? '1 par' : `${player.score} pares`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Quiet hint at bottom of scoreboard */}
          <div className="px-2.5 sm:px-3.5 py-2 border-t border-slate-200 bg-slate-50/80 shrink-0">
            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug">
              {phase === 'idle'
                ? 'Clique em Começar para revelar por 4s.'
                : 'Acertou o par? Continua jogando!'}
            </p>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <MemoryParticipantsModal
        isOpen={participantsModalOpen}
        participants={participants}
        onAddParticipant={handleAddParticipant}
        onRenameParticipant={handleRenameParticipant}
        onRemoveParticipant={handleRemoveParticipant}
        onClose={() => setParticipantsModalOpen(false)}
      />

      <MemoryFiguresModal
        isOpen={figuresModalOpen}
        customFigures={customFigures}
        includeBuiltins={includeBuiltins}
        onUploadFigures={handleUploadFigures}
        onDeleteCustomFigure={handleDeleteCustomFigure}
        onClearCustomFigures={handleClearCustomFigures}
        onToggleIncludeBuiltins={handleToggleIncludeBuiltins}
        onClose={() => setFiguresModalOpen(false)}
      />

      <MemoryChampionModal
        summary={championSummary}
        onPlayAgain={handleStartGame}
        onClose={() => setChampionSummary(null)}
      />
    </section>
  );
}
