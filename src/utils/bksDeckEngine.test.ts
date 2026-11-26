import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BKS_DECK_SIZE,
  BKS_DEFAULT_BACK_IMAGE,
  BKS_DEFAULT_CARDS,
  BKS_GRID_COLUMNS,
  BKS_GRID_ROWS,
  computeBksGridMetrics,
  createInitialBksDeck,
  flipBksCardUp,
  formatBksCardNumber,
  resetAllBksCardsFlipped,
  resolveBksBackSrc,
  resolveBksCardFrontSrc,
  shuffleBksDeck,
  sortUploadedCardFiles,
} from './bksDeckEngine';

test('default BKS deck contains exactly 32 unique cards and a valid back asset', () => {
  assert.equal(BKS_DEFAULT_CARDS.length, BKS_DECK_SIZE);
  assert.ok(BKS_DEFAULT_BACK_IMAGE.startsWith('/assets/aistudio/00_verso_baralho'));

  const ids = new Set(BKS_DEFAULT_CARDS.map((card) => card.id));
  const images = new Set(BKS_DEFAULT_CARDS.map((card) => card.defaultImage));
  assert.equal(ids.size, 32);
  assert.equal(images.size, 32);

  for (let i = 1; i <= 32; i++) {
    assert.ok(ids.has(i), `Missing card id ${i}`);
  }
});

test('shuffleBksDeck preserves all 32 cards and produces a different order', () => {
  const initial = createInitialBksDeck();
  const shuffled = shuffleBksDeck(initial);

  assert.equal(shuffled.length, 32);
  const initialIds = initial.map((c) => c.id);
  const shuffledIds = shuffled.map((c) => c.id);
  assert.notDeepEqual(shuffledIds, initialIds);
  assert.deepEqual([...shuffledIds].sort((a, b) => a - b), initialIds);
});

test('shuffleBksDeck guarantees order change even if PRNG yields identity permutation', () => {
  const initial = createInitialBksDeck();
  // Always pick j = i so naive Fisher-Yates leaves array untouched
  const shuffled = shuffleBksDeck(initial, () => 0.999999);
  assert.notDeepEqual(
    shuffled.map((c) => c.id),
    initial.map((c) => c.id)
  );
  assert.equal(shuffled.length, 32);
});

test('flipBksCardUp keeps flipped cards face-up without duplicates and reset clears all', () => {
  let flipped: number[] = [];
  flipped = flipBksCardUp(flipped, 7);
  flipped = flipBksCardUp(flipped, 14);
  flipped = flipBksCardUp(flipped, 7);

  assert.deepEqual(flipped, [7, 14]);
  assert.deepEqual(resetAllBksCardsFlipped(), []);
});

test('sortUploadedCardFiles orders numbered card files naturally from 1 to 32', () => {
  const files = [
    { name: '10_ouros.png' },
    { name: '2_copas.png' },
    { name: '01_copas.png' },
    { name: '32_paus.png' },
    { name: '3_copas.png' },
  ];

  const sorted = sortUploadedCardFiles(files);
  assert.deepEqual(
    sorted.map((f) => f.name),
    ['01_copas.png', '2_copas.png', '3_copas.png', '10_ouros.png', '32_paus.png']
  );
});

test('resolveBksCardFrontSrc and resolveBksBackSrc prioritize custom uploads, then embedded defaults, then placeholders', () => {
  const card = BKS_DEFAULT_CARDS[0];
  assert.equal(resolveBksCardFrontSrc(card, {}, false), card.defaultImage);
  assert.equal(resolveBksCardFrontSrc(card, {}, true), null);
  assert.equal(
    resolveBksCardFrontSrc(card, { 1: 'data:image/png;base64,abc' }, true),
    'data:image/png;base64,abc'
  );

  assert.equal(resolveBksBackSrc(null, false), BKS_DEFAULT_BACK_IMAGE);
  assert.equal(resolveBksBackSrc(null, true), null);
  assert.equal(
    resolveBksBackSrc('data:image/png;base64,back', true),
    'data:image/png;base64,back'
  );
  assert.equal(formatBksCardNumber(3), '03');
  assert.equal(formatBksCardNumber(32), '32');
});

test('computeBksGridMetrics maximizes 8x4 card sizes without exceeding container on desktop and mobile', () => {
  const viewports = [
    { name: 'desktop-1440', w: 1360, h: 660 },
    { name: 'laptop-1280', w: 1200, h: 560 },
    { name: 'tablet-768', w: 720, h: 860 },
    { name: 'mobile-portrait-390', w: 366, h: 610 },
    { name: 'mobile-landscape-844', w: 800, h: 185 },
    { name: 'small-phone-320', w: 300, h: 420 },
  ];

  for (const vp of viewports) {
    const m = computeBksGridMetrics(vp.w, vp.h);
    assert.equal(m.columns, BKS_GRID_COLUMNS);
    assert.equal(m.rows, BKS_GRID_ROWS);
    assert.ok(m.cardWidth > 0 && m.cardHeight > 0, `${vp.name} positive card size`);
    assert.ok(
      m.totalWidth <= vp.w,
      `${vp.name} totalWidth (${m.totalWidth}) must fit inside ${vp.w}`
    );
    assert.ok(
      m.totalHeight <= vp.h,
      `${vp.name} totalHeight (${m.totalHeight}) must fit inside ${vp.h}`
    );
    // At least one axis must be maximized (>= 90% utilization of container)
    const widthUtil = m.totalWidth / vp.w;
    const heightUtil = m.totalHeight / vp.h;
    assert.ok(
      Math.max(widthUtil, heightUtil) >= 0.9,
      `${vp.name} should maximize fit (got widthUtil=${widthUtil.toFixed(2)}, heightUtil=${heightUtil.toFixed(2)})`
    );
  }
});
