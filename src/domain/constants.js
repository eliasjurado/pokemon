export const POKEMON_TYPES = Object.freeze([
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
]);

export const POKEMON_REGIONS = Object.freeze([
  'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos',
  'Alola', 'Galar', 'Paldea',
]);

export const TYPE_COLORS = Object.freeze({
  Normal: '#A8A77A', Fire: '#EE8130', Water: '#6390F0',
  Electric: '#F7D02C', Grass: '#7AC74C', Ice: '#96D9D6',
  Fighting: '#C22E28', Poison: '#A33EA1', Ground: '#E2BF65',
  Flying: '#A98FF3', Psychic: '#F95587', Bug: '#A6B91A',
  Rock: '#B6A136', Ghost: '#735797', Dragon: '#6F35FC',
  Dark: '#705746', Steel: '#B7B7CE', Fairy: '#D685AD',
});

export const ORIGINS = Object.freeze([
  { id: 'pokemon-1', label: 'Lámina 1' },
  { id: 'pokemon-2', label: 'Lámina 2' },
  { id: 'pokemon-3', label: 'Lámina 3' },
  { id: 'pokemon-4', label: 'Lámina 4' },
  { id: 'sheet5', label: 'Lámina 5' },
  { id: 'sheet6', label: 'Lámina 6' },
  { id: 'sheet7', label: 'Lámina 7' },
]);

export const STICKER_SOURCES = Object.freeze([
  { prefix: 'pokemon-1', originId: 'pokemon-1', count: 32 },
  { prefix: 'pokemon-2', originId: 'pokemon-2', count: 32 },
  { prefix: 'pokemon-3', originId: 'pokemon-3', count: 32 },
  { prefix: 'pokemon-4', originId: 'pokemon-4', count: 32 },
  { prefix: 'sheet5', originId: 'sheet5', count: 32 },
  { prefix: 'sheet6', originId: 'sheet6', count: 32 },
  { prefix: 'sheet7', originId: 'sheet7', count: 32 },
]);

export const KNOWN_POKEMON = Object.freeze({
  1:  { name: 'Pikachu', type: 'Electric', region: 'Kanto', hp: 60, attack: 55, defense: 40, speed: 90 },
  2:  { name: 'Charizard', type: 'Fire,Flying', region: 'Kanto', hp: 108, attack: 130, defense: 111, speed: 100 },
  3:  { name: 'Mewtwo', type: 'Psychic', region: 'Kanto', hp: 160, attack: 150, defense: 106, speed: 130 },
  4:  { name: 'Gengar', type: 'Ghost,Poison', region: 'Kanto', hp: 110, attack: 130, defense: 100, speed: 130 },
  5:  { name: 'Eevee', type: 'Normal', region: 'Kanto', hp: 55, attack: 55, defense: 50, speed: 55 },
  6:  { name: 'Snorlax', type: 'Normal', region: 'Kanto', hp: 190, attack: 130, defense: 110, speed: 30 },
  7:  { name: 'Lucario', type: 'Fighting,Steel', region: 'Sinnoh', hp: 120, attack: 145, defense: 110, speed: 112 },
  8:  { name: 'Greninja', type: 'Water,Dark', region: 'Kalos', hp: 112, attack: 145, defense: 101, speed: 141 },
  9:  { name: 'Scyther', type: 'Bug,Flying', region: 'Kanto', hp: 110, attack: 130, defense: 100, speed: 105 },
  10: { name: 'Lapras', type: 'Water,Ice', region: 'Kanto', hp: 150, attack: 95, defense: 100, speed: 60 },
  11: { name: 'Dragonite', type: 'Dragon,Flying', region: 'Kanto', hp: 131, attack: 154, defense: 105, speed: 100 },
  12: { name: 'Alakazam', type: 'Psychic', region: 'Kanto', hp: 75, attack: 135, defense: 100, speed: 145 },
  13: { name: 'Mew', type: 'Psychic', region: 'Kanto', hp: 150, attack: 130, defense: 110, speed: 130 },
  14: { name: 'Noctowl', type: 'Normal,Flying', region: 'Johto', hp: 150, attack: 100, defense: 80, speed: 100 },
  15: { name: 'Ampharos', type: 'Electric', region: 'Johto', hp: 150, attack: 115, defense: 110, speed: 85 },
  16: { name: 'Espeon', type: 'Psychic', region: 'Johto', hp: 95, attack: 130, defense: 110, speed: 130 },
  17: { name: 'Umbreon', type: 'Dark', region: 'Johto', hp: 145, attack: 115, defense: 130, speed: 85 },
  18: { name: 'Tyranitar', type: 'Rock,Dark', region: 'Johto', hp: 175, attack: 154, defense: 130, speed: 71 },
  19: { name: 'Gardevoir', type: 'Psychic,Fairy', region: 'Hoenn', hp: 108, attack: 125, defense: 115, speed: 120 },
  20: { name: 'Salamence', type: 'Dragon,Flying', region: 'Hoenn', hp: 135, attack: 155, defense: 110, speed: 120 },
  21: { name: 'Metagross', type: 'Steel,Psychic', region: 'Hoenn', hp: 140, attack: 145, defense: 140, speed: 80 },
  22: { name: 'Rayquaza', type: 'Dragon,Flying', region: 'Hoenn', hp: 175, attack: 170, defense: 110, speed: 145 },
  23: { name: 'Garchomp', type: 'Dragon,Ground', region: 'Sinnoh', hp: 158, attack: 160, defense: 125, speed: 112 },
  24: { name: 'Infernape', type: 'Fire,Fighting', region: 'Sinnoh', hp: 116, attack: 154, defense: 101, speed: 128 },
});
