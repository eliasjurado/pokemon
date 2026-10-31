"""
recrop_stickers.py — Re-recorta los cromos #137-#215 desde las hojas de origin/.

Problema original: process.py cortaba las hojas con una rejilla uniforme 192x256, pero las
tarjetas reales miden ~180 px de ancho y sus filas tienen alturas distintas (258/246/246/228),
así que a partir del #137 los recortes salían desfasados: se veía el número impreso de la hoja
("002") asomando bajo la insignia, y en las filas bajas se cortaba la base de la tarjeta.

Solución: detectar el borde plateado de cada tarjeta (picos de píxeles claros y poco saturados),
recortar la caja exacta + 2 px de margen y estampar una insignia que cubre por completo el número impreso.

Uso:  python3 scripts/recrop_stickers.py            # re-recorta y renombra según content/pokemon.json
      python3 scripts/recrop_stickers.py --dry-run
Entradas: scripts/sticker-sources.json (id -> hoja + posición 1..32, verificado por coincidencia de píxeles).
"""
import json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGIN = os.path.join(ROOT, "origin")
OUT = os.path.join(ROOT, "public", "stickers")
FONT = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
PAD = 2
# Bordes esperados de la rejilla de tarjetas (las hojas son 1536x1024, 8x4)
EXP_X = [(11, 190), (202, 381), (392, 571), (582, 762), (773, 951), (962, 1142), (1153, 1333), (1344, 1524)]
EXP_Y = [(8, 266), (276, 522), (533, 779), (790, 1018)]


def peaks(v, th):
    idx = [i for i in range(1, len(v) - 1) if v[i] >= th and v[i] >= v[i - 1] and v[i] >= v[i + 1]]
    out = []
    for i in idx:
        if not out or i - out[-1] > 6:
            out.append(i)
    return out


def card_boxes(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(int)
    sil = (a.min(2) > 150) & (a.max(2) - a.min(2) < 40)
    px, py = peaks(sil.sum(0), 200), peaks(sil.sum(1), 500)
    snap = lambda e, ps: min(ps, key=lambda q: abs(q - e)) if ps and min(abs(q - e) for q in ps) <= 8 else e
    xs = [(snap(l, px), snap(r, px)) for l, r in EXP_X]
    ys = [(snap(t, py), snap(b, py)) for t, b in EXP_Y]
    return im, xs, ys


def badge(img, number):
    font = ImageFont.truetype(FONT, 22)
    img = img.convert("RGBA")
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rounded_rectangle([3, 3, 60, 46], radius=8, fill=(0, 0, 0, 245))
    text = f"{number:03d}"
    x0, y0, x1, y1 = font.getbbox(text)
    d.text((3 + (57 - (x1 - x0)) // 2 - x0, 3 + (43 - (y1 - y0)) // 2 - y0), text, font=font, fill=(255, 255, 255))
    return Image.alpha_composite(img, ov).convert("RGB")


def slug(name):
    return re.sub(r"[^a-z0-9-]+", "", name.lower().replace(" ", ""))


def main():
    dry = "--dry-run" in sys.argv
    src = json.load(open(os.path.join(ROOT, "scripts", "sticker-sources.json")))
    data = json.load(open(os.path.join(ROOT, "content", "pokemon.json")))
    byid = {p["id"]: p for p in data}
    cache = {}
    for sid, s in sorted(src.items(), key=lambda kv: int(kv[0])):
        i = int(sid)
        p = byid[i]
        if s["sheet"] not in cache:
            cache[s["sheet"]] = card_boxes(os.path.join(ORIGIN, s["sheet"]))
        im, xs, ys = cache[s["sheet"]]
        r, c = divmod(s["pos"] - 1, 8)
        (l, rr), (t, b) = xs[c], ys[r]
        box = (max(0, l - PAD), max(0, t - PAD), min(im.width, rr + 1 + PAD), min(im.height, b + 1 + PAD))
        tile = badge(im.crop(box), i)
        name = f"{slug(p['name'])}_{i:03d}.png"
        old = os.path.join(ROOT, "public", p["img"])
        print(f"#{i:3d} {p['name']:12s} {tile.size} -> {name}")
        if dry:
            continue
        tile.save(os.path.join(OUT, name), optimize=True)
        if os.path.basename(old) != name and os.path.exists(old):
            os.remove(old)
        p["img"] = f"stickers/{name}"
    if not dry:
        json.dump(data, open(os.path.join(ROOT, "content", "pokemon.json"), "w"), indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
