"""
process.py  —  Pipeline único para extraer datos de stickers Pokémon.

Procesa imágenes nuevas en origin/ o re-procesa stickers existentes.
Por cada sticker extrae: nombre, código de país FIFA, stats (ATA/DEF/VEL)
y aplica badge numerado.

Uso:
    python scripts/process.py                          # origin/ grid 8x4
    python scripts/process.py --grid 5x2               # grid 5x2
    python scripts/process.py --restats                # re-extraer stats existentes
    python scripts/process.py --recountries            # re-extraer países existentes
"""

import json, os, re, sys, glob
from pathlib import Path
from collections import Counter

from PIL import Image, ImageDraw, ImageFont
import pytesseract
from rapidfuzz import process as fuzz_process, fuzz

# ── Configuración ──────────────────────────────────────────────────────────

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
ORIGIN_DIR = "origin"
STICKERS_DIR = "stickers"
JSON_FILE = "pokemon.json"
PROCESSED_LOG = "_origin_processed.json"

W, H = 1536, 1024
COLS, ROWS = 8, 4
BATCH = 10

FONT_PATH = r"C:\Windows\Fonts\arialbd.ttf"
FONT_SIZE = 20
PAD_X, PAD_TOP, PAD_BOT = 6, 6, 10
POS_X, POS_Y, RADIUS = 4, 4, 6

STATS_PATTERN = re.compile(r'(ATA|DEF|VEL)')

