"""
add_cards.py  —  Procesa imágenes nuevas en origin/ y agrega cards al álbum.

Uso:
    python add_cards.py

Flujo:
    1. Escanea origin/ en busca de imágenes PNG no procesadas
    2. Cropa cada imagen en stickers individuales (grid 8x4 asumido)
    3. OCR cada sticker con Tesseract (bottom 70px, stats-line detection)
    4. Corrige nombres vs diccionario Pokémon + overrides manuales
    5. Compara contra nombres existentes en pokemon.json
    6. Solo agrega Pokémon verdaderamente nuevos
    7. Renombra archivos, aplica badge, actualiza pokemon.json

Requiere: Python 3.8+, Pillow, pytesseract, rapidfuzz, Tesseract-OCR instalado
"""

import json, os, re, sys, glob
from pathlib import Path
from collections import Counter

from PIL import Image
import pytesseract
from rapidfuzz import process, fuzz

# ── Configuración ──────────────────────────────────────────────────────────

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESS_CONFIG = '--psm 7 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-'

ORIGIN_DIR = "origin"
STICKERS_DIR = "stickers"
JSON_FILE = "pokemon.json"
PROCESSED_LOG = "_origin_processed.json"  # registro de imágenes ya procesadas

COLS, ROWS = 8, 4           # grid en cada imagen origen
W, H = 1536, 1024           # dimensiones esperadas de cada imagen origen

# Badge overlay config
FONT_PATH = r"C:\Windows\Fonts\arialbd.ttf"
FONT_SIZE = 20
PAD_X, PAD_TOP, PAD_BOT = 6, 6, 10
POS_X, POS_Y, RADIUS = 4, 4, 6

STATS_PATTERN = re.compile(r'(ATA|DEF|VEL)')

# ── Diccionario de nombres Pokémon oficiales (todos en minúscula) ──────────

POKEMON_NAMES = {
    'pikachu', 'charizard', 'bulbasaur', 'mewtwo', 'scorbunny',
    'fuecoco', 'lucario', 'gardevoir', 'meowscarada', 'dragonite',
    'gyarados', 'empoleon', 'sirfetchd', 'gengar', 'lapras',
    'infernape', 'lycanroc', 'tsareena', 'haxorus', 'toxtricity',
    'aegislash', 'gallade', 'zeraora', 'luxray', 'noivern',
    'kommo-o', 'inteleon', 'decidueye', 'bisharp', 'hydreigon',
    'alcremie', 'toxapex', 'eevee', 'treecko', 'milotic',
    'aggron', 'blaziken', 'tyranitar', 'samurott', 'rillaboom',
    'talonflame', 'zacian', 'garchomp', 'cinderace', 'shaymin',
    'volcarona', 'donphan', 'aurorus', 'togekiss', 'excadrill',
    'dragapult', 'kingdra', 'salamence', 'mimikyu', 'bewear',
    'urshifu', 'squirtle', 'piplup', 'turtwig', 'riolu',
    'wooloo', 'absol', 'sobble', 'rowlet', 'mudkip',
    'dreepy', 'chespin', 'bergmite', 'drizzile', 'froslass',
    'raboot', 'helioptile', 'skorupi', 'litwick', 'falinks',
    'kleavor', 'bellibolt', 'tropius', 'corviknight', 'zorua',
    'gossifleur', 'sandygast', 'salazzle', 'greedent', 'serperior',
    'grimmsnarl', 'armarouge', 'annihilape', 'kingambit', 'braviary',
    'baxcalibur', 'heliolisk', 'zoroark', 'leafeon', 'ninetales',
    'flygon', 'vaporeon', 'greninja', 'delphox', 'rapidash',
    'feraligatr', 'roserade', 'staraptor', 'arcanine', 'toxicroak',
    'hawlucha', 'magnezone', 'weavile', 'darmanitan', 'goodra',
    'crustle', 'charmander', 'sceptile', 'ampharos', 'breloom',
    'tinkatuff', 'primarina', 'lurantis', 'dragalge', 'gholdengo',
    'electivire', 'floatzel', 'ursaluna', 'ceruledge', 'mawile',
    'tapukoko', 'quagsire', 'bellossom', 'hatterene', 'jellicent',
    'conkeldurr', 'dusknoir', 'vikavolt', 'komala', 'reuniclus',
    'pangoro',
}

MANUAL_OVERRIDES = {
    13: 'sirfetchd', 26: 'kommo-o', 31: 'alcremie', 35: 'milotic',
    45: 'shaymin', 47: 'donphan', 48: 'aurorus', 49: 'togekiss',
    50: 'excadrill', 52: 'kingdra', 55: 'bewear', 56: 'urshifu',
    66: 'dreepy', 76: 'kleavor', 91: 'baxcalibur', 109: 'darmanitan',
    120: 'gholdengo', 123: 'ursaluna', 126: 'tapukoko',
    20: 'toxtricity', 17: 'lycanroc', 29: 'bisharp',
}

