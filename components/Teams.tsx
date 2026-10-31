"use client";

import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import { padId, slugOf, type Pokemon } from "@/lib/pokemon";
import { BENCH_JERSEY, FORMATION_ROWS, SQUAD_SIZE, TEAM_LIST, squadOf, type Team } from "@/lib/teams";
import { useCollection } from "@/lib/collection";
import { cn } from "@/lib/utils";
import { StickerImage } from "./StickerImage";

function Slot({ p, have, bench }: { p?: Pokemon; have: boolean; bench?: boolean }) {
  if (!p) return <div className="w-[21%]" />;
  return (
    <li className={cn("flex min-w-0 flex-col items-center", bench ? "w-24" : "w-[21%]", have ? "slot-have" : "slot-missing")}>
      <Link
        href={`/p/${slugOf(p)}/`}
        aria-label={`${p.name}, dorsal ${p.football?.jersey}, ${p.football?.role}, cromo ${padId(p.id)}${have ? ", coleccionado" : ", te falta"}`}
        className="card-lift relative block min-h-11 w-full rounded-md"
      >
        <span className="sticker-frame relative block aspect-[180/257] overflow-hidden bg-card">
          <StickerImage p={p} alt="" sizes="110px" />
        </span>
        <span className="tnum absolute -bottom-1 -left-1 grid min-w-5 place-items-center rounded-full bg-black/90 px-1 text-[11px] font-extrabold leading-5 text-white ring-1 ring-white/30">{p.football?.jersey}</span>
        {have && (
          <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-gold text-primary-foreground shadow-md" aria-hidden="true">
            <Check className="size-3.5" strokeWidth={3.5} />
          </span>
        )}
      </Link>
      <span className="mt-1.5 block w-full truncate text-center text-[11px] font-bold leading-tight text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">{p.name}</span>
    </li>
  );
}

function TeamPitch({ team }: { team: Team }) {
  const { has } = useCollection();
  const squad = squadOf(team.code);
  const got = [...squad.values()].filter((p) => has(p.id)).length;
  const pct = Math.round((got / SQUAD_SIZE) * 100);
  const bench = squad.get(BENCH_JERSEY);
  return (
    <section id={`equipo-${team.code}`} aria-labelledby={`h-${team.code}`} className="scroll-mt-28 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <header className="flex items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">{team.flag}</span>
        <div className="min-w-0 flex-1">
          <h2 id={`h-${team.code}`} className="truncate font-display text-2xl font-extrabold uppercase leading-none tracking-wide">{team.name}</h2>
          <p className="tnum mt-1 text-sm text-muted-foreground"><strong className="text-foreground">{got}/{SQUAD_SIZE}</strong> coleccionados</p>
        </div>
        <span className="tnum font-display text-xl font-bold text-gold">{pct}%</span>
      </header>
      <div role="progressbar" aria-label={`${team.name}: cromos coleccionados`} aria-valuemin={0} aria-valuemax={SQUAD_SIZE} aria-valuenow={got} className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${(got / SQUAD_SIZE) * 100}%` }} />
      </div>

      {/* Cancha 4-3-3 (ataque arriba) */}
      <div className="pitch relative mt-4 rounded-xl px-2 pb-3 pt-4" style={{ ["--c1" as string]: team.colors[0] }}>
        <div className="relative space-y-5">
          {FORMATION_ROWS.map((row) => (
            <ul key={row.label} aria-label={row.label} className="flex items-start justify-around gap-1">
              {row.jerseys.map((j) => (
                <Slot key={j} p={squad.get(j)} have={!!squad.get(j) && has(squad.get(j)!.id)} />
              ))}
            </ul>
          ))}
        </div>
      </div>

      {bench && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-secondary p-2.5">
          <ul className="shrink-0"><Slot p={bench} have={has(bench.id)} bench /></ul>
          <p className="text-sm text-muted-foreground"><strong className="block text-foreground">Banquillo</strong>Portero suplente · dorsal 12</p>
        </div>
      )}
    </section>
  );
}

export function Teams() {
  const { count } = useCollection();
  return (
    <>
      <header className="px-4 pt-3">
        <div className="mx-auto max-w-[1400px]">
          <Link href="/" className="inline-flex min-h-11 items-center gap-1 rounded-full pr-4 text-sm font-bold hover:text-gold">
            <span className="grid size-11 place-items-center"><ChevronLeft className="size-6" /></span>
            Álbum
          </Link>
          <h1 className="mt-1 font-display text-[clamp(1.9rem,8vw,3.25rem)] font-extrabold uppercase leading-[0.95] tracking-wide">
            Equipos del <span className="text-gold">Mundial</span>
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground sm:text-base">
            Cada selección es un 4-3-3 con portero suplente: 12 cromos. Toca un jugador para abrir su ficha. Llevas <strong className="tnum text-foreground">{count}</strong> cromos en total.
          </p>
        </div>
      </header>

      <nav aria-label="Ir a un equipo" className="sticky top-0 z-30 mt-4 border-y border-border bg-background/95 px-4 py-2">
        <ul className="no-scrollbar mx-auto flex max-w-[1400px] gap-1.5 overflow-x-auto">
          {TEAM_LIST.map((t) => (
            <li key={t.code} className="shrink-0">
              <a href={`#equipo-${t.code}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-input bg-secondary px-3 text-sm font-bold hover:border-gold">
                <span aria-hidden="true">{t.flag}</span>
                {t.code}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main id="album" className="mx-auto mt-5 max-w-[1400px] px-4">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TEAM_LIST.map((t) => (
            <TeamPitch key={t.code} team={t} />
          ))}
        </div>
      </main>
    </>
  );
}
