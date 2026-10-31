import raw from "@/content/pokemon.json";
import sizes from "@/content/sticker-sizes.json";

export type Football = {
  team: string;
  position: string;
  jersey: number;
  role: string;
  advantage: string;
};

export type Details = {
  id: number;
  height_m?: number;
  weight_kg?: number;
  abilities?: string[];
  stats_full?: Record<string, number>;
  flavor?: string;
  genus?: string;
  evolution_chain?: [string, number][][];
};

export type Pokemon = {
  id: number;
  name: string;
  type?: string;
  region?: string;
  img: string;
  country: string; // emoji de bandera (dato de contenido)
  countryName: string;
  countryCode: string;
  ata: number;
  def: number;
  vel: number;
  pokeapi_details?: Details;
  football?: Football;
};

export const ALL: Pokemon[] = (raw as Pokemon[]).slice().sort((a, b) => a.id - b.id);
export const TOTAL = ALL.length;

export const slugOf = (p: Pokemon) => `${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
export const byId = new Map(ALL.map((p) => [p.id, p]));
export const byApiId = new Map(ALL.filter((p) => p.pokeapi_details?.id).map((p) => [p.pokeapi_details!.id, p]));
export const displayName = (p: Pokemon) => p.name.charAt(0).toUpperCase() + p.name.slice(1);
export const padId = (id: number) => String(id).padStart(3, "0");

/* ---------- Tipos ---------- */
export const SPECIAL_TYPE = "Special";
export const TYPE_ES: Record<string, string> = {
  Normal: "Normal",
  Fire: "Fuego",
  Water: "Agua",
  Electric: "Eléctrico",
  Grass: "Planta",
  Ice: "Hielo",
  Fighting: "Lucha",
  Poison: "Veneno",
  Ground: "Tierra",
  Flying: "Volador",
  Psychic: "Psíquico",
  Bug: "Bicho",
  Rock: "Roca",
  Ghost: "Fantasma",
  Dragon: "Dragón",
  Dark: "Siniestro",
  Steel: "Acero",
  Fairy: "Hada",
  [SPECIAL_TYPE]: "Especial",
};
export const TYPE_COLOR: Record<string, string> = {
  Normal: "#a8a878",
  Fire: "#ee8130",
  Water: "#6390f0",
  Electric: "#f7d02c",
  Grass: "#7ac74c",
  Ice: "#96d9d6",
  Fighting: "#c22e28",
  Poison: "#a33ea1",
  Ground: "#e2bf65",
  Flying: "#a98ff3",
  Psychic: "#f95587",
  Bug: "#a6b91a",
  Rock: "#b6a136",
  Ghost: "#735797",
  Dragon: "#6f35fc",
  Dark: "#8a6a56",
  Steel: "#b7b7ce",
  Fairy: "#d685ad",
  [SPECIAL_TYPE]: "#f7d02c",
};
export const typeOf = (p: Pokemon) => p.type ?? SPECIAL_TYPE;
export const typeLabel = (t: string) => TYPE_ES[t] ?? t;

export const TYPES = Object.keys(TYPE_ES).filter((t) => ALL.some((p) => typeOf(p) === t));

/* ---------- Regiones ---------- */
export const OTHER_REGION = "Otra";
export const REGION_ORDER = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Paldea", OTHER_REGION];
export const regionOf = (p: Pokemon) => p.region ?? OTHER_REGION;
export const REGIONS = REGION_ORDER.filter((r) => ALL.some((p) => regionOf(p) === r));

/* ---------- País y equipo ---------- */
const seen = new Map<string, { code: string; name: string; flag: string }>();
for (const p of ALL) if (p.countryCode && p.countryCode !== "???" && !seen.has(p.countryCode)) seen.set(p.countryCode, { code: p.countryCode, name: p.countryName, flag: p.country });
export const COUNTRIES = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
export const TEAMS = [...new Set(ALL.map((p) => p.football?.team).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "es"));

export const POSITION_ES: Record<string, string> = {
  GK: "Portero",
  CB: "Defensa central",
  RB: "Lateral derecho",
  LB: "Lateral izquierdo",
  CDM: "Mediocentro defensivo",
  CAM: "Mediapunta",
  RW: "Extremo derecho",
  LW: "Extremo izquierdo",
  ST: "Delantero",
};

/* ---------- Stats ---------- */
export const STAT_ORDER: [string, string][] = [
  ["hp", "HP"],
  ["attack", "Ataque"],
  ["defense", "Defensa"],
  ["special-attack", "Ataque esp."],
  ["special-defense", "Defensa esp."],
  ["speed", "Velocidad"],
];

/* ---------- Recursos externos (PokeAPI) ---------- */
const SPR = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
export const spriteUrl = (id: number) => `${SPR}/${id}.png`;
export const artworkUrl = (id: number, shiny = false) => `${SPR}/other/official-artwork${shiny ? "/shiny" : ""}/${id}.png`;
export const cryUrl = (id: number) => `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

/** Proporción real del cromo (los PNG no son todos iguales: 0.69 a 0.87). */
export const stickerSize = (p: Pokemon): [number, number] => (sizes as unknown as Record<string, [number, number]>)[p.img.split("/").pop()!] ?? [180, 257];
