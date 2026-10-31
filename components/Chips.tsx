"use client";

import { cn } from "@/lib/utils";

export type ChipItem = { value: string; label: string; color?: string };

export function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-[transform,background-color,border-color,color] duration-150 active:scale-95",
        active ? "border-gold bg-gold text-primary-foreground" : "border-input bg-secondary/60 text-foreground hover:border-gold/70",
      )}
    >
      {color && <span className="size-2.5 rounded-full ring-1 ring-black/40" style={{ background: color }} aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Fila de chips de una sola selección; "Todos" limpia. */
export function ChipRow({ label, items, value, onChange, allLabel = "Todos", wrap = false, className }: {
  label: string;
  items: ChipItem[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
  wrap?: boolean;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex gap-2", wrap ? "flex-wrap" : "no-scrollbar -mx-4 overflow-x-auto px-4 pb-0.5", className)}>
      <Chip active={!value} onClick={() => onChange("")}>{allLabel}</Chip>
      {items.map((it) => (
        <Chip key={it.value} active={value === it.value} color={it.color} onClick={() => onChange(value === it.value ? "" : it.value)}>
          {it.label}
        </Chip>
      ))}
    </div>
  );
}
