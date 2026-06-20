import { POKEMON_TYPES, POKEMON_REGIONS, STICKER_SOURCES, KNOWN_POKEMON } from './constants.js';

export class Pokemon {
  constructor({ id, originId, image, name, type, region, hp, attack, defense, speed }) {
    this.id = id;
    this.originId = originId;
    this.image = image;
    this.name = name;
    this.type = type;
    this.region = region;
    this.hp = hp;
    this.attack = attack;
    this.defense = defense;
    this.speed = speed;
  }

  get types() {
    return this.type.split(',');
  }

  get totalStats() {
    return this.hp + this.attack + this.defense + this.speed;
  }
}

export class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next(index) {
    let t = (index + this.seed) >>> 0;
    t = (t += 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export class PokemonFactory {
  constructor() {
    this.rng = new SeededRandom(0xDEADBEEF);
  }

  buildAll() {
    const pokemonList = [];
    let id = 1;

    for (const source of STICKER_SOURCES) {
      for (let n = 1; n <= source.count; n++) {
        const entry = this.createEntry(id, source, n);
        pokemonList.push(entry);
        id++;
      }
    }

    return pokemonList;
  }

  createEntry(id, source, stickerIndex) {
    const known = KNOWN_POKEMON[id];
    const image = `stickers/${source.prefix}_${String(stickerIndex).padStart(2, '0')}.png?v=4`;

    if (known) {
      return new Pokemon({ id, originId: source.originId, image, ...known });
    }

    return new Pokemon({
      id,
      originId: source.originId,
      image,
      name: `Mystery #${id}`,
      type: this.randomType(id),
      region: this.randomRegion(id),
      hp: this.randomStat(id, 0, 40, 150),
      attack: this.randomStat(id, 1, 30, 180),
      defense: this.randomStat(id, 2, 30, 180),
      speed: this.randomStat(id, 3, 30, 180),
    });
  }

  randomStat(index, offset, min, max) {
    const value = this.rng.next(index * 7 + offset * 13);
    return Math.floor(min + value * (max - min + 1));
  }

  randomType(index) {
    if (this.rng.next(index * 3 + 1) > 0.65) {
      const t1 = this.pickRandom(POKEMON_TYPES, index * 2);
      let t2;
      do {
        t2 = this.pickRandom(POKEMON_TYPES, index * 2 + 1);
      } while (t2 === t1);
      return [t1, t2].sort().join(',');
    }
    return this.pickRandom(POKEMON_TYPES, index * 2);
  }

  randomRegion(index) {
    return this.pickRandom(POKEMON_REGIONS, index * 5 + 3);
  }

  pickRandom(list, seed) {
    return list[Math.floor(this.rng.next(seed) * list.length)];
  }
}
