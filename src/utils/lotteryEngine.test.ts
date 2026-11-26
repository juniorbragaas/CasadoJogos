import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampDrawCount,
  generateMultipleOfficialBets,
  generateOfficialBet,
  getSlipGridNumbers,
  normalizePhrase,
  validatePhrase,
} from './lotteryEngine';
import { MONTHS_PT_BR, TIMEMANIA_CLUBS } from '../data/lotteryGames';

test('phrase normalization handles accents, case, and repeated spaces', () => {
  assert.equal(
    normalizePhrase('  Ação   de  Graças!  '),
    'acao de gracas!'
  );
});

test('validatePhrase rejects empty and overly short phrases', () => {
  assert.equal(validatePhrase('').valid, false);
  assert.equal(validatePhrase('   ').valid, false);
  assert.equal(validatePhrase('ab').valid, false);
  assert.equal(validatePhrase('Sorte grande').valid, true);
});

test('same phrase and variation produce deterministic identical bets', () => {
  const betA = generateOfficialBet('mega-sena', 'Família unida em 2026', {
    pickCount: 6,
    variationIndex: 1,
  });
  const betB = generateOfficialBet('mega-sena', '  familia   unida em 2026 ', {
    pickCount: 6,
    variationIndex: 1,
  });
  assert.deepEqual(betA.numbers, betB.numbers);
  assert.equal(betA.seedFingerprint, betB.seedFingerprint);
});

test('different variations of the same phrase produce distinct combinations', () => {
  const bet1 = generateOfficialBet('mega-sena', 'Minha frase da sorte', {
    variationIndex: 1,
  });
  const bet2 = generateOfficialBet('mega-sena', 'Minha frase da sorte', {
    variationIndex: 2,
  });
  assert.notDeepEqual(bet1.numbers, bet2.numbers);
  assert.notEqual(bet1.seedFingerprint, bet2.seedFingerprint);
});

test('Mega-Sena respects 6..20 unique sorted numbers in 01..60', () => {
  const bet = generateOfficialBet('mega-sena', 'Mega sena campeã', {
    pickCount: 10,
  });
  assert.equal(bet.numbers.length, 10);
  assert.equal(new Set(bet.numbers).size, 10);
  for (let i = 0; i < bet.numbers.length; i++) {
    assert.ok(bet.numbers[i] >= 1 && bet.numbers[i] <= 60);
    if (i > 0) assert.ok(bet.numbers[i] > bet.numbers[i - 1]);
  }
});

test('Quina respects 5..15 unique numbers in 01..80', () => {
  const bet = generateOfficialBet('quina', 'Quina de São João', {
    pickCount: 8,
  });
  assert.equal(bet.numbers.length, 8);
  assert.equal(new Set(bet.numbers).size, 8);
  assert.ok(bet.numbers.every((n) => n >= 1 && n <= 80));
});

test('Lotofácil respects 15..20 unique numbers in 01..25', () => {
  const bet = generateOfficialBet('lotofacil', 'Lotofácil independência', {
    pickCount: 17,
  });
  assert.equal(bet.numbers.length, 17);
  assert.equal(new Set(bet.numbers).size, 17);
  assert.ok(bet.numbers.every((n) => n >= 1 && n <= 25));
});

test('Lotomania always draws exactly 50 unique numbers in 00..99 and grid ends with 00', () => {
  const bet = generateOfficialBet('lotomania', 'Cinquenta dezenas de sorte', {
    pickCount: 10, // should be clamped/fixed to 50
  });
  assert.equal(bet.numbers.length, 50);
  assert.equal(new Set(bet.numbers).size, 50);
  assert.ok(bet.numbers.every((n) => n >= 0 && n <= 99));

  const grid = getSlipGridNumbers('lotomania');
  assert.equal(grid.length, 100);
  assert.equal(grid[0], 1);
  assert.equal(grid[98], 99);
  assert.equal(grid[99], 0);
});

test('Timemania draws exactly 10 unique numbers in 01..80 plus valid Time do Coração', () => {
  assert.equal(TIMEMANIA_CLUBS.length, 80);
  const bet = generateOfficialBet('timemania', 'Meu time campeão');
  assert.equal(bet.numbers.length, 10);
  assert.equal(new Set(bet.numbers).size, 10);
  assert.ok(bet.numbers.every((n) => n >= 1 && n <= 80));
  assert.ok(bet.heartTeamIndex !== undefined);
  assert.ok(bet.heartTeamIndex >= 0 && bet.heartTeamIndex < 80);
  assert.equal(bet.heartTeamName, TIMEMANIA_CLUBS[bet.heartTeamIndex]);
});

