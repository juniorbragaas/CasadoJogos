import { useEffect, useMemo, useState } from 'react';
import { Check, Download, RotateCcw, X } from 'lucide-react';
import {
  BINGO_CARD_PER_COLUMN,
  BINGO_CARD_TOTAL_NUMBERS,
  formatBingoNumber,
  getBingoBallTheme,
  getBingoCardColumnCounts,
  getBingoDecadeColumns,
  isBingoCardComplete,
  toggleBingoCardNumber,
} from '../utils/bingoEngine';
import { downloadBingoCardPdf } from '../utils/pdfExporter';

interface BingoCardModalProps {
  isOpen: boolean;
  gameNumber: number;
  onClose: () => void;
}

export function BingoCardModal({
  isOpen,
  gameNumber,
  onClose,
}: BingoCardModalProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [savedFileName, setSavedFileName] = useState<string | null>(null);

  useEffect(() => {
    setSelectedNumbers([]);
    setSavedFileName(null);
  }, [gameNumber]);

  const columns = useMemo(() => getBingoDecadeColumns(), []);
  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);
  const columnCounts = useMemo(
    () => getBingoCardColumnCounts(selectedNumbers),
    [selectedNumbers]
  );
  const isComplete = useMemo(
    () => isBingoCardComplete(selectedNumbers),
    [selectedNumbers]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const remainingTotal = BINGO_CARD_TOTAL_NUMBERS - selectedNumbers.length;

  const handleToggleNumber = (num: number) => {
    setSelectedNumbers((prev) => toggleBingoCardNumber(prev, num));
    setSavedFileName(null);
  };

  const handleClearSelection = () => {
    setSelectedNumbers([]);
    setSavedFileName(null);
  };

  const handleSavePdf = () => {
    if (!isComplete) return;
    const fileName = downloadBingoCardPdf(selectedNumbers, gameNumber);
    setSavedFileName(fileName);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-cartao-bingo"
      data-testid="bingo-card-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl max-h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Clean Minimal Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2
              id="titulo-modal-cartao-bingo"
              className="font-display text-lg sm:text-xl font-bold text-slate-950 flex items-center gap-2 flex-wrap"
            >
              <span>Gerar Cartão de Bingo</span>
              <span
                data-testid="bingo-card-modal-game-badge"
                className="font-mono text-xs sm:text-sm font-bold text-[#0F5132] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md tabular-nums"
              >
                Jogo #{gameNumber}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 tabular-nums">
              Cartão válido para o{' '}
              <strong className="text-slate-900">Jogo #{gameNumber}</strong> ·
              Selecione exatamente{' '}
              <strong className="text-slate-900">
                {BINGO_CARD_PER_COLUMN} números por coluna
              </strong>{' '}
              ({selectedNumbers.length} de {BINGO_CARD_TOTAL_NUMBERS} escolhidos)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedNumbers.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 bg-white border border-slate-200 hover:border-red-300 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Limpar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal de cartão do Bingo"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Modal Body: ONLY the Interactive 10-Column Bingo Board */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <div className="overflow-x-auto pb-1">
            <div
              data-testid="bingo-card-builder-board"
              className="grid grid-cols-10 gap-1.5 sm:gap-2 min-w-[640px]"
            >
              {columns.map((col) => {
                const colTheme = getBingoBallTheme(col.min);
                const countInCol = columnCounts[col.decadeIndex];
                const colComplete = countInCol === BINGO_CARD_PER_COLUMN;

                return (
                  <div
                    key={col.decadeIndex}
                    data-testid={`bingo-card-col-${col.decadeIndex}`}
                    data-col-count={countInCol}
                    className="flex flex-col gap-1.5"
                  >
                    {/* Decade Column Header + 0/5..5/5 Progress */}
                    <div
                      className={`rounded-lg py-1.5 px-1 text-center border transition-colors ${
                        colComplete
                          ? 'bg-[#0F5132] border-[#0F5132] text-white'
                          : 'border-slate-200/90'
                      }`}
                      style={
                        colComplete
                          ? undefined
                          : { backgroundColor: colTheme.labelBg }
                      }
                    >
                      <span
                        className="block font-mono text-[11px] sm:text-xs font-bold tabular-nums leading-tight"
                        style={colComplete ? undefined : { color: colTheme.bg }}
                      >
                        {col.label}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center gap-0.5 font-mono text-[10px] font-semibold tabular-nums leading-tight mt-0.5 ${
                          colComplete ? 'text-emerald-100' : 'text-slate-600'
                        }`}
                      >
                        {colComplete && (
                          <Check className="w-2.5 h-2.5" aria-hidden="true" />
                        )}
                        <span>
                          {countInCol}/{BINGO_CARD_PER_COLUMN}
                        </span>
                      </span>
                    </div>

                    {/* Selectable Numbers Inside Column */}
                    <div className="flex flex-col gap-1.5">
                      {col.numbers.map((num) => {
                        const isSelected = selectedSet.has(num);
                        const isBlocked = !isSelected && colComplete;

                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={isBlocked}
                            onClick={() => handleToggleNumber(num)}
                            aria-pressed={isSelected}
                            aria-label={`Número ${formatBingoNumber(num)} da coluna ${col.label}${
                              isSelected
                                ? ' (selecionado)'
                                : isBlocked
                                  ? ' (coluna completa com 5 números)'
                                  : ''
                            }`}
                            data-testid={`bingo-card-num-${num}`}
                            data-selected={isSelected ? 'true' : 'false'}
                            className={`h-9 sm:h-10 rounded-lg flex items-center justify-center font-mono text-xs sm:text-sm tabular-nums transition-all select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${
                              isSelected
                                ? 'bg-[#0F5132] text-white font-extrabold ring-2 ring-emerald-700/30 shadow-xs cursor-pointer'
                                : isBlocked
                                  ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                                  : 'bg-white text-slate-700 font-semibold border border-slate-200 hover:border-[#0F5132] hover:bg-emerald-50/70 hover:text-[#0F5132] cursor-pointer'
                            }`}
                          >
                            {formatBingoNumber(num)}
                          </button>
                        );
                      })}

                      {/* Visual alignment spacer for 01–09 (9 numbers) */}
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

        {/* Modal Footer: Progress status; "Salvar" button appears once all 10 columns have 5 numbers */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs sm:text-sm tabular-nums">
            {savedFileName ? (
              <span
                role="status"
                data-testid="bingo-card-saved-feedback"
                className="inline-flex items-center gap-1.5 font-semibold text-emerald-800"
              >
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>PDF do cartão salvo ({savedFileName})!</span>
              </span>
            ) : isComplete ? (
              <span className="font-semibold text-[#0F5132]">
                Todas as 10 colunas completas (50 números)! Clique em Salvar para gerar o PDF do Jogo #{gameNumber}.
              </span>
            ) : (
              <span className="text-slate-600">
                Faltam <strong className="text-slate-900">{remainingTotal}</strong>{' '}
                {remainingTotal === 1 ? 'número' : 'números'} para liberar o botão Salvar.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {isComplete && (
              <button
                type="button"
                onClick={handleSavePdf}
                data-testid="bingo-card-save-pdf-btn"
                aria-label="Salvar cartão do Bingo em PDF"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#0F5132] hover:bg-[#0c4228] rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Salvar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
