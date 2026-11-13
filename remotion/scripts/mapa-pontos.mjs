// Gera o mapa pontilhado (Américas + Europa/África inteiras) usado pelo `numero` (NumeroSaldo) em src/componentes/mapa-pontos.ts.
// Projeção equirretangular (linear): x = TX + K·lon, y = TY − K·lat, em coordenadas locais do card do mapa (0,0 no canto).
// Dados: world-atlas (Natural Earth, domínio público). Uso (de dentro de remotion/): node scripts/mapa-pontos.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const mundo = require("world-atlas/countries-50m.json");

// Recorte: lon −172…72, lat 84…−58. Folga para nenhum continente das Américas, Europa e África ser cortado;
// o que passa da folga (Ásia, Alasca extremo) some no degradê radial aplicado no componente (mask-image).
const K = 2.7; // px por grau
const TX = 172 * K;
const TY = 84 * K;
const PASSO = 6; // espaçamento da grade de pontos
const AREA = { x0: 0, x1: 244 * K, y0: 0, y1: 142 * K };

const paises = feature(mundo, mundo.objects.countries).features;
const brasil = paises.find((f) => f.id === "076");
const outros = paises.filter((f) => f.id !== "076" && f.id !== "010"); // sem Brasil e Antártida

let pm = "";
let pb = "";
for (let y = AREA.y0; y <= AREA.y1; y += PASSO) {
  const lat = (TY - y) / K;
  // grade desencontrada (linhas alternadas meio passo) para um pontilhado mais orgânico
  const desloc = ((y - AREA.y0) / PASSO) % 2 ? PASSO / 2 : 0;
  for (let x = AREA.x0 + desloc; x <= AREA.x1; x += PASSO) {
    const lon = (x - TX) / K;
    const pt = [lon, lat];
    const cmd = `M${+x.toFixed(1)} ${+y.toFixed(1)}h0`;
    if (geoContains(brasil, pt)) pb += cmd;
    else if (outros.some((f) => geoContains(f, pt))) pm += cmd;
  }
}

const saida = `// Gerado por scripts/mapa-pontos.mjs (world-atlas / Natural Earth, domínio público). Não editar à mão.
// Projeção equirretangular no card do mapa: x = MAPA.tx + MAPA.k·lon, y = MAPA.ty − MAPA.k·lat.
export const MAPA = { k: ${K}, tx: ${TX}, ty: ${TY}, passo: ${PASSO}, w: ${AREA.x1}, h: ${AREA.y1} };
export const PONTOS_MUNDO = "${pm}";
export const PONTOS_BRASIL = "${pb}";
`;
const destino = path.resolve("src/componentes/mapa-pontos.ts");
fs.writeFileSync(destino, saida);
console.log("ok", destino, (saida.length / 1024).toFixed(0), "KB");
