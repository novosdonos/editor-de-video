// `numero` · variação "vendas no exterior" (nome mantido `NumeroSaldo` porque o Root importa assim), layout `cheia`.
// v6 (2026-11-11): dado de apoio discreto, tudo agrupado à direita do rosto (estilo.md §11). No topo, o total em vidro
// pequeno; logo abaixo, um único espaço que mostra uma notificação real da Guru por vez (troca no lugar; na fase
// acelerada some e só o total sobe) e depois, no momento-chave, a tag de vidro "N vendas no exterior" com as
// bandeirinhas. Embaixo, à direita: mapa pontilhado sutil (Américas + Europa/África inteiras), sem moldura, com as
// bordas dissolvendo em degradê radial; cada venda acende o seu pino laranja com anel de pulso. Na palavra do exterior
// saem arcos finos do Brasil para cada pino; em cada moeda falada acendem os pinos (e as bandeiras da tag) daquela
// moeda (moeda sem venda não acende nada). Laranja só nos pinos.
// Origem: cena "Vendas no exterior" da aula 01 (v5 achada "muita coisa": menor, à direita, menos elementos).
// Mapa: scripts/mapa-pontos.mjs gera mapa-pontos.ts (world-atlas, domínio público).
// Bandeiras: setup/biblioteca/interfaces/bandeiras (flag-icons, MIT; ver ORIGEM.md).
import { Img, staticFile } from "remotion";
import { cores } from "../marca";
import { brl, clamp01, eio, eo, eob, lerp, pulso, seg } from "../movimento";
import { CameraCheia, Palco, useT, type Camera } from "./comum";
import { MAPA, PONTOS_BRASIL, PONTOS_MUNDO } from "./mapa-pontos";

// pais: ISO 3166-1 alfa-2 em minúsculas (chave de `bandeiras`); lat/lon: pino no mapa; t: a venda chega.
export type Venda = { valor: number; regiao: string; pais: string; lat: number; lon: number; t: number };

export type NumeroSaldoProps = {
  camera: Camera;
  dur: number;
  vendas: Venda[]; // em ordem de chegada
  fecha: number; // total assenta no valor real e entra a tag "N vendas no exterior" (momento-chave)
  recolhe: number; // limite para a notificação sair (sai antes se as vendas acelerarem)
  mapaT: number; // mapa pontilhado abre a partir do Brasil
  bandeirasT: number; // bandeirinhas entram na tag
  foraT: number; // arcos saem do Brasil
  moedas: { t: number; paises: string[] }[]; // cada moeda falada: acende pinos e bandeiras da moeda
  origem: { lat: number; lon: number };
  paises: string[]; // bandeiras da tag, na ordem
  icone: string; // ícone do app de vendas (staticFile)
  bandeiras: Record<string, string>; // pais → SVG (staticFile)
};

const proj = (lat: number, lon: number) => ({ x: MAPA.tx + MAPA.k * lon, y: MAPA.ty - MAPA.k * lat });
const reais = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Geometria (palco 1920×1080). Rosto no centro (x ≈ 760–1160): tudo alinhado à direita, longe dele.
const MD = 60; // margem direita do grupo
const TOPO = 56; // topo do total
const VAGA = 162; // topo do espaço único abaixo do total (notificação, depois a tag)
const TAG_H = 52;
const NW = 440; // largura da notificação
const NH = 82; // altura da notificação
const MESC = 0.88; // escala do mapa
const MAPA_X = 1410; // esquerda do mapa (EUA caem à direita da estante, na parede escura)
const MAPA_TOPO = 224; // topo do mapa (logo abaixo da tag; o degradê some antes dela)

// Bandeira pequena 4:3, cantos levemente arredondados e filete claro para não sumir no vidro.
const Bandeira: React.FC<{ src: string; altura: number; style?: React.CSSProperties }> = ({ src, altura, style }) => (
  <Img
    src={src}
    style={{
      width: Math.round((altura * 4) / 3),
      height: altura,
      borderRadius: Math.max(3, altura * 0.16),
      objectFit: "cover",
      boxShadow: "0 0 0 1px rgba(255,255,255,.25)",
      flexShrink: 0,
      display: "block",
      ...style,
    }}
  />
);

// Bordas do mapa dissolvendo no fundo: nenhuma aresta visível.
const DEGRADE = "radial-gradient(closest-side at 48% 48%, #000 50%, rgba(0,0,0,.6) 76%, transparent 100%)";