# ── Funciones ──────────────────────────────────────────────────────────────

def set_tesseract_path():
    if os.path.exists(TESSERACT_PATH):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
    else:
        print(f"ADVERTENCIA: Tesseract no encontrado en {TESSERACT_PATH}")


def load_processed():
    if os.path.exists(PROCESSED_LOG):
        with open(PROCESSED_LOG) as f:
            return set(json.load(f))
    return set()


def save_processed(processed):
    with open(PROCESSED_LOG, 'w') as f:
        json.dump(sorted(processed), f, indent=2)


def load_existing_data():
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, encoding='utf-8') as f:
            return json.load(f)
    return []


def save_data(data):
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Guardados {len(data)} Pokémon en {JSON_FILE}")


def crop_grid(image_path, sheet_id):
    """Cropea una imagen de grid 8×4 en 32 stickers individuales."""
    img = Image.open(image_path)
    w, h = img.size
    cw, ch = w // COLS, h // ROWS
    results = []

    for row in range(ROWS):
        for col in range(COLS):
            left = col * cw
            upper = row * ch
            box = (left, upper, left + cw, upper + ch)
            crop = img.crop(box)
            pos = row * COLS + col + 1
            filename = f"_temp_{sheet_id}_{pos:02d}.png"
            crop.save(filename)
            results.append((filename, pos))

    return results


def extract_name_from_ocr(raw_text):
    """Extrae el nombre del texto OCR usando stats-line detection."""
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]

    stats_idx = None
    for i, line in enumerate(lines):
        if STATS_PATTERN.search(line.upper()):
            stats_idx = i
            break

    if stats_idx is not None:
        parts = lines[:stats_idx]
    else:
        parts = lines

    name = ' '.join(parts)
    name = re.sub(r'[^a-zA-Z\s-]', '', name)
    name = name.strip().lower()
    name = re.sub(r'\s+', '', name)
    return name


def ocr_sticker(image_path):
    """Lee el nombre de un sticker usando Tesseract OCR."""
    img = Image.open(image_path)
    bottom = img.crop((0, img.height - 70, img.width, img.height))
    w, h = bottom.size
    bottom_large = bottom.resize((w * 3, h * 3), Image.LANCZOS)
    text = pytesseract.image_to_string(bottom_large, config=TESS_CONFIG)
    return extract_name_from_ocr(text)


def correct_name(raw_name):
    """Corrige nombre OCR vs diccionario Pokémon usando fuzzy matching."""
    cleaned = raw_name.strip().lower()
    if not cleaned:
        return None

    if cleaned in POKEMON_NAMES:
        return cleaned

    # fuzzy match con threshold alto
    match, score, _ = process.extractOne(cleaned, POKEMON_NAMES, scorer=fuzz.ratio)
    if score >= 80:
        return match

    # Intentar substring match
    for poke in POKEMON_NAMES:
        if cleaned in poke or poke in cleaned:
            return poke

    return cleaned  # devolver raw si no se pudo corregir


def apply_badge(img_path, number):
    """Aplica badge numerado en la esquina superior izquierda."""
    from PIL import ImageDraw, ImageFont

    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    img = Image.open(img_path).convert('RGBA')
    text = f"{number:03d}"

    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    bw, bh = tw + PAD_X * 2, th + PAD_TOP + PAD_BOT

    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle(
        [POS_X, POS_Y, POS_X + bw, POS_Y + bh],
        radius=RADIUS, fill=(0, 0, 0, 180)
    )
    tx = POS_X + (bw - tw) // 2
    ty = POS_Y + PAD_TOP
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255))

    Image.alpha_composite(img, overlay).convert('RGB').save(img_path, 'PNG')


# ── Stats extraction (ATA/DEF/VEL) ──────────────────────────────────────

MAP_CONS = str.maketrans({'S':'5','s':'5','O':'0','o':'0','G':'6','g':'6',
                          'l':'1','I':'1','B':'8','b':'8','Z':'2','z':'2'})

MAP_AGGR = str.maketrans({'S':'5','s':'5','O':'0','o':'0','G':'6','g':'6',
                          'l':'1','I':'1','B':'8','b':'8','Z':'2','z':'2',
                          'E':'8','e':'8','A':'8','a':'8'})

def clean_stat(s, aggressive=False):
    m = MAP_AGGR if aggressive else MAP_CONS
    s = s.translate(m)
    s = re.sub(r'[^0-9]', '', s)
    if not s or len(s) > 3:
        return None
    candidates = {int(s)}
    if len(s) == 2 and s[0] == '0':
        candidates.add(int('8' + s[1]))
    for c in candidates:
        if 20 <= c <= 150:
            return c
    return None


def extract_triple(text, aggressive=False):
    for line in text.split('\n'):
        up = line.upper().strip()
        if not up:
            continue
        if not any(kw in up for kw in ['ATA', 'ATS', 'ATR', 'STA', 'AT4', '"TA', 'IA ']):
            continue
        nums = []
        for tok in re.split(r'[\s()\[\]{}\'\".,;:!?=+\\/|@#~`_*-]+', line):
            c = clean_stat(tok, aggressive)
            if c:
                nums.append(c)
        if len(nums) >= 3:
            return nums[0], nums[1], nums[2]
    return None, None, None


