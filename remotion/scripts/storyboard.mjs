// Storyboard: renderiza um still por batida de cada cena e monta previas/storyboard.html.
// Uso (de dentro de remotion/): node scripts/storyboard.mjs <pasta-previas>
// Lê <pasta-previas>/storyboard.json: [{ "cena": "<id da composição>", "titulo": "...", "batidas": [{ "t": 1.9, "legenda": "..." }] }]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const previas = path.resolve(process.argv[2] ?? "");
const plano = JSON.parse(fs.readFileSync(path.join(previas, "storyboard.json"), "utf8"));
const pastaStills = path.join(previas, "storyboard");
// Sempre o storyboard da rodada atual: stills de rodadas anteriores saem (previas/ é apagável)
fs.rmSync(pastaStills, { recursive: true, force: true });
fs.mkdirSync(pastaStills, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), symlinkPublicDir: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
let blocos = "";
for (const cena of plano) {
  const composicao = await selectComposition({ serveUrl, id: cena.cena });
  let quadros = "";
  for (const b of cena.batidas) {
    const frame = Math.min(composicao.durationInFrames - 1, Math.round(b.t * composicao.fps));
    const nome = `${cena.cena}_${String(b.t).replace(".", "-")}s.jpg`;
    await renderStill({ composition: composicao, serveUrl, frame, output: path.join(pastaStills, nome), imageFormat: "jpeg", jpegQuality: 85, scale: 0.5 });
    console.log("ok", nome);
    quadros += `<figure><img src="storyboard/${nome}" loading="lazy"><figcaption><b>${b.t.toFixed(1)} s</b> ${esc(b.legenda)}</figcaption></figure>`;
  }
  blocos += `<section><h2>${esc(cena.titulo)}</h2><p class="meta">${esc(cena.cena)} · ${(composicao.durationInFrames / composicao.fps).toFixed(1)} s${cena.nota ? " · " + esc(cena.nota) : ""}</p><div class="grade">${quadros}</div></section>`;
}

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Storyboard</title>
<style>
:root{--fundo:#F1F1F1;--texto:#191C23;--mudo:#575E6B;--destaque:#FC5C20}
@media (prefers-color-scheme:dark){:root{--fundo:#191C23;--texto:#F1F1F1;--mudo:#9AA0AB}}
body{margin:0;padding:32px 16px;background:var(--fundo);color:var(--texto);font:16px/1.4 system-ui,sans-serif}
main{max-width:1400px;margin:0 auto}h1{margin:0 0 24px}section{margin-bottom:40px}h2{margin:0;border-left:4px solid var(--destaque);padding-left:10px}
.meta{color:var(--mudo);margin:4px 0 12px}.grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
figure{margin:0}img{width:100%;border-radius:8px;display:block}figcaption{font-size:14px;margin-top:6px}b{color:var(--destaque)}
</style></head><body><main><h1>Storyboard</h1>${blocos}</main></body></html>`;
fs.writeFileSync(path.join(previas, "storyboard.html"), html);
console.log("storyboard:", path.join(previas, "storyboard.html"));
