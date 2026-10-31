# Álbum del Mundial Pokémon

Next.js 16 (export estático, `basePath /pokemon`) desplegado por GitHub Actions al hacer push a `main`.
`npm run build` · `npm run lint` · la colección vive en `localStorage["pokemonCollected"]` (`{ "<id>": 1 }`).

## Cromos con arte propio vs. provisionales
Cada cromo usa `img` de `content/pokemon.json`. Si existe `public/stickers/<nombre>_<NNN>.png` se muestra ese arte;
si no, la app dibuja un **cromo provisional** (`components/CromoGenerado.tsx`) con el artwork oficial de PokeAPI
(`public/artwork/<id PokeAPI>.webp`). Convención del archivo: nombre en minúsculas sin espacios ni símbolos (`mr-mime`)
+ `_` + id de 3 dígitos: p. ej. `public/stickers/dubwool_216.png` (el nombre exacto está en el campo `img` del cromo).
Basta soltar el PNG y hacer build: `scripts/sync-stickers.mjs` (prebuild) regenera `content/sticker-sizes.json`,
que es el manifiesto de qué cromos tienen arte. En la ficha de un provisional aparece la leyenda "Cromo provisional".

## Planteles
32 selecciones x 12 = 384 cromos (4-3-3 + portero suplente; dorsal = puesto: 1 POR, 3 LI, 4/5 DFC, 2 LD, 6 MCD, 8 MC, 10 MP, 11 EI, 9 DC, 7 ED, 12 POR suplente). Vista en `/equipos/`.

## Scripts (`scripts/`)
`art-truth.json` (país/nombre impresos en cada cromo) → `fix_cards.py` → `recrop_stickers.py` → `build_squads.py` (necesita caché PokeAPI en `$POKE_CACHE`) → `make_artwork.py` → `check_cards.py` (validación).
