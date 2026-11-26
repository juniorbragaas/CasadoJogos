import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Settings2, Shuffle } from 'lucide-react';
import {
  BksCardDefinition,
  BKS_DECK_SIZE,
  BKS_GRID_COLUMNS,
  BKS_GRID_ROWS,
  computeBksGridMetrics,
  createInitialBksDeck,
  flipBksCardUp,
  formatBksCardNumber,
  resetAllBksCardsFlipped,
  resolveBksBackSrc,
  resolveBksCardFrontSrc,
  shuffleBksDeck,
} from '../utils/bksDeckEngine';
import {
  clearBksCustomImages,
  EMPTY_BKS_STORAGE,
  loadBksCustomImages,
  saveBksBackImage,
  saveBksFrontImages,
  BksCustomDeckStorage,
} from '../utils/bksDeckDb';
import { BksCardModal } from './BksCardModal';
import { BksImageManagerModal } from './BksImageManagerModal';

function playSubtleCardSound(kind: 'flip' | 'shuffle' | 'reset') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (kind === 'flip') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.07);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
      window.setTimeout(() => void ctx.close(), 180);
      return;
    }

    if (kind === 'shuffle') {
      [0, 0.055, 0.11, 0.165].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240 + i * 45, now + offset);
        gain.gain.setValueAtTime(0.04, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.05);
      });
      window.setTimeout(() => void ctx.close(), 340);
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
    window.setTimeout(() => void ctx.close(), 240);
  } catch {
    // Ignore audio context restrictions
  }
}

