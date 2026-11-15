// Material para a conferência automática do motion (codigos/13_conferir_motion.py).
// Por que existe (2026-11-13): frase longa, texto parado e texto atravessando o rosto estavam proibidos
// no estilo.md e passaram assim mesmo, porque a conferência dependia de alguém lembrar de olhar. Aqui a máquina mede.
// Para cada destaque da aula montada grava dois quadros por instante: com motion e sem motion (só vídeo +
// câmera). A diferença entre os dois é onde o motion cai na tela, qualquer que seja o componente.
// Também grava itens.json com as props de cada item (textos e batidas), lidas sem renderizar.
// Uso (de dentro de remotion/): node scripts/conferir.mjs <aula> <pasta-saida> [id ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const [aula, saida, ...ids] = process.argv.slice(2);
if (!aula || !saida) {
  console.error("Uso: node scripts/conferir.mjs <aula> <pasta-saida> [id ...]");
  process.exit(1);
}
fs.mkdirSync(saida, { recursive: true });
const raiz = path.resolve(import.meta.dirname, "..");
const FRACOES = [0.3, 0.6, 0.9];

// linha do tempo já no tempo do editado atual (com remapa), a mesma que o 09 e o 10 leem
const linha = JSON.parse(execFileSync("node", [path.join(raiz, "scripts/linha.mjs"), aula], { encoding: "utf8", cwd: raiz }));

// props de cada item, sem renderizar: item.render() devolve o elemento React (componente + props)
const tmp = fs.mkdtempSync(path.join(tmpdir(), "conferir-"));
let props = {};
try {
  const entrada = path.join(tmp, "entrada.ts");
  fs.writeFileSync(
    entrada,
    `import { linhas } from ${JSON.stringify(path.join(raiz, "src/aulas"))};
const limpo = (v, n = 0) => {
  if (v === null || typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  if (typeof v !== "object" || n > 6 || v.$$typeof) return undefined;
  if (Array.isArray(v)) return v.map((x) => limpo(x, n + 1)).filter((x) => x !== undefined);
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, limpo(x, n + 1)]).filter(([, x]) => x !== undefined));
};
module.exports = Object.fromEntries(Object.entries(linhas).map(([a, itens]) => [a, Object.fromEntries(itens.map((i) => {
  try { const el = i.render(); return [i.id, { componente: el?.type?.displayName ?? el?.type?.name ?? "", props: limpo(el?.props ?? {}) }]; }
  catch { return [i.id, { componente: "", props: {} }]; }
}))]));`,
  );
  const fora = path.join(tmp, "props.cjs");
  await build({ entryPoints: [entrada], bundle: true, platform: "node", format: "cjs", jsx: "automatic", keepNames: true,
    loader: { ".css": "empty" }, nodePaths: [path.join(raiz, "node_modules")], logLevel: "error", outfile: fora });
  props = createRequire(import.meta.url)(fora)[aula] ?? {};
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

const itens = linha.filter((i) => (ids.length ? ids.includes(i.id) : true));
const serveUrl = await bundle({ entryPoint: path.join(raiz, "src/index.ts"), symlinkPublicDir: true });
const base = { aula, mostrarLegendas: false };
// uma composição resolvida para cada versão: as props que valem no render são as da composição selecionada
// (passar semMotion só no renderStill não muda nada; os dois quadros saíam iguais)
const versoes = [];
for (const [nome, semMotion] of [["com", false], ["sem", true]]) {
  const inputProps = { ...base, semMotion };
  versoes.push({ nome, inputProps, comp: await selectComposition({ serveUrl, id: "Aula", inputProps }) });
}
const comp = versoes[0].comp;
const registro = [];
for (const [n, it] of itens.entries()) {
  // só destaque é medido em imagem (cena desenha a própria câmera; ver o 13): cena entra só com as props
  const quadros = (it.tipo === "destaque" ? FRACOES : []).map((f, k) => ({ k, frame: Math.max(0, Math.min(comp.durationInFrames - 1, Math.round((it.inicio + it.dur * f) * comp.fps))) }));
  // os 3 instantes do item em paralelo (com e sem em seguida): mais que isso trava o Mac
  await Promise.all(quadros.map(async ({ k, frame }) => {
    for (const v of versoes) {
      await renderStill({ composition: v.comp, serveUrl, frame, inputProps: v.inputProps,
        output: path.join(saida, `${it.id}_${k}_${v.nome}.png`), imageFormat: "png", scale: 0.5 });
    }
  }));
  registro.push({ ...it, ...(props[it.id] ?? {}), quadros: quadros.map(({ k, frame }) => ({ k, t: frame / comp.fps })) });
  process.stderr.write(`\r  quadros: ${n + 1}/${itens.length}`);
}
process.stderr.write("\n");
fs.writeFileSync(path.join(saida, "itens.json"), JSON.stringify({ largura: comp.width, altura: comp.height, fps: comp.fps, itens: registro }));
console.log(`${itens.length} itens em ${saida}`);
