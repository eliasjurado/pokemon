import { ALL, type Pokemon, regionOf, typeOf } from "./pokemon";

export type View = "todos" | "faltan" | "tengo";
export type Filters = { q: string; tipo: string; region: string; pais: string; equipo: string; vista: View };

export const EMPTY: Filters = { q: "", tipo: "", region: "", pais: "", equipo: "", vista: "todos" };

type Params = { get(name: string): string | null };

export function parseFilters(sp: Params): Filters {
  const vista = sp.get("vista");
  return {
    q: sp.get("q") ?? "",
    tipo: sp.get("tipo") ?? "",
    region: sp.get("region") ?? "",
    pais: sp.get("pais") ?? "",
    equipo: sp.get("equipo") ?? "",
    vista: vista === "faltan" || vista === "tengo" ? vista : "todos",
  };
}

export function toQuery(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q.trim()) sp.set("q", f.q.trim());
  if (f.tipo) sp.set("tipo", f.tipo);
  if (f.region) sp.set("region", f.region);
  if (f.pais) sp.set("pais", f.pais);
  if (f.equipo) sp.set("equipo", f.equipo);
  if (f.vista !== "todos") sp.set("vista", f.vista);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Cuántos filtros "de contenido" hay activos (sin contar la vista ni la búsqueda). */
export const activeCount = (f: Filters) => [f.tipo, f.region, f.pais, f.equipo].filter(Boolean).length;
export const isDirty = (f: Filters) => activeCount(f) > 0 || !!f.q.trim() || f.vista !== "todos";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function applyFilters(f: Filters, collected: (id: number) => boolean): Pokemon[] {
  const q = norm(f.q.trim().replace(/^#/, ""));
  return ALL.filter((p) => {
    if (f.tipo && typeOf(p) !== f.tipo) return false;
    if (f.region && regionOf(p) !== f.region) return false;
    if (f.pais && p.countryCode !== f.pais) return false;
    if (f.equipo && p.football?.team !== f.equipo) return false;
    if (f.vista === "faltan" && collected(p.id)) return false;
    if (f.vista === "tengo" && !collected(p.id)) return false;
    if (q) {
      const match = /^\d+$/.test(q) ? p.id === Number(q) : norm(p.name).includes(q);
      if (!match) return false;
    }
    return true;
  });
}
