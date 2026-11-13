// Imprime a linha do tempo de motion de uma aula (id, tipo, inicio, dur) em JSON, sem abrir o Studio.
// Lida pelo 09 (enquadramento) e pelo 10 (sons): a câmera e os SFX acompanham as cenas e os destaques.
// Uso: node scripts/linha.mjs <aula>   (a partir de remotion/)
import { build } from "esbuild";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const aula = process.argv[2];
if (!aula) {
  console.error("Uso: node scripts/linha.mjs <aula>");
  process.exit(1);
}
const raiz = resolve(import.meta.dirname, "..");
const tmp = mkdtempSync(join(tmpdir(), "linha-"));
try {
  const entrada = join(tmp, "entrada.ts");
  writeFileSync(
    entrada,
    `import { linhas } from ${JSON.stringify(join(raiz, "src/aulas"))};
import { reels } from ${JSON.stringify(join(raiz, "src/reels/index"))};
// reels (vertical dividido): frente = destaque, topo = nada para a câmera, "cena" = cobre a câmera
import { mapear } from ${JSON.stringify(join(raiz, "src/reels/remapa"))};
const fs = require("node:fs");
const remapa = (a) => { try { return JSON.parse(fs.readFileSync(${JSON.stringify(join(raiz, "public"))} + "/" + a + "/remapa.json", "utf8")); } catch { return undefined; } };
const deReels = Object.fromEntries(Object.entries(reels).map(([a, def]) => {
  const r = remapa(a); const n = (t) => mapear(r, t, 0, 1);
  return [a, def.itens
    .map(({ id, zona, inicio, dur, camera }) => ({ id, tipo: camera ?? (zona === "frente" ? "destaque" : "nenhum"), inicio: n(inicio), dur: n(inicio + dur) - n(inicio) }))
    .filter((i) => i.tipo !== "nenhum")];
}));
module.exports = { ...deReels, ...Object.fromEntries(Object.entries(linhas).map(([a, itens]) =>
  [a, (() => { const r = remapa(a); const n = (t) => mapear(r, t, 0, 1);
    return itens.map(({ id, tipo, inicio, dur, entrada, sons }) => ({ id, tipo, inicio: n(inicio), dur: n(inicio + dur) - n(inicio),
      entrada: n(inicio + (entrada ?? 0)) - n(inicio), sons: (sons ?? []).map((s) => ({ ...s, t: n(inicio + s.t) - n(inicio) })) })); })()])) };`,
  );
  const saida = join(tmp, "linha.cjs");
  await build({
    entryPoints: [entrada],
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    loader: { ".css": "empty" },
    nodePaths: [join(raiz, "node_modules")],
    logLevel: "error",
    outfile: saida,
  });
  const linhas = createRequire(import.meta.url)(saida);
  process.stdout.write(JSON.stringify(linhas[aula] ?? []));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
