"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { ALBUM_STATE_KEY } from "./Album";

/** Vuelve al álbum con los mismos filtros (la query se guardó al abrir la ficha). */
export function BackLink() {
  const [query, setQuery] = useState("");
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ALBUM_STATE_KEY);
      if (raw) setQuery(JSON.parse(raw).query || "");
    } catch {
      /* sin estado */
    }
  }, []);
  return (
    <Link href={`/${query}`} className="inline-flex min-h-11 items-center gap-1 rounded-full pr-4 text-sm font-bold text-foreground hover:text-gold">
      <span className="grid size-11 place-items-center"><ChevronLeft className="size-6" /></span>
      Álbum
    </Link>
  );
}
