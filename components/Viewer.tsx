"use client";

import { useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { artworkUrl, cryUrl, stickerSize, type Pokemon } from "@/lib/pokemon";
import { cn } from "@/lib/utils";
import { StickerImage } from "./StickerImage";
import { useCollection } from "@/lib/collection";

type Mode = "sticker" | "official" | "shiny";

export function Viewer({ p }: { p: Pokemon }) {
  const apiId = p.pokeapi_details?.id;
  const [mode, setMode] = useState<Mode>("sticker");
  const [broken, setBroken] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const { has } = useCollection();
  const have = has(p.id);

  const modes: { v: Mode; label: string }[] = [
    { v: "sticker", label: "Cromo" },
    ...(apiId ? [{ v: "official" as Mode, label: "Oficial" }, { v: "shiny" as Mode, label: "Shiny" }] : []),
  ];

  const play = () => {
    if (!apiId) return;
    audio.current?.pause();
    const a = new Audio(cryUrl(apiId));
    a.volume = 0.5;
    audio.current = a;
    a.play().catch(() => {});
  };

  return (
    <div className="mx-auto w-full max-w-[22rem] lg:max-w-[26rem]">
      <div style={{ aspectRatio: mode === "sticker" ? `${stickerSize(p)[0]} / ${stickerSize(p)[1]}` : "3 / 4" }} className={cn("sticker-frame relative overflow-hidden bg-card", have && "shadow-[0_0_0_3px_var(--gold),0_20px_40px_-15px_rgba(0,0,0,.7)]")}>
        {mode === "sticker" ? (
          <StickerImage p={p} priority alt={`Cromo ${p.name}`} />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_40%,#2a2a52,#16162a_70%)] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={mode}
              src={artworkUrl(apiId!, mode === "shiny")}
              alt={`${mode === "shiny" ? "Versión shiny" : "Arte oficial"} de ${p.name}`}
              className="max-h-full w-full object-contain"
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
            />
            {broken && <p className="absolute inset-x-4 bottom-4 text-center text-sm text-muted-foreground">No se pudo cargar la imagen (¿sin conexión?).</p>}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        {modes.length > 1 && (
          <div role="radiogroup" aria-label="Versión de la imagen" className="inline-flex gap-1 rounded-full bg-card p-1">
            {modes.map((m) => (
              <button
                key={m.v}
                type="button"
                role="radio"
                aria-checked={mode === m.v}
                onClick={() => { setMode(m.v); setBroken(false); }}
                className={cn("min-h-11 rounded-full px-4 text-sm font-bold transition-colors", mode === m.v ? "bg-gold text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
        {apiId && (
          <button type="button" onClick={play} aria-label={`Escuchar el grito de ${p.name}`} className="grid size-11 place-items-center rounded-full border border-input bg-card text-foreground transition-transform hover:border-gold active:scale-90">
            <Volume2 className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
