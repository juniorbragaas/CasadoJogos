export type LotteryGameId =
  | 'mega-sena'
  | 'quina'
  | 'lotofacil'
  | 'loteca'
  | 'lotomania'
  | 'timemania'
  | 'dia-de-sorte'
  | 'mais-milionaria';

export interface LotteryGameConfig {
  id: LotteryGameId;
  name: string;
  shortRule: string;
  description: string;
  officialColor: string;
  accentText: string;
  softBg: string;
  borderTint: string;
  image: string;
  imagePosition?: string;
  kind: 'numbers' | 'loteca';
  minNumber: number;
  maxNumber: number;
  minPick: number;
  maxPick: number;
  defaultPick: number;
  fixedPick?: boolean;
  zeroPaddedDigits: number;
  gridRows: number;
  gridCols: number;
  /** Number ordering on official slip (Lotomania puts 00 at the end of 01..99) */
  zeroAtEnd?: boolean;
  maxBetsPerSlip: number;
  /** Extra official rule elements */
  hasClovers?: boolean;
  cloversMin?: number;
  cloversMax?: number;
  cloversDefault?: number;
  cloversPoolMax?: number;
  hasLuckyMonth?: boolean;
  hasHeartTeam?: boolean;
  /** Loteca specifics */
  matchCount?: number;
  defaultDuplos?: number;
  defaultTriplos?: number;
}

export const MONTHS_PT_BR: readonly string[] = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export const MONTHS_SHORT_PT_BR: readonly string[] = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
] as const;

/**
 * Lista oficial dos 80 clubes da Timemania (numerados de 01 a 80 conforme volante Caixa)
 */
export const TIMEMANIA_CLUBS: readonly string[] = [
  'ABC / RN',
  'ALTOS / PI',
  'AMÉRICA / MG',
  'AMÉRICA / RN',
  'APARECIDENSE / GO',
  'ATHLETIC CLUB / MG',
  'ATHLETICO / PR',
  'ATLÉTICO / CE',
  'ATLÉTICO / GO',
  'ATLÉTICO / MG',
  'AVAÍ / SC',
  'BAHIA / BA',
  'BOTAFOGO / PB',
  'BOTAFOGO / RJ',
  'BOTAFOGO / SP',
  'BRAGANTINO / SP',
  'BRASIL / RS',
  'BRASILIENSE / DF',
  'BRUSQUE / SC',
  'CAMPINENSE / PB',
  'CASCAVEL / PR',
  'CAXIAS / RS',
  'CEARÁ / CE',
  'CHAPECOENSE / SC',
  'CONFIANÇA / SE',
  'CORINTHIANS / SP',
  'CORITIBA / PR',
  'CRB / AL',
  'CRICIÚMA / SC',
  'CRUZEIRO / MG',
  'CSA / AL',
  'CUIABÁ / MT',
  'FERROVIÁRIA / SP',
  'FERROVIÁRIO / CE',
  'FIGUEIRENSE / SC',
  'FLAMENGO / RJ',
  'FLORESTA / CE',
  'FLUMINENSE / RJ',
  'FORTALEZA / CE',
  'GOIÁS / GO',
  'GRÊMIO / RS',
  'GUARANI / SP',
  'INTERNACIONAL / RS',
  'ITUANO / SP',
  'JACUIPENSE / BA',
  'JOINVILLE / SC',
  'JUAZEIRENSE / BA',
  'JUVENTUDE / RS',
  'LONDRINA / PR',
  'LUVERDENSE / MT',
  'MANAUS / AM',
  'MIRASSOL / SP',
  'MOTO CLUB / MA',
  'NÁUTICO / PE',
  'NOVORIZONTINO / SP',
  'OESTE / SP',
  'OPERÁRIO / PR',
  'PALMEIRAS / SP',
  'PARANÁ / PR',
  'PAYSANDU / PA',
  'PONTE PRETA / SP',
  'PORTUGUESA / RJ',
  'POUSO ALEGRE / MG',
  'REMO / PA',
  'RETRÔ / PE',
  'SAMPAIO CORRÊA / MA',
  'SANTA CRUZ / PE',
  'SANTOS / SP',
  'SÃO BERNARDO / SP',
  'SÃO JOSÉ / RS',
  'SÃO PAULO / SP',
  'SÃO RAIMUNDO / RR',
  'SPORT / PE',
  'TOMBENSE / MG',
  'TREZE / PB',
  'VASCO DA GAMA / RJ',
  'VILA NOVA / GO',
  'VITÓRIA / BA',
  'VOLTA REDONDA / RJ',
  'YPIRANGA / RS',
] as const;

