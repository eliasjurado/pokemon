"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCollection } from "@/lib/collection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CollectButton({ id, name, className }: { id: number; name: string; className?: string }) {
  const { has, toggle } = useCollection();
  const on = has(id);
  const [n, setN] = useState(0);
  return (
    <Button
      size="lg"
      variant={on ? "success" : "default"}
      aria-pressed={on}
      className={cn("w-full", className)}
      onClick={() => {
        if (!on) setN((x) => x + 1);
        toggle(id);
      }}
    >
      <span key={n} className={cn("inline-flex items-center gap-2", n > 0 && on && "pop")}>
        {on ? <Check strokeWidth={3} className="!size-5" /> : <Plus strokeWidth={3} className="!size-5" />}
        {on ? "Coleccionado" : "Marcar como coleccionado"}
      </span>
      <span className="sr-only"> {name}</span>
    </Button>
  );
}

export function CollectedBadge({ id }: { id: number }) {
  const { has } = useCollection();
  if (!has(id)) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-foreground">
      <Check className="size-3.5" strokeWidth={3.5} /> Lo tengo
    </span>
  );
}
