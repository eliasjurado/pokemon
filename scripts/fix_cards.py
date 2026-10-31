"""
fix_cards.py — Parte A (spec 031): corrige datos de cromos existentes contra lo que MUESTRA el arte.

  * scripts/art-truth.json: por cada id, el código de país impreso en el cromo y (si el OCR original
    falló) el nombre real que dice la placa. Se transcribió mirando cada cromo (hojas de contacto).
  * Corrige nombre -> vuelve a pedir tipo/región/detalles a PokeAPI cuando el nombre cambia.
  * País/bandera/nombre del país en ESPAÑOL (content/teams.json) a partir del código del arte.
  * "Agente libre / Desconocido" desaparece: toda tarjeta tiene país impreso.
Equipo/posición/dorsal los recalcula build_squads.py (necesita el plantel completo).

Uso: python3 scripts/fix_cards.py [--offline]
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from poke_lib import fetch_card_data, ROOT

API_NAME = {"corsola": "corsola-galar", "kangaskhan": "kangaskhan", "orbeetle": "orbeetle"}


def main():
    data = json.load(open(f"{ROOT}/content/pokemon.json"))
    truth = json.load(open(f"{ROOT}/scripts/art-truth.json"))
    teams = {t["code"]: t for t in json.load(open(f"{ROOT}/content/teams.json"))}
    log = []
    for p in data:
        t = truth[str(p["id"])]
        if "name" in t and t["name"].lower() != p["name"].lower():
            old = p["name"]
            p["name"] = t["name"]
            api = API_NAME.get(t["name"].lower(), t["name"].lower())
            typ, region, det = fetch_card_data(api)
            p["type"], p["region"], p["pokeapi_details"] = typ, region, det
            if api == "corsola-galar":
                p["region"] = "Galar"
            log.append(f"#{p['id']}: nombre '{old}' -> '{t['name']}' (PokeAPI #{det['id']}, {typ}, {region})")
        team = teams[t["code"]]
        if (p["countryCode"], p["countryName"]) != (t["code"], team["name"]):
            log.append(f"#{p['id']} {p['name']}: país {p['countryCode']}/{p['countryName']} -> {t['code']}/{team['name']}")
        p["countryCode"], p["countryName"], p["country"] = t["code"], team["name"], team["flag"]
    json.dump(data, open(f"{ROOT}/content/pokemon.json", "w"), indent=2, ensure_ascii=False)
    print("\n".join(log))
    print(f"{len(log)} cambios")


if __name__ == "__main__":
    main()
