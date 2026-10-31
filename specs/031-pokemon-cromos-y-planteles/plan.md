# Plan
1. `scripts/art-truth.json` (transcrito de hojas de contacto) + `fix_cards.py`: nombres reales (PokeAPI), país/bandera en español (`content/teams.json`).
2. `recrop_stickers.py`: detecta las cajas reales de tarjeta en las hojas (bordes plateados; filas de 258/246/246/228 px), recorta con 2 px de margen y estampa insignia que cubre el número impreso. Fuente de cada id: `sticker-sources.json` (coincidencia de píxeles). #1-#136 no tienen hoja en `origin/`: se conservan.
3. `build_squads.py`: puestos por algoritmo húngaro (existentes) + fichajes (etapa final, no legendarios/ultraentes/paradoja, afinidad de tipo con el país); stats 40-100 derivadas de PokeAPI.
4. `make_artwork.py`, `CromoGenerado`, manifiesto `sync-stickers.mjs`, ruta `/equipos/`, enlace en cabecera, SW v5.
