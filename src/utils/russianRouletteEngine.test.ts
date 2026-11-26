import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeWheelSpinTargets,
  createDefaultPrizeCards,
  createEmptyPrizeCards,
  drawTwoRouletteNumbers,
  easeOutQuart,
  getChosenRouletteNumbers,
  getInnerMedallionLocalAngle,
  getOuterMedallionAngle,
  getPrizeDescription,
  normalizePrizeCards,
  shufflePrizeCards,
  TOTAL_ROULETTE_CARDS,
  updatePrizeCard,
} from './russianRouletteEngine';

function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

test('createDefaultPrizeCards builds 60 unique cards numbered 1 to 60 with descriptions', () => {
  const cards = createDefaultPrizeCards();
  assert.equal(cards.length, TOTAL_ROULETTE_CARDS);
  assert.equal(cards[0].number, 1);
  assert.equal(cards[59].number, 60);
  for (const card of cards) {
    assert.ok(card.description.trim().length > 0);
  }
});

test('updatePrizeCard updates target card 1..60 immutably and ignores out-of-range numbers', () => {
  const initial = createDefaultPrizeCards();
  const updated = updatePrizeCard(initial, 15, '  Moto Zero KM  ');
  assert.equal(getPrizeDescription(updated, 15), 'Moto Zero KM');
  assert.notEqual(getPrizeDescription(initial, 15), 'Moto Zero KM');

  const unchanged = updatePrizeCard(updated, 61, 'Inválido');
  assert.deepEqual(unchanged, updated);

  const normalized = normalizePrizeCards([{ number: 7, description: 'Bônus Especial' }]);
  assert.equal(normalized.length, 60);
  assert.equal(getPrizeDescription(normalized, 7), 'Bônus Especial');
  assert.equal(
    getPrizeDescription(normalized, 8),
    'Nenhum prêmio cadastrado para este cartão.'
  );
});

test('drawTwoRouletteNumbers draws 2 distinct numbers (1 outer + 1 inner) and respects exclusions', () => {
  for (let i = 0; i < 40; i++) {
    const pair = drawTwoRouletteNumbers();
    assert.ok(pair !== null);
    assert.notEqual(pair[0], pair[1]);
    assert.ok(pair[0] >= 1 && pair[0] <= 30);
    assert.ok(pair[1] >= 31 && pair[1] <= 60);
  }

  // Fallback when entire outer ring (1..30) is excluded
  const outerExcluded = Array.from({ length: 30 }, (_, i) => i + 1);
  const innerOnlyPair = drawTwoRouletteNumbers(outerExcluded);
  assert.ok(innerOnlyPair !== null);
  assert.notEqual(innerOnlyPair[0], innerOnlyPair[1]);
  assert.ok(innerOnlyPair[0] >= 31 && innerOnlyPair[0] <= 60);
  assert.ok(innerOnlyPair[1] >= 31 && innerOnlyPair[1] <= 60);

  // Returns null when fewer than 2 cards remain
  const almostAllExcluded = Array.from({ length: 59 }, (_, i) => i + 1);
  assert.equal(drawTwoRouletteNumbers(almostAllExcluded), null);
});

test('computeWheelSpinTargets aligns outer and inner drawn numbers identically under the single needle', () => {
  const testCases: Array<{
    startPtr: number;
    startInner: number;
    pair: [number, number];
  }> = [
    { startPtr: 0, startInner: 0, pair: [1, 31] },
    { startPtr: 0, startInner: 0, pair: [15, 58] },
    { startPtr: 2634, startInner: -1488, pair: [30, 32] },
    { startPtr: 5112, startInner: -2940, pair: [7, 60] },
    { startPtr: 120, startInner: -96, pair: [24, 44] },
  ];

  for (const tc of testCases) {
    const result = computeWheelSpinTargets(tc.startPtr, tc.startInner, tc.pair);
    assert.equal(result.secondaryPointerDeg, null);
    // Pointer must advance clockwise by at least 7 full rotations
    assert.ok(result.nextPointerDeg >= tc.startPtr + 7 * 360);
    // Inner ring must rotate counter-clockwise by at least 4 full rotations
    assert.ok(result.nextInnerRingDeg <= tc.startInner - 4 * 360);

    const pointerFinalWorld = mod360(result.nextPointerDeg);
    const outerWorld = mod360(getOuterMedallionAngle(tc.pair[0]));
    const innerWorld = mod360(
      getInnerMedallionLocalAngle(tc.pair[1]) + result.nextInnerRingDeg
    );

    assert.equal(pointerFinalWorld, outerWorld);
    assert.equal(innerWorld, outerWorld);
  }
});

