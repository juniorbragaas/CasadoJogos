import {
  getLotteryGameById,
  LotteryGameId,
  MONTHS_SHORT_PT_BR,
} from '../data/lotteryGames';
import {
  formatLotteryNumber,
  GeneratedBet,
  getSlipGridNumbers,
  LotecaColumn,
} from './lotteryEngine';

export type TrayAlignment = 'left' | 'center' | 'right';
export type PdfExportMode = 'original-slip' | 'test-grid' | 'summary-sheet';

export interface SlipCalibration {
  trayAlignment: TrayAlignment;
  offsetXMm: number;
  offsetYMm: number;
}

export const DEFAULT_SLIP_CALIBRATION: SlipCalibration = {
  trayAlignment: 'center',
  offsetXMm: 0,
  offsetYMm: 0,
};

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export interface SlipMarkRect {
  x: number; // mm from A4 left edge
  y: number; // mm from A4 top edge
  w: number; // mm
  h: number; // mm
  label: string;
  panelIndex: number;
  category: 'number' | 'clover' | 'month' | 'team' | 'loteca' | 'qty';
}

export interface SlipCellGuide {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  marked: boolean;
  panelIndex: number;
}

export interface SlipPhysicalSpec {
  cardWidthMm: number;
  cardHeightMm: number;
  markWidthMm: number;
  markHeightMm: number;
  /** Top offset to first game panel */
  firstPanelTopMm: number;
  /** Vertical distance between panels (Jogo A -> Jogo B -> Jogo C) */
  panelSpacingMm: number;
  /** Left margin inside the card to column 0 */
  gridLeftMm: number;
  /** Horizontal center-to-center pitch between columns */
  colPitchMm: number;
  /** Vertical center-to-center pitch between rows */
  rowPitchMm: number;
  /** Number of game panels available on a single official volante */
  panelsCount: number;
}

/**
 * Physical dimensions (mm) calibrated to official Loterias Caixa betting slips (volantes).
 * Standard Caixa optical slips measure ~82mm x 186mm–192mm, with ~4.6mm x 2.7mm optical bars.
 */
export const SLIP_SPECS: Record<LotteryGameId, SlipPhysicalSpec> = {
  'mega-sena': {
    cardWidthMm: 82,
    cardHeightMm: 190,
    markWidthMm: 4.6,
    markHeightMm: 2.7,
    firstPanelTopMm: 50,
    panelSpacingMm: 41.5,
    gridLeftMm: 8.5,
    colPitchMm: 6.7,
    rowPitchMm: 5.2,
    panelsCount: 3,
  },
  quina: {
    cardWidthMm: 82,
    cardHeightMm: 190,
    markWidthMm: 4.5,
    markHeightMm: 2.5,
    firstPanelTopMm: 42,
    panelSpacingMm: 44.5,
    gridLeftMm: 8.5,
    colPitchMm: 6.7,
    rowPitchMm: 4.6,
    panelsCount: 3,
  },
  lotofacil: {
    cardWidthMm: 82,
    cardHeightMm: 190,
    markWidthMm: 5.4,
    markHeightMm: 2.8,
    firstPanelTopMm: 48,
    panelSpacingMm: 41.5,
    gridLeftMm: 13.5,
    colPitchMm: 12.2,
    rowPitchMm: 5.9,
    panelsCount: 3,
  },
  loteca: {
    cardWidthMm: 82,
    cardHeightMm: 190,
    markWidthMm: 5.5,
    markHeightMm: 2.9,
    firstPanelTopMm: 54,
    panelSpacingMm: 0,
    gridLeftMm: 24,
    colPitchMm: 14.5,
    rowPitchMm: 7.4,
    panelsCount: 1,
  },
  lotomania: {
    cardWidthMm: 82,
    cardHeightMm: 192,
    markWidthMm: 4.5,
    markHeightMm: 2.5,
    firstPanelTopMm: 44,
    panelSpacingMm: 65,
    gridLeftMm: 8.5,
    colPitchMm: 6.7,
    rowPitchMm: 5.3,
    panelsCount: 2,
  },
  timemania: {
    cardWidthMm: 82,
    cardHeightMm: 192,
    markWidthMm: 4.5,
    markHeightMm: 2.5,
    firstPanelTopMm: 44,
    panelSpacingMm: 52,
    gridLeftMm: 8.5,
    colPitchMm: 6.7,
    rowPitchMm: 4.9,
    panelsCount: 2,
  },
  'dia-de-sorte': {
    cardWidthMm: 82,
    cardHeightMm: 190,
    markWidthMm: 4.6,
    markHeightMm: 2.7,
    firstPanelTopMm: 46,
    panelSpacingMm: 39,
    gridLeftMm: 8.5,
    colPitchMm: 6.7,
    rowPitchMm: 5.4,
    panelsCount: 2,
  },
  'mais-milionaria': {
    cardWidthMm: 82,
    cardHeightMm: 192,
    markWidthMm: 4.6,
    markHeightMm: 2.6,
    firstPanelTopMm: 44,
    panelSpacingMm: 55,
    gridLeftMm: 8.5,
    colPitchMm: 6.7,
    rowPitchMm: 5.1,
    panelsCount: 2,
  },
};

