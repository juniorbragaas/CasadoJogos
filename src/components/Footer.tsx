import { AppModule, NavSection } from './Header';
import type { RussianRouletteSubmenu } from './RussianRouletteView';

interface FooterProps {
  activeModule: AppModule;
  savedCount: number;
  bingoDrawnCount: number;
  registeredPrizesCount: number;
  russianRouletteSubmenu: RussianRouletteSubmenu;
  activeSection: NavSection;
  onSelectHome: () => void;
  onNavigate: (section: NavSection) => void;
  onSelectBingo: () => void;
  onSelectRussianRoulette: (submenu: RussianRouletteSubmenu) => void;
  onSelectBaralhoBks: () => void;
}

const MOBILE_LOTTERY_NAV: { id: NavSection; label: string }[] = [
  { id: 'jogos', label: 'Jogos' },
  { id: 'gerador', label: 'Gerador' },
  { id: 'volante', label: 'Volante' },
  { id: 'historico', label: 'Histórico' },
];

export function Footer({
  activeModule,
  savedCount,
  bingoDrawnCount,
  registeredPrizesCount,
  russianRouletteSubmenu,
  activeSection,
  onSelectHome,
  onNavigate,
  onSelectBingo,
  onSelectRussianRoulette,
  onSelectBaralhoBks,
}: FooterProps) {
  const scrollToBingo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 h-11 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Mobile compact navigation */}
        <nav
          aria-label="Navegação rápida móvel"
          className="flex md:hidden items-center justify-between w-full gap-1 text-xs font-medium"
        >
          {activeModule === 'inicio' ? (
            <>
              <button
                type="button"
                onClick={onSelectHome}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-slate-950 font-semibold bg-slate-100 cursor-pointer"
              >
                Início
              </button>
              <button
                type="button"
                onClick={() => onNavigate('jogos')}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Loterias
              </button>
              <button
                type="button"
                onClick={onSelectBingo}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-[#0F5132] font-semibold cursor-pointer"
              >
                Bingo
              </button>
              <button
                type="button"
                onClick={() => onSelectRussianRoulette('sorteio')}
                className="px-2 py-1.5 rounded-md whitespace-nowrap shrink-0 text-[#B91C1C] font-semibold cursor-pointer"
              >
                Roleta
              </button>
              <button
                type="button"
                onClick={onSelectBaralhoBks}
                className="px-2 py-1.5 rounded-md whitespace-nowrap shrink-0 text-[#6B1218] font-semibold cursor-pointer"
              >
                Baralho BKS
              </button>
            </>
          ) : activeModule === 'loterias' ? (
            <>
              {MOBILE_LOTTERY_NAV.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`px-2 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? 'text-slate-950 font-semibold bg-slate-100'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                    {item.id === 'historico' && savedCount > 0
                      ? ` (${savedCount})`
                      : ''}
                  </button>
                );
              })}
            </>
          ) : activeModule === 'bingo' ? (
            <>
              <button
                type="button"
                onClick={() => scrollToBingo('bingo-roleta')}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-slate-950 font-semibold bg-slate-100 cursor-pointer"
              >
                Roleta
              </button>
              <button
                type="button"
                onClick={() => scrollToBingo('bingo-tabuleiro')}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Tabuleiro ({bingoDrawnCount}/99)
              </button>
              <button
                type="button"
                onClick={onSelectHome}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Início
              </button>
            </>
          ) : activeModule === 'baralho-bks' ? (
            <>
              <span className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-[#6B1218] font-semibold bg-slate-100">
                BARALHO BKS (32)
              </span>
              <button
                type="button"
                onClick={onSelectHome}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Início
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onSelectRussianRoulette('sorteio')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                  russianRouletteSubmenu === 'sorteio'
                    ? 'text-slate-950 font-semibold bg-slate-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sorteios
              </button>
              <button
                type="button"
                onClick={() => onSelectRussianRoulette('cadastro')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                  russianRouletteSubmenu === 'cadastro'
                    ? 'text-slate-950 font-semibold bg-slate-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Prêmios ({registeredPrizesCount}/60)
              </button>
              <button
                type="button"
                onClick={onSelectHome}
                className="px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Início
              </button>
            </>
          )}
        </nav>

        {/* Desktop quiet footer */}
        <div className="hidden md:flex items-center justify-between w-full text-xs text-slate-600">
          <p className="whitespace-nowrap truncate">
            {activeModule === 'inicio'
              ? 'BRINQUE COM JOGOS · Gerador de Loterias, Bingo 1 a 99, Roleta da Sorte e BARALHO BKS'
              : activeModule === 'bingo'
                ? 'BRINQUE COM JOGOS · Bingo 1 a 99 com roleta e tabuleiro por dezenas'
                : activeModule === 'roleta-russa'
                  ? 'BRINQUE COM JOGOS · Roleta da Sorte de prêmios (cartões 1 a 60)'
                  : activeModule === 'baralho-bks'
                    ? 'BRINQUE COM JOGOS · BARALHO BKS com 32 cartas, flip 3D e armazenamento local'
                    : 'BRINQUE COM JOGOS · Gerador de Loterias com impressão calibrada em A4'}
          </p>
          <div className="flex items-center gap-3 shrink-0 tabular-nums">
            {activeModule === 'inicio' ? (
              <span className="text-slate-600 font-medium whitespace-nowrap">
                Dados salvos localmente neste dispositivo
              </span>
            ) : activeModule === 'bingo' ? (
              <span className="text-slate-700 font-medium whitespace-nowrap">
                {bingoDrawnCount} de 99 bolas sorteadas nesta rodada
              </span>
            ) : activeModule === 'roleta-russa' ? (
              <button
                type="button"
                onClick={() => onSelectRussianRoulette('cadastro')}
                className="text-slate-700 hover:text-slate-950 font-medium underline-offset-4 hover:underline whitespace-nowrap cursor-pointer"
              >
                {registeredPrizesCount} de 60 prêmios cadastrados localmente
              </button>
            ) : activeModule === 'baralho-bks' ? (
              <span className="text-slate-700 font-medium whitespace-nowrap">
                Baralho salvo localmente via IndexedDB
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('historico')}
                className="text-slate-700 hover:text-slate-950 font-medium underline-offset-4 hover:underline whitespace-nowrap cursor-pointer"
              >
                {savedCount === 0
                  ? 'Nenhuma aposta salva localmente'
                  : savedCount === 1
                    ? '1 aposta salva neste dispositivo'
                    : `${savedCount} apostas salvas neste dispositivo`}
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