export const INSPIRATION_PHRASES: readonly string[] = [
  'Prosperidade e paz para toda a família',
  'Sonho realizado em 2026 com muita saúde',
  'Sorte grande acompanhada de gratidão',
  'Viagem dos sonhos pelo litoral brasileiro',
  'Casa própria, alegria e novos caminhos',
  'Energia positiva no concurso desta semana',
] as const;

export const LOTTERY_GAMES: readonly LotteryGameConfig[] = [
  {
    id: 'mega-sena',
    name: 'Mega-Sena',
    shortRule: '01 a 60 · 6 a 20 dezenas',
    description:
      'Escolha de 6 a 20 dezenas entre os 60 números do volante. Prêmio principal para quem acerta as 6 dezenas sorteadas.',
    officialColor: '#209869',
    accentText: '#146C48',
    softBg: '#ECFDF5',
    borderTint: '#A7F3D0',
    image: '/assets/aistudio/game_megasena_66b173a9.jpg',
    imagePosition: 'object-top',
    kind: 'numbers',
    minNumber: 1,
    maxNumber: 60,
    minPick: 6,
    maxPick: 20,
    defaultPick: 6,
    zeroPaddedDigits: 2,
    gridRows: 6,
    gridCols: 10,
    maxBetsPerSlip: 3,
  },
  {
    id: 'quina',
    name: 'Quina',
    shortRule: '01 a 80 · 5 a 15 dezenas',
    description:
      'Marque de 5 a 15 números dentre os 80 disponíveis no volante. Premiação para 2, 3, 4 ou 5 acertos.',
    officialColor: '#260085',
    accentText: '#260085',
    softBg: '#EEF2FF',
    borderTint: '#C7D2FE',
    image: '/assets/aistudio/game_quina_4fea81cf.jpg',
    imagePosition: 'object-center',
    kind: 'numbers',
    minNumber: 1,
    maxNumber: 80,
    minPick: 5,
    maxPick: 15,
    defaultPick: 5,
    zeroPaddedDigits: 2,
    gridRows: 8,
    gridCols: 10,
    maxBetsPerSlip: 3,
  },
  {
    id: 'lotofacil',
    name: 'Lotofácil',
    shortRule: '01 a 25 · 15 a 20 dezenas',
    description:
      'Marque entre 15 e 20 números dentre os 25 disponíveis no volante. Ganha acertando de 11 a 15 números.',
    officialColor: '#930089',
    accentText: '#7A0071',
    softBg: '#FDF2F8',
    borderTint: '#F5D0FE',
    image: '/assets/aistudio/game_lotofacil_432ff2f4.jpg',
    imagePosition: 'object-top',
    kind: 'numbers',
    minNumber: 1,
    maxNumber: 25,
    minPick: 15,
    maxPick: 20,
    defaultPick: 15,
    zeroPaddedDigits: 2,
    gridRows: 5,
    gridCols: 5,
    maxBetsPerSlip: 3,
  },
  {
    id: 'loteca',
    name: 'Loteca',
    shortRule: '14 jogos · Coluna 1, Meio ou 2',
    description:
      'Dê seus palpites nos 14 jogos de futebol da rodada marcando Coluna 1, Meio (empate) ou Coluna 2, com no mínimo 1 duplo obrigatório.',
    officialColor: '#D9261C',
    accentText: '#B91C1C',
    softBg: '#FEF2F2',
    borderTint: '#FECACA',
    image: '/assets/aistudio/game_loteca_b3958c56.jpg',
    imagePosition: 'object-top',
    kind: 'loteca',
    minNumber: 1,
    maxNumber: 14,
    minPick: 14,
    maxPick: 14,
    defaultPick: 14,
    fixedPick: true,
    zeroPaddedDigits: 2,
    gridRows: 14,
    gridCols: 3,
    maxBetsPerSlip: 1,
    matchCount: 14,
    defaultDuplos: 1,
    defaultTriplos: 0,
  },
  {
    id: 'lotomania',
    name: 'Lotomania',
    shortRule: '00 a 99 · 50 dezenas fixas',
    description:
      'Escolha exatamente 50 números dentre os 100 disponíveis (01 a 99 e 00). Premiação para 15 a 20 acertos e também para zero acertos.',
    officialColor: '#E06D00',
    accentText: '#B45309',
    softBg: '#FFF7ED',
    borderTint: '#FED7AA',
    image: '/assets/aistudio/game_lotomania_253e389d.jpg',
    imagePosition: 'object-center',
    kind: 'numbers',
    minNumber: 0,
    maxNumber: 99,
    minPick: 50,
    maxPick: 50,
    defaultPick: 50,
    fixedPick: true,
    zeroPaddedDigits: 2,
    gridRows: 10,
    gridCols: 10,
    zeroAtEnd: true,
    maxBetsPerSlip: 2,
  },
  {
    id: 'timemania',
    name: 'Timemania',
    shortRule: '01 a 80 · 10 dezenas + Time',
    description:
      'Escolha exatamente 10 números dentre os 80 do volante e 1 Time do Coração entre os 80 clubes participantes.',
    officialColor: '#00873E',
    accentText: '#046A38',
    softBg: '#F0FDF4',
    borderTint: '#BBF7D0',
    image: '/assets/aistudio/game_timenania_777b91e0.jpg',
    imagePosition: 'object-center',
    kind: 'numbers',
    minNumber: 1,
    maxNumber: 80,
    minPick: 10,
    maxPick: 10,
    defaultPick: 10,
    fixedPick: true,
    zeroPaddedDigits: 2,
    gridRows: 8,
    gridCols: 10,
    maxBetsPerSlip: 2,
    hasHeartTeam: true,
  },
  {
    id: 'dia-de-sorte',
    name: 'Dia de Sorte',
    shortRule: '01 a 31 · 7 a 15 dezenas + Mês',
    description:
      'Escolha de 7 a 15 números dentre os 31 dias do mês e mais 1 Mês de Sorte para concorrer.',
    officialColor: '#B57014',
    accentText: '#92570B',
    softBg: '#FFFBEB',
    borderTint: '#FDE68A',
    image: '/assets/aistudio/game_diadesorte_b60f0f43.jpg',
    imagePosition: 'object-center',
    kind: 'numbers',
    minNumber: 1,
    maxNumber: 31,
    minPick: 7,
    maxPick: 15,
    defaultPick: 7,
    zeroPaddedDigits: 2,
    gridRows: 4,
    gridCols: 10,
    maxBetsPerSlip: 2,
    hasLuckyMonth: true,
  },
  {
    id: 'mais-milionaria',
    name: '+Milionária',
    shortRule: '01 a 50 · 6 a 12 dezenas + Trevos',
    description:
      'Duas matrizes oficiais: escolha de 6 a 12 números entre 01 e 50 e de 2 a 6 Trevos da Sorte entre 1 e 6.',
    officialColor: '#2E3078',
    accentText: '#232561',
    softBg: '#EFF6FF',
    borderTint: '#BFDBFE',
    image: '/assets/aistudio/game_milionaria_bc80b6b7.jpg',
    imagePosition: 'object-center',
    kind: 'numbers',
    minNumber: 1,
    maxNumber: 50,
    minPick: 6,
    maxPick: 12,
    defaultPick: 6,
    zeroPaddedDigits: 2,
    gridRows: 5,
    gridCols: 10,
    maxBetsPerSlip: 2,
    hasClovers: true,
    cloversMin: 2,
    cloversMax: 6,
    cloversDefault: 2,
    cloversPoolMax: 6,
  },
] as const;

export function getLotteryGameById(id: LotteryGameId): LotteryGameConfig {
  const found = LOTTERY_GAMES.find((g) => g.id === id);
  if (!found) {
    throw new Error(`Jogo de loteria desconhecido: ${id}`);
  }
  return found;
}
