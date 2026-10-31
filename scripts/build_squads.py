"""
build_squads.py — Parte A5 + Parte B (spec 031): planteles de 12 por selección.

Plantel = 4-3-3 titular + portero suplente:
  1 POR · 3 LI · 4 DFC · 5 DFC · 2 LD · 6 MCD · 8 MC · 10 MP · 11 EI · 9 DC · 7 ED · 12 POR (suplente)
El dorsal lo fija el puesto => es único por equipo por construcción.

1) Asigna los cromos que YA existen a los puestos que mejor les van (algoritmo húngaro sobre un puntaje
   por puesto calculado con ata/def/vel del cromo + tamaño/PS de PokeAPI).
2) Los puestos vacíos se llenan con Pokémon reales que NO están en el álbum (etapa final, no legendarios),
   elegidos por encaje con el puesto y por afinidad de tipo con el país (content/teams.json -> themes).
3) Pide a PokeAPI tipo/región/detalles de cada fichaje y los agrega con ids consecutivos (216...).

Necesita la caché de PokeAPI en $POKE_CACHE (pokemon p<ID>.json / especie s<ID>.json); fetch_cache.py la crea.
Uso: POKE_CACHE=/ruta/cache python3 scripts/build_squads.py
"""
import json, math, os, re, sys
import numpy as np
from scipy.optimize import linear_sum_assignment

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from poke_lib import fetch_card_data, ROOT

CACHE = os.environ.get("POKE_CACHE", os.path.join(ROOT, ".pokecache"))

# jersey -> (position, role)
SLOTS = {
    1: ("GK", "Portero"), 3: ("LB", "Lateral Izquierdo"), 4: ("CB", "Defensa Central"), 5: ("CB", "Defensa Central"),
    2: ("RB", "Lateral Derecho"), 6: ("CDM", "Mediocentro Defensivo"), 8: ("CM", "Mediocentro"), 10: ("CAM", "Mediapunta"),
    11: ("LW", "Extremo Izquierdo"), 9: ("ST", "Delantero Centro"), 7: ("RW", "Extremo Derecho"), 12: ("GK", "Portero Suplente"),
}
ORDER = [1, 12, 4, 5, 3, 2, 6, 8, 10, 11, 7, 9]  # orden de llenado de puestos vacíos
SPECIAL_NAMES = {"mr-mime": "Mr. Mime", "mime-jr": "Mime Jr.", "farfetchd": "Farfetch'd", "sirfetchd": "Sirfetch'd", "porygon-z": "Porygon-Z",
                 "type-null": "Type: Null", "nidoran-f": "Nidoran F", "nidoran-m": "Nidoran M", "mr-rime": "Mr. Rime", "flabebe": "Flabébé"}
# Ultraentes y Paradoja: se tratan como casi-legendarios y no se fichan
EXCLUDED_IDS = {793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806, 984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 1005, 1006, 1009, 1010, 1020, 1021, 1022, 1023}
SOLID = {"Steel", "Rock", "Ground", "Ghost", "Water", "Fighting"}
MIND = {"Psychic", "Fairy", "Ghost"}


def load_cache():
    pk, sp = {}, {}
    for i in range(1, 1026):
        pk[i] = json.load(open(f"{CACHE}/p{i}.json"))
        sp[i] = json.load(open(f"{CACHE}/s{i}.json"))
    return pk, sp


r5 = lambda x: int(round(x / 5.0) * 5)
clamp = lambda x, a, b: max(a, min(b, x))


def card_stats(s):
    return (clamp(r5(40 + 0.5 * max(s["attack"], s["special-attack"])), 45, 100),
            clamp(r5(0.9 * (s["defense"] + s["special-defense"]) / 2 + 5), 30, 110),
            clamp(r5(0.8 * s["speed"] + 10), 30, 110))


def feats(ata, dfn, vel, hp, weight_kg, height_m, types):
    return dict(ata=ata, dfn=dfn, vel=vel, hp=hp, size=math.log(max(weight_kg, 1)) + 0.5 * math.log(max(height_m, 0.1) * 10), types=set(types))


def make_scorers(allf):
    z = {}
    for k in ("ata", "dfn", "vel", "hp", "size"):
        v = np.array([f[k] for f in allf], float)
        z[k] = (v.mean(), v.std() or 1)
    Z = lambda f, k: (f[k] - z[k][0]) / z[k][1]

    def score(f, slot):
        pos = SLOTS[slot][0]
        a, d, v, h, s = (Z(f, k) for k in ("ata", "dfn", "vel", "hp", "size"))
        t = f["types"]
        if slot == 12: return 0.85 * score(f, 1)
        return {
            "GK": 1.0 * d + 0.5 * h + 0.3 * s + 0.3 * bool(t & SOLID) - 0.2 * v,
            "CB": 1.2 * d + 0.3 * h + 0.3 * s + 0.2 * a - 0.3 * v,
            "LB": 0.8 * v + 0.7 * d + 0.2 * a,
            "RB": 0.8 * v + 0.7 * d + 0.2 * a,
            "CDM": 0.6 * d + 0.5 * h + 0.4 * a + 0.1 * v,
            "CM": 0.4 * a + 0.4 * d + 0.4 * v + 0.2 * h,
            "CAM": 0.8 * a + 0.5 * v + 0.3 * bool(t & MIND) - 0.2 * d,
            "LW": 1.2 * v + 0.6 * a,
            "RW": 1.2 * v + 0.6 * a,
            "ST": 1.3 * a + 0.3 * v + 0.2 * s,
        }[pos]
    return score


