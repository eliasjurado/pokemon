// sync-stickers.mjs — regenera content/sticker-sizes.json desde public/stickers/*.png (lee el ancho/alto del
// encabezado PNG, sin dependencias). Es el "manifiesto" que usa la app para saber qué cromos ya tienen arte
// propio; los que no aparecen aquí se dibujan como cromo provisional. Corre solo antes de cada build (prebuild).
import { readdirSync, readFileSync, writeFileSync, openSync, readSync, closeSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "public", "stickers");
const out = {};
for (const f of readdirSync(dir).filter((n) => /\.png$/i.test(n)).sort()) {
  const fd = openSync(join(dir, f), "r");
  const b = Buffer.alloc(24);
  readSync(fd, b, 0, 24, 0);
  closeSync(fd);
  if (b.toString("ascii", 1, 4) !== "PNG") continue;
  out[f] = [b.readUInt32BE(16), b.readUInt32BE(20)];
}
writeFileSync(join(root, "content", "sticker-sizes.json"), JSON.stringify(out));
console.log(`sticker-sizes.json: ${Object.keys(out).length} cromos con arte`);
