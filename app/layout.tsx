import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Nunito } from "next/font/google";
import { SwRegister } from "@/components/SwRegister";
import { PwaButton } from "@/components/PwaButton";
import { Footer } from "@/components/Footer";
import { asset } from "@/lib/site";
import "./globals.css";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://eliasjurado.com"),
  title: { default: "Álbum del Mundial Pokémon", template: "%s · Álbum del Mundial Pokémon" },
  description: "Colección de 215 cromos Pokémon estilo Mundial: país, región, tipo, equipo de fútbol, estadísticas y más. Hecho en familia.",
  manifest: asset("manifest.webmanifest"),
  icons: { icon: asset("images/logo_192.png"), apple: asset("images/logo_192.png") },
  appleWebApp: { capable: true, title: "Mundial Pokémon", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#16162a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">
        <a href="#album" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-3 focus:font-bold focus:text-primary-foreground">
          Saltar al contenido
        </a>
        {children}
        <Footer />
        <PwaButton />
        <SwRegister />
      </body>
    </html>
  );
}
