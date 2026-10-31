import type { Metadata } from "next";
import { Teams } from "@/components/Teams";

export const metadata: Metadata = {
  title: "Equipos",
  description: "Las 32 selecciones del Álbum del Mundial Pokémon: cada una con su 4-3-3, su portero suplente y tu progreso.",
};

export default function EquiposPage() {
  return <Teams />;
}
