"""
pokeapi_data.py  —  Obtiene regiones y tipos desde PokeAPI y actualiza pokemon.json.

Usa https://pokeapi.co/ para obtener:
  - Región (species → generation → main_region)
  - Tipo(s) primario/secundario (pokemon → types)

Uso:
    python scripts/pokeapi_data.py                 # fetch regiones + tipos
    python scripts/pokeapi_data.py --regions-only  # solo regiones
    python scripts/pokeapi_data.py --types-only    # solo tipos
    python scripts/pokeapi_data.py --id 5 12       # solo ids específicos
    python scripts/pokeapi_data.py --dry-run       # mostrar sin guardar

Requiere: requests (pip install requests)
"""

import json, sys, time, argparse
import requests

POKEAPI_BASE = "https://pokeapi.co/api/v2"
JSON_FILE = "pokemon.json"

REGIONS_TRANSLATED = {
    "kanto": "Kanto", "johto": "Johto", "hoenn": "Hoenn", "sinnoh": "Sinnoh",
    "unova": "Unova", "kalos": "Kalos", "alola": "Alola", "galar": "Galar",
    "paldea": "Paldea",
}

TYPES_MAP = {
    "normal": "Normal", "fire": "Fire", "water": "Water", "electric": "Electric",
    "grass": "Grass", "ice": "Ice", "fighting": "Fighting", "poison": "Poison",
    "ground": "Ground", "flying": "Flying", "psychic": "Psychic", "bug": "Bug",
    "rock": "Rock", "ghost": "Ghost", "dragon": "Dragon", "dark": "Dark",
    "steel": "Steel", "fairy": "Fairy",
}

NAME_OVERRIDES = {
    "sirfetchd": "sirfetchd", "kommo-o": "kommo-o",
    "urshifu": "urshifu", "tinkatuff": "tinkatuff",
    "tapukoko": "tapukoko", "ninetales": "ninetales",
    "feraligatr": "feraligatr",
}

REGION_OVERRIDES = {
    "kommo-o": "Alola", "tapukoko": "Alola",
}

# Nombres que necesitan formato específico para /pokemon/ endpoint
POKEMON_API_NAMES = {
    "lycanroc": "lycanroc-midday",
    "toxtricity": "toxtricity-amped",
    "aegislash": "aegislash-shield",
    "shaymin": "shaymin-land",
    "mimikyu": "mimikyu-disguised",
    "urshifu": "urshifu-single-strike",
    "darmanitan": "darmanitan-standard",
    "tapukoko": "tapu-koko",
    "jellicent": "jellicent-male",
    "eiscue": "eiscue-ice",
    "morpeko": "morpeko-full-belly",
    "oricorio": "oricorio-baile",
    "wishiwashi": "wishiwashi-solo",
    "kommo-o": "kommo-o",
}

POKEAPI_SESSION = requests.Session()


def pokeapi_name(name):
    n = name.lower().strip()
    if n in NAME_OVERRIDES:
        return NAME_OVERRIDES[n]
    return n.replace(" ", "").replace("-", "")


def fetch_region(pokemon_name):
    api_name = pokeapi_name(pokemon_name)
    if pokeapi_name(pokemon_name) in REGION_OVERRIDES:
        return REGION_OVERRIDES[pokemon_name]
    try:
        r = POKEAPI_SESSION.get(f"{POKEAPI_BASE}/pokemon-species/{api_name}", timeout=10)
        if not r.ok:
            print(f"  [WARN] {pokemon_name}: HTTP {r.status_code}")
            return None
        data = r.json()
        gen_url = data["generation"]["url"]
        gr = POKEAPI_SESSION.get(gen_url, timeout=10)
        if not gr.ok:
            return None
        gen_data = gr.json()
        region_name = gen_data["main_region"]["name"]
        return REGIONS_TRANSLATED.get(region_name, region_name.capitalize())
    except Exception as e:
        print(f"  [ERROR] {pokemon_name}: {e}")
        return None


def fetch_types(pokemon_name):
    """Obtiene el tipo primario de un Pokémon desde PokeAPI."""
    api_name = POKEMON_API_NAMES.get(pokemon_name.lower()) or pokeapi_name(pokemon_name)
    try:
        r = POKEAPI_SESSION.get(f"{POKEAPI_BASE}/pokemon/{api_name}", timeout=10)
        if not r.ok:
            print(f"  [WARN] {pokemon_name}: HTTP {r.status_code}")
            return None
        data = r.json()
        if not data.get("types"):
            return None
        primary = None
        for t in data["types"]:
            if t["slot"] == 1:
                primary = TYPES_MAP.get(t["type"]["name"])
                break
        if not primary:
            primary = TYPES_MAP.get(data["types"][0]["type"]["name"])
        return primary
    except Exception as e:
        print(f"  [ERROR] {pokemon_name}: {e}")
        return None


def load_data():
    with open(JSON_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Guardados {len(data)} Pokémon en {JSON_FILE}")


def main():
    parser = argparse.ArgumentParser(description="Obtiene datos desde PokeAPI")
    parser.add_argument("--id", nargs="+", type=int,
                        help="IDs específicos (ej: --id 5 12)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostrar sin guardar")
    parser.add_argument("--regions-only", action="store_true",
                        help="Solo actualizar regiones")
    parser.add_argument("--types-only", action="store_true",
                        help="Solo actualizar tipos")
    args = parser.parse_args()

    data = load_data()
    target_ids = set(args.id) if args.id else None
    do_regions = not args.types_only
    do_types = not args.regions_only

    oks_r, oks_t = 0, 0

    for item in data:
        if target_ids and item["id"] not in target_ids:
            continue

        name = item["name"]
        parts = []

        if do_regions:
            region = fetch_region(name)
            if region:
                item["region"] = region
                oks_r += 1
                parts.append(f"region={region}")
            else:
                parts.append("region=???")

        if do_types:
            ptype = fetch_types(name)
            if ptype:
                item["type"] = ptype
                oks_t += 1
                parts.append(f"tipo={ptype}")
            else:
                parts.append("tipo=???")

        status = "  [" + " | ".join(parts) + "]" if parts else ""
        print(f"  #{item['id']:3d} {name:15s}{status}")

        if (item["id"] % 30) == 0:
            time.sleep(1)

    print(f"\nRegiones: {oks_r}/{len(data) if not target_ids else len(target_ids)}")
    print(f"Tipos:    {oks_t}/{len(data) if not target_ids else len(target_ids)}")
    if not args.dry_run:
        save_data(data)
    else:
        print("(dry-run: no se guardó)")


if __name__ == "__main__":
    main()
