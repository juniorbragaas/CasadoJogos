import { useMemo, useState } from 'react';
import {
  Eye,
  Printer,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import {
  getLotteryGameById,
  LOTTERY_GAMES,
  LotteryGameId,
} from '../data/lotteryGames';
import {
  formatLotteryNumber,
  GeneratedBet,
} from '../utils/lotteryEngine';

interface HistorySectionProps {
  bets: GeneratedBet[];
  onLoadBet: (bet: GeneratedBet) => void;
  onPrintBet: (bet: GeneratedBet) => void;
  onExportAllPdf: (betsToExport: GeneratedBet[]) => void;
  onToggleFavorite: (betId: string) => void;
  onDeleteBet: (betId: string) => void;
  onClearAll: () => void;
  onFocusGenerator: () => void;
}

export function HistorySection({
  bets,
  onLoadBet,
  onPrintBet,
  onExportAllPdf,
  onToggleFavorite,
  onDeleteBet,
  onClearAll,
  onFocusGenerator,
}: HistorySectionProps) {
  const [filterGame, setFilterGame] = useState<LotteryGameId | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredBets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bets.filter((bet) => {
      if (filterGame !== 'all' && bet.gameId !== filterGame) return false;
      if (onlyFavorites && !bet.favorite) return false;
      if (q) {
        const game = getLotteryGameById(bet.gameId);
        const matchesPhrase = bet.phrase.toLowerCase().includes(q);
        const matchesGame = game.name.toLowerCase().includes(q);
        const matchesSeed = bet.seedFingerprint.toLowerCase().includes(q);
        if (!matchesPhrase && !matchesGame && !matchesSeed) return false;
      }
      return true;
    });
  }, [bets, filterGame, onlyFavorites, searchQuery]);

  return (
    <section
      id="historico"
      aria-labelledby="titulo-historico"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 scroll-mt-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2
            id="titulo-historico"
            className="font-display text-xl sm:text-2xl font-bold text-slate-950"
          >
            Histórico de Apostas Locais
          </h2>
          <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
            Salvo apenas neste dispositivo · {bets.length}{' '}
            {bets.length === 1 ? 'aposta registrada' : 'apostas registradas'}
          </p>
        </div>

        {bets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onExportAllPdf(filteredBets.length > 0 ? filteredBets : bets)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                {filteredBets.length !== bets.length && filteredBets.length > 0
                  ? `Exportar ${filteredBets.length} filtrados em PDF`
                  : `Exportar todos em PDF (${bets.length})`}
              </span>
            </button>

            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Limpar histórico
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs font-medium text-red-800">
                  Apagar todas?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-xs font-medium text-slate-600 hover:underline cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Toolbar */}
      {bets.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="busca-historico" className="sr-only">
              Buscar no histórico por frase ou jogo
            </label>
            <input
              id="busca-historico"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por frase, código ou loteria..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="filtro-jogo-historico" className="sr-only">
              Filtrar por modalidade
            </label>
            <select
              id="filtro-jogo-historico"
              value={filterGame}
              onChange={(e) =>
                setFilterGame(e.target.value as LotteryGameId | 'all')
              }
              className="px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              <option value="all">Todas as modalidades</option>
              {LOTTERY_GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyFavorites((prev) => !prev)}
              aria-pressed={onlyFavorites}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                onlyFavorites
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              <span>Favoritas</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {bets.length === 0 ? (
        <div className="mt-6 py-10 px-4 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-800">
            Nenhuma aposta salva ainda neste dispositivo.
          </p>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            Assim que você sortear seus primeiros números com uma frase da sorte, eles ficarão arquivados aqui para consulta e impressão em PDF.
          </p>
          <button
            type="button"
            onClick={onFocusGenerator}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Fazer primeiro sorteio
          </button>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="mt-6 py-8 px-4 text-center rounded-lg border border-slate-200 bg-slate-50/50">
          <p className="text-sm text-slate-600">
            Nenhuma aposta encontrada para os filtros aplicados.
          </p>
        </div>
      ) : (
        <ul
          data-testid="history-bets-list"
          className="mt-5 divide-y divide-slate-200"
        >
          {filteredBets.map((bet) => {
            const game = getLotteryGameById(bet.gameId);
            const dateStr = new Date(bet.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <li
                key={bet.id}
                className="py-4 first:pt-2 last:pb-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Quiet unboxed metadata line */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span
                      className="font-display font-bold text-sm"
                      style={{ color: game.accentText }}
                    >
                      {game.name}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-500 tabular-nums">{dateStr}</span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      Cód. {bet.seedFingerprint}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 italic truncate">
                    “{bet.phrase}”
                  </p>

                  {/* Numbers or Loteca compact readout */}
                  {game.kind === 'loteca' && bet.lotecaMatches ? (
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px] tabular-nums">
                      {bet.lotecaMatches.map((m) => (
                        <span
                          key={m.matchNumber}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-medium"
                        >
                          J{formatLotteryNumber(m.matchNumber)}:{m.columns.join('')}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="font-mono text-xs sm:text-sm font-semibold text-slate-900 tabular-nums leading-relaxed">
                        {bet.numbers
                          .map((n) => formatLotteryNumber(n, game.zeroPaddedDigits))
                          .join(' · ')}
                      </p>
                      {(bet.clovers?.length ||
                        bet.luckyMonthName ||
                        bet.heartTeamName) && (
                        <p className="text-xs text-slate-600 font-medium tabular-nums">
                          {bet.clovers?.length
                            ? `Trevos da Sorte: ${bet.clovers.join(', ')}`
                            : null}
                          {bet.luckyMonthName
                            ? `Mês de Sorte: ${bet.luckyMonthName}`
                            : null}
                          {bet.heartTeamName
                            ? `Time do Coração: ${formatLotteryNumber(
                                (bet.heartTeamIndex ?? 0) + 1
                              )} — ${bet.heartTeamName}`
                            : null}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Row Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(bet.id)}
                    aria-label={
                      bet.favorite
                        ? `Remover ${game.name} ${bet.seedFingerprint} das favoritas`
                        : `Marcar ${game.name} ${bet.seedFingerprint} como favorita`
                    }
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      bet.favorite
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${bet.favorite ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onLoadBet(bet)}
                    aria-label={`Ver aposta de ${game.name} ${bet.seedFingerprint} no volante`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrintBet(bet)}
                    aria-label={`Exportar PDF da aposta de ${game.name} ${bet.seedFingerprint}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
                    style={{ backgroundColor: game.officialColor }}
                  >
                    <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteBet(bet.id)}
                    aria-label={`Excluir aposta de ${game.name} ${bet.seedFingerprint}`}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