# ── Diccionario Pokémon ──────────────────────────────────────────────────────

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
    # Más Pokémon (comunes adicionales)
    'mismagius', 'stantler', 'wishiwashi', 'exeggutor', 'onix',
    'vileplume', 'makuhita', 'hariyama', 'absol', 'zangoose',
    'seviper', 'sharpedo', 'wailmer', 'wailord', 'spoink',
    'grumpig', 'cacnea', 'cacturne', 'corsola', 'remoraid',
    'octillery', 'delibird', 'mantine', 'skarmory', 'houndour',
    'houndoom', 'phanpy', 'donphan', 'gligar', 'steelix',
    'sneasel', 'teddiursa', 'ursaring', 'larvitar', 'pupitar',
    'chatot', 'bronzor', 'bronzong', 'gible', 'gabite',
    'riolu', 'lucario', 'hippopotas', 'hippowdon', 'skorupi',
    'drapion', 'croagunk', 'toxicroak', 'carnivine', 'finneon',
    'lumineon', 'snover', 'abomasnow', 'rotom', 'uxie',
    'mesprit', 'azelf', 'heatran', 'regigigas', 'giratina',
    'darkrai', 'shaymin', 'arceus', 'victini', 'snivy',
    'servine', 'serperior', 'tepig', 'pignite', 'emboar',
    'oshawott', 'dewott', 'samurott', 'patrat', 'watchog',
    'lillipup', 'herdier', 'stoutland', 'purrloin', 'liepard',
    'pansage', 'simisage', 'pansear', 'simisear', 'panpour',
    'simipour', 'munna', 'musharna', 'pidove', 'tranquill',
    'unfezant', 'blitzle', 'zebstrika', 'roggenrola', 'boldore',
    'gigalith', 'woobat', 'swoobat', 'drilbur', 'excadrill',
    'audino', 'timburr', 'gurdurr', 'conkeldurr', 'tympole',
    'palpitoad', 'seismitoad', 'throh', 'sawk', 'sewaddle',
    'swadloon', 'leavanny', 'venipede', 'whirlipede', 'scolipede',
    'cottonee', 'whimsicott', 'petilil', 'lilligant', 'basculin',
    'sandile', 'krokorok', 'krookodile', 'darumaka', 'darmanitan',
    'maractus', 'dwebble', 'crustle', 'scraggy', 'scrafty',
    'sigilyph', 'yamask', 'cofagrigus', 'tirtouga', 'carracosta',
    'archen', 'archeops', 'trubbish', 'garbodor', 'zorua',
    'zoroark', 'minccino', 'cinccino', 'gothita', 'gothorita',
    'gothitelle', 'solosis', 'duosion', 'reuniclus', 'ducklett',
    'swanna', 'vanillite', 'vanillish', 'vanilluxe', 'deerling',
    'sawsbuck', 'emolga', 'karrablast', 'escavalier', 'foongus',
    'amoonguss', 'frillish', 'jellicent', 'alomomola', 'joltik',
    'galvantula', 'ferroseed', 'ferrothorn', 'klink', 'klang',
    'klinklang', 'tynamo', 'eelektrik', 'eelektross', 'elgyem',
    'beheeyem', 'litwick', 'lampent', 'chandelure', 'axew',
    'fraxure', 'haxorus', 'cubchoo', 'beartic', 'cryogonal',
    'shelmet', 'accelgor', 'stunfisk', 'mienfoo', 'mienshao',
    'druddigon', 'golett', 'golurk', 'pawniard', 'bisharp',
    'bouffalant', 'rufflet', 'braviary', 'vullaby', 'mandibuzz',
    'heatmor', 'durant', 'deino', 'zweilous', 'hydreigon',
    'larvesta', 'volcarona', 'cobalion', 'terrakion', 'virizion',
    'tornadus', 'thundurus', 'reshiram', 'zekrom', 'landorus',
    'kyurem', 'aipom', 'yanma', 'murkrow', 'misdreavus',
    'girafarig', 'pineco', 'forretress', 'dunsparce', 'slugma',
    'magcargo', 'swinub', 'piloswine', 'mamoswine', 'porygon',
    'porygon2', 'porygonz', 'stantler', 'smeargle', 'raikou',
    'entei', 'suicune', 'lugia', 'hooh', 'celebi',
    'treecko', 'grovyle', 'sceptile', 'torchic', 'combusken',
    'blaziken', 'mudkip', 'marshtomp', 'swampert', 'poochyena',
    'mightyena', 'zigzagoon', 'linoone', 'wingull', 'pelipper',
    'ralts', 'kirlia', 'gardevoir', 'gallade', 'surskit',
    'masquerain', 'shroomish', 'breloom', 'slakoth', 'vigoroth',
    'slaking', 'nincada', 'ninjask', 'shedinja', 'whismur',
    'loudred', 'exploud', 'meditite', 'medicham', 'electrike',
    'manectric', 'plusle', 'minun', 'volbeat', 'illumise',
    'swablu', 'altaria', 'barboach', 'whiscash', 'shuppet',
    'banette', 'duskull', 'dusclops', 'dusknoir', 'tropius',
    'chingling', 'chimecho', 'wobbuffet', 'wynaut',
    'snorunt', 'glalie', 'froslass', 'spheal', 'sealeo',
    'walrein', 'clamperl', 'huntail', 'gorebyss', 'relicanth',
    'luvdisc', 'bagon', 'shelgon', 'salamence', 'beldum',
    'metang', 'metagross', 'regirock', 'regice', 'registeel',
    'latias', 'latios', 'kyogre', 'groudon', 'rayquaza',
    'jirachi', 'deoxys', 'mamoswine', 'fletchling', 'fletchinder',
    'talonflame', 'scatterbug', 'spewpa', 'vivillon', 'litleo',
    'pyroar', 'flabebe', 'floette', 'florges', 'skiddo',
    'gogoat', 'pancham', 'pangoro', 'furfrou', 'espurr',
    'meowstic', 'honedge', 'doublade', 'aegislash', 'spritzee',
    'aromatisse', 'swirlix', 'slurpuff', 'inkay', 'malamar',
    'binacle', 'barbaracle', 'skrelp', 'dragalge', 'clauncher',
    'clawitzer', 'helioptile', 'heliolisk', 'tyrunt', 'tyrantrum',
    'amaura', 'aurorus', 'sylveon', 'hawlucha', 'dedenne',
    'carbink', 'goomy', 'sliggoo', 'goodra', 'klefki',
    'phantump', 'trevenant', 'pumpkaboo', 'gourgeist', 'bergmite',
    'avalugg', 'noibat', 'noivern', 'xerneas', 'yveltal',
    'zygarde', 'diancie', 'hoopa', 'volcanion', 'rowlet',
    'dartrix', 'decidueye', 'litten', 'torracat', 'incineroar',
    'popplio', 'brionne', 'primarina', 'pikipek', 'trumbeak',
    'toucannon', 'yungoos', 'gumshoos', 'grubbin', 'charjabug',
    'vikavolt', 'crabrawler', 'crabominable', 'oricorio', 'cutiefly',
    'ribombee', 'rockruff', 'lycanroc', 'wishiwashi', 'mareanie',
    'toxapex', 'mudbray', 'mudsdale', 'dewpider', 'araquanid',
    'fomantis', 'lurantis', 'morelull', 'shiinotic', 'salandit',
    'salazzle', 'stufful', 'bewear', 'bounsweet', 'steenee',
    'tsareena', 'comfey', 'oranguru', 'passimian', 'wimpod',
    'golisopod', 'sandygast', 'palossand', 'pyukumuku', 'typenull',
    'silvally', 'minior', 'komala', 'turtonator', 'togedemaru',
    'mimikyu', 'bruxish', 'drampa', 'dhelmise', 'jangmoo',
    'hakamoo', 'kommoo', 'tapukoko', 'tapulele', 'tapubulu',
    'tapufini', 'cosmog', 'cosmoem', 'solgaleo', 'lunala',
    'nihilego', 'buzzwole', 'pheromosa', 'xurkitree', 'celesteela',
    'kartana', 'guzzlord', 'necrozma', 'magearna', 'marshadow',
    'poipole', 'naganadel', 'stakataka', 'blacephalon', 'zeraora',
    'meltan', 'melmetal', 'grookey', 'thwackey', 'rillaboom',
    'scorbunny', 'raboot', 'cinderace', 'sobble', 'drizzile',
    'inteleon', 'blipbug', 'dottler', 'orbeetle', 'rookidee',
    'corvisquire', 'corviknight', 'skwovet', 'greedent', 'nickit',
    'thievul', 'yamper', 'boltund', 'gossifleur', 'eldegoss',
    'chewtle', 'drednaw', 'arrokuda', 'barraskewda', 'toxel',
    'toxtricity', 'sizzlipede', 'centiskorch', 'clobbopus',
    'grapploct', 'sinistea', 'polteageist', 'hatenna', 'hattrem',
    'hatterene', 'impidimp', 'morgrem', 'grimmsnarl', 'obstagoon',
    'perrserker', 'cursola', 'sirfetchd', 'mrrime', 'runerigus',
    'milcery', 'alcremie', 'falinks', 'pincurchin', 'snom',
    'frosmoth', 'stonjourner', 'eiscue', 'indeedee', 'morpeko',
    'cufant', 'copperajah', 'dracozolt', 'arctozolt', 'dracovish',
    'arctovish', 'duraludon', 'draclaw', 'dragapult',
    'dragapult', 'zacian', 'zamazenta', 'eternatus', 'kubfu',
    'urshifu', 'zarude', 'regieleki', 'regidrago', 'glastrier',
    'spectrier', 'calyrex', 'sprigatito', 'floragato', 'meowscarada',
    'fuecoco', 'crocalor', 'skeledirge', 'quaxly', 'quaxwell',
    'quaquaval', 'lechonk', 'oinkologne', 'tarountula', 'spidops',
    'nymble', 'lokix', 'pawmi', 'pawmo', 'pawmot',
    'tandemaus', 'maushold', 'fidough', 'dachsbun', 'smoliv',
    'dolliv', 'arboliva', 'squawkabilly', 'nacli', 'naclstack',
    'garganacl', 'charcadet', 'armarouge', 'ceruledge', 'tadbulb',
    'bellibolt', 'wattrel', 'kilowattrel', 'maschiff', 'mabosstiff',
    'shroodle', 'grafaiai', 'bramblin', 'brambleghast', 'toedscool',
    'toedscruel', 'klawf', 'capsakid', 'scovillain', 'rellor',
    'rabsca', 'flittle', 'espathra', 'tinkatink', 'tinkatuff',
    'tinkaton', 'wiglett', 'wugtrio', 'bombirdier', 'finizen',
    'palafin', 'varoom', 'revavroom', 'cyclizar', 'orthworm',
    'glimmet', 'glimmora', 'greavard', 'houndstone', 'flamigo',
    'cetoddle', 'cetitan', 'veluza', 'dondozo', 'tatsugiri',
    'annihilape', 'clodsire', 'farigiraf', 'dudunsparce', 'kingambit',
    'greattusk', 'screamtail', 'brutebonnet', 'fluttermane',
    'slitherwing', 'sandyshocks', 'irontreads', 'ironbundle',
    'ironhands', 'ironjugulis', 'ironmoth', 'ironthorns',
    'frigibax', 'arctibax', 'baxcalibur', 'gimmighoul', 'gholdengo',
    'wochien', 'chienpao', 'tinglu', 'chiyu', 'roaringmoon',
    'ironvaliant', 'koraidon', 'miraidon', 'walkingwake',
    'ironleaves', 'ogerpon', 'okidogi', 'munkidori', 'fezandipiti',
    'meloetta', 'thundurus',
}

