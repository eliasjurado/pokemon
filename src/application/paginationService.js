import { CONFIG } from '../domain/config.js';

export class PaginationService {
  getTotalPages(totalItems) {
    return Math.max(1, Math.ceil(totalItems / CONFIG.itemsPerPage));
  }

  getPageItems(list, page) {
    const start = (page - 1) * CONFIG.itemsPerPage;
    return list.slice(start, start + CONFIG.itemsPerPage);
  }

  clampPage(page, totalPages) {
    return Math.min(page, totalPages);
  }
}
