import { jsPDF } from 'jspdf';
import { getLotteryGameById, LotteryGameId } from '../data/lotteryGames';
import { formatLotteryNumber, GeneratedBet } from './lotteryEngine';
import {
  BINGO_CARD_PER_COLUMN,
  BINGO_CARD_TOTAL_NUMBERS,
  buildBingoCardColumns,
  formatBingoNumber,
  isBingoCardComplete,
  normalizeBingoGameNumber,
} from './bingoEngine';
import {
  A4_WIDTH_MM,
  buildMultiGameSlipPages,
  buildSummarySheetPages,
  computeSlipLayout,
  DEFAULT_SLIP_CALIBRATION,
  PdfExportMode,
  SlipCalibration,
  SlipPageGroup,
} from './slipGeometry';

export interface PdfExportParams {
  gameId: LotteryGameId;
  bets: GeneratedBet[];
  mode: PdfExportMode;
  calibration?: SlipCalibration;
}

export interface AllGamesPdfExportParams {
  bets: GeneratedBet[];
  mode: PdfExportMode;
  calibrationByGame?: Partial<Record<LotteryGameId, SlipCalibration>>;
  fallbackCalibration?: SlipCalibration;
}

function sanitizeFilenameSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function renderSlipPage(
  doc: jsPDF,
  page: SlipPageGroup,
  mode: 'original-slip' | 'test-grid',
  calibration: SlipCalibration,
  globalPageIndex: number,
  globalPageTotal: number
): void {
  const game = getLotteryGameById(page.gameId);
  const layout = computeSlipLayout(page.gameId, page.bets, calibration);

  if (mode === 'test-grid') {
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.35);
    doc.setLineDashPattern([2, 1.5], 0);
    doc.rect(layout.cardX, layout.cardY, layout.cardWidth, layout.cardHeight);
    doc.setLineDashPattern([], 0);

    // Corner alignment crosshairs outside card
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.25);
    const tick = 4;
    doc.line(layout.cardX - tick, layout.cardY, layout.cardX - 1, layout.cardY);
    doc.line(layout.cardX, layout.cardY - tick, layout.cardX, layout.cardY - 1);
    doc.line(
      layout.cardX + layout.cardWidth + 1,
      layout.cardY,
      layout.cardX + layout.cardWidth + tick,
      layout.cardY
    );
    doc.line(
      layout.cardX + layout.cardWidth,
      layout.cardY - tick,
      layout.cardX + layout.cardWidth,
      layout.cardY - 1
    );

    // Slip header label inside card top area
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const pageTag =
      page.gameSlipTotal > 1
        ? ` (VOLANTE ${page.gameSlipIndex + 1}/${page.gameSlipTotal})`
        : '';
    doc.text(
      `GABARITO 1:1 — ${game.name.toUpperCase()}${pageTag}`,
      layout.cardX + layout.cardWidth / 2,
      layout.cardY + 11,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Bandeja: ${calibration.trayAlignment.toUpperCase()} | Ajuste X: ${calibration.offsetXMm.toFixed(1)}mm | Y: ${calibration.offsetYMm.toFixed(1)}mm`,
      layout.cardX + layout.cardWidth / 2,
      layout.cardY + 16,
      { align: 'center' }
    );
    doc.text(
      'Imprima em TAMANHO REAL (100%) e sobreponha o volante oficial contra a luz.',
      layout.cardX + layout.cardWidth / 2,
      layout.cardY + 21,
      { align: 'center' }
    );

    // Panel headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    layout.panelHeaders.forEach((ph) => {
      doc.text(ph.text, ph.x, ph.y);
    });

    // Draw all guide rectangles & labels
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    layout.guides.forEach((cell) => {
      if (cell.marked) {
        doc.setFillColor(0, 0, 0);
        doc.rect(cell.x, cell.y, cell.w, cell.h, 'F');
      } else {
        doc.setDrawColor(180, 190, 204);
        doc.setLineWidth(0.2);
        doc.rect(cell.x, cell.y, cell.w, cell.h, 'S');
        doc.setTextColor(120, 130, 145);
        doc.text(cell.label, cell.x + cell.w / 2, cell.y + cell.h - 0.65, {
          align: 'center',
        });
      }
    });

    // Footer instruction below the slip area on A4
    const footerY = Math.min(282, layout.cardY + layout.cardHeight + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Conferência — ${game.name} (Página ${globalPageIndex + 1}/${globalPageTotal}):`,
      15,
      footerY
    );
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    page.bets.forEach((bet, idx) => {
      const y = footerY + 6 + idx * 9;
      if (y > 290) return;
      const summary = formatShortBetLine(bet, idx + 1);
      const wrapped = doc.splitTextToSize(summary, A4_WIDTH_MM - 30);
      doc.text(wrapped.slice(0, 2), 15, y);
    });
  } else {
    // Mode: 'original-slip' — ONLY pure solid-black optical reader marks!
    doc.setFillColor(0, 0, 0);
    layout.marks.forEach((mark) => {
      doc.rect(mark.x, mark.y, mark.w, mark.h, 'F');
    });
  }
}