export interface ComputedSlipLayout {
  cardX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  marks: SlipMarkRect[];
  guides: SlipCellGuide[];
  panelHeaders: { x: number; y: number; text: string }[];
}

export function getCardOriginX(
  cardWidthMm: number,
  trayAlignment: TrayAlignment,
  offsetXMm: number
): number {
  let base = 0;
  if (trayAlignment === 'center') {
    base = (A4_WIDTH_MM - cardWidthMm) / 2;
  } else if (trayAlignment === 'right') {
    base = A4_WIDTH_MM - cardWidthMm - 8;
  } else {
    base = 8;
  }
  return Number((base + offsetXMm).toFixed(2));
}

export function chunkBetsBySlipCapacity(
  gameId: LotteryGameId,
  bets: GeneratedBet[]
): GeneratedBet[][] {
  const spec = SLIP_SPECS[gameId];
  const capacity = Math.max(1, spec.panelsCount);
  if (bets.length === 0) return [];
  const pages: GeneratedBet[][] = [];
  for (let i = 0; i < bets.length; i += capacity) {
    pages.push(bets.slice(i, i + capacity));
  }
  return pages;
}

export interface SlipPageGroup {
  gameId: LotteryGameId;
  gameSlipIndex: number; // 0-based index within this game
  gameSlipTotal: number;
  bets: GeneratedBet[];
}

/**
 * Groups an arbitrary mixed list of bets by lottery game and chunks each game
 * according to its official physical Caixa slip capacity so no two different
 * lotteries ever share the same physical card page.
 */
export function buildMultiGameSlipPages(bets: GeneratedBet[]): SlipPageGroup[] {
  if (bets.length === 0) return [];

  const grouped = new Map<LotteryGameId, GeneratedBet[]>();
  for (const bet of bets) {
    const list = grouped.get(bet.gameId);
    if (list) {
      list.push(bet);
    } else {
      grouped.set(bet.gameId, [bet]);
    }
  }

  const pages: SlipPageGroup[] = [];
  for (const [gameId, gameBets] of grouped.entries()) {
    const chunks = chunkBetsBySlipCapacity(gameId, gameBets);
    chunks.forEach((chunk, idx) => {
      pages.push({
        gameId,
        gameSlipIndex: idx,
        gameSlipTotal: chunks.length,
        bets: chunk,
      });
    });
  }
  return pages;
}

export interface SummarySheetEntry {
  index: number;
  betId: string;
  gameId: LotteryGameId;
  gameName: string;
  accentColor: string;
  phrase: string;
  numbersText: string;
  extrasText: string | null;
  lotecaLines?: string[];
  estimatedHeightMm: number;
}

export interface SummarySheetPage {
  pageIndex: number;
  entries: SummarySheetEntry[];
}

