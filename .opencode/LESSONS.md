# Lecciones Aprendidas

## Asignación de posiciones de fútbol
- Usar stats normalizadas (ata/def/vel) con pesos balanceados para evitar que todos caigan en la misma posición.
- El peso `vel * 2.0` para extremos vs `def * 2.0` para defensas no funciona si los rangos de stats son similares.
- Solución: usar `vel * 1.5 + ata * 1.0` para extremos, `def * 2.0 + h * 5` para defensas, y rebalancear con type bonuses.
- Para el tiebreaker entre LB↔RB y LW↔RW usar id parity o comparar spAta vs Ata.

## Placeholder SVG para stickers faltantes
- Usar `data:image/svg+xml` con `encodeURIComponent` para generar placeholders inline sin archivos extra.
- El onerror debe limpiarse (`this.onerror=null`) antes de cambiar el src para evitar loops.
- Diferenciar visualmente entre coleccionado (verde) y pendiente (gris) con el mismo placeholder.

## Estructura del proyecto
- `.opencode/plans/` — planes de cambios específicos
- `.opencode/TASKS.md` — seguimiento de tareas
- `.opencode/LESSONS.md` — lecciones aprendidas

## Modal de detalle
- La info de fútbol debe ir primero, antes de la info del Pokémon.
- Usar `.stats-title` para los títulos de sección (mismo estilo que "Estadísticas Base").
- Separar secciones visualmente con el分隔ador o márgenes.

## Grid de cards
- El campo `football.role` (ej. "Delantero Centro") puede ser muy largo para la card → usar `text-overflow: ellipsis`.
- El badge se ve mejor como pill con fondo de color en vez de texto plano.
- Usar `display: inline-block` + `max-width: 100%` + `text-overflow: ellipsis` para que el badge se adapte al ancho de la card sin desbordar.

## opencode.json configuration
- El archivo `opencode.json` con `context[]` permite cargar TASKS.md y LESSONS.md automáticamente en cada sesión.
- Los archivos de contexto deben estar en `.opencode/` para mantener el workspace ordenado.

## Modal section titles
- Usar la clase `.stats-title` existente para títulos de sección (`.stats-title` ya tiene el estilo: uppercase, bold, letras espaciadas, color text2).
- No inventar nuevas clases de título cuando ya existe una reutilizable.
- Las secciones se ordenan: fútbol primero, Pokémon después.
