"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

/** "Instalar App" (navegador) y "Actualizar App" (SOLO cuando ya corre instalada/standalone y hay versión nueva). */
export function PwaButton() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [update, setUpdate] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (!isStandalone()) setInstall(e as InstallEvent);
    };
    const onInstalled = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Solo hay "actualización" si ya había un SW controlando la página al abrir (no en la primera instalación).
    const hadController = !!navigator.serviceWorker?.controller;
    const onController = () => {
      if (hadController && isStandalone()) setUpdate(true);
    };
    navigator.serviceWorker?.addEventListener("controllerchange", onController);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      navigator.serviceWorker?.removeEventListener("controllerchange", onController);
    };
  }, []);

  if (update)
    return (
      <Button className="fixed bottom-24 right-4 z-40 lg:bottom-4 shadow-xl" onClick={() => window.location.reload()}>
        <RefreshCw /> Actualizar App
      </Button>
    );
  if (install)
    return (
      <Button
        className="fixed bottom-24 right-4 z-40 lg:bottom-4 shadow-xl"
        onClick={async () => {
          await install.prompt();
          const { outcome } = await install.userChoice;
          if (outcome === "accepted") setInstall(null);
        }}
      >
        <Download /> Instalar App
      </Button>
    );
  return null;
}
