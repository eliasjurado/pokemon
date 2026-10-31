import teamsRaw from "@/content/teams.json";
import { ALL, type Pokemon } from "./pokemon";

export type Team = {
  code: string;
  name: string; // español
  flag: string; // emoji
  colors: [string, string, string]; // colores de la bandera (fondo del cromo generado)
  themes: string[];
};

export const TEAM_LIST: Team[] = (teamsRaw as Team[]).slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
export const teamByCode = new Map(TEAM_LIST.map((t) => [t.code, t]));

/** Plantel: 4-3-3 + portero suplente. El dorsal identifica el puesto (único por equipo). */
export const SQUAD_SIZE = 12;
export const FORMATION_ROWS: { label: string; jerseys: number[] }[] = [
  { label: "Delanteros", jerseys: [11, 9, 7] },
  { label: "Mediocampistas", jerseys: [8, 6, 10] },
  { label: "Defensas", jerseys: [3, 4, 5, 2] },
  { label: "Portero", jerseys: [1] },
];
export const BENCH_JERSEY = 12;

const squads = new Map<string, Map<number, Pokemon>>();
for (const p of ALL) {
  const j = p.football?.jersey;
  if (!j) continue;
  if (!squads.has(p.countryCode)) squads.set(p.countryCode, new Map());
  squads.get(p.countryCode)!.set(j, p);
}
export const squadOf = (code: string) => squads.get(code) ?? new Map<number, Pokemon>();
