import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLotteryGameById, LotteryGameId } from './data/lotteryGames';
import {
  clampDrawCount,
  formatLotteryNumber,
  GeneratedBet,
  generateMultipleOfficialBets,
  validatePhrase,
} from './utils/lotteryEngine';
import {
  loadBingoState,
  loadRussianRouletteState,
  loadSavedBets,
  saveBetsList,
  saveBingoState,
  saveRussianRouletteState,
} from './utils/storage';
import {
  applyPrizeCardEditAndReset,
  applyPrizeShuffleAndReset,
  createDefaultPrizeCards,
  createEmptyPrizeCards,
  PrizeCard,
  RouletteDrawRecord,
} from './utils/russianRouletteEngine';
import { getNextBingoGameNumber } from './utils/bingoEngine';
import { AppModule, Header, NavSection } from './components/Header';
import { Footer } from './components/Footer';
import { SidebarMenu } from './components/SidebarMenu';
import { GameSelector } from './components/GameSelector';
import { DrawStage } from './components/DrawStage';
import { VolantePreview } from './components/VolantePreview';
import { HistorySection } from './components/HistorySection';
import { PdfExportScope, PdfPrintModal } from './components/PdfPrintModal';
import {
  BingoView,
  playBingoTone,
  useBingoController,
} from './components/BingoView';
import {
  RussianRouletteSubmenu,
  RussianRouletteView,
} from './components/RussianRouletteView';
import { HomeView } from './components/HomeView';
import { BksDeckView } from './components/BksDeckView';

