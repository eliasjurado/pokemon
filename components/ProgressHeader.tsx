"use client";

import { Trophy } from "lucide-react";
import { TOTAL } from "@/lib/pokemon";
import type { View } from "@/lib/filters";
import { cn } from "@/lib/utils";

function cheer(n: number) {
  const pct = n / TOTAL;
  if (n === 0) return "Empieza tu álbum: toca el + en cualquier cromo que ya tengas.";
  if (n === TOTAL) return "¡Álbum completo! Campeones del mundo.";
  if (pct < 0.25) return "¡Buen comienzo! Cada cromo cuenta.";
  if (pct < 0.5) return "¡Vas muy bien! Ya casi llegas a la mitad.";
  if (pct < 0.75) return "¡Pasaste la mitad! Sigue así.";
  return "¡Ya casi lo completas! Solo faltan los últimos.";
}

const VIEWS: { value: View; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "faltan", label: "Me faltan" },
  { value: "tengo", label: "Coleccionados" },
];

export function ProgressHeader({ count, view, onView }: { count: number; view: View; onView: (v: View) => void }) {
  const pct = Math.round((count / TOTAL) * 100);
  return (
    <header className="px-4 pt-6 sm:pt-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-primary-foreground" aria-hidden="true">
            <Trophy className="size-6" />
          </span>
          <h1 className="font-display text-[clamp(1.75rem,7vw,3.25rem)] font-extrabold uppercase leading-[0.95] tracking-wide">
            Álbum del Mundial <span className="text-gold">Pokémon</span>
          </h1>
        </div>

        <section aria-label="Progreso de la colección" className="mt-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <p className="tnum font-display leading-none">
              <span className="text-[clamp(3rem,13vw,4.5rem)] font-extrabold text-gold">{count}</span>
              <span className="text-2xl font-bold text-muted-foreground sm:text-3xl"> / {TOTAL}</span>
            </p>
            <p className="tnum text-sm text-muted-foreground">
              <strong className="text-foreground">{pct}%</strong> coleccionado · faltan <strong className="text-foreground">{TOTAL - count}</strong>
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Cromos coleccionados"
            aria-valuemin={0}
            aria-valuemax={TOTAL}
            aria-valuenow={count}
            className="relative mt-3 h-4 overflow-hidden rounded-full bg-secondary"
          >
            <div className="relative h-full rounded-full bg-gold transition-[width] duration-700 ease-out" style={{ width: `${Math.max(count ? 2 : 0, (count / TOTAL) * 100)}%` }}>
              {count > 0 && <div className="bar-shine absolute inset-0 rounded-full" />}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{cheer(count)}</p>

          <div role="radiogroup" aria-label="Ver cromos" className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-background/70 p-1 sm:inline-grid">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={view === v.value}
                onClick={() => onView(v.value)}
                className={cn(
                  "min-h-11 rounded-lg px-3 text-sm font-bold transition-colors duration-150 sm:px-5",
                  view === v.value ? "bg-gold text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </header>
  );
}
