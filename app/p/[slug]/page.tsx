import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Shirt, Target, MapPin } from "lucide-react";
import {
  ALL, isProvisional, POSITION_ES, STAT_ORDER, TYPE_COLOR, byApiId, byId, displayName, padId, regionOf, slugOf, spriteUrl, typeLabel, typeOf, type Pokemon,
} from "@/lib/pokemon";
import { asset } from "@/lib/site";
import { BackLink } from "@/components/BackLink";
import { CollectButton, CollectedBadge } from "@/components/CollectButton";
import { Viewer } from "@/components/Viewer";
import { StickerImage } from "@/components/StickerImage";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL.map((p) => ({ slug: slugOf(p) }));
}

const find = (slug: string) => byId.get(Number(slug.split("-")[0]));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = find((await params).slug);
  if (!p) return {};
  return {
    title: `${displayName(p)} #${padId(p.id)}`,
    description: `${displayName(p)}: cromo ${padId(p.id)} del Álbum del Mundial Pokémon. ${p.countryName}, ${p.football?.role ?? "cromo especial"}.`,
    openGraph: { images: [asset(p.img)] },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="mb-4 font-display text-2xl font-extrabold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  const w = Math.min(100, Math.round((value / 180) * 100));
  return (
    <div className="grid grid-cols-[5.5rem_2.25rem_1fr] items-center gap-3 text-sm sm:grid-cols-[7rem_2.5rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tnum text-right font-extrabold">{value}</dd>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div className="h-full rounded-full bg-gold" style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

const nice = (s: string) => s.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

function Evolution({ p }: { p: Pokemon }) {
  const chain = p.pokeapi_details?.evolution_chain;
  if (!chain || chain.length < 2) return null;
  const curId = p.pokeapi_details!.id;
  return (
    <Section title="Evolución">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-4">
        {chain.map((level, li) => (
          <li key={li} className="flex items-center gap-1">
            {li > 0 && <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-label="evoluciona a" role="img" />}
            <div className="flex flex-wrap gap-2">
              {level.map(([name, apiId]) => {
                const target = byApiId.get(apiId);
                const active = apiId === curId;
                const inner = (
                  <>
                    <span className="block aspect-[180/257] w-16 overflow-hidden rounded-md bg-secondary">
                      {target ? (
                        <StickerImage p={target} alt="" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={spriteUrl(apiId)} alt="" loading="lazy" className="size-full object-contain p-1" />
                      )}
                    </span>
                    <span className="mt-1 block max-w-20 truncate text-xs font-bold capitalize">{name}</span>
                    {!target && <span className="block text-[11px] leading-tight text-muted-foreground">fuera del álbum</span>}
                  </>
                );
                const cls = "block rounded-xl border-2 p-1.5 text-center transition-colors " + (active ? "border-gold bg-secondary" : "border-transparent");
                return target && !active ? (
                  <Link key={apiId} href={`/p/${slugOf(target)}/`} className={cls + " hover:border-gold/70"} aria-label={`Ver ${name}`}>{inner}</Link>
                ) : (
                  <div key={apiId} className={cls} aria-current={active ? "true" : undefined}>{inner}</div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Neighbor({ p, dir }: { p?: Pokemon; dir: "prev" | "next" }) {
  if (!p) return <span />;
  return (
    <Link
      href={`/p/${slugOf(p)}/`}
      rel={dir}
      className={`group flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-gold/70 ${dir === "next" ? "flex-row-reverse text-right" : ""}`}
    >
      <span className="block aspect-[180/257] w-10 shrink-0 overflow-hidden rounded"><StickerImage p={p} alt="" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">{dir === "prev" ? "Anterior" : "Siguiente"} · #{padId(p.id)}</span>
        <span className="block truncate font-bold capitalize">{p.name}</span>
      </span>
      {dir === "prev" ? <ChevronLeft className="size-5 text-muted-foreground" /> : <ChevronRight className="size-5 text-muted-foreground" />}
    </Link>
  );
}

export default async function PokemonPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = find((await params).slug);
  if (!p) notFound();
  const i = ALL.findIndex((x) => x.id === p.id);
  const prev = ALL[i - 1];
  const next = ALL[i + 1];
  const d = p.pokeapi_details;
  const fb = p.football;
  const t = typeOf(p);
  const hasFlag = p.countryCode !== "???" && p.countryName !== "Desconocido";

  return (
    <>
      <div className="mx-auto max-w-6xl px-4">
        <nav aria-label="Navegación de la ficha" className="flex items-center justify-between py-2">
          <BackLink />
          <div className="flex gap-1">
            {prev ? <Link href={`/p/${slugOf(prev)}/`} rel="prev" aria-label={`Anterior: ${prev.name}`} className="grid size-11 place-items-center rounded-full hover:bg-secondary"><ChevronLeft className="size-6" /></Link> : <span className="size-11" />}
            {next ? <Link href={`/p/${slugOf(next)}/`} rel="next" aria-label={`Siguiente: ${next.name}`} className="grid size-11 place-items-center rounded-full hover:bg-secondary"><ChevronRight className="size-6" /></Link> : <span className="size-11" />}
          </div>
        </nav>

        <main id="album" className="mt-2 grid gap-8 pb-28 lg:grid-cols-[26rem_1fr] lg:gap-12 lg:pb-8">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Viewer p={p} />
            {isProvisional(p) && <p className="mt-3 text-center text-xs text-muted-foreground">Cromo provisional · tarjeta generada con arte oficial hasta que llegue su cromo</p>}
          </div>

          <div className="space-y-5">
            <div className="rise">
              <p className="tnum font-display text-2xl font-bold leading-none text-gold">Cromo #{padId(p.id)}</p>
              <h1 className="mt-1 font-display text-[clamp(2.75rem,12vw,5rem)] font-extrabold uppercase leading-[0.9] tracking-wide">{p.name}</h1>
              {d?.genus && <p className="mt-2 text-base text-muted-foreground">{d.genus}</p>}
              <ul className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
                <li className="inline-flex min-h-9 items-center gap-2 rounded-full border border-input bg-secondary px-3.5">
                  <span className="size-2.5 rounded-full" style={{ background: TYPE_COLOR[t] }} aria-hidden="true" /> {typeLabel(t)}
                </li>
                <li className="inline-flex min-h-9 items-center gap-2 rounded-full border border-input bg-secondary px-3.5">{regionOf(p) === "Otra" ? "Cromo especial" : regionOf(p)}</li>
                {hasFlag && <li className="inline-flex min-h-9 items-center gap-2 rounded-full border border-input bg-secondary px-3.5"><span aria-hidden="true">{p.country}</span> {p.countryName}</li>}
                <li className="inline-flex items-center"><CollectedBadge id={p.id} /></li>
              </ul>
            </div>

            <div className="hidden lg:block"><CollectButton id={p.id} name={p.name} /></div>

            {fb && (
              <Section title="Fútbol">
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div className="col-span-2 rounded-xl bg-secondary p-3 sm:col-span-4">
                    <dt className="text-muted-foreground">Equipo</dt>
                    <dd className="mt-0.5 text-lg font-extrabold">{hasFlag && fb.team === p.countryName ? <span aria-hidden="true">{p.country} </span> : null}{fb.team}</dd>
                  </div>
                  <div className="rounded-xl bg-secondary p-3"><dt className="flex items-center gap-1.5 text-muted-foreground"><Shirt className="size-4" /> Dorsal</dt><dd className="tnum mt-0.5 text-lg font-extrabold">#{fb.jersey}</dd></div>
                  <div className="rounded-xl bg-secondary p-3"><dt className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-4" /> Posición</dt><dd className="mt-0.5 text-lg font-extrabold">{fb.position === "—" ? "Reserva" : fb.position}<span className="block text-xs font-normal text-muted-foreground">{POSITION_ES[fb.position] ?? ""}</span></dd></div>
                  <div className="col-span-2 rounded-xl bg-secondary p-3"><dt className="flex items-center gap-1.5 text-muted-foreground"><Target className="size-4" /> Rol</dt><dd className="mt-0.5 text-lg font-extrabold">{fb.role}</dd></div>
                </dl>
                <p className="mt-4 text-base leading-relaxed"><strong className="text-gold">Ventaja:</strong> {fb.advantage}</p>
              </Section>
            )}

            <Section title={d?.stats_full ? "Estadísticas base" : "Estadísticas del cromo"}>
              <dl className="space-y-3">
                {d?.stats_full
                  ? STAT_ORDER.map(([k, label]) => <StatBar key={k} label={label} value={d.stats_full![k] ?? 0} />)
                  : [["Ataque", p.ata], ["Defensa", p.def], ["Velocidad", p.vel]].map(([l, v]) => <StatBar key={l} label={l as string} value={v as number} />)}
              </dl>
            </Section>

            {(d?.flavor || d?.height_m || d?.weight_kg || d?.abilities?.length) && (
              <Section title="Sobre este Pokémon">
                {d?.flavor && <blockquote className="mb-4 max-w-prose text-base italic leading-relaxed text-foreground/90">“{d.flavor}”</blockquote>}
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {d?.height_m ? <div className="rounded-xl bg-secondary p-3"><dt className="text-muted-foreground">Altura</dt><dd className="tnum mt-0.5 text-lg font-extrabold">{d.height_m} m</dd></div> : null}
                  {d?.weight_kg ? <div className="rounded-xl bg-secondary p-3"><dt className="text-muted-foreground">Peso</dt><dd className="tnum mt-0.5 text-lg font-extrabold">{d.weight_kg} kg</dd></div> : null}
                  {d?.abilities?.length ? <div className="col-span-2 rounded-xl bg-secondary p-3"><dt className="text-muted-foreground">Habilidades</dt><dd className="mt-0.5 text-lg font-extrabold">{d.abilities.map(nice).join(" · ")}</dd></div> : null}
                </dl>
              </Section>
            )}

            <Evolution p={p} />

            <nav aria-label="Otros cromos" className="grid gap-3 sm:grid-cols-2">
              <Neighbor p={prev} dir="prev" />
              <Neighbor p={next} dir="next" />
            </nav>
          </div>
        </main>
      </div>

      {/* Barra de acción fija en móvil, como una ficha de producto */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto max-w-md"><CollectButton id={p.id} name={p.name} /></div>
      </div>
    </>
  );
}
