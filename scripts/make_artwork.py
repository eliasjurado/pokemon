"""
make_artwork.py — Descarga el artwork oficial (PokeAPI/sprites: other/official-artwork/<id>.png) de cada
cromo provisional (origin == "plantel") y lo guarda como public/artwork/<id>.webp (~400 px, <= 40 KB).

Uso: python3 scripts/make_artwork.py
"""
import io, json, os, sys
import requests
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{}.png"
OUT = os.path.join(ROOT, "public", "artwork")
MAX_BYTES = 40 * 1024


def encode(im):
    for size in (400, 380, 360, 340, 320):
        w = im.resize((size, size), Image.LANCZOS) if im.size != (size, size) else im
        for q in (82, 74, 66, 58, 50, 42):
            b = io.BytesIO()
            w.save(b, "WEBP", quality=q, method=6)
            if b.tell() <= MAX_BYTES:
                return b.getvalue()
    return b.getvalue()


def main():
    os.makedirs(OUT, exist_ok=True)
    data = json.load(open(os.path.join(ROOT, "content", "pokemon.json")))
    ids = sorted({p["pokeapi_details"]["id"] for p in data if p.get("origin") == "plantel"})
    for i in ids:
        dest = os.path.join(OUT, f"{i}.webp")
        if os.path.exists(dest):
            continue
        r = requests.get(URL.format(i), timeout=30)
        r.raise_for_status()
        im = Image.open(io.BytesIO(r.content)).convert("RGBA")
        bbox = im.getbbox()
        if bbox:  # recorta el vacío transparente y deja un cuadrado centrado
            im = im.crop(bbox)
            s = max(im.size)
            sq = Image.new("RGBA", (s, s), (0, 0, 0, 0))
            sq.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
            im = sq
        buf = encode(im)
        open(dest, "wb").write(buf)
        print(f"{i}.webp {len(buf) // 1024} KB")


if __name__ == "__main__":
    main()
