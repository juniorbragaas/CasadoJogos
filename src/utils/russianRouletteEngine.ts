export interface PrizeCard {
  number: number;
  description: string;
}

export interface RouletteDrawRecord {
  id: string;
  timestamp: string;
  drawnPair: [number, number];
  chosenNumber: number;
  prizeDescription: string;
}

export interface RussianRoulettePersistedState {
  prizeCards: PrizeCard[];
  history: RouletteDrawRecord[];
}

export const TOTAL_ROULETTE_CARDS = 60;
export const OUTER_RING_COUNT = 30; // Cards 1..30
export const INNER_RING_COUNT = 30; // Cards 31..60
export const ROULETTE_STEP_DEG = 360 / OUTER_RING_COUNT; // 12 degrees per slot
export const ROULETTE_SPIN_DURATION_MS = 8000;

export const DEFAULT_PRIZE_DESCRIPTIONS: string[] = [
  'Vale-Presente R$ 100,00',
  'Caixa de Som Bluetooth Portátil',
  'Fone de Ouvido Sem Fio',
  'Cafeteira Elétrica Individual',
  'Kit Churrasco Premium 6 Peças',
  'Mochila Executiva Impermeável',
  'Garrafa Térmica Inox 1 Litro',
  'Vale-Compras R$ 150,00',
  'Liquidificador Turbo 900W',
  'Jogo de Taças de Cristal (6 un.)',
  'Power Bank 20.000 mAh Carga Rápida',
  'Sanduicheira Grill Antiaderente',
  'Relógio Smartwatch Esportivo',
  'Cesta Gourmet de Chocolates Finos',
  'Vale-Presente R$ 250,00',
  'Fritadeira Elétrica Air Fryer 4L',
  'Conjunto de Panelas 5 Peças',
  'Luminária LED de Mesa Recarregável',
  'Kit Vinho Tinto + Abridor Elétrico',
  'Vale-Jantar para 2 Pessoas',
  'Aspirador de Pó Portátil',
  'Batedeira Planetária Compacta',
  'Teclado e Mouse Sem Fio',
  'Edredom Casal Toque Macio',
  'Vale-Compras R$ 200,00',
  'Máquina de Café Expresso Cápsulas',
  'Ventilador Silencioso de Mesa',
  'Kit Ferramentas 40 Peças Maleta',
  'Caixa Térmica 32 Litros',
  'Vale-Presente R$ 300,00',
  'Escova Secadora Modeladora',
  'Jogo de Toalhas Banho Algodão (4 pçs)',
  'Balança Digital Bioimpedância',
  'Chaleira Elétrica Inox 1,8L',
  'Vale-Combustível R$ 150,00',
  'Headset Gamer Surround',
  'Panela de Pressão Elétrica',
  'Kit Spa e Aromaterapia Completo',
  'Mala de Bordo com Rodinhas 360°',
  'Vale-Presente R$ 400,00',
  'Processador de Alimentos Multifuncional',
  'Projetor Portátil Full HD',
  'Cadeira Dobrável de Praia Reforçada',
  'Kit Café Especial + Moedor Manual',
  'Vale-Compras R$ 350,00',
  'Micro-ondas 20 Litros Espelhado',
  'Barbeador e Aparador Multifuncional',
  'Jogo de Cama Queen 400 Fios',
  'Soundbar Bluetooth para TV',
  'Vale-Presente R$ 500,00',
  'Bicicleta Aro 29 Passeio',
  'Tablet 10 Polegadas Wi-Fi',
  'Forno Elétrico de Bancada 44L',
  'Kit Perfumaria Importada',
  'Vale-Viagem R$ 600,00',
  'Smart TV 43 Polegadas 4K',
  'Robô Aspirador Inteligente',
  'Cadeira Gamer Ergonômica',
  'Smartphone 128GB Dual Chip',
  'Super Prêmio · Vale-Compras R$ 1.000,00',
];

