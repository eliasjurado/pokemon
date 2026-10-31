/** Proyecto de GitHub Pages bajo el dominio propio (https://eliasjurado.com/pokemon/). Debe coincidir con next.config.ts. */
export const BASE = "/pokemon";

/** Los <img>/<link> planos no reciben el basePath de Next: se antepone a mano. */
export const asset = (path: string) => `${BASE}/${path.replace(/^\/+/, "")}`;

export const REPO_URL = "https://github.com/eliasjurado/pokemon";
export const AUTHOR_URL = "https://eliasjurado.com";
