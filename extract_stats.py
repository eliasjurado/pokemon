"""
extract_stats.py  —  Extrae ATA/DEF/VEL de los 136 stickers y actualiza pokemon.json.
"""

import pytesseract, re, json
from PIL import Image
from collections import Counter

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

MAP_CONS = str.maketrans({'S':'5','s':'5','O':'0','o':'0','G':'6','g':'6',
                          'l':'1','I':'1','B':'8','b':'8','Z':'2','z':'2'})

MAP_AGGR = str.maketrans({'S':'5','s':'5','O':'0','o':'0','G':'6','g':'6',
                          'l':'1','I':'1','B':'8','b':'8','Z':'2','z':'2',
                          'E':'8','e':'8','A':'8','a':'8'})

def clean(s, aggressive=False):
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
            c = clean(tok, aggressive)
            if c:
                nums.append(c)
        if len(nums) >= 3:
            return nums[0], nums[1], nums[2]
    return None, None, None

def get_stats(img_path):
    img = Image.open(img_path)
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


# ── Main ───────────────────────────────────────────────────────────────────

with open('pokemon.json', encoding='utf-8') as f:
    data = json.load(f)

oks = 0
for item in data:
    ata, def_, vel = get_stats(item['img'])
    if all(v is not None for v in [ata, def_, vel]):
        item['ata'] = ata
        item['def'] = def_
        item['vel'] = vel
        oks += 1
    else:
        print(f'FAIL: #{item["id"]:03d} {item["name"]} ({item["img"]})')

with open('pokemon.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'\nStats extraídos: {oks}/{len(data)}')
print('pokemon.json actualizado.')