MANUAL_OVERRIDES = {
    13: 'sirfetchd', 26: 'kommo-o', 31: 'alcremie', 35: 'milotic',
    45: 'shaymin', 47: 'donphan', 48: 'aurorus', 49: 'togekiss',
    50: 'excadrill', 52: 'kingdra', 55: 'bewear', 56: 'urshifu',
    66: 'dreepy', 76: 'kleavor', 91: 'baxcalibur', 109: 'darmanitan',
    120: 'gholdengo', 123: 'ursaluna', 126: 'tapukoko',
    20: 'toxtricity', 17: 'lycanroc', 29: 'bisharp',
}

# ── FIFA Country Codes ────────────────────────────────────────────────────────

FIFA_CODES = {
    "ARG","BRA","POR","FRA","ENG","ESP","ITA","GER","USA","JPN","KOR",
    "CHN","MEX","CAN","AUS","NZL","COL","PER","CHL","URU","PAR","VEN",
    "ECU","BOL","RUS","IND","SWE","NOR","DEN","FIN","NED","BEL","SUI",
    "AUT","POL","CZE","HUN","ROU","SRB","HRV","GRC","TUR","ISR",
    "EGY","ZAF","NGA","KEN","MAR","TUN","DZA","SAU","ARE","QAT","SGP",
    "MYS","IDN","PHL","THA","VNM","TWN","HKG","IRL","SEN","CIV","GHA",
    "CMR","CRC","HON","SLV","JAM","TRI","PAN","KSA","IRN","IRQ","JOR",
    "LBN","OMA","BHR","KUW","UZB","KAZ","PRK","LBY","SDN","CRO",
    "BIH","MNE","SVN","SVK","MKD","ALB","WAL","SCO","NIR","ANG","MOZ",
    "ZAM","ZIM","MWI","NAM","BOT","UKR","SVK","LTU","LVA","EST",
    "GEO","ARM","AZE","MDA","BLR","ISL","MLT","CYP","LUX",
}

