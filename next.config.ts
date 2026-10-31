import type { NextConfig } from "next";

// Proyecto de GitHub Pages bajo el dominio propio: https://eliasjurado.com/pokemon/
const config: NextConfig = {
  output: "export",
  basePath: "/pokemon",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default config;
