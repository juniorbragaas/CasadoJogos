export const MEMORY_MAX_PAIRS = 16;
export const MEMORY_PREVIEW_DURATION_MS = 4000;
export const MEMORY_MISMATCH_DELAY_MS = 850;

export interface MemoryParticipant {
  id: string;
  name: string;
  score: number;
}

export interface MemoryFigure {
  id: string;
  name: string;
  kind: 'builtin' | 'custom';
  imageUrl?: string;
  accentColor?: string;
  bgTint?: string;
  iconKey?: BuiltinMemoryIconKey;
}

export type BuiltinMemoryIconKey =
  | 'sun'
  | 'star'
  | 'heart'
  | 'rocket'
  | 'crown'
  | 'diamond'
  | 'moon'
  | 'bolt'
  | 'clover'
  | 'trophy'
  | 'music'
  | 'anchor'
  | 'flame'
  | 'flower'
  | 'compass'
  | 'butterfly';

export interface MemoryCard {
  instanceId: string;
  figureId: string;
  figure: MemoryFigure;
  isMatched: boolean;
  matchedByParticipantId: string | null;
}

export type MemoryGamePhase = 'idle' | 'preview' | 'playing' | 'finished';

export interface MemoryChampionSummary {
  champions: MemoryParticipant[];
  topScore: number;
  isTie: boolean;
  ranking: MemoryParticipant[];
  totalPairs: number;
}

export interface MemoryBoardLayoutMetrics {
  columns: number;
  rows: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  totalWidth: number;
  totalHeight: number;
}

export const DEFAULT_MEMORY_FIGURES: readonly MemoryFigure[] = [
  { id: 'builtin-sun', name: 'Sol', kind: 'builtin', iconKey: 'sun', accentColor: '#D97706', bgTint: '#FEF3C7' },
  { id: 'builtin-star', name: 'Estrela', kind: 'builtin', iconKey: 'star', accentColor: '#CA8A04', bgTint: '#FEF9C3' },
  { id: 'builtin-heart', name: 'Coração', kind: 'builtin', iconKey: 'heart', accentColor: '#DC2626', bgTint: '#FEE2E2' },
  { id: 'builtin-rocket', name: 'Foguete', kind: 'builtin', iconKey: 'rocket', accentColor: '#2563EB', bgTint: '#DBEAFE' },
  { id: 'builtin-crown', name: 'Coroa', kind: 'builtin', iconKey: 'crown', accentColor: '#B45309', bgTint: '#FFEDD5' },
  { id: 'builtin-diamond', name: 'Diamante', kind: 'builtin', iconKey: 'diamond', accentColor: '#0284C7', bgTint: '#E0F2FE' },
  { id: 'builtin-moon', name: 'Lua', kind: 'builtin', iconKey: 'moon', accentColor: '#4F46E5', bgTint: '#E0E7FF' },
  { id: 'builtin-bolt', name: 'Raio', kind: 'builtin', iconKey: 'bolt', accentColor: '#EA580C', bgTint: '#FFEDD5' },
  { id: 'builtin-clover', name: 'Trevo', kind: 'builtin', iconKey: 'clover', accentColor: '#15803D', bgTint: '#DCFCE7' },
  { id: 'builtin-trophy', name: 'Troféu', kind: 'builtin', iconKey: 'trophy', accentColor: '#A16207', bgTint: '#FEF9C3' },
  { id: 'builtin-music', name: 'Música', kind: 'builtin', iconKey: 'music', accentColor: '#9333EA', bgTint: '#F3E8FF' },
  { id: 'builtin-anchor', name: 'Âncora', kind: 'builtin', iconKey: 'anchor', accentColor: '#0F766E', bgTint: '#CCFBF1' },
  { id: 'builtin-flame', name: 'Chama', kind: 'builtin', iconKey: 'flame', accentColor: '#E11D48', bgTint: '#FFE4E6' },
  { id: 'builtin-flower', name: 'Flor', kind: 'builtin', iconKey: 'flower', accentColor: '#DB2777', bgTint: '#FCE7F3' },
  { id: 'builtin-compass', name: 'Bússola', kind: 'builtin', iconKey: 'compass', accentColor: '#0369A1', bgTint: '#E0F2FE' },
  { id: 'builtin-butterfly', name: 'Borboleta', kind: 'builtin', iconKey: 'butterfly', accentColor: '#7C3AED', bgTint: '#EDE9FE' },
];

