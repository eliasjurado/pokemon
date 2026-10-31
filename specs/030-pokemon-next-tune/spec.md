# 030 · Álbum del Mundial Pokémon — migración a Next.js y "tuneo"

Proyecto personal sin fines de lucro (Elías para sus hijos). Modo impeccable: **Experience/Operate** para niños.
Identidad propia de la app (azul noche #0a0a1a / #16162a + dorado "Mundial"), no la marca de Elías.

## Qué / por qué
Hoy es un `index.html` estático con una app inline (paginación de 4 en 4, modal). Se migra al estándar
(`05-operacion/stack-frontend.md`): Next.js App Router + TS + Tailwind v4 + shadcn/ui, `output: "export"`,
publicado como proyecto de GitHub Pages bajo `https://eliasjurado.com/pokemon/` (`basePath: "/pokemon"`).

## Paridad de función (no se pierde nada)
- 215 cartas y todos sus datos (`content/pokemon.json`).
- Filtros tipo / región / país; estado "coleccionado" en `localStorage["pokemonCollected"]` (mapa `{id: 1}`), **misma clave** para no perder la colección de los niños.
- Detalle: stats, PokeAPI (genus, altura, peso, habilidades, flavor, cadena evolutiva), sección Fútbol, vistas Sticker/Oficial/Shiny y grito.
- PWA instalable; botón "Actualizar App" solo en standalone; SW con las reglas del estándar (HTML network-first, estáticos SWR, nunca rutas privadas/RSC); `VERSION` subida.
- Pie "Con ♥ para mis hijos por Elías Jurado" (corazón SVG) + enlace a GitHub.

## Mejoras
1. Progreso de colección arriba (X/215 + barra) y atajo "Todos / Me faltan / Coleccionados".
2. Búsqueda por nombre o número; filtros como chips con scroll horizontal + Sheet "Filtros" (tipo, región, país, equipo de fútbol — nuevo), "Limpiar todo"; estado en la URL (`?tipo=fire&region=kanto&pais=POR&equipo=Portugal&q=…&vista=faltan`).
3. Grilla densa (móvil 2 col, ≥sm 3, md 4, lg 5, xl 6), todas las cartas ordenadas por número, imágenes lazy; render por tandas ("Ver más") para no montar 215 nodos de golpe.
4. Página propia por Pokémon `/p/<id>-<nombre>/` (`generateStaticParams`), estilo ficha de producto; click en carta navega (sin modal). Anterior/siguiente, cadena evolutiva enlazada, "Marcar como coleccionado", volver al álbum conservando filtros y scroll.
5. Insignia "coleccionado" visible en la carta; placeholder SVG elegante cuando falta el sticker.
6. Mobile-first, targets ≥44px, contraste AA, `prefers-reduced-motion`, feedback hover/tap.

## Fuera de alcance
Reasignar posiciones de fútbol (tarea pendiente aparte); cambiar datos; carpeta `origin/` y `scripts/` intactas.

## Criterios de aceptación
- CA1 `npm run build` limpio; `out/` sirve bajo `/pokemon/` con 215 páginas `/p/*`.
- CA2 Búsqueda, chip + URL, toggle coleccionado persistente (misma clave), carta → detalle → volver: pasan en Playwright.
- CA3 Sin overflow horizontal a 390 y 1440; detector impeccable sin hits nuevos.
- CA4 `index.html` y app inline eliminados en el mismo cambio.
