import {
  getLotteryGameById,
  LotteryGameId,
  MONTHS_PT_BR,
  TIMEMANIA_CLUBS,
} from '../data/lotteryGames';

export type LotecaColumn = '1' | 'X' | '2';

export interface LotecaMatchPrediction {
  matchNumber: number; // 1..14
  columns: LotecaColumn[]; // length 1 (seco), 2 (duplo), or 3 (triplo)
}

export interface BetGenerationOptions {
  pickCount?: number;
  cloversCount?: number;
  lotecaDuplos?: number;
  lotecaTriplos?: number;
  variationIndex?: number;
}

export interface GeneratedBet {
  id: string;
  gameId: LotteryGameId;
  phrase: string;
  normalizedPhrase: string;
  variationIndex: number;
  seedFingerprint: string;
  createdAt: string;
  numbers: number[];
  clovers?: number[];
  luckyMonthIndex?: number; // 0..11
  luckyMonthName?: string;
  heartTeamIndex?: number; // 0..79 (displayed as 01..80)
  heartTeamName?: string;
  lotecaMatches?: LotecaMatchPrediction[];
  lotecaDuplos?: number;
  lotecaTriplos?: number;
  favorite?: boolean;
}

export interface PhraseValidationResult {
  valid: boolean;
  error?: string;
  normalized: string;
}

export function normalizePhrase(phrase: string): string {
  return phrase
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function validatePhrase(phrase: string): PhraseValidationResult {
  const trimmed = phrase.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Digite uma frase da sorte para gerar a aleatoriedade dos números.',
      normalized: '',
    };
  }
  if (trimmed.length < 3) {
    return {
      valid: false,
      error: 'A frase precisa ter pelo menos 3 caracteres para criar uma semente única.',
      normalized: normalizePhrase(trimmed),
    };
  }
  return {
    valid: true,
    normalized: normalizePhrase(trimmed),
  };
}

/**
 * 128-bit mixing hash (cyrb128) producing four 32-bit state words from arbitrary text.
 * Ensures even a 1-character difference produces a completely distinct PRNG trajectory.
 */
export function hashSeed128(input: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let i = 0; i < input.length; i++) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

/**
 * xoshiro128** deterministic PRNG with full 32-bit uniform output.
 */
export function createSeededRng(seedString: string): () => number {
  let [a, b, c, d] = hashSeed128(seedString);
  if ((a | b | c | d) === 0) {
    a = 0x9e3779b9;
  }

  const nextUint32 = (): number => {
    const t = b << 9;
    const result = Math.imul(b, 5);
    const rotResult = ((result << 7) | (result >>> 25)) * 9;
    c ^= a;
    d ^= b;
    b ^= c;
    a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);
    return rotResult >>> 0;
  };

  // Warm up 12 rounds to eliminate any initial state correlation
  for (let i = 0; i < 12; i++) {
    nextUint32();
  }

  return () => nextUint32() / 4294967296;
}

