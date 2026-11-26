export type BksCardSuit = 'copas' | 'ouros' | 'espadas' | 'paus';

export interface BksCardDefinition {
  id: number;
  suit: BksCardSuit;
  suitLabel: string;
  suitSymbol: string;
  title: string;
  defaultImage: string;
}

export const BKS_DECK_SIZE = 32;

export const BKS_DEFAULT_BACK_IMAGE =
  '/assets/aistudio/00_verso_baralho_76ad9df4.png';

export const BKS_DEFAULT_CARDS: readonly BksCardDefinition[] = [
  {
    id: 1,
    suit: 'copas',
    suitLabel: 'Copas',
    suitSymbol: '♥',
    title: 'O Abraço de Lótus',
    defaultImage: '/assets/aistudio/01_copas_o_abraco_de_lotus_349139e1.png',
  },
  {
    id: 2,
    suit: 'copas',
    suitLabel: 'Copas',
    suitSymbol: '♥',
    title: 'A Conchinha Clássica',
    defaultImage: '/assets/aistudio/02_copas_a_conchinha_classica_0ef3c096.png',
  },
  {
    id: 3,
    suit: 'copas',
    suitLabel: 'Copas',
    suitSymbol: '♥',
    title: 'O Espelho Sentado',
    defaultImage: '/assets/aistudio/03_copas_o_espelho_sentado_ad5f50ae.png',
  },
  {
    id: 4,
    suit: 'copas',
    suitLabel: 'Copas',
    suitSymbol: '♥',
    title: 'A Onda Suave',
    defaultImage: '/assets/aistudio/04_copas_a_onda_suave_e6c92319.png',
  },
  {
    id: 5,
    suit: 'copas',
    suitLabel: 'Copas',
    suitSymbol: '♥',
    title: 'O Enlaço Lateral',
    defaultImage: '/assets/aistudio/05_copas_o_enlaco_lateral_c1f1c9c7.png',
  },
  {
    id: 6,
    suit: 'copas',
    suitLabel: 'Copas',
    suitSymbol: '♥',
    title: 'A Cadeira Real',
    defaultImage: '/assets/aistudio/06_copas_a_cadeira_real_855c6fa4.png',
  },
  {
    id: 7,
    suit: 'copas',
    suitLabel: 'Copas',
    suitSymbol: '♥',
    title: 'O Berço',
    defaultImage: '/assets/aistudio/07_copas_o_berco_2dd8d782.png',
  },
  {
    id: 8,
    suit: 'copas',
    suitLabel: 'Copas',
    suitSymbol: '♥',
    title: 'A Fusão',
    defaultImage: '/assets/aistudio/08_copas_a_fusao_5db2a291.png',
  },
  {
    id: 9,
    suit: 'ouros',
    suitLabel: 'Ouros',
    suitSymbol: '♦',
    title: 'A Amazona',
    defaultImage: '/assets/aistudio/09_ouros_a_amazona_811e0c7d.png',
  },
  {
    id: 10,
    suit: 'ouros',
    suitLabel: 'Ouros',
    suitSymbol: '♦',
    title: 'A Amazona Invertida',
    defaultImage: '/assets/aistudio/10_ouros_a_amazona_invertida_161f93bb.png',
  },
  {
    id: 11,
    suit: 'ouros',
    suitLabel: 'Ouros',
    suitSymbol: '♦',
    title: 'A Beira da Cama',
    defaultImage: '/assets/aistudio/11_ouros_a_beira_da_cama_2f8ce762.png',
  },
  {
    id: 12,
    suit: 'ouros',
    suitLabel: 'Ouros',
    suitSymbol: '♦',
    title: 'O Triângulo Elevado',
    defaultImage: '/assets/aistudio/12_ouros_o_triangulo_elevado_4aaedf24.png',
  },
  {
    id: 13,
    suit: 'ouros',
    suitLabel: 'Ouros',
    suitSymbol: '♦',
    title: 'A Tesoura Aberta',
    defaultImage: '/assets/aistudio/13_ouros_a_tesoura_aberta_2f937446.png',
  },
  {
    id: 14,
    suit: 'ouros',
    suitLabel: 'Ouros',
    suitSymbol: '♦',
    title: 'O Trono Invertido',
    defaultImage: '/assets/aistudio/14_ouros_o_trono_invertido_0b45b903.png',
  },
  {
    id: 15,
    suit: 'ouros',
    suitLabel: 'Ouros',
    suitSymbol: '♦',
    title: 'A Borboleta',
    defaultImage: '/assets/aistudio/15_ouros_a_borboleta_6b1d8cdc.png',
  },
  {
    id: 16,
    suit: 'ouros',
    suitLabel: 'Ouros',
    suitSymbol: '♦',
    title: 'O Balanço',
    defaultImage: '/assets/aistudio/16_ouros_o_balanco_ef88ac3b.png',
  },
  {
    id: 17,
    suit: 'espadas',
    suitLabel: 'Espadas',
    suitSymbol: '♠',
    title: 'O Estilo Cão',
    defaultImage: '/assets/aistudio/17_espadas_o_estilo_cao_c2f84a01.png',
  },
  {
    id: 18,
    suit: 'espadas',
    suitLabel: 'Espadas',
    suitSymbol: '♠',
    title: 'O Mergulho',
    defaultImage: '/assets/aistudio/18_espadas_o_mergulho_c6de2459.png',
  },
  {
    id: 19,
    suit: 'espadas',
    suitLabel: 'Espadas',
    suitSymbol: '♠',
    title: 'A Ponte de Apoio',
    defaultImage: '/assets/aistudio/19_espadas_a_ponte_de_apoio_8cbf40fd.png',
  },
  {
    id: 20,
    suit: 'espadas',
    suitLabel: 'Espadas',
    suitSymbol: '♠',
    title: 'O Arado',
    defaultImage: '/assets/aistudio/20_espadas_o_arado_82ea6c55.png',
  },
  {
    id: 21,
    suit: 'espadas',
    suitLabel: 'Espadas',
    suitSymbol: '♠',
    title: 'A Parede',
    defaultImage: '/assets/aistudio/21_espadas_a_parede_3158db42.png',
  },
  {
    id: 22,
    suit: 'espadas',
    suitLabel: 'Espadas',
    suitSymbol: '♠',
    title: 'O Gancho',
    defaultImage: '/assets/aistudio/22_espadas_o_gancho_05bc1ad9.png',
  },
  {
    id: 23,
    suit: 'espadas',
    suitLabel: 'Espadas',
    suitSymbol: '♠',
    title: 'O Salto',
    defaultImage: '/assets/aistudio/23_espadas_o_salto_6a50ba86.png',
  },
  {
    id: 24,
    suit: 'espadas',
    suitLabel: 'Espadas',
    suitSymbol: '♠',
    title: 'A Serra',
    defaultImage: '/assets/aistudio/24_espadas_a_serra_427897b6.png',
  },
  {
    id: 25,
    suit: 'paus',
    suitLabel: 'Paus',
    suitSymbol: '♣',
    title: 'O Carrinho de Mão',
    defaultImage: '/assets/aistudio/25_paus_o_carrinho_de_mao_7ed17fc1.png',
  },
  {
    id: 26,
    suit: 'paus',
    suitLabel: 'Paus',
    suitSymbol: '♣',
    title: 'A Suspensão',
    defaultImage: '/assets/aistudio/26_paus_a_suspensao_b9b414f1.png',
  },
  {
    id: 27,
    suit: 'paus',
    suitLabel: 'Paus',
    suitSymbol: '♣',
    title: 'O Arco',
    defaultImage: '/assets/aistudio/27_paus_o_arco_ee38a6ff.png',
  },
  {
    id: 28,
    suit: 'paus',
    suitLabel: 'Paus',
    suitSymbol: '♣',
    title: 'A Estrela',
    defaultImage: '/assets/aistudio/28_paus_a_estrela_ff83826e.png',
  },
  {
    id: 29,
    suit: 'paus',
    suitLabel: 'Paus',
    suitSymbol: '♣',
    title: 'O Giro',
    defaultImage: '/assets/aistudio/29_paus_o_giro_65534cd5.png',
  },
  {
    id: 30,
    suit: 'paus',
    suitLabel: 'Paus',
    suitSymbol: '♣',
    title: 'A Mesa',
    defaultImage: '/assets/aistudio/30_paus_a_mesa_02a6c011.png',
  },
  {
    id: 31,
    suit: 'paus',
    suitLabel: 'Paus',
    suitSymbol: '♣',
    title: 'O Xis',
    defaultImage: '/assets/aistudio/31_paus_o_xis_fdcd1a07.png',
  },
  {
    id: 32,
    suit: 'paus',
    suitLabel: 'Paus',
    suitSymbol: '♣',
    title: 'O Trapézio',
    defaultImage: '/assets/aistudio/32_paus_o_trapezio_6283f916.png',
  },
];

