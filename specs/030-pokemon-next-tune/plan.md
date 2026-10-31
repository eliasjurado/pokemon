# Plan — 030

## Stack
Next.js (App Router, TS), Tailwind v4 (`@tailwindcss/postcss`), shadcn/ui a mano (`components.json`, `lib/utils.ts`, `components/ui/{button,sheet}.tsx`, tokens mapeados a la marca de la app), lucide-react, `next/font` (Bungee-free: Barlow Condensed para números/títulos + Nunito para texto). Sin Zustand: la colección es una mini-store sobre `localStorage` con `useSyncExternalStore`.

## Estructura
- `content/pokemon.json` (datos), `public/stickers`, `public/images`, `public/manifest.webmanifest`, `public/sw.js`.
- `lib/pokemon.ts` datos tipados y helpers (slug, tipos en español/colores, filtros); `lib/collection.ts` store; `lib/filters.ts` parseo/serialización de query.
- `app/layout.tsx`, `app/page.tsx` (Suspense + `Album`), `app/p/[slug]/page.tsx`.
- `components/`: `Album`, `FilterSheet`, `Chips`, `PokeCard`, `StickerImage`, `ProgressHeader`, `CollectButton`, `Viewer`, `PwaButton`, `SwRegister`, `Footer`, `ui/`.

## Decisiones
- Tipos sin dato (21 cartas inventadas): tipo "Especial", región "Otra" (solo en el filtro si existen).
- Orden por número de id. Query: `q`, `tipo`, `region`, `pais` (código), `equipo`, `vista` (`faltan|tengo`).
- Volver al álbum: se guarda la query y el scroll en `sessionStorage` al abrir una ficha.
- SW: sin precache de 215 imágenes; estáticos propios por SWR con lista de permitidos; PokeAPI cache-first como antes.
- Deploy: `.github/workflows/pages.yml` (configure-pages → build → upload `out` → deploy-pages) en push a `main` y manual. El Pages "legacy" debe cambiarse a "GitHub Actions" en Settings (acción de Elías).
