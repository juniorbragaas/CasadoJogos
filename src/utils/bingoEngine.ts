export const BINGO_MIN = 1;
export const BINGO_MAX = 99;
export const BINGO_TOTAL = 99;

export interface BingoDecadeColumn {
  decadeIndex: number; // 0..9
  label: string; // '01–09', '10–19', ..., '90–99'
  min: number;
  max: number;
  numbers: number[];
}

export interface BingoBallTheme {
  bg: string;
  ring: string;
  text: string;
  labelBg: string;
}

const DECADE_THEMES: readonly BingoBallTheme[] = [
  { bg: '#0F5132', ring: '#A7F3D0', text: '#FFFFFF', labelBg: '#ECFDF5' }, // 01-09 Emerald
  { bg: '#1D4ED8', ring: '#BFDBFE', text: '#FFFFFF', labelBg: '#EFF6FF' }, // 10-19 Royal Blue
  { bg: '#B91C1C', ring: '#FECACA', text: '#FFFFFF', labelBg: '#FEF2F2' }, // 20-29 Crimson
  { bg: '#B45309', ring: '#FDE68A', text: '#FFFFFF', labelBg: '#FFFBEB' }, // 30-39 Amber
  { bg: '#6D28D9', ring: '#DDD6FE', text: '#FFFFFF', labelBg: '#F5F3FF' }, // 40-49 Violet
  { bg: '#0F766E', ring: '#99F6E4', text: '#FFFFFF', labelBg: '#F0FDFA' }, // 50-59 Teal
  { bg: '#BE123C', ring: '#FECDD3', text: '#FFFFFF', labelBg: '#FFF1F2' }, // 60-69 Rose
  { bg: '#3730A3', ring: '#C7D2FE', text: '#FFFFFF', labelBg: '#EEF2FF' }, // 70-79 Indigo
  { bg: '#C2410C', ring: '#FED7AA', text: '#FFFFFF', labelBg: '#FFF7ED' }, // 80-89 Burnt Orange
  { bg: '#1E293B', ring: '#CBD5E1', text: '#FFFFFF', labelBg: '#F1F5F9' }, // 90-99 Slate
] as const;

export function formatBingoNumber(num: number): string {
  return String(num).padStart(2, '0');
}

/**
 * Builds the 10 decade columns for a 1–99 Bingo board:
 * Col 0: 01–09 (9 numbers)
 * Col 1: 10–19 (10 numbers)
 * ...
 * Col 9: 90–99 (10 numbers)
 */
export function getBingoDecadeColumns(): BingoDecadeColumn[] {
  const columns: BingoDecadeColumn[] = [];
  for (let decade = 0; decade <= 9; decade++) {
    const min = decade === 0 ? 1 : decade * 10;
    const max = decade * 10 + 9;
    const numbers: number[] = [];
    for (let n = min; n <= max; n++) {
      numbers.push(n);
    }
    columns.push({
      decadeIndex: decade,
      label: `${formatBingoNumber(min)}–${formatBingoNumber(max)}`,
      min,
      max,
      numbers,
    });
  }
  return columns;
}

export function getDecadeIndexForNumber(num: number): number {
  const clamped = Math.max(BINGO_MIN, Math.min(BINGO_MAX, Math.floor(num)));
  return Math.floor(clamped / 10);
}

export function getDecadeLabelForNumber(num: number): string {
  const decade = getDecadeIndexForNumber(num);
  const min = decade === 0 ? 1 : decade * 10;
  const max = decade * 10 + 9;
  return `${formatBingoNumber(min)}–${formatBingoNumber(max)}`;
}

export function getBingoBallTheme(num: number): BingoBallTheme {
  return DECADE_THEMES[getDecadeIndexForNumber(num)];
}

export function getRemainingBingoNumbers(
  drawnNumbers: readonly number[]
): number[] {
  const drawnSet = new Set(drawnNumbers);
  const remaining: number[] = [];
  for (let n = BINGO_MIN; n <= BINGO_MAX; n++) {
    if (!drawnSet.has(n)) {
      remaining.push(n);
    }
  }
  return remaining;
}

function defaultCryptoRandom(): number {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}

export const BINGO_SPIN_DURATION_MS = 1800;

export interface BingoRouletteTick {
  timeMs: number;
  progress: number; // 0 (fast start) -> 1 (slow finish right before ball drop)
}

/**
 * Computes decelerating timestamps (in ms) for a realistic physical roulette spin
 * from rapid initial clicks (~38ms apart) down to suspenseful final clicks (~190ms apart)
 * right before the chosen ball is revealed.
 */
