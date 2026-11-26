import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { getLotteryGameById, LotteryGameId } from '../data/lotteryGames';
import { formatLotteryNumber, GeneratedBet } from '../utils/lotteryEngine';
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  buildMultiGameSlipPages,
  buildSummarySheetPages,
  computeSlipLayout,
  DEFAULT_SLIP_CALIBRATION,
  PdfExportMode,
  SlipCalibration,
  TrayAlignment,
} from '../utils/slipGeometry';
import { downloadAllGamesPdf, downloadLotteryPdf } from '../utils/pdfExporter';
import { loadGameCalibration, saveGameCalibration } from '../utils/storage';

export type PdfExportScope = 'single-game' | 'all-games';

interface PdfPrintModalProps {
  isOpen: boolean;
  gameId: LotteryGameId;
  initialScope: PdfExportScope;
  initialBets: GeneratedBet[];
  allSavedBets: GeneratedBet[];
  onClose: () => void;
}

export function PdfPrintModal({
  isOpen,
  gameId,
  initialScope,
  initialBets,
  allSavedBets,
  onClose,
}: PdfPrintModalProps) {
  const [scope, setScope] = useState<PdfExportScope>(initialScope);
  const [mode, setMode] = useState<PdfExportMode>(
    initialScope === 'all-games' ? 'summary-sheet' : 'original-slip'
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewSlipIndex, setPreviewSlipIndex] = useState(0);
  const [lastDownloadedFile, setLastDownloadedFile] = useState<string | null>(null);
  const [calibrations, setCalibrations] = useState<
    Partial<Record<LotteryGameId, SlipCalibration>>
  >({});

  const primaryGame = getLotteryGameById(gameId);

  const uniqueGamesInHistory = useMemo(() => {
    const ids = new Set<LotteryGameId>();
    allSavedBets.forEach((b) => ids.add(b.gameId));
    initialBets.forEach((b) => ids.add(b.gameId));
    return ids.size;
  }, [allSavedBets, initialBets]);

  // Pool of selectable bets depending on scope
  const availableBets = useMemo(() => {
    const map = new Map<string, GeneratedBet>();
    if (scope === 'all-games') {
      initialBets.forEach((b) => map.set(b.id, b));
      allSavedBets.forEach((b) => map.set(b.id, b));
    } else {
      initialBets.forEach((b) => {
        if (b.gameId === gameId) map.set(b.id, b);
      });
      allSavedBets.forEach((b) => {
        if (b.gameId === gameId) map.set(b.id, b);
      });
    }
    return Array.from(map.values());
  }, [scope, initialBets, allSavedBets, gameId]);

  useEffect(() => {
    if (!isOpen) return;
    setScope(initialScope);
    setMode(initialScope === 'all-games' ? 'summary-sheet' : 'original-slip');
    setLastDownloadedFile(null);
    setPreviewSlipIndex(0);

    // Preload saved calibrations for all games present
    const loadedCal: Partial<Record<LotteryGameId, SlipCalibration>> = {};
    const allGamesSet = new Set<LotteryGameId>([gameId]);
    allSavedBets.forEach((b) => allGamesSet.add(b.gameId));
    initialBets.forEach((b) => allGamesSet.add(b.gameId));
    allGamesSet.forEach((gid) => {
      loadedCal[gid] = loadGameCalibration(gid);
    });
    setCalibrations(loadedCal);

    if (initialScope === 'all-games') {
      const targetList = initialBets.length > 0 ? initialBets : allSavedBets;
      setSelectedIds(targetList.map((b) => b.id));
    } else {
      const validInitial = initialBets.filter((b) => b.gameId === gameId);
      if (validInitial.length > 0) {
        setSelectedIds(validInitial.map((b) => b.id));
      } else {
        const sameGame = allSavedBets.filter((b) => b.gameId === gameId);
        setSelectedIds(sameGame.length > 0 ? [sameGame[0].id] : []);
      }
    }
  }, [isOpen, initialScope, gameId, initialBets, allSavedBets]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleScopeSwitch = (nextScope: PdfExportScope) => {
    setScope(nextScope);
    setMode(nextScope === 'all-games' ? 'summary-sheet' : 'original-slip');
    setPreviewSlipIndex(0);
    setLastDownloadedFile(null);
    if (nextScope === 'all-games') {
      const map = new Map<string, GeneratedBet>();
      initialBets.forEach((b) => map.set(b.id, b));
      allSavedBets.forEach((b) => map.set(b.id, b));
      setSelectedIds(Array.from(map.keys()));
    } else {
      const sameGameInitial = initialBets.filter((b) => b.gameId === gameId);
      if (sameGameInitial.length > 0) {
        setSelectedIds(sameGameInitial.map((b) => b.id));
      } else {
        const sameGameSaved = allSavedBets.filter((b) => b.gameId === gameId);
        setSelectedIds(sameGameSaved.length > 0 ? [sameGameSaved[0].id] : []);
      }
    }
  };

  const selectedBets = useMemo(
    () =>
      selectedIds
        .map((id) => availableBets.find((b) => b.id === id))
        .filter((b): b is GeneratedBet => Boolean(b)),
    [selectedIds, availableBets]
  );

  const slipPages = useMemo(
    () => buildMultiGameSlipPages(selectedBets),
    [selectedBets]
  );

  const summaryPages = useMemo(
    () => buildSummarySheetPages(selectedBets),
    [selectedBets]
  );

  const isSummaryMode = mode === 'summary-sheet';
  const totalPreviewPages = isSummaryMode
    ? summaryPages.length
    : slipPages.length;

  const safePreviewIndex = Math.min(
    previewSlipIndex,
    Math.max(0, totalPreviewPages - 1)
  );

  const previewPage = slipPages[safePreviewIndex];
  const previewSummaryPage = summaryPages[safePreviewIndex];
  const previewGameId = previewPage?.gameId ?? gameId;
  const previewGame = getLotteryGameById(previewGameId);
  const activeCalibration =
    calibrations[previewGameId] ?? DEFAULT_SLIP_CALIBRATION;

  const layout = useMemo(
    () =>
      computeSlipLayout(
        previewGameId,
        previewPage?.bets ?? [],
        activeCalibration
      ),
    [previewGameId, previewPage, activeCalibration]
  );

  const selectedModalitiesCount = useMemo(
    () => new Set(selectedBets.map((b) => b.gameId)).size,
    [selectedBets]
  );

  if (!isOpen) return null;

  const updateCalibration = (patch: Partial<SlipCalibration>) => {
    const next: SlipCalibration = {
      ...activeCalibration,
      ...patch,
    };
    next.offsetXMm = Math.max(-15, Math.min(15, Number(next.offsetXMm.toFixed(1))));
    next.offsetYMm = Math.max(-15, Math.min(15, Number(next.offsetYMm.toFixed(1))));
    setCalibrations((prev) => ({ ...prev, [previewGameId]: next }));
    saveGameCalibration(previewGameId, next);
  };

  const toggleBetSelection = (betId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(betId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== betId);
      }
      return [...prev, betId];
    });
  };

  const handleDownload = () => {
    if (selectedBets.length === 0) return;
    if (scope === 'all-games' || selectedModalitiesCount > 1) {
      const file = downloadAllGamesPdf({
        bets: selectedBets,
        mode,
        calibrationByGame: calibrations,
        fallbackCalibration: activeCalibration,
      });
      setLastDownloadedFile(file);
    } else {
      const targetGid = selectedBets[0].gameId;
      const file = downloadLotteryPdf({
        gameId: targetGid,
        bets: selectedBets,
        mode,
        calibration: calibrations[targetGid] ?? activeCalibration,
      });
      setLastDownloadedFile(file);
    }
  };

  const modalTitle =
    scope === 'all-games'
      ? 'Exportar Todos os Jogos em um Único PDF'
      : `Exportar PDF para Impressão no Volante — ${primaryGame.name}`;

  const ctaColor =
    scope === 'all-games' ? '#0F172A' : primaryGame.officialColor;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-pdf"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2
              id="titulo-modal-pdf"
              className="font-display text-lg sm:text-xl font-bold text-slate-950"
            >
              {modalTitle}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isSummaryMode
                ? 'Folha A4 com nome do jogo, frase utilizada e números sorteados (sem o cartão).'
                : 'Formato A4 em escala real (1:1 em milímetros) compatível com impressoras comuns.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de exportação PDF"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Controls */}
          <div className="lg:col-span-7 space-y-5">
            {/* Scope Switcher: Current Game vs All Saved Games */}
            {(uniqueGamesInHistory > 1 || allSavedBets.length > 1) && (
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Abrangência do PDF
                </span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleScopeSwitch('single-game')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap truncate ${
                      scope === 'single-game'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Apenas {primaryGame.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScopeSwitch('all-games')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap truncate ${
                      scope === 'all-games'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos os jogos ({allSavedBets.length})
                  </button>
                </div>
              </div>
            )}

            {/* Export Mode */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                1. Escolha o modo do PDF
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(scope === 'all-games'
                  ? [
                      {
                        id: 'summary-sheet' as PdfExportMode,
                        title: 'Todos na Mesma Folha',
                        desc: 'Nome do jogo, frase e números em folha A4 (sem o cartão)',
                      },
                      {
                        id: 'original-slip' as PdfExportMode,
                        title: 'Cartão Original',
                        desc: 'Apenas marcações pretas para imprimir direto no volante',
                      },
                      {
                        id: 'test-grid' as PdfExportMode,
                        title: 'Folha de Teste 1:1',
                        desc: 'Grade completa em A4 para conferir alinhamento contra a luz',
                      },
                    ]
                  : [
                      {
                        id: 'original-slip' as PdfExportMode,
                        title: 'Cartão Original',
                        desc: 'Apenas marcações pretas para imprimir direto no volante',
                      },
                      {
                        id: 'test-grid' as PdfExportMode,
                        title: 'Folha de Teste 1:1',
                        desc: 'Grade completa em A4 para conferir alinhamento contra a luz',
                      },
                      {
                        id: 'summary-sheet' as PdfExportMode,
                        title: 'Lista na Mesma Folha',
                        desc: 'Nome do jogo, frase e números em folha A4 (sem o cartão)',
                      },
                    ]
                ).map((opt) => {
                  const active = mode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMode(opt.id);
                        setPreviewSlipIndex(0);
                      }}
                      className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{opt.title}</span>
                      <span
                        className={`block text-[11px] mt-1 leading-snug ${
                          active ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tray Alignment & Fine Calibration */}
            {mode !== 'summary-sheet' && (
              <div className="space-y-4 pt-1">
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    2. Posição do volante na bandeja ({previewGame.name})
                  </span>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
                    {(
                      [
                        { id: 'left', label: 'Esquerda' },
                        { id: 'center', label: 'Centro (Padrão)' },
                        { id: 'right', label: 'Direita' },
                      ] as { id: TrayAlignment; label: string }[]
                    ).map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => updateCalibration({ trayAlignment: pos.id })}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          activeCalibration.trayAlignment === pos.id
                            ? 'bg-white text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">
                      3. Calibração fina em mm ({previewGame.name})
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCalibration(DEFAULT_SLIP_CALIBRATION)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      <span>Zerar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs font-semibold text-slate-800">
                          Horizontal (X)
                        </span>
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          {activeCalibration.offsetXMm >= 0 ? '+' : ''}
                          {activeCalibration.offsetXMm.toFixed(1)} mm
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Deslocar 0,5 milímetro para a esquerda"
                          onClick={() =>
                            updateCalibration({
                              offsetXMm: activeCalibration.offsetXMm - 0.5,
                            })
                          }
                          className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Deslocar 0,5 milímetro para a direita"
                          onClick={() =>
                            updateCalibration({
                              offsetXMm: activeCalibration.offsetXMm + 0.5,
                            })
                          }
                          className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs font-semibold text-slate-800">
                          Vertical (Y)
                        </span>
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          {activeCalibration.offsetYMm >= 0 ? '+' : ''}
                          {activeCalibration.offsetYMm.toFixed(1)} mm
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Deslocar 0,5 milímetro para cima"
                          onClick={() =>
                            updateCalibration({
                              offsetYMm: activeCalibration.offsetYMm - 0.5,
                            })
                          }
                          className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Deslocar 0,5 milímetro para baixo"
                          onClick={() =>
                            updateCalibration({
                              offsetYMm: activeCalibration.offsetYMm + 0.5,
                            })
                          }
                          className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-bet selector spanning 1 or more games & slips */}
            {availableBets.length > 1 && (
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                    Apostas incluídas no PDF ({selectedBets.length} de{' '}
                    {availableBets.length} · {Math.max(1, totalPreviewPages)}{' '}
                    {isSummaryMode
                      ? totalPreviewPages === 1
                        ? 'folha A4'
                        : 'folhas A4'
                      : totalPreviewPages === 1
                        ? 'volante'
                        : 'volantes'}
                    )
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedIds(
                        selectedIds.length === availableBets.length
                          ? [availableBets[0].id]
                          : availableBets.map((b) => b.id)
                      )
                    }
                    className="text-xs font-medium text-slate-600 hover:text-slate-950 cursor-pointer"
                  >
                    {selectedIds.length === availableBets.length
                      ? 'Manter apenas 1'
                      : 'Selecionar todas'}
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableBets.map((bet) => {
                    const betGame = getLotteryGameById(bet.gameId);
                    const checked = selectedIds.includes(bet.id);
                    const summaryText =
                      betGame.kind === 'loteca'
                        ? '14 jogos'
                        : `${bet.numbers
                            .slice(0, 6)
                            .map((n) =>
                              formatLotteryNumber(n, betGame.zeroPaddedDigits)
                            )
                            .join(' ')}${bet.numbers.length > 6 ? ' ...' : ''}`;
                    return (
                      <button
                        key={bet.id}
                        type="button"
                        onClick={() => toggleBetSelection(bet.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          checked
                            ? 'border-slate-900 bg-slate-50 text-slate-950'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate font-mono tabular-nums">
                          <strong
                            className="font-sans font-semibold mr-1.5"
                            style={{ color: betGame.accentText }}
                          >
                            {betGame.name}
                          </strong>
                          {summaryText} — “{bet.phrase}”
                        </span>
                        {checked && (
                          <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Practical Home Printer Instructions */}
            {isSummaryMode ? (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <p className="font-semibold text-slate-900">
                  O que será impresso nesta folha A4:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
                  <li>
                    Cada aposta exibe o <strong className="text-slate-800">nome do jogo</strong>, a{' '}
                    <strong className="text-slate-800">frase utilizada</strong> e os{' '}
                    <strong className="text-slate-800">números sorteados</strong> — sem desenho de cartão.
                  </li>
                  <li>
                    Todas as apostas selecionadas ficam juntas na mesma folha A4,
                    continuando em uma nova folha apenas se a página ficar cheia.
                  </li>
                  <li>
                    Imprima normalmente em papel sulfite A4 comum (preto e branco ou colorido).
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <p className="font-semibold text-slate-900">
                  Como imprimir no cartão original usando uma impressora simples:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
                  <li>
                    No leitor de PDF, selecione{' '}
                    <strong className="text-slate-800">Tamanho Real (100%)</strong> e
                    desative &ldquo;Ajustar à página&rdquo;.
                  </li>
                  <li>
                    Cada modalidade é organizada em páginas separadas para que nenhum
                    volante misture jogos diferentes.
                  </li>
                  <li>
                    Teste primeiro na{' '}
                    <strong className="text-slate-800">Folha de Teste 1:1</strong> e
                    depois imprima o modo{' '}
                    <strong className="text-slate-800">Cartão Original</strong> direto
                    nos volantes oficiais.
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Right Column: Proportional A4 Live Preview (List Sheet OR Optical Slip) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="w-full flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-semibold text-slate-800">
                Prévia A4 (210 × 297 mm)
              </span>
              <span className="font-mono tabular-nums">
                {selectedBets.length}{' '}
                {selectedBets.length === 1 ? 'jogo' : 'jogos'} ·{' '}
                {Math.max(1, totalPreviewPages)}{' '}
                {totalPreviewPages === 1 ? 'folha' : 'folhas'}
              </span>
            </div>

            {totalPreviewPages > 0 && (
              <div className="w-full flex items-center justify-between gap-2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs">
                <button
                  type="button"
                  aria-label="Ver folha anterior"
                  disabled={safePreviewIndex <= 0}
                  onClick={() => setPreviewSlipIndex((p) => Math.max(0, p - 1))}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-semibold text-slate-800 tabular-nums truncate">
                  {isSummaryMode
                    ? `Mesma Folha · Pág. ${safePreviewIndex + 1}/${summaryPages.length}`
                    : `${previewGame.name} · Pág. ${safePreviewIndex + 1}/${slipPages.length}`}
                </span>
                <button
                  type="button"
                  aria-label="Ver próxima folha"
                  disabled={safePreviewIndex >= totalPreviewPages - 1}
                  onClick={() =>
                    setPreviewSlipIndex((p) =>
                      Math.min(totalPreviewPages - 1, p + 1)
                    )
                  }
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isSummaryMode ? (
              <div
                data-testid="a4-summary-preview"
                aria-label="Prévia da folha A4 com nome do jogo, frase e números"
                className="w-full max-w-[260px] bg-white border border-slate-300 shadow-xs aspect-[210/297] p-3.5 flex flex-col justify-between overflow-hidden text-left"
              >
                <div className="space-y-2 overflow-hidden">
                  {safePreviewIndex === 0 && (
                    <div className="pb-1.5 border-b border-slate-900">
                      <p className="font-display font-bold text-[10px] leading-tight text-slate-950 truncate">
                        {selectedModalitiesCount === 1 && selectedBets[0]
                          ? `Apostas — ${getLotteryGameById(selectedBets[0].gameId).name} (${selectedBets.length})`
                          : `Todos os Jogos (${selectedBets.length} ${selectedBets.length === 1 ? 'aposta' : 'apostas'})`}
                      </p>
                      <p className="text-[7px] text-slate-500 mt-0.5">
                        {selectedModalitiesCount}{' '}
                        {selectedModalitiesCount === 1 ? 'modalidade' : 'modalidades'} · Nome do jogo, frase e números
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {(previewSummaryPage?.entries ?? []).map((entry) => (
                      <div
                        key={entry.betId}
                        className="pl-2 border-l-2 pb-1.5 border-b border-slate-100 last:border-b-0"
                        style={{ borderLeftColor: entry.accentColor }}
                      >
                        <p
                          className="font-bold text-[8.5px] leading-tight"
                          style={{ color: entry.accentColor }}
                        >
                          {entry.index}. {entry.gameName}
                        </p>
                        <p className="text-[7px] text-slate-600 leading-snug line-clamp-2 mt-0.5">
                          Frase: &ldquo;{entry.phrase}&rdquo;
                        </p>
                        <p className="font-mono font-bold text-[8px] text-slate-950 leading-snug mt-0.5 break-words tabular-nums">
                          {entry.numbersText}
                        </p>
                        {entry.extrasText && (
                          <p className="text-[7px] font-semibold text-slate-700 mt-0.5 truncate">
                            {entry.extrasText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[6.5px] text-slate-400">
                  <span>Lista sem cartão</span>
                  <span className="tabular-nums">
                    Folha {safePreviewIndex + 1}/{Math.max(1, summaryPages.length)}
                  </span>
                </div>
              </div>
            ) : (
              <div
                data-testid="a4-slip-preview"
                className="w-full max-w-[240px] bg-white border border-slate-300 shadow-xs aspect-[210/297] relative overflow-hidden"
              >
                <svg
                  viewBox={`0 0 ${A4_WIDTH_MM} ${A4_HEIGHT_MM}`}
                  className="w-full h-full block"
                  role="img"
                  aria-label={`Prévia proporcional da página A4 com as marcações de ${previewGame.name}`}
                >
                  {/* Slip boundary */}
                  <rect
                    x={layout.cardX}
                    y={layout.cardY}
                    width={layout.cardWidth}
                    height={layout.cardHeight}
                    fill={mode === 'original-slip' ? '#FAF9F5' : '#FFFFFF'}
                    stroke={mode === 'original-slip' ? '#CBD5E1' : '#64748B'}
                    strokeWidth={mode === 'original-slip' ? '0.6' : '0.8'}
                    strokeDasharray="3 2"
                  />

                  {/* Guide cells */}
                  {layout.guides.map((cell, i) =>
                    cell.marked ? null : (
                      <rect
                        key={`g-${i}`}
                        x={cell.x}
                        y={cell.y}
                        width={cell.w}
                        height={cell.h}
                        fill="none"
                        stroke={mode === 'test-grid' ? '#CBD5E1' : '#E2E8F0'}
                        strokeWidth="0.35"
                      />
                    )
                  )}

                  {/* Solid black optical marks */}
                  {layout.marks.map((mark, i) => (
                    <rect
                      key={`m-${i}`}
                      x={mark.x}
                      y={mark.y}
                      width={mark.w}
                      height={mark.h}
                      fill="#000000"
                    />
                  ))}
                </svg>
              </div>
            )}

            <div className="w-full mt-4 space-y-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={selectedBets.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-45 cursor-pointer"
                style={{ backgroundColor: ctaColor }}
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {scope === 'all-games' || selectedModalitiesCount > 1
                    ? `Baixar PDF Único (${selectedBets.length} jogos)`
                    : 'Baixar PDF para Impressão'}
                </span>
              </button>

              {lastDownloadedFile && (
                <p
                  role="status"
                  className="text-center text-xs font-medium text-emerald-700"
                >
                  Arquivo gerado: {lastDownloadedFile}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
