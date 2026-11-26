import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  ClipboardList,
  Disc3,
  Dices,
  FileText,
  Grid3X3,
  History,
  Home,
  Layers,
  LayoutGrid,
  Sparkles,
  X,
} from 'lucide-react';
import type { AppModule, NavSection } from './Header';
import type { RussianRouletteSubmenu } from './RussianRouletteView';

interface SidebarMenuProps {
  isOpen: boolean;
  activeModule: AppModule;
  activeSection: NavSection;
  russianRouletteSubmenu: RussianRouletteSubmenu;
  savedCount: number;
  bingoDrawnCount: number;
  registeredPrizesCount: number;
  accentColor: string;
  onClose: () => void;
  onSelectHome: () => void;
  onSelectLotterySection: (section: NavSection) => void;
  onSelectBingo: () => void;
  onSelectRussianRoulette: (submenu: RussianRouletteSubmenu) => void;
  onSelectBaralhoBks: () => void;
}

const LOTTERY_SUBMENUS: {
  id: NavSection;
  label: string;
  description: string;
  icon: typeof Grid3X3;
}[] = [
  {
    id: 'jogos',
    label: 'Jogos',
    description: '8 modalidades oficiais',
    icon: LayoutGrid,
  },
  {
    id: 'gerador',
    label: 'Gerador',
    description: 'Sortear com frase da sorte',
    icon: Sparkles,
  },
  {
    id: 'volante',
    label: 'Volante',
    description: 'Prévia e impressão PDF',
    icon: FileText,
  },
  {
    id: 'historico',
    label: 'Histórico',
    description: 'Apostas salvas localmente',
    icon: History,
  },
];