COUNTRY_GARBLED = {
    "CHE": "SUI", "SUI": "SUI", "SEI": "SUI",
    "KSA": "KSA", "SEN": "SEN", "TUN": "TUN",
    "USA": "USA", "UKR": "UKR", "VIE": "VIE",
    "CRO": "CRO", "NZL": "NZL", "COL": "COL",
    "AUS": "AUS", "ECU": "ECU", "URU": "URU",
    "WAL": "WAL", "NED": "NED", "ANG": "ANG",
    "FIN": "FIN", "ROK": "KOR", "POR": "POR",
    "BRA": "BRA", "FRA": "FRA", "ENG": "ENG",
    "ESP": "ESP", "ITA": "ITA", "GER": "GER",
    "MEX": "MEX", "ARG": "ARG", "JPN": "JPN",
    "PAN": "PAN", "PER": "PER", "BEL": "BEL",
    "POL": "POL", "DEN": "DEN", "MAR": "MAR",
    "SWE": "SWE", "NOR": "NOR", "AUT": "AUT",
    "PAR": "PAR", "CAN": "CAN", "KOR": "KOR",
    "QAT": "QAT", "ARE": "ARE", "ISL": "ISL",
}

COUNTRY_SKIP = {"ATA","DEF","VEL","CUP","WOR","POK","EMO","ENO","PAK","PCK","PKE",
    "PUK","QOK","LDC","VAS","IMO","BEZ","PEK","KEM","MOY","RES",
    "CHO","WON","EME","VIL","MOR","GON","HEL","KOM","ONE","SIE",
    "REY","BIS","HAR","EHO","YAR","CKS","UPZ","NCR","RBU",
    "NNY","OLE","FUE","COC","ARI","LUC","GAR","DEV","OIR","MEO","WSC",
    "ARA","GAZ","DRA","ITE","BXZ","ETG","WRI","YYS","GYA","RAD","SUL",
    "SIR","FET","CKC","NAG","GEN","ATS","YEA","RKC","FEE","VEY","TES",
    "LAP","RAS","INF","ERN","APE","ANR","LYC","VEB","REE","TSA","HAX",
    "ORU","AZO","TRI","CIT","VEO","AEG","ASH","LEO","GAL","LAD",
    "YEL","ZER","AOR","OHN","LUX","RAY","VAR","TOC","NOI","VER","ENR",
    "ROA","INT","ELE","HAZ","OKE","SON","KEL","DEC","IDU","EYE","HYD",
    "REI","ALC","REM","LIA","EEV","TRE","ECK","MIL","OTI","AGG","RON",
    "LIN","BLA","ZIK","TYR","ANI","TAR","ELA","SAM","URO","RIL","LAB",
    "OOM","CKE","MOW","SHE","PHE",
    "YOR","YOU","ACH","BAZ","BUL","ARI","RIZ","ARD",
    "OIC","NNY","GIL","NNS","NTH","STH","SER","DRI","SAL","ORO","NCM",
    "NMO","REN","SCO","TWO","BAT","AKE","OFF","PSM","SCA","QOR","QUR",
    "POX","QOX","QAK","QCK","OAN","SPC"}

