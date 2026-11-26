import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Disc3,
  Dices,
  Grid3X3,
  Layers,
  Search,
  X,
} from 'lucide-react';
import {
  filterHomeGameCards,
  HomeGameCard,
  HomeGameCardId,
} from '../utils/homeCatalog';
import type { NavSection } from './Header';
import type { RussianRouletteSubmenu } from './RussianRouletteView';

interface HomeViewProps {
  savedBetsCount: number;
  bingoDrawnCount: number;
  registeredPrizesCount: number;
  onSelectLotterySection: (section: NavSection) => void;
  onSelectBingo: () => void;
  onSelectRussianRoulette: (submenu: RussianRouletteSubmenu) => void;
  onSelectBaralhoBks: () => void;
}

const CARD_ICONS: Record<HomeGameCardId, typeof Dices> = {
  loterias: Dices,
  bingo: Grid3X3,
  'roleta-russa': Disc3,
  'baralho-bks': Layers,
};

export function HomeView({
  savedBetsCount,
  bingoDrawnCount,
  registeredPrizesCount,
  onSelectLotterySection,
  onSelectBingo,
  onSelectRussianRoulette,
  onSelectBaralhoBks,
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const visibleCards = useMemo(
    () => filterHomeGameCards(searchQuery),
    [searchQuery]
  );

  const handleOpenCard = (card: HomeGameCard) => {
    if (card.id === 'loterias') {
      onSelectLotterySection('jogos');
    } else if (card.id === 'bingo') {
      onSelectBingo();
    } else if (card.id === 'baralho-bks') {
      onSelectBaralhoBks();
    } else {
      onSelectRussianRoulette('sorteio');
    }
  };

  const handleSubAction = (cardId: HomeGameCardId, actionId: string) => {
    if (cardId === 'loterias') {
      onSelectLotterySection(actionId as NavSection);
    } else if (cardId === 'bingo') {
      onSelectBingo();
    } else if (cardId === 'baralho-bks') {
      onSelectBaralhoBks();
    } else {
      onSelectRussianRoulette(actionId as RussianRouletteSubmenu);
    }
  };

  const getCardMetric = (cardId: HomeGameCardId): string => {
    if (cardId === 'loterias') {
      return savedBetsCount > 0 ? `${savedBetsCount} salvas` : '8 loterias';
    }
    if (cardId === 'bingo') {
      return bingoDrawnCount > 0 ? `${bingoDrawnCount}/99 bolas` : '1 a 99';
    }
    if (cardId === 'baralho-bks') {
      return '32 cartas';
    }
    return `${registeredPrizesCount}/60 prêmios`;
  };

  return (
    <div
      id="inicio-topo"
      className="max-w-5xl mx-auto py-4 sm:py-8 space-y-8"
    >
      {/* 1. Single Prominent Game Search Field */}
      <section aria-label="Pesquisar jogos" className="max-w-xl mx-auto">
        <label htmlFor="pesquisa-jogos-inicio" className="sr-only">
          Pesquisar jogos
        </label>
        <div className="relative">
          <Search
            className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="pesquisa-jogos-inicio"
            type="text"
            role="searchbox"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar jogos (Loterias, Bingo, Roleta da Sorte, Baralho BKS)..."
            className="w-full h-13 pl-12 pr-11 rounded-2xl border border-slate-200 bg-white text-sm sm:text-base text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpar pesquisa"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* 2. Clean Menu Cards Grid Only */}
      <section aria-label="Menu de jogos disponíveis">
        {visibleCards.length === 0 ? (
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">
              Nenhum jogo encontrado para &ldquo;{searchQuery.trim()}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Limpar pesquisa
            </button>
          </div>
        ) : (
          <div
            data-testid="home-menu-cards"
            className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
          >
            {visibleCards.map((card) => {
              const Icon = CARD_ICONS[card.id];
              return (
                <article
                  key={card.id}
                  data-menu-card={card.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  {/* Primary clickable card body */}
                  <button
                    type="button"
                    onClick={() => handleOpenCard(card)}
                    className="group flex-1 text-left p-6 space-y-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: card.accentColor }}
                      >
                        <Icon className="w-6 h-6" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums pt-1">
                        {getCardMetric(card.id)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-display text-lg font-bold text-slate-950 group-hover:text-slate-800">
                          {card.title}
                        </h2>
                        <ArrowRight
                          className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {card.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </button>

                  {/* Submenu direct shortcuts */}
                  <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    {card.subActions.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubAction(card.id, sub.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-900 hover:text-slate-950 rounded-lg transition-colors cursor-pointer"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
