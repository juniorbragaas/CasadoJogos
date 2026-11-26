import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterHomeGameCards,
  HOME_GAME_CARDS,
  normalizeSearchText,
} from './homeCatalog';

test('normalizeSearchText removes diacritics, trims, and lowercases text', () => {
  assert.equal(normalizeSearchText('  Lotofácil  Prêmios '), 'lotofacil  premios');
  assert.equal(normalizeSearchText('Roleta da Sorte'), 'roleta da sorte');
});

test('filterHomeGameCards returns all cards on empty query and matches accents/keywords accurately', () => {
  assert.equal(filterHomeGameCards('').length, HOME_GAME_CARDS.length);
  assert.equal(filterHomeGameCards('   ').length, HOME_GAME_CARDS.length);

  const megaMatch = filterHomeGameCards('mega-sena');
  assert.equal(megaMatch.length, 1);
  assert.equal(megaMatch[0].id, 'loterias');

  const lotofacilMatch = filterHomeGameCards('lotofacil');
  assert.equal(lotofacilMatch.length, 1);
  assert.equal(lotofacilMatch[0].id, 'loterias');

  const bingoMatch = filterHomeGameCards('bingo');
  assert.equal(bingoMatch.length, 1);
  assert.equal(bingoMatch[0].id, 'bingo');

  const roletaMatch = filterHomeGameCards('roleta da sorte');
  assert.equal(roletaMatch.length, 1);
  assert.equal(roletaMatch[0].id, 'roleta-russa');
  assert.equal(roletaMatch[0].title, 'Roleta da Sorte');

  const premiosMatch = filterHomeGameCards('premios');
  assert.equal(premiosMatch.length, 1);
  assert.equal(premiosMatch[0].id, 'roleta-russa');

  const bksMatch = filterHomeGameCards('baralho bks');
  assert.equal(bksMatch.length, 1);
  assert.equal(bksMatch[0].id, 'baralho-bks');
  assert.equal(bksMatch[0].title, 'BARALHO BKS');

  const bksShortMatch = filterHomeGameCards('bks');
  assert.equal(bksShortMatch.length, 1);
  assert.equal(bksShortMatch[0].id, 'baralho-bks');

  const noMatch = filterHomeGameCards('xadrez impossivel');
  assert.equal(noMatch.length, 0);
});
