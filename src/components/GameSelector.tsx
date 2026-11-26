import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  LOTTERY_GAMES,
  LotteryGameConfig,
  LotteryGameId,
} from '../data/lotteryGames';

interface GameSelectorProps {
  selectedGameId: LotteryGameId;
  onSelectGame: (gameId: LotteryGameId) => void;
}

interface GameImageProps {
  game: LotteryGameConfig;
}

function GameCardImage({ game }: GameImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="w-full h-full flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(135deg, ${game.softBg} 0%, ${game.borderTint} 100%)`,
        }}
      >
        <span
          className="font-display text-lg font-bold tracking-tight"
          style={{ color: game.accentText }}
        >
          {game.name}
        </span>
      </div>
    );
  }

  return (
    <img
      src={game.image}
      alt={`Ilustração oficial do jogo ${game.name}`}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${game.imagePosition ?? 'object-center'} transition-transform duration-300 ease-out group-hover:scale-[1.03]`}
    />
  );
}

export function GameSelector({ selectedGameId, onSelectGame }: GameSelectorProps) {
  return (
    <section id="jogos" aria-labelledby="titulo-jogos" className="scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
        <div>
          <h1
            id="titulo-jogos"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 headline-balance"
          >
            Escolha a loteria para apostar
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Selecione uma das 8 modalidades oficiais e use uma frase pessoal para gerar seus números.
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
          8 modalidades oficiais · Regras vigentes
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Modalidades de loteria disponíveis"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        {LOTTERY_GAMES.map((game) => {
          const isSelected = game.id === selectedGameId;
          return (
            <button
              key={game.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectGame(game.id)}
              className={`group text-left bg-white rounded-xl overflow-hidden transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer flex flex-col ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-[#F7F8FA] shadow-sm'
                  : 'border border-slate-200 hover:border-slate-300'
              }`}
              style={
                isSelected
                  ? {
                      borderColor: game.officialColor,
                      boxShadow: `0 0 0 2px ${game.officialColor}`,
                    }
                  : undefined
              }
            >
              <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                <GameCardImage game={game} />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1"
                  style={{ backgroundColor: game.officialColor }}
                />
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: game.officialColor }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm sm:text-base font-bold text-slate-950 truncate">
                    {game.name}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 tabular-nums leading-snug">
                  {game.shortRule}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