export function SidebarMenu({
  isOpen,
  activeModule,
  activeSection,
  russianRouletteSubmenu,
  savedCount,
  bingoDrawnCount,
  registeredPrizesCount,
  accentColor,
  onClose,
  onSelectHome,
  onSelectLotterySection,
  onSelectBingo,
  onSelectRussianRoulette,
  onSelectBaralhoBks,
}: SidebarMenuProps) {
  const [lotteriesExpanded, setLotteriesExpanded] = useState(true);
  const [rouletteExpanded, setRouletteExpanded] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação do sistema"
        >
          {/* Scrim backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Slide-over drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-80 max-w-[85vw] bg-white h-full border-r border-slate-200 shadow-xl flex flex-col"
          >
            {/* Drawer header */}
            <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
              <span className="font-display text-base font-bold tracking-tight text-slate-950">
                BRINQUE COM JOGOS
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu lateral"
                className="p-2 -mr-2 rounded-lg text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation tree */}
            <nav
              aria-label="Módulos do sistema"
              className="flex-1 overflow-y-auto p-4 space-y-2"
            >
              {/* Item 0: Tela Inicial */}
              <button
                type="button"
                onClick={() => {
                  onSelectHome();
                  onClose();
                }}
                aria-current={activeModule === 'inicio' ? 'page' : undefined}
                className={`w-full px-3.5 py-3 rounded-xl border flex items-center gap-3 text-left transition-colors cursor-pointer ${
                  activeModule === 'inicio'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activeModule === 'inicio'
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  <Home className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="block font-display text-sm font-bold leading-tight">
                    Início
                  </span>
                  <span
                    className={`block text-[11px] mt-0.5 truncate ${
                      activeModule === 'inicio'
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Pesquisa e menu de jogos
                  </span>
                </div>
              </button>

              {/* Item 1: Gerador de Loterias + Submenus */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLotteriesExpanded((prev) => !prev)}
                  aria-expanded={lotteriesExpanded}
                  className={`w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                    activeModule === 'loterias'
                      ? 'bg-white text-slate-950'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{
                        backgroundColor:
                          activeModule === 'loterias' ? accentColor : '#475569',
                      }}
                    >
                      <Dices className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-display text-sm font-bold leading-tight truncate">
                        Gerador de Loterias
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5 truncate">
                        8 modalidades oficiais Caixa
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${
                      lotteriesExpanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {lotteriesExpanded && (
                  <ul className="px-2 pb-2 pt-1 space-y-0.5 border-t border-slate-200/80 bg-white">
                    {LOTTERY_SUBMENUS.map((sub) => {
                      const Icon = sub.icon;
                      const isActive =
                        activeModule === 'loterias' && activeSection === sub.id;
                      return (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLotterySection(sub.id);
                              onClose();
                            }}
                            className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isActive ? 'text-white' : 'text-slate-500'
                                }`}
                                aria-hidden="true"
                              />
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold leading-tight">
                                  {sub.label}
                                </span>
                                <span
                                  className={`block text-[11px] leading-tight mt-0.5 truncate ${
                                    isActive ? 'text-slate-300' : 'text-slate-500'
                                  }`}
                                >
                                  {sub.description}
                                </span>
                              </span>
                            </span>
                            {sub.id === 'historico' && savedCount > 0 && (
                              <span
                                className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                                  isActive ? 'text-slate-200' : 'text-slate-500'
                                }`}
                              >
                                {savedCount}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Item 2: Bingo (1 a 99) */}
              <button
                type="button"
                onClick={() => {
                  onSelectBingo();
                  onClose();
                }}
                aria-current={activeModule === 'bingo' ? 'page' : undefined}
                className={`w-full px-3.5 py-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                  activeModule === 'bingo'
                    ? 'border-[#0F5132] bg-[#0F5132] text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      activeModule === 'bingo'
                        ? 'bg-white/15 text-white'
                        : 'bg-[#0F5132] text-white'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-display text-sm font-bold leading-tight">
                      Bingo
                    </span>
                    <span
                      className={`block text-[11px] mt-0.5 truncate ${
                        activeModule === 'bingo'
                          ? 'text-emerald-100'
                          : 'text-slate-500'
                      }`}
                    >
                      Roleta e tabuleiro de 1 a 99
                    </span>
                  </div>
                </div>
                {bingoDrawnCount > 0 && (
                  <span
                    className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                      activeModule === 'bingo'
                        ? 'text-emerald-100'
                        : 'text-slate-500'
                    }`}
                  >
                    {bingoDrawnCount}/99
                  </span>
                )}
              </button>

              {/* Item 3: Roleta da Sorte + Submenus (Cadastro de Prêmios / Sorteios) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRouletteExpanded((prev) => !prev)}
                  aria-expanded={rouletteExpanded}
                  className={`w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                    activeModule === 'roleta-russa'
                      ? 'bg-white text-slate-950'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#B91C1C]">
                      <Disc3 className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-display text-sm font-bold leading-tight truncate">
                        Roleta da Sorte
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5 truncate">
                        Prêmios 1 a 60 e sorteio 8s
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${
                      rouletteExpanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {rouletteExpanded && (
                  <ul className="px-2 pb-2 pt-1 space-y-0.5 border-t border-slate-200/80 bg-white">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRussianRoulette('cadastro');
                          onClose();
                        }}
                        className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                          activeModule === 'roleta-russa' &&
                          russianRouletteSubmenu === 'cadastro'
                            ? 'bg-[#B91C1C] text-white'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <ClipboardList
                            className={`w-4 h-4 shrink-0 ${
                              activeModule === 'roleta-russa' &&
                              russianRouletteSubmenu === 'cadastro'
                                ? 'text-white'
                                : 'text-slate-500'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold leading-tight">
                              Cadastro de Prêmios
                            </span>
                            <span
                              className={`block text-[11px] leading-tight mt-0.5 truncate ${
                                activeModule === 'roleta-russa' &&
                                russianRouletteSubmenu === 'cadastro'
                                  ? 'text-red-100'
                                  : 'text-slate-500'
                              }`}
                            >
                              Cartões 1 a 60
                            </span>
                          </span>
                        </span>
                        <span
                          className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                            activeModule === 'roleta-russa' &&
                            russianRouletteSubmenu === 'cadastro'
                              ? 'text-red-100'
                              : 'text-slate-500'
                          }`}
                        >
                          {registeredPrizesCount}/60
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRussianRoulette('sorteio');
                          onClose();
                        }}
                        className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                          activeModule === 'roleta-russa' &&
                          russianRouletteSubmenu === 'sorteio'
                            ? 'bg-[#B91C1C] text-white'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Dices
                            className={`w-4 h-4 shrink-0 ${
                              activeModule === 'roleta-russa' &&
                              russianRouletteSubmenu === 'sorteio'
                                ? 'text-white'
                                : 'text-slate-500'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold leading-tight">
                              Sorteios
                            </span>
                            <span
                              className={`block text-[11px] leading-tight mt-0.5 truncate ${
                                activeModule === 'roleta-russa' &&
                                russianRouletteSubmenu === 'sorteio'
                                  ? 'text-red-100'
                                  : 'text-slate-500'
                              }`}
                            >
                              Roleta animada de 8 segundos
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  </ul>
                )}
              </div>

              {/* Item 4: BARALHO BKS */}
              <button
                type="button"
                onClick={() => {
                  onSelectBaralhoBks();
                  onClose();
                }}
                aria-current={activeModule === 'baralho-bks' ? 'page' : undefined}
                className={`w-full px-3.5 py-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                  activeModule === 'baralho-bks'
                    ? 'border-[#6B1218] bg-[#6B1218] text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      activeModule === 'baralho-bks'
                        ? 'bg-white/15 text-white'
                        : 'bg-[#6B1218] text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-display text-sm font-bold leading-tight">
                      BARALHO BKS
                    </span>
                    <span
                      className={`block text-[11px] mt-0.5 truncate ${
                        activeModule === 'baralho-bks'
                          ? 'text-amber-100/90'
                          : 'text-slate-500'
                      }`}
                    >
                      32 cartas com flip 3D e tela cheia
                    </span>
                  </div>
                </div>
                <span
                  className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                    activeModule === 'baralho-bks'
                      ? 'text-amber-100/90'
                      : 'text-slate-500'
                  }`}
                >
                  32
                </span>
              </button>
            </nav>

            {/* Quiet drawer footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 text-xs text-slate-500">
              Dados salvos apenas neste dispositivo.
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