export function computeBingoRouletteTickSchedule(
  durationMs: number = BINGO_SPIN_DURATION_MS
): BingoRouletteTick[] {
  if (durationMs <= 120) {
    return [{ timeMs: 0, progress: 1 }];
  }

  const ticks: BingoRouletteTick[] = [];
  const cutoffMs = Math.max(80, durationMs - 85);
  let t = 0;

  while (t <= cutoffMs) {
    const progress = Math.min(1, t / cutoffMs);
    ticks.push({ timeMs: Math.round(t), progress });
    // Cubic ease-in interval growth mirrors a decelerating roulette wheel (ease-out speed)
    const intervalMs = 38 + Math.pow(progress, 2.35) * 165;
    t += intervalMs;
  }

  return ticks;
}

/**
 * Draws one unique random number from the remaining 1..99 pool.
 * Returns null if all 99 numbers have already been drawn.
 */
export function drawNextBingoNumber(
  drawnNumbers: readonly number[],
  randomFn: () => number = defaultCryptoRandom
): number | null {
  const remaining = getRemainingBingoNumbers(drawnNumbers);
  if (remaining.length === 0) return null;
  const raw = randomFn();
  const normalized = Number.isFinite(raw)
    ? Math.max(0, Math.min(0.999999999, raw))
    : 0;
  const index = Math.floor(normalized * remaining.length);
  return remaining[index];
}

export const BINGO_CARD_COLUMNS_COUNT = 10;
export const BINGO_CARD_PER_COLUMN = 5;
export const BINGO_CARD_TOTAL_NUMBERS =
  BINGO_CARD_COLUMNS_COUNT * BINGO_CARD_PER_COLUMN;

export interface BingoCardColumnSelection {
  decadeIndex: number;
  label: string;
  numbers: number[];
}

/**
 * Counts how many valid selected numbers belong to each of the 10 decade columns (0..9).
 */
export function getBingoCardColumnCounts(
  selectedNumbers: readonly number[]
): number[] {
  const counts = Array.from({ length: BINGO_CARD_COLUMNS_COUNT }, () => 0);
  const seen = new Set<number>();
  for (const num of selectedNumbers) {
    if (
      !Number.isInteger(num) ||
      num < BINGO_MIN ||
      num > BINGO_MAX ||
      seen.has(num)
    ) {
      continue;
    }
    seen.add(num);
    counts[getDecadeIndexForNumber(num)] += 1;
  }
  return counts;
}

/**
 * Toggles a number (1..99) in the custom Bingo card selection while strictly enforcing
 * at most 5 numbers per decade column. Returns a new sorted array.
 */
export function toggleBingoCardNumber(
  selectedNumbers: readonly number[],
  num: number
): number[] {
  if (!Number.isInteger(num) || num < BINGO_MIN || num > BINGO_MAX) {
    return [...selectedNumbers];
  }

  const uniqueValid = Array.from(
    new Set(
      selectedNumbers.filter(
        (n) => Number.isInteger(n) && n >= BINGO_MIN && n <= BINGO_MAX
      )
    )
  ).sort((a, b) => a - b);

  if (uniqueValid.includes(num)) {
    return uniqueValid.filter((n) => n !== num);
  }

  const decadeIndex = getDecadeIndexForNumber(num);
  const currentInColumn = uniqueValid.filter(
    (n) => getDecadeIndexForNumber(n) === decadeIndex
  ).length;

  if (currentInColumn >= BINGO_CARD_PER_COLUMN) {
    return uniqueValid;
  }

  return [...uniqueValid, num].sort((a, b) => a - b);
}

/**
 * Returns true if and only if all 10 decade columns have exactly 5 unique numbers selected (50 total).
 */
export function isBingoCardComplete(selectedNumbers: readonly number[]): boolean {
  const counts = getBingoCardColumnCounts(selectedNumbers);
  return counts.every((count) => count === BINGO_CARD_PER_COLUMN);
}

/**
 * Groups selected numbers into the 10 decade columns, sorted ascending within each column.
 */
export function buildBingoCardColumns(
  selectedNumbers: readonly number[]
): BingoCardColumnSelection[] {
  const baseColumns = getBingoDecadeColumns();
  const uniqueSet = new Set(
    selectedNumbers.filter(
      (n) => Number.isInteger(n) && n >= BINGO_MIN && n <= BINGO_MAX
    )
  );

  return baseColumns.map((col) => ({
    decadeIndex: col.decadeIndex,
    label: col.label,
    numbers: col.numbers.filter((n) => uniqueSet.has(n)).sort((a, b) => a - b),
  }));
}

export const INITIAL_BINGO_GAME_NUMBER = 1;

export function normalizeBingoGameNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
    return value;
  }
  return INITIAL_BINGO_GAME_NUMBER;
}

export function getNextBingoGameNumber(currentGameNumber: number): number {
  return normalizeBingoGameNumber(currentGameNumber) + 1;
}

/**
 * Cards may ONLY be generated before the upcoming game starts drawing (0 drawn balls
 * and roulette idle). Once the first ball starts spinning or is drawn, card generation
 * remains locked until the game ends and a new game begins.
 */
export function canGenerateBingoCard(
  drawnCount: number,
  isSpinning: boolean
): boolean {
  return drawnCount === 0 && !isSpinning;
}
