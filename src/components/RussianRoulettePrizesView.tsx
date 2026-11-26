import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Gift,
  Play,
  RotateCcw,
  Save,
  Search,
  Shuffle,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_PRIZE_DESCRIPTIONS,
  formatCardNumber,
  PrizeCard,
  TOTAL_ROULETTE_CARDS,
} from '../utils/russianRouletteEngine';

interface RussianRoulettePrizesViewProps {
  prizeCards: PrizeCard[];
  openedCardNumbers: number[];
  onSaveCard: (cardNumber: number, description: string) => void;
  onShuffleCards: () => void;
  onRestoreDefaults: () => void;
  onClearAllCards: () => void;
  onGoToDraw: () => void;
}

type CardFilter = 'all' | 'filled' | 'empty';

export function RussianRoulettePrizesView({
  prizeCards,
  openedCardNumbers,
  onSaveCard,
  onShuffleCards,
  onRestoreDefaults,
  onClearAllCards,
  onGoToDraw,
}: RussianRoulettePrizesViewProps) {
  const [editingNumber, setEditingNumber] = useState<number>(1);
  const [draftDescription, setDraftDescription] = useState<string>(
    () => prizeCards.find((c) => c.number === 1)?.description ?? ''
  );
  const [savedFeedback, setSavedFeedback] = useState<number | null>(null);
  const [shuffleCount, setShuffleCount] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CardFilter>('all');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Keep the active card editor synchronized whenever prize cards change (shuffle, restore, clear, save)
  useEffect(() => {
    const current = prizeCards.find((c) => c.number === editingNumber);
    setDraftDescription(current?.description ?? '');
  }, [prizeCards, editingNumber]);

  const openedSet = useMemo(() => new Set(openedCardNumbers), [openedCardNumbers]);

  const filledCount = useMemo(
    () => prizeCards.filter((c) => c.description.trim().length > 0).length,
    [prizeCards]
  );

  const emptyCount = TOTAL_ROULETTE_CARDS - filledCount;

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return prizeCards.filter((card) => {
      const hasDesc = card.description.trim().length > 0;
      if (filter === 'filled' && !hasDesc) return false;
      if (filter === 'empty' && hasDesc) return false;
      if (!q) return true;
      const numStr = String(card.number);
      const padded = formatCardNumber(card.number);
      return (
        numStr.includes(q) ||
        padded.includes(q) ||
        `cartão ${numStr}`.includes(q) ||
        `cartao ${numStr}`.includes(q) ||
        card.description.toLowerCase().includes(q)
      );
    });
  }, [prizeCards, filter, searchQuery]);

  const handleSelectCardToEdit = (cardNumber: number) => {
    setEditingNumber(cardNumber);
    const found = prizeCards.find((c) => c.number === cardNumber);
    setDraftDescription(found?.description ?? '');
    setFormError(null);
    setSavedFeedback(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draftDescription.trim();
    if (!trimmed) {
      setFormError('Informe a descrição do prêmio antes de salvar o cartão.');
      return;
    }
    onSaveCard(editingNumber, trimmed);
    setFormError(null);
    setSavedFeedback(editingNumber);
    setShuffleCount(0);
  };

  const handleClearCurrent = () => {
    onSaveCard(editingNumber, '');
    setDraftDescription('');
    setFormError(null);
    setSavedFeedback(null);
    setShuffleCount(0);
  };

  const handleShuffleClick = () => {
    if (filledCount === 0) return;
    onShuffleCards();
    setFormError(null);
    setSavedFeedback(null);
    setConfirmClearAll(false);
    setShuffleCount((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Card Editor Form (Cartão 1 a 60) */}
      <section
        aria-labelledby="titulo-cadastro-premios"
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2
              id="titulo-cadastro-premios"
              className="font-display text-lg sm:text-xl font-bold text-slate-950"
            >
              Cadastro de Prêmios — Cartão 1 a 60
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 tabular-nums">
              {filledCount} de {TOTAL_ROULETTE_CARDS} cartões cadastrados · Salvo automaticamente neste dispositivo
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToDraw}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Ir para Sorteios</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label
              htmlFor="select-numero-cartao"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Número do cartão (1 a 60)
            </label>
            <select
              id="select-numero-cartao"
              value={editingNumber}
              onChange={(e) => handleSelectCardToEdit(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {prizeCards.map((card) => (
                <option key={card.number} value={card.number}>
                  Cartão {formatCardNumber(card.number)}
                  {card.description.trim() ? ' ✓' : ' (vazio)'}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label
              htmlFor="input-descricao-premio"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Descrição do prêmio do Cartão {formatCardNumber(editingNumber)}
            </label>
            <input
              id="input-descricao-premio"
              type="text"
              value={draftDescription}
              onChange={(e) => {
                setDraftDescription(e.target.value);
                setFormError(null);
                setSavedFeedback(null);
              }}
              maxLength={140}
              placeholder="Ex.: Vale-Presente R$ 500,00 ou Cafeteira Expresso"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Salvar Cartão</span>
            </button>
            <button
              type="button"
              onClick={handleClearCurrent}
              title={`Limpar descrição do Cartão ${formatCardNumber(editingNumber)}`}
              aria-label={`Limpar descrição do Cartão ${formatCardNumber(editingNumber)}`}
              className="h-11 px-3 rounded-lg border border-slate-200 text-slate-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>

        {formError && (
          <p role="alert" className="text-xs font-medium text-red-700">
            {formError}
          </p>
        )}

        {savedFeedback !== null && (
          <div
            role="status"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
          >
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Cartão {formatCardNumber(savedFeedback)} salvo com sucesso!
            </span>
          </div>
        )}
      </section>

      {/* Filter Toolbar & 60-Card Grid */}
      <section
        aria-label="Lista de cartões cadastrados de 1 a 60"
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar cartão por número ou descrição do prêmio"
              placeholder="Buscar por número (01–60) ou prêmio..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div
              role="group"
              aria-label="Filtrar cartões"
              className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium"
            >
              {(
                [
                  { id: 'all', label: `Todos (${TOTAL_ROULETTE_CARDS})` },
                  { id: 'filled', label: `Preenchidos (${filledCount})` },
                  { id: 'empty', label: `Vazios (${emptyCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer tabular-nums ${
                    filter === tab.id
                      ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleShuffleClick}
              disabled={filledCount === 0}
              data-testid="roleta-shuffle-prizes-btn"
              title={
                filledCount === 0
                  ? 'Cadastre ao menos um prêmio para embaralhar'
                  : 'Embaralhar aleatoriamente todas as descrições de prêmios em novos números'
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#991B1B] bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 rounded-lg transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Embaralhar Prêmios</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onRestoreDefaults();
                setDraftDescription(
                  DEFAULT_PRIZE_DESCRIPTIONS[editingNumber - 1] ?? ''
                );
                setFormError(null);
                setSavedFeedback(null);
                setShuffleCount(0);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Restaurar Exemplos</span>
            </button>

            {!confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-red-300 hover:text-red-700 rounded-lg cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Limpar Todos</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-medium text-red-900">Apagar os 60?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllCards();
                    setDraftDescription('');
                    setConfirmClearAll(false);
                    setSavedFeedback(null);
                    setShuffleCount(0);
                  }}
                  className="font-bold text-red-700 hover:underline cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="font-medium text-slate-600 hover:underline cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {shuffleCount > 0 && (
          <div
            role="status"
            data-testid="roleta-shuffle-feedback"
            className="flex items-center justify-between gap-3 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5"
          >
            <span className="inline-flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>
                Prêmios embaralhados aleatoriamente e salvos em novos números!
                {shuffleCount > 1 ? ` (${shuffleCount}x)` : ''}
              </span>
            </span>
          </div>
        )}

        {/* 60-Card Interactive Grid */}
        {filteredCards.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
            Nenhum cartão encontrado para o filtro atual.
          </div>
        ) : (
          <div
            data-testid="roleta-prizes-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {filteredCards.map((card) => {
              const isSelected = editingNumber === card.number;
              const isEmpty = card.description.trim().length === 0;
              const isRedSlot = card.number % 2 === 1;
              const wasOpened = openedSet.has(card.number);

              return (
                <button
                  key={card.number}
                  type="button"
                  data-card-number={card.number}
                  onClick={() => handleSelectCardToEdit(card.number)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                    isSelected
                      ? 'border-slate-950 bg-slate-50 ring-1 ring-slate-950'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-extrabold tabular-nums shrink-0 border ${
                      isRedSlot
                        ? 'bg-[#B91C1C] text-white border-amber-400'
                        : 'bg-slate-900 text-white border-amber-400'
                    }`}
                  >
                    {formatCardNumber(card.number)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Cartão {formatCardNumber(card.number)}
                      </span>
                      {wasOpened && (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          Já aberto
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        isEmpty ? 'text-slate-400 italic' : 'text-slate-700'
                      }`}
                    >
                      {isEmpty ? 'Sem prêmio cadastrado — clique para editar' : card.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" aria-hidden="true" />
          <span>
            Clique em qualquer cartão acima para carregar e alterar a descrição do prêmio no formulário do topo.
          </span>
        </p>
      </section>
    </div>
  );
}
