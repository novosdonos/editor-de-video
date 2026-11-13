// Quadros de conferência da aula MONTADA (vídeo editado + câmera do 09 + motion), para revisar antes de mandar ao autor.
// Por que existe (aula 01, 2026-11-13): destaques conferidos isolados pareciam certos, mas na aula o texto ficava fora
// da transformação da câmera e, com ela fechada, atravessava o rosto. Só o quadro da aula montada mostra isso.
// Uso (de dentro de remotion/):
//   node scripts/quadros.mjs <aula> <pasta-saida>                 um quadro em 85% de cada cena e destaque
//   node scripts/quadros.mjs <aula> <pasta-saida> <id> [<id>...]  só esses itens, em 30%, 60% e 90%
// Depois: montar folhas com ffmpeg (xstack) e olhar uma a uma: rosto livre, texto curto, nada cortado na borda.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [aula, saida, ...ids] = process.argv.slice(2);
if (!aula || !saida) {
  console.error("Uso: node scripts/quadros.mjs <aula> <pasta-saida> [ids...]");
  process.exit(1);
}
fs.mkdirSync(saida, { recursive: true });
// linha do tempo já no tempo do editado atual (com remapa), a mesma que o 09 e o 10 leem
const linha = JSON.parse(execFileSync("node", [path.resolve("scripts/linha.mjs"), aula], { encoding: "utf8" }));
const itens = linha.filter((i) => (ids.length ? ids.includes(i.id) : i.tipo === "cena" || i.tipo === "destaque"));
const fracoes = ids.length ? [0.3, 0.6, 0.9] : [0.85];

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), symlinkPublicDir: true });
// mostrarLegendas segue o campo `legenda` do video.md; para conferir motion, sem legenda corrida
const inputProps = { aula, mostrarLegendas: false };
const comp = await selectComposition({ serveUrl, id: "Aula", inputProps });
for (const it of itens) {
  for (const [k, f] of fracoes.entries()) {
    const frame = Math.min(comp.durationInFrames - 1, Math.round((it.inicio + it.dur * f) * comp.fps));
    const nome = `${it.id}_${k}.jpg`;
    await renderStill({ composition: comp, serveUrl, frame, inputProps, output: path.join(saida, nome), imageFormat: "jpeg", jpegQuality: 80, scale: 0.5 });
  }
}
console.log(`${itens.length} itens, ${itens.length * fracoes.length} quadros em ${saida}`);
