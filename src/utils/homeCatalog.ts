export type HomeGameCardId =
  | 'loterias'
  | 'bingo'
  | 'roleta-russa'
  | 'baralho-bks'
  | 'memoria';

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
  {
    id: 'baralho-bks',
    title: 'BARALHO BKS',
    subtitle: '32 cartas com flip 3D',
    description:
      'Mesa minimalista em feltro escuro com 32 cartas viradas para baixo, animação 3D, visualização em tela cheia, embaralhamento fluido e personalização local.',
    accentColor: '#6B1218',
    keywords: [
      'baralho',
      'bks',
      'baralho bks',
      'cartas',
      'carta',
      'mesa',
      'flip',
      '3d',
      'embaralhar',
      'copas',
      'ouros',
      'espadas',
      'paus',
      '32 cartas',
    ],
    subActions: [{ id: 'baralho-abrir', label: 'Abrir Baralho' }],
  },
  {
    id: 'memoria',
    title: 'Jogo da Memória',
    subtitle: 'Até 16 pares · 32 cartas',
    description:
      'Cadastre participantes, adicione quantas figuras quiser e dispute quem encontra mais pares com revelação inicial de 4s, flip 3D e placar ao vivo.',
    accentColor: '#1D4ED8',
    keywords: [
      'memoria',
      'jogo da memoria',
      'pares',
      'figuras',
      'participantes',
      'cartas',
      'campeao',
      'flip',
      '16 pares',
      '32 cartas',
    ],
    subActions: [{ id: 'memoria-abrir', label: 'Abrir Memória' }],
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
