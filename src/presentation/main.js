import { PokemonService } from '../application/pokemonService.js';
import { CollectionService } from '../application/collectionService.js';
import { PaginationService } from '../application/paginationService.js';
import { StorageService } from '../infrastructure/storageService.js';
import { Components } from './components.js';
import { ModalController } from './modalController.js';
import { ORIGINS } from '../domain/constants.js';

class App {
  constructor() {
    this.state = {
      filterType: 'all',
      filterRegion: 'all',
      filterOrigin: 'all',
      filterCollected: 'all',
      sortBy: 'id',
      sortDir: 1,
      page: 1,
    };

    this.pokemonService = new PokemonService();
    this.paginationService = new PaginationService();
    this.storageService = new StorageService();
    this.collectionService = new CollectionService(this.storageService);
    this.ui = new Components();
    this.modal = new ModalController(this.ui, this.pokemonService, this.collectionService);
  }

  init() {
    this.pokemonService.loadAll();
    this.populateFilters();

    this.modal.bindEvents();
    this.bindEvents();
    this.render();
  }

  populateFilters() {
    const types = this.pokemonService.getAllTypes();
    this.ui.populateSelect(this.ui.$('#filterType'), types);

    const regions = this.pokemonService.getAllRegions();
    this.ui.populateSelect(this.ui.$('#filterRegion'), regions);

    this.ui.populateSelect(this.ui.$('#filterOrigin'), ORIGINS);
  }

  bindEvents() {
    const onFilterChange = () => {
      this.syncStateFromDOM();
      this.state.page = 1;
      this.render();
    };

    this.ui.$('#filterType').addEventListener('change', onFilterChange);
    this.ui.$('#filterRegion').addEventListener('change', onFilterChange);
    this.ui.$('#filterOrigin').addEventListener('change', onFilterChange);
    this.ui.$('#filterCollected').addEventListener('change', onFilterChange);
    this.ui.$('#sortBy').addEventListener('change', onFilterChange);

    this.ui.$('#sortDirBtn').addEventListener('click', () => {
      this.state.sortDir *= -1;
      this.ui.$('#sortDirBtn').textContent = this.state.sortDir === 1 ? '↑' : '↓';
      this.state.page = 1;
      this.render();
    });

    this.ui.$('#resetFiltersBtn').addEventListener('click', () => this.resetFilters());
  }

  syncStateFromDOM() {
    this.state.filterType = this.ui.$('#filterType').value;
    this.state.filterRegion = this.ui.$('#filterRegion').value;
    this.state.filterOrigin = this.ui.$('#filterOrigin').value;
    this.state.filterCollected = this.ui.$('#filterCollected').value;
    this.state.sortBy = this.ui.$('#sortBy').value;
  }

  syncDOMFromState() {
    this.ui.$('#filterType').value = this.state.filterType;
    this.ui.$('#filterRegion').value = this.state.filterRegion;
    this.ui.$('#filterOrigin').value = this.state.filterOrigin;
    this.ui.$('#filterCollected').value = this.state.filterCollected;
    this.ui.$('#sortBy').value = this.state.sortBy;
  }

  resetFilters() {
    this.state = {
      filterType: 'all',
      filterRegion: 'all',
      filterOrigin: 'all',
      filterCollected: 'all',
      sortBy: 'id',
      sortDir: 1,
      page: 1,
    };
    this.syncDOMFromState();
    this.ui.$('#sortDirBtn').textContent = '↑';
    this.render();
  }

  render() {
    this.syncStateFromDOM();

    const allPokemon = this.pokemonService.allPokemon;
    const isCollected = (id) => this.collectionService.isCollected(id);

    const filters = {
      type: this.state.filterType,
      region: this.state.filterRegion,
      origin: this.state.filterOrigin,
      collected: this.state.filterCollected,
      isCollected,
    };

    const filtered = this.pokemonService.filter(allPokemon, filters);
    const sorted = this.pokemonService.sort(filtered, this.state.sortBy, this.state.sortDir);
    const totalPages = this.paginationService.getTotalPages(sorted.length);
    this.state.page = this.paginationService.clampPage(this.state.page, totalPages);
    const pageItems = this.paginationService.getPageItems(sorted, this.state.page);

    const totalCount = allPokemon.length;
    const totalCollected = this.collectionService.countCollected(allPokemon);
    this.ui.$('#progressText').textContent = `${totalCollected}/${totalCount} coleccionados`;
    this.ui.$('#progressPct').textContent = `${Math.round((totalCollected / totalCount) * 100)}%`;
    this.ui.$('#progressFill').style.width = `${(totalCollected / totalCount) * 100}%`;

    const gallery = this.ui.$('#gallery');
    const resultCount = this.ui.$('#resultCount');

    if (sorted.length === 0) {
      this.ui.renderEmptyState(gallery);
      this.ui.renderPagination(this.ui.$('#pagination'), 0, 0, () => {});
      this.ui.renderClearResultCount(resultCount);
      return;
    }

    this.ui.renderGallery(gallery, pageItems, isCollected, (id) => {
      const pokemon = this.pokemonService.findById(id);
      if (pokemon) {
        this.modal.open(pokemon, (pokemonId) => {
          this.collectionService.toggle(pokemonId);
          this.render();
          const updated = this.pokemonService.findById(pokemonId);
          if (updated) this.modal.open(updated, () => {});
        });
      }
    });

    const collectedCount = this.collectionService.countCollected(filtered);
    this.ui.renderResultCount(resultCount, filtered.length, collectedCount, this.state.page, totalPages);

    this.ui.renderPagination(this.ui.$('#pagination'), this.state.page, totalPages, (newPage) => {
      this.state.page = newPage;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App().init();
});
