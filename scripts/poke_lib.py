"""poke_lib.py — utilidades compartidas: PokeAPI -> estructura `pokeapi_details` del álbum (misma forma que pokeapi_details.py)."""
import json, os, re, time
import requests

API = "https://pokeapi.co/api/v2"
S = requests.Session()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN_REGION = {"i": "Kanto", "ii": "Johto", "iii": "Hoenn", "iv": "Sinnoh", "v": "Unova", "vi": "Kalos", "vii": "Alola", "viii": "Galar", "ix": "Paldea"}


def get(url):
    for i in range(4):
        try:
            r = S.get(url, timeout=20)
            if r.ok:
                return r.json()
        except requests.RequestException:
            pass
        time.sleep(1 + i)
    raise RuntimeError(f"PokeAPI no responde: {url}")


def chain_up_to(chain_url, cur_id):
    """Cadena evolutiva aplanada hasta el nivel del Pokémon actual (igual que pokeapi_details.py)."""
    c = get(chain_url)["chain"]
    nodes = []

    def walk(n, depth):
        nodes.append([n["species"]["name"], int(n["species"]["url"].rstrip("/").split("/")[-1]), depth])
        for ch in n["evolves_to"]:
            walk(ch, depth + 1)

    walk(c, 0)
    cur = next((n[2] for n in nodes if n[1] == cur_id), None)
    if cur is None:
        return [[[n[0], n[1]] for n in nodes]]
    return [[[n[0], n[1]] for n in nodes if n[2] == d] for d in range(cur + 1)]


def fetch_card_data(api_name):
    """Devuelve (type, region, pokeapi_details) para un nombre de PokeAPI (p. ej. 'torkoal', 'corsola-galar')."""
    p = get(f"{API}/pokemon/{api_name}")
    sp = get(p["species"]["url"])
    sid = sp["id"]
    es = [f["flavor_text"] for f in sp["flavor_text_entries"] if f["language"]["name"] == "es"]
    gen = [g["genus"] for g in sp["genera"] if g["language"]["name"] == "es"]
    det = {
        "id": p["id"],
        "height_m": round(p["height"] / 10, 1),
        "weight_kg": round(p["weight"] / 10, 1),
        "abilities": [a["ability"]["name"] for a in p["abilities"]],
        "stats_full": {s["stat"]["name"]: s["base_stat"] for s in p["stats"]},
    }
    if es:
        det["flavor"] = es[0].replace("\n", " ").replace("\f", " ")
    if gen:
        det["genus"] = gen[0]
    det["evolution_chain"] = chain_up_to(sp["evolution_chain"]["url"], sid)
    det["pokemon_api_name"] = api_name
    t = p["types"][0]["type"]["name"].capitalize()
    region = GEN_REGION.get(sp["generation"]["name"].split("-")[1])
    return t, region, det