test('easeOutQuart starts at 0, ends at 1, and decelerates monotonically', () => {
  assert.equal(easeOutQuart(0), 0);
  assert.equal(easeOutQuart(1), 1);
  assert.ok(easeOutQuart(0.25) > 0.5);
  assert.ok(easeOutQuart(0.5) < easeOutQuart(0.75));
  assert.ok(easeOutQuart(0.75) < easeOutQuart(1));
});

test('shufflePrizeCards randomly reassigns descriptions to new numbers while preserving all prizes', () => {
  const original = createDefaultPrizeCards();
  const shuffled = shufflePrizeCards(original);

  assert.equal(shuffled.length, TOTAL_ROULETTE_CARDS);
  // Card numbers remain 1..60 in sequence
  assert.deepEqual(
    shuffled.map((c) => c.number),
    Array.from({ length: TOTAL_ROULETTE_CARDS }, (_, idx) => idx + 1)
  );
  // Exact multiset of descriptions preserved
  assert.deepEqual(
    [...shuffled.map((c) => c.description)].sort(),
    [...original.map((c) => c.description)].sort()
  );
  // Descriptions moved to new numbers
  const movedCount = shuffled.filter(
    (c, idx) => c.description !== original[idx].description
  ).length;
  assert.ok(movedCount > 0);
  // Original array is not mutated
  assert.equal(original[0].description, createDefaultPrizeCards()[0].description);
});

test('shufflePrizeCards moves a single registered prize to a new number and handles all-empty safely', () => {
  const empty = createEmptyPrizeCards();
  const shuffledEmpty = shufflePrizeCards(empty);
  assert.deepEqual(shuffledEmpty, empty);

  const singlePrize = updatePrizeCard(empty, 1, 'Prêmio Único Especial');
  // Even if RNG always returns the max index (identity permutation), fallback guarantees a new number
  const shuffledSingle = shufflePrizeCards(singlePrize, (len) => len - 1);
  const movedCard = shuffledSingle.find(
    (c) => c.description === 'Prêmio Único Especial'
  );
  assert.ok(movedCard !== undefined);
  assert.notEqual(movedCard.number, 1);
  assert.equal(
    shuffledSingle.filter((c) => c.description.trim().length > 0).length,
    1
  );
});

test('getChosenRouletteNumbers collects unique valid chosen numbers from history and active selection', () => {
  assert.deepEqual(getChosenRouletteNumbers([], null), []);
  assert.deepEqual(getChosenRouletteNumbers([], 17), [17]);

  const history = [
    {
      id: 'r1',
      timestamp: '2026-11-26T00:00:00.000Z',
      drawnPair: [12, 45] as [number, number],
      chosenNumber: 45,
      prizeDescription: 'Prêmio 45',
    },
    {
      id: 'r2',
      timestamp: '2026-11-26T00:01:00.000Z',
      drawnPair: [3, 45] as [number, number],
      chosenNumber: 3,
      prizeDescription: 'Prêmio 3',
    },
    {
      id: 'r3',
      timestamp: '2026-11-26T00:02:00.000Z',
      drawnPair: [3, 50] as [number, number],
      chosenNumber: 3,
      prizeDescription: 'Prêmio 3 repetido',
    },
  ];

  assert.deepEqual(getChosenRouletteNumbers(history, null), [3, 45]);
  assert.deepEqual(getChosenRouletteNumbers(history, 22), [3, 22, 45]);
  assert.deepEqual(getChosenRouletteNumbers(history, 45), [3, 45]);
  // Ignores out-of-range numbers safely
  assert.deepEqual(getChosenRouletteNumbers(history, 99), [3, 45]);
});

