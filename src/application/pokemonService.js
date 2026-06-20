import { PokemonFactory } from '../domain/entities.js';

export class PokemonService {
  constructor() {
    this.allPokemon = [];
  }

  loadAll() {
    const factory = new PokemonFactory();
    this.allPokemon = factory.buildAll();
    return this.allPokemon;
  }

  findById(id) {
    return this.allPokemon.find((p) => p.id === id) || null;
  }

  getAllTypes() {
    const typeSet = new Set();
    for (const pokemon of this.allPokemon) {
      for (const type of pokemon.types) {
        typeSet.add(type);
      }
    }
    return [...typeSet].sort();
  }

  getAllRegions() {
    const regionSet = new Set();
    for (const pokemon of this.allPokemon) {
      regionSet.add(pokemon.region);
    }
    return [...regionSet].sort();
  }

  filter(list, filters) {
    return list.filter((pokemon) => {
      return (
        this.passesTypeFilter(pokemon, filters.type) &&
        this.passesRegionFilter(pokemon, filters.region) &&
        this.passesOriginFilter(pokemon, filters.origin) &&
        this.passesCollectionFilter(pokemon, filters.collected, filters.isCollected)
      );
    });
  }

  passesTypeFilter(pokemon, type) {
    return type === 'all' || pokemon.types.includes(type);
  }

  passesRegionFilter(pokemon, region) {
    return region === 'all' || pokemon.region === region;
  }

  passesOriginFilter(pokemon, originId) {
    return originId === 'all' || pokemon.originId === originId;
  }

  passesCollectionFilter(pokemon, filterValue, isCollectedFn) {
    if (filterValue === 'all') return true;
    const has = isCollectedFn(pokemon.id);
    return filterValue === 'collected' ? has : !has;
  }

  sort(list, field, direction) {
    return [...list].sort((a, b) => {
      const valueA = this.getSortValue(a, field);
      const valueB = this.getSortValue(b, field);
      if (valueA < valueB) return -1 * direction;
      if (valueA > valueB) return 1 * direction;
      return 0;
    });
  }

  getSortValue(pokemon, field) {
    switch (field) {
      case 'id': return pokemon.id;
      case 'name': return pokemon.name.toLowerCase();
      case 'hp': return pokemon.hp;
      case 'attack': return pokemon.attack;
      case 'defense': return pokemon.defense;
      case 'speed': return pokemon.speed;
      case 'total': return pokemon.totalStats;
      default: return pokemon.id;
    }
  }
}