export function createInitialBksDeck(): BksCardDefinition[] {
  return [...BKS_DEFAULT_CARDS];
}

export function shuffleBksDeck(
  cards: readonly BksCardDefinition[],
  randomFn: () => number = Math.random
): BksCardDefinition[] {
  const result = [...cards];
  if (result.length <= 1) return result;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  // Ensure shuffle never produces the exact same sequence as before
  const isUnchanged = result.every((card, index) => card.id === cards[index].id);
  if (isUnchanged) {
    [result[0], result[result.length - 1]] = [
      result[result.length - 1],
      result[0],
    ];
  }

  return result;
}

export function flipBksCardUp(
  flippedIds: readonly number[],
  cardId: number
): number[] {
  if (flippedIds.includes(cardId)) {
    return [...flippedIds];
  }
  return [...flippedIds, cardId];
}

export function resetAllBksCardsFlipped(): number[] {
  return [];
}

function extractLeadingNumber(name: string): number | null {
  const match = name.trim().match(/^(\d+)/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function sortUploadedCardFiles<T extends { name: string }>(
  files: readonly T[]
): T[] {
  return [...files].sort((a, b) => {
    const numA = extractLeadingNumber(a.name);
    const numB = extractLeadingNumber(b.name);
    if (numA !== null && numB !== null && numA !== numB) {
      return numA - numB;
    }
    return a.name.localeCompare(b.name, 'pt-BR', {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

export function resolveBksCardFrontSrc(
  card: BksCardDefinition,
  customFronts: Readonly<Record<number, string>>,
  usePlaceholdersOnly = false
): string | null {
  const custom = customFronts[card.id];
  if (custom) return custom;
  if (usePlaceholdersOnly) return null;
  return card.defaultImage || null;
}

export function resolveBksBackSrc(
  customBack: string | null,
  usePlaceholdersOnly = false
): string | null {
  if (customBack) return customBack;
  if (usePlaceholdersOnly) return null;
  return BKS_DEFAULT_BACK_IMAGE || null;
}

export function formatBksCardNumber(id: number): string {
  return String(id).padStart(2, '0');
}

export const BKS_GRID_COLUMNS = 8;
export const BKS_GRID_ROWS = 4;
export const BKS_CARD_ASPECT_RATIO = 5 / 7;

export interface BksGridLayoutMetrics {
  columns: number;
  rows: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  totalWidth: number;
  totalHeight: number;
}

/**
 * Computes the maximum card width/height that fits an exact 8x4 grid
 * strictly inside the available viewport container without overflow.
 */
export function computeBksGridMetrics(
  containerWidth: number,
  containerHeight: number,
  columns = BKS_GRID_COLUMNS,
  rows = BKS_GRID_ROWS,
  aspectRatio = BKS_CARD_ASPECT_RATIO
): BksGridLayoutMetrics {
  const safeW = Math.max(0, Math.floor(containerWidth));
  const safeH = Math.max(0, Math.floor(containerHeight));

  if (safeW === 0 || safeH === 0) {
    return {
      columns,
      rows,
      cardWidth: 0,
      cardHeight: 0,
      gap: 0,
      totalWidth: 0,
      totalHeight: 0,
    };
  }

  // Adaptive gap proportional to available space (tight on phones, comfortable on desktop)
  let gap = Math.max(3, Math.min(12, Math.floor(Math.min(safeW, safeH) * 0.015)));
  if (gap * (columns - 1) >= safeW * 0.25) {
    gap = Math.max(2, Math.floor((safeW * 0.12) / Math.max(1, columns - 1)));
  }
  if (gap * (rows - 1) >= safeH * 0.25) {
    gap = Math.max(2, Math.floor((safeH * 0.12) / Math.max(1, rows - 1)));
  }

  const availW = Math.max(columns, safeW - gap * (columns - 1));
  const availH = Math.max(rows, safeH - gap * (rows - 1));

  const maxCardWByWidth = availW / columns;
  const maxCardHByHeight = availH / rows;
  const maxCardWByHeight = maxCardHByHeight * aspectRatio;

  let cardWidth = Math.max(1, Math.floor(Math.min(maxCardWByWidth, maxCardWByHeight)));
  let cardHeight = Math.max(1, Math.floor(cardWidth / aspectRatio));

  // Clamp strictly in case rounding nudged height over available height
  if (cardHeight * rows + gap * (rows - 1) > safeH) {
    cardHeight = Math.max(1, Math.floor(availH / rows));
    cardWidth = Math.max(1, Math.floor(cardHeight * aspectRatio));
  }
  if (cardWidth * columns + gap * (columns - 1) > safeW) {
    cardWidth = Math.max(1, Math.floor(availW / columns));
    cardHeight = Math.max(1, Math.floor(cardWidth / aspectRatio));
  }

  return {
    columns,
    rows,
    cardWidth,
    cardHeight,
    gap,
    totalWidth: cardWidth * columns + gap * (columns - 1),
    totalHeight: cardHeight * rows + gap * (rows - 1),
  };
}