test('Dia de Sorte draws 7..15 unique numbers in 01..31 plus valid Mês de Sorte', () => {
  const bet = generateOfficialBet('dia-de-sorte', 'Aniversário feliz', {
    pickCount: 9,
  });
  assert.equal(bet.numbers.length, 9);
  assert.equal(new Set(bet.numbers).size, 9);
  assert.ok(bet.numbers.every((n) => n >= 1 && n <= 31));
  assert.ok(bet.luckyMonthIndex !== undefined);
  assert.ok(bet.luckyMonthIndex >= 0 && bet.luckyMonthIndex < 12);
  assert.equal(bet.luckyMonthName, MONTHS_PT_BR[bet.luckyMonthIndex]);
});

test('+Milionária draws 6..12 numbers in 01..50 plus 2..6 unique Trevos in 1..6', () => {
  const bet = generateOfficialBet('mais-milionaria', 'Trevo da sorte milionário', {
    pickCount: 7,
    cloversCount: 3,
  });
  assert.equal(bet.numbers.length, 7);
  assert.equal(new Set(bet.numbers).size, 7);
  assert.ok(bet.numbers.every((n) => n >= 1 && n <= 50));
  assert.ok(bet.clovers !== undefined);
  assert.equal(bet.clovers.length, 3);
  assert.equal(new Set(bet.clovers).size, 3);
  assert.ok(bet.clovers.every((t) => t >= 1 && t <= 6));
});

test('Loteca generates 14 matches obeying official minimum 1 duplo and requested triplos', () => {
  const defaultBet = generateOfficialBet('loteca', 'Rodada de domingo');
  assert.ok(defaultBet.lotecaMatches);
  assert.equal(defaultBet.lotecaMatches.length, 14);
  const duplos = defaultBet.lotecaMatches.filter((m) => m.columns.length === 2).length;
  const triplos = defaultBet.lotecaMatches.filter((m) => m.columns.length === 3).length;
  const secos = defaultBet.lotecaMatches.filter((m) => m.columns.length === 1).length;
  assert.equal(duplos, 1);
  assert.equal(triplos, 0);
  assert.equal(secos, 13);

  const customBet = generateOfficialBet('loteca', 'Bolão do fim de semana', {
    lotecaDuplos: 3,
    lotecaTriplos: 2,
  });
  assert.equal(
    customBet.lotecaMatches!.filter((m) => m.columns.length === 2).length,
    3
  );
  assert.equal(
    customBet.lotecaMatches!.filter((m) => m.columns.length === 3).length,
    2
  );
  assert.equal(
    customBet.lotecaMatches!.filter((m) => m.columns.length === 1).length,
    9
  );
});

test('clampDrawCount enforces 1..50 bounds safely', () => {
  assert.equal(clampDrawCount(0), 1);
  assert.equal(clampDrawCount(-5), 1);
  assert.equal(clampDrawCount(1), 1);
  assert.equal(clampDrawCount(7), 7);
  assert.equal(clampDrawCount(999), 50);
  assert.equal(clampDrawCount(Number.NaN), 1);
});

test('generateMultipleOfficialBets generates N unique sequential draws deterministically', () => {
  const batch = generateMultipleOfficialBets(
    'mega-sena',
    'Bolão de fim de ano da família',
    5,
    { pickCount: 6, variationIndex: 1 }
  );
  assert.equal(batch.length, 5);
  assert.equal(new Set(batch.map((b) => b.id)).size, 5);
  assert.equal(new Set(batch.map((b) => b.seedFingerprint)).size, 5);
  assert.deepEqual(
    batch.map((b) => b.variationIndex),
    [1, 2, 3, 4, 5]
  );

  // Re-running with identical phrase & starting variation produces identical sequence
  const batchRepeat = generateMultipleOfficialBets(
    'mega-sena',
    'Bolão de fim de ano da família',
    5,
    { pickCount: 6, variationIndex: 1 }
  );
  assert.deepEqual(
    batch.map((b) => b.numbers),
    batchRepeat.map((b) => b.numbers)
  );
});
