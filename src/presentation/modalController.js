import { TYPE_COLORS } from '../domain/constants.js';
import { CONFIG } from '../domain/config.js';

export class ModalController {
  constructor(components, pokemonService, collectionService) {
    this.ui = components;
    this.pokemonService = pokemonService;
    this.collectionService = collectionService;
  }

  open(pokemon, onToggle) {
    const isCollected = this.collectionService.isCollected(pokemon.id);

    this.ui.$('#modalImg').src = pokemon.image;
    this.ui.$('#modalImg').alt = pokemon.name;
    this.ui.$('#modalName').textContent = pokemon.name;
    this.ui.$('#modalId').textContent =
      `#${String(pokemon.id).padStart(3, '0')} · ${this.ui.originLabel(pokemon.originId)}`;

    const typeBadges = pokemon.types
      .map((t) => `<span class="badge" style="background:${TYPE_COLORS[t] || '#888'}">${t}</span>`)
      .join('');
    this.ui.$('#modalBadges').innerHTML =
      typeBadges + `<span class="badge badge-region">${pokemon.region}</span>`;

    const totalPercent = Math.min(100, Math.round((pokemon.totalStats / CONFIG.maxTotalValue) * 100));
    this.ui.$('#modalStats').innerHTML = `
      ${this.ui.statRowHtml('HP', pokemon.hp)}
      ${this.ui.statRowHtml('ATK', pokemon.attack)}
      ${this.ui.statRowHtml('DEF', pokemon.defense)}
      ${this.ui.statRowHtml('SPD', pokemon.speed)}
      <div class="stat-row" style="margin-top:4px;border-top:1px solid var(--border);padding-top:6px">
        <span class="stat-label" style="width:40px;font-weight:700">TOT</span>
        <div class="stat-bar">
          <div class="stat-fill" style="width:${totalPercent}%;background:linear-gradient(90deg,#4ade80,#22d3ee)"></div>
        </div>
        <span class="stat-val" style="color:#22d3ee;font-weight:700;width:32px">${pokemon.totalStats}</span>
      </div>`;

    const toggleHtml = isCollected
      ? '<div class="collected-badge clickable" id="toggleCollectedBtn">✅ ¡Coleccionado! (tocar para quitar)</div>'
      : '<div class="collected-badge interactive" id="toggleCollectedBtn">⬜ Marcar como coleccionado</div>';
    this.ui.$('#modalCollected').innerHTML = toggleHtml;

    this.ui.$('#modal').classList.add('open');

    setTimeout(() => {
      const btn = document.getElementById('toggleCollectedBtn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggle(pokemon.id);
        });
      }
    }, 0);
  }

  close() {
    this.ui.$('#modal').classList.remove('open');
  }

  bindEvents() {
    const modal = this.ui.$('#modal');
    this.ui.$('#modalClose').addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }
}
