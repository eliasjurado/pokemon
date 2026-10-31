"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { REGIONS, TOTAL, TYPES, TYPE_COLOR, typeLabel } from "@/lib/pokemon";
import { EMPTY, applyFilters, isDirty, parseFilters, toQuery, type Filters } from "@/lib/filters";
import { useCollection } from "@/lib/collection";
import { Button } from "@/components/ui/button";
import { BallIcon } from "./Icons";
import { ChipRow } from "./Chips";
import { FilterSheet } from "./FilterSheet";
import { PokeCard } from "./PokeCard";
import { ProgressHeader } from "./ProgressHeader";

export const ALBUM_STATE_KEY = "pokemonAlbumState";

export function Album() {
  const router = useRouter();
  const sp = useSearchParams();
  const f = useMemo(() => parseFilters(sp), [sp]);
  const { has, count } = useCollection();
  const list = useMemo(() => applyFilters(f, has), [f, has]);

  const go = useCallback((nf: Filters) => router.replace(`/${toQuery(nf)}`, { scroll: false }), [router]);
  const setFilters = (patch: Partial<Filters>) => go({ ...f, ...patch });
  const clearAll = () => go(EMPTY);

  // Búsqueda: input local inmediato, URL con debounce.
  const [q, setQ] = useState(f.q);
  const lastUrlQ = useRef(f.q);
  useEffect(() => {
    if (f.q !== lastUrlQ.current) {
      lastUrlQ.current = f.q;
      setQ(f.q);
    }
  }, [f.q]);
  useEffect(() => {
    if (q === f.q) return;
    const t = setTimeout(() => {
      lastUrlQ.current = q;
      go({ ...f, q });
    }, 250);
    return () => clearTimeout(t);
  }, [q, f, go]);

  // Al volver de una ficha: recuperar el scroll donde estaba.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ALBUM_STATE_KEY);
      if (!raw) return;
      const { y, query } = JSON.parse(raw);
      if (query === window.location.search && y > 0) {
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }));
      }
    } catch {
      /* sin estado previo */
    }
  }, []);
  const remember = () => {
    try {
      sessionStorage.setItem(ALBUM_STATE_KEY, JSON.stringify({ query: window.location.search, y: window.scrollY }));
    } catch {
      /* ignorar */
    }
  };

  const dirty = isDirty(f) || !!q;

  return (
    <>
      <ProgressHeader count={count} view={f.vista} onView={(vista) => setFilters({ vista })} />

      <div className="sticky top-0 z-30 mt-5 border-y border-border bg-background/95 px-4 py-3">
        <div className="mx-auto max-w-[1400px] space-y-2.5">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre o número"
                aria-label="Buscar por nombre o número"
                className="min-h-11 w-full rounded-xl border border-input bg-secondary pl-11 pr-11 text-[15px] sm:text-base text-foreground focus:border-gold [&::-webkit-search-cancel-button]:appearance-none"
              />
              {q && (
                <button type="button" aria-label="Borrar búsqueda" onClick={() => setQ("")} className="absolute right-0 top-0 grid size-11 place-items-center text-muted-foreground hover:text-foreground">
                  <X className="size-5" />
                </button>
              )}
            </div>
            <FilterSheet f={f} onChange={setFilters} onClear={() => go({ ...EMPTY, q: f.q, vista: f.vista })} resultCount={list.length} />
          </div>
          <ChipRow label="Tipo" value={f.tipo} onChange={(v) => setFilters({ tipo: v })} items={TYPES.map((t) => ({ value: t, label: typeLabel(t), color: TYPE_COLOR[t] }))} />
          <ChipRow className="hidden md:flex" label="Región" allLabel="Todas las regiones" value={f.region} onChange={(v) => setFilters({ region: v })} items={REGIONS.map((r) => ({ value: r, label: r }))} />
        </div>
      </div>

      <main className="mx-auto mt-4 max-w-[1400px] px-4" id="album">
        <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
          <p className="tnum text-sm text-muted-foreground" aria-live="polite">
            Mostrando <strong className="text-foreground">{list.length}</strong> de {TOTAL} cromos
          </p>
          {dirty && (
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); clearAll(); }}>
              <X /> Limpiar todo
            </Button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-dashed border-input p-8 text-center">
            <BallIcon className="mx-auto size-16 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-wide">No hay cromos así</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {f.vista === "faltan" && !isDirty({ ...f, vista: "todos" }) ? "¡No te falta ninguno!" : "Prueba con otro nombre o quita algún filtro."}
            </p>
            <Button className="mt-5" onClick={() => { setQ(""); clearAll(); }}>Mostrar todo el álbum</Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {list.map((p, i) => (
              <PokeCard key={p.id} p={p} have={has(p.id)} onOpen={remember} priority={i < 4} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

