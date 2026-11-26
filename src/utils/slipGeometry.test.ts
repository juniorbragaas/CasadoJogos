import test from 'node:test';
import assert from 'node:assert/strict';
import { LOTTERY_GAMES } from '../data/lotteryGames';
import { generateOfficialBet } from './lotteryEngine';
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  buildMultiGameSlipPages,
  buildSummarySheetPages,
  chunkBetsBySlipCapacity,
  computeSlipLayout,
  TrayAlignment,
} from './slipGeometry';
import { buildAllGamesPdfDocument } from './pdfExporter';

test('all 8 games produce valid optical mark rectangles strictly inside card and A4 page bounds', () => {
  const alignments: TrayAlignment[] = ['left', 'center', 'right'];

  for (const game of LOTTERY_GAMES) {
    const bet = generateOfficialBet(game.id, 'Teste de geometria oficial', {
      variationIndex: 1,
    });

    for (const alignment of alignments) {
      const layout = computeSlipLayout(game.id, [bet], {
        trayAlignment: alignment,
        offsetXMm: 0,
        offsetYMm: 0,
      });

      assert.ok(layout.marks.length > 0, `${game.id} must produce optical marks`);
      assert.ok(layout.cardX >= 0 && layout.cardX + layout.cardWidth <= A4_WIDTH_MM);
      assert.ok(layout.cardY >= 0 && layout.cardY + layout.cardHeight <= A4_HEIGHT_MM);

      for (const mark of layout.marks) {
        assert.ok(
          mark.x >= layout.cardX && mark.x + mark.w <= layout.cardX + layout.cardWidth,
          `${game.id} mark ${mark.label} X out of card bounds`
        );
        assert.ok(
          mark.y >= layout.cardY && mark.y + mark.h <= layout.cardY + layout.cardHeight,
          `${game.id} mark ${mark.label} Y out of card bounds`
        );
      }
    }
  }
});

test('calibration offsets shift all marks accurately in millimeters', () => {
  const bet = generateOfficialBet('mega-sena', 'Calibração de impressora');
  const base = computeSlipLayout('mega-sena', [bet], {
    trayAlignment: 'center',
    offsetXMm: 0,
    offsetYMm: 0,
  });
  const shifted = computeSlipLayout('mega-sena', [bet], {
    trayAlignment: 'center',
    offsetXMm: 3.5,
    offsetYMm: -2.0,
  });

  assert.equal(base.marks.length, shifted.marks.length);
  assert.equal(Number((shifted.cardX - base.cardX).toFixed(2)), 3.5);
  assert.equal(Number((shifted.cardY - base.cardY).toFixed(2)), -2.0);
  for (let i = 0; i < base.marks.length; i++) {
    assert.equal(Number((shifted.marks[i].x - base.marks[i].x).toFixed(2)), 3.5);
    assert.equal(Number((shifted.marks[i].y - base.marks[i].y).toFixed(2)), -2.0);
  }
});

test('multi-panel slip supports up to 3 Mega-Sena bets on a single card', () => {
  const bets = [1, 2, 3].map((v) =>
    generateOfficialBet('mega-sena', 'Três jogos no mesmo volante', {
      variationIndex: v,
    })
  );
  const layout = computeSlipLayout('mega-sena', bets);
  assert.equal(layout.marks.length, 18); // 3 jogos x 6 dezenas
  assert.equal(layout.panelHeaders.length, 3);
});

test('chunkBetsBySlipCapacity splits N bets accurately across physical slips', () => {
  const megaBets = Array.from({ length: 7 }, (_, i) =>
    generateOfficialBet('mega-sena', 'Sete jogos na Mega', {
      variationIndex: i + 1,
    })
  );
  const megaSlips = chunkBetsBySlipCapacity('mega-sena', megaBets);
  assert.equal(megaSlips.length, 3); // 3 + 3 + 1
  assert.deepEqual(
    megaSlips.map((s) => s.length),
    [3, 3, 1]
  );

  const lotecaBets = Array.from({ length: 3 }, (_, i) =>
    generateOfficialBet('loteca', 'Três jogos Loteca', {
      variationIndex: i + 1,
    })
  );
  const lotecaSlips = chunkBetsBySlipCapacity('loteca', lotecaBets);
  assert.equal(lotecaSlips.length, 3); // 1 per slip
});

