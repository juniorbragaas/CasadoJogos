import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BINGO_CARD_PER_COLUMN,
  BINGO_CARD_TOTAL_NUMBERS,
  BINGO_MAX,
  BINGO_MIN,
  BINGO_SPIN_DURATION_MS,
  BINGO_TOTAL,
  buildBingoCardColumns,
  canGenerateBingoCard,
  computeBingoRouletteTickSchedule,
  drawNextBingoNumber,
  formatBingoNumber,
  getBingoCardColumnCounts,
  getBingoDecadeColumns,
  getDecadeIndexForNumber,
  getDecadeLabelForNumber,
  getNextBingoGameNumber,
  getRemainingBingoNumbers,
  INITIAL_BINGO_GAME_NUMBER,
  isBingoCardComplete,
  normalizeBingoGameNumber,
  toggleBingoCardNumber,
} from './bingoEngine';

test('getBingoDecadeColumns creates 10 decade columns covering 1 to 99 exactly once', () => {
  const cols = getBingoDecadeColumns();
  assert.equal(cols.length, 10);

  // Column 0 is 01-09 (9 numbers)
  assert.equal(cols[0].label, '01–09');
  assert.equal(cols[0].numbers.length, 9);
  assert.deepEqual(cols[0].numbers, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // Column 1 is 10-19 (10 numbers)
  assert.equal(cols[1].label, '10–19');
  assert.equal(cols[1].numbers.length, 10);
  assert.deepEqual(cols[1].numbers, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

  // Column 9 is 90-99 (10 numbers)
  assert.equal(cols[9].label, '90–99');
  assert.equal(cols[9].numbers.length, 10);
  assert.equal(cols[9].numbers[0], 90);
  assert.equal(cols[9].numbers[9], 99);

  // Flattened set has exactly 99 unique numbers from 1..99
  const all = cols.flatMap((c) => c.numbers);
  assert.equal(all.length, BINGO_TOTAL);
  assert.equal(new Set(all).size, BINGO_TOTAL);
  assert.equal(Math.min(...all), BINGO_MIN);
  assert.equal(Math.max(...all), BINGO_MAX);
});

test('decade lookup helpers map boundaries accurately', () => {
  assert.equal(getDecadeIndexForNumber(1), 0);
  assert.equal(getDecadeIndexForNumber(9), 0);
  assert.equal(getDecadeIndexForNumber(10), 1);
  assert.equal(getDecadeIndexForNumber(19), 1);
  assert.equal(getDecadeIndexForNumber(50), 5);
  assert.equal(getDecadeIndexForNumber(99), 9);

  assert.equal(getDecadeLabelForNumber(7), '01–09');
  assert.equal(getDecadeLabelForNumber(14), '10–19');
  assert.equal(getDecadeLabelForNumber(99), '90–99');
  assert.equal(formatBingoNumber(5), '05');
  assert.equal(formatBingoNumber(42), '42');
});

test('drawNextBingoNumber draws all 99 unique balls without duplicates and then returns null', () => {
  const drawn: number[] = [];
  let seed = 17;
  const deterministicRng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x80000000;
  };

  for (let i = 0; i < BINGO_TOTAL; i++) {
    const next = drawNextBingoNumber(drawn, deterministicRng);
    assert.ok(next !== null, `Draw ${i + 1} should not be null`);
    assert.ok(next >= BINGO_MIN && next <= BINGO_MAX);
    assert.ok(!drawn.includes(next), `Duplicate number drawn: ${next}`);
    drawn.push(next);
    assert.equal(getRemainingBingoNumbers(drawn).length, BINGO_TOTAL - (i + 1));
  }

  assert.equal(drawn.length, BINGO_TOTAL);
  assert.equal(new Set(drawn).size, BINGO_TOTAL);
  assert.equal(drawNextBingoNumber(drawn, deterministicRng), null);
});

test('computeBingoRouletteTickSchedule generates monotonically decelerating ticks until ball reveal', () => {
  const schedule = computeBingoRouletteTickSchedule(BINGO_SPIN_DURATION_MS);

  assert.ok(schedule.length >= 16, `Expected >= 16 ticks, got ${schedule.length}`);
  assert.equal(schedule[0].timeMs, 0);

  const lastTick = schedule[schedule.length - 1];
  assert.ok(lastTick.timeMs < BINGO_SPIN_DURATION_MS);
  assert.ok(
    lastTick.timeMs >= BINGO_SPIN_DURATION_MS * 0.82,
    `Expected ticks to span until near reveal, ended at ${lastTick.timeMs}ms`
  );

  let prevGap = 0;
  for (let i = 1; i < schedule.length; i++) {
    const gap = schedule[i].timeMs - schedule[i - 1].timeMs;
    assert.ok(gap > 0, 'Tick timestamps must strictly increase');
    assert.ok(
      gap >= prevGap - 1,
      `Intervals should decelerate monotonically (${prevGap}ms -> ${gap}ms)`
    );
    prevGap = gap;
  }

  const firstGap = schedule[1].timeMs - schedule[0].timeMs;
  const finalGap =
    schedule[schedule.length - 1].timeMs - schedule[schedule.length - 2].timeMs;
  assert.ok(firstGap <= 45, `Expected fast start gap <= 45ms, got ${firstGap}ms`);
  assert.ok(
    finalGap >= firstGap * 3,
    `Expected strong deceleration (first=${firstGap}ms, final=${finalGap}ms)`
  );
});

test('toggleBingoCardNumber enforces max 5 numbers per decade column and toggles cleanly', () => {
  let selected: number[] = [];
  for (const n of [1, 2, 3, 4, 5]) {
    selected = toggleBingoCardNumber(selected, n);
  }
  assert.deepEqual(selected, [1, 2, 3, 4, 5]);
  assert.equal(getBingoCardColumnCounts(selected)[0], BINGO_CARD_PER_COLUMN);

  // Attempting to add a 6th number in column 01-09 must be blocked
  const afterSixth = toggleBingoCardNumber(selected, 6);
  assert.deepEqual(afterSixth, [1, 2, 3, 4, 5]);

  // Adding a number in column 10-19 still works
  const withSecondCol = toggleBingoCardNumber(afterSixth, 15);
  assert.deepEqual(withSecondCol, [1, 2, 3, 4, 5, 15]);

  // Clicking an already selected number removes it, allowing a replacement in column 01-09
  const deselected = toggleBingoCardNumber(withSecondCol, 3);
  assert.deepEqual(deselected, [1, 2, 4, 5, 15]);
  const replaced = toggleBingoCardNumber(deselected, 9);
  assert.deepEqual(replaced, [1, 2, 4, 5, 9, 15]);
});

test('isBingoCardComplete and buildBingoCardColumns require exactly 5 numbers in all 10 columns', () => {
  const columns = getBingoDecadeColumns();
  let selected: number[] = [];

  for (const col of columns) {
    for (let i = 0; i < BINGO_CARD_PER_COLUMN; i++) {
      assert.equal(isBingoCardComplete(selected), false);
      selected = toggleBingoCardNumber(selected, col.numbers[i]);
    }
  }

  assert.equal(selected.length, BINGO_CARD_TOTAL_NUMBERS);
  assert.equal(isBingoCardComplete(selected), true);

  const built = buildBingoCardColumns(selected);
  assert.equal(built.length, 10);
  for (const col of built) {
    assert.equal(col.numbers.length, BINGO_CARD_PER_COLUMN);
    for (let i = 1; i < col.numbers.length; i++) {
      assert.ok(col.numbers[i] > col.numbers[i - 1]);
    }
  }

  // Removing 1 number makes the card incomplete again
  const incomplete = toggleBingoCardNumber(selected, selected[0]);
  assert.equal(isBingoCardComplete(incomplete), false);
});

test('Bingo game number starts at 1, increments sequentially, and locks card generation during active game', () => {
  assert.equal(INITIAL_BINGO_GAME_NUMBER, 1);
  assert.equal(normalizeBingoGameNumber(undefined), 1);
  assert.equal(normalizeBingoGameNumber(0), 1);
  assert.equal(normalizeBingoGameNumber(-3), 1);
  assert.equal(normalizeBingoGameNumber(4), 4);

  assert.equal(getNextBingoGameNumber(1), 2);
  assert.equal(getNextBingoGameNumber(2), 3);

  // Allowed only before the game starts drawing
  assert.equal(canGenerateBingoCard(0, false), true);
  // Locked while first ball is spinning
  assert.equal(canGenerateBingoCard(0, true), false);
  // Locked throughout the entire active game until reset/new game
  assert.equal(canGenerateBingoCard(1, false), false);
  assert.equal(canGenerateBingoCard(50, false), false);
  assert.equal(canGenerateBingoCard(99, false), false);
});
