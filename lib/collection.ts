"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Colección de cromos. MISMA clave y formato que la app original (`{ "<id>": 1 }`)
 * para que los niños no pierdan lo que ya tienen marcado.
 */
export const COLLECTED_KEY = "pokemonCollected";

const listeners = new Set<() => void>();

function read(): string {
  try {
    return localStorage.getItem(COLLECTED_KEY) || "{}";
  } catch {
    return "{}";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === COLLECTED_KEY || e.key === null) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function write(map: Record<string, number>) {
  try {
    localStorage.setItem(COLLECTED_KEY, JSON.stringify(map));
  } catch {
    /* modo privado / cuota: sin persistencia */
  }
  listeners.forEach((l) => l());
}

export function useCollection() {
  const snapshot = useSyncExternalStore(subscribe, read, () => "{}");
  const map = useMemo<Record<string, number>>(() => {
    try {
      const v = JSON.parse(snapshot);
      return v && typeof v === "object" ? v : {};
    } catch {
      return {};
    }
  }, [snapshot]);

  const has = useCallback((id: number) => !!map[id], [map]);
  const toggle = useCallback((id: number) => {
    let cur: Record<string, number> = {};
    try {
      cur = JSON.parse(read()) || {};
    } catch {
      /* corrupto: se reinicia */
    }
    if (cur[id]) delete cur[id];
    else cur[id] = 1;
    write(cur);
  }, []);

  return { map, has, toggle, count: Object.keys(map).length };
}