test('buildMultiGameSlipPages groups mixed lottery bets without mixing games on the same slip', () => {
  const mixed = [
    generateOfficialBet('mega-sena', 'Mega 1', { variationIndex: 1 }),
    generateOfficialBet('quina', 'Quina 1', { variationIndex: 1 }),
    generateOfficialBet('mega-sena', 'Mega 2', { variationIndex: 2 }),
    generateOfficialBet('mega-sena', 'Mega 3', { variationIndex: 3 }),
    generateOfficialBet('mega-sena', 'Mega 4', { variationIndex: 4 }),
    generateOfficialBet('loteca', 'Loteca 1', { variationIndex: 1 }),
  ];

  const pages = buildMultiGameSlipPages(mixed);
  // 4 Mega-Sena -> 2 pages (3 + 1), 1 Quina -> 1 page, 1 Loteca -> 1 page = 4 total pages
  assert.equal(pages.length, 4);
  assert.equal(pages[0].gameId, 'mega-sena');
  assert.equal(pages[0].bets.length, 3);
  assert.equal(pages[0].gameSlipTotal, 2);
  assert.equal(pages[1].gameId, 'mega-sena');
  assert.equal(pages[1].bets.length, 1);
  assert.equal(pages[2].gameId, 'quina');
  assert.equal(pages[2].bets.length, 1);
  assert.equal(pages[3].gameId, 'loteca');
  assert.equal(pages[3].bets.length, 1);
});

test('buildSummarySheetPages packs mixed games onto the same A4 sheet with game name, phrase, and numbers', () => {
  const mixed = [
    generateOfficialBet('mega-sena', 'Frase da Mega da Virada', { variationIndex: 1 }),
    generateOfficialBet('quina', 'Frase da Quina de São João', { variationIndex: 1 }),
    generateOfficialBet('mais-milionaria', 'Frase dos Trevos', { variationIndex: 1 }),
    generateOfficialBet('dia-de-sorte', 'Frase do Mês Feliz', { variationIndex: 1 }),
  ];

  const pages = buildSummarySheetPages(mixed);
  // All 4 standard bets fit on 1 single A4 sheet
  assert.equal(pages.length, 1);
  assert.equal(pages[0].entries.length, 4);

  assert.equal(pages[0].entries[0].gameName, 'Mega-Sena');
  assert.equal(pages[0].entries[0].phrase, 'Frase da Mega da Virada');
  assert.ok(pages[0].entries[0].numbersText.split(/\s+/).length === 6);

  assert.equal(pages[0].entries[1].gameName, 'Quina');
  assert.equal(pages[0].entries[1].phrase, 'Frase da Quina de São João');
  assert.ok(pages[0].entries[1].numbersText.split(/\s+/).length === 5);

  assert.equal(pages[0].entries[2].gameName, '+Milionária');
  assert.ok(pages[0].entries[2].extrasText?.includes('Trevos da Sorte'));

  assert.equal(pages[0].entries[3].gameName, 'Dia de Sorte');
  assert.ok(pages[0].entries[3].extrasText?.includes('Mês de Sorte'));

  // Verify jsPDF builds a 1-page A4 PDF in summary-sheet mode without throwing
  const doc = buildAllGamesPdfDocument({
    bets: mixed,
    mode: 'summary-sheet',
  });
  assert.equal(doc.getNumberOfPages(), 1);
});

test('buildSummarySheetPages paginates cleanly across multiple A4 sheets when exceeding 1 page height', () => {
  const manyBets = Array.from({ length: 15 }, (_, i) =>
    generateOfficialBet(i % 2 === 0 ? 'mega-sena' : 'lotofacil', `Aposta número ${i + 1}`, {
      variationIndex: i + 1,
    })
  );

  const pages = buildSummarySheetPages(manyBets);
  assert.ok(pages.length >= 2, '15 bets should span at least 2 A4 sheets');
  const totalEntries = pages.reduce((acc, p) => acc + p.entries.length, 0);
  assert.equal(totalEntries, 15);
  assert.equal(pages[0].entries[0].index, 1);
  assert.equal(pages[pages.length - 1].entries.at(-1)?.index, 15);
});
