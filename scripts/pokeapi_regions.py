"""
pokeapi_regions.py  —  Obtiene regiones Pokémon desde PokeAPI y actualiza pokemon.json.

Usa https://pokeapi.co/ para consultar la región de cada Pokémon
por su nombre (species → generation → main_region).

Uso:
    python scripts/pokeapi_regions.py              # fetch todas las regiones
    python scripts/pokeapi_regions.py --id 5 12    # fetch solo ids específicos
    python scripts/pokeapi_regions.py --dry-run    # mostrar sin guardar

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

NAME_OVERRIDES = {
    "sirfetchd": "sirfetchd",
    "kommo-o": "kommo-o",
    "urshifu": "urshifu",
    "tinkatuff": "tinkatuff",
    "tapukoko": "tapukoko",
    "ninetales": "ninetales",
    "feraligatr": "feraligatr",
}

REGION_OVERRIDES = {
    "kommo-o": "Alola",
    "tapukoko": "Alola",
}


def pokeapi_name(name):
    """Convierte nombre interno al formato que espera PokeAPI."""
    n = name.lower().strip()
    if n in NAME_OVERRIDES:
        return NAME_OVERRIDES[n]
    return n.replace(" ", "").replace("-", "")


def fetch_region(pokemon_name):
    """Obtiene la región de un Pokémon desde PokeAPI."""
    api_name = pokeapi_name(pokemon_name)
    if pokemon_name in REGION_OVERRIDES:
        return REGION_OVERRIDES[pokemon_name]

    try:
        r = requests.get(f"{POKEAPI_BASE}/pokemon-species/{api_name}", timeout=10)
        if not r.ok:
            print(f"  [WARN] {pokemon_name}: HTTP {r.status_code} para '{api_name}'")
            return None
        data = r.json()
        gen_url = data["generation"]["url"]
        gr = requests.get(gen_url, timeout=10)
        if not gr.ok:
            print(f"  [WARN] {pokemon_name}: no se pudo obtener generation")
            return None
        gen_data = gr.json()
        region_name = gen_data["main_region"]["name"]
        return REGIONS_TRANSLATED.get(region_name, region_name.capitalize())
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
    parser = argparse.ArgumentParser(description="Obtiene regiones desde PokeAPI")
    parser.add_argument("--id", nargs="+", type=int,
                        help="IDs específicos a procesar (ej: --id 5 12)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostrar resultados sin guardar")
    args = parser.parse_args()

    data = load_data()
    target_ids = set(args.id) if args.id else None
    oks = 0

    for item in data:
        if target_ids and item["id"] not in target_ids:
            continue

        name = item["name"]
        region = fetch_region(name)
        if region:
            item["region"] = region
            oks += 1
            status = ""
        else:
            status = " [SIN REGIÓN]"

        print(f"  #{item['id']:3d} {name:15s} -> {region or '???'}{status}")

        if (item["id"] % 30) == 0:
            time.sleep(1)

    print(f"\nRegiones obtenidas: {oks}/{len(data) if not target_ids else len(target_ids)}")
    if not args.dry_run:
        save_data(data)
    else:
        print("(dry-run: no se guardó)")


if __name__ == "__main__":
    main()
