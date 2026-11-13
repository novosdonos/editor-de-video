// Stills para comparar antes e depois de mexer em código de motion (ex.: cena indo para o catálogo).
// Uso (de dentro de remotion/): node scripts/stills.mjs <aula> <pasta-saida> <id,id,...|Aula>
// Cada composição: 5 quadros (12 na Aula), em 50%. Comparar: ../.venv/bin/python scripts/comparar.py <antes> <depois>
// O render é determinístico (2026-11-13): mesma entrada, mesmos pixels; só "idêntico" prova que nada mudou.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const [aula, saida, lista] = process.argv.slice(2);
if (!aula || !saida || !lista) {
  console.error("Uso: node scripts/stills.mjs <aula> <pasta-saida> <id,id,...|Aula>");
  process.exit(1);
}
fs.mkdirSync(saida, { recursive: true });
const inputProps = { aula, mostrarLegendas: false };
// selectComposition por id: getCompositions calcularia todas (inclusive Reels de vídeos já apagados)
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), symlinkPublicDir: true });
for (const id of lista.split(",")) {
  const c = await selectComposition({ serveUrl, id, inputProps });
  const pontos = id === "Aula" ? [0.03, 0.1, 0.18, 0.25, 0.33, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97] : [0.08, 0.3, 0.5, 0.7, 0.92];
  for (const p of pontos) {
    const f = Math.min(c.durationInFrames - 1, Math.round(p * c.durationInFrames));
    await renderStill({ composition: c, serveUrl, frame: f, output: path.join(saida, `${id}_${f}.png`), scale: 0.5, inputProps });
  }
  console.log("ok", id);
}