COUNTRY_FLAGS = {
    "ARG": ("\U0001f1e6\U0001f1f7", "Argentina"),
    "AUS": ("\U0001f1e6\U0001f1fa", "Australia"),
    "AUT": ("\U0001f1e6\U0001f1f9", "Austria"),
    "BEL": ("\U0001f1e7\U0001f1ea", "Belgium"),
    "BRA": ("\U0001f1e7\U0001f1f7", "Brazil"),
    "CAN": ("\U0001f1e8\U0001f1e6", "Canada"),
    "CHE": ("\U0001f1e8\U0001f1ed", "Switzerland"),
    "CHN": ("\U0001f1e8\U0001f1f3", "China"),
    "COL": ("\U0001f1e8\U0001f1f4", "Colombia"),
    "CRO": ("\U0001f1ed\U0001f1f7", "Croatia"),
    "DEN": ("\U0001f1e9\U0001f1f0", "Denmark"),
    "ECU": ("\U0001f1ea\U0001f1e8", "Ecuador"),
    "ENG": ("\U0001f3f4\u000e0067\u000e0062\u000e0065\u000e006e\u000e0067\u000e007f", "England"),
    "ESP": ("\U0001f1ea\U0001f1f8", "Spain"),
    "FIN": ("\U0001f1eb\U0001f1ee", "Finland"),
    "FRA": ("\U0001f1eb\U0001f1f7", "France"),
    "GER": ("\U0001f1e9\U0001f1ea", "Germany"),
    "ISL": ("\U0001f1ee\U0001f1f8", "Iceland"),
    "ITA": ("\U0001f1ee\U0001f1f9", "Italy"),
    "JPN": ("\U0001f1ef\U0001f1f5", "Japan"),
    "KOR": ("\U0001f1f0\U0001f1f7", "South Korea"),
    "MAR": ("\U0001f1f2\U0001f1e6", "Morocco"),
    "MEX": ("\U0001f1f2\U0001f1fd", "Mexico"),
    "NED": ("\U0001f1f3\U0001f1f1", "Netherlands"),
    "NOR": ("\U0001f1f3\U0001f1f4", "Norway"),
    "NZL": ("\U0001f1f3\U0001f1ff", "New Zealand"),
    "PAN": ("\U0001f1f5\U0001f1e6", "Panama"),
    "PAR": ("\U0001f1f5\U0001f1fe", "Paraguay"),
    "PER": ("\U0001f1f5\U0001f1ea", "Peru"),
    "POL": ("\U0001f1f5\U0001f1f1", "Poland"),
    "POR": ("\U0001f1f5\U0001f1f9", "Portugal"),
    "QAT": ("\U0001f1f6\U0001f1e6", "Qatar"),
    "SEN": ("\U0001f1f8\U0001f1f3", "Senegal"),
    "SUI": ("\U0001f1e8\U0001f1ed", "Switzerland"),
    "SWE": ("\U0001f1f8\U0001f1ea", "Sweden"),
    "TUN": ("\U0001f1f9\U0001f1f3", "Tunisia"),
    "UKR": ("\U0001f1fa\U0001f1e6", "Ukraine"),
    "URU": ("\U0001f1fa\U0001f1fe", "Uruguay"),
    "USA": ("\U0001f1fa\U0001f1f8", "USA"),
    "VIE": ("\U0001f1fb\U0001f1f3", "Vietnam"),
    "WAL": ("\U0001f3f4\u000e0067\u000e0062\u000e0077\u000e006c\u000e0073\u000e007f", "Wales"),
    "ANG": ("\U0001f1e6\U0001f1f4", "Angola"),
    "ARM": ("\U0001f1e6\U0001f1f2", "Armenia"),
    "ARE": ("\U0001f1e6\U0001f1ea", "UAE"),
    "KSA": ("\U0001f1f8\U0001f1e6", "Saudi Arabia"),
    "LUX": ("\U0001f1f1\U0001f1fa", "Luxembourg"),
}

