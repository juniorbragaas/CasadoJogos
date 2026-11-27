import { Home, Menu } from 'lucide-react';

export type AppModule =
  | 'inicio'
  | 'loterias'
  | 'bingo'
  | 'roleta-russa'
  | 'baralho-bks'
  | 'memoria';
export type NavSection = 'jogos' | 'gerador' | 'volante' | 'historico';

interface HeaderProps {
  activeModule: AppModule;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onSelectHome: () => void;
}

export function Header({
  activeModule,
  menuOpen,
  onToggleMenu,
  onSelectHome,
}: HeaderProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Hamburger Menu + BRINQUE COM JOGOS Brand */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <button
            type="button"
            onClick={onToggleMenu}
            aria-label="Abrir menu lateral"
            aria-expanded={menuOpen}
            className="p-2 -ml-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              onSelectHome();
            }}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 rounded"
          >
            BRINQUE COM JOGOS
          </a>
        </div>

        {/* Right: Quiet Home return link only when inside a game module (no center menus, no Sortear Bola button) */}
        {activeModule !== 'inicio' && (
          <button
            type="button"
            onClick={onSelectHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Início</span>
          </button>
        )}
      </div>
    </header>
  );
}