# ---------- textos de ventaja (español, mismo tono que los existentes) ----------
def advantage(slot, name, ata, dfn, vel, h_m, w_kg, variant):
    pos = SLOTS[slot][0]
    T = {
        "GK": [f"Su muro defensivo ({dfn}) y su tamaño ({h_m} m) le tapan todo el arco",
               f"Sus reflejos y su corpulencia ({w_kg} kg) hacen casi imposible batirlo desde afuera del área",
               f"Domina el área chica: ataja centros y deja sin ángulo a los delanteros"],
        "CB": [f"Su defensa implacable ({dfn}) no pierde un duelo aéreo ni en el suelo",
               f"Su fuerza bruta ({w_kg} kg) intimida a cualquier delantero rival",
               f"Es rocoso e impasable en el uno contra uno ({dfn} de defensa)"],
        "LB": [f"Su velocidad ({vel}) le permite subir y bajar la banda izquierda sin descanso",
               "Combina defensa sólida con proyección ofensiva por la izquierda",
               f"Corta ataques rivales y sale al contragolpe por la izquierda con {vel} de velocidad"],
        "RB": [f"Su velocidad ({vel}) le permite subir y bajar la banda derecha sin descanso",
               "Combina defensa sólida con proyección ofensiva por la derecha",
               f"Corta ataques rivales y sale al contragolpe por la derecha con {vel} de velocidad"],
        "CDM": [f"Su resistencia ({dfn} de defensa) le permite barrer todo el mediocampo sin descanso",
                "Recupera balones y los entrega limpios a los creadores",
                f"Escudo de la defensa: lee el juego y corta cada pase filtrado"],
        "CM": ["Equilibra defensa y ataque: va de área a área sin perder el ritmo",
               f"Su ritmo parejo (ata {ata}, def {dfn}, vel {vel}) conecta a toda la cancha",
               "Reparte juego en el centro y llega al área rival como sorpresa"],
        "CAM": [f"Su inteligencia lee el juego y asiste a los delanteros con precisión ({ata} de ataque)",
                "Se mueve entre líneas y encuentra el pase que rompe a la defensa",
                f"Piensa rápido ({vel} de velocidad) y define con clase desde la media punta"],
        "LW": [f"Su velocidad letal ({vel}) desborda defensas por la izquierda sin piedad",
               "Su rapidez en el uno contra uno lo convierte en pesadilla de laterales",
               "Encara por la izquierda, se mete al centro y dispara al arco"],
        "RW": [f"Su explosividad ({vel}) destruye defensas por la banda derecha",
               "Su velocidad punta deja atrás a cualquier defensor en el sprint",
               "Recorta hacia adentro por la derecha y saca disparos potentes al arco"],
        "ST": [f"Su potencia de fuego ({ata}) define con precisión quirúrgica frente al arco",
               f"Su olfato de gol ({ata}) lo pone siempre en el lugar correcto",
               f"Su remate potente ({ata}) y su físico ({w_kg} kg) lo hacen imparable"],
    }[pos if slot != 12 else "GK"]
    if slot == 12:
        return "Portero suplente: espera su momento en el banco y entra con la misma seguridad. " + T[variant % 3]
    return T[variant % 3]


def display(sname):
    if sname in SPECIAL_NAMES:
        return SPECIAL_NAMES[sname]
    return " ".join(w.capitalize() for w in sname.split("-"))


def slugname(n):
    return re.sub(r"[^a-z0-9-]+", "", n.lower().replace(" ", ""))


