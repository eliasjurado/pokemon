"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { COUNTRIES, REGIONS, TEAMS, TYPES, TYPE_COLOR, typeLabel } from "@/lib/pokemon";
import { activeCount, type Filters } from "@/lib/filters";
import { ChipRow } from "./Chips";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-display text-lg font-bold uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const selectCls =
  "min-h-12 w-full rounded-xl border border-input bg-secondary px-4 text-base text-foreground [color-scheme:dark] focus:border-gold";

export function FilterSheet({ f, onChange, onClear, resultCount }: { f: Filters; onChange: (p: Partial<Filters>) => void; onClear: () => void; resultCount: number }) {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const n = activeCount(f);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="relative shrink-0" aria-label={n ? `Filtros, ${n} activos` : "Filtros"}>
          <SlidersHorizontal /> <span>Filtros</span>
          {n > 0 && <span className="grid size-6 place-items-center rounded-full bg-gold text-xs font-extrabold text-primary-foreground">{n}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side={wide ? "right" : "bottom"} aria-describedby="filtros-desc">
        <div className="border-b border-border px-5 pb-3 pt-5">
          <SheetTitle className="font-display text-3xl font-extrabold uppercase tracking-wide">Filtros</SheetTitle>
          <SheetDescription id="filtros-desc" className="text-sm text-muted-foreground">Encuentra cromos por tipo, región, país o equipo de fútbol.</SheetDescription>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <p className="mb-2 font-display text-lg font-bold uppercase tracking-wide">Tipo</p>
            <ChipRow wrap label="Tipo" value={f.tipo} onChange={(v) => onChange({ tipo: v })} items={TYPES.map((t) => ({ value: t, label: typeLabel(t), color: TYPE_COLOR[t] }))} />
          </div>
          <div>
            <p className="mb-2 font-display text-lg font-bold uppercase tracking-wide">Región</p>
            <ChipRow wrap label="Región" allLabel="Todas" value={f.region} onChange={(v) => onChange({ region: v })} items={REGIONS.map((r) => ({ value: r, label: r }))} />
          </div>
          <Field id="f-pais" label="País">
            <select id="f-pais" className={selectCls} value={f.pais} onChange={(e) => onChange({ pais: e.target.value })}>
              <option value="">Todos los países</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </Field>
          <Field id="f-equipo" label="Equipo de fútbol">
            <select id="f-equipo" className={selectCls} value={f.equipo} onChange={(e) => onChange({ equipo: e.target.value })}>
              <option value="">Todos los equipos</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex gap-3 border-t border-border bg-card px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="secondary" onClick={onClear} disabled={n === 0}>Limpiar</Button>
          <Button className="flex-1" onClick={() => setOpen(false)}>Ver {resultCount} {resultCount === 1 ? "cromo" : "cromos"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
