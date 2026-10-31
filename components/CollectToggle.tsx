"use client";

import { useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCollection } from "@/lib/collection";
import { cn } from "@/lib/utils";

/** Botón circular de la carta (44px): marca/desmarca sin abrir la ficha. */
export function CardToggle({ id, name }: { id: number; name: string }) {
  const { has, toggle } = useCollection();
  const on = has(id);
  const [burst, setBurst] = useState(0);
  const first = useRef(true);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `${name}: lo tengo. Quitar de la colección` : `${name}: me falta. Marcar como coleccionado`}
      onClick={() => {
        first.current = false;
        if (!on) setBurst((b) => b + 1);
        toggle(id);
      }}
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 active:scale-90",
        on ? "border-gold bg-gold text-primary-foreground" : "border-white/25 bg-transparent text-muted-foreground hover:border-gold hover:text-gold",
      )}
    >
      <span key={burst} className={cn("grid place-items-center", burst > 0 && on && "pop ring-burst absolute inset-0 rounded-full")}>
        {on ? <Check className="size-5" strokeWidth={3} /> : <Plus className="size-5" strokeWidth={2.5} />}
      </span>
    </button>
  );
}
