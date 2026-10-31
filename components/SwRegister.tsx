"use client";

import { useEffect } from "react";
import { BASE } from "@/lib/site";

/** PWA: registra el service worker (HTML network-first; estáticos stale-while-revalidate). Sin SW la app funciona igual. */
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const reg = () => navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {});
    if (document.readyState === "complete") reg();
    else window.addEventListener("load", reg, { once: true });
  }, []);
  return null;
}