export default function App() {
  const [activeModule, setActiveModule] = useState<AppModule>('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<LotteryGameId>('mega-sena');
  const [activeSection, setActiveSection] = useState<NavSection>('jogos');

  // Bingo state (persisted locally)
  const bingo = useBingoController();
  const bingoInitializedRef = useRef(false);

  useEffect(() => {
    const persisted = loadBingoState();
    bingo.setGameNumber(persisted.gameNumber);
    bingo.setDrawnNumbers(persisted.drawnNumbers);
    bingo.setHasWinner(persisted.hasWinner);
    bingo.setWinnerName(persisted.winnerName);
    bingoInitializedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bingoInitializedRef.current) return;
    saveBingoState({
      gameNumber: bingo.gameNumber,
      drawnNumbers: bingo.drawnNumbers,
      hasWinner: bingo.hasWinner,
      winnerName: bingo.winnerName,
    });
  }, [bingo.gameNumber, bingo.drawnNumbers, bingo.hasWinner, bingo.winnerName]);

  // Russian Roulette state (persisted locally: 60 prize cards + draw history)
  const [russianRouletteSubmenu, setRussianRouletteSubmenu] =
    useState<RussianRouletteSubmenu>('sorteio');
  const [rouletteState, setRouletteState] = useState(() =>
    loadRussianRouletteState()
  );
  const [rouletteResetToken, setRouletteResetToken] = useState(0);

  const rouletteCards: PrizeCard[] = rouletteState.prizeCards;
  const rouletteHistory: RouletteDrawRecord[] = rouletteState.history;

  useEffect(() => {
    saveRussianRouletteState(rouletteState);
  }, [rouletteState]);

  const registeredPrizesCount = useMemo(
    () => rouletteCards.filter((c) => c.description.trim().length > 0).length,
    [rouletteCards]
  );

  const [phrase, setPhrase] = useState('');
  const [phraseError, setPhraseError] = useState<string | null>(null);
  const [variationIndex, setVariationIndex] = useState(1);
  const [drawCount, setDrawCount] = useState(1);

  const [pickCount, setPickCount] = useState(6);
  const [cloversCount, setCloversCount] = useState(2);
  const [lotecaDuplos, setLotecaDuplos] = useState(1);
  const [lotecaTriplos, setLotecaTriplos] = useState(0);

  const [savedBets, setSavedBets] = useState<GeneratedBet[]>(() => loadSavedBets());
  const [activeBet, setActiveBet] = useState<GeneratedBet | null>(null);
  const [activeBatch, setActiveBatch] = useState<GeneratedBet[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [rollingValue, setRollingValue] = useState('00');
  const [revealedNumbers, setRevealedNumbers] = useState<number[]>([]);
  const [revealedClovers, setRevealedClovers] = useState<number[]>([]);
  const [revealedLotecaCount, setRevealedLotecaCount] = useState(0);

  // PDF Modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfScope, setPdfScope] = useState<PdfExportScope>('single-game');
  const [pdfTargetBets, setPdfTargetBets] = useState<GeneratedBet[]>([]);

  const timersRef = useRef<number[]>([]);
  const pendingBatchRef = useRef<GeneratedBet[] | null>(null);

  const activeGame = getLotteryGameById(selectedGameId);

  const clearAnimationTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAnimationTimers();
  }, [clearAnimationTimers]);

  // Persist history whenever savedBets changes
  useEffect(() => {
    saveBetsList(savedBets);
  }, [savedBets]);

  // Keep fixed header & mobile footer active tab synced with scroll position
  useEffect(() => {
    if (activeModule !== 'loterias') return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const sectionIds: NavSection[] = ['jogos', 'gerador', 'volante', 'historico'];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const id = visible[0].target.id as NavSection;
          if (sectionIds.includes(id)) {
            setActiveSection(id);
          }
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeModule]);

  const handleSelectGame = useCallback(
    (gameId: LotteryGameId) => {
      clearAnimationTimers();
      setIsAnimating(false);
      setSelectedGameId(gameId);
      const nextGame = getLotteryGameById(gameId);
      setPickCount(nextGame.defaultPick);
      setCloversCount(nextGame.cloversDefault ?? 2);
      setLotecaDuplos(nextGame.defaultDuplos ?? 1);
      setLotecaTriplos(nextGame.defaultTriplos ?? 0);
      setVariationIndex(1);

      // Show most recent saved bet for that game if present, otherwise clear preview
      const latestForGame = savedBets.find((b) => b.gameId === gameId) ?? null;
      setActiveBet(latestForGame);
      setActiveBatch(latestForGame ? [latestForGame] : []);
      setSelectedBatchIndex(0);
      if (latestForGame) {
        setRevealedNumbers(latestForGame.numbers);
        setRevealedClovers(latestForGame.clovers ?? []);
        setRevealedLotecaCount(latestForGame.lotecaMatches?.length ?? 0);
      } else {
        setRevealedNumbers([]);
        setRevealedClovers([]);
        setRevealedLotecaCount(0);
      }
    },
    [clearAnimationTimers, savedBets]
  );

  const handleSelectBatchIndex = useCallback(
    (idx: number) => {
      const chosen = activeBatch[idx];
      if (!chosen) return;
      setSelectedBatchIndex(idx);
      setActiveBet(chosen);
      setRevealedNumbers(chosen.numbers);
      setRevealedClovers(chosen.clovers ?? []);
      setRevealedLotecaCount(chosen.lotecaMatches?.length ?? 0);
    },
    [activeBatch]
  );

  const handlePhraseChange = useCallback((value: string) => {
    setPhrase(value);
    setVariationIndex(1);
    setPhraseError(null);
  }, []);

  const finishBatchImmediately = useCallback(
    (batch: GeneratedBet[]) => {
      clearAnimationTimers();
      pendingBatchRef.current = null;
      if (batch.length === 0) {
        setIsAnimating(false);
        return;
      }
      const primary = batch[0];
      setActiveBatch(batch);
      setSelectedBatchIndex(0);
      setActiveBet(primary);
      setRevealedNumbers(primary.numbers);
      setRevealedClovers(primary.clovers ?? []);
      setRevealedLotecaCount(primary.lotecaMatches?.length ?? 0);
      setIsAnimating(false);

      setSavedBets((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const toAdd = batch.filter((b) => !existingIds.has(b.id));
        if (toAdd.length === 0) return prev;
        return [...toAdd, ...prev];
      });
    },
    [clearAnimationTimers]
  );

  const handleSkipAnimation = useCallback(() => {
    if (pendingBatchRef.current) {
      finishBatchImmediately(pendingBatchRef.current);
    }
  }, [finishBatchImmediately]);

  const handleDraw = useCallback(
    (incrementVariation = false) => {
      const validation = validatePhrase(phrase);
      if (!validation.valid) {
        setPhraseError(validation.error ?? 'Informe uma frase válida.');
        return;
      }

      const count = clampDrawCount(drawCount);
      const samePhraseAndGame =
        activeBet &&
        activeBet.gameId === selectedGameId &&
        activeBet.normalizedPhrase === validation.normalized;

      const startVariation =
        incrementVariation || samePhraseAndGame ? variationIndex : 1;

      setVariationIndex(startVariation + count);
      setPhraseError(null);

      const batch = generateMultipleOfficialBets(selectedGameId, phrase, count, {
        pickCount,
        cloversCount,
        lotecaDuplos,
        lotecaTriplos,
        variationIndex: startVariation,
      });

      clearAnimationTimers();
      pendingBatchRef.current = batch;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        finishBatchImmediately(batch);
        return;
      }

      const game = getLotteryGameById(selectedGameId);
      setIsAnimating(true);

      // Rolling globe ticker while animation runs
      const rollerInterval = window.setInterval(() => {
        if (game.kind === 'loteca') {
          const cols = ['1', 'X', '2'];
          setRollingValue(cols[Math.floor(Math.random() * cols.length)]);
        } else {
          const span = game.maxNumber - game.minNumber + 1;
          const randNum = game.minNumber + Math.floor(Math.random() * span);
          setRollingValue(formatLotteryNumber(randNum, game.zeroPaddedDigits));
        }
      }, 65);
      timersRef.current.push(rollerInterval);

      // Multi-draw batch animation (drawCount > 1): reveal each draw card sequentially
      if (batch.length > 1) {
        setActiveBatch([]);
        setSelectedBatchIndex(0);
        setActiveBet(batch[0]);
        setRevealedNumbers([]);
        setRevealedClovers([]);
        setRevealedLotecaCount(0);

        const stepMs = batch.length <= 5 ? 240 : batch.length <= 15 ? 120 : 60;
        batch.forEach((bet, idx) => {
          const t = window.setTimeout(() => {
            setActiveBatch(batch.slice(0, idx + 1));
            setSelectedBatchIndex(idx);
            setActiveBet(bet);
            setRevealedNumbers(bet.numbers);
            setRevealedClovers(bet.clovers ?? []);
            setRevealedLotecaCount(bet.lotecaMatches?.length ?? 0);
          }, 160 + idx * stepMs);
          timersRef.current.push(t);
        });

        const doneTimer = window.setTimeout(() => {
          window.clearInterval(rollerInterval);
          finishBatchImmediately(batch);
        }, 260 + batch.length * stepMs);
        timersRef.current.push(doneTimer);
        return;
      }

      // Single draw animation (drawCount === 1): preserve ball-by-ball suspense
      const generated = batch[0];
      setActiveBatch([generated]);
      setSelectedBatchIndex(0);
      setActiveBet(generated);
      setRevealedNumbers([]);
      setRevealedClovers([]);
      setRevealedLotecaCount(0);

      if (game.kind === 'loteca' && generated.lotecaMatches) {
        const stepMs = 95;
        generated.lotecaMatches.forEach((_, idx) => {
          const t = window.setTimeout(() => {
            setRevealedLotecaCount(idx + 1);
          }, 180 + idx * stepMs);
          timersRef.current.push(t);
        });
        const doneTimer = window.setTimeout(() => {
          window.clearInterval(rollerInterval);
          finishBatchImmediately(batch);
        }, 260 + generated.lotecaMatches.length * stepMs);
        timersRef.current.push(doneTimer);
        return;
      }

      const total = generated.numbers.length;
      if (total > 20) {
        const batchSize = 5;
        const batches = Math.ceil(total / batchSize);
        for (let b = 0; b < batches; b++) {
          const sliceEnd = Math.min(total, (b + 1) * batchSize);
          const t = window.setTimeout(() => {
            setRevealedNumbers(generated.numbers.slice(0, sliceEnd));
          }, 180 + b * 120);
          timersRef.current.push(t);
        }
        const doneTimer = window.setTimeout(() => {
          window.clearInterval(rollerInterval);
          finishBatchImmediately(batch);
        }, 260 + batches * 120);
        timersRef.current.push(doneTimer);
      } else {
        const stepMs = total <= 7 ? 170 : 105;
        generated.numbers.forEach((_, idx) => {
          const t = window.setTimeout(() => {
            setRevealedNumbers(generated.numbers.slice(0, idx + 1));
          }, 180 + idx * stepMs);
          timersRef.current.push(t);
        });

        let finishAt = 240 + total * stepMs;

        if (generated.clovers && generated.clovers.length > 0) {
          generated.clovers.forEach((_, cIdx) => {
            const t = window.setTimeout(() => {
              setRevealedClovers(generated.clovers!.slice(0, cIdx + 1));
            }, finishAt + cIdx * 160);
            timersRef.current.push(t);
          });
          finishAt += generated.clovers.length * 160 + 80;
        }

        const doneTimer = window.setTimeout(() => {
          window.clearInterval(rollerInterval);
          finishBatchImmediately(batch);
        }, finishAt);
        timersRef.current.push(doneTimer);
      }
    },
    [
      phrase,
      drawCount,
      activeBet,
      selectedGameId,
      variationIndex,
      pickCount,
      cloversCount,
      lotecaDuplos,
      lotecaTriplos,
      clearAnimationTimers,
      finishBatchImmediately,
    ]
  );

  const handleNavigate = useCallback(
    (section: NavSection) => {
      setActiveSection(section);
      if (activeModule !== 'loterias') {
        setActiveModule('loterias');
        window.setTimeout(() => {
          const el = document.getElementById(section);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
        return;
      }
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [activeModule]
  );

  const handleSelectHome = useCallback(() => {
    setActiveModule('inicio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectBingo = useCallback(() => {
    setActiveModule('bingo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectRussianRoulette = useCallback(
    (submenu: RussianRouletteSubmenu) => {
      setActiveModule('roleta-russa');
      setRussianRouletteSubmenu(submenu);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleSelectBaralhoBks = useCallback(() => {
    setActiveModule('baralho-bks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSaveRouletteCard = useCallback(
    (cardNumber: number, description: string) => {
      setRouletteState((prev) =>
        applyPrizeCardEditAndReset(prev, cardNumber, description)
      );
      setRouletteResetToken((prev) => prev + 1);
    },
    []
  );

  const handleRestoreDefaultRouletteCards = useCallback(() => {
    setRouletteState({
      prizeCards: createDefaultPrizeCards(),
      history: [],
    });
    setRouletteResetToken((prev) => prev + 1);
  }, []);

  const handleClearAllRouletteCards = useCallback(() => {
    setRouletteState({
      prizeCards: createEmptyPrizeCards(),
      history: [],
    });
    setRouletteResetToken((prev) => prev + 1);
  }, []);

  const handleShuffleRouletteCards = useCallback(() => {
    setRouletteState((prev) => applyPrizeShuffleAndReset(prev));
    setRouletteResetToken((prev) => prev + 1);
  }, []);

  const handleAddRouletteHistory = useCallback((record: RouletteDrawRecord) => {
    setRouletteState((prev) => ({
      ...prev,
      history: [record, ...prev.history],
    }));
  }, []);

  const handleClearRouletteHistory = useCallback(() => {
    setRouletteState((prev) => ({
      ...prev,
      history: [],
    }));
    setRouletteResetToken((prev) => prev + 1);
  }, []);

  const handleBingoDrawBall = useCallback(() => {
    bingo.drawBall();
  }, [bingo]);

  const handleBingoDeclareWinner = useCallback(
    (name: string) => {
      const finishedGame = bingo.gameNumber;
      const totalBalls = bingo.drawnNumbers.length;
      const lastBall =
        totalBalls > 0 ? bingo.drawnNumbers[totalBalls - 1] : null;

      if (bingo.soundEnabled) playBingoTone('winner');

      bingo.clearTimers();
      bingo.setIsSpinning(false);
      bingo.setDrawnNumbers([]);
      bingo.setHasWinner(false);
      bingo.setWinnerName('');
      bingo.setGameNumber((prev) => getNextBingoGameNumber(prev));
      bingo.setLastWinnerNotice({
        finishedGameNumber: finishedGame,
        winnerName: name,
        totalBalls,
        lastBall,
      });
    },
    [bingo]
  );

  const handleBingoCancelWinner = useCallback(() => {
    bingo.setHasWinner(false);
  }, [bingo]);

  const handleBingoDismissLastWinner = useCallback(() => {
    bingo.setLastWinnerNotice(null);
  }, [bingo]);

  const handleBingoRestart = useCallback(() => {
    bingo.clearTimers();
    bingo.setIsSpinning(false);
    bingo.setDrawnNumbers([]);
    bingo.setHasWinner(false);
    bingo.setWinnerName('');
    bingo.setLastWinnerNotice(null);
    bingo.setGameNumber((prev) => getNextBingoGameNumber(prev));
  }, [bingo]);

  const handleLoadBet = useCallback(
    (bet: GeneratedBet) => {
      clearAnimationTimers();
      setIsAnimating(false);
      setSelectedGameId(bet.gameId);
      setPhrase(bet.phrase);
      setVariationIndex(bet.variationIndex);
      setPhraseError(null);
      if (bet.numbers.length > 0) {
        setPickCount(bet.numbers.length);
      }
      if (bet.clovers?.length) {
        setCloversCount(bet.clovers.length);
      }
      if (bet.lotecaDuplos !== undefined) setLotecaDuplos(bet.lotecaDuplos);
      if (bet.lotecaTriplos !== undefined) setLotecaTriplos(bet.lotecaTriplos);

      setActiveBet(bet);
      setActiveBatch([bet]);
      setSelectedBatchIndex(0);
      setRevealedNumbers(bet.numbers);
      setRevealedClovers(bet.clovers ?? []);
      setRevealedLotecaCount(bet.lotecaMatches?.length ?? 0);
      handleNavigate('gerador');
    },
    [clearAnimationTimers, handleNavigate]
  );

  const printableBet = activeBet ?? savedBets[0] ?? null;

  const handleOpenPdfForActive = useCallback(() => {
    const batchForGame = activeBatch.filter((b) => b.gameId === selectedGameId);
    if (batchForGame.length > 0) {
      setPdfScope('single-game');
      setPdfTargetBets(batchForGame);
      setPdfModalOpen(true);
      return;
    }
    const target = activeBet ?? savedBets[0] ?? null;
    if (!target) return;
    setPdfScope('single-game');
    setPdfTargetBets([target]);
    setPdfModalOpen(true);
  }, [activeBatch, activeBet, savedBets, selectedGameId]);

  const handleExportAllPdf = useCallback((betsToExport: GeneratedBet[]) => {
    if (betsToExport.length === 0) return;
    setPdfScope('all-games');
    setPdfTargetBets(betsToExport);
    setPdfModalOpen(true);
  }, []);

  const handlePrintFromHistory = useCallback((bet: GeneratedBet) => {
    setSelectedGameId(bet.gameId);
    setActiveBet(bet);
    setActiveBatch([bet]);
    setSelectedBatchIndex(0);
    setRevealedNumbers(bet.numbers);
    setRevealedClovers(bet.clovers ?? []);
    setRevealedLotecaCount(bet.lotecaMatches?.length ?? 0);
    setPdfScope('single-game');
    setPdfTargetBets([bet]);
    setPdfModalOpen(true);
  }, []);

  const handleToggleFavorite = useCallback((betId: string) => {
    setSavedBets((prev) =>
      prev.map((b) => (b.id === betId ? { ...b, favorite: !b.favorite } : b))
    );
  }, []);

  const handleDeleteBet = useCallback(
    (betId: string) => {
      setSavedBets((prev) => prev.filter((b) => b.id !== betId));
      setActiveBatch((prev) => prev.filter((b) => b.id !== betId));
      if (activeBet?.id === betId) {
        setActiveBet(null);
        setRevealedNumbers([]);
        setRevealedClovers([]);
        setRevealedLotecaCount(0);
      }
    },
    [activeBet]
  );

  const handleClearAll = useCallback(() => {
    setSavedBets([]);
  }, []);

  const pdfGameId = pdfTargetBets[0]?.gameId ?? selectedGameId;

  const isBksModule = activeModule === 'baralho-bks';

  return (
    <div
      className={
        isBksModule
          ? 'h-[100dvh] w-screen overflow-hidden overscroll-none bg-[#0C0809] text-slate-900 select-none'
          : 'min-h-screen bg-[#F7F8FA] text-slate-900'
      }
    >
      <Header
        activeModule={activeModule}
        menuOpen={sidebarOpen}
        onToggleMenu={() => setSidebarOpen((prev) => !prev)}
        onSelectHome={handleSelectHome}
      />

      <SidebarMenu
        isOpen={sidebarOpen}
        activeModule={activeModule}
        activeSection={activeSection}
        russianRouletteSubmenu={russianRouletteSubmenu}
        savedCount={savedBets.length}
        bingoDrawnCount={bingo.drawnNumbers.length}
        registeredPrizesCount={registeredPrizesCount}
        accentColor={activeGame.officialColor}
        onClose={() => setSidebarOpen(false)}
        onSelectHome={handleSelectHome}
        onSelectLotterySection={handleNavigate}
        onSelectBingo={handleSelectBingo}
        onSelectRussianRoulette={handleSelectRussianRoulette}
        onSelectBaralhoBks={handleSelectBaralhoBks}
      />

      <main
        className={
          isBksModule
            ? 'w-full h-full pt-14 pb-11 px-1.5 sm:px-3 overflow-hidden flex flex-col'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-18 space-y-8'
        }
      >
        {activeModule === 'inicio' ? (
          <HomeView
            savedBetsCount={savedBets.length}
            bingoDrawnCount={bingo.drawnNumbers.length}
            registeredPrizesCount={registeredPrizesCount}
            onSelectLotterySection={handleNavigate}
            onSelectBingo={handleSelectBingo}
            onSelectRussianRoulette={handleSelectRussianRoulette}
            onSelectBaralhoBks={handleSelectBaralhoBks}
          />
        ) : activeModule === 'bingo' ? (
          <BingoView
            gameNumber={bingo.gameNumber}
            drawnNumbers={bingo.drawnNumbers}
            hasWinner={bingo.hasWinner}
            winnerName={bingo.winnerName}
            lastWinnerNotice={bingo.lastWinnerNotice}
            isSpinning={bingo.isSpinning}
            spinCycle={bingo.spinCycle}
            rollingNumber={bingo.rollingNumber}
            soundEnabled={bingo.soundEnabled}
            onToggleSound={() => bingo.setSoundEnabled((prev) => !prev)}
            onDrawBall={handleBingoDrawBall}
            onDeclareWinner={handleBingoDeclareWinner}
            onCancelWinner={handleBingoCancelWinner}
            onDismissLastWinner={handleBingoDismissLastWinner}
            onRestartGame={handleBingoRestart}
          />
        ) : activeModule === 'roleta-russa' ? (
          <RussianRouletteView
            activeSubmenu={russianRouletteSubmenu}
            prizeCards={rouletteCards}
            history={rouletteHistory}
            resetToken={rouletteResetToken}
            onChangeSubmenu={setRussianRouletteSubmenu}
            onSaveCard={handleSaveRouletteCard}
            onShuffleCards={handleShuffleRouletteCards}
            onRestoreDefaultCards={handleRestoreDefaultRouletteCards}
            onClearAllCards={handleClearAllRouletteCards}
            onAddHistoryRecord={handleAddRouletteHistory}
            onClearHistory={handleClearRouletteHistory}
          />
        ) : activeModule === 'baralho-bks' ? (
          <BksDeckView />
        ) : (
          <>
            {/* 1. Eight Official Lotteries Selector with Custom Studio Images */}
            <GameSelector
              selectedGameId={selectedGameId}
              onSelectGame={handleSelectGame}
            />

            {/* 2. Two-Column Balanced Workspace: Generator + Official Volante Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 flex flex-col [&>section]:flex-1">
                <DrawStage
                  gameId={selectedGameId}
                  phrase={phrase}
                  onPhraseChange={handlePhraseChange}
                  phraseError={phraseError}
                  pickCount={pickCount}
                  onPickCountChange={setPickCount}
                  cloversCount={cloversCount}
                  onCloversCountChange={setCloversCount}
                  lotecaDuplos={lotecaDuplos}
                  onLotecaDuplosChange={setLotecaDuplos}
                  lotecaTriplos={lotecaTriplos}
                  onLotecaTriplosChange={(val) => {
                    setLotecaTriplos(val);
                    if (val === 0 && lotecaDuplos === 0) {
                      setLotecaDuplos(1);
                    }
                  }}
                  variationIndex={variationIndex}
                  drawCount={drawCount}
                  onDrawCountChange={setDrawCount}
                  isAnimating={isAnimating}
                  rollingValue={rollingValue}
                  activeBet={activeBet}
                  activeBatch={
                    activeBatch[0]?.gameId === selectedGameId ? activeBatch : []
                  }
                  selectedBatchIndex={selectedBatchIndex}
                  onSelectBatchIndex={handleSelectBatchIndex}
                  revealedNumbers={revealedNumbers}
                  revealedClovers={revealedClovers}
                  revealedLotecaCount={revealedLotecaCount}
                  onDraw={handleDraw}
                  onSkipAnimation={handleSkipAnimation}
                  onOpenPdfModal={handleOpenPdfForActive}
                />
              </div>

              <div className="lg:col-span-5 flex flex-col [&>section]:flex-1">
                <VolantePreview
                  gameId={selectedGameId}
                  activeBet={
                    activeBet && activeBet.gameId === selectedGameId
                      ? activeBet
                      : null
                  }
                  batchTotal={
                    activeBatch[0]?.gameId === selectedGameId
                      ? activeBatch.length
                      : 0
                  }
                  selectedBatchIndex={selectedBatchIndex}
                  onSelectBatchIndex={handleSelectBatchIndex}
                  revealedNumbers={
                    activeBet && activeBet.gameId === selectedGameId
                      ? revealedNumbers
                      : []
                  }
                  revealedClovers={
                    activeBet && activeBet.gameId === selectedGameId
                      ? revealedClovers
                      : []
                  }
                  revealedLotecaCount={
                    activeBet && activeBet.gameId === selectedGameId
                      ? revealedLotecaCount
                      : 0
                  }
                  isAnimating={isAnimating}
                  onOpenPdfModal={handleOpenPdfForActive}
                />
              </div>
            </div>

            {/* 3. Local Bet History */}
            <HistorySection
              bets={savedBets}
              onLoadBet={handleLoadBet}
              onPrintBet={handlePrintFromHistory}
              onExportAllPdf={handleExportAllPdf}
              onToggleFavorite={handleToggleFavorite}
              onDeleteBet={handleDeleteBet}
              onClearAll={handleClearAll}
              onFocusGenerator={() => {
                handleNavigate('gerador');
                window.setTimeout(() => {
                  document.getElementById('frase-aleatoriedade')?.focus();
                }, 250);
              }}
            />
          </>
        )}
      </main>

      <Footer
        activeModule={activeModule}
        savedCount={savedBets.length}
        bingoDrawnCount={bingo.drawnNumbers.length}
        registeredPrizesCount={registeredPrizesCount}
        russianRouletteSubmenu={russianRouletteSubmenu}
        activeSection={activeSection}
        onSelectHome={handleSelectHome}
        onNavigate={handleNavigate}
        onSelectBingo={handleSelectBingo}
        onSelectRussianRoulette={handleSelectRussianRoulette}
        onSelectBaralhoBks={handleSelectBaralhoBks}
      />

      <PdfPrintModal
        isOpen={pdfModalOpen}
        gameId={pdfGameId}
        initialScope={pdfScope}
        initialBets={pdfTargetBets}
        allSavedBets={savedBets}
        onClose={() => setPdfModalOpen(false)}
      />
    </div>
  );
}