export function formatCardNumber(num: number): string {
  return String(num).padStart(2, '0');
}

export function createDefaultPrizeCards(): PrizeCard[] {
  return Array.from({ length: TOTAL_ROULETTE_CARDS }, (_, idx) => ({
    number: idx + 1,
    description: DEFAULT_PRIZE_DESCRIPTIONS[idx] ?? `Prêmio do Cartão ${idx + 1}`,
  }));
}

export function createEmptyPrizeCards(): PrizeCard[] {
  return Array.from({ length: TOTAL_ROULETTE_CARDS }, (_, idx) => ({
    number: idx + 1,
    description: '',
  }));
}

export function normalizePrizeCards(raw?: PrizeCard[] | null): PrizeCard[] {
  const byNumber = new Map<number, string>();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (
        item &&
        typeof item.number === 'number' &&
        Number.isInteger(item.number) &&
        item.number >= 1 &&
        item.number <= TOTAL_ROULETTE_CARDS &&
        typeof item.description === 'string'
      ) {
        byNumber.set(item.number, item.description);
      }
    }
  }

  return Array.from({ length: TOTAL_ROULETTE_CARDS }, (_, idx) => {
    const num = idx + 1;
    return {
      number: num,
      description: byNumber.has(num) ? byNumber.get(num)! : '',
    };
  });
}

export function updatePrizeCard(
  cards: PrizeCard[],
  cardNumber: number,
  description: string
): PrizeCard[] {
  if (
    !Number.isInteger(cardNumber) ||
    cardNumber < 1 ||
    cardNumber > TOTAL_ROULETTE_CARDS
  ) {
    return cards;
  }
  const normalized = normalizePrizeCards(cards);
  const cleaned = description.trim();
  return normalized.map((card) =>
    card.number === cardNumber ? { ...card, description: cleaned } : card
  );
}

/**
 * Randomly shuffles all 60 prize card descriptions across card numbers 1..60
 * using Fisher-Yates, preserving the exact multiset of descriptions and ensuring
 * a different assignment whenever at least two distinct values exist.
 */
export function shufflePrizeCards(
  cards: PrizeCard[],
  randomIndexFn: (length: number) => number = getSecureRandomIndex
): PrizeCard[] {
  const normalized = normalizePrizeCards(cards);
  const original = normalized.map((card) => card.description);
  const distinctValues = new Set(original);

  if (distinctValues.size <= 1) {
    return normalized;
  }

  const descriptions = [...original];

  const runFisherYates = () => {
    for (let i = descriptions.length - 1; i > 0; i--) {
      const j = randomIndexFn(i + 1);
      const tmp = descriptions[i];
      descriptions[i] = descriptions[j];
      descriptions[j] = tmp;
    }
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    runFisherYates();
    if (descriptions.some((desc, idx) => desc !== original[idx])) {
      break;
    }
  }

  if (!descriptions.some((desc, idx) => desc !== original[idx])) {
    const firstDiffIdx = descriptions.findIndex((desc) => desc !== descriptions[0]);
    if (firstDiffIdx > 0) {
      const tmp = descriptions[0];
      descriptions[0] = descriptions[firstDiffIdx];
      descriptions[firstDiffIdx] = tmp;
    }
  }

  return normalized.map((card, idx) => ({
    number: card.number,
    description: descriptions[idx],
  }));
}

export function getPrizeDescription(
  cards: PrizeCard[],
  cardNumber: number
): string {
  const found = cards.find((c) => c.number === cardNumber);
  const text = found?.description.trim() ?? '';
  return text.length > 0 ? text : 'Nenhum prêmio cadastrado para este cartão.';
}

export function isOuterRingCard(cardNumber: number): boolean {
  return cardNumber >= 1 && cardNumber <= OUTER_RING_COUNT;
}

/**
 * Angle in degrees clockwise from 12 o'clock (0 deg) for outer ring cards 1..30.
 */