# ── Stats OCR mapping ─────────────────────────────────────────────────────────

MAP_CONS = str.maketrans({'S':'5','s':'5','O':'0','o':'0','G':'6','g':'6',
                          'l':'1','I':'1','B':'8','b':'8','Z':'2','z':'2'})
MAP_AGGR = str.maketrans({'S':'5','s':'5','O':'0','o':'0','G':'6','g':'6',
                          'l':'1','I':'1','B':'8','b':'8','Z':'2','z':'2',
                          'E':'8','e':'8','A':'8','a':'8'})


# ═════════════════════════════════════════════════════════════════════════════
#  Funciones auxiliares
# ═════════════════════════════════════════════════════════════════════════════

def set_tesseract():
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


def load_data():
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, encoding='utf-8') as f:
            return json.load(f)
    return []


def save_data(data):
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Guardados {len(data)} Pokémon en {JSON_FILE}")


def get_existing_names(data):
    return {item['name'].lower() for item in data}


def get_next_id(data):
    if not data:
        return 1
    return max(item['id'] for item in data) + 1


def clean_temp():
    for f in glob.glob("_temp_*.png"):
        os.remove(f)


# ═════════════════════════════════════════════════════════════════════════════
#  Crop
# ═════════════════════════════════════════════════════════════════════════════

def crop_single(img, sheet_id, pos):
    w, h = img.size
    cw, ch = w // COLS, h // ROWS
    pos0 = pos - 1
    row, col = divmod(pos0, COLS)
    left = col * cw
    upper = row * ch
    crop = img.crop((left, upper, left + cw, upper + ch))
    filename = f"_temp_{sheet_id}_{pos:02d}.png"
    crop.save(filename)
    return filename


# ═════════════════════════════════════════════════════════════════════════════
#  OCR: Nombre del Pokémon
# ═════════════════════════════════════════════════════════════════════════════

def extract_name_from_ocr(raw_text):
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


def ocr_name(image_path):
    """Intenta OCR del nombre: bottom 70px PSM 7, luego full card PSM 6."""
    img = Image.open(image_path)
    w, h = img.size

    # Estrategia 1: bottom 70px con PSM 7 y whitelist (layout original)
    bottom = img.crop((0, h - 70, w, h))
    bw, bh = bottom.size
    bottom_large = bottom.resize((bw * 3, bh * 3), Image.LANCZOS)
    text = pytesseract.image_to_string(
        bottom_large,
        config='--psm 7 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-'
    )
    name = extract_name_from_ocr(text)
    if name:
        return name

    # Estrategia 2: full card PSM 6 (layout alternativo)
    big = img.resize((w * 3, h * 3), Image.LANCZOS)
    text = pytesseract.image_to_string(big, config='--psm 6')
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # Buscar palabras que sean nombres Pokémon conocidos
    for line in lines:
        words = re.findall(r'[A-Za-z]{4,}', line)
        for word in words:
            wl = word.lower()
            if wl in POKEMON_NAMES:
                return wl

    # Si no hay match exacto, tomar la palabra más larga del texto
    all_words = []
    for line in lines:
        words = re.findall(r'[A-Za-z]{4,}', line)
        all_words.extend(words)
    if all_words:
        return max(all_words, key=len).lower()

    return ''


def correct_name(raw_name):
    cleaned = raw_name.strip().lower()
    if not cleaned:
        return None

    # Direct match
    if cleaned in POKEMON_NAMES:
        return cleaned

    # Try with common OCR de-garbling
    depoke = cleaned.translate(str.maketrans({
        '0':'o','1':'l','2':'z','3':'e','4':'a','5':'s','6':'g','7':'l','8':'b','9':'g'
    }))
    if depoke in POKEMON_NAMES:
        return depoke

    # Fuzzy match
    match, score, _ = fuzz_process.extractOne(cleaned, POKEMON_NAMES, scorer=fuzz.ratio)
    if score >= 75:
        return match

    # Substring match
    for poke in POKEMON_NAMES:
        if cleaned in poke or poke in cleaned:
            return poke

    # Partial fuzzy (try first 5 chars)
    if len(cleaned) > 5:
        prefix = cleaned[:5]
        match2, score2, _ = fuzz_process.extractOne(cleaned, POKEMON_NAMES, scorer=fuzz.partial_ratio)
        if score2 >= 85:
            return match2

    return cleaned


