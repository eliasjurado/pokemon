import { Trophy } from "lucide-react";
import { artworkLocal, padId, type Pokemon } from "@/lib/pokemon";
import { teamByCode } from "@/lib/teams";
import { asset } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Cromo provisional: imita el marco de los cromos de IA (insignia con el número arriba a la izquierda, copa + bandera + código
 * arriba a la derecha, placa con el nombre y barra ATA/DEF/VEL abajo) con fondo derivado de los colores de la bandera y el
 * artwork oficial de PokeAPI. Se usa solo mientras no exista public/stickers/<nombre>_<NNN>.png.
 * Todo escala con unidades de contenedor (cqw), así que sirve igual en la grilla (90 px) que en la ficha (400 px).
 */
export function CromoGenerado({ p, className, label, decorative }: { p: Pokemon; className?: string; label?: string; decorative?: boolean }) {
  const t = teamByCode.get(p.countryCode);
  const [c1, c2, c3] = t?.colors ?? ["#2a2a52", "#f7d02c", "#16162a"];
  const long = p.name.length > 10;
  return (
    <div className={cn("grid h-full w-full place-items-center", className)} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label ?? `Cromo ${padId(p.id)} ${p.name} (provisional)` })}>
      <div
        className="relative h-full overflow-hidden"
        style={{
          aspectRatio: "180 / 257",
          maxWidth: "100%",
          containerType: "inline-size",
          borderRadius: "5cqw",
          background: `linear-gradient(165deg, ${c1} 0%, ${c3} 105%)`,
          boxShadow: "inset 0 0 0 1.2cqw #cfcdc6, inset 0 0 0 1.8cqw rgba(0,0,0,.35)",
        }}
      >
        {/* Banda diagonal con el segundo color de la bandera + foco de estadio */}
        <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(125deg, transparent 34%, ${c2}55 34%, ${c2}55 52%, transparent 52%)` }} />
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 42%, rgba(255,255,255,.32), transparent 55%)" }} />
        <div aria-hidden className="absolute inset-x-0 top-0" style={{ height: "30%", background: "linear-gradient(rgba(0,0,0,.55), transparent)" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: "46%", background: "linear-gradient(transparent, rgba(0,0,0,.75))" }} />

        {/* Dorsal fantasma */}
        {p.football?.jersey ? (
          <span aria-hidden className="absolute left-0 right-0 text-center font-display font-extrabold leading-none" style={{ top: "26%", fontSize: "44cqw", color: "rgba(255,255,255,.14)" }}>
            {p.football.jersey}
          </span>
        ) : null}

        {/* Artwork oficial */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(artworkLocal(p))}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute object-contain"
          style={{ left: "10%", right: "10%", top: "20%", width: "80%", height: "48%", filter: "drop-shadow(0 1.5cqw 2cqw rgba(0,0,0,.55))" }}
        />

        {/* Insignia numerada */}
        <span
          className="absolute font-display font-extrabold text-white"
          style={{ left: "3.5%", top: "3%", background: "rgba(0,0,0,.92)", borderRadius: "3cqw", padding: "1.2cqw 3.2cqw", fontSize: "11.5cqw", lineHeight: 1.1, letterSpacing: ".02em" }}
        >
          {padId(p.id)}
        </span>

        {/* Título */}
        <span aria-hidden className="absolute font-display font-extrabold uppercase" style={{ left: "31%", top: "4.5%", fontSize: "5.6cqw", lineHeight: 1, color: "#f7d02c", letterSpacing: ".06em", textShadow: "0 .4cqw 0 #1b2a6b" }}>
          World Cup 2026
        </span>

        {/* Copa + bandera + código */}
        <div className="absolute flex flex-col items-center" style={{ right: "5%", top: "3.5%", width: "17%" }}>
          <Trophy aria-hidden style={{ width: "10cqw", height: "10cqw", color: "#f7d02c" }} strokeWidth={2.2} />
          <span aria-hidden className="block w-full overflow-hidden" style={{ marginTop: "2cqw", height: "10.5cqw", borderRadius: ".8cqw", boxShadow: "0 0 0 .4cqw rgba(255,255,255,.7)", background: `linear-gradient(180deg, ${c1} 0 33.3%, ${c2} 33.3% 66.6%, ${c3} 66.6% 100%)` }} />
          <span aria-hidden className="font-display font-extrabold text-white" style={{ marginTop: "1.2cqw", fontSize: "6.4cqw", lineHeight: 1, textShadow: "0 0 1.2cqw #000" }}>{p.countryCode}</span>
        </div>

        {/* Placa con el nombre */}
        <div
          className="absolute truncate text-center font-display font-extrabold uppercase text-white"
          style={{ left: "6%", right: "6%", bottom: "13.5%", background: "rgba(8,8,16,.86)", borderRadius: "3cqw", padding: "2cqw 2cqw", fontSize: long ? "7.6cqw" : "9.6cqw", lineHeight: 1.1, letterSpacing: ".03em" }}
        >
          {p.name}
        </div>

        {/* Barra ATA / DEF / VEL */}
        <div className="absolute flex items-center justify-between font-extrabold text-white" style={{ left: "6%", right: "6%", bottom: "4.6%", background: "rgba(8,8,16,.78)", borderRadius: "2.4cqw", padding: "1.4cqw 3cqw", fontSize: "5.2cqw", lineHeight: 1.1 }}>
          <span>ATA <b className="tabular-nums" style={{ color: "#f7d02c" }}>{p.ata}</b></span>
          <span>DEF <b className="tabular-nums" style={{ color: "#f7d02c" }}>{p.def}</b></span>
          <span>VEL <b className="tabular-nums" style={{ color: "#f7d02c" }}>{p.vel}</b></span>
        </div>
      </div>
    </div>
  );
}
