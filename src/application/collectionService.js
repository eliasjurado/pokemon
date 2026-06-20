import { CONFIG } from '../domain/config.js';

export class CollectionService {
  constructor(storageService) {
    this.storage = storageService;
  }

  getAll() {
    return this.storage.getItem(CONFIG.localStorageKey) || {};
  }

  isCollected(id) {
    return !!this.getAll()[id];
  }

  toggle(id) {
    const collection = this.getAll();
    if (collection[id]) {
      delete collection[id];
    } else {
      collection[id] = true;
    }
    this.storage.setItem(CONFIG.localStorageKey, collection);
    return collection;
  }

  countCollected(pokemonList) {
    const collection = this.getAll();
    return pokemonList.filter((p) => collection[p.id]).length;
  }
}