# ═════════════════════════════════════════════════════════════════════════════
#  OCR: Código de país FIFA
# ═════════════════════════════════════════════════════════════════════════════

def extract_country(image_path):
    """Extrae código FIFA de 3 letras desde la imagen completa usando voting."""
    img = Image.open(image_path)
    w, h = img.size
    all_codes = []
    for scale in [2, 3]:
        big = img.resize((w * scale, h * scale), Image.LANCZOS)
        for psm in [6, 7]:
            text = pytesseract.image_to_string(big, config=f"--psm {psm}")
            codes = re.findall(r"[A-Z]{3}", text.upper())
            for c in codes:
                if c not in COUNTRY_SKIP:
                    if c in COUNTRY_GARBLED:
                        all_codes.append(COUNTRY_GARBLED[c])
                    elif c in FIFA_CODES:
                        all_codes.append(c)
    if not all_codes:
        return None
    best = Counter(all_codes).most_common(1)[0][0]
    if best not in COUNTRY_FLAGS:
        return None
    return best


# ═════════════════════════════════════════════════════════════════════════════
#  OCR: Stats (ATA/DEF/VEL)
# ═════════════════════════════════════════════════════════════════════════════

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


def extract_stats(image_path):
    """Extrae ATA/DEF/VEL usando OCR multiscale + voting."""
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


# ═════════════════════════════════════════════════════════════════════════════
#  Badge
# ═════════════════════════════════════════════════════════════════════════════

def apply_badge(img_path, number):
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


# ═════════════════════════════════════════════════════════════════════════════
#  Procesamiento individual de un sticker
# ═════════════════════════════════════════════════════════════════════════════

def process_sticker(temp_path, pos, existing_names, new_entries, next_id):
    """Procesa un sticker: OCR nombre → país → stats → badge → entry."""
    raw_name = ocr_name(temp_path)
    corrected = correct_name(raw_name)
    if not corrected:
        print(f"  [{pos:02d}] OCR fallido: '{raw_name}' -> saltando")
        return None
    if corrected in existing_names:
        print(f"  [{pos:02d}] {corrected} (duplicado, saltando)")
        return None
    if corrected in [e['name'] for e in new_entries]:
        print(f"  [{pos:02d}] {corrected} (duplicado en mismo lote, saltando)")
        return None

    ata, def_, vel = extract_stats(temp_path)
    if not all(v is not None for v in [ata, def_, vel]):
        print(f"  [{pos:02d}] No se pudieron leer stats de {corrected} -> saltando")
        return None

    country_code = extract_country(temp_path)
    country_meta = COUNTRY_FLAGS.get(country_code, ("", "")) if country_code else ("", "")

    entry = {
        "id": next_id,
        "name": corrected.title(),
        "img": "",
        "ata": ata,
        "def": def_,
        "vel": vel,
    }
    if country_code:
        entry["country"] = country_meta[0]
        entry["countryName"] = country_meta[1]
        entry["countryCode"] = country_code

    final_name = f"{corrected}_{next_id:03d}.png"
    final_path = os.path.join(STICKERS_DIR, final_name)
    os.rename(temp_path, final_path)
    apply_badge(final_path, next_id)
    entry["img"] = final_path.replace("\\", "/")
    new_entries.append(entry)
    existing_names.add(corrected)

    ocr_raw = raw_name if raw_name != corrected else ""
    print(f"  [{pos:02d}] #{next_id:03d} {corrected.title()}" +
          (f" (OCR: '{raw_name}')" if ocr_raw else ""))
    print(f"  [{pos:02d}] #{next_id:03d} ATA={ata} DEF={def_} VEL={vel} Pais={country_code or '???'}")
    return entry


# ═════════════════════════════════════════════════════════════════════════════
#  Modos de re-procesamiento
# ═════════════════════════════════════════════════════════════════════════════