export function formatSummarySheetEntry(
  bet: GeneratedBet,
  index: number
): SummarySheetEntry {
  const game = getLotteryGameById(bet.gameId);

  let numbersText = '';
  let lotecaLines: string[] | undefined;

  if (game.kind === 'loteca' && bet.lotecaMatches) {
    lotecaLines = [];
    for (let row = 0; row < 7; row++) {
      const left = bet.lotecaMatches[row];
      const right = bet.lotecaMatches[row + 7];
      const fmtMatch = (m: typeof left) => {
        const c1 = m.columns.includes('1') ? '[1]' : ' 1 ';
        const cx = m.columns.includes('X') ? '[X]' : ' X ';
        const c2 = m.columns.includes('2') ? '[2]' : ' 2 ';
        return `J${formatLotteryNumber(m.matchNumber)}: ${c1} ${cx} ${c2}`;
      };
      lotecaLines.push(`${fmtMatch(left)}    |    ${fmtMatch(right)}`);
    }
    numbersText = bet.lotecaMatches
      .map((m) => `J${formatLotteryNumber(m.matchNumber)}:${m.columns.join('')}`)
      .join('  ');
  } else {
    numbersText = bet.numbers
      .map((n) => formatLotteryNumber(n, game.zeroPaddedDigits))
      .join('  ');
  }

  const extraParts: string[] = [];
  if (bet.clovers?.length) {
    extraParts.push(`Trevos da Sorte: ${bet.clovers.join(' e ')}`);
  }
  if (bet.luckyMonthName) {
    extraParts.push(`Mês de Sorte: ${bet.luckyMonthName}`);
  }
  if (bet.heartTeamName) {
    extraParts.push(
      `Time do Coração: ${formatLotteryNumber((bet.heartTeamIndex ?? 0) + 1)} — ${bet.heartTeamName}`
    );
  }
  const extrasText = extraParts.length > 0 ? extraParts.join(' · ') : null;

  const phraseLines = Math.max(1, Math.ceil((bet.phrase.length + 10) / 86));
  const numberLines =
    game.kind === 'loteca'
      ? 7
      : Math.max(1, Math.ceil(numbersText.length / 56));
  const extraHeight = extrasText ? 5 : 0;
  const bodyHeight =
    game.kind === 'loteca'
      ? numberLines * 4.4 + 2
      : numberLines * 5.2 + extraHeight;
  const estimatedHeightMm = Number(
    (11 + phraseLines * 4.2 + bodyHeight + 5).toFixed(1)
  );

  return {
    index,
    betId: bet.id,
    gameId: bet.gameId,
    gameName: game.name,
    accentColor: game.officialColor,
    phrase: bet.phrase,
    numbersText,
    extrasText,
    lotecaLines,
    estimatedHeightMm,
  };
}

/**
 * Packs bets onto the fewest A4 sheets possible with game name, phrase,
 * and drawn numbers — without any physical card / optical grid layout.
 */
export function buildSummarySheetPages(
  bets: GeneratedBet[]
): SummarySheetPage[] {
  if (bets.length === 0) return [];

  const pages: SummarySheetPage[] = [];
  const firstPageBudgetMm = 236;
  const nextPageBudgetMm = 256;

  let currentEntries: SummarySheetEntry[] = [];
  let usedHeight = 0;
  let budget = firstPageBudgetMm;

  bets.forEach((bet, idx) => {
    const entry = formatSummarySheetEntry(bet, idx + 1);
    if (currentEntries.length > 0 && usedHeight + entry.estimatedHeightMm > budget) {
      pages.push({ pageIndex: pages.length, entries: currentEntries });
      currentEntries = [];
      usedHeight = 0;
      budget = nextPageBudgetMm;
    }
    currentEntries.push(entry);
    usedHeight += entry.estimatedHeightMm;
  });

  if (currentEntries.length > 0) {
    pages.push({ pageIndex: pages.length, entries: currentEntries });
  }

  return pages;
}

