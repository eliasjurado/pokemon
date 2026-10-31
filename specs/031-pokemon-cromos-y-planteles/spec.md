# 031 · Corrección de cromos y planteles completos
**Qué/porqué:** el OCR original dejó 21 cromos con nombre basura, ~77 con país distinto al impreso en el arte, 79 recortes desfasados (#137+ con el número "002" de la hoja asomando) y 20 sin equipo. Además cada selección tenía ~6 cromos; se completa a un 4-3-3 + suplente (12).
**Reglas:** el arte manda (país/nombre impresos); países en español; dorsales únicos por equipo; cromos nuevos sin arte IA usan cromo provisional (artwork oficial PokeAPI) y se reemplazan al soltar su PNG; clave `pokemonCollected` intacta.
**Criterios:** build+lint limpios; álbum = 384; /equipos/ con 32 plantillas de 12; Noivern #25 = Ecuador; #137 = Torkoal sin número fantasma; `scripts/check_cards.py` OK.
