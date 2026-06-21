"""
pokeapi_details.py — Fetches flavor text, full stats, abilities, height, weight,
evolution chain, and sprites from PokeAPI. Adds a 'pokeapi_details' field to
each pokemon.json entry.

Usage:
    python scripts/pokeapi_details.py              # fetch all missing
    python scripts/pokeapi_details.py --id 5 12    # specific IDs
    python scripts/pokeapi_details.py --dry-run    # show without saving
"""

import json, sys, time, argparse, requests

POKEAPI_BASE = "https://pokeapi.co/api/v2"
JSON_FILE = "pokemon.json"
SESSION = requests.Session()

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

NAME_OVERRIDES = {
    "sirfetchd": "sirfetchd", "kommo-o": "kommo-o",
    "urshifu": "urshifu", "tinkatuff": "tinkatuff",
    "tapukoko": "tapukoko", "ninetales": "ninetales",
    "feraligatr": "feraligatr",
}


def pokeapi_name(name):
    n = name.lower().strip()
    if n in NAME_OVERRIDES:
        return NAME_OVERRIDES[n]
    return n.replace(" ", "").replace("-", "")


def get_api_name(name):
    return POKEMON_API_NAMES.get(name.lower()) or pokeapi_name(name)


def fetch_details(pokemon_name):
    """Fetch all details from PokeAPI for a single Pokémon."""
    api_name = get_api_name(pokemon_name)
    result = {}

    try:
        # pokemon endpoint: stats, abilities, height, weight, id, sprites
        r = SESSION.get(f"{POKEAPI_BASE}/pokemon/{api_name}", timeout=15)
        if not r.ok:
            print(f"  [WARN] {pokemon_name}: /pokemon/ HTTP {r.status_code}")
            return None
        pdata = r.json()

        pokeapi_id = pdata["id"]
        result["id"] = pokeapi_id
        result["height_m"] = round(pdata["height"] / 10, 1)
        result["weight_kg"] = round(pdata["weight"] / 10, 1)
        result["abilities"] = [a["ability"]["name"] for a in pdata["abilities"]]
        result["stats_full"] = {s["stat"]["name"]: s["base_stat"] for s in pdata["stats"]}

        # species endpoint: flavor text, genus, evolution chain
        sr = SESSION.get(f"{POKEAPI_BASE}/pokemon-species/{pokeapi_id}", timeout=15)
        if sr.ok:
            sdata = sr.json()

            # flavor text: Spanish preferred, English fallback
            esp = [f["flavor_text"] for f in sdata["flavor_text_entries"]
                   if f["language"]["name"] == "es"]
            eng = [f["flavor_text"] for f in sdata["flavor_text_entries"]
                   if f["language"]["name"] == "en"]
            if esp:
                result["flavor"] = esp[0].replace("\n", " ").replace("\f", " ")
            elif eng:
                result["flavor"] = eng[0].replace("\n", " ").replace("\f", " ")

            # genus: Spanish preferred
            gens = sdata.get("genera", [])
            esp_gen = [g["genus"] for g in gens if g["language"]["name"] == "es"]
            eng_gen = [g["genus"] for g in gens if g["language"]["name"] == "en"]
            if esp_gen:
                result["genus"] = esp_gen[0]
            elif eng_gen:
                result["genus"] = eng_gen[0]

            # evolution chain
            evo_url = sdata.get("evolution_chain", {}).get("url")
            if evo_url:
                result["evolution_chain"] = fetch_evolution_chain(evo_url, pokeapi_id)
        else:
            print(f"  [WARN] {pokemon_name}: /pokemon-species/ HTTP {sr.status_code}")

        result["pokemon_api_name"] = api_name
        print(f"  OK #{result['id']:4d} {api_name:25s} evos={result.get('evolution_chain','?')}")

        return result
    except Exception as e:
        print(f"  [ERROR] {pokemon_name}: {e}")
        return None


def fetch_evolution_chain(evo_url, current_id):
    """Flatten evolution chain into a list of [name, pokeapi_id] pairs."""
    try:
        r = SESSION.get(evo_url, timeout=15)
        if not r.ok:
            return None
        chain_data = r.json()

        # Walk the chain to build a flat list, find which branch has our Pokémon
        chain = chain_data["chain"]

        def walk(c, depth=0):
            """Recursively collect [[name, id, depth], ...]."""
            name = c["species"]["name"]
            # Get the ID from the species URL
            species_url = c["species"]["url"]
            sid = int(species_url.rstrip("/").split("/")[-1])
            nodes = [[name, sid, depth]]
            for child in c.get("evolves_to", []):
                nodes.extend(walk(child, depth + 1))
            return nodes

        all_nodes = walk(chain)

        # Find the branch that contains current_id
        current_depth = None
        for n in all_nodes:
            if n[1] == current_id:
                current_depth = n[2]
                break

        if current_depth is None:
            # Current Pokémon not in chain (shouldn't happen), return linear
            return [[n[0], n[1]] for n in all_nodes]

        # For branching chains (like Eevee), collect pre-evolutions and
        # all evolutions from current depth forward
        result = []
        for d in range(0, current_depth + 1):
            nodes_at_depth = [n for n in all_nodes if n[2] == d]
            result.append([[n[0], n[1]] for n in nodes_at_depth])

        return result
    except Exception as e:
        print(f"  [ERROR] evolution chain: {e}")
        return None


def load_data():
    with open(JSON_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nGuardados {len(data)} Pokémon en {JSON_FILE}")


def main():
    parser = argparse.ArgumentParser(description="Obtiene detalles desde PokeAPI")
    parser.add_argument("--id", nargs="+", type=int, help="IDs específicos")
    parser.add_argument("--dry-run", action="store_true", help="Mostrar sin guardar")
    parser.add_argument("--force", action="store_true", help="Refetch incluso si ya tiene datos")
    args = parser.parse_args()

    data = load_data()
    target_ids = set(args.id) if args.id else None
    ok = 0

    for item in data:
        if target_ids and item["id"] not in target_ids:
            continue

        # Skip if already has details and not forced
        if not args.force and item.get("pokeapi_details") and item["pokeapi_details"].get("id"):
            continue

        name = item["name"]

        details = fetch_details(name)
        if details:
            item["pokeapi_details"] = details
            ok += 1

        if (item["id"] % 20) == 0:
            time.sleep(0.5)

    print(f"\nDetalles: {ok}/{len(data) if not target_ids else len(target_ids)}")
    if not args.dry_run:
        save_data(data)
    else:
        print("(dry-run: no se guardó)")


if __name__ == "__main__":
    main()
