"""check_cards.py — valida datos vs lo que muestra el arte (scripts/art-truth.json) y la integridad de los planteles.
Comprueba: país/código por cromo contra el arte, nombre vs placa, dorsales únicos por equipo, 12 por equipo (4-3-3 + suplente),
país en español (sin códigos '???'), PNG existente o artwork para cada cromo. Sale con código 1 si algo falla.
Uso: python3 scripts/check_cards.py"""
import json, os, sys, collections
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(f"{R}/content/pokemon.json")); truth = json.load(open(f"{R}/scripts/art-truth.json"))
teams = {t["code"]: t for t in json.load(open(f"{R}/content/teams.json"))}
bad = []
for p in d:
    t = truth.get(str(p["id"]))
    if t:
        if p["countryCode"] != t["code"]: bad.append(f"#{p['id']} país {p['countryCode']} != arte {t['code']}")
        if "name" in t and p["name"].lower() != t["name"].lower(): bad.append(f"#{p['id']} nombre {p['name']} != placa {t['name']}")
    if p["countryName"] != teams[p["countryCode"]]["name"] or p["football"]["team"] != p["countryName"]: bad.append(f"#{p['id']} país/equipo no coinciden con teams.json")
    has_png = os.path.exists(f"{R}/public/{p['img']}")
    if not has_png and not os.path.exists(f"{R}/public/artwork/{p['pokeapi_details']['id']}.webp"): bad.append(f"#{p['id']} sin PNG ni artwork")
by = collections.defaultdict(list)
for p in d: by[p["countryCode"]].append(p["football"]["jersey"])
for c, js in by.items():
    if sorted(js) != list(range(1, 13)): bad.append(f"{c}: dorsales {sorted(js)} (deben ser 1..12 sin repetir)")
print("\n".join(bad) or f"OK: {len(d)} cromos, {len(by)} equipos de 12, dorsales únicos")
sys.exit(1 if bad else 0)