def restats_all():
    """Re-extrae stats de TODAS las cards existentes."""
    data = load_data()
    oks = 0
    for item in data:
        ata, def_, vel = extract_stats(item['img'])
        if all(v is not None for v in [ata, def_, vel]):
            item['ata'] = ata
            item['def'] = def_
            item['vel'] = vel
            oks += 1
            print(f"  #{item['id']:03d} {item['name']:15s} ATA={ata} DEF={def_} VEL={vel}")
        else:
            print(f"  FAIL #{item['id']:03d} {item['name']} ({item['img']})")
    save_data(data)
    print(f"\nStats re-extraídos: {oks}/{len(data)}")


def recountries_all():
    """Re-extrae códigos de país de TODAS las cards existentes."""
    data = load_data()
    oks = 0
    for item in data:
        code = extract_country(item['img'])
        if code and code in COUNTRY_FLAGS:
            flag, name = COUNTRY_FLAGS[code]
            item['country'] = flag
            item['countryName'] = name
            item['countryCode'] = code
            oks += 1
            print(f"  #{item['id']:03d} {item['name']:15s} -> {code} {name}")
        else:
            print(f"  FAIL #{item['id']:03d} {item['name']} -> país no detectado")
    save_data(data)
    print(f"\nPaíses re-extraídos: {oks}/{len(data)}")


# ═════════════════════════════════════════════════════════════════════════════
#  Main
# ═════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='Pipeline de extracción de datos de stickers Pokémon')
    parser.add_argument('--grid', default='8x4',
                        help='Grid de la imagen: 8x4 (32 stickers) o 5x2 (10 stickers)')
    parser.add_argument('--restats', action='store_true',
                        help='Re-extraer stats ATA/DEF/VEL de cards existentes')
    parser.add_argument('--recountries', action='store_true',
                        help='Re-extraer códigos de país de cards existentes')
    args = parser.parse_args()

    global COLS, ROWS
    try:
        c, r = args.grid.lower().split('x')
        COLS, ROWS = int(c), int(r)
    except Exception:
        print(f"Error: grid '{args.grid}' inválido. Usá 8x4 o 5x2.")
        sys.exit(1)

    set_tesseract()

    # Modos de re-procesamiento
    if args.restats:
        restats_all()
        return
    if args.recountries:
        recountries_all()
        return

    # Modo normal: procesar imágenes nuevas en origin/
    processed = load_processed()
    data = load_data()
    existing_names = get_existing_names(data)
    next_id = get_next_id(data)

    origin_files = sorted([
        f for f in os.listdir(ORIGIN_DIR)
        if f.lower().endswith('.png') and f not in processed
    ])

    if not origin_files:
        print("No hay imágenes nuevas en origin/. Todo al día.")
        return

    print(f"Procesando {len(origin_files)} imagen(es) nueva(s): {origin_files}")
    new_entries = []

    for img_file in origin_files:
        img_path = os.path.join(ORIGIN_DIR, img_file)
        print(f"\n--- Procesando: {img_file} ---")
        sheet_id = img_file.replace('.png', '').replace(' ', '_')
        img = Image.open(img_path)
        total = COLS * ROWS
        added_in_sheet = 0

        for batch_start in range(0, total, BATCH):
            batch_positions = list(range(batch_start + 1, min(batch_start + BATCH, total) + 1))
            print(f"  Lote {batch_start // BATCH + 1}: posiciones {batch_positions[0]}-{batch_positions[-1]}")
            temp_batch = []
            for pos in batch_positions:
                temp_path = crop_single(img, sheet_id, pos)
                temp_batch.append((temp_path, pos))
            for temp_path, pos in temp_batch:
                result = process_sticker(temp_path, pos, existing_names, new_entries, next_id)
                if result:
                    next_id += 1
                    added_in_sheet += 1
            for tp, _ in temp_batch:
                if os.path.exists(tp):
                    os.remove(tp)

        processed.add(img_file)
        print(f"  -> {added_in_sheet} nuevo(s) Pokémon de {img_file}")

    if new_entries:
        data.extend(new_entries)
        save_data(data)
        save_processed(processed)
        print(f"\nAgregados {len(new_entries)} Pokémon nuevo(s). Total: {len(data)}")
    else:
        print("\nNo se encontraron Pokémon nuevos.")
    print("Listo.")


if __name__ == '__main__':
    import argparse
    main()
