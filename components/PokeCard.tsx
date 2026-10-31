"use client";

import Link from "next/link";
import { padId, slugOf, typeLabel, typeOf, TYPE_COLOR, type Pokemon } from "@/lib/pokemon";
import { cn } from "@/lib/utils";
import { StickerImage } from "./StickerImage";
import { CardToggle } from "./CollectToggle";
import { Check } from "lucide-react";

export function PokeCard({ p, have, onOpen, priority }: { p: Pokemon; have: boolean; onOpen: () => void; priority?: boolean }) {
  const t = typeOf(p);
  const fb = p.football;
  return (
    <li className={cn("cv-auto flex flex-col", have ? "slot-have" : "slot-missing")}>
      <Link
        href={`/p/${slugOf(p)}/`}
        onClick={onOpen}
        className="card-lift group relative block rounded-[12px] outline-offset-4"
        aria-label={`Abrir ${p.name}, número ${padId(p.id)}${have ? ", coleccionado" : ", te falta"}`}
      >
        <div className="sticker-frame relative aspect-[3/4] overflow-hidden bg-card">
          <StickerImage p={p} priority={priority} sizes="(min-width:1280px) 16vw, (min-width:1024px) 20vw, (min-width:768px) 25vw, (min-width:640px) 33vw, 50vw" alt="" />
        </div>
        {have && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-foreground shadow-lg">
            <Check className="size-3.5" strokeWidth={3.5} /> Lo tengo
          </span>
        )}
      </Link>
      <div className="mt-2 flex items-center gap-2 pl-1">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold leading-tight">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[t] }} aria-hidden="true" />
            <span className="truncate">{typeLabel(t)}</span>
          </p>
          <p className="truncate text-xs leading-snug text-muted-foreground">
            {fb && fb.jersey ? <>#{fb.jersey} · {fb.role}</> : `Cromo ${padId(p.id)}`}
          </p>
        </div>
        <CardToggle id={p.id} name={p.name} />
      </div>
    </li>
  );
}