def main():
    pk, sp = load_cache()
    teams = json.load(open(f"{ROOT}/content/teams.json"))
    data = [p for p in json.load(open(f"{ROOT}/content/pokemon.json")) if p.get("origin") != "plantel"]
    maxid = max(p["id"] for p in data)

    # ---- elegibles: etapa final, no legendarios/míticos/bebés, no presentes en el álbum
    parents = {s["evolves_from"] for s in sp.values() if s["evolves_from"]}
    album_species = set()
    album_stems = set()
    for p in data:
        det = p["pokeapi_details"]
        album_stems.add((det.get("pokemon_api_name") or p["name"].lower()).split("-")[0])
        album_stems.add(p["name"].lower().split("-")[0])
        chain = det.get("evolution_chain") or []
        if chain:
            album_species.update(i for n, i in chain[-1] if n.split("-")[0] == det["pokemon_api_name"].split("-")[0])
        if det["id"] <= 1025:
            album_species.add(det["id"])
    elig = []
    for i in range(1, 1026):
        s, q = sp[i], pk[i]
        if s["legendary"] or s["mythical"] or s["baby"] or s["name"] in parents or i in album_species or i in EXCLUDED_IDS:
            continue
        if s["name"].split("-")[0] in album_stems or q["name"].split("-")[0] in album_stems:
            continue
        elig.append(i)

    # ---- features
    def f_of_pk(i):
        q = pk[i]
        st = q["stats"]
        a, d, v = card_stats(st)
        return feats(a, d, v, st["hp"], q["weight"] / 10, q["height"] / 10, [t.capitalize() for t in q["types"]]), (a, d, v)

    cand = {i: f_of_pk(i) for i in elig}
    existing_f = {}
    for p in data:
        det = p["pokeapi_details"]
        existing_f[p["id"]] = feats(p["ata"], p["def"], p["vel"], det["stats_full"]["hp"], det["weight_kg"], det["height_m"], [p["type"]])
    score = make_scorers([c[0] for c in cand.values()] + list(existing_f.values()))

    # ---- 1) puestos para los cromos existentes (húngaro por selección)
    by_team = {t["code"]: [] for t in teams}
    for p in data:
        by_team[p["countryCode"]].append(p)
    slots_of = {}  # code -> {jersey: card}
    for t in teams:
        cards = by_team[t["code"]]
        assert len(cards) <= 12, (t["code"], len(cards))
        M = np.array([[score(existing_f[c["id"]], j) for j in range(1, 13)] for c in cards])
        r, c = linear_sum_assignment(-M)
        slots_of[t["code"]] = {int(c_) + 1: cards[int(r_)] for r_, c_ in zip(r, c)}

    # ---- 2) fichajes
    used, picks = set(), []  # picks: (code, jersey, pokeapi id)
    for jersey in ORDER:
        for k, t in enumerate(teams[jersey % len(teams):] + teams[:jersey % len(teams)]):  # rotar para repartir lo mejor
            if jersey in slots_of[t["code"]]:
                continue
            best, bs = None, -1e9
            for i, (f, _) in cand.items():
                if i in used: continue
                sc = score(f, jersey) + (0.6 if f["types"] & set(t["themes"]) else 0)
                if sc > bs: best, bs = i, sc
            used.add(best)
            picks.append((t["code"], jersey, best))
    print(f"fichajes: {len(picks)}")

    # ---- 3) construir cartas nuevas (ids consecutivos por orden de selección y dorsal)
    team_idx = {t["code"]: n for n, t in enumerate(teams)}
    picks.sort(key=lambda x: (team_idx[x[0]], x[1]))
    tmap = {t["code"]: t for t in teams}
    new_cards = []
    for n, (code, jersey, i) in enumerate(picks):
        t = tmap[code]
        typ, region, det = fetch_card_data(pk[i]["name"])
        a, d, v = cand[i][1]
        nm = display(sp[i]["name"])
        card = {
            "id": maxid + 1 + n, "name": nm, "type": typ, "origin": "plantel", "region": region,
            "img": f"stickers/{slugname(nm)}_{maxid + 1 + n:03d}.png",
            "country": t["flag"], "countryName": t["name"], "ata": a, "def": d, "vel": v, "countryCode": code,
            "pokeapi_details": det, "football": {},
        }
        new_cards.append(card)
        slots_of[code][jersey] = card
        print(f"  #{card['id']} {t['code']} {jersey:2d} {SLOTS[jersey][0]:3s} {nm}")

    # ---- 4) escribir football de TODOS (existentes + nuevos)
    for t in teams:
        for jersey, c in slots_of[t["code"]].items():
            pos, role = SLOTS[jersey]
            det = c["pokeapi_details"]
            old = c.get("football") or {}
            if old.get("position") == pos and old.get("advantage") and jersey != 12 and c.get("origin") != "plantel" and old.get("team") == t["name"] and old.get("role") == role:
                adv = old["advantage"]
            else:
                adv = advantage(jersey, c["name"], c["ata"], c["def"], c["vel"], det["height_m"], det["weight_kg"], c["id"])
            c["football"] = {"team": t["name"], "position": pos, "jersey": jersey, "role": role, "advantage": adv}
            if jersey == 12:
                c["football"]["sub"] = True
    data.extend(new_cards)
    data.sort(key=lambda p: p["id"])
    tmp = f"{ROOT}/content/pokemon.json.tmp"
    json.dump(data, open(tmp, "w"), indent=2, ensure_ascii=False)
    os.replace(tmp, f"{ROOT}/content/pokemon.json")
    print("total", len(data))


if __name__ == "__main__":
    main()
