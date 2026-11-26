import { LotteryGameId } from '../data/lotteryGames';
import { GeneratedBet } from './lotteryEngine';
import { DEFAULT_SLIP_CALIBRATION, SlipCalibration } from './slipGeometry';
import {
  createDefaultPrizeCards,
  normalizePrizeCards,
  RouletteDrawRecord,
  RussianRoulettePersistedState,
} from './russianRouletteEngine';

const HISTORY_KEY = 'loteria_br_historico_v1';
const CALIBRATION_KEY = 'loteria_br_calibracao_v1';

export function loadSavedBets(): GeneratedBet[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is GeneratedBet =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.gameId === 'string' &&
        typeof item.phrase === 'string' &&
        Array.isArray(item.numbers)
    );
  } catch {
    return [];
  }
}

export function saveBetsList(bets: GeneratedBet[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(bets.slice(0, 120)));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadGameCalibration(gameId: LotteryGameId): SlipCalibration {
  if (typeof window === 'undefined') return { ...DEFAULT_SLIP_CALIBRATION };
  try {
    const raw = window.localStorage.getItem(CALIBRATION_KEY);
    if (!raw) return { ...DEFAULT_SLIP_CALIBRATION };
    const parsed = JSON.parse(raw) as Partial<Record<LotteryGameId, SlipCalibration>>;
    const saved = parsed[gameId];
    if (!saved) return { ...DEFAULT_SLIP_CALIBRATION };
    return {
      trayAlignment:
        saved.trayAlignment === 'left' ||
        saved.trayAlignment === 'center' ||
        saved.trayAlignment === 'right'
          ? saved.trayAlignment
          : 'center',
      offsetXMm: typeof saved.offsetXMm === 'number' ? saved.offsetXMm : 0,
      offsetYMm: typeof saved.offsetYMm === 'number' ? saved.offsetYMm : 0,
    };
  } catch {
    return { ...DEFAULT_SLIP_CALIBRATION };
  }
}

export function saveGameCalibration(
  gameId: LotteryGameId,
  calibration: SlipCalibration
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(CALIBRATION_KEY);
    const parsed: Partial<Record<LotteryGameId, SlipCalibration>> = raw
      ? JSON.parse(raw)
      : {};
    parsed[gameId] = calibration;
    window.localStorage.setItem(CALIBRATION_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

const BINGO_STATE_KEY = 'loteria_br_bingo_v1';

export interface BingoPersistedState {
  gameNumber: number;
  drawnNumbers: number[];
  hasWinner: boolean;
  winnerName: string;
}

export function loadBingoState(): BingoPersistedState {
  if (typeof window === 'undefined') {
    return { gameNumber: 1, drawnNumbers: [], hasWinner: false, winnerName: '' };
  }
  try {
    const raw = window.localStorage.getItem(BINGO_STATE_KEY);
    if (!raw) {
      return { gameNumber: 1, drawnNumbers: [], hasWinner: false, winnerName: '' };
    }
    const parsed = JSON.parse(raw) as Partial<BingoPersistedState>;
    const gameNumber =
      typeof parsed.gameNumber === 'number' &&
      Number.isInteger(parsed.gameNumber) &&
      parsed.gameNumber >= 1
        ? parsed.gameNumber
        : 1;
    const drawnNumbers = Array.isArray(parsed.drawnNumbers)
      ? Array.from(
          new Set(
            parsed.drawnNumbers.filter(
              (n): n is number =>
                typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 99
            )
          )
        )
      : [];
    return {
      gameNumber,
      drawnNumbers,
      hasWinner: Boolean(parsed.hasWinner),
      winnerName: typeof parsed.winnerName === 'string' ? parsed.winnerName : '',
    };
  } catch {
    return { gameNumber: 1, drawnNumbers: [], hasWinner: false, winnerName: '' };
  }
}

export function saveBingoState(state: BingoPersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BINGO_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

const RUSSIAN_ROULETTE_KEY = 'loteria_br_roleta_russa_v1';

export function loadRussianRouletteState(): RussianRoulettePersistedState {
  if (typeof window === 'undefined') {
    return { prizeCards: createDefaultPrizeCards(), history: [] };
  }
  try {
    const raw = window.localStorage.getItem(RUSSIAN_ROULETTE_KEY);
    if (!raw) {
      return { prizeCards: createDefaultPrizeCards(), history: [] };
    }
    const parsed = JSON.parse(raw) as Partial<RussianRoulettePersistedState>;
    const prizeCards = Array.isArray(parsed.prizeCards)
      ? normalizePrizeCards(parsed.prizeCards)
      : createDefaultPrizeCards();
    const history: RouletteDrawRecord[] = Array.isArray(parsed.history)
      ? parsed.history.filter(
          (item): item is RouletteDrawRecord =>
            Boolean(item) &&
            typeof item.id === 'string' &&
            Array.isArray(item.drawnPair) &&
            item.drawnPair.length === 2 &&
            typeof item.chosenNumber === 'number' &&
            typeof item.prizeDescription === 'string'
        )
      : [];
    return { prizeCards, history };
  } catch {
    return { prizeCards: createDefaultPrizeCards(), history: [] };
  }
}

export function saveRussianRouletteState(
  state: RussianRoulettePersistedState
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      RUSSIAN_ROULETTE_KEY,
      JSON.stringify({
        prizeCards: state.prizeCards,
        history: state.history.slice(0, 60),
      })
    );
  } catch {
    // Ignore storage quota errors gracefully
  }
}
