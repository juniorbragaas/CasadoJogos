import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMemoryParticipant,
  computeMemoryBoardMetrics,
  createDefaultParticipants,
  createShuffledMemoryDeck,
  DEFAULT_MEMORY_FIGURES,
  evaluateMemoryTurn,
  getMemoryChampionSummary,
  MEMORY_MAX_PAIRS,
  MemoryFigure,
  removeMemoryParticipant,
  renameMemoryParticipant,
  resetParticipantScores,
  selectFiguresForRound,
} from './memoryGameEngine';

test('default memory figures ship with 16 unique built-in figures and cap any round at 16 pairs (32 cards)', () => {
  assert.equal(DEFAULT_MEMORY_FIGURES.length, MEMORY_MAX_PAIRS);

  // Create 24 custom figures to verify unlimited uploads still cap each game at 16 pairs (32 cards)
  const manyCustom: MemoryFigure[] = Array.from({ length: 24 }, (_, idx) => ({
    id: `custom-${idx + 1}`,
    name: `Figura ${idx + 1}`,
    kind: 'custom',
    imageUrl: `data:image/png;base64,img${idx + 1}`,
  }));

  const selected = selectFiguresForRound(manyCustom, DEFAULT_MEMORY_FIGURES);
  assert.equal(selected.length, 16);
  assert.equal(new Set(selected.map((f) => f.id)).size, 16);

  const deck = createShuffledMemoryDeck(manyCustom, DEFAULT_MEMORY_FIGURES);
  assert.equal(deck.length, 32);

  // Each chosen figure appears exactly twice
  const counts = new Map<string, number>();
  deck.forEach((card) => counts.set(card.figureId, (counts.get(card.figureId) ?? 0) + 1));
  assert.equal(counts.size, 16);
  for (const count of counts.values()) {
    assert.equal(count, 2);
  }
});

test('custom figures are prioritized and filled up to 16 pairs with built-in figures when includeBuiltins is true', () => {
  const customThree: MemoryFigure[] = [1, 2, 3].map((n) => ({
    id: `custom-${n}`,
    name: `Minha ${n}`,
    kind: 'custom',
    imageUrl: `data:image/png;base64,${n}`,
  }));

  const selected = selectFiguresForRound(customThree, DEFAULT_MEMORY_FIGURES, {
    includeBuiltins: true,
  });
  assert.equal(selected.length, 16);
  const selectedIds = new Set(selected.map((f) => f.id));
  assert.ok(selectedIds.has('custom-1'));
  assert.ok(selectedIds.has('custom-2'));
  assert.ok(selectedIds.has('custom-3'));

  const customOnly = selectFiguresForRound(customThree, DEFAULT_MEMORY_FIGURES, {
    includeBuiltins: false,
  });
  assert.equal(customOnly.length, 3);
});

test('turn evaluation keeps active player on match, awards +1 point, and advances player on mismatch', () => {
  const players = [
    { id: 'p1', name: 'Ana', score: 0 },
    { id: 'p2', name: 'Bruno', score: 0 },
  ];
  const deck = createShuffledMemoryDeck([], DEFAULT_MEMORY_FIGURES, { maxPairs: 2 });
  assert.equal(deck.length, 4);

  // Find a matching pair and a mismatching pair
  const first = deck[0];
  const matching = deck.find(
    (c) => c.figureId === first.figureId && c.instanceId !== first.instanceId
  )!;
  const nonMatching = deck.find((c) => c.figureId !== first.figureId)!;

  // 1. Mismatch passes turn to Bruno (index 1) with no points
  const miss = evaluateMemoryTurn(deck, players, 0, first.instanceId, nonMatching.instanceId);
  assert.equal(miss.isMatch, false);
  assert.equal(miss.nextPlayerIndex, 1);
  assert.equal(miss.updatedParticipants[0].score, 0);
  assert.equal(miss.isGameComplete, false);

  // 2. Match awards +1 point to Bruno and keeps Bruno's turn (index 1)
  const hit1 = evaluateMemoryTurn(
    miss.updatedCards,
    miss.updatedParticipants,
    miss.nextPlayerIndex,
    first.instanceId,
    matching.instanceId
  );
  assert.equal(hit1.isMatch, true);
  assert.equal(hit1.nextPlayerIndex, 1);
  assert.equal(hit1.updatedParticipants[1].score, 1);
  assert.equal(hit1.isGameComplete, false);

  // 3. Second match finishes the round
  const remaining = hit1.updatedCards.filter((c) => !c.isMatched);
  assert.equal(remaining.length, 2);
  const hit2 = evaluateMemoryTurn(
    hit1.updatedCards,
    hit1.updatedParticipants,
    hit1.nextPlayerIndex,
    remaining[0].instanceId,
    remaining[1].instanceId
  );
  assert.equal(hit2.isMatch, true);
  assert.equal(hit2.isGameComplete, true);
  assert.equal(hit2.updatedParticipants[1].score, 2);

  const summary = getMemoryChampionSummary(hit2.updatedParticipants, 2);
  assert.equal(summary.isTie, false);
  assert.equal(summary.topScore, 2);
  assert.equal(summary.champions[0].name, 'Bruno');
});

test('getMemoryChampionSummary detects ties accurately and participant helpers preserve invariants', () => {
  let participants = createDefaultParticipants();
  participants = addMemoryParticipant(participants, '  Carla  ', () => 'p-3');
  assert.equal(participants.length, 3);
  assert.equal(participants[2].name, 'Carla');

  participants = renameMemoryParticipant(participants, 'p-1', 'Alice');
  assert.equal(participants[0].name, 'Alice');

  participants = removeMemoryParticipant(participants, 'p-2');
  assert.equal(participants.length, 2);

  // Cannot delete last remaining participant
  const single = removeMemoryParticipant([participants[0]], participants[0].id);
  assert.equal(single.length, 1);

  const tied = [
    { id: 'p-1', name: 'Alice', score: 8 },
    { id: 'p-3', name: 'Carla', score: 8 },
  ];
  const tieSummary = getMemoryChampionSummary(tied, 16);
  assert.equal(tieSummary.isTie, true);
  assert.equal(tieSummary.champions.length, 2);
  assert.equal(tieSummary.topScore, 8);

  const reset = resetParticipantScores(tied);
  assert.deepEqual(
    reset.map((p) => p.score),
    [0, 0]
  );
});

test('computeMemoryBoardMetrics fits all 32 cards without overflow on desktop, tablet, and mobile viewports', () => {
  const cases = [
    { name: 'desktop-1440', w: 1120, h: 680, expectCols: 8, expectRows: 4 },
    { name: 'laptop-1280', w: 980, h: 560, expectCols: 8, expectRows: 4 },
    { name: 'mobile-portrait-390', w: 250, h: 630, expectCols: 4, expectRows: 8 },
    { name: 'mobile-landscape-844', w: 600, h: 240, expectCols: 8, expectRows: 4 },
  ];

  for (const c of cases) {
    const m = computeMemoryBoardMetrics(c.w, c.h, 32);
    assert.equal(m.columns, c.expectCols, `${c.name} columns`);
    assert.equal(m.rows, c.expectRows, `${c.name} rows`);
    assert.ok(m.totalWidth <= c.w, `${c.name} width fits (${m.totalWidth} <= ${c.w})`);
    assert.ok(m.totalHeight <= c.h, `${c.name} height fits (${m.totalHeight} <= ${c.h})`);
    assert.ok(m.cardWidth > 0 && m.cardHeight > 0);
  }
});