export const NumeroSaldo: React.FC<NumeroSaldoProps> = (p) => {
  const t = useT();
  const n = p.vendas.length;

  // Total: cada venda soma em 0,25 s; a partir de `fecha` fica exatamente no valor real.
  const final = p.vendas.reduce((s, v) => s + v.valor, 0);
  const total = t >= p.fecha ? final : p.vendas.reduce((s, v) => s + v.valor * eo(seg(t, v.t, v.t + 0.25)), 0);
  const chave = pulso(seg(t, p.fecha, p.fecha + 0.5));
  const tot = eo(seg(t, p.vendas[0].t - 0.1, p.vendas[0].t + 0.45));
  const tag = eo(seg(t, p.fecha + 0.05, p.fecha + 0.5));

  // Notificação: só as vendas calmas (≥ 0,45 s de folga), uma por vez, trocando no lugar; some quando acelera.
  let calmas = 1;
  while (calmas < n && p.vendas[calmas].t - p.vendas[calmas - 1].t >= 0.45) calmas++;
  const fimNotif = Math.min(p.recolhe, calmas < n ? p.vendas[calmas].t : p.recolhe);
  const someNotif = eio(seg(t, fimNotif - 0.05, fimNotif + 0.3));

  // Foco das moedas: a moeda falada acende os seus pinos/bandeiras; os outros caem.
  const luz = (pais: string, baixo = 0.3) => {
    let a = 1;
    let s = 0;
    for (const m of p.moedas) {
      const q = eio(seg(t, m.t, m.t + 0.3));
      if (q <= 0) continue;
      const dentro = m.paises.includes(pais);
      a = lerp(a, dentro ? 1 : baixo, q);
      s = lerp(s, dentro ? pulso(seg(t, m.t, m.t + 0.6)) : 0, q);
    }
    return { a, s };
  };

  // Mapa: pontos abrem a partir do Brasil; um pino por lugar (vendas no mesmo lugar repetem o pulso).
  const mapa = eo(seg(t, p.mapaT, p.mapaT + 0.6));
  const abre = eio(seg(t, p.mapaT + 0.1, p.mapaT + 1.3));
  const o = proj(p.origem.lat, p.origem.lon);
  const locais: { lat: number; lon: number; pais: string; ts: number[] }[] = [];
  for (const v of p.vendas) {
    const l = locais.find((x) => Math.abs(x.lat - v.lat) < 0.5 && Math.abs(x.lon - v.lon) < 0.5);
    if (l) l.ts.push(v.t);
    else locais.push({ lat: v.lat, lon: v.lon, pais: v.pais, ts: [v.t] });
  }

  return (
    <Palco>
      <CameraCheia camera={p.camera} dur={p.dur} />

      {/* Mapa sutil à direita: só pontos, pinos e arcos, bordas em degradê (sem moldura nem recorte) */}
      {t >= p.mapaT && (
        <div
          style={{
            position: "absolute",
            left: MAPA_X,
            top: MAPA_TOPO,
            width: MAPA.w,
            height: MAPA.h,
            scale: String(MESC),
            transformOrigin: "0 0",
            opacity: mapa,
            maskImage: DEGRADE,
            WebkitMaskImage: DEGRADE,
          }}
        >
          {/* sombra difusa só para os pontos lerem sobre partes claras da imagem (não é card) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(closest-side, rgba(10,12,16,.34), rgba(10,12,16,0))",
            }}
          />
          <svg
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
            viewBox={`0 0 ${MAPA.w} ${MAPA.h}`}
            width={MAPA.w}
            height={MAPA.h}
          >
            <path
              d={PONTOS_MUNDO}
              style={{
                stroke: "rgba(255,255,255,.38)",
                strokeWidth: 2.3,
                strokeLinecap: "round",
                clipPath: `circle(${(abre * 720).toFixed(1)}px at ${o.x}px ${o.y}px)`,
              }}
            />
            <path d={PONTOS_BRASIL} style={{ stroke: "rgba(255,255,255,.6)", strokeWidth: 2.3, strokeLinecap: "round" }} />

            {/* Arcos finos Brasil → pino */}
            {locais.map((l, k) => {
              const d = proj(l.lat, l.lon);
              const a = eio(seg(t, p.foraT + k * 0.035, p.foraT + 0.75 + k * 0.035));
              if (a <= 0) return null;
              const cx = lerp(o.x, d.x, 0.18);
              const cy = lerp(o.y, d.y, 0.72);
              return (
                <path
                  key={k}
                  d={`M${o.x.toFixed(1)} ${o.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${d.x.toFixed(1)} ${d.y.toFixed(1)}`}
                  pathLength={1}
                  style={{
                    fill: "none",
                    stroke: "rgba(255,255,255,.38)",
                    strokeWidth: 1.1,
                    strokeLinecap: "round",
                    strokeDasharray: "1 1",
                    strokeDashoffset: (1 - a).toFixed(4),
                    opacity: luz(l.pais, 0.25).a,
                  }}
                />
              );
            })}

            {/* Origem: Brasil */}
            <circle cx={o.x} cy={o.y} r={9} style={{ fill: "rgba(255,255,255,.12)" }} />
            <circle cx={o.x} cy={o.y} r={3.6} style={{ fill: cores.puro }} />

            {/* Pinos laranja com anel; cada venda que chega dá um pulso no seu pino */}
            {locais.map((l, k) => {
              const d = proj(l.lat, l.lon);
              const e = seg(t, l.ts[0] - 0.05, l.ts[0] + 0.35);
              if (e <= 0) return null;
              const { a, s } = luz(l.pais);
              const r = lerp(0.4, 1, eob(e, 2)) * (1 + 0.35 * s);
              return (
                <g key={k} style={{ opacity: clamp01(e * 3) * a }}>
                  <circle cx={d.x} cy={d.y} r={8.5 * r} style={{ fill: "none", stroke: cores.sinopia, strokeWidth: 3, opacity: 0.28 }} />
                  {[...l.ts, ...p.moedas.filter((m) => m.paises.includes(l.pais)).map((m) => m.t)].map((ti, j) => {
                    const q = seg(t, ti, ti + 0.9);
                    if (q <= 0 || q >= 1) return null;
                    return (
                      <circle
                        key={j}
                        cx={d.x}
                        cy={d.y}
                        r={lerp(5, 22, eo(q))}
                        style={{ fill: "none", stroke: cores.sinopia, strokeWidth: 1.8, opacity: 0.8 * (1 - q) }}
                      />
                    );
                  })}
                  <circle cx={d.x} cy={d.y} r={3.8 * r} style={{ fill: cores.sinopia }} />
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Total, pequeno, no canto superior direito */}
      <div
        className="nd-glass"
        style={{
          right: MD,
          top: TOPO,
          padding: "14px 24px 12px",
          borderRadius: 22,
          opacity: tot,
          translate: `0px ${lerp(-12, 0, tot).toFixed(1)}px`,
          scale: String(lerp(0.96, 1, tot)),
          transformOrigin: "100% 0",
        }}
      >
        <p
          className="nd-num"
          style={{
            fontSize: 62,
            fontWeight: 600,
            letterSpacing: "-.035em",
            lineHeight: 1,
            whiteSpace: "nowrap",
            scale: String(1 + 0.06 * chave),
            transformOrigin: "100% 70%",
          }}
        >
          R$ {brl(total)}
        </p>
      </div>

      {/* Espaço único abaixo do total: uma notificação da Guru por vez (troca no lugar) */}
      {p.vendas.slice(0, calmas).map((v, i) => {
        if (t < v.t - 0.05 || someNotif >= 1) return null;
        const entra = eo(seg(t, v.t - 0.05, v.t + 0.35));
        const prox = p.vendas[i + 1];
        const sai = i + 1 < calmas ? eio(seg(t, prox.t - 0.05, prox.t + 0.2)) : someNotif;
        if (sai >= 1) return null;
        return (
          <div
            key={i}
            className="nd-glass"
            style={{
              right: MD,
              top: VAGA,
              width: NW,
              height: NH,
              boxSizing: "border-box",
              padding: "0 22px 0 16px",
              borderRadius: 20,
              display: "grid",
              gridTemplateColumns: "42px 1fr",
              columnGap: 14,
              alignItems: "center",
              opacity: clamp01(entra * 1.6) * (1 - sai),
              translate: `0px ${(lerp(12, 0, entra) - 10 * sai).toFixed(1)}px`,
              scale: String(lerp(0.96, 1, entra)),
              transformOrigin: "100% 0",
            }}
          >
            <Img src={p.icone} style={{ width: 42, height: 42, borderRadius: 11 }} />
            <div style={{ lineHeight: 1.15, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <p style={{ fontSize: 19, fontWeight: 500, opacity: 0.62, whiteSpace: "nowrap" }}>Pedido aprovado</p>
                <p style={{ fontSize: 17, fontWeight: 500, opacity: 0.45 }}>agora</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 4, whiteSpace: "nowrap" }}>
                <p className="nd-num" style={{ fontSize: 28, fontWeight: 600 }}>R$ {reais(v.valor)}</p>
                <Bandeira src={p.bandeiras[v.pais]} altura={18} />
                <p style={{ fontSize: 28, fontWeight: 500, opacity: 0.72, overflow: "hidden", textOverflow: "ellipsis" }}>{v.regiao}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Momento-chave: tag de vidro em pílula "N vendas no exterior" + bandeirinhas, no mesmo espaço */}
      <div
        className="nd-glass"
        style={{
          right: MD,
          top: VAGA,
          height: TAG_H,
          boxSizing: "border-box",
          padding: "0 18px 0 22px",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: tag,
          translate: `0px ${lerp(-8, 0, tag).toFixed(1)}px`,
          scale: String(lerp(0.95, 1, tag)),
          transformOrigin: "100% 50%",
        }}
      >
        <p style={{ fontSize: 28, fontWeight: 500, whiteSpace: "nowrap", letterSpacing: "-.005em" }}>
          <span className="nd-num" style={{ fontWeight: 600 }}>{n}</span> vendas no exterior
        </p>
        <div style={{ display: "flex", gap: 5 }}>
          {p.paises.map((c, k) => {
            const e = seg(t, p.bandeirasT + k * 0.07, p.bandeirasT + k * 0.07 + 0.35);
            const { a, s } = luz(c, 0.35);
            return (
              <Bandeira
                key={c}
                src={p.bandeiras[c]}
                altura={18}
                style={{ opacity: clamp01(e * 2) * a, scale: String(lerp(0.5, 1, eob(e, 1.8)) * (1 + 0.15 * s)) }}
              />
            );
          })}
        </div>
      </div>
    </Palco>
  );
};

// Parâmetros da aula 01 (câmera e batidas ancoradas nas palavras faladas; t = 0 em 243,4 s do vídeo editado).
// Valores fictícios de exemplo (22 vendas no exterior); troque pelos números reais do seu vídeo.
// Região só com a cidade (ou o país, quando não há cidade): a bandeira já diz o país.
// Exemplo de preenchimento (vídeo de demonstração do criador do sistema). A câmera e as imagens citadas
// não vêm no repositório: use como modelo de parâmetros, não registre no Root sem trocar pelos arquivos do seu vídeo.
const cam = (inicio: number) => ({ src: "01-meu-primeiro-video/editado.mp4", inicio });
type Base = Omit<Venda, "t">;
const calmas: Venda[] = [
  { valor: 3000, regiao: "Flórida", pais: "us", lat: 28.1, lon: -81.6, t: 1.86 },
  { valor: 3500, regiao: "Chicago", pais: "us", lat: 41.9, lon: -87.6, t: 3.83 },
  { valor: 2500, regiao: "Dublin", pais: "ie", lat: 53.3, lon: -6.3, t: 4.99 },
  { valor: 3000, regiao: "Paris", pais: "fr", lat: 48.9, lon: 2.35, t: 5.45 },
];
const rapidas: Base[] = [
  { valor: 2000, regiao: "Nova York", pais: "us", lat: 40.7, lon: -74 },
  { valor: 1500, regiao: "Irlanda", pais: "ie", lat: 52.4, lon: -8.6 },
  { valor: 2500, regiao: "Connecticut", pais: "us", lat: 41.6, lon: -72.7 },
  { valor: 3500, regiao: "Nova Jersey", pais: "us", lat: 39.9, lon: -74.7 },
  { valor: 4000, regiao: "Suíça", pais: "ch", lat: 46.8, lon: 8.2 },
  { valor: 3500, regiao: "Seattle", pais: "us", lat: 47.6, lon: -122.3 },
  { valor: 2000, regiao: "Lisboa", pais: "pt", lat: 38.7, lon: -9.1 },
  { valor: 1500, regiao: "Fort Lauderdale", pais: "us", lat: 26.1, lon: -80.1 },
  { valor: 2500, regiao: "Virgínia", pais: "us", lat: 37.5, lon: -78.8 },
  { valor: 3000, regiao: "Alemanha", pais: "de", lat: 51.1, lon: 10.4 },
  { valor: 3000, regiao: "Irlanda", pais: "ie", lat: 52.4, lon: -8.6 },
  { valor: 1500, regiao: "Phoenix", pais: "us", lat: 33.4, lon: -112 },
  { valor: 2500, regiao: "Cleveland", pais: "us", lat: 41.5, lon: -81.7 },
  { valor: 2000, regiao: "Boston", pais: "us", lat: 42.4, lon: -71.1 },
  { valor: 3500, regiao: "Fort Lauderdale", pais: "us", lat: 26.1, lon: -80.1 },
  { valor: 3000, regiao: "Houston", pais: "us", lat: 29.8, lon: -95.4 },
  { valor: 2000, regiao: "Portugal", pais: "pt", lat: 40.2, lon: -8.4 },
  { valor: 2500, regiao: "Atlanta", pais: "us", lat: 33.7, lon: -84.4 },
];

// O total acompanha a fala que cita os valores: cada venda acelerada chega quando a soma
// acumulada alcança a curva [t, R$] abaixo, e o total fecha no valor final (R$ 58.000).
const CURVA: [number, number][] = [
  [5.75, 12000], // fim das calmas
  [6.5, 47560],
  [7.0, 56260],
  [7.35, 58000],
];
const quando = (soma: number) => {
  for (let k = 1; k < CURVA.length; k++) {
    const [t0, v0] = CURVA[k - 1];
    const [t1, v1] = CURVA[k];
    if (soma <= v1) return t0 + ((soma - v0) / (v1 - v0)) * (t1 - t0);
  }
  return CURVA[CURVA.length - 1][0];
};
let soma = calmas.reduce((s, v) => s + v.valor, 0);
const aceleradas: Venda[] = rapidas.map((v) => {
  soma += v.valor;
  return { ...v, t: Number(quando(soma).toFixed(2)) };
});

const bandeira = (pais: string) => staticFile(`biblioteca/interfaces/bandeiras/bandeira_${pais}.svg`);

export const numeroAula01: NumeroSaldoProps = {
  camera: cam(243.4),
  dur: 14.5,
  vendas: [...calmas, ...aceleradas],
  fecha: 7.55,
  recolhe: 8.05,
  mapaT: 1.2,
  bandeirasT: 7.8,
  foraT: 11.33,
  moedas: [
    { t: 12.6, paises: ["us"] },
    { t: 13.2, paises: ["ie", "pt", "fr", "de"] },
  ],
  origem: { lat: -15.8, lon: -47.9 },
  paises: ["us", "ie", "pt", "ch", "de", "fr"],
  icone: staticFile("biblioteca/interfaces/logo_guru.png"),
  bandeiras: Object.fromEntries(["us", "ie", "fr", "ch", "pt", "de"].map((c) => [c, bandeira(c)])),
};

// ======================================================================================================
// `numero` · variação "anos × hora" (cena 10 da aula 01), layout `cheia`: dois vidros na altura dos olhos, um de
// cada lado do rosto (estilo.md §8 "0 dólares | 0 seguidores"). À esquerda os anos de estudo contam 4 → 5 → 6
// na fala, com a barra de 6 anos enchendo; à direita o preço da hora conta 200 → 300 e, no
// momento-chave, entra o selo laranja (único laranja). O lado dos anos cai para segundo plano.
// ======================================================================================================
export type NumeroAnosHoraProps = {
  camera: Camera;
  dur: number;
  anos: number[]; // tempos de cada ano
  rotuloAnos: number; // rótulo dos anos
  faculdade: number; // complemento dos anos
  barra: [number, number]; // início → fim: a barra de 6 anos enche
  preco: number[]; // tempos de cada preço
  hora: number; // selo (momento-chave)
  sai: number;
};

// Número que troca rolando para cima (cada valor no seu tempo).
const Rolo: React.FC<{ t: number; valores: string[]; tempos: number[]; tam: number }> = ({ t, valores, tempos, tam }) => {
  let pos = 0;
  tempos.forEach((x, i) => {
    if (i > 0) pos += eio(seg(t, x - 0.08, x + 0.22));
  });
  const largura = Math.max(...valores.map((v) => v.length)) * tam * 0.6;
  return (
    <div style={{ position: "relative", height: tam, width: largura, overflow: "hidden", flex: "none" }}>
      <div style={{ translate: `0px ${(-pos * tam).toFixed(1)}px` }}>
        {valores.map((v) => (
          <p key={v} className="nd-num" style={{ height: tam, fontSize: tam, fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1 }}>
            {v}
          </p>
        ))}
      </div>
    </div>
  );
};

export const NumeroAnosHora: React.FC<NumeroAnosHoraProps> = (p) => {
  const t = useT();
  const ent = (a: number) => {
    const k = eo(seg(t, a, a + 0.55));
    const s = eio(seg(t, p.sai, p.sai + 0.3));
    return { opacity: k * (1 - s), translate: `0px ${(lerp(22, 0, k) - 10 * s).toFixed(1)}px`, scale: String(lerp(0.97, 1, k)) };
  };
  const esq = ent(p.anos[0] - 0.3);
  const dir = ent(p.preco[0] - 0.15);
  const fundoEsq = lerp(1, 0.45, eio(seg(t, p.hora, p.hora + 0.4)));
  const ap = (a: number) => eo(seg(t, a, a + 0.4));
  const k = eo(seg(t, p.hora, p.hora + 0.5));
  const passo = (p.barra[1] - p.barra[0]) / 6;
  const TOPO = 236; // altura dos olhos (y ≈ 30%)
  return (
    <Palco>
      <CameraCheia camera={p.camera} dur={p.dur} />

      {/* Esquerda: anos de faculdade */}
      <div className="nd-glass" style={{ left: 96, top: TOPO, width: 470, height: 330, ...esq, opacity: (esq.opacity as number) * fundoEsq }}>
        <div style={{ position: "absolute", left: 44, top: 40, display: "flex", alignItems: "baseline", gap: 22 }}>
          <Rolo t={t} valores={["4", "5", "6"]} tempos={p.anos} tam={150} />
          <p style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-.02em", opacity: ap(p.rotuloAnos), translate: `${lerp(-10, 0, ap(p.rotuloAnos)).toFixed(1)}px 0px` }}>anos</p>
        </div>
        <p style={{ position: "absolute", left: 46, top: 206, fontSize: 32, fontWeight: 500, opacity: 0.78 * ap(p.faculdade), whiteSpace: "nowrap" }}>de estudo</p>
        <div style={{ position: "absolute", left: 46, right: 46, top: 272, display: "flex", gap: 8 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(255,255,255,.16)", overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "var(--accent)", scale: `${eio(seg(t, p.barra[0] + i * passo, p.barra[0] + (i + 1) * passo)).toFixed(3)} 1`, transformOrigin: "0 50%" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Direita: preço da hora */}
      <div className="nd-glass" style={{ left: 1354, top: TOPO, width: 470, height: 330, ...dir }}>
        <div style={{ position: "absolute", left: 44, top: 40, display: "flex", alignItems: "baseline", gap: 16 }}>
          <p style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-.02em" }}>R$</p>
          <Rolo t={t} valores={["200", "300"]} tempos={p.preco} tam={150} />
        </div>
        <div style={{ position: "absolute", left: 40, top: 214, transformOrigin: "0 50%", opacity: clamp01(k * 3), scale: String(lerp(1.15, 1, k)) }}>
          <span style={{ display: "inline-block", padding: "12px 28px 14px", borderRadius: 999, background: "var(--main)", color: "var(--accent)", fontSize: 44, fontWeight: 600, letterSpacing: "-.015em" }}>a hora</span>
        </div>
      </div>
    </Palco>
  );
};

// Parâmetros da aula 01 (t = 0 em 565,6 s do vídeo editado).
const I10 = 565.6;
const r10 = (abs: number) => Number((abs - I10).toFixed(2));
export const numeroAnosHoraAula01: NumeroAnosHoraProps = {
  camera: cam(I10),
  dur: 13.2,
  anos: [r10(566.5), r10(566.86), r10(567.29)],
  rotuloAnos: r10(567.51),
  faculdade: r10(568.17),
  barra: [r10(568.97), r10(570.5)],
  preco: [r10(575.24), r10(576.04)],
  hora: r10(576.84),
  sai: r10(578.5),
};