export function computeSeedFingerprint(seedString: string): string {
  const [h1, h2] = hashSeed128(seedString);
  const combined = ((h1 ^ (h2 << 1)) >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return combined;
}

/**
 * Fisher-Yates unbiased partial shuffle picking `count` unique items from `pool`.
 */
function pickUniqueFromPool<T>(pool: readonly T[], count: number, rng: () => number): T[] {
  const copy = [...pool];
  if (count > copy.length) {
    throw new Error(`Solicitados ${count} itens de um conjunto de ${copy.length}`);
  }
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy.slice(0, count);
}

export function clampPickCount(gameId: LotteryGameId, requested?: number): number {
  const game = getLotteryGameById(gameId);
  if (game.fixedPick) return game.defaultPick;
  const val = requested ?? game.defaultPick;
  return Math.max(game.minPick, Math.min(game.maxPick, Math.round(val)));
}

export function clampCloversCount(gameId: LotteryGameId, requested?: number): number {
  const game = getLotteryGameById(gameId);
  if (!game.hasClovers) return 0;
  const min = game.cloversMin ?? 2;
  const max = game.cloversMax ?? 6;
  const val = requested ?? game.cloversDefault ?? 2;
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function clampLotecaStructure(
  requestedDuplos?: number,
  requestedTriplos?: number
): { duplos: number; triplos: number } {
  let triplos = Math.max(0, Math.min(5, Math.round(requestedTriplos ?? 0)));
  let duplos = Math.max(0, Math.min(9, Math.round(requestedDuplos ?? 1)));

  // Regra oficial Loteca: aposta mínima exige pelo menos 1 duplo (ou 1 triplo se o apostador preferir)
  if (duplos === 0 && triplos === 0) {
    duplos = 1;
  }
  // Total de duplos + triplos não pode exceder os 14 jogos
  if (duplos + triplos > 14) {
    duplos = Math.max(0, 14 - triplos);
  }
  return { duplos, triplos };
}

export const MAX_DRAW_COUNT = 50;

export function clampDrawCount(requested?: number, max = MAX_DRAW_COUNT): number {
  const val = Number.isFinite(requested) ? Math.round(requested as number) : 1;
  return Math.max(1, Math.min(max, val));
}

export function formatLotteryNumber(num: number, digits = 2): string {
  return String(num).padStart(digits, '0');
}

export function generateOfficialBet(
  gameId: LotteryGameId,
  phrase: string,
  options: BetGenerationOptions = {}
): GeneratedBet {
  const validation = validatePhrase(phrase);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const game = getLotteryGameById(gameId);
  const variationIndex = Math.max(1, Math.round(options.variationIndex ?? 1));
  const pickCount = clampPickCount(gameId, options.pickCount);
  const cloversCount = clampCloversCount(gameId, options.cloversCount);
  const lotecaStruct =
    gameId === 'loteca'
      ? clampLotecaStructure(options.lotecaDuplos, options.lotecaTriplos)
      : undefined;

  const seedDescriptor = [
    'LOTERIA-BR-V1',
    gameId,
    validation.normalized,
    `pick:${pickCount}`,
    `clovers:${cloversCount}`,
    lotecaStruct ? `d:${lotecaStruct.duplos}:t:${lotecaStruct.triplos}` : '',
    `v:${variationIndex}`,
  ]
    .filter(Boolean)
    .join('|');

  const rng = createSeededRng(seedDescriptor);
  const seedFingerprint = computeSeedFingerprint(seedDescriptor);
  const createdAt = new Date().toISOString();
  const id = `${gameId}-${seedFingerprint}-${Date.now()}`;

  if (game.kind === 'loteca') {
    const matchCount = game.matchCount ?? 14;
    const { duplos, triplos } = lotecaStruct!;
    const matchIndices = Array.from({ length: matchCount }, (_, idx) => idx);
    const specialIndices = pickUniqueFromPool(matchIndices, duplos + triplos, rng);
    const triploSet = new Set(specialIndices.slice(0, triplos));
    const duploSet = new Set(specialIndices.slice(triplos, triplos + duplos));

    const allCols: readonly LotecaColumn[] = ['1', 'X', '2'];
    const orderMap: Record<LotecaColumn, number> = { '1': 0, X: 1, '2': 2 };

    const lotecaMatches: LotecaMatchPrediction[] = matchIndices.map((idx) => {
      let cols: LotecaColumn[];
      if (triploSet.has(idx)) {
        cols = ['1', 'X', '2'];
      } else if (duploSet.has(idx)) {
        cols = pickUniqueFromPool(allCols, 2, rng).sort(
          (a, b) => orderMap[a] - orderMap[b]
        );
      } else {
        cols = pickUniqueFromPool(allCols, 1, rng);
      }
      return {
        matchNumber: idx + 1,
        columns: cols,
      };
    });

    return {
      id,
      gameId,
      phrase: phrase.trim(),
      normalizedPhrase: validation.normalized,
      variationIndex,
      seedFingerprint,
      createdAt,
      numbers: [],
      lotecaMatches,
      lotecaDuplos: duplos,
      lotecaTriplos: triplos,
      favorite: false,
    };
  }

  // Standard numerical pool games
  const pool: number[] = [];
  for (let n = game.minNumber; n <= game.maxNumber; n++) {
    pool.push(n);
  }

  const pickedNumbers = pickUniqueFromPool(pool, pickCount, rng).sort((a, b) => a - b);

  const bet: GeneratedBet = {
    id,
    gameId,
    phrase: phrase.trim(),
    normalizedPhrase: validation.normalized,
    variationIndex,
    seedFingerprint,
    createdAt,
    numbers: pickedNumbers,
    favorite: false,
  };

  if (game.hasClovers) {
    const cloverPool = Array.from(
      { length: game.cloversPoolMax ?? 6 },
      (_, idx) => idx + 1
    );
    bet.clovers = pickUniqueFromPool(cloverPool, cloversCount, rng).sort((a, b) => a - b);
  }

  if (game.hasLuckyMonth) {
    const monthIndex = Math.floor(rng() * MONTHS_PT_BR.length);
    bet.luckyMonthIndex = monthIndex;
    bet.luckyMonthName = MONTHS_PT_BR[monthIndex];
  }

  if (game.hasHeartTeam) {
    const teamIndex = Math.floor(rng() * TIMEMANIA_CLUBS.length);
    bet.heartTeamIndex = teamIndex;
    bet.heartTeamName = TIMEMANIA_CLUBS[teamIndex];
  }

  return bet;
}

/**
 * Returns the numbers ordered exactly as they appear on the official Caixa slip grid.
 * (Lotomania displays 01..99 followed by 00 at the bottom-right cell.)
 */
export function getSlipGridNumbers(gameId: LotteryGameId): number[] {
  const game = getLotteryGameById(gameId);
  if (game.kind === 'loteca') return [];
  if (game.zeroAtEnd) {
    const arr: number[] = [];
    for (let n = 1; n <= 99; n++) arr.push(n);
    arr.push(0);
    return arr;
  }
  const arr: number[] = [];
  for (let n = game.minNumber; n <= game.maxNumber; n++) {
    arr.push(n);
  }
  return arr;
}

export function formatBetPlainText(bet: GeneratedBet): string {
  const game = getLotteryGameById(bet.gameId);
  if (game.kind === 'loteca' && bet.lotecaMatches) {
    const lines = bet.lotecaMatches.map(
      (m) => `Jogo ${formatLotteryNumber(m.matchNumber)}: [${m.columns.join(' / ')}]`
    );
    return `${game.name} — Frase: "${bet.phrase}"\n${lines.join('\n')}`;
  }

  const nums = bet.numbers.map((n) => formatLotteryNumber(n, game.zeroPaddedDigits)).join(' - ');
  const extras: string[] = [];
  if (bet.clovers && bet.clovers.length > 0) {
    extras.push(`Trevos da Sorte: ${bet.clovers.join(', ')}`);
  }
  if (bet.luckyMonthName) {
    extras.push(`Mês de Sorte: ${bet.luckyMonthName}`);
  }
  if (bet.heartTeamName) {
    extras.push(
      `Time do Coração: ${formatLotteryNumber((bet.heartTeamIndex ?? 0) + 1)} - ${bet.heartTeamName}`
    );
  }
  return [
    `${game.name} (${bet.numbers.length} dezenas) — Frase: "${bet.phrase}"`,
    `Números: ${nums}`,
    ...extras,
  ].join('\n');
}

export function generateMultipleOfficialBets(
  gameId: LotteryGameId,
  phrase: string,
  drawCount: number,
  options: BetGenerationOptions = {}
): GeneratedBet[] {
  const count = clampDrawCount(drawCount);
  const startVariation = Math.max(1, Math.round(options.variationIndex ?? 1));
  const nowBase = Date.now();

  const batch: GeneratedBet[] = [];
  for (let i = 0; i < count; i++) {
    const bet = generateOfficialBet(gameId, phrase, {
      ...options,
      variationIndex: startVariation + i,
    });
    // Ensure strictly unique IDs even when generated within the same millisecond
    bet.id = `${gameId}-${bet.seedFingerprint}-${nowBase + i}`;
    batch.push(bet);
  }
  return batch;
}

export function formatBatchPlainText(bets: GeneratedBet[]): string {
  if (bets.length <= 1) {
    return bets[0] ? formatBetPlainText(bets[0]) : '';
  }
  return bets
    .map((bet, idx) => `--- Sorteio ${idx + 1} ---\n${formatBetPlainText(bet)}`)
    .join('\n\n');
}