export function BksDeckView() {
  const [cards, setCards] = useState<BksCardDefinition[]>(() =>
    createInitialBksDeck()
  );
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  const [storage, setStorage] = useState<BksCustomDeckStorage>(EMPTY_BKS_STORAGE);
  const [usePlaceholdersOnly, setUsePlaceholdersOnly] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  const [backBroken, setBackBroken] = useState(false);
  const [brokenFrontIds, setBrokenFrontIds] = useState<Record<number, boolean>>(
    {}
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const modalTimerRef = useRef<number | null>(null);
  const shuffleTimerRef = useRef<number | null>(null);

  // Lock page scrollbars and prevent browser pinch/ctrl/keyboard zoom while on BARALHO BKS
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    const viewportMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]'
    );
    const prevViewportContent = viewportMeta?.getAttribute('content') ?? null;
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        ['+', '-', '=', '_', '0'].includes(event.key)
      ) {
        event.preventDefault();
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    const handleGesture = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('gestureend', handleGesture, { passive: false });

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      if (viewportMeta && prevViewportContent !== null) {
        viewportMeta.setAttribute('content', prevViewportContent);
      }
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('gestureend', handleGesture);
    };
  }, []);

  // Measure the flex-1 card stage so the 8x4 grid automatically maximizes fit on every device
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

  useEffect(() => {
    let active = true;
    loadBksCustomImages().then((loaded) => {
      if (!active) return;
      setStorage(loaded);
    });
    return () => {
      active = false;
      if (modalTimerRef.current !== null) {
        window.clearTimeout(modalTimerRef.current);
      }
      if (shuffleTimerRef.current !== null) {
        window.clearTimeout(shuffleTimerRef.current);
      }
    };
  }, []);

  const gridMetrics = useMemo(
    () =>
      computeBksGridMetrics(
        stageSize.width,
        stageSize.height,
        BKS_GRID_COLUMNS,
        BKS_GRID_ROWS
      ),
    [stageSize.width, stageSize.height]
  );

  const flippedSet = useMemo(() => new Set(flippedIds), [flippedIds]);

  const backSrc = useMemo(
    () => resolveBksBackSrc(storage.customBack, usePlaceholdersOnly),
    [storage.customBack, usePlaceholdersOnly]
  );

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? null,
    [cards, selectedCardId]
  );

  const selectedCardFrontSrc = useMemo(() => {
    if (!selectedCard) return null;
    return resolveBksCardFrontSrc(
      selectedCard,
      storage.customFronts,
      usePlaceholdersOnly
    );
  }, [selectedCard, storage.customFronts, usePlaceholdersOnly]);

  const handleFrontError = useCallback((cardId: number) => {
    setBrokenFrontIds((prev) => (prev[cardId] ? prev : { ...prev, [cardId]: true }));
  }, []);

  const handleCardClick = useCallback(
    (card: BksCardDefinition) => {
      if (modalTimerRef.current !== null) {
        window.clearTimeout(modalTimerRef.current);
        modalTimerRef.current = null;
      }

      const alreadyFlipped = flippedSet.has(card.id);
      playSubtleCardSound('flip');

      if (alreadyFlipped) {
        setSelectedCardId(card.id);
        return;
      }

      setFlippedIds((prev) => flipBksCardUp(prev, card.id));

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        setSelectedCardId(card.id);
      } else {
        modalTimerRef.current = window.setTimeout(() => {
          setSelectedCardId(card.id);
          modalTimerRef.current = null;
        }, 210);
      }
    },
    [flippedSet]
  );

  const handleShuffle = useCallback(() => {
    if (shuffleTimerRef.current !== null) {
      window.clearTimeout(shuffleTimerRef.current);
    }
    playSubtleCardSound('shuffle');
    setIsShuffling(true);
    setCards((prev) => shuffleBksDeck(prev));

    shuffleTimerRef.current = window.setTimeout(() => {
      setIsShuffling(false);
      shuffleTimerRef.current = null;
    }, 460);
  }, []);

  const handleFlipAllBack = useCallback(() => {
    if (modalTimerRef.current !== null) {
      window.clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    playSubtleCardSound('reset');
    setSelectedCardId(null);
    setFlippedIds(resetAllBksCardsFlipped());
  }, []);

  const handleUploadBack = useCallback(async (file: File) => {
    const saved = await saveBksBackImage(file);
    setBackBroken(false);
    setUsePlaceholdersOnly(false);
    setStorage((prev) => ({
      ...prev,
      customBack: saved.dataUrl,
      customBackName: saved.fileName,
    }));
  }, []);

  const handleUploadFronts = useCallback(async (files: File[]) => {
    const savedFronts = await saveBksFrontImages(files);
    setBrokenFrontIds({});
    setUsePlaceholdersOnly(false);
    setStorage((prev) => ({
      ...prev,
      customFronts: savedFronts,
      customFrontCount: Object.keys(savedFronts).length,
    }));
  }, []);

  const handleRestoreEmbeddedDeck = useCallback(async () => {
    await clearBksCustomImages();
    setBackBroken(false);
    setBrokenFrontIds({});
    setUsePlaceholdersOnly(false);
    setStorage(EMPTY_BKS_STORAGE);
  }, []);

  const showBackImage = Boolean(backSrc) && !backBroken;
  const isCompactCard = gridMetrics.cardWidth > 0 && gridMetrics.cardWidth < 68;

  return (
    <section
      id="baralho-bks-mesa"
      aria-label="Mesa do Baralho BKS"
      style={{ touchAction: 'manipulation' }}
      className="relative flex-1 min-h-0 w-full my-1.5 sm:my-2 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D8AF72]/20 bg-[radial-gradient(ellipse_at_top,#2B1316_0%,#140B0D_58%,#0C0809_100%)] text-white shadow-[0_24px_60px_rgba(12,8,9,0.28)] px-2 sm:px-5 py-2 sm:py-3 flex flex-col justify-between gap-2"
    >
      {/* Subtle luxury felt vignette trim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-1.5 sm:inset-2.5 rounded-xl sm:rounded-2xl border border-[#D8AF72]/12"
      />

      {/* Compact Top Bar: Title + Count (left) and Discreet Image Manager Trigger (right) */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2 shrink-0 px-0.5 sm:px-1">
        <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-3">
          <h1 className="font-display text-sm sm:text-lg font-bold tracking-tight text-[#FFF7EA] leading-tight whitespace-nowrap">
            BARALHO BKS
          </h1>
          <p
            data-testid="bks-flipped-counter"
            className="text-[11px] sm:text-xs text-[#E6C285]/75 tabular-nums leading-tight whitespace-nowrap"
          >
            {flippedIds.length}/{BKS_DECK_SIZE} reveladas
          </p>
        </div>

        <button
          type="button"
          data-testid="bks-manage-images-btn"
          onClick={() => setManagerOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 text-white/90 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8AF72]"
        >
          <Settings2 className="w-3.5 h-3.5 text-[#E6C285] shrink-0" aria-hidden="true" />
          <span>Gerenciar Imagens (32+1)</span>
        </button>
      </div>

      {/* Auto-Fit Viewport Stage: ALWAYS 8 columns x 4 rows maximized to available viewport with zero overflow */}
      <div
        ref={stageRef}
        data-testid="bks-stage"
        className="relative z-10 flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center"
      >
        {gridMetrics.cardWidth > 0 && (
          <div
            data-testid="bks-card-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BKS_GRID_COLUMNS}, ${gridMetrics.cardWidth}px)`,
              gridTemplateRows: `repeat(${BKS_GRID_ROWS}, ${gridMetrics.cardHeight}px)`,
              gap: `${gridMetrics.gap}px`,
              width: `${gridMetrics.totalWidth}px`,
              height: `${gridMetrics.totalHeight}px`,
            }}
          >
            {cards.map((card) => {
              const isFlipped = flippedSet.has(card.id);
              const frontSrc = resolveBksCardFrontSrc(
                card,
                storage.customFronts,
                usePlaceholdersOnly
              );
              const showFrontImage = Boolean(frontSrc) && !brokenFrontIds[card.id];
              const formattedNumber = formatBksCardNumber(card.id);

              return (
                <motion.div
                  key={card.id}
                  layout
                  transition={{
                    layout: {
                      type: 'spring',
                      stiffness: 320,
                      damping: 28,
                    },
                  }}
                  animate={
                    isShuffling
                      ? {
                          scale: [1, 0.93, 1],
                        }
                      : { scale: 1 }
                  }
                  className="bks-perspective w-full h-full"
                >
                  <button
                    type="button"
                    data-testid={`bks-card-${card.id}`}
                    data-card-id={card.id}
                    data-flipped={isFlipped ? 'true' : 'false'}
                    onClick={() => handleCardClick(card)}
                    aria-label={
                      isFlipped
                        ? `Carta ${formattedNumber} — ${card.title} (revelada, abrir em tela cheia)`
                        : `Carta fechada na mesa (virar e revelar carta)`
                    }
                    className={`group relative w-full h-full ${
                      isCompactCard ? 'rounded-md' : 'rounded-[0.65rem]'
                    } text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C285] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] ${
                      isFlipped
                        ? 'ring-2 ring-[#E6C285]/85 shadow-[0_8px_22px_rgba(216,175,114,0.24)]'
                        : 'shadow-[0_6px_16px_rgba(0,0,0,0.45)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.6)]'
                    }`}
                  >
                    <div
                      className={`bks-card-inner ${isFlipped ? 'bks-is-flipped' : ''}`}
                    >
                      {/* BACK FACE (initial state) */}
                      <div
                        className={`bks-card-face bks-card-face-back bg-[#520F14] border border-[#D8AF72]/25 group-hover:border-[#E6C285]/70 transition-colors ${
                          isCompactCard ? '!rounded-md' : ''
                        }`}
                      >
                        {showBackImage && backSrc ? (
                          <img
                            src={backSrc}
                            alt="Verso do Baralho BKS"
                            referrerPolicy="no-referrer"
                            onError={() => setBackBroken(true)}
                            draggable={false}
                            className="w-full h-full object-contain select-none"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-gradient-to-b from-[#5A1014] to-[#36070B] text-[#E6C285]">
                            <div className="w-full h-full rounded border border-[#D8AF72]/45 flex flex-col items-center justify-center gap-0.5">
                              {!isCompactCard && (
                                <span className="text-xs tracking-widest opacity-85">
                                  ♥ ♦
                                </span>
                              )}
                              <span
                                className={`font-display font-bold text-[#FFF3DE] ${
                                  isCompactCard
                                    ? 'text-[9px] tracking-[0.12em]'
                                    : 'text-[11px] tracking-[0.22em]'
                                }`}
                              >
                                BKS
                              </span>
                              {!isCompactCard && (
                                <span className="text-xs tracking-widest opacity-85">
                                  ♠ ♣
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* FRONT FACE (revealed state) */}
                      <div
                        className={`bks-card-face bks-card-face-front bg-[#520F14] border border-[#E6C285]/65 ${
                          isCompactCard ? '!rounded-md' : ''
                        }`}
                      >
                        {showFrontImage && frontSrc ? (
                          <img
                            src={frontSrc}
                            alt={`Carta ${formattedNumber} — ${card.title}`}
                            referrerPolicy="no-referrer"
                            onError={() => handleFrontError(card.id)}
                            draggable={false}
                            className="w-full h-full object-contain select-none"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col justify-between p-1.5 sm:p-2 bg-gradient-to-b from-[#5D1116] to-[#39080C] text-[#FFF5E4]">
                            <div className="flex items-start justify-between text-[#E6C285]">
                              <span
                                className={`font-display font-bold leading-none tabular-nums ${
                                  isCompactCard ? 'text-[10px]' : 'text-xs'
                                }`}
                              >
                                {formattedNumber}
                              </span>
                              <span className={isCompactCard ? 'text-[9px] leading-none' : 'text-xs leading-none'}>
                                {card.suitSymbol}
                              </span>
                            </div>
                            <div className="text-center my-auto">
                              <span
                                className={`block font-display font-bold text-[#FFF7EA] tabular-nums ${
                                  isCompactCard ? 'text-xs' : 'text-base'
                                }`}
                              >
                                {card.id}
                              </span>
                              {!isCompactCard && (
                                <span className="block text-[9px] leading-tight text-[#E9D5B5]/85 line-clamp-2 mt-0.5">
                                  {card.title}
                                </span>
                              )}
                            </div>
                            {!isCompactCard && (
                              <div className="flex justify-end text-[#E6C285]">
                                <span className="font-mono text-[9px] font-semibold uppercase tracking-wider">
                                  {card.suitLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Discreet Floating Glassmorphism Controls Bar (always visible inside viewport, never overlapping cards) */}
      <div className="relative z-20 flex justify-center shrink-0">
        <div
          data-testid="bks-controls-bar"
          className="inline-flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        >
          <button
            type="button"
            data-testid="bks-shuffle-btn"
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C285]"
          >
            <Shuffle
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E6C285] transition-transform duration-300 ${
                isShuffling ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
            <span>Embaralhar</span>
          </button>

          <button
            type="button"
            data-testid="bks-flip-all-back-btn"
            onClick={handleFlipAllBack}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C285]"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E6C285]" aria-hidden="true" />
            <span>Virar Todas para o Verso</span>
          </button>
        </div>
      </div>

      {/* Full-Screen Card Preview Modal */}
      <BksCardModal
        card={selectedCard}
        frontSrc={selectedCardFrontSrc}
        imageBroken={selectedCard ? Boolean(brokenFrontIds[selectedCard.id]) : false}
        onImageError={handleFrontError}
        onClose={() => setSelectedCardId(null)}
      />

      {/* Image Upload & IndexedDB Management Modal */}
      <BksImageManagerModal
        isOpen={managerOpen}
        hasCustomBack={Boolean(storage.customBack)}
        customBackName={storage.customBackName}
        customFrontCount={storage.customFrontCount}
        usePlaceholdersOnly={usePlaceholdersOnly}
        onUploadBack={handleUploadBack}
        onUploadFronts={handleUploadFronts}
        onRestoreEmbeddedDeck={handleRestoreEmbeddedDeck}
        onTogglePlaceholdersOnly={setUsePlaceholdersOnly}
        onClose={() => setManagerOpen(false)}
      />
    </section>
  );
}
