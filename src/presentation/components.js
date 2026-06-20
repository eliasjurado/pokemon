import { CONFIG } from '../domain/config.js';
import { TYPE_COLORS, ORIGINS } from '../domain/constants.js';

export class Components {
  constructor() {
    this.cache = {};
  }

  $(selector) {
    if (!this.cache[selector]) {
      this.cache[selector] = document.querySelector(selector);
    }
    return this.cache[selector];
  }

  originLabel(originId) {
    const origin = ORIGINS.find((o) => o.id === originId);
    return origin ? origin.label : originId;
  }

  statColor(value) {
    if (value >= 110) return '#4ade80';
    if (value >= 70) return '#facc15';
    return '#f87171';
  }

  statRowHtml(label, value) {
    const percent = Math.min(100, Math.round((value / CONFIG.maxStatValue) * 100));
    const color = this.statColor(value);
    return `
      <div class="stat-row">
        <span class="stat-label">${label}</span>
        <div class="stat-bar">
          <div class="stat-fill" style="width:${percent}%;background:${color}"></div>
        </div>
        <span class="stat-val" style="color:${color}">${value}</span>
      </div>`;
  }

  cardHtml(pokemon, isCollected) {
    const typeBadges = pokemon.types
      .map((t) => `<span class="badge" style="background:${TYPE_COLORS[t] || '#888'}">${t}</span>`)
      .join('');

    return `
      <div class="card" data-id="${pokemon.id}">
        <div class="card-img-wrap">
          <img src="${pokemon.image}" alt="${pokemon.name}" loading="lazy">
          <span class="card-origin">${this.originLabel(pokemon.originId)}</span>
        </div>
        <div class="card-body">
          <div class="card-name">${isCollected ? '✅ ' : ''}${pokemon.name}</div>
          <div class="card-id">#${String(pokemon.id).padStart(3, '0')} · ${this.originLabel(pokemon.originId)}</div>
          <div class="badges">
            ${typeBadges}
            <span class="badge badge-region">${pokemon.region}</span>
          </div>
          <div class="stats">
            ${this.statRowHtml('HP', pokemon.hp)}
            ${this.statRowHtml('ATK', pokemon.attack)}
            ${this.statRowHtml('DEF', pokemon.defense)}
            ${this.statRowHtml('SPD', pokemon.speed)}
          </div>
        </div>
      </div>`;
  }

  renderGallery(container, pokemonList, isCollectedFn, onCardClick) {
    const html = pokemonList.map((p) => this.cardHtml(p, isCollectedFn(p.id))).join('');
    container.innerHTML = html;

    container.querySelectorAll('.card').forEach((el) => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        onCardClick(id);
      });
    });
  }

  renderEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No hay Pokémon que coincidan con los filtros 😅</p>
        <p style="font-size:0.9rem;margin-top:8px">¡Prueba quitando algunos filtros!</p>
      </div>`;
  }

  renderResultCount(el, filteredCount, collectedCount, page, totalPages) {
    el.textContent = `${collectedCount}/${filteredCount} coleccionados · Pág ${page}/${totalPages}`;
  }

  renderClearResultCount(el) {
    el.textContent = '0 resultados';
  }

  renderPagination(container, currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const btn = (page, label, extra = '') =>
      `<button data-page="${page}" ${extra}>${label}</button>`;

    const active = (p) => (p === currentPage ? 'active' : '');
    const disabled = (cond) => (cond ? 'disabled' : '');

    const MAX_VISIBLE = 7;
    const half = Math.floor(MAX_VISIBLE / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + MAX_VISIBLE - 1);
    if (end - start + 1 < MAX_VISIBLE) {
      start = Math.max(1, end - MAX_VISIBLE + 1);
    }

    let html = btn(currentPage - 1, '‹ Anterior', disabled(currentPage <= 1));

    if (start > 1) {
      html += btn(1, '1');
      if (start > 2) html += '<span class="page-info">...</span>';
    }

    for (let p = start; p <= end; p++) {
      html += btn(p, p, `class="${active(p)}"`);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) html += '<span class="page-info">...</span>';
      html += btn(totalPages, totalPages);
    }

    html += btn(currentPage + 1, 'Siguiente ›', disabled(currentPage >= totalPages));

    container.innerHTML = html;

    container.querySelectorAll('button[data-page]').forEach((btnEl) => {
      btnEl.addEventListener('click', () => {
        if (btnEl.disabled) return;
        onPageChange(parseInt(btnEl.dataset.page));
      });
    });
  }

  populateSelect(el, values, labelMap) {
    const fragment = document.createDocumentFragment();
    for (const v of values) {
      const opt = document.createElement('option');
      opt.value = v.id || v;
      opt.textContent = labelMap ? labelMap(v) : v;
      fragment.appendChild(opt);
    }
    el.appendChild(fragment);
  }
}