export function getOuterMedallionAngle(cardNumber: number): number {
  return ((cardNumber - 1) % OUTER_RING_COUNT) * ROULETTE_STEP_DEG;
}

/**
 * Local angle in degrees clockwise from 12 o'clock (0 deg) for inner ring cards 31..60.
 */
export function getInnerMedallionLocalAngle(cardNumber: number): number {
  return ((cardNumber - OUTER_RING_COUNT - 1) % INNER_RING_COUNT) * ROULETTE_STEP_DEG;
}

function getSecureRandomIndex(length: number): number {
  if (length <= 1) return 0;
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const maxValid = Math.floor(0xffffffff / length) * length;
    const arr = new Uint32Array(1);
    let val = 0;
    do {
      globalThis.crypto.getRandomValues(arr);
      val = arr[0];
    } while (val >= maxValid);
    return val % length;
  }
  return Math.floor(Math.random() * length);
}

/**
 * Draws 2 distinct numbers in 1..60.
 * Prefers 1 outer ring number (1..30) and 1 inner ring number (31..60) so both
 * align directly beneath the single golden roulette needle (matching the dual-ring wheel).
 * Falls back gracefully to any 2 remaining distinct numbers if one ring is exhausted.
 */
export function drawTwoRouletteNumbers(
  excludeNumbers: number[] = []
): [number, number] | null {
  const excluded = new Set(excludeNumbers);

  const outerPool: number[] = [];
  const innerPool: number[] = [];

  for (let n = 1; n <= OUTER_RING_COUNT; n++) {
    if (!excluded.has(n)) outerPool.push(n);
  }
  for (let n = OUTER_RING_COUNT + 1; n <= TOTAL_ROULETTE_CARDS; n++) {
    if (!excluded.has(n)) innerPool.push(n);
  }

  if (outerPool.length > 0 && innerPool.length > 0) {
    const outerPick = outerPool[getSecureRandomIndex(outerPool.length)];
    const innerPick = innerPool[getSecureRandomIndex(innerPool.length)];
    return [outerPick, innerPick];
  }

  const combined = [...outerPool, ...innerPool];
  if (combined.length < 2) {
    return null;
  }

  const firstIdx = getSecureRandomIndex(combined.length);
  const first = combined[firstIdx];
  combined.splice(firstIdx, 1);
  const second = combined[getSecureRandomIndex(combined.length)];
  return [first, second];
}

export interface WheelSpinTargets {
  nextPointerDeg: number;
  nextInnerRingDeg: number;
  secondaryPointerDeg: number | null;
}

function normalizeAngle360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Computes exact 8-second animation end rotations for the pointer needle and rotatable inner ring.
 * When pair has 1 outer (1..30) + 1 inner (31..60), the pointer lands dead-center on the outer
 * number AND the inner ring counter-rotates so the inner number lands at the exact same world angle.
 */