export function computeSlipLayout(
  gameId: LotteryGameId,
  bets: GeneratedBet[],
  calibration: SlipCalibration = DEFAULT_SLIP_CALIBRATION
): ComputedSlipLayout {
  const game = getLotteryGameById(gameId);
  const spec = SLIP_SPECS[gameId];

  const cardX = getCardOriginX(spec.cardWidthMm, calibration.trayAlignment, calibration.offsetXMm);
  const cardY = Number((6 + calibration.offsetYMm).toFixed(2));

  const activeBets = bets.slice(0, spec.panelsCount);
  const marks: SlipMarkRect[] = [];
  const guides: SlipCellGuide[] = [];
  const panelHeaders: { x: number; y: number; text: string }[] = [];

  if (game.kind === 'loteca') {
    const bet = activeBets[0];
    panelHeaders.push({
      x: cardX + spec.gridLeftMm,
      y: cardY + spec.firstPanelTopMm - 4.5,
      text: 'COL 1     MEIO     COL 2',
    });

    const cols: readonly LotecaColumn[] = ['1', 'X', '2'];
    for (let row = 0; row < 14; row++) {
      const matchPred = bet?.lotecaMatches?.[row];
      for (let colIdx = 0; colIdx < 3; colIdx++) {
        const colKey = cols[colIdx];
        const cx = Number((cardX + spec.gridLeftMm + colIdx * spec.colPitchMm).toFixed(2));
        const cy = Number((cardY + spec.firstPanelTopMm + row * spec.rowPitchMm).toFixed(2));
        const marked = Boolean(matchPred?.columns.includes(colKey));
        const label = `J${formatLotteryNumber(row + 1)}-${colKey}`;

        guides.push({
          x: cx,
          y: cy,
          w: spec.markWidthMm,
          h: spec.markHeightMm,
          label: colKey,
          marked,
          panelIndex: 0,
        });

        if (marked) {
          marks.push({
            x: cx,
            y: cy,
            w: spec.markWidthMm,
            h: spec.markHeightMm,
            label,
            panelIndex: 0,
            category: 'loteca',
          });
        }
      }
    }

    return {
      cardX,
      cardY,
      cardWidth: spec.cardWidthMm,
      cardHeight: spec.cardHeightMm,
      marks,
      guides,
      panelHeaders,
    };
  }

  const gridNums = getSlipGridNumbers(gameId);
  const panelCountToRender = Math.max(1, activeBets.length);

  for (let p = 0; p < panelCountToRender; p++) {
    const bet = activeBets[p];
    const numSet = new Set(bet?.numbers ?? []);
    const panelTopY = cardY + spec.firstPanelTopMm + p * spec.panelSpacingMm;

    panelHeaders.push({
      x: cardX + spec.gridLeftMm,
      y: Number((panelTopY - 3.5).toFixed(2)),
      text: `JOGO ${p + 1}`,
    });

    gridNums.forEach((num, idx) => {
      const row = Math.floor(idx / game.gridCols);
      const col = idx % game.gridCols;
      const cx = Number((cardX + spec.gridLeftMm + col * spec.colPitchMm).toFixed(2));
      const cy = Number((panelTopY + row * spec.rowPitchMm).toFixed(2));
      const marked = numSet.has(num);
      const label = formatLotteryNumber(num, game.zeroPaddedDigits);

      guides.push({
        x: cx,
        y: cy,
        w: spec.markWidthMm,
        h: spec.markHeightMm,
        label,
        marked,
        panelIndex: p,
      });

      if (marked) {
        marks.push({
          x: cx,
          y: cy,
          w: spec.markWidthMm,
          h: spec.markHeightMm,
          label,
          panelIndex: p,
          category: 'number',
        });
      }
    });

    // +Milionária: Matriz de 6 Trevos abaixo de cada jogo
    if (game.hasClovers) {
      const cloverRowY = panelTopY + game.gridRows * spec.rowPitchMm + 4.5;
      const cloverSet = new Set(bet?.clovers ?? []);
      for (let t = 1; t <= 6; t++) {
        const cx = Number((cardX + spec.gridLeftMm + (t - 1) * 9.5).toFixed(2));
        const cy = Number(cloverRowY.toFixed(2));
        const marked = cloverSet.has(t);
        guides.push({
          x: cx,
          y: cy,
          w: spec.markWidthMm,
          h: spec.markHeightMm,
          label: `T${t}`,
          marked,
          panelIndex: p,
        });
        if (marked) {
          marks.push({
            x: cx,
            y: cy,
            w: spec.markWidthMm,
            h: spec.markHeightMm,
            label: `Trevo ${t}`,
            panelIndex: p,
            category: 'clover',
          });
        }
      }
    }
  }

  // Dia de Sorte: Matriz dos 12 Meses na parte inferior do volante (para o 1º jogo ativo)
  if (game.hasLuckyMonth) {
    const monthsBaseY = cardY + 136;
    const activeMonth = activeBets[0]?.luckyMonthIndex;
    panelHeaders.push({
      x: cardX + spec.gridLeftMm,
      y: Number((monthsBaseY - 3.5).toFixed(2)),
      text: 'MÊS DE SORTE',
    });
    for (let m = 0; m < 12; m++) {
      const row = Math.floor(m / 6);
      const col = m % 6;
      const cx = Number((cardX + spec.gridLeftMm + col * 11.2).toFixed(2));
      const cy = Number((monthsBaseY + row * 7.2).toFixed(2));
      const marked = activeMonth === m;
      guides.push({
        x: cx,
        y: cy,
        w: spec.markWidthMm,
        h: spec.markHeightMm,
        label: MONTHS_SHORT_PT_BR[m],
        marked,
        panelIndex: 0,
      });
      if (marked) {
        marks.push({
          x: cx,
          y: cy,
          w: spec.markWidthMm,
          h: spec.markHeightMm,
          label: MONTHS_SHORT_PT_BR[m],
          panelIndex: 0,
          category: 'month',
        });
      }
    }
  }

  // Timemania: Código do Time do Coração (01 a 80 em matriz compacta na base do volante)
  if (game.hasHeartTeam && activeBets[0]?.heartTeamIndex !== undefined) {
    const teamBaseY = cardY + 150;
    const teamCode = activeBets[0].heartTeamIndex + 1;
    const tensDigit = Math.floor(teamCode / 10); // 0..8
    const unitsDigit = teamCode % 10; // 0..9

    panelHeaders.push({
      x: cardX + spec.gridLeftMm,
      y: Number((teamBaseY - 3.5).toFixed(2)),
      text: `TIME DO CORAÇÃO (${formatLotteryNumber(teamCode)})`,
    });

    // Dezena (0..8) e Unidade (0..9) do código óptico do Time do Coração
    for (let d = 0; d <= 9; d++) {
      const cx = Number((cardX + spec.gridLeftMm + d * spec.colPitchMm).toFixed(2));
      // Linha dezena
      if (d <= 8) {
        const cyTens = Number(teamBaseY.toFixed(2));
        const markedTens = d === tensDigit;
        guides.push({
          x: cx,
          y: cyTens,
          w: spec.markWidthMm,
          h: spec.markHeightMm,
          label: `D${d}`,
          marked: markedTens,
          panelIndex: 0,
        });
        if (markedTens) {
          marks.push({
            x: cx,
            y: cyTens,
            w: spec.markWidthMm,
            h: spec.markHeightMm,
            label: `Time Dezena ${d}`,
            panelIndex: 0,
            category: 'team',
          });
        }
      }
      // Linha unidade
      const cyUnits = Number((teamBaseY + 6.5).toFixed(2));
      const markedUnits = d === unitsDigit;
      guides.push({
        x: cx,
        y: cyUnits,
        w: spec.markWidthMm,
        h: spec.markHeightMm,
        label: `U${d}`,
        marked: markedUnits,
        panelIndex: 0,
      });
      if (markedUnits) {
        marks.push({
          x: cx,
          y: cyUnits,
          w: spec.markWidthMm,
          h: spec.markHeightMm,
          label: `Time Unidade ${d}`,
          panelIndex: 0,
          category: 'team',
        });
      }
    }
  }

  return {
    cardX,
    cardY,
    cardWidth: spec.cardWidthMm,
    cardHeight: spec.cardHeightMm,
    marks,
    guides,
    panelHeaders,
  };
}