def get_stats(image_path):
    """Extrae ATA, DEF, VEL de un sticker usando OCR con voting."""
    img = Image.open(image_path)
    w, h = img.size
    crop = img.crop((0, h - 70, w, h))

    attempts = []
    for scale in [2, 3]:
        bw, bh = crop.size
        big = crop.resize((bw * scale, bh * scale), Image.LANCZOS)
        for psm in [3, 6]:
            text = pytesseract.image_to_string(big, config=f'--psm {psm}').strip()
            for aggressive in [False, True]:
                triple = extract_triple(text, aggressive)
                if all(v is not None for v in triple):
                    attempts.append(triple)

    if not attempts:
        return None, None, None

    counter = Counter(attempts)
    return counter.most_common(1)[0][0]


def get_existing_names(data):
    """Retorna set de nombres existentes en el JSON."""
    return {item['name'].lower() for item in data}


def get_next_id(data):
    """Retorna el próximo ID disponible."""
    if not data:
        return 1
    return max(item['id'] for item in data) + 1


def clean_temp_files():
    for f in glob.glob("_temp_*.png"):
        os.remove(f)


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    set_tesseract_path()
    processed = load_processed()
    data = load_existing_data()
    existing_names = get_existing_names(data)
    next_id = get_next_id(data)

    # 1. Encontrar imágenes nuevas en origin/
    origin_files = sorted([
        f for f in os.listdir(ORIGIN_DIR)
        if f.lower().endswith('.png') and f not in processed
    ])

    if not origin_files:
        print("No hay imágenes nuevas en origin/. Todo al día.")
        clean_temp_files()
        return

    print(f"Procesando {len(origin_files)} imagen(es) nueva(s): {origin_files}")
    new_entries = []

    for img_file in origin_files:
        img_path = os.path.join(ORIGIN_DIR, img_file)
        print(f"\n--- Procesando: {img_file} ---")

        # 2. Cropear grid
        sheet_id = img_file.replace('.png', '').replace(' ', '_')
        temp_files = crop_grid(img_path, sheet_id)
        print(f"  Creados {len(temp_files)} stickers temporales")

        added_in_sheet = 0
        for temp_path, pos in temp_files:
            # 3. OCR
            raw_name = ocr_sticker(temp_path)
            corrected = correct_name(raw_name)

            if not corrected:
                print(f"  [{pos:02d}] OCR fallido: '{raw_name}' -> saltando")
                os.remove(temp_path)
                continue

            # 4. Verificar si es nuevo
            if corrected in existing_names:
                print(f"  [{pos:02d}] {corrected} (duplicado, saltando)")
                os.remove(temp_path)
                continue

            # 5. Verificar dentro del mismo lote
            if corrected in [e['name'] for e in new_entries]:
                print(f"  [{pos:02d}] {corrected} (duplicado en mismo lote, saltando)")
                os.remove(temp_path)
                continue

            # 6. Extraer stats (ATA/DEF/VEL)
            ata, def_, vel = get_stats(temp_path)
            if not all(v is not None for v in [ata, def_, vel]):
                print(f"  [{pos:02d}] No se pudieron leer stats -> saltando")
                os.remove(temp_path)
                continue

            # 7. Crear entry
            entry = {
                "id": next_id,
                "name": corrected.title(),
                "img": "",
                "owned": False,
                "ata": ata,
                "def": def_,
                "vel": vel,
            }

            # Renombrar archivo definitivo
            final_name = f"{corrected}_{next_id:03d}.png"
            final_path = os.path.join(STICKERS_DIR, final_name)
            os.rename(temp_path, final_path)

            # Aplicar badge
            apply_badge(final_path, next_id)

            entry["img"] = final_path
            new_entries.append(entry)
            existing_names.add(corrected)

            ocr_raw = raw_name if raw_name != corrected else ""
            print(f"  [{pos:02d}] #{next_id:03d} {corrected.title()}" +
                  (f" (OCR: '{raw_name}')" if ocr_raw else ""))

            print(f"  [{pos:02d}] #{next_id:03d} {corrected.title()} ATA={ata} DEF={def_} VEL={vel}")

            next_id += 1
            added_in_sheet += 1

        # Marcar imagen como procesada
        processed.add(img_file)
        print(f"  -> {added_in_sheet} nuevo(s) Pokémon de {img_file}")

    # 7. Guardar
    if new_entries:
        data.extend(new_entries)
        save_data(data)
        save_processed(processed)
        print(f"\n✅ Agregados {len(new_entries)} Pokémon nuevo(s). Total: {len(data)}")
    else:
        print("\nNo se encontraron Pokémon nuevos.")

    clean_temp_files()
    print("Listo.")


if __name__ == '__main__':
    main()