export function createDefaultParticipants(): MemoryParticipant[] {
  return [
    { id: 'p-1', name: 'Jogador 1', score: 0 },
    { id: 'p-2', name: 'Jogador 2', score: 0 },
  ];
}

export function sanitizeParticipantName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 32);
}

export function addMemoryParticipant(
  participants: readonly MemoryParticipant[],
  rawName: string,
  idFactory: () => string = () => `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
): MemoryParticipant[] {
  const name = sanitizeParticipantName(rawName);
  if (!name) return [...participants];
  return [...participants, { id: idFactory(), name, score: 0 }];
}

export function removeMemoryParticipant(
  participants: readonly MemoryParticipant[],
  participantId: string
): MemoryParticipant[] {
  if (participants.length <= 1) return [...participants];
  return participants.filter((p) => p.id !== participantId);
}

export function renameMemoryParticipant(
  participants: readonly MemoryParticipant[],
  participantId: string,
  rawName: string
): MemoryParticipant[] {
  const name = sanitizeParticipantName(rawName);
  if (!name) return [...participants];
  return participants.map((p) => (p.id === participantId ? { ...p, name } : p));
}

export function resetParticipantScores(
  participants: readonly MemoryParticipant[]
): MemoryParticipant[] {
  return participants.map((p) => ({ ...p, score: 0 }));
}

export function shuffleArray<T>(
  items: readonly T[],
  randomFn: () => number = Math.random
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selects up to `maxPairs` (default 16) figures for a round.
 * Users may upload unlimited custom figures; every round shuffles the pool
 * and picks at most 16 pairs (32 cards). Custom figures are prioritized so
 * newly added figures appear right away; if more than 16 custom figures exist,
 * a random shuffled subset of 16 is drawn each round.
 */
export function selectFiguresForRound(
  customFigures: readonly MemoryFigure[],
  builtinFigures: readonly MemoryFigure[] = DEFAULT_MEMORY_FIGURES,
  options: { maxPairs?: number; includeBuiltins?: boolean } = {},
  randomFn: () => number = Math.random
): MemoryFigure[] {
  const maxPairs = Math.max(1, Math.min(MEMORY_MAX_PAIRS, options.maxPairs ?? MEMORY_MAX_PAIRS));
  const includeBuiltins = options.includeBuiltins ?? true;

  const shuffledCustom = shuffleArray(customFigures, randomFn);
  if (shuffledCustom.length >= maxPairs) {
    return shuffledCustom.slice(0, maxPairs);
  }

  if (!includeBuiltins && shuffledCustom.length > 0) {
    return shuffledCustom;
  }

  const remainingSlots = maxPairs - shuffledCustom.length;
  const shuffledBuiltin = shuffleArray(builtinFigures, randomFn);
  return shuffleArray(
    [...shuffledCustom, ...shuffledBuiltin.slice(0, remainingSlots)],
    randomFn
  );
}

export function createShuffledMemoryDeck(
  customFigures: readonly MemoryFigure[],
  builtinFigures: readonly MemoryFigure[] = DEFAULT_MEMORY_FIGURES,
  options: { maxPairs?: number; includeBuiltins?: boolean; roundSeed?: number } = {},
  randomFn: () => number = Math.random
): MemoryCard[] {
  const chosenFigures = selectFiguresForRound(
    customFigures,
    builtinFigures,
    options,
    randomFn
  );
  const seed = options.roundSeed ?? Date.now();

  const pairs: MemoryCard[] = [];
  chosenFigures.forEach((figure, idx) => {
    pairs.push({
      instanceId: `${seed}-${idx}-a-${figure.id}`,
      figureId: figure.id,
      figure,
      isMatched: false,
      matchedByParticipantId: null,
    });
    pairs.push({
      instanceId: `${seed}-${idx}-b-${figure.id}`,
      figureId: figure.id,
      figure,
      isMatched: false,
      matchedByParticipantId: null,
    });
  });

  const shuffled = shuffleArray(pairs, randomFn);
  // Prevent trivial adjacent-only order if PRNG is degenerate
  if (
    shuffled.length >= 4 &&
    shuffled.every((card, i) => card.instanceId === pairs[i].instanceId)
  ) {
    [shuffled[0], shuffled[shuffled.length - 1]] = [
      shuffled[shuffled.length - 1],
      shuffled[0],
    ];
  }

  return shuffled;
}

export interface MemoryTurnResolution {
  isMatch: boolean;
  updatedCards: MemoryCard[];
  updatedParticipants: MemoryParticipant[];
  nextPlayerIndex: number;
  isGameComplete: boolean;
}

/**
 * Evaluates a two-card reveal:
 * - Match: marks both cards matched, awards +1 point to active participant, keeps same player's turn.
 * - Mismatch: leaves cards unmatched and passes the turn to the next participant.
 */
export function evaluateMemoryTurn(
  cards: readonly MemoryCard[],
  participants: readonly MemoryParticipant[],
  currentPlayerIndex: number,
  firstInstanceId: string,
  secondInstanceId: string
): MemoryTurnResolution {
  const first = cards.find((c) => c.instanceId === firstInstanceId);
  const second = cards.find((c) => c.instanceId === secondInstanceId);

  const safePlayerIndex =
    participants.length > 0 ? currentPlayerIndex % participants.length : 0;
  const activePlayer = participants[safePlayerIndex];

  if (!first || !second || first.instanceId === second.instanceId || !activePlayer) {
    return {
      isMatch: false,
      updatedCards: [...cards],
      updatedParticipants: [...participants],
      nextPlayerIndex: safePlayerIndex,
      isGameComplete: cards.length > 0 && cards.every((c) => c.isMatched),
    };
  }

  const isMatch = first.figureId === second.figureId;

  if (isMatch) {
    const updatedCards = cards.map((card) =>
      card.instanceId === first.instanceId || card.instanceId === second.instanceId
        ? {
            ...card,
            isMatched: true,
            matchedByParticipantId: activePlayer.id,
          }
        : card
    );

    const updatedParticipants = participants.map((participant, idx) =>
      idx === safePlayerIndex
        ? { ...participant, score: participant.score + 1 }
        : participant
    );

    const isGameComplete =
      updatedCards.length > 0 && updatedCards.every((c) => c.isMatched);

    return {
      isMatch: true,
      updatedCards,
      updatedParticipants,
      nextPlayerIndex: safePlayerIndex,
      isGameComplete,
    };
  }

  const nextPlayerIndex =
    participants.length > 0 ? (safePlayerIndex + 1) % participants.length : 0;

  return {
    isMatch: false,
    updatedCards: [...cards],
    updatedParticipants: [...participants],
    nextPlayerIndex,
    isGameComplete: false,
  };
}

export function getMemoryChampionSummary(
  participants: readonly MemoryParticipant[],
  totalPairs: number
): MemoryChampionSummary {
  const ranking = [...participants].sort((a, b) => b.score - a.score);
  const topScore = ranking.length > 0 ? ranking[0].score : 0;
  const champions = ranking.filter((p) => p.score === topScore);

  return {
    champions,
    topScore,
    isTie: champions.length > 1,
    ranking,
    totalPairs,
  };
}

/**
 * Automatically finds the grid dimensions (cols x rows) and maximized card
 * pixel dimensions so ALL cards (up to 32) fit inside the container without
 * horizontal or vertical scrollbars on any screen size.
 */
export function computeMemoryBoardMetrics(
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  aspectRatio = 3 / 4
): MemoryBoardLayoutMetrics {
  const safeW = Math.max(0, Math.floor(containerWidth));
  const safeH = Math.max(0, Math.floor(containerHeight));

  if (safeW === 0 || safeH === 0 || cardCount <= 0) {
    return {
      columns: 8,
      rows: 4,
      cardWidth: 0,
      cardHeight: 0,
      gap: 0,
      totalWidth: 0,
      totalHeight: 0,
    };
  }

  // Prefer exact symmetric factorizations (e.g., 8x4 or 4x8 for 32 cards) so there are zero orphan slots
  const exactCandidates: Array<{ cols: number; rows: number }> = [];
  for (let cols = 2; cols <= cardCount; cols++) {
    if (cardCount % cols === 0) {
      const rows = cardCount / cols;
      if (rows >= 2 && cols <= 8 && rows <= 8) {
        exactCandidates.push({ cols, rows });
      }
    }
  }

  const candidates: Array<{ cols: number; rows: number }> =
    exactCandidates.length > 0 ? exactCandidates : [];

  if (candidates.length === 0) {
    for (let cols = 1; cols <= Math.min(8, cardCount); cols++) {
      const rows = Math.ceil(cardCount / cols);
      if (rows <= 8) {
        candidates.push({ cols, rows });
      }
    }
  }

  if (candidates.length === 0) {
    candidates.push({ cols: Math.min(8, cardCount), rows: Math.ceil(cardCount / 8) });
  }

  let best: MemoryBoardLayoutMetrics | null = null;
  let bestScore = -1;

  for (const { cols, rows } of candidates) {
    let gap = Math.max(4, Math.min(12, Math.floor(Math.min(safeW, safeH) * 0.015)));
    if (gap * (cols - 1) >= safeW * 0.25) {
      gap = Math.max(2, Math.floor((safeW * 0.14) / Math.max(1, cols - 1)));
    }
    if (gap * (rows - 1) >= safeH * 0.25) {
      gap = Math.max(2, Math.floor((safeH * 0.14) / Math.max(1, rows - 1)));
    }

    const availW = Math.max(cols, safeW - gap * (cols - 1));
    const availH = Math.max(rows, safeH - gap * (rows - 1));

    const maxCardWByWidth = availW / cols;
    const maxCardHByHeight = availH / rows;
    const maxCardWByHeight = maxCardHByHeight * aspectRatio;

    let cardWidth = Math.max(1, Math.floor(Math.min(maxCardWByWidth, maxCardWByHeight)));
    let cardHeight = Math.max(1, Math.floor(cardWidth / aspectRatio));

    if (cardHeight * rows + gap * (rows - 1) > safeH) {
      cardHeight = Math.max(1, Math.floor(availH / rows));
      cardWidth = Math.max(1, Math.floor(cardHeight * aspectRatio));
    }
    if (cardWidth * cols + gap * (cols - 1) > safeW) {
      cardWidth = Math.max(1, Math.floor(availW / cols));
      cardHeight = Math.max(1, Math.floor(cardWidth / aspectRatio));
    }

    const area = cardWidth * cardHeight;
    // Slight preference for exact-fill grids (zero empty slots, e.g., 8x4 or 4x8 for 32 cards)
    const exactFillBonus = cols * rows === cardCount ? 1.04 : 1;
    const score = area * exactFillBonus;

    if (score > bestScore) {
      bestScore = score;
      best = {
        columns: cols,
        rows,
        cardWidth,
        cardHeight,
        gap,
        totalWidth: cardWidth * cols + gap * (cols - 1),
        totalHeight: cardHeight * rows + gap * (rows - 1),
      };
    }
  }

  return (
    best ?? {
      columns: 8,
      rows: 4,
      cardWidth: 0,
      cardHeight: 0,
      gap: 0,
      totalWidth: 0,
      totalHeight: 0,
    }
  );
}
