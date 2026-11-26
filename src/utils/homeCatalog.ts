export type HomeGameCardId = 'loterias' | 'bingo' | 'roleta-russa';

export interface HomeGameSubAction {
  id: string;
  label: string;
}

export interface HomeGameCard {
  id: HomeGameCardId;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  keywords: string[];
  subActions: HomeGameSubAction[];
}

export const HOME_GAME_CARDS: HomeGameCard[] = [
  {
    id: 'loterias',
    title: 'Gerador de Loterias',
    subtitle: '8 modalidades oficiais',
    description:
      'Gere jogos por frase da sorte para Mega-Sena, Quina, Lotofácil, Loteca, Lotomania, Timemania, Dia de Sorte e +Milionária com impressão em PDF.',
    accentColor: '#0F5132',
    keywords: [
      'loteria',
      'loterias',
      'gerador',
      'mega-sena',
      'mega sena',
      'quina',
      'lotofacil',
      'loteca',
      'lotomania',
      'timemania',
      'dia de sorte',
      'milionaria',
      '+milionaria',
      'volante',
      'pdf',
      'historico',
      'apostas',
      'caixa',
    ],
    subActions: [
      { id: 'jogos', label: 'Jogos' },
      { id: 'gerador', label: 'Gerador' },
      { id: 'volante', label: 'Volante' },
      { id: 'historico', label: 'Histórico' },
    ],
  },
  {
    id: 'bingo',
    title: 'Bingo',
    subtitle: 'Números de 1 a 99',
    description:
      'Roleta animada com bolas girando, destaque da bola retirada e tabuleiro completo organizado em colunas por dezena (01–09 até 90–99).',
    accentColor: '#15803D',
    keywords: [
      'bingo',
      'bolas',
      'tabuleiro',
      'dezena',
      'dezenas',
      'sorteio',
      'roleta',
      'ganhador',
      '1 a 99',
      'cartela',
    ],
    subActions: [{ id: 'bingo-jogar', label: 'Abrir Bingo' }],
  },
  {
    id: 'roleta-russa',
    title: 'Roleta da Sorte',
    subtitle: 'Cartões de 1 a 60',
    description:
      'Cadastre prêmios nos cartões de 1 a 60 e gire a roleta por 8 segundos para sortear 2 números, escolher um e revelar o cartão premiado.',
    accentColor: '#B91C1C',
    keywords: [
      'roleta',
      'roleta da sorte',
      'sorte',
      'premios',
      'premio',
      'cadastro',
      'cartoes',
      'cartao',
      'sorteios',
      'sorteio',
      '1 a 60',
      '8 segundos',
    ],
    subActions: [
      { id: 'sorteio', label: 'Sorteios' },
      { id: 'cadastro', label: 'Cadastro de Prêmios' },
    ],
  },
];

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterHomeGameCards(
  query: string,
  cards: HomeGameCard[] = HOME_GAME_CARDS
): HomeGameCard[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return cards;

  const indexed = cards.map((card) => ({
    card,
    haystack: normalizeSearchText(
      [
        card.title,
        card.subtitle,
        card.description,
        ...card.keywords,
        ...card.subActions.map((s) => s.label),
      ].join(' ')
    ),
  }));

  const exactPhraseMatches = indexed
    .filter(({ haystack }) => haystack.includes(normalized))
    .map(({ card }) => card);

  if (exactPhraseMatches.length > 0) {
    return exactPhraseMatches;
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  return indexed
    .filter(({ haystack }) => tokens.every((token) => haystack.includes(token)))
    .map(({ card }) => card);
}
