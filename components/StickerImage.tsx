"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/site";
import { isProvisional, padId, stickerSize, type Pokemon } from "@/lib/pokemon";
import { CromoGenerado } from "./CromoGenerado";
import { cn } from "@/lib/utils";

/** Hueco del álbum cuando falta el sticker: marco dorado, balón de fútbol-pokéball y el número. */
export function StickerPlaceholder({ id, label, className }: { id: number; label: string; className?: string }) {
  return (
    <svg viewBox="0 0 180 257" role="img" aria-label={label} className={cn("block h-full w-full", className)}>
      <rect width="180" height="257" rx="10" fill="#16162a" />
      <rect x="6" y="6" width="168" height="245" rx="6" fill="none" stroke="#f7d02c" strokeOpacity=".45" strokeWidth="2" strokeDasharray="7 6" />
      <circle cx="90" cy="108" r="46" fill="none" stroke="#3a3a66" strokeWidth="4" />
      <path d="M44 108h92" stroke="#3a3a66" strokeWidth="4" />
      <circle cx="90" cy="108" r="13" fill="#0a0a1a" stroke="#3a3a66" strokeWidth="4" />
      <text x="90" y="196" textAnchor="middle" fontSize="38" fontWeight="800" fill="#f7d02c" fontFamily="Arial Narrow, Arial, sans-serif">
        {padId(id)}
      </text>
      <text x="90" y="222" textAnchor="middle" fontSize="12" fontWeight="700" fill="#a4a4c4" letterSpacing="2" fontFamily="Arial, sans-serif">
        SIN CROMO
      </text>
    </svg>
  );
}

export function StickerImage({
  p,
  priority = false,
  sizes,
  className,
  alt,
}: {
  p: Pokemon;
  priority?: boolean;
  sizes?: string;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Si la imagen falló antes de hidratar, onError ya se perdió: se revisa al montar.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  const label = alt ?? `Cromo ${padId(p.id)} ${p.name}`;
  if (isProvisional(p)) return <CromoGenerado p={p} className={className} label={alt || undefined} decorative={alt === ""} />;
  if (failed) return <StickerPlaceholder id={p.id} label={label} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={asset(p.img)}
      alt={label}
      width={stickerSize(p)[0]}
      height={stickerSize(p)[1]}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailed(true)}
      className={cn("block h-full w-full object-contain", className)}
    />
  );
}