export function buildLotteryPdfDocument({
  gameId,
  bets,
  mode,
  calibration = DEFAULT_SLIP_CALIBRATION,
}: PdfExportParams): jsPDF {
  return buildAllGamesPdfDocument({
    bets: bets.filter((b) => b.gameId === gameId),
    mode,
    calibrationByGame: { [gameId]: calibration },
    fallbackCalibration: calibration,
  });
}

export function buildAllGamesPdfDocument({
  bets,
  mode,
  calibrationByGame = {},
  fallbackCalibration = DEFAULT_SLIP_CALIBRATION,
}: AllGamesPdfExportParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (mode === 'summary-sheet') {
    renderMultiGameSummarySheet(doc, bets);
    return doc;
  }

  const pages = buildMultiGameSlipPages(bets);
  pages.forEach((page, idx) => {
    if (idx > 0) {
      doc.addPage();
    }
    const cal = calibrationByGame[page.gameId] ?? fallbackCalibration;
    renderSlipPage(doc, page, mode, cal, idx, pages.length);
  });

  return doc;
}

function formatShortBetLine(bet: GeneratedBet, index: number): string {
  const game = getLotteryGameById(bet.gameId);
  if (game.kind === 'loteca' && bet.lotecaMatches) {
    const seq = bet.lotecaMatches
      .map((m) => `J${m.matchNumber}:${m.columns.join('')}`)
      .join(' ');
    return `Jogo ${index} (${bet.seedFingerprint}): ${seq}`;
  }
  const nums = bet.numbers
    .map((n) => formatLotteryNumber(n, game.zeroPaddedDigits))
    .join(' ');
  const extraParts: string[] = [];
  if (bet.clovers?.length) extraParts.push(`Trevos: ${bet.clovers.join(', ')}`);
  if (bet.luckyMonthName) extraParts.push(`Mês: ${bet.luckyMonthName}`);
  if (bet.heartTeamName) {
    extraParts.push(
      `Time: ${formatLotteryNumber((bet.heartTeamIndex ?? 0) + 1)} ${bet.heartTeamName}`
    );
  }
  const extraStr = extraParts.length ? ` | ${extraParts.join(' | ')}` : '';
  return `Jogo ${index} [${bet.seedFingerprint}]: ${nums}${extraStr}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [15, 23, 42];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [
    Number.isFinite(r) ? r : 15,
    Number.isFinite(g) ? g : 23,
    Number.isFinite(b) ? b : 42,
  ];
}

function renderMultiGameSummarySheet(doc: jsPDF, bets: GeneratedBet[]): void {
  const pages = buildSummarySheetPages(bets);
  const totalPages = Math.max(1, pages.length);
  const uniqueGames = new Set(bets.map((b) => b.gameId));
  const generatedAt = new Date().toLocaleString('pt-BR');

  const drawFooter = (pageNum: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(16, 281, 194, 281);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Gerador de Números de Loteria · Lista para conferência (nome do jogo, frase e números).',
      16,
      286
    );
    doc.text(`Folha ${pageNum} de ${totalPages}`, 194, 286, { align: 'right' });
  };

  pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    let cursorY = 18;

    if (pageIdx === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      const title =
        uniqueGames.size === 1 && bets[0]
          ? `Apostas — ${getLotteryGameById(bets[0].gameId).name} (${bets.length})`
          : `Todos os Jogos (${bets.length} ${bets.length === 1 ? 'aposta' : 'apostas'})`;
      doc.text(title, 16, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `${uniqueGames.size} ${uniqueGames.size === 1 ? 'modalidade' : 'modalidades'} · Gerado em ${generatedAt}`,
        16,
        cursorY + 5.5
      );

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.45);
      doc.line(16, cursorY + 9, 194, cursorY + 9);
      cursorY += 16;
    }

    page.entries.forEach((entry) => {
      const [r, g, b] = hexToRgb(entry.accentColor);
      const entryStartY = cursorY;

      // Game name header (always visible per entry)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(r, g, b);
      doc.text(`${entry.index}. ${entry.gameName}`, 20, cursorY);
      cursorY += 4.8;

      // Phrase used
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(71, 85, 105);
      const phraseLines: string[] = doc.splitTextToSize(
        `Frase: "${entry.phrase}"`,
        172
      );
      doc.text(phraseLines, 20, cursorY);
      cursorY += phraseLines.length * 4.2 + 1.2;

      // Numbers (or Loteca predictions)
      if (entry.lotecaLines && entry.lotecaLines.length > 0) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(15, 23, 42);
        entry.lotecaLines.forEach((line) => {
          doc.text(line, 20, cursorY);
          cursorY += 4.3;
        });
      } else {
        doc.setFont('courier', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        const numLines: string[] = doc.splitTextToSize(entry.numbersText, 172);
        doc.text(numLines, 20, cursorY);
        cursorY += numLines.length * 5.2;

        if (entry.extrasText) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.8);
          doc.setTextColor(30, 41, 59);
          doc.text(entry.extrasText, 20, cursorY + 0.5);
          cursorY += 4.8;
        }
      }

      // Subtle left accent bar spanning the entry height
      const barTop = entryStartY - 3.4;
      const barHeight = Math.max(10, cursorY - barTop - 0.8);
      doc.setFillColor(r, g, b);
      doc.rect(16, barTop, 1.4, barHeight, 'F');

      // Separator line between entries
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(16, cursorY + 1.5, 194, cursorY + 1.5);
      cursorY += 6.5;
    });

    drawFooter(pageIdx + 1);
  });
}

export function downloadLotteryPdf(params: PdfExportParams): string {
  const doc = buildLotteryPdfDocument(params);
  const gameSlug = sanitizeFilenameSegment(params.gameId);
  const modeSlug =
    params.mode === 'original-slip'
      ? 'volante-original'
      : params.mode === 'test-grid'
        ? 'gabarito-teste'
        : 'folha-unica';
  const fileName = `loteria-${gameSlug}-${modeSlug}.pdf`;
  doc.save(fileName);
  return fileName;
}

export function downloadAllGamesPdf(params: AllGamesPdfExportParams): string {
  const doc = buildAllGamesPdfDocument(params);
  const modeSlug =
    params.mode === 'original-slip'
      ? 'volantes-originais'
      : params.mode === 'test-grid'
        ? 'gabaritos-teste'
        : 'folha-unica';
  const fileName = `loteria-todos-os-jogos-${modeSlug}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Generates a clean, high-contrast printable A4 landscape Bingo card PDF
 * with 10 decade columns (01–09 to 90–99), the 5 chosen numbers per column,
 * and the reference of the upcoming game number.
 */
export function buildBingoCardPdfDocument(
  selectedNumbers: number[],
  gameNumber: number = 1
): jsPDF {
  if (!isBingoCardComplete(selectedNumbers)) {
    throw new Error(
      `Selecione exatamente ${BINGO_CARD_PER_COLUMN} números em cada coluna (${BINGO_CARD_TOTAL_NUMBERS} no total).`
    );
  }

  const safeGameNumber = normalizeBingoGameNumber(gameNumber);
  const columns = buildBingoCardColumns(selectedNumbers);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const cardMarginX = 16;
  const cardMarginY = 16;
  const cardW = pageWidth - cardMarginX * 2; // 265mm
  const cardH = pageHeight - cardMarginY * 2; // 178mm

  // Outer printable cut guide frame
  doc.setDrawColor(15, 81, 50); // Emerald #0F5132
  doc.setLineWidth(1.1);
  doc.roundedRect(cardMarginX, cardMarginY, cardW, cardH, 4, 4, 'S');

  // Header band inside card
  const headerH = 22;
  doc.setFillColor(15, 81, 50);
  doc.roundedRect(cardMarginX, cardMarginY, cardW, headerH, 4, 4, 'F');
  // Square off bottom corners of header band
  doc.rect(cardMarginX, cardMarginY + headerH - 4, cardW, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `CARTÃO DE BINGO — JOGO #${safeGameNumber}`,
    cardMarginX + 8,
    cardMarginY + 11.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text(
    `BRINQUE COM JOGOS · Válido para o Jogo #${safeGameNumber} · 5 números por coluna (50 números)`,
    cardMarginX + 8,
    cardMarginY + 17.5
  );

  // Game number, card code & date on the right side of header
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const cardCode = selectedNumbers
    .reduce((acc, n, i) => (acc * 31 + n * (i + 7) + safeGameNumber) >>> 0, 17)
    .toString(36)
    .toUpperCase()
    .slice(0, 6)
    .padStart(6, '0');

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(253, 224, 71);
  doc.text(
    `JOGO #${safeGameNumber} · CARTÃO #${cardCode}`,
    cardMarginX + cardW - 8,
    cardMarginY + 11,
    { align: 'right' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(dateStr, cardMarginX + cardW - 8, cardMarginY + 17, { align: 'right' });

  // 10-column x 5-row Bingo Grid
  const gridPaddingX = 8;
  const gridTopY = cardMarginY + headerH + 8;
  const gridW = cardW - gridPaddingX * 2; // 249mm
  const colW = gridW / columns.length; // 24.9mm per column
  const colHeaderH = 11;
  const rowH = 22.5;
  const gridTotalH = colHeaderH + rowH * BINGO_CARD_PER_COLUMN; // 123.5mm

  // Draw column headers & cells
  columns.forEach((col, colIdx) => {
    const x = cardMarginX + gridPaddingX + colIdx * colW;

    // Decade column header cell
    doc.setFillColor(236, 253, 245); // Soft emerald tint
    doc.setDrawColor(15, 81, 50);
    doc.setLineWidth(0.5);
    doc.rect(x, gridTopY, colW, colHeaderH, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 81, 50);
    doc.text(col.label, x + colW / 2, gridTopY + 7.2, { align: 'center' });

    // 5 selected numbers in this column
    col.numbers.forEach((num, rowIdx) => {
      const y = gridTopY + colHeaderH + rowIdx * rowH;

      doc.setFillColor(
        rowIdx % 2 === 1 ? 248 : 255,
        rowIdx % 2 === 1 ? 250 : 255,
        rowIdx % 2 === 1 ? 252 : 255
      );
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.45);
      doc.rect(x, y, colW, rowH, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(formatBingoNumber(num), x + colW / 2, y + rowH / 2 + 2.6, {
        align: 'center',
      });
    });
  });

  // Crisp outer border around the full 10x5 grid
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.75);
  doc.rect(cardMarginX + gridPaddingX, gridTopY, gridW, gridTotalH, 'S');

  // Bottom player info line with pre-filled game reference
  const footerY = gridTopY + gridTotalH + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Jogador(a):', cardMarginX + gridPaddingX, footerY);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.line(
    cardMarginX + gridPaddingX + 23,
    footerY + 0.8,
    cardMarginX + 150,
    footerY + 0.8
  );

  doc.setTextColor(15, 81, 50);
  doc.text(`Referência: Jogo #${safeGameNumber}`, cardMarginX + 162, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Marque os números sorteados',
    cardMarginX + cardW - gridPaddingX,
    footerY,
    { align: 'right' }
  );

  return doc;
}

export function downloadBingoCardPdf(
  selectedNumbers: number[],
  gameNumber: number = 1
): string {
  const safeGameNumber = normalizeBingoGameNumber(gameNumber);
  const doc = buildBingoCardPdfDocument(selectedNumbers, safeGameNumber);
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `cartao-bingo-jogo-${safeGameNumber}-${stamp}.pdf`;
  doc.save(fileName);
  return fileName;
}