export function computeWheelSpinTargets(
  currentPointerDeg: number,
  currentInnerRingDeg: number,
  pair: [number, number]
): WheelSpinTargets {
  const [first, second] = pair;
  const firstIsOuter = isOuterRingCard(first);
  const secondIsOuter = isOuterRingCard(second);

  // Standard dual-ring alignment: 1 outer + 1 inner aligned on the single golden needle
  if (firstIsOuter !== secondIsOuter) {
    const outerNum = firstIsOuter ? first : second;
    const innerNum = firstIsOuter ? second : first;

    const targetWorldAngle = getOuterMedallionAngle(outerNum);
    const currentPtrMod = normalizeAngle360(currentPointerDeg);
    const cwDelta = normalizeAngle360(targetWorldAngle - currentPtrMod);
    const nextPointerDeg = currentPointerDeg + 7 * 360 + cwDelta;

    const innerLocalAngle = getInnerMedallionLocalAngle(innerNum);
    const desiredInnerMod = normalizeAngle360(targetWorldAngle - innerLocalAngle);
    const currentInnerMod = normalizeAngle360(currentInnerRingDeg);
    const ccwDelta = normalizeAngle360(currentInnerMod - desiredInnerMod);
    const nextInnerRingDeg = currentInnerRingDeg - (4 * 360 + ccwDelta);

    return {
      nextPointerDeg,
      nextInnerRingDeg,
      secondaryPointerDeg: null,
    };
  }

  // Fallback when both drawn numbers are on the same ring (e.g. after 30+ non-repeating draws)
  if (firstIsOuter && secondIsOuter) {
    const targetWorld1 = getOuterMedallionAngle(first);
    const targetWorld2 = getOuterMedallionAngle(second);
    const currentPtrMod = normalizeAngle360(currentPointerDeg);
    const cwDelta = normalizeAngle360(targetWorld1 - currentPtrMod);
    return {
      nextPointerDeg: currentPointerDeg + 7 * 360 + cwDelta,
      nextInnerRingDeg: currentInnerRingDeg - 4 * 360,
      secondaryPointerDeg: targetWorld2,
    };
  }

  // Both on inner ring (31..60)
  const innerLocal1 = getInnerMedallionLocalAngle(first);
  const innerLocal2 = getInnerMedallionLocalAngle(second);
  const nextInnerRingDeg = currentInnerRingDeg - 4 * 360;
  const world1 = normalizeAngle360(innerLocal1 + nextInnerRingDeg);
  const world2 = normalizeAngle360(innerLocal2 + nextInnerRingDeg);
  const currentPtrMod = normalizeAngle360(currentPointerDeg);
  const cwDelta = normalizeAngle360(world1 - currentPtrMod);
  return {
    nextPointerDeg: currentPointerDeg + 7 * 360 + cwDelta,
    nextInnerRingDeg,
    secondaryPointerDeg: world2,
  };
}

/**
 * Smooth quartic ease-out curve for the 8-second physical wheel deceleration.
 */
export function easeOutQuart(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 4);
}

/**
 * Returns a sorted list of unique card numbers (1..60) that have already been chosen
 * (persisted in draw history plus an optional currently selected card number).
 */
export function getChosenRouletteNumbers(
  history: RouletteDrawRecord[],
  activeSelectedNumber: number | null = null
): number[] {
  const chosen = new Set<number>();
  for (const item of history) {
    if (
      Number.isInteger(item.chosenNumber) &&
      item.chosenNumber >= 1 &&
      item.chosenNumber <= TOTAL_ROULETTE_CARDS
    ) {
      chosen.add(item.chosenNumber);
    }
  }
  if (
    activeSelectedNumber !== null &&
    Number.isInteger(activeSelectedNumber) &&
    activeSelectedNumber >= 1 &&
    activeSelectedNumber <= TOTAL_ROULETTE_CARDS
  ) {
    chosen.add(activeSelectedNumber);
  }
  return Array.from(chosen).sort((a, b) => a - b);
}

/**
 * Updates a single prize card and resets the roulette game history so all balls
 * return to their unchosen state for a fresh game.
 */
export function applyPrizeCardEditAndReset(
  state: RussianRoulettePersistedState,
  cardNumber: number,
  description: string
): RussianRoulettePersistedState {
  return {
    prizeCards: updatePrizeCard(state.prizeCards, cardNumber, description),
    history: [],
  };
}

/**
 * Shuffles all 60 prize descriptions onto new numbers and resets the roulette
 * game history so a fresh game starts cleanly.
 */
export function applyPrizeShuffleAndReset(
  state: RussianRoulettePersistedState,
  randomIndexFn: (length: number) => number = getSecureRandomIndex
): RussianRoulettePersistedState {
  return {
    prizeCards: shufflePrizeCards(state.prizeCards, randomIndexFn),
    history: [],
  };
}


