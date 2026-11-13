// `grafico` · variação "teto": layout reduzido; uma agenda semanal de verdade (coluna de horas, um card por atendimento)
// enche até o limite e trava; depois vira o gráfico em que o "caminho A" estaciona no teto e o "caminho B" sobe.
// Cards em tons pastel por tipo de atendimento (fundo pastel + faixa mais saturada + texto escuro); o laranja fica só
// no selo "Agenda cheia". Sem chips de preço/horas no topo (2026-11-11: só representar a agenda).
// Origem: cena do teste da aula 01 (2026-11-10); refeita em 2026-11-11 com cara de calendário
// (ref. interface_sketchmind-calendario-01, interface_tivita-agenda-04, prova_founderos-trajetoria-01).
import React from "react";
import { Video } from "@remotion/media";
import { Img, Sequence, staticFile, useVideoConfig } from "remotion";
import { loadFont as carregarGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as carregarSerif } from "@remotion/google-fonts/InstrumentSerif";
import { cores, fonteMao, fonteMono } from "../marca";
import { clamp01, eio, eo, eob, lerp, pulso, seg, subir, tremido } from "../movimento";
import { CameraCheia, CameraPainel, Palco, Traco, useInicioCamera, useT, type Camera } from "./comum";

type Tipo = "Consulta" | "Sessão" | "Retorno" | "Avaliação" | "Online";
// [dia 0–4, hora de início, duração em horas, nome, tipo]
export type Atendimento = [number, number, number, string, Tipo];

export type GraficoTetoProps = {
  camera: Camera;
  dur: number;
  semana: string; // ex.: "9 – 13 nov"
  diaHoje: number; // coluna destacada (0–4)
  primeiroDia: number; // número do dia da segunda-feira
  atendimentos: Atendimento[];
  enche: [number, number]; // janela da cascata de eventos
  trava: number; // agenda trava (momento-chave): o total de horas
  porDia: number; // as horas por dia
  troca: number; // agenda vira gráfico
  resultado: number; // linha do resultado começa a subir
};

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const H0 = 8; // primeira linha da grade
const LINHAS = 10; // 8h → 18h
const ALMOCO = 12;

// Geometria do card (coordenadas internas, card em left 56 / top 56).
const CW = 1088;
const CH = 968;
const COL_X = 124;
const COL_W = (CW - COL_X - 28) / 5;
const GRADE_Y = 196;
const LINHA_H = 74;

// Tons pastel frios e harmônicos por tipo (mesma luminosidade; nada perto do laranja, que fica só em "Agenda cheia").
// fundo: card; faixa: barra lateral mais saturada; texto: rótulo do tipo (versão escura da faixa).
const TOM: Record<Tipo, { fundo: string; faixa: string; texto: string }> = {
  Consulta: { fundo: "#E6EFFB", faixa: "#6B9BE0", texto: "#2F5C9E" },
  Sessão: { fundo: "#EDEAFB", faixa: "#9486E0", texto: "#5A4BA8" },
  Retorno: { fundo: "#E3F3EA", faixa: "#5DB386", texto: "#2E7652" },
  Avaliação: { fundo: "#FBE9F0", faixa: "#D97CA1", texto: "#9C3F66" },
  Online: { fundo: "#E1F2F4", faixa: "#4FAAB3", texto: "#2A6F76" },
};

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

const Evento: React.FC<{ a: Atendimento; p: number }> = ({ a, p }) => {
  const [dia, h, d, nome, tipo] = a;
  const tom = TOM[tipo];
  return (
    <div
      style={{
        position: "absolute",
        left: COL_X + dia * COL_W + 4,
        top: GRADE_Y + (h - H0) * LINHA_H + 3,
        width: COL_W - 8,
        height: d * LINHA_H - 6,
        borderRadius: 12,
        background: tom.fundo,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "6px 10px 0 17px",
        lineHeight: 1.15,
        opacity: p,
        translate: `0px ${lerp(12, 0, p).toFixed(1)}px`,
        scale: String(lerp(0.94, 1, p)),
        transformOrigin: "50% 0",
      }}
    >
      <i style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: tom.faixa }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
        <span className="nd-num" style={{ fontSize: 23, fontWeight: 600, color: "var(--ground)" }}>{hh(h)}</span>
        <span style={{ fontSize: 17, fontWeight: 600, color: tom.texto, whiteSpace: "nowrap" }}>{tipo}</span>
      </div>
      <p style={{ fontSize: 20, fontWeight: 500, color: "#3A3F4A", whiteSpace: "nowrap", marginTop: 1 }}>{nome}</p>
    </div>
  );
};

const Cadeado: React.FC = () => (
  <svg viewBox="0 0 24 24" style={{ width: 28, height: 28 }}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" style={{ fill: "var(--accent)" }} />
    <path d="M8 10.5 V7.8 a4 4 0 0 1 8 0 V10.5" style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 2.6 }} />
  </svg>
);

// Seta pontilhada de marco (estilo Founder OS): traço de pontos + ponta.
const SetaPontos: React.FC<{ d: string; ponta: string; o: number }> = ({ d, ponta, o }) => (
  <g style={{ opacity: o }}>
    <path d={d} style={{ fill: "none", stroke: "var(--ground)", strokeWidth: 3.5, strokeLinecap: "round", strokeDasharray: "0.1 10" }} />
    <path d={ponta} style={{ fill: "none", stroke: "var(--ground)", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" }} />
  </g>
);

// Gráfico (coordenadas do card).
const EIXO_Y = 860;
const TETO_Y = 520;
const HORA_D = "M90 850 L260 720 L420 580 L560 520 L1010 520";
const HORA_AREA = `${HORA_D} L1010 ${EIXO_Y} L90 ${EIXO_Y} Z`;
const RES_D = "M90 852 L300 812 L500 730 L640 600 L800 420 L1000 214";
const RES_AREA = `${RES_D} L1000 ${EIXO_Y} L90 ${EIXO_Y} Z`;

export const GraficoTeto: React.FC<GraficoTetoProps> = (p) => {
  const t = useT();

  // Entrada do card e troca agenda → gráfico.
  const entra = eo(seg(t, 0, 0.6));
  const sai = eio(seg(t, p.troca - 0.1, p.troca + 0.35));
  const vem = eo(seg(t, p.troca + 0.2, p.troca + 0.8));

  // Cascata: ordem de cima para baixo (hora, depois dia).
  const ordem = p.atendimentos.map((a, i) => ({ a, i })).sort((x, y) => x.a[1] - y.a[1] || x.a[0] - y.a[0]);
  const passo = (p.enche[1] - p.enche[0]) / Math.max(1, ordem.length - 1);
  const entradas = ordem.map(({ a }, k) => {
    const ini = p.enche[0] + k * passo;
    return { a, q: eo(seg(t, ini, ini + 0.35)) };
  });

  // Momento-chave: o selo entra 15% maior e assenta; a agenda cai para segundo plano.
  const lk = seg(t, p.trava, p.trava + 0.5);
  const selo = eo(lk);
  const fundoAgenda = lerp(1, 0.42, eo(seg(t, p.trava, p.trava + 0.4)));
  const linhaDia = eo(seg(t, p.porDia - 0.15, p.porDia + 0.35));

  // Gráfico.
  const ph = eio(seg(t, p.troca + 0.5, p.troca + 1.6));
  const marco = eo(seg(t, p.troca + 1.5, p.troca + 1.9));
  const pr = eio(seg(t, p.resultado, p.resultado + 1.2));
  const fim = eo(seg(t, p.resultado + 1.1, p.resultado + 1.5));

  return (
    <Palco>
      <div className="nd-fundo">
        <div className="nd-papel" />
        <div className="nd-papel-pontos" />
        <div
          className="nd-card"
          style={{
            left: 56,
            top: 56,
            width: CW,
            height: CH,
            overflow: "hidden",
            opacity: entra,
            translate: `0px ${lerp(36, 0, entra).toFixed(1)}px`,
          }}
        >
          {/* A: agenda da semana */}
          <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, translate: `0px ${(-36 * sai).toFixed(1)}px` }}>
            <div style={{ opacity: fundoAgenda }}>
              {/* Cabeçalho */}
              <div style={{ position: "absolute", left: 36, top: 34, display: "flex", alignItems: "baseline", gap: 18 }}>
                <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-.02em", color: "var(--ground)" }}>Agenda</span>
                <span style={{ fontSize: 26, fontWeight: 500, color: "var(--muted)" }}>{p.semana}</span>
              </div>

              {/* Dias */}
              {DIAS.map((d, i) => {
                const hoje = i === p.diaHoje;
                return (
                  <div key={d} style={{ position: "absolute", left: COL_X + i * COL_W, top: 112, width: COL_W, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 22, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>{d}</span>
                    <span
                      className="nd-num"
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 28,
                        fontWeight: 600,
                        color: hoje ? "var(--accent)" : "var(--ground)",
                        background: hoje ? "var(--ground)" : "transparent",
                      }}
                    >
                      {p.primeiroDia + i}
                    </span>
                  </div>
                );
              })}

              {/* Grade: linhas de hora, almoço e colunas */}
              {Array.from({ length: LINHAS + 1 }, (_, k) => (
                <div key={k} style={{ position: "absolute", left: COL_X - 12, right: 28, top: GRADE_Y + k * LINHA_H, height: 1.5, background: "var(--line)" }} />
              ))}
              {Array.from({ length: 6 }, (_, k) => (
                <div key={k} style={{ position: "absolute", top: GRADE_Y, height: LINHAS * LINHA_H, left: COL_X + k * COL_W, width: 1.5, background: "var(--line)" }} />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: COL_X + 1.5,
                  width: 5 * COL_W - 1.5,
                  top: GRADE_Y + (ALMOCO - H0) * LINHA_H + 1.5,
                  height: LINHA_H - 1.5,
                  background: "repeating-linear-gradient(135deg, #F4F5F7 0 10px, #FFFFFF 10px 20px)",
                }}
              />
              {Array.from({ length: LINHAS }, (_, k) => (
                <span key={k} className="nd-num" style={{ position: "absolute", left: 28, top: GRADE_Y + k * LINHA_H + 8, fontSize: 24, fontWeight: 500, color: "var(--muted)" }}>
                  {String(H0 + k).padStart(2, "0")}h
                </span>
              ))}

              {/* Atendimentos */}
              {entradas.map(({ a, q }) => (
                <Evento key={`${a[0]}-${a[1]}`} a={a} p={q} />
              ))}
            </div>

            {/* Selo de agenda cheia (momento-chave, único laranja) */}
            <div
              style={{
                position: "absolute",
                left: COL_X + 2.5 * COL_W - 320,
                top: 360,
                width: 640,
                padding: "34px 40px 36px",
                boxSizing: "border-box",
                borderRadius: 30,
                background: "var(--accent)",
                boxShadow: "0 30px 70px rgba(25,28,35,.18), 0 2px 8px rgba(25,28,35,.08)",
                opacity: clamp01(lk * 4),
                scale: String(lerp(1.15, 1, selo)),
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px 12px 18px", borderRadius: 999, background: "var(--main)", color: "var(--accent)", fontSize: 32, fontWeight: 600 }}>
                <Cadeado />
                Agenda cheia
              </span>
              <span style={{ fontSize: 58, fontWeight: 600, letterSpacing: "-.03em", color: "var(--ground)", lineHeight: 1.05 }}>
                Sem espaço para crescer
              </span>
              <span style={{ fontSize: 32, fontWeight: 500, color: "var(--muted)", opacity: linhaDia, translate: `0px ${lerp(14, 0, linhaDia).toFixed(1)}px` }}>
                mais de 8 h por dia, todo dia
              </span>
            </div>
          </div>

          {/* B: gráfico caminho A × caminho B */}
          <div style={{ position: "absolute", inset: 0, opacity: vem, translate: `0px ${lerp(36, 0, vem).toFixed(1)}px` }}>
            <p style={{ position: "absolute", left: 40, top: 36, fontSize: 40, fontWeight: 600, letterSpacing: "-.02em", color: "var(--ground)" }}>
              Resultado ao longo do tempo
            </p>

            {/* Áreas suaves, reveladas junto com as linhas */}
            <svg viewBox={`0 0 ${CW} ${CH}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", clipPath: `inset(0 ${((1 - ph) * 100).toFixed(2)}% 0 0)` }}>
              <defs>
                <linearGradient id="gt-hora" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#191C23" stopOpacity="0.10" />
                  <stop offset="1" stopColor="#191C23" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={HORA_AREA} style={{ fill: "url(#gt-hora)" }} />
            </svg>
            <svg viewBox={`0 0 ${CW} ${CH}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", clipPath: `inset(0 ${((1 - pr) * 100).toFixed(2)}% 0 0)` }}>
              <defs>
                <linearGradient id="gt-res" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FC5C20" stopOpacity="0.11" />
                  <stop offset="1" stopColor="#FC5C20" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={RES_AREA} style={{ fill: "url(#gt-res)" }} />
            </svg>

            <svg viewBox={`0 0 ${CW} ${CH}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
              {/* Eixo com seta */}
              <path d={`M90 ${EIXO_Y} H1040`} style={{ stroke: "var(--ground)", strokeWidth: 3 }} />
              <path d={`M1028 ${EIXO_Y - 10} L1042 ${EIXO_Y} L1028 ${EIXO_Y + 10}`} style={{ fill: "none", stroke: "var(--ground)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
              {/* Teto da agenda */}
              <path d={`M90 ${TETO_Y} H1010`} style={{ stroke: "var(--muted)", strokeWidth: 2.5, strokeDasharray: "10 10", opacity: 0.6 * marco }} />
              {/* Linhas */}
              <Traco d={HORA_D} p={ph} largura={6} cor="var(--ground)" />
              <Traco d={RES_D} p={pr} largura={7} />
              {/* Marco do teto */}
              <SetaPontos d="M470 400 Q540 420 552 490" ponta="M541 480 L552 494 L563 481" o={marco} />
              <circle cx={560} cy={TETO_Y} r={13} style={{ fill: "var(--accent)", stroke: "var(--ground)", strokeWidth: 4.5, opacity: marco, scale: String(lerp(0.4, 1, marco)), transformOrigin: `560px ${TETO_Y}px`, transformBox: "view-box" }} />
              {/* Marco do resultado */}
              <SetaPontos d="M760 214 H966" ponta="M955 203 L968 214 L955 225" o={fim} />
              <circle cx={1000} cy={214} r={14} style={{ fill: "var(--main)", stroke: "var(--ground)", strokeWidth: 4.5, opacity: fim, scale: String(lerp(0.4, 1, fim)), transformOrigin: "1000px 214px", transformBox: "view-box" }} />
            </svg>

            {/* Rótulos */}
            <p style={{ position: "absolute", left: 250, top: 352, fontSize: 30, fontWeight: 600, color: "var(--ground)", opacity: marco, translate: `0px ${lerp(10, 0, marco).toFixed(1)}px` }}>
              Agenda cheia
            </p>
            <p style={{ position: "absolute", right: 78, top: 546, fontSize: 30, fontWeight: 600, color: "var(--ground)", opacity: marco }}>Caminho A</p>
            <div
              style={{
                position: "absolute",
                left: 470,
                top: 166,
                padding: "16px 24px",
                borderRadius: 18,
                background: "var(--ground)",
                color: "var(--accent)",
                fontSize: 32,
                fontWeight: 600,
                opacity: fim,
                translate: `0px ${lerp(12, 0, fim).toFixed(1)}px`,
              }}
            >
              Caminho B
            </div>
            <span style={{ position: "absolute", left: 90, top: EIXO_Y + 18, fontSize: 26, fontWeight: 500, color: "var(--muted)" }}>Hoje</span>
            <span style={{ position: "absolute", right: 48, top: EIXO_Y + 18, fontSize: 26, fontWeight: 500, color: "var(--muted)" }}>Anos</span>
          </div>
        </div>
      </div>
      <CameraPainel camera={p.camera} dur={p.dur} />
    </Palco>
  );
};

// Parâmetros da aula 01 (câmera e batidas ancoradas nas palavras faladas; t = 0 em 688,9 s do vídeo editado).
// Agenda fictícia: 44 h exatas (seg–qui 9 h, sex 8 h; almoço 12–13).
// Exemplo de preenchimento (vídeo de demonstração do criador do sistema). A câmera e as imagens citadas
// não vêm no repositório: use como modelo de parâmetros, não registre no Root sem trocar pelos arquivos do seu vídeo.
const cam = (inicio: number) => ({ src: "01-meu-primeiro-video/editado.mp4", inicio });
export const graficoAula01: GraficoTetoProps = {
  camera: cam(688.9),
  dur: 13,
  semana: "9 – 13 nov",
  diaHoje: 2,
  primeiroDia: 9,
  atendimentos: [
    [0, 8, 1, "Ana Souza", "Consulta"],
    [0, 9, 2, "Bruno Lima", "Sessão"],
    [0, 11, 1, "Carla Dias", "Retorno"],
    [0, 13, 2, "Diego Reis", "Sessão"],
    [0, 15, 1, "Elisa Matos", "Online"],
    [0, 16, 1, "Fábio Nunes", "Avaliação"],
    [0, 17, 1, "Gabi Rocha", "Retorno"],
    [1, 8, 2, "Helena Prado", "Sessão"],
    [1, 10, 1, "Igor Alves", "Online"],
    [1, 11, 1, "Júlia Melo", "Avaliação"],
    [1, 13, 1, "Kátia Lopes", "Retorno"],
    [1, 14, 2, "Lucas Pinto", "Sessão"],
    [1, 16, 2, "Marina Cruz", "Sessão"],
    [2, 8, 1, "Nina Castro", "Consulta"],
    [2, 9, 1, "Otávio Reis", "Retorno"],
    [2, 10, 2, "Paula Brito", "Sessão"],
    [2, 13, 2, "Rafael Kim", "Sessão"],
    [2, 15, 1, "Sofia Leal", "Avaliação"],
    [2, 16, 1, "Tânia Melo", "Online"],
    [2, 17, 1, "Vítor Sá", "Retorno"],
    [3, 8, 2, "Bianca Luz", "Sessão"],
    [3, 10, 1, "Caio Nunes", "Online"],
    [3, 11, 1, "Davi Moura", "Retorno"],
    [3, 13, 1, "Elaine Paz", "Consulta"],
    [3, 14, 1, "Felipe Rios", "Avaliação"],
    [3, 15, 2, "Gisele Teles", "Sessão"],
    [3, 17, 1, "Hugo Lins", "Retorno"],
    [4, 8, 1, "Iara Costa", "Consulta"],
    [4, 9, 2, "João Fonseca", "Sessão"],
    [4, 11, 1, "Lara Dutra", "Avaliação"],
    [4, 14, 2, "Mateus Vaz", "Sessão"],
    [4, 16, 1, "Nara Gomes", "Retorno"],
    [4, 17, 1, "Olga Ramos", "Online"],
  ],
  enche: [1.0, 5.1],
  trava: 5.36,
  porDia: 7.9,
  troca: 8.84,
  resultado: 10.66,
};

// ======================================================================================================
// Destaques transparentes no terço livre (família "Tempo e quantidade" / "Sistema"): camada sobre a câmera cheia,
// texto branco com sombra, um laranja por tela, vinheta escura atrás para ler sobre o vídeo. Terço esquerdo, altura
// dos olhos. Promovidos de src/novas em 2026-11-13 (aula 01). Batidas em segundos desde o início da cena.
// ======================================================================================================
const SOMBRA_TERCO = "0 2px 18px rgba(0,0,0,.62), 0 1px 3px rgba(0,0,0,.45)";

// `grafico` · variação "ano volta": um contador de ano que volta no compasso da fala (ex.: 2026 → 1996 → 1986 → 1976);
// cada ano entra de cima e empurra o anterior para baixo; o último fica laranja e ganha sublinhado à mão.
// Raciocínio: "fazem igual a X anos atrás" vira tempo andando para trás, não frase escrita.
// Quando usar: fala que compara o hoje com um passado em números (anos, décadas), com 3–5 marcas faladas.
// Quando não usar: data única (vira rótulo), passado sem número, ou contagem para a frente (use outro contador).
// Origem: aula 01 (d37-ano-volta, 2026-11-13), no lugar de uma frase parada na tela.
export type GraficoAnoVoltaProps = {
  camera: Camera;
  dur: number;
  rotulo: string; // linha mono acima do contador (ex.: "fazendo como em")
  anos: { ano: number; t: number }[]; // cada ano e a batida em que entra; o 1º entra com a camada, o último fica laranja
};

export const GraficoAnoVolta: React.FC<GraficoAnoVoltaProps> = ({ dur, rotulo, anos: ANOS }) => {
  const t = useT();
  const e = eo(seg(t, ANOS[0].t - 0.1, ANOS[0].t + 0.3));
  const sai = eio(seg(t, dur - 0.35, dur));
  const ultimo = ANOS[ANOS.length - 1];
  const laranja = eio(seg(t, ultimo.t, ultimo.t + 0.3));
  const sub = eio(seg(t, ultimo.t + 0.15, ultimo.t + 0.6));
  return (
    <Palco saida={{ opacity: 1 - sai }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: e,
          background: "radial-gradient(ellipse 560px 380px at 300px 480px, rgba(12,14,18,.42), transparent 72%)",
        }}
      />
      <div style={{ position: "absolute", left: 100, top: 360, opacity: e, translate: `0px ${(lerp(20, 0, e) - 18 * sai).toFixed(1)}px` }}>
        <p style={{ fontFamily: fonteMono, fontSize: 26, letterSpacing: "0.14em", textTransform: "uppercase", color: cores.puro, opacity: 0.8, textShadow: SOMBRA_TERCO }}>
          {rotulo}
        </p>
        {/* contador: cada ano entra de cima e empurra o anterior para baixo */}
        <div style={{ position: "relative", height: 150, width: 440, overflow: "hidden", marginTop: 6 }}>
          {ANOS.map((a, i) => {
            const entra = i === 0 ? 1 : eio(seg(t, a.t - 0.04, a.t + 0.2));
            const proxT = ANOS[i + 1]?.t;
            const desce = proxT !== undefined ? eio(seg(t, proxT - 0.04, proxT + 0.2)) : 0;
            if (entra <= 0 || desce >= 1) return null;
            const y = (1 - entra) * -150 + desce * 150;
            return (
              <span
                key={a.ano}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  translate: `0px ${y.toFixed(1)}px`,
                  fontSize: 150,
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                  color: i === ANOS.length - 1 ? `color-mix(in srgb, ${cores.sinopia} ${(laranja * 100).toFixed(0)}%, ${cores.puro})` : cores.puro,
                  textShadow: SOMBRA_TERCO,
                }}
              >
                {a.ano}
              </span>
            );
          })}
        </div>
        <svg viewBox="0 0 300 30" preserveAspectRatio="none" style={{ display: "block", width: 380, height: 26, overflow: "visible", translate: tremido(t).replace(",", "") }}>
          <Traco d="M6 18 C80 8 190 24 294 10" p={sub} largura={8} />
        </svg>
      </div>
    </Palco>
  );
};

// `grafico` · variação "consulta × anos": duas barras de tempo empilhadas. Na 1ª batida entra a de cima, um traço
// laranja mínimo que pulsa enquanto espera; na 2ª a de baixo (branca) cresce até a largura toda e o número conta
// (ex.: 5 → 6). A desproporção é a mensagem.
// Quando usar: comparação de duas durações/quantidades muito desiguais ditas em sequência (pouco × muito).
// Quando não usar: valores próximos (a barra não mostra nada), mais de dois itens (use gráfico de barras), dinheiro.
// Origem: aula 01 (d38-consulta-anos, 2026-11-13), no lugar de uma frase parada na tela.
export type GraficoConsultaAnosProps = {
  camera: Camera;
  dur: number;
  curto: { rotulo: string; valor: string; t: number }; // barra mínima laranja (ex.: "uma sessão" · "1 hora"), entra em t
  longo: { rotulo: string; de: number; para: number; unidade: string; t: number; troca: number }; // barra que cresce de t até troca + 0,45; número "de" → "para" em troca
};

const CA_LARGURA = 480;
const CaRotulo: React.FC<{ children: React.ReactNode; o: number }> = ({ children, o }) => (
  <p style={{ fontFamily: fonteMono, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: cores.puro, opacity: 0.8 * o, textShadow: SOMBRA_TERCO }}>
    {children}
  </p>
);

export const GraficoConsultaAnos: React.FC<GraficoConsultaAnosProps> = ({ dur, curto, longo }) => {
  const t = useT();
  const sai = eio(seg(t, dur - 0.35, dur));
  const a = eo(seg(t, curto.t - 0.08, curto.t + 0.3));
  const pisca = 0.75 + 0.25 * Math.cos(Math.max(0, t - curto.t - 0.4) * 6); // o traço curto pulsa enquanto espera a 2ª
  const b = eo(seg(t, longo.t - 0.08, longo.t + 0.25));
  const cresce = eio(seg(t, longo.t, longo.troca + 0.45));
  const anos = t < longo.troca ? longo.de : longo.para;
  return (
    <Palco saida={{ opacity: 1 - sai }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: a,
          background: "radial-gradient(ellipse 600px 400px at 330px 480px, rgba(12,14,18,.42), transparent 72%)",
        }}
      />
      <div style={{ position: "absolute", left: 100, top: 350, width: CA_LARGURA, translate: `0px ${(-18 * sai).toFixed(1)}px` }}>
        {/* curto */}
        <div style={{ opacity: a, translate: `0px ${lerp(18, 0, a).toFixed(1)}px` }}>
          <CaRotulo o={1}>{curto.rotulo}</CaRotulo>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12 }}>
            <div style={{ width: 22, height: 16, borderRadius: 8, background: cores.sinopia, opacity: t > curto.t + 0.4 ? pisca : 1 }} />
            <span style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.02em", color: cores.sinopia, textShadow: SOMBRA_TERCO }}>{curto.valor}</span>
          </div>
        </div>
        {/* longo */}
        <div style={{ marginTop: 44, opacity: b, translate: `0px ${lerp(18, 0, b).toFixed(1)}px` }}>
          <CaRotulo o={1}>{longo.rotulo}</CaRotulo>
          <div style={{ position: "relative", height: 16, marginTop: 12 }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: 16, width: CA_LARGURA * cresce, borderRadius: 8, background: cores.puro, boxShadow: "0 4px 18px rgba(0,0,0,.35)" }} />
          </div>
          <span style={{ display: "block", marginTop: 10, fontSize: 46, fontWeight: 600, letterSpacing: "-0.02em", color: cores.puro, textShadow: SOMBRA_TERCO }}>
            {anos}{` ${longo.unidade}`}
          </span>
        </div>
      </div>
    </Palco>
  );
};

// `grafico` · variação "sorteio": cinco profissionais iguais em fila; um anel laranja corre entre eles como num sorteio,
// desacelera e para no 4º; os outros recuam e o escolhido ganha um rótulo à mão (ex.: "você").
// Raciocínio: "por acaso foi você" — a escolha é sorte, não diferencial.
// Quando usar: fala sobre acaso/indicação/sorte entre iguais, com uma batida de "corre" e outra de "parou".
// Quando não usar: escolha por mérito (o sorteio diz o contrário), ou quando os itens precisam de nome/rosto.
// Origem: aula 01 (d39-acaso-sorteio, 2026-11-13), no lugar de uma frase parada 8 s.
export type GraficoAcasoSorteioProps = {
  camera: Camera;
  dur: number;
  rotulo: string; // escrito à mão sob o escolhido (ex.: "você")
  batidas: {
    entra: number; // a fila aparece
    corre: number; // o anel começa a pular
    acaso: number; // o anel para no escolhido
    voce: number; // o rótulo à mão é escrito
  };
};

const AS_N = 5;
const AS_PASSO = 112;
const AS_X0 = 140; // centro do 1º
const AS_Y = 470;
const AS_ESCOLHIDO = 3;

const AsPessoa: React.FC<{ escolhido: number }> = ({ escolhido }) => (
  <svg viewBox="0 0 64 64" style={{ width: 86, height: 86, overflow: "visible" }}>
    <circle cx={32} cy={22} r={11} fill="none" stroke={cores.puro} strokeWidth={3.2} opacity={lerp(0.85, 1, escolhido)} />
    <path d="M12 56 C14 42 22 37 32 37 C42 37 50 42 52 56" fill="none" stroke={cores.puro} strokeWidth={3.2} strokeLinecap="round" opacity={lerp(0.85, 1, escolhido)} />
  </svg>
);

export const GraficoAcasoSorteio: React.FC<GraficoAcasoSorteioProps> = ({ dur, rotulo, batidas: T }) => {
  const t = useT();
  // pulos do anel: rápidos no começo, mais lentos até parar no escolhido
  const PULOS: [number, number][] = [
    [0, T.corre],
    [2, T.corre + 0.16],
    [4, T.corre + 0.31],
    [1, T.corre + 0.47],
    [3, T.corre + 0.65],
    [0, T.corre + 0.86],
    [2, T.corre + 1.1],
    [4, T.corre + 1.38],
    [AS_ESCOLHIDO, T.acaso],
  ];
  const sai = eio(seg(t, dur - 0.35, dur));
  let atual = -1;
  for (const [i, quando] of PULOS) if (t >= quando) atual = i;
  const parou = eo(seg(t, T.acaso, T.acaso + 0.3));
  const voce = eio(seg(t, T.voce, T.voce + 0.45));
  return (
    <Palco saida={{ opacity: 1 - sai }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: eo(seg(t, T.entra - 0.1, T.entra + 0.3)),
          background: "radial-gradient(ellipse 620px 360px at 340px 480px, rgba(12,14,18,.42), transparent 72%)",
        }}
      />
      {Array.from({ length: AS_N }, (_, i) => {
        const e = eo(seg(t, T.entra + i * 0.06, T.entra + i * 0.06 + 0.3));
        const eu = i === AS_ESCOLHIDO ? parou : 0;
        // os outros recuam quando o sorteio para
        const recua = i === AS_ESCOLHIDO ? 0 : parou;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: AS_X0 + i * AS_PASSO,
              top: AS_Y,
              translate: `-50% calc(-50% + ${(lerp(16, 0, e) - 16 * sai).toFixed(1)}px)`,
              opacity: e * lerp(1, 0.35, recua),
              scale: String(lerp(1, 1.12, eu)),
            }}
          >
            <AsPessoa escolhido={eu} />
          </div>
        );
      })}
      {/* anel do sorteio */}
      {atual >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: AS_X0 + atual * AS_PASSO,
            top: AS_Y,
            width: 112,
            height: 112,
            translate: "-50% -50%",
            borderRadius: "50%",
            border: `4px solid ${cores.sinopia}`,
            boxShadow: `0 0 ${lerp(10, 26, parou).toFixed(0)}px rgba(252,92,32,.55)`,
            scale: String(lerp(1, 1.12, parou)),
            opacity: 1 - sai,
          }}
        />
      ) : null}
      <p
        style={{
          position: "absolute",
          left: AS_X0 + AS_ESCOLHIDO * AS_PASSO,
          top: AS_Y + 70,
          translate: "-50% 0",
          fontFamily: fonteMao,
          fontSize: 64,
          color: cores.sinopia,
          rotate: "-4deg",
          whiteSpace: "nowrap",
          clipPath: `inset(-30% ${((1 - voce) * 100).toFixed(1)}% -30% -10%)`,
          transform: `translate(${tremido(t)})`,
          opacity: 1 - sai,
        }}
      >
        {rotulo}
      </p>
    </Palco>
  );
};

// `grafico` · variação "inconscientes": grade de 30 pessoas (6×5) que entra em onda; uma (a indicada) acende em
// laranja; "?" sobem em grupos nas que não sabem; na batida do dinheiro a multidão vira laranja em onda e entra uma
// frase à mão acima dela; um rótulo mono embaixo nomeia o grupo; no fim um ponto "você" e uma seta à mão até a
// multidão com a ação (ex.: "ir até eles").
// Raciocínio: o que importa está na multidão que ainda não sabe que precisa, e alguém tem de ir até ela.
// Quando usar: construção longa (15–20 s) sobre um público grande × o caso isolado, com uma virada ("está tudo aqui")
// e uma ação no fim. Câmera aberta e parada (cena, não destaque).
// Quando não usar: número exato de pessoas importa (é ilustração), ou fala curta (a construção pede tempo).
// Origem: aula 01 (c-inconscientes, 2026-11-13), continuação do sorteio (d39), no lugar de uma frase parada na tela.
export type GraficoInconscientesProps = {
  camera: Camera;
  dur: number;
  textos: {
    aqui: string; // à mão, acima da grade, na virada (ex.: "está tudo aqui")
    grupo: string; // rótulo mono embaixo da grade (ex.: "quem ainda não sabe")
    voce: string; // rótulo do ponto de origem da seta (ex.: "você")
    acao: string; // ponta da seta (ex.: "ir até eles")
  };
  batidas: {
    multidao: number; // a grade entra em onda
    indicada: number; // a pessoa indicada acende
    duvidas: [number, number, number]; // três ondas de "?"
    dinheiro: number; // a multidão vira laranja, os "?" somem
    aqui: number; // a frase à mão é escrita
    rotulo: number; // rótulo do grupo
    pulsa: number; // a multidão pulsa
    voce: number; // ponto "você" (a frase à mão sai logo antes)
    buscar: number; // a seta é desenhada
    ativa: number; // a ação aparece na ponta
  };
};

const IN_COLS = 6;
const IN_LINHAS = 5;
const IN_PX = 82;
const IN_PY = 74;
const IN_X0 = 140;
const IN_Y0 = 450;
const IN_INDICADA = 14;
// quem ganha "?" em cada batida de dúvida (determinístico)
const IN_DUVIDA = [
  [2, 9, 23, 27],
  [5, 12, 19, 25, 0],
  [7, 16, 21, 29, 3, 11],
];

const InPessoa: React.FC<{ cor: string }> = ({ cor }) => (
  <svg viewBox="0 0 64 64" style={{ width: 54, height: 54, overflow: "visible" }}>
    <circle cx={32} cy={22} r={10} fill="none" stroke={cor} strokeWidth={3.4} />
    <path d="M14 54 C16 42 23 37 32 37 C41 37 48 42 50 54" fill="none" stroke={cor} strokeWidth={3.4} strokeLinecap="round" />
  </svg>
);

export const GraficoInconscientes: React.FC<GraficoInconscientesProps> = ({ dur, textos, batidas: T }) => {
  const t = useT();
  const sai = eio(seg(t, dur - 0.35, dur));
  const fundo = eo(seg(t, T.multidao - 0.2, T.multidao + 0.3));
  const ind = eo(seg(t, T.indicada - 0.05, T.indicada + 0.3));
  const somemDuvidas = eio(seg(t, T.dinheiro - 0.1, T.dinheiro + 0.3));
  const aqui = eio(seg(t, T.aqui, T.aqui + 0.55));
  const saiAqui = eio(seg(t, T.voce - 0.5, T.voce - 0.1));
  const rot = eo(seg(t, T.rotulo - 0.05, T.rotulo + 0.3));
  const pul = pulso(seg(t, T.pulsa, T.pulsa + 0.6));
  const voce = eo(seg(t, T.voce - 0.05, T.voce + 0.3));
  const seta = eio(seg(t, T.buscar, T.buscar + 0.5));
  const ativa = eo(seg(t, T.ativa, T.ativa + 0.3));
  return (
    <Palco saida={{ opacity: 1 - sai }}>
      <div style={{ position: "absolute", inset: 0, opacity: fundo, background: "radial-gradient(ellipse 660px 560px at 350px 560px, rgba(12,14,18,.5), transparent 72%)" }} />
      {Array.from({ length: IN_COLS * IN_LINHAS }, (_, i) => {
        const c = i % IN_COLS;
        const l = Math.floor(i / IN_COLS);
        const x = IN_X0 + c * IN_PX;
        const y = IN_Y0 + l * IN_PY;
        // entram em onda a partir do centro
        const atraso = Math.hypot(c - 2.5, l - 2) * 0.07;
        const e = eo(seg(t, T.multidao + atraso, T.multidao + atraso + 0.3));
        const eInd = i === IN_INDICADA;
        // a multidão vira laranja em onda no "dinheiro"; a indicada volta ao branco (ela já comprou)
        const vira = eInd ? 0 : eio(seg(t, T.dinheiro + atraso * 0.8, T.dinheiro + atraso * 0.8 + 0.3));
        const cor = eInd ? (ind > 0 && t < T.dinheiro ? cores.sinopia : cores.puro) : vira > 0.5 ? cores.sinopia : cores.puro;
        const ultimo = IN_DUVIDA.findIndex((g) => g.includes(i));
        const q = ultimo >= 0 ? eo(seg(t, T.duvidas[ultimo], T.duvidas[ultimo] + 0.25)) * (1 - somemDuvidas) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              translate: `-50% calc(-50% + ${lerp(14, 0, e).toFixed(1)}px)`,
              opacity: e * (eInd ? 1 : lerp(0.72, 1, vira)) * (eInd && t >= T.dinheiro ? 0.45 : 1),
              scale: String((eInd ? lerp(1, 1.15, ind) : 1) * (1 + 0.08 * pul * vira)),
            }}
          >
            <InPessoa cor={cor} />
            {q > 0 ? (
              <span style={{ position: "absolute", left: "50%", top: -26, translate: `-50% ${lerp(8, 0, q).toFixed(1)}px`, opacity: q, fontSize: 30, fontWeight: 600, color: cores.puro, textShadow: SOMBRA_TERCO }}>?</span>
            ) : null}
          </div>
        );
      })}
      {/* frase à mão, acima da grade */}
      <p
        style={{
          position: "absolute",
          left: 110,
          top: 330,
          fontFamily: fonteMao,
          fontSize: 64,
          color: cores.sinopia,
          rotate: "-3deg",
          whiteSpace: "nowrap",
          opacity: 1 - saiAqui,
          clipPath: `inset(-30% ${((1 - aqui) * 100).toFixed(1)}% -30% -10%)`,
          transform: `translate(${tremido(t)})`,
        }}
      >
        {textos.aqui}
      </p>
      {/* rótulo embaixo da grade */}
      <p style={{ position: "absolute", left: IN_X0 - 27, top: IN_Y0 + IN_LINHAS * IN_PY - 14, fontFamily: fonteMono, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: cores.puro, opacity: 0.85 * rot, textShadow: SOMBRA_TERCO, whiteSpace: "nowrap" }}>
        {textos.grupo}
      </p>
      {/* você → seta até a multidão: ação */}
      <div style={{ position: "absolute", left: 120, top: 352, opacity: voce, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: cores.sinopia, scale: String(lerp(0.4, 1, voce)) }} />
        <span style={{ fontFamily: fonteMono, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: cores.puro, textShadow: SOMBRA_TERCO }}>{textos.voce}</span>
      </div>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: 1920, height: 1080, overflow: "visible" }}>
        <Traco d="M135 390 C 180 400, 260 400, 330 430 M312 414 L330 430 L308 440" p={seta} largura={4.4} cor={cores.sinopia} />
      </svg>
      <p style={{ position: "absolute", left: 350, top: 360, fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em", color: cores.sinopia, textShadow: SOMBRA_TERCO, opacity: ativa, translate: `${lerp(-14, 0, ativa).toFixed(1)}px 0px`, whiteSpace: "nowrap" }}>
        {textos.acao}
      </p>
    </Palco>
  );
};

// ======================================================================================================
// `grafico` · variação "calendário que comprime o tempo" (tela cheia de motion em papel): um calendário de verdade
// (ref. interface_sketchmind-calendario-01) que comprime o tempo. Visão de ano: as páginas viram devagar e com peso.
// Mergulho num mês: os meses viram rápido. Mergulho numa semana: as semanas aceleram até o borrão e param seco; o resto
// cai para 40% e o dia de hoje é circulado à mão (único laranja da tela). O seletor Ano/Mês/Semana/Dia do próprio
// calendário é o rótulo que acompanha a compressão. Entra da direita e sai para a esquerda em chicote (o 09 faz o whip
// da câmera na volta). Os eventos são pontos de contato em tons pastel, sorteados de forma determinística por data.
// Raciocínio: "o que levava anos agora leva semanas" — o tempo encolhendo na tela.
// Quando usar: fala de compressão/aceleração de prazo (anos → meses → semanas → dias), 5–7 s, com as palavras de cada escala.
// Quando não usar: um prazo só (use rótulo), tempo que aumenta, ou agenda cheia/limite de horas (use GraficoTeto).
// Origem: aula 01 (c06d-calendario, 2026-11-12); promovida de src/novas/calendarioConfianca em 2026-11-13.
// Encadeamento: o 1º mês de `meses` precisa ser a célula onde a visão de ano mergulha (fica na página do último ano),
// a 1ª semana de `semanas` a 1ª linha do último mês, e `hoje` um dia da última semana.
export type GraficoCalendarioProps = {
  camera: Camera;
  dur: number;
  hoje: [number, number, number]; // [ano, mês 0–11, dia]: coluna destacada e circulada na última semana
  anos: number[]; // páginas da visão de ano (viram em batidas.anos; uma janela a menos que páginas)
  meses: [number, number][]; // páginas da visão de mês [ano, mês 0–11] (viram em batidas.meses)
  semanas: { inicio: [number, number, number]; n: number }; // segunda-feira da 1ª página e número de páginas
  pontos: { nome: string; textos: string[] }[]; // tipos de evento (até 6 tons pastel; o nome vai na pílula, um texto no card)
  batidas: {
    entra: [number, number]; // o papel entra da direita
    anos: [number, number][]; // viradas lentas de ano
    z1: [number, number]; // ano → mês
    seletorMes: [number, number]; // seletor anda de Ano para Mês
    meses: [number, number][]; // viradas rápidas de mês
    z2: [number, number]; // mês → semana
    semanas: [number, number]; // semanas aceleram e param seco
    foco: [number, number]; // o resto cai para 40%
    circulo: [number, number]; // círculo à mão no dia de hoje
    sai: [number, number]; // chicote para a esquerda
  };
};

// Geometria: cartão do calendário no palco e área das páginas dentro dele.
const CAL_CARD = { x: 120, y: 92, w: 1680, h: 896 };
const CAL_AREA = { x: 40, y: 150, w: 1600, h: 706 };
const CAL_PASSO = CAL_AREA.h + 48; // distância entre páginas na rolagem vertical
const CAL_COLW = (CAL_AREA.w - 6 * 10) / 7; // coluna da semana (gap 10)

const CAL_MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const CAL_MES3 = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const CAL_DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CAL_INI = ["S", "T", "Q", "Q", "S", "S", "D"];
const calData = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const calSoma = (dt: Date, n: number) => new Date(dt.getTime() + n * 86400000);
const calDiaSemana = (dt: Date) => (dt.getUTCDay() + 6) % 7; // 0 = segunda
const calMesmoDia = (a: Date, b: Date) => a.getTime() === b.getTime();
const calCap = (s: string) => s[0].toUpperCase() + s.slice(1);
const calHash = (dt: Date, sal = 0) => {
  let x = Math.imul(Math.floor(dt.getTime() / 86400000) + 7919 + sal * 104729, 0x9e3779b1);
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) % 997;
};

// Tons pastel dos pontos de contato (na ordem de `pontos`); laranja nunca.
const CAL_TONS: { fundo: string; faixa: string; texto: string }[] = [
  { fundo: "#E6EFFB", faixa: "#6B9BE0", texto: "#2F5C9E" },
  { fundo: "#EDEAFB", faixa: "#9486E0", texto: "#5A4BA8" },
  { fundo: "#E3F3EA", faixa: "#5DB386", texto: "#2E7652" },
  { fundo: "#FBE9F0", faixa: "#D97CA1", texto: "#9C3F66" },
  { fundo: "#E1F2F4", faixa: "#4FAAB3", texto: "#2A6F76" },
  { fundo: "#F3EEE2", faixa: "#B9A06A", texto: "#7A6331" },
];
type CalPonto = { nome: string; textos: string[] };
const calTom = (i: number) => CAL_TONS[i % CAL_TONS.length];
const calTipo = (pontos: CalPonto[], dt: Date, k = 0) => calHash(dt, 11 + k) % pontos.length;

const CalVisaoAno: React.FC<{ ano: number; pontos: CalPonto[] }> = ({ ano, pontos }) => {
  const cw = CAL_AREA.w / 6;
  const ch = CAL_AREA.h / 2;
  return (
    <>
      {CAL_MESES.map((nome, m) => {
        const primeiro = calData(ano, m, 1);
        const ofs = calDiaSemana(primeiro);
        const nDias = new Date(Date.UTC(ano, m + 1, 0)).getUTCDate();
        return (
          <div key={m} style={{ position: "absolute", left: (m % 6) * cw + 14, top: Math.floor(m / 6) * ch + 6, width: cw - 28 }}>
            <div style={{ fontSize: 26, fontWeight: 600, color: "var(--ground)" }}>{calCap(nome)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginTop: 14, rowGap: 6 }}>
              {CAL_INI.map((l, i) => (
                <span key={`i${i}`} style={{ fontSize: 15, color: "#9AA0AA", textAlign: "center", fontFamily: "var(--mono)" }}>{l}</span>
              ))}
              {Array.from({ length: ofs }, (_, i) => <span key={`v${i}`} />)}
              {Array.from({ length: nDias }, (_, i) => {
                const dt = calData(ano, m, i + 1);
                const marca = calHash(dt) % 9 === 0;
                return (
                  <span key={i} className="nd-num" style={{ position: "relative", height: 34, display: "grid", placeItems: "center", fontSize: 17, color: marca ? calTom(calTipo(pontos, dt)).texto : "#4A505B", fontWeight: marca ? 600 : 400 }}>
                    {marca && <i style={{ position: "absolute", width: 32, height: 32, borderRadius: 99, background: calTom(calTipo(pontos, dt)).fundo }} />}
                    <b style={{ position: "relative", fontWeight: "inherit" }}>{i + 1}</b>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

const CAL_MES_CAB = 40;
const CAL_MES_LH = (CAL_AREA.h - CAL_MES_CAB) / 6;
const calInicioGradeMes = (ano: number, mes: number) => calSoma(calData(ano, mes, 1), -calDiaSemana(calData(ano, mes, 1)));
const CalVisaoMes: React.FC<{ ano: number; mes: number; pontos: CalPonto[] }> = ({ ano, mes, pontos }) => {
  const cw = CAL_AREA.w / 7;
  const inicio = calInicioGradeMes(ano, mes);
  return (
    <>
      {CAL_DIAS.map((d, i) => (
        <span key={d} style={{ position: "absolute", left: i * cw + 16, top: 4, fontSize: 18, fontWeight: 500, color: "#8A909A" }}>{d}</span>
      ))}
      {Array.from({ length: 42 }, (_, i) => {
        const dt = calSoma(inicio, i);
        const fora = dt.getUTCMonth() !== mes;
        const h = calHash(dt);
        const evs: number[] = fora ? [] : ([h % 3 === 0 ? calTipo(pontos, dt) : null, h % 7 === 1 ? calTipo(pontos, dt, 1) : null].filter((x) => x !== null) as number[]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (i % 7) * cw + 4,
              top: CAL_MES_CAB + Math.floor(i / 7) * CAL_MES_LH + 4,
              width: cw - 8,
              height: CAL_MES_LH - 8,
              borderRadius: 14,
              background: "#F6F6F3",
              opacity: fora ? 0.45 : 1,
              padding: "8px 10px",
              boxSizing: "border-box",
            }}
          >
            <div className="nd-num" style={{ fontSize: 20, fontWeight: 600, color: "var(--ground)" }}>{dt.getUTCDate()}</div>
            {evs.map((tp, k) => (
              <div key={k} style={{ marginTop: 4, height: 22, borderRadius: 6, background: calTom(tp).fundo, borderLeft: `4px solid ${calTom(tp).faixa}`, fontSize: 13, fontWeight: 600, color: calTom(tp).texto, padding: "2px 8px", boxSizing: "border-box", whiteSpace: "nowrap", overflow: "hidden" }}>
                {pontos[tp].nome}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};

const CAL_SEM_CAB = 84;
const CAL_SEM_H0 = 8;
const CAL_SEM_H1 = 21;
const CAL_SEM_PXH = (CAL_AREA.h - CAL_SEM_CAB) / (CAL_SEM_H1 - CAL_SEM_H0);
const CalVisaoSemana: React.FC<{ seg0: Date; foco: number; hoje: Date; pontos: CalPonto[] }> = ({ seg0, foco, hoje: HOJE, pontos }) => (
  <>
    {CAL_DIAS.map((nome, i) => {
      const dt = calSoma(seg0, i);
      const hoje = calMesmoDia(dt, HOJE);
      const h = calHash(dt);
      const fds = i >= 5;
      const n = fds ? h % 2 : 1 + (h % 3);
      const horas = [8 + (h % 2), 12 + (h % 2), 16 + (h % 2)].slice(0, n);
      if (n === 1) horas[0] = 10 + (h % 6);
      const op = hoje ? 1 : lerp(1, 0.4, foco);
      const x = i * (CAL_COLW + 10);
      return (
        <div key={i} style={{ position: "absolute", left: x, top: 0, width: CAL_COLW, height: CAL_AREA.h, opacity: op }}>
          <div
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              top: 2,
              height: 68,
              borderRadius: 16,
              background: hoje ? "var(--ground)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 500, color: hoje ? "#C9CDD4" : "#8A909A" }}>{nome}</span>
            <span className="nd-num" style={{ fontSize: 34, fontWeight: 600, color: hoje ? "#FFFFFF" : "var(--ground)" }}>{dt.getUTCDate()}</span>
            <span style={{ fontSize: 18, color: hoje ? "#C9CDD4" : "#9AA0AA" }}>{CAL_MES3[dt.getUTCMonth()]}</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: CAL_SEM_CAB, bottom: 0, borderRadius: 16, background: "#F6F6F3" }}>
            {horas.map((hr, k) => {
              const tp = calTipo(pontos, dt, k);
              const textos = pontos[tp].textos;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 8,
                    right: 8,
                    top: (hr - CAL_SEM_H0) * CAL_SEM_PXH + 8,
                    height: 112,
                    borderRadius: 12,
                    background: "#FFFFFF",
                    boxShadow: "0 2px 6px rgba(25,28,35,.06)",
                    padding: "10px 12px",
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="nd-num" style={{ fontSize: 18, fontWeight: 600, color: "var(--ground)" }}>{`${String(hr).padStart(2, "0")}:00`}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: calTom(tp).texto, background: calTom(tp).fundo, borderRadius: 99, padding: "3px 10px" }}>{pontos[tp].nome}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.3, color: "#4A505B" }}>{textos[calHash(dt, 31 + k) % textos.length]}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </>
);

// Viradas com peso: antecipação de ~6 px para trás antes de cada virada, ease-in-out.
const calVirar = (t: number, janelas: [number, number][], antecipa: number) =>
  janelas.reduce((acc, [a, b]) => acc + eio(seg(t, a, b)) - antecipa * Math.sin(Math.PI * seg(t, a - 0.12, a)), 0);
// Desfoque de movimento coerente: ~meio quadro de obturador (desvio ≈ deslocamento por quadro × 0,25).
// Nos anos o fator é menor: a virada é lenta e pesada, não pode parecer borrão.
const calDesfoque = (f: (t: number) => number, t: number, escala: number, fator = 0.25) => {
  const pxQuadro = Math.abs(f(t + 1 / 60) - f(t - 1 / 60)) * 0.5 * escala;
  return Math.min(60, pxQuadro * fator);
};

// Rolagem vertical de páginas (só as visíveis).
const CalPaginas: React.FC<{ P: number; total: number; filtro: string; children: (k: number) => React.ReactNode }> = ({ P, total, filtro, children }) => {
  const ks = [Math.floor(P) - 1, Math.floor(P), Math.floor(P) + 1].filter((k) => k >= 0 && k < total && Math.abs(k - P) < 1.1);
  return (
    <div style={{ position: "absolute", inset: 0, filter: filtro }}>
      {ks.map((k) => (
        <div key={k} style={{ position: "absolute", left: 0, top: 0, width: CAL_AREA.w, height: CAL_AREA.h, translate: `0px ${((k - P) * CAL_PASSO).toFixed(1)}px` }}>
          {children(k)}
        </div>
      ))}
    </div>
  );
};

// Título que rola junto com as páginas (odômetro).
const CalTitulo: React.FC<{ P: number; itens: string[]; opacidade: number; filtro: string }> = ({ P, itens, opacidade, filtro }) => (
  <div style={{ position: "absolute", left: 48, top: 36, width: 900, height: 80, overflow: "hidden", opacity: opacidade }}>
    <div style={{ translate: `0px ${(-P * 80).toFixed(1)}px`, filter: filtro }}>
      {itens.map((s) => (
        <div key={s} style={{ height: 80, lineHeight: "80px", fontSize: 62, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--ground)", whiteSpace: "nowrap" }}>{s}</div>
      ))}
    </div>
  </div>
);

const CalSeletor: React.FC<{ idx: number }> = ({ idx }) => {
  const L = ["Ano", "Mês", "Semana", "Dia"];
  const w = 128;
  return (
    <div style={{ position: "absolute", right: 48, top: 44, display: "flex", gap: 20, alignItems: "center" }}>
      <div style={{ height: 60, padding: "0 26px", borderRadius: 99, border: "2px solid #E2E4E8", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 500, color: "var(--ground)", boxSizing: "border-box" }}>Hoje</div>
      <div style={{ position: "relative", height: 64, width: w * 4 + 12, borderRadius: 99, background: "#EFEFEC" }}>
        <div style={{ position: "absolute", top: 6, left: 6, width: w, height: 52, borderRadius: 99, background: "var(--ground)", translate: `${(idx * w).toFixed(1)}px 0px`, boxShadow: "0 4px 10px rgba(25,28,35,.18)" }} />
        {L.map((l, i) => (
          <span key={l} style={{ position: "absolute", top: 6, left: 6 + i * w, width: w, height: 52, display: "grid", placeItems: "center", fontSize: 22, fontWeight: 500, color: Math.abs(idx - i) < 0.5 ? "#FFFFFF" : "#6B7280" }}>{l}</span>
        ))}
      </div>
    </div>
  );
};

// Transição "mergulho": a célula alvo abre como janela da visão nova; a antiga avança e some.
type CalRet = { x: number; y: number; w: number; h: number };
const calSai = (z: number, r: CalRet): React.CSSProperties => ({
  transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px`,
  scale: String(lerp(1, 1.18, z)),
  opacity: 1 - seg(z, 0.25, 0.8),
});
const calEntra = (z: number, r: CalRet): React.CSSProperties => {
  const top = lerp(r.y, 0, z);
  const left = lerp(r.x, 0, z);
  const right = lerp(CAL_AREA.w - r.x - r.w, 0, z);
  const bottom = lerp(CAL_AREA.h - r.y - r.h, 0, z);
  return {
    clipPath: `inset(${top.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${left.toFixed(1)}px round ${lerp(14, 0, z).toFixed(1)}px)`,
    opacity: seg(z, 0, 0.3),
    background: "#FFFFFF",
  };
};

// Círculo manuscrito em volta do dia de hoje (pouco mais de uma volta, sem fechar certinho).
const calCirculo = (CX: number, CY: number) => {
  const pts: string[] = [];
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = -2.2 + u * Math.PI * 2 * 1.1;
    const rx = 136 * (1 + 0.035 * Math.sin(3 * a + 0.6)) + u * 10;
    const ry = 66 * (1 + 0.05 * Math.sin(2 * a + 1.3)) + u * 6;
    pts.push(`${(CX + rx * Math.cos(a)).toFixed(1)} ${(CY + ry * Math.sin(a) - u * 6).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
};

export const GraficoCalendario: React.FC<GraficoCalendarioProps> = ({ camera, dur, hoje, anos: ANOS, meses: MESES_PAG, semanas, pontos, batidas: B }) => {
  const t = useT();
  const HOJE = calData(...hoje);
  const SEMANAS_PAG = Array.from({ length: semanas.n }, (_, i) => calSoma(calData(...semanas.inicio), i * 7));
  const ultSem = SEMANAS_PAG.length - 1;

  // Alvos dos mergulhos: o 1º mês na visão de ano; a linha da 1ª semana na grade do último mês.
  const mAlvo = MESES_PAG[0][1];
  const ALVO_MES: CalRet = { x: (mAlvo % 6) * (CAL_AREA.w / 6), y: Math.floor(mAlvo / 6) * (CAL_AREA.h / 2), w: CAL_AREA.w / 6, h: CAL_AREA.h / 2 };
  const [aUlt, mUlt] = MESES_PAG[MESES_PAG.length - 1];
  const linhaSem = Math.round((SEMANAS_PAG[0].getTime() - calInicioGradeMes(aUlt, mUlt).getTime()) / (7 * 86400000));
  const ALVO_SEM: CalRet = { x: 0, y: CAL_MES_CAB + linhaSem * CAL_MES_LH, w: CAL_AREA.w, h: CAL_MES_LH };
  const CX = CAL_CARD.x + CAL_AREA.x + calDiaSemana(HOJE) * (CAL_COLW + 10) + CAL_COLW / 2;
  const CY = CAL_CARD.y + CAL_AREA.y + 36;
  const CIRCULO = calCirculo(CX, CY);

  const pAno = (u: number) => calVirar(u, B.anos, 0.009);
  const pMes = (u: number) => calVirar(u, B.meses, 0);
  // Semanas: aceleração contínua até a velocidade máxima e parada seca; passa ~8 px e assenta.
  const pSem = (u: number) => {
    const s = seg(u, B.semanas[0], B.semanas[1]);
    return ultSem * Math.pow(s, 2.2) + 0.011 * Math.sin(Math.PI * seg(u, B.semanas[1], B.semanas[1] + 0.2));
  };

  // Entrada da direita e saída para a esquerda, em chicote (deslocamento horizontal do papel inteiro).
  const xCamada = (u: number) => lerp(1920, 0, eo(seg(u, B.entra[0], B.entra[1]))) - 2050 * Math.pow(seg(u, B.sai[0], B.sai[1]), 3);
  const xC = xCamada(t);
  const blurX = calDesfoque(xCamada, t, 1);
  const visivel = xC < 1920 && xC > -2040;

  const z1 = eio(seg(t, B.z1[0], B.z1[1]));
  const z2 = eio(seg(t, B.z2[0], B.z2[1]));
  const foco = eio(seg(t, B.foco[0], B.foco[1]));
  const Pa = pAno(t);
  const Pm = pMes(t);
  const Ps = pSem(t);
  const bA = calDesfoque(pAno, t, CAL_PASSO, 0.1);
  const bM = calDesfoque(pMes, t, CAL_PASSO);
  const bS = calDesfoque(pSem, t, CAL_PASSO);
  const filtroY = (b: number) => (b > 0.4 ? "url(#c06d-borraY)" : "none");
  const bY = t < B.z1[1] ? bA : t < B.z2[1] ? bM : bS;

  const idx = eio(seg(t, B.seletorMes[0], B.seletorMes[1])) + eio(seg(t, B.semanas[0] - 0.2, B.semanas[0])) + eio(seg(t, B.foco[0], B.foco[1]));
  const cP = eo(seg(t, B.circulo[0], B.circulo[1]));
  const ySem = -(Ps - ultSem) * CAL_PASSO;

  return (
    <Palco>
      <CameraCheia camera={camera} dur={dur} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="c06d-borraY" x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${bY.toFixed(2)}`} />
          </filter>
          <filter id="c06d-borraX" x="-30%" y="-5%" width="160%" height="110%">
            <feGaussianBlur stdDeviation={`${blurX.toFixed(2)} 0`} />
          </filter>
        </defs>
      </svg>
      {visivel && (
        <div style={{ position: "absolute", inset: 0, translate: `${xC.toFixed(1)}px 0px`, filter: blurX > 0.4 ? "url(#c06d-borraX)" : "none" }}>
          <div className="nd-papel" />
          <div className="nd-papel-pontos" style={{ opacity: 0.7 }} />
          <div className="nd-card" style={{ left: CAL_CARD.x, top: CAL_CARD.y, width: CAL_CARD.w, height: CAL_CARD.h, overflow: "hidden" }}>
            <CalTitulo P={Pa} itens={ANOS.map(String)} opacidade={1 - seg(z1, 0.2, 0.5)} filtro={filtroY(bA)} />
            <CalTitulo P={Pm} itens={MESES_PAG.map(([a, m]) => `${calCap(CAL_MESES[m])} ${a}`)} opacidade={seg(z1, 0.4, 0.8) * (1 - seg(z2, 0.2, 0.5))} filtro={filtroY(bM)} />
            <CalTitulo
              P={Ps}
              itens={SEMANAS_PAG.map((d) => {
                const f = calSoma(d, 6);
                return d.getUTCMonth() === f.getUTCMonth()
                  ? `${d.getUTCDate()} – ${f.getUTCDate()} ${CAL_MES3[f.getUTCMonth()]}`
                  : `${d.getUTCDate()} ${CAL_MES3[d.getUTCMonth()]} – ${f.getUTCDate()} ${CAL_MES3[f.getUTCMonth()]}`;
              })}
              opacidade={seg(z2, 0.4, 0.8)}
              filtro={filtroY(bS)}
            />
            <CalSeletor idx={idx} />
            <div style={{ position: "absolute", left: CAL_AREA.x, top: CAL_AREA.y - 22, width: CAL_AREA.w, height: 2, background: "#EEEFF1" }} />
            <div style={{ position: "absolute", left: CAL_AREA.x, top: CAL_AREA.y, width: CAL_AREA.w, height: CAL_AREA.h, overflow: "hidden" }}>
              {t < B.z1[1] && (
                <div style={{ position: "absolute", inset: 0, ...calSai(z1, ALVO_MES) }}>
                  <CalPaginas P={Pa} total={ANOS.length} filtro={filtroY(bA)}>{(k) => <CalVisaoAno ano={ANOS[k]} pontos={pontos} />}</CalPaginas>
                </div>
              )}
              {t >= B.z1[0] && t < B.z2[1] && (
                <div style={{ position: "absolute", inset: 0, ...(t < B.z2[0] ? calEntra(z1, ALVO_MES) : calSai(z2, ALVO_SEM)) }}>
                  <CalPaginas P={Pm} total={MESES_PAG.length} filtro={filtroY(bM)}>{(k) => <CalVisaoMes ano={MESES_PAG[k][0]} mes={MESES_PAG[k][1]} pontos={pontos} />}</CalPaginas>
                </div>
              )}
              {t >= B.z2[0] && (
                <div style={{ position: "absolute", inset: 0, ...calEntra(z2, ALVO_SEM) }}>
                  <CalPaginas P={Ps} total={SEMANAS_PAG.length} filtro={filtroY(bS)}>
                    {(k) => <CalVisaoSemana seg0={SEMANAS_PAG[k]} foco={k === ultSem ? foco : 0} hoje={HOJE} pontos={pontos} />}
                  </CalPaginas>
                </div>
              )}
            </div>
          </div>
          {cP > 0 && (
            <svg className="nd-arte" viewBox="0 0 1920 1080" style={{ transform: `translate(${tremido(t)})` }}>
              <Traco d={CIRCULO} p={cP} largura={8} cor="var(--main)" transform={`translate(0 ${ySem.toFixed(1)})`} />
            </svg>
          )}
        </div>
      )}
    </Palco>
  );
};

// ======================================================================================================
// Câmera que encolhe para um card à direita (geometria padrão das telas divididas: área de motion x 96–1376, card
// x 1452–1856). p = 0 cheia, 1 card. Só transform e clip-path. `rostoX`: centro do rosto no quadro (px do editado).
// Usada por GraficoCommodity e GraficoSemCom.
// ======================================================================================================
const GC_CAM = { x: 1452, y: 246, w: 404, h: 766, r: 30 };
const GraficoCameraCard: React.FC<{ camera: Camera; p: number; rostoX: number }> = ({ camera, p, rostoX }) => {
  const { fps } = useVideoConfig();
  const s1 = Math.max(GC_CAM.h / 1080, 0.72);
  const lw = GC_CAM.w / s1;
  const lh = GC_CAM.h / s1;
  const l = rostoX - lw / 2;
  const tp = (1080 - lh) / 2;
  const s = lerp(1, s1, p);
  const ins = { t: tp * p, r: (1920 - l - lw) * p, b: (1080 - tp - lh) * p, l: l * p };
  const tx = lerp(0, GC_CAM.x - l * s1, p);
  const ty = lerp(0, GC_CAM.y - tp * s1, p);
  return (
    <div style={{ position: "absolute", inset: 0, filter: p > 0.02 ? `drop-shadow(0 18px 36px rgba(25,28,35,${(0.25 * p).toFixed(3)}))` : undefined }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`,
          clipPath: `inset(${ins.t.toFixed(1)}px ${ins.r.toFixed(1)}px ${ins.b.toFixed(1)}px ${ins.l.toFixed(1)}px round ${((GC_CAM.r / s1) * p).toFixed(1)}px)`,
        }}
      >
        <Video src={staticFile(camera.src)} trimBefore={Math.round(useInicioCamera(camera) * fps)} muted objectFit="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <div className="nd-camfade" style={{ opacity: 1 - p }} />
      </div>
    </div>
  );
};

// ======================================================================================================
// `grafico` · variação "commodity" (layout reduzido, tela de sistema clara com grade de pontos): grade 4×3 de cards
// idênticos (avatar, nome, profissão, serviço) em que só o preço muda. Na 1ª fase as identidades somem e só o preço
// fica aceso; depois os preços voam para uma tabela ordenada; dois preços acendem na fala e ganham uma chave à mão;
// no fim tudo volta a ser igual. Título do tópico palavra a palavra + anotação à mão (ex.: "= todos iguais" → "= só o
// preço"). Câmera cheia → card à direita (na palavra-título) → cheia no fim.
// Raciocínio: quando todos oferecem a mesma coisa, ficam iguais — a única diferença é o preço.
// Quando usar: fala sobre mercado indiferenciado / guerra de preço entre profissionais iguais, com 2 preços citados.
// Quando não usar: comparação de ofertas diferentes (use GraficoSemCom), um preço só, ou produtos com marca/rosto.
// Origem: aula 01 (c11-commodity, 2026-11-12; ref. Matt Gray 99UKPcsiKF4 e lRe3iKyAXQA); promovida em 2026-11-13.
export type GraficoCommodityProps = {
  camera: Camera;
  dur: number;
  rostoX: number; // centro do rosto no quadro do editado (px), enquadra o card da câmera
  rotulo: string; // pílula escura do tópico (ex.: "Ideia 01")
  titulo: [string, number][]; // palavras do título e batida de cada uma
  anotacoes: [string, string]; // à mão no cabeçalho: na fase commodity e na volta ao igual
  profissao: string; // nos cards e na tabela (ex.: "Fotógrafo")
  servico: string; // rodapé mono dos cards (ex.: "Sessão · 1 h")
  servicoTabela: string; // complemento na linha da tabela (ex.: "sessão 1 h")
  moeda: string; // prefixo do preço (ex.: "R$")
  nomes: string[]; // 12 nomes, ordem da grade (só o 1º nome aparece)
  precos: number[]; // 12 preços, ordem da grade (os dois destaques aparecem uma vez só)
  destaques: [{ preco: number; t: number }, { preco: number; t: number }]; // acendem na fala e ganham a chave à mão
  batidas: {
    rotulo: number; // pílula do tópico entra
    parar: number; // câmera vira card, quadro claro abre (1ª palavra do título)
    grade: number; // a grade surge
    commodity: number; // identidades somem
    tabelada: number; // preços voam para a tabela
    foco: number; // o resto cai para 40%
    igual: number; // tudo volta a ser igual
    volta: number; // câmera volta a encher a tela (até o fim da cena)
  };
};

// Geometria (área do motion: x 96–1376; card da câmera: x 1452–1856).
const COM_COLS = 4;
const COM_CW = 290;
const COM_CH = 225;
const COM_GX = 40;
const COM_GY = 37;
const COM_G0 = { x: 96, y: 262 };
const comCard = (i: number) => ({ x: COM_G0.x + (i % COM_COLS) * (COM_CW + COM_GX), y: COM_G0.y + Math.floor(i / COM_COLS) * (COM_CH + COM_GY) });
const COM_PW = 148; // pílula de preço
const COM_PH = 50;
const COM_TAB = { x: 96, y: 246, w: 1220, h: 766 };
const COM_RH = 58; // altura da linha da tabela
const comLinhaY = (l: number) => COM_TAB.y + 30 + l * COM_RH;

// Avatar desenhado (silhueta). `cabelo` varia a identidade; `iguala` 0→1 apaga a diferença.
const ComAvatar: React.FC<{ cabelo: number; iguala: number; tamanho?: number }> = ({ cabelo, iguala, tamanho = 76 }) => {
  const cab = [
    "M22 34 C22 18 54 18 54 34 C50 26 26 26 22 34 Z", // curto
    "M20 38 C18 16 58 16 56 38 C54 28 22 28 20 38 Z M31 9 C31 3 45 3 45 9 C45 14 31 14 31 9 Z", // coque
    "M19 50 C14 18 62 18 57 50 C56 34 50 26 38 26 C26 26 20 34 19 50 Z", // longo
  ][cabelo % 3];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 76 76" style={{ display: "block" }}>
      <circle cx={38} cy={38} r={38} fill="#E9EBEF" />
      <clipPath id={`av${cabelo}`}>
        <circle cx={38} cy={38} r={38} />
      </clipPath>
      <g clipPath={`url(#av${cabelo})`}>
        <path d="M10 80 C10 58 22 50 38 50 C54 50 66 58 66 80 Z" fill="#BCC1C9" />
        <circle cx={38} cy={34} r={13} fill="#BCC1C9" />
        <path d={cab} fill="#7E848F" opacity={1 - iguala} />
      </g>
    </svg>
  );
};

export const GraficoCommodity: React.FC<GraficoCommodityProps> = (p) => {
  const { camera, dur, batidas: B, precos: PRECOS } = p;
  const t = useT();
  const [dA, dB] = p.destaques;
  const ORDEM = PRECOS.map((_, i) => i).sort((a, b) => PRECOS[a] - PRECOS[b]); // ORDEM[linha] = card
  const LINHA = PRECOS.map((_, i) => ORDEM.indexOf(i)); // LINHA[card] = linha na tabela

  // Câmera: cheia → card (na fala "parar") → cheia no fim.
  const pIn = eio(seg(t, B.parar - 0.05, B.parar + 0.7));
  const pOut = eio(seg(t, B.volta, dur));
  const pCam = pIn * (1 - pOut);

  // Quadro claro: abre em círculo a partir do rótulo; some na volta da câmera.
  const raio = lerp(0, 2100, eo(seg(t, B.parar - 0.2, B.parar + 0.45)));
  const conteudo = 1 - eio(seg(t, B.volta, B.volta + 0.45)); // texto e tabela saem antes da câmera encher

  // Rótulo (pílula escura) com barra de progresso até a fala "parar".
  const rot = subir(t, B.rotulo, 0.45, 14);
  const barra = seg(t, B.rotulo + 0.3, B.parar);

  // Fases.
  const com = eo(seg(t, B.commodity, B.commodity + 0.5)); // identidades somem
  const tab = seg(t, B.tabelada, B.tabelada + 1.2); // voo para a tabela
  const sumirGrade = eio(seg(t, B.tabelada, B.tabelada + 0.45));
  const tabela = eo(seg(t, B.tabelada + 0.15, B.tabelada + 0.6));
  const foco = eo(seg(t, B.foco, B.foco + 0.4));
  const igual = eo(seg(t, B.igual, B.igual + 0.35));
  const acende = (em: number) => eo(seg(t, em, em + 0.3)) * (1 - igual);
  const aA = acende(dA.t);
  const aB = acende(dB.t);
  const linhaAcesa = (l: number) => (ORDEM[l] === PRECOS.indexOf(dA.preco) ? aA : ORDEM[l] === PRECOS.indexOf(dB.preco) ? aB : 0);
  const opLinha = (l: number) => lerp(1, 0.4, foco * (1 - igual)) + (1 - lerp(1, 0.4, foco * (1 - igual))) * linhaAcesa(l);

  // Anotação manuscrita no cabeçalho.
  const nota1 = seg(t, B.commodity, B.commodity + 0.5);
  const nota2 = seg(t, B.igual, B.igual + 0.45);

  const lA = LINHA[PRECOS.indexOf(dA.preco)];
  const lB = LINHA[PRECOS.indexOf(dB.preco)];
  const yA = comLinhaY(lA) + COM_RH / 2;
  const yB = comLinhaY(lB) + COM_RH / 2;
  const chaveX = COM_TAB.x + COM_TAB.w - 24;

  return (
    <Palco>
      {/* Quadro claro com grade de pontos (tela de sistema, §12) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: cores.branco,
          backgroundImage: "radial-gradient(#C9CDD4 1.3px, transparent 1.6px)",
          backgroundSize: "26px 26px",
          clipPath: `circle(${raio.toFixed(0)}px at 180px 118px)`,
        }}
      />

      <div style={{ position: "absolute", inset: 0, opacity: conteudo }}>
        {/* Título do tópico */}
        <h2
          style={{
            position: "absolute",
            left: 96,
            top: 150,
            margin: 0,
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1,
            color: cores.preto,
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          {p.titulo.map(([w, em], i) => {
            const s = subir(t, em, 0.35, 16);
            return (
              <span key={i} style={{ display: "inline-block", marginRight: 16, opacity: s.opacity, translate: `0px ${s.y.toFixed(1)}px` }}>
                {w}
              </span>
            );
          })}
        </h2>

        {/* Anotação manuscrita */}
        <div style={{ position: "absolute", left: 790, top: 128, fontFamily: fonteMao, fontWeight: 700, fontSize: 66, color: cores.sinopia, whiteSpace: "nowrap", translate: tremido(t) }}>
          <div style={{ position: "absolute", paddingRight: 40, clipPath: `inset(-20px ${((1 - nota1) * 100).toFixed(1)}% -20px -20px)`, opacity: 1 - nota2 }}>{p.anotacoes[0]}</div>
          <div style={{ position: "absolute", paddingRight: 40, clipPath: `inset(-20px ${((1 - nota2) * 100).toFixed(1)}% -20px -20px)` }}>{p.anotacoes[1]}</div>
        </div>

        {/* Grade de cards iguais */}
        {PRECOS.map((_, i) => {
          const { x, y } = comCard(i);
          const ordem = (i % COM_COLS) + Math.floor(i / COM_COLS);
          const e0 = B.grade + ordem * 0.08 + (i % 2) * 0.03;
          const pe = seg(t, e0, e0 + 0.5);
          const sumir = sumirGrade;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: COM_CW,
                height: COM_CH,
                borderRadius: 22,
                background: cores.puro,
                border: `1.5px solid ${cores.linha}`,
                boxShadow: "0 10px 26px rgba(25,28,35,.07)",
                opacity: eo(pe) * (1 - sumir),
                transform: `translateY(${lerp(28, 0, eo(pe)) - 18 * sumir}px) scale(${(lerp(0.94, 1, eob(pe)) * lerp(1, 0.96, sumir)).toFixed(4)})`,
              }}
            >
              <div style={{ position: "absolute", left: 24, top: 24, opacity: lerp(1, 0.45, com) }}>
                <ComAvatar cabelo={i} iguala={com} />
              </div>
              {/* nome → barra cinza */}
              <div style={{ position: "absolute", left: 116, top: 30, fontSize: 25, fontWeight: 600, color: cores.preto, whiteSpace: "nowrap", opacity: 1 - com }}>
                {p.nomes[i].split(" ")[0]}
              </div>
              <div style={{ position: "absolute", left: 116, top: 36, width: 120, height: 18, borderRadius: 9, background: "#E1E4E9", opacity: com }} />
              <div style={{ position: "absolute", left: 116, top: 66, fontSize: 21, fontWeight: 500, color: cores.mudo, opacity: lerp(1, 0.45, com) }}>{p.profissao}</div>
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  top: 120,
                  fontFamily: fonteMono,
                  fontSize: 16,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: cores.mudo,
                  opacity: lerp(1, 0.45, com),
                }}
              >
                {p.servico}
              </div>
            </div>
          );
        })}

        {/* Tabela de preços (ordenada) */}
        <div
          style={{
            position: "absolute",
            left: COM_TAB.x,
            top: COM_TAB.y,
            width: COM_TAB.w,
            height: COM_TAB.h,
            borderRadius: 26,
            background: cores.puro,
            border: `1.5px solid ${cores.linha}`,
            boxShadow: "0 14px 34px rgba(25,28,35,.08)",
            opacity: tabela,
            transform: `translateY(${lerp(20, 0, tabela)}px)`,
          }}
        />
        {ORDEM.map((_, l) => {
          const y = comLinhaY(l);
          const e = eo(seg(t, B.tabelada + 0.25 + l * 0.04, B.tabelada + 0.65 + l * 0.04));
          const ac = linhaAcesa(l);
          return (
            <div key={l} style={{ position: "absolute", left: COM_TAB.x, top: y, width: COM_TAB.w, height: COM_RH, opacity: e * opLinha(l) }}>
              <div
                style={{
                  position: "absolute",
                  inset: "4px 12px",
                  borderRadius: 14,
                  background: `color-mix(in srgb, ${cores.sinopia} 10%, transparent)`,
                  opacity: ac,
                }}
              />
              {l < ORDEM.length - 1 && <div style={{ position: "absolute", left: 28, right: 28, bottom: 0, height: 1.5, background: cores.linha }} />}
              <div style={{ position: "absolute", left: 30, top: 17, fontFamily: fonteMono, fontSize: 18, color: cores.mudo, letterSpacing: "0.12em" }}>
                {String(l + 1).padStart(2, "0")}
              </div>
              <div style={{ position: "absolute", left: 84, top: 9 }}>
                <ComAvatar cabelo={0} iguala={1} tamanho={40} />
              </div>
              <div style={{ position: "absolute", left: 140, top: 14, fontSize: 25, fontWeight: 500, color: cores.preto, whiteSpace: "nowrap" }}>
                {`${p.profissao} `}<span style={{ color: cores.mudo, fontWeight: 400 }}>{`· ${p.servicoTabela}`}</span>
              </div>
              <div style={{ position: "absolute", left: 520, right: 210, top: 36, borderBottom: `2px dotted ${cores.linha}` }} />
            </div>
          );
        })}

        {/* Chave à mão ligando os dois destaques */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", translate: tremido(t), opacity: 1 - igual }}>
          <Traco
            d={`M ${chaveX - 12} ${yA} C ${chaveX + 34} ${yA}, ${chaveX + 34} ${yA}, ${chaveX + 34} ${yA + 40} L ${chaveX + 34} ${yB - 40} C ${chaveX + 34} ${yB}, ${chaveX + 34} ${yB}, ${chaveX - 12} ${yB}`}
            p={eio(seg(t, dB.t + 0.15, dB.t + 0.65))}
            largura={6}
          />
        </svg>

        {/* Pílulas de preço: nascem no card, ficam acesas no "commodity" e voam para a tabela */}
        {PRECOS.map((v, i) => {
          const c = comCard(i);
          const ordem = (i % COM_COLS) + Math.floor(i / COM_COLS);
          const e0 = B.grade + ordem * 0.08 + (i % 2) * 0.03 + 0.08;
          const pe = seg(t, e0, e0 + 0.5);
          const l = LINHA[i];
          const atraso = l * 0.02;
          const q = eio(seg(tab * 1.2 - atraso, 0, 0.7)); // voo quase junto (reordenação), leve escalonamento pela linha
          const x0 = c.x + 24;
          const y0 = c.y + COM_CH - 24 - COM_PH;
          const x1 = COM_TAB.x + COM_TAB.w - 64 - COM_PW;
          const y1 = comLinhaY(l) + (COM_RH - COM_PH) / 2;
          const x = lerp(x0, x1, q);
          const y = lerp(y0, y1, q) - Math.sin(q * Math.PI) * 60;
          const bate = pulso(seg(t, B.commodity + ordem * 0.04, B.commodity + 0.45 + ordem * 0.04));
          const ac = v === dA.preco ? aA : v === dB.preco ? aB : 0;
          const chave = v === dA.preco ? pulso(seg(t, dA.t, dA.t + 0.35)) : v === dB.preco ? pulso(seg(t, dB.t, dB.t + 0.35)) : 0;
          const escala = lerp(0.9, 1, eob(pe)) * (1 + 0.07 * bate + 0.12 * chave) * lerp(1, 0.92, q);
          const op = eo(pe) * (q > 0 ? opLinha(l) : 1);
          return (
            <div
              key={i}
              className="nd-num"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: COM_PW,
                height: COM_PH,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 27,
                fontWeight: 600,
                color: cores.puro,
                background: ac > 0 ? `color-mix(in srgb, ${cores.sinopia} ${(ac * 100).toFixed(0)}%, ${cores.preto})` : cores.preto,
                boxShadow: `0 8px 20px rgba(25,28,35,${(0.12 + 0.18 * com * (1 - q)).toFixed(3)})`,
                transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${escala.toFixed(4)})`,
                opacity: op,
                whiteSpace: "nowrap",
              }}
            >
              {`${p.moeda} `}{v}
            </div>
          );
        })}
      </div>

      {/* Câmera por cima do conteúdo (cheia no início, card no meio, cheia de novo no fim) */}
      <GraficoCameraCard camera={camera} p={pCam} rostoX={p.rostoX} />

      {/* Rótulo do tópico: pílula escura sobre a câmera e, depois, cabeçalho do quadro */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 78,
          padding: "12px 20px 14px",
          borderRadius: 999,
          background: cores.preto,
          color: cores.branco,
          fontFamily: fonteMono,
          fontSize: 20,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: rot.opacity * conteudo,
          translate: `0px ${rot.y.toFixed(1)}px`,
          overflow: "hidden",
        }}
      >
        {p.rotulo}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            height: 4,
            width: "100%",
            background: cores.sinopia,
            transformOrigin: "0 50%",
            transform: `scaleX(${barra.toFixed(4)})`,
            opacity: 1 - clamp01(seg(t, B.parar + 0.3, B.parar + 0.7)),
          }}
        />
      </div>
    </Palco>
  );
};

// ======================================================================================================
// `grafico` · variação "sem × com" (oferta antiga × nova; câmera cheia → card à direita → cheia): oferta em faixas
// empilhadas à esquerda do rosto — objetivo · "Antes" (cinza) · "Depois" (branca, borda laranja, Space Grotesk
// nos rótulos). Janela 1 (câmera cheia): objetivo e a opção tradicional montada na fala, riscada à mão. Janela 2: a
// tradicional encolhe riscada; a nova abre com título e preço que conta até o novo valor (multiplicador em laranja).
// Janela 3 (quadro claro com grade de pontos e câmera em card, padrão da GraficoCommodity): um mockup por entregável
// falado, um de cada vez (check-in no celular, plano + receita no celular, card do grupo, área de aulas no notebook com
// vídeo e capas reais) e um ✓ com ícone na coluna por item. Janela 4 (câmera cheia): a garantia entra como selo laranja
// girando que trava a oferta (momento-chave).
// Raciocínio: a mesma necessidade atendida de dois jeitos (avulso × acompanhado); a diferença de preço se
// justifica pelos entregáveis concretos e pela garantia.
// Quando usar: comparação de duas ofertas para o mesmo objetivo (antes/depois do modelo), longa (≈ 70 s), com entregáveis
// que dá para mostrar como telas reais de um produto fictício.
// Quando não usar: mercado indiferenciado (use GraficoCommodity), comparação curta (sem tempo para os mockups), ou
// entregáveis que não têm interface (os quatro mockups pedem chat, plano, grupo e área de aulas).
// Regras da forma: um laranja por tela, texto ≥ 28 px (decorativo de interface pode ser menor), sem vidro, sem tela
// dividida, curvas só de movimento.ts. UI dos mockups própria, nome fictício, sem logos de terceiros.
// Origem: aula 01 (c13-nutri-sem-com, 2026-11-12; refs. `anotacao_onm-antes-depois-01`, `tela_onm-plataforma-notebook-01`,
// "com e sem Tivita"); promovida em 2026-11-13.

// Space Grotesk (fonte da faixa nova) só na faixa nova; 400–600.
const { fontFamily: grotesk } = carregarGrotesk("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] });
// Instrument Serif itálico: acento da plataforma fictícia (ref. O Novo Mercado).
const { fontFamily: serif } = carregarSerif("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] });

type NsTom = "verde" | "rosa" | "areia" | "azul" | "lilas";
export type GraficoSemComBatidas = {
  meta: number; // objetivo
  seisMeses: number; // prazo do objetivo
  opcao1: number; // faixa da antiga abre
  consulta: number; // serviço da antiga
  preco: number; // preço da antiga
  dieta: number; // 1º item da antiga
  espera: number; // 2º item da antiga
  retorno: number;
  risca: number; // antiga riscada à mão (itens em +0,25 e +0,5)
  alternativa: number; // antiga compacta, nova abre
  programa: number; // título da nova
  dezVezes: number; // preço conta até o novo valor
  novaDona: number; // rótulo troca para o nome da nova
  palco: number; // câmera vira card, quadro claro abre, 1º mockup
  semana: number; // entregável 1 / check-in
  verSe: number; // 2ª mensagem do check-in
  pratica: number; // resposta do check-in em +0,2
  guias: number; // entregável 2 / plano
  receitas: number; // receita sobe
  gostosas: number; // coração
  facilidade: number; // refeição marcada
  grupo: number; // entregável 3 / grupo
  treino: number;
  exercicios: number; // confirmadas contam
  aulas: number; // entregável 4 / notebook (vídeo começa aqui)
  licoes: number[]; // troca do título da aula, uma por item de `aulas.titulos`
  volta: number; // câmera volta cheia
  naoEmagrecer: number; // objetivo pulsa
  devolve: number; // selo da garantia (momento-chave)
  condicao: number;
  sai: number; // tudo sai
};
export type GraficoSemComProps = {
  camera: Camera;
  dur: number;
  rostoX: number; // centro do rosto no quadro do editado (px), enquadra o card da câmera
  batidas: GraficoSemComBatidas;
  objetivo: { meta: string; prazo: string }; // ex.: "−10 kg" · "em 6 meses"
  antiga: {
    rotulo: string; // ex.: "Antes"
    servico: string; // ex.: "Serviço avulso"
    larguraRiscoServico: number; // largura do risco à mão sobre o serviço (px)
    preco: number; // valor de partida da contagem
    itens: [AntigaItem, AntigaItem]; // em batidas.dieta e batidas.espera
    resumo: string; // linha riscada da faixa compacta
  };
  nova: {
    rotuloAntes: string; // ex.: "Outra opção"
    rotulo: string; // ex.: "Depois"
    titulo: string;
    preco: number; // valor final da contagem
    multiplicador: string; // "10×"
    entregaveis: [NsEntregavel, NsEntregavel, NsEntregavel, NsEntregavel]; // em semana · guias · grupo · aulas (um mockup cada)
  };
  selo: { arco: string; valor: string; linhas: [string, string] }; // texto que gira, número grande, duas linhas
  marca: { nome: string; sigla: string; pessoa: string }; // plataforma fictícia dos mockups
  checkin: { titulo: string; progresso: string; semana: number; total: number; mensagens: { t: number; txt: string; eu?: boolean; hora: string }[] };
  plano: {
    titulo: string;
    subtitulo: string;
    refeicoes: { hora: string; nome: string; prato: string; tom: NsTom }[]; // 3; a 1ª ganha o ✓ em batidas.facilidade
    receita: { rotulo: string; nome: string; chips: string[] };
  };
  grupoCard: { nome: string; info: string; evento: string; quando: string; local: string; iniciais: string; confirmadas: number; botao: string };
  aulas: {
    titulos: [string, string][]; // [linha, acento em itálico] por aula, troca em batidas.licoes
    video: string; // caminho em public/ do vídeo do hero
    retrato: string; // caminho em public/ da foto do avatar
    meta: string; // "2 módulos · 4 aulas · 45 min"
    modulos: { n: number; img: string; pos: string; zoom: number; a: string; b: string }[]; // 4 capas (img: caminho em public/)
    moduloAtivo: number;
  };
};
type AntigaItem = { texto: string; detalhe?: string; icone: "pdf" | "relogio"; larguraRisco: number };
type NsEntregavel = { icone: NsIcone; texto: string };

// ---------- geometria ----------
// Oferta: card de 520 px em x 96–616 (cabelo em ~770). Câmera cheia: grupo centralizado na vertical (centro y 540).
// Câmera em card: oferta (520) + 64 + vaga do mockup (696) = 1280 = área livre inteira; centro vertical = centro do card (625).
const NS_G = { x: 96, w: 520, pad: 40, objH: 32, objGap: 16 };
const NS_VAGA = { x: 96 + 520 + 64, w: 696 };

const NS_SOMBRA_UI = "0 30px 60px rgba(25,28,35,.22), 0 4px 12px rgba(25,28,35,.10)";
const NS_TINTA = "#191C23";
const NS_APP = { verde: "#2F8F6B", verdeClaro: "#DDF1E6", fundo: "#F4F5F2", cinza: "#6B7280", linha: "#E6E8EB" };
const NS_PASTEL: Record<NsTom, { fundo: string; texto: string }> = {
  verde: { fundo: "#E3F3EA", texto: "#2E7652" },
  rosa: { fundo: "#FBE9F0", texto: "#9C3F66" },
  areia: { fundo: "#F6EEDC", texto: "#8A6A22" },
  azul: { fundo: "#E4EEFA", texto: "#3A5F94" },
  lilas: { fundo: "#ECE8FA", texto: "#5A4BA8" },
};

// ---------- tempo ----------
const nsSurge = (t: number, a: number, dy = 16, dur = 0.45): React.CSSProperties => {
  const p = eo(seg(t, a, a + dur));
  return { opacity: p, translate: `0px ${lerp(dy, 0, p).toFixed(1)}px` };
};
const nsPop = (t: number, a: number, dist = 14, dur = 0.4): React.CSSProperties => {
  const k = eob(seg(t, a, a + dur), 1.2);
  return { opacity: clamp01(seg(t, a, a + dur) * 2.2), translate: `0px ${lerp(dist, 0, k).toFixed(1)}px`, scale: String(lerp(0.94, 1, k)) };
};
// Momento-chave: entra 15% maior e assenta.
const nsChave = (t: number, a: number): React.CSSProperties => {
  const p = eo(seg(t, a, a + 0.5));
  return { opacity: clamp01(p * 3), scale: String(lerp(1.15, 1, p)) };
};
// Altura que cresce passando por [tempo, altura].
const nsCresce = (t: number, h0: number, passos: [number, number][]) => {
  let h = h0;
  passos.forEach(([a, alvo]) => (h = lerp(h, alvo, eio(seg(t, a - 0.1, a + 0.4)))));
  return h;
};

// ---------- peças ----------
const NsIconeTraco: React.FC<{ d: string; tam?: number; cor?: string; largura?: number }> = ({ d, tam = 40, cor = "currentColor", largura = 2.2 }) => (
  <svg width={tam} height={tam} viewBox="0 0 32 32" style={{ display: "block", flex: "none" }}>
    <path d={d} style={{ fill: "none", stroke: cor, strokeWidth: largura, strokeLinecap: "round", strokeLinejoin: "round" }} />
  </svg>
);
const NS_IC = {
  x: "M9 9 L23 23 M23 9 L9 23",
  check: "M6 16.5 L13 23.5 L26 9.5",
  alvo: "M16 4 a12 12 0 1 1 -0.01 0 Z M16 10 a6 6 0 1 1 -0.01 0 Z M16 15 a1 1 0 1 1 -0.01 0 Z",
  consulta: "M5 8 H27 V27 H5 Z M5 13 H27 M11 4 V9 M21 4 V9 M10 19 H14 M10 23 H18",
  dinheiro: "M3 9 H29 V23 H3 Z M16 12.5 a3.5 3.5 0 1 1 -0.01 0 Z M7 13 V19 M25 13 V19",
  documento: "M8 3 H19 L25 9 V29 H8 Z M19 3 V9 H25 M12 16 H21 M12 20.5 H21 M12 25 H17",
  relogio: "M16 4 a12 12 0 1 1 -0.01 0 Z M16 9 V16 L21 19",
  chat: "M5 6 H27 V22 H14 L8 27 V22 H5 Z M10 12 H22 M10 16.5 H18",
  receita: "M6 18 H26 C26 24 21.5 27 16 27 C10.5 27 6 24 6 18 Z M11 13 C11 10 13 10 13 7 M16 13 C16 10 18 10 18 7 M21 13 C21 10 23 10 23 7",
  grupo: "M11 5 a4.5 4.5 0 1 1 -0.01 0 Z M3 27 C3 21.5 6.5 18.5 11 18.5 C15.5 18.5 19 21.5 19 27 M21.5 5.5 a4 4 0 0 1 0 8.5 M23.5 18.8 C27 19.5 29 22.5 29 27",
  play: "M4 6 H28 V24 H4 Z M13 10.5 L20 15 L13 19.5 Z M10 28 H22",
  voltar: "M20 7 L11 16 L20 25",
  coracao: "M16 27 C 6 20, 3 15, 3 10.5 C 3 6.5, 6 4, 9.5 4 C 12.5 4, 14.6 5.8, 16 8 C 17.4 5.8, 19.5 4, 22.5 4 C 26 4, 29 6.5, 29 10.5 C 29 15, 26 20, 16 27 Z",
  pino: "M16 29 C16 29 7 19.5 7 12.5 a9 9 0 0 1 18 0 C25 19.5 16 29 16 29 Z M16 9.5 a3 3 0 1 1 -0.01 0 Z",
  calendario: "M5 8 H27 V27 H5 Z M5 13 H27 M11 4 V9 M21 4 V9",
  talheres: "M8 4 V12 C8 14 9.5 15 11 15 C12.5 15 14 14 14 12 V4 M11 4 V28 M11 15 V28 M23 28 V4 C19.5 6.5 19 12 19.5 17 H23",
};
export type NsIcone = keyof typeof NS_IC;

const NsMonograma: React.FC<{ tam: number; txt: string; fundo: string; cor?: string }> = ({ tam, txt, fundo, cor = "#FFFFFF" }) => (
  <div style={{ width: tam, height: tam, flex: "none", borderRadius: "50%", background: fundo, color: cor, display: "grid", placeItems: "center", fontWeight: 600, fontSize: tam * (txt.length > 1 ? 0.36 : 0.46), letterSpacing: "-0.02em" }}>{txt}</div>
);

// Oferta: faixas empilhadas à esquerda do rosto. Grade de 8 px, padding 40, passo fixo de 56 px entre itens.
// Texto: 22 rótulo · 28 texto · 40 título · 56 preço; pesos 400 e 500. Space Grotesk só nos rótulos.
const NS_ND = { laranja: "#FC5C20", preto: "#191C23", branco: "#F4F3EF", cinza: "#2A2D34" };
const NS_T = { rotulo: 22, texto: 28, titulo: 40, preco: 56 };
const nsRotuloTec: React.CSSProperties = { fontFamily: grotesk, fontSize: NS_T.rotulo, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: "32px" };
const nsTextoBase: React.CSSProperties = { fontSize: NS_T.texto, fontWeight: 400, lineHeight: "36px", whiteSpace: "nowrap", letterSpacing: "-0.01em" };
// Posições dentro de cada faixa (múltiplos de 8).
const NS_AN = { rotulo: 40, sub: 88, preco: 136, divisor: 216, itens: 240, passo: 56, aberta: 372, compacta: 160 };
const NS_NV = { rotulo: 40, titulo: 88, preco: 200, divisor: 280, itens: 304, passo: 56, alt: 548 };

const NsRisco: React.FC<{ t: number; risca: number; largura: number; left: number }> = ({ t, risca, largura, left }) => (
  <svg viewBox={`0 0 ${largura + 16} 36`} style={{ position: "absolute", left, top: 0, width: largura + 16, height: 36, overflow: "visible", translate: tremido(t) }}>
    <Traco d={`M2 21 C ${largura * 0.3} 17, ${largura * 0.65} 23, ${largura + 10} 16`} p={eio(seg(t, risca, risca + 0.32))} largura={4} />
  </svg>
);

const NsIconePdf: React.FC = () => (
  <svg width={24} height={28} viewBox="0 0 24 28" style={{ display: "block", flex: "none" }}>
    <path d="M3 1.5 H15 L21.5 8 V26.5 H3 Z M15 1.5 V8 H21.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
    <rect x={0.5} y={14} width={16} height={8} rx={2} fill="#E5484D" />
    <text x={8.5} y={20.3} textAnchor="middle" style={{ fontFamily: grotesk, fontSize: 6.4, fontWeight: 600, fill: "#FFFFFF", letterSpacing: "0.04em" }}>PDF</text>
  </svg>
);

// Linha da antiga dona: ícone + texto (+ detalhe), riscada na fala.
const NsLinhaAntiga: React.FC<{ t: number; a: number; y: number; icone: React.ReactNode; texto: string; detalhe?: string; risca: number; larguraRisco: number }> = ({ t, a, y, icone, texto, detalhe, risca, larguraRisco }) => {
  const apagou = eio(seg(t, risca, risca + 0.3));
  return (
    <div style={{ position: "absolute", left: NS_G.pad, top: y, height: 36, display: "flex", alignItems: "center", gap: 16, ...nsSurge(t, a, 10) }}>
      <div style={{ width: 24, height: 28, display: "grid", placeItems: "center", flex: "none", opacity: lerp(0.85, 0.5, apagou) }}>{icone}</div>
      <p className="nd-num" style={{ ...nsTextoBase, opacity: lerp(0.9, 0.5, apagou) }}>{texto}</p>
      {detalhe ? <p className="nd-num" style={{ ...nsTextoBase, opacity: lerp(0.5, 0.32, apagou) }}>{detalhe}</p> : null}
      <NsRisco t={t} risca={risca} largura={larguraRisco} left={40} />
    </div>
  );
};
const nsIconeAntigo = (i: AntigaItem["icone"]) => (i === "pdf" ? <NsIconePdf /> : <NsIconeTraco d={NS_IC.relogio} tam={24} cor="currentColor" largura={1.8} />);

// Entregável da opção nova: check laranja (traço fino) + ícone de traço + texto preto.
const NsEntregavelLinha: React.FC<{ t: number; a: number; i: number; icone: string; texto: string; foco: number }> = ({ t, a, i, icone, texto, foco }) => (
  <div style={{ position: "absolute", left: NS_G.pad, top: NS_NV.itens + i * NS_NV.passo, height: 36, display: "flex", alignItems: "center", gap: 16, opacity: lerp(0.6, 1, foco), ...nsSurge(t, a, 10) }}>
    <NsIconeTraco d={NS_IC.check} tam={24} cor={NS_ND.laranja} largura={2.2} />
    <NsIconeTraco d={icone} tam={26} cor="rgba(25,28,35,.78)" largura={1.9} />
    <p style={{ ...nsTextoBase, color: NS_ND.preto }}>{texto}</p>
  </div>
);

// Mistura de cor câmera → papel (o card muda de contraste quando o fundo claro abre).
const nsMix = (a: string, b: string, k: number) => (k <= 0.001 ? a : k >= 0.999 ? b : `color-mix(in srgb, ${b} ${(k * 100).toFixed(1)}%, ${a})`);

const NsOferta: React.FC<{ t: number; papel: number; card: number; p: GraficoSemComProps }> = ({ t, papel, card, p }) => {
  const B = p.batidas;
  const entra = eo(seg(t, 0.3, 0.9));
  const sai = eio(seg(t, B.sai, B.sai + 0.45));
  const compacta = eio(seg(t, B.alternativa - 0.05, B.alternativa + 0.55));
  const objetivoFoco = pulso(seg(t, B.naoEmagrecer - 0.1, B.naoEmagrecer + 1.6));

  const hAntigaAberta = nsCresce(t, 0, [
    [B.opcao1, NS_AN.sub + 40],
    [B.preco, NS_AN.divisor - 8],
    [B.dieta, NS_AN.itens + 36 + 40],
    [B.espera, NS_AN.aberta],
  ]);
  const hAntiga = lerp(hAntigaAberta, NS_AN.compacta, compacta);
  const hNova = nsCresce(t, 0, [
    [B.alternativa + 0.05, NS_NV.titulo + 40],
    [B.programa, NS_NV.preco - 8],
    [B.dezVezes, NS_NV.divisor + 8],
    [B.semana, NS_NV.itens + 1 * NS_NV.passo + 20],
    [B.guias, NS_NV.itens + 2 * NS_NV.passo + 20],
    [B.grupo, NS_NV.itens + 3 * NS_NV.passo + 20],
    [B.aulas, NS_NV.alt],
  ]);
  const precoK = eio(seg(t, B.dezVezes, B.dezVezes + 1.1));
  const preco = Math.round(lerp(p.antiga.preco, p.nova.preco, precoK) / 100) * 100;
  const novaDona = eio(seg(t, B.novaDona - 0.05, B.novaDona + 0.35));
  const naGarantia = eio(seg(t, B.devolve - 0.2, B.devolve + 0.3));
  const novaAparece = eo(seg(t, B.alternativa, B.alternativa + 0.5));
  const itensA = [B.semana, B.guias, B.grupo, B.aulas];
  const focoItem = (i: number) => {
    const a = itensA[i];
    const b = itensA[i + 1] ?? B.volta;
    return t >= B.volta ? 1 : eo(seg(t, a, a + 0.3)) * (1 - eio(seg(t, b, b + 0.3)));
  };
  // Grupo centralizado na vertical: centro 540 (câmera cheia) → 625 (centro do card de câmera).
  const novaVis = novaAparece * (NS_G.objGap + hNova);
  const grupoH = NS_G.objH + NS_G.objGap + hAntiga + novaVis;
  const topo = lerp(540, 625, card) - grupoH / 2;
  const antigaY = topo + NS_G.objH + NS_G.objGap;
  const novaY = antigaY + hAntiga + NS_G.objGap;
  const corObj = nsMix("#F1F1F1", NS_ND.preto, papel);
  const corAntiga = nsMix("#F1F1F1", "#6B7280", papel);
  const clipBase = (alt: number, h: number) => `inset(0px -60px ${Math.max(0, alt - h).toFixed(1)}px -60px round 0px 0px 24px 24px)`;
  const [it0, it1] = p.antiga.itens;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entra * (1 - sai), translate: `${lerp(-20, 0, entra).toFixed(1)}px ${(-10 * sai).toFixed(1)}px` }}>
      {/* Objetivo (título discreto, pulsa na palavra da condição) */}
      <div style={{ position: "absolute", left: NS_G.x, top: topo - 2, height: 36, color: corObj, display: "flex", alignItems: "center", gap: 16, transformOrigin: "0 50%", scale: String(1 + 0.08 * objetivoFoco) }}>
        <NsIconeTraco d={NS_IC.alvo} tam={28} cor={corObj} largura={1.8} />
        <p className="nd-num" style={{ ...nsTextoBase, fontWeight: 500 }}>
          {`${p.objetivo.meta} `}<span style={{ fontWeight: 400, opacity: 0.7, ...nsSurge(t, B.seisMeses, 6) }}>{p.objetivo.prazo}</span>
        </p>
      </div>

      {/* Antiga dona */}
      <div style={{ position: "absolute", left: NS_G.x, top: antigaY, width: NS_G.w, height: NS_AN.aberta, color: corAntiga, clipPath: clipBase(NS_AN.aberta, hAntiga), opacity: clamp01(seg(t, B.opcao1 - 0.1, B.opcao1 + 0.3) * 1.5) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: hAntiga, borderRadius: 24, background: nsMix(NS_ND.cinza, "#E6E8EC", papel), border: `1px solid ${nsMix("rgba(255,255,255,.06)", "rgba(25,28,35,.06)", papel)}`, boxSizing: "border-box" }} />
        <p style={{ position: "absolute", left: NS_G.pad, top: NS_AN.rotulo, ...nsRotuloTec, color: corAntiga, opacity: 0.75 }}>{p.antiga.rotulo}</p>
        {/* aberta (janela 1) */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - compacta }}>
          <div style={{ position: "absolute", left: NS_G.pad, top: NS_AN.sub, height: 36, ...nsSurge(t, B.consulta, 10) }}>
            <p style={{ ...nsTextoBase, opacity: lerp(0.9, 0.5, eio(seg(t, B.risca, B.risca + 0.3))) }}>{p.antiga.servico}</p>
            <NsRisco t={t} risca={B.risca} largura={p.antiga.larguraRiscoServico} left={-4} />
          </div>
          <p className="nd-num" style={{ position: "absolute", left: NS_G.pad, top: NS_AN.preco, fontSize: NS_T.preco, fontWeight: 500, letterSpacing: "-.035em", lineHeight: "56px", opacity: 0.7, ...nsSurge(t, B.preco, 12) }}>{`R$ ${p.antiga.preco.toLocaleString("pt-BR")}`}</p>
          <div style={{ position: "absolute", left: NS_G.pad, right: NS_G.pad, top: NS_AN.divisor, height: 1, background: "currentColor", opacity: 0.12 * clamp01(seg(t, B.preco, B.preco + 0.4)) }} />
          <NsLinhaAntiga t={t} a={B.dieta} y={NS_AN.itens} icone={nsIconeAntigo(it0.icone)} texto={it0.texto} detalhe={it0.detalhe} risca={B.risca + 0.25} larguraRisco={it0.larguraRisco} />
          <NsLinhaAntiga t={t} a={B.espera} y={NS_AN.itens + NS_AN.passo} icone={nsIconeAntigo(it1.icone)} texto={it1.texto} detalhe={it1.detalhe} risca={B.risca + 0.5} larguraRisco={it1.larguraRisco} />
        </div>
        {/* compacta e riscada (janelas 2–4) */}
        <div style={{ position: "absolute", inset: 0, opacity: compacta }}>
          <p className="nd-num" style={{ position: "absolute", right: NS_G.pad, top: NS_AN.rotulo - 2, ...nsTextoBase, fontWeight: 500, opacity: 0.5 }}>{`R$ ${p.antiga.preco.toLocaleString("pt-BR")}`}</p>
          <div style={{ position: "absolute", left: NS_G.pad, top: NS_AN.rotulo + 48 }}>
            <p style={{ ...nsTextoBase, opacity: 0.45 }}>{p.antiga.resumo}</p>
            <div style={{ position: "absolute", left: -4, right: -6, top: 19, height: 2, borderRadius: 1, background: "currentColor", opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Opção nova */}
      <div style={{ position: "absolute", left: NS_G.x, top: novaY, width: NS_G.w, height: NS_NV.alt, color: NS_ND.preto, opacity: novaAparece, translate: `0px ${lerp(16, 0, novaAparece).toFixed(1)}px`, clipPath: `inset(-60px -60px ${Math.max(0, NS_NV.alt - hNova).toFixed(1)}px -60px)` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: hNova, borderRadius: 24, background: NS_ND.branco, border: `2px solid ${NS_ND.laranja}`, boxSizing: "border-box", boxShadow: `0 24px 60px ${nsMix("rgba(0,0,0,.38)", "rgba(25,28,35,.14)", papel)}` }} />
        <div style={{ position: "absolute", left: NS_G.pad, top: NS_NV.rotulo, height: 32 }}>
          <p style={{ ...nsRotuloTec, color: NS_ND.laranja, position: "absolute", opacity: (1 - novaDona) * clamp01(seg(t, B.alternativa + 0.2, B.alternativa + 0.6)) }}>{p.nova.rotuloAntes}</p>
          <p style={{ ...nsRotuloTec, color: NS_ND.laranja, position: "absolute", opacity: novaDona, translate: `0px ${lerp(8, 0, novaDona).toFixed(1)}px` }}>{p.nova.rotulo}</p>
        </div>
        <p style={{ position: "absolute", left: NS_G.pad, top: NS_NV.titulo, width: NS_G.w - NS_G.pad * 2, fontSize: NS_T.titulo, fontWeight: 500, letterSpacing: "-.025em", lineHeight: "44px", ...nsSurge(t, B.programa) }}>{p.nova.titulo}</p>
        <div style={{ position: "absolute", left: NS_G.pad, top: NS_NV.preco, height: 56, display: "flex", alignItems: "baseline", gap: 16, ...nsSurge(t, B.dezVezes, 12) }}>
          <p className="nd-num" style={{ fontSize: NS_T.preco, fontWeight: 500, letterSpacing: "-.035em", lineHeight: "56px" }}>R$ {preco.toLocaleString("pt-BR")}</p>
          <p className="nd-num" style={{ position: "relative", ...nsTextoBase, fontWeight: 500, ...nsSurge(t, B.dezVezes + 0.6, 8) }}>
            <span style={{ color: NS_ND.laranja, opacity: 1 - naGarantia }}>{p.nova.multiplicador}</span>
            <span style={{ position: "absolute", left: 0, color: NS_ND.preto, opacity: naGarantia }}>{p.nova.multiplicador}</span>
          </p>
        </div>
        <div style={{ position: "absolute", left: NS_G.pad, right: NS_G.pad, top: NS_NV.divisor, height: 1, background: "rgba(25,28,35,.10)", opacity: clamp01(seg(t, B.semana - 0.3, B.semana + 0.1)) }} />
        {p.nova.entregaveis.map((e, i) => (
          <NsEntregavelLinha key={i} t={t} a={itensA[i]} i={i} icone={NS_IC[e.icone]} texto={e.texto} foco={focoItem(i)} />
        ))}
      </div>
      {/* Selo encostado no canto inferior direito do card da nova; centro 80 px acima da base do card para o selo
          terminar em y ≈ 940 (zona segura do player, plataformas.md) */}
      <NsSelo t={t} cx={NS_G.x + NS_G.w - 24} cy={novaY + hNova - 80} p={p} />
    </div>
  );
};

// ---------- mockups (UI própria, dados fictícios) ----------
const NsCelular: React.FC<{ w: number; h: number; fundo: string; children: React.ReactNode }> = ({ w, h, fundo, children }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: 58, background: "#0C0E12", padding: 11, boxSizing: "border-box", boxShadow: NS_SOMBRA_UI, border: "1.5px solid #2B2F38" }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 47, overflow: "hidden", background: fundo, color: NS_TINTA }}>
      {children}
      {/* barra de status */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", fontSize: 19, fontWeight: 600 }}>
        <span>9:41</span>
        <span style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
          {[7, 10, 13, 16].map((x) => (
            <i key={x} style={{ width: 4, height: x, borderRadius: 1, background: NS_TINTA }} />
          ))}
          <i style={{ width: 26, height: 13, marginLeft: 6, borderRadius: 4, border: `1.5px solid ${NS_TINTA}`, boxSizing: "border-box" }} />
        </span>
      </div>
      <div style={{ position: "absolute", left: "50%", top: 12, width: 104, height: 30, marginLeft: -52, borderRadius: 16, background: "#0C0E12" }} />
    </div>
  </div>
);

// A · check-in semanal (conversa com a equipe)
const NsTelaCheckin: React.FC<{ t: number; p: GraficoSemComProps }> = ({ t, p }) => {
  const B = p.batidas;
  const c = p.checkin;
  let y = 282;
  return (
    <div style={{ position: "absolute", inset: 0, background: NS_APP.fundo }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 158, background: "#FFFFFF", borderBottom: `1px solid ${NS_APP.linha}` }}>
        <div style={{ position: "absolute", left: 18, top: 68, display: "flex", alignItems: "center", gap: 12 }}>
          <NsIconeTraco d={NS_IC.voltar} tam={30} cor={NS_APP.verde} largura={2.6} />
          <NsMonograma tam={58} txt={p.marca.sigla} fundo={NS_APP.verde} />
          <div style={{ lineHeight: 1.15 }}>
            <p style={{ fontSize: 22, fontWeight: 600, whiteSpace: "nowrap" }}>{`Equipe ${p.marca.nome}`}</p>
            <p style={{ fontSize: 19, color: NS_APP.verde, fontWeight: 500 }}>online</p>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 18, right: 18, top: 172, height: 92, borderRadius: 20, background: "#FFFFFF", boxShadow: "0 1px 2px rgba(25,28,35,.10)", padding: "16px 20px", boxSizing: "border-box", ...nsPop(t, B.palco + 1.2, 10) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <p style={{ fontSize: 22, fontWeight: 600, whiteSpace: "nowrap" }}>{c.titulo}</p>
          <p className="nd-num" style={{ fontSize: 18, color: NS_APP.cinza, whiteSpace: "nowrap" }}>{c.progresso}</p>
        </div>
        <div style={{ marginTop: 14, height: 10, borderRadius: 5, background: NS_APP.verdeClaro, overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 5, background: NS_APP.verde, scale: `${lerp(0, c.semana / c.total, eo(seg(t, B.palco + 1.4, B.palco + 2.4))).toFixed(3)} 1`, transformOrigin: "0 50%" }} />
        </div>
      </div>
      {c.mensagens.map((m) => {
        const top = y;
        const linhas = m.txt.length > 22 ? 2 : 1;
        const alt = 30 + linhas * 36 + 24;
        y += alt + 14;
        return (
          <div key={m.t} style={{ position: "absolute", top, left: m.eu ? undefined : 18, right: m.eu ? 18 : undefined, maxWidth: 280, transformOrigin: m.eu ? "100% 100%" : "0 100%", ...nsPop(t, m.t, 12, 0.35) }}>
            <div style={{ padding: "14px 18px 30px", borderRadius: 22, borderTopLeftRadius: m.eu ? 22 : 6, borderTopRightRadius: m.eu ? 6 : 22, background: m.eu ? NS_APP.verdeClaro : "#FFFFFF", boxShadow: "0 1px 2px rgba(25,28,35,.10)", fontSize: 28, lineHeight: "36px", fontWeight: 500, position: "relative" }}>
              {m.txt}
              <span style={{ position: "absolute", right: 14, bottom: 8, fontSize: 15, color: NS_APP.cinza }}>{m.hora}</span>
            </div>
          </div>
        );
      })}
      {/* barra de digitação */}
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 26, height: 56, borderRadius: 28, background: "#FFFFFF", border: `1px solid ${NS_APP.linha}`, display: "flex", alignItems: "center", padding: "0 22px", fontSize: 19, color: "#9AA0A8" }}>Mensagem</div>
    </div>
  );
};

// Ilustração simples de prato (para receitas), em traço + pastel.
const NsPrato: React.FC<{ tam: number; tom: { fundo: string; texto: string } }> = ({ tam, tom }) => (
  <svg width={tam} height={tam} viewBox="0 0 100 100" style={{ display: "block" }}>
    <circle cx="50" cy="50" r="44" fill="#FFFFFF" />
    <circle cx="50" cy="50" r="34" fill={tom.fundo} />
    <path d="M30 52 C34 40 46 38 52 46 C46 52 38 56 30 52 Z" fill="#7FB98F" />
    <circle cx="60" cy="40" r="8" fill="#F2B880" />
    <circle cx="64" cy="60" r="9" fill="#E9A3A3" />
    <path d="M40 64 C46 70 54 70 58 66" stroke={tom.texto} strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

// B · plano + receita
const NsTelaPlano: React.FC<{ t: number; p: GraficoSemComProps }> = ({ t, p }) => {
  const B = p.batidas;
  const pl = p.plano;
  const receita = eo(seg(t, B.receitas, B.receitas + 0.5));
  const curtiu = eob(seg(t, B.gostosas, B.gostosas + 0.4), 2);
  const feito = seg(t, B.facilidade, B.facilidade + 0.35);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F7F5F0" }}>
      <div style={{ position: "absolute", left: 26, top: 70 }}>
        <p className="nd-rotulo" style={{ fontSize: 15, color: NS_APP.verde }}>{p.marca.nome}</p>
        <p style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-.025em", marginTop: 4 }}>{pl.titulo}</p>
        <p style={{ fontSize: 19, color: NS_APP.cinza, marginTop: 2 }}>{pl.subtitulo}</p>
      </div>
      {pl.refeicoes.map((r, i) => {
        const tom = NS_PASTEL[r.tom];
        return (
          <div key={r.nome} style={{ position: "absolute", left: 18, right: 18, top: 196 + i * 120, height: 106, borderRadius: 22, background: "#FFFFFF", boxShadow: "0 1px 3px rgba(25,28,35,.08)", display: "flex", alignItems: "center", gap: 14, padding: "0 16px", ...nsPop(t, B.guias + 0.15 + i * 0.12, 12) }}>
            <div style={{ width: 70, height: 70, borderRadius: 18, background: tom.fundo, display: "grid", placeItems: "center", flex: "none" }}>
              <NsPrato tam={60} tom={tom} />
            </div>
            <div style={{ lineHeight: 1.18, minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 17, color: tom.texto, fontWeight: 600 }}>{r.nome} · {r.hora}</p>
              <p style={{ fontSize: 26, fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "-.01em" }}>{r.prato}</p>
            </div>
            {i === 0 && (
              <div style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", background: NS_APP.verde, display: "grid", placeItems: "center", opacity: feito, scale: String(lerp(0.6, 1, eob(feito))) }}>
                <NsIconeTraco d={NS_IC.check} tam={22} cor="#FFFFFF" largura={3.4} />
              </div>
            )}
          </div>
        );
      })}
      {/* receita que sobe */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 380, borderRadius: "30px 30px 0 0", background: "#FFFFFF", boxShadow: "0 -10px 30px rgba(25,28,35,.14)", translate: `0px ${lerp(400, 0, receita).toFixed(1)}px` }}>
        <div style={{ position: "absolute", left: "50%", top: 10, width: 54, height: 5, marginLeft: -27, borderRadius: 3, background: "#D9DCE1" }} />
        <div style={{ position: "absolute", left: 18, right: 18, top: 28, height: 150, borderRadius: 20, background: NS_PASTEL.verde.fundo, display: "grid", placeItems: "center" }}>
          <NsPrato tam={130} tom={NS_PASTEL.verde} />
        </div>
        <div style={{ position: "absolute", right: 30, top: 42, width: 48, height: 48, borderRadius: "50%", background: "#FFFFFF", display: "grid", placeItems: "center", boxShadow: "0 2px 6px rgba(25,28,35,.12)" }}>
          <svg width={28} height={28} viewBox="0 0 32 32">
            <path d={NS_IC.coracao} style={{ fill: curtiu > 0 ? "#E5484D" : "none", stroke: "#E5484D", strokeWidth: 2.4, transformOrigin: "16px 16px", scale: String(curtiu > 0 ? lerp(0.6, 1, curtiu) : 1) }} />
          </svg>
        </div>
        <p className="nd-rotulo" style={{ position: "absolute", left: 26, top: 196, fontSize: 15, color: NS_PASTEL.verde.texto }}>{pl.receita.rotulo}</p>
        <p style={{ position: "absolute", left: 26, right: 26, top: 222, fontSize: 30, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.05 }}>{pl.receita.nome}</p>
        <div style={{ position: "absolute", left: 26, top: 300, display: "flex", gap: 8 }}>
          {pl.receita.chips.map((x) => (
            <span key={x} style={{ padding: "6px 14px", borderRadius: 999, background: NS_PASTEL.verde.fundo, color: NS_PASTEL.verde.texto, fontSize: 18, fontWeight: 600 }}>{x}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// C · grupo com encontro presencial
const NS_CORES_AV = ["#E8A87C", "#9C3F66", "#5A4BA8", "#2E7652", "#3A5F94", "#C38D2E"];
const NsCardGrupo: React.FC<{ t: number; p: GraficoSemComProps }> = ({ t, p }) => {
  const B = p.batidas;
  const g = p.grupoCard;
  const confirmadas = Math.round(lerp(0, g.confirmadas, eio(seg(t, B.exercicios, B.exercicios + 1.2))));
  return (
    <div style={{ position: "relative", width: 470, height: 560, borderRadius: 30, background: "#FFFFFF", color: NS_TINTA, boxShadow: NS_SOMBRA_UI, overflow: "hidden" }}>
      <div style={{ height: 112, display: "flex", alignItems: "center", gap: 16, padding: "0 26px", borderBottom: `1px solid ${NS_APP.linha}` }}>
        <div style={{ width: 62, height: 62, borderRadius: 18, background: NS_PASTEL.verde.fundo, display: "grid", placeItems: "center", flex: "none" }}>
          <NsIconeTraco d={NS_IC.grupo} tam={36} cor={NS_PASTEL.verde.texto} />
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <p style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.02em" }}>{g.nome}</p>
          <p style={{ fontSize: 19, color: NS_APP.cinza }}>{g.info}</p>
        </div>
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, top: 136, ...nsPop(t, B.grupo + 0.55, 14) }}>
        <p style={{ fontSize: 19, fontWeight: 600, color: NS_APP.verde, marginBottom: 8 }}>{`Equipe ${p.marca.nome}`}</p>
        <div style={{ borderRadius: 22, background: NS_APP.fundo, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 58, height: 58, borderRadius: 16, background: NS_PASTEL.areia.fundo, display: "grid", placeItems: "center", flex: "none" }}>
              <NsIconeTraco d={NS_IC.calendario} tam={32} cor={NS_PASTEL.areia.texto} />
            </div>
            <div style={{ lineHeight: 1.12 }}>
              <p style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-.02em" }}>{g.evento}</p>
              <p style={{ fontSize: 24, color: NS_APP.cinza }}>{g.quando}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, fontSize: 22, color: NS_APP.cinza }}>
            <NsIconeTraco d={NS_IC.pino} tam={26} cor={NS_APP.cinza} largura={2} />{` ${g.local}`}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, top: 410, display: "flex", alignItems: "center", gap: 16, ...nsSurge(t, B.exercicios, 10) }}>
        <div style={{ display: "flex" }}>
          {NS_CORES_AV.map((c, i) => (
            <div key={c} style={{ marginLeft: i ? -14 : 0, border: "3px solid #FFFFFF", borderRadius: "50%", ...nsPop(t, B.exercicios + i * 0.12, 8, 0.3) }}>
              <NsMonograma tam={48} txt={g.iniciais[i]} fundo={c} />
            </div>
          ))}
        </div>
        <p className="nd-num" style={{ fontSize: 26, fontWeight: 600, whiteSpace: "nowrap" }}>{confirmadas} vão</p>
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, height: 60, borderRadius: 16, background: NS_APP.verde, color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 600, ...nsSurge(t, B.exercicios + 0.5, 8) }}>{g.botao}</div>
    </div>
  );
};

// D · área de membros no notebook (ref. tela_onm-plataforma-hero-01, foto_onm-professores-cards-01, tela_onm-omnia-aula-01):
// hero com a aula tocando (vídeo real, sem loop), título com o acento em itálico serifado, metadados finos,
// "Assista já" e trilho "Continuar assistindo" com capas de módulo em foto. Título troca nas aulas faladas.
const NS_VERDE_CLARO = "#8FD6B2";
const NS_NB = { w: 880, h: 556 };
const NsNotebook: React.FC<{ t: number; p: GraficoSemComProps }> = ({ t, p }) => {
  const B = p.batidas;
  const au = p.aulas;
  const { fps } = useVideoConfig();
  let atual = 0;
  B.licoes.forEach((x, i) => {
    if (t >= x - 0.15) atual = i;
  });
  const inicioTitulo = atual === 0 ? B.aulas + 0.2 : B.licoes[atual] - 0.15;
  const troca = eo(seg(t, inicioTitulo, inicioTitulo + 0.45));
  const W = NS_NB.w - 28;
  const capaW = (W - 64 - 3 * 12) / 4;
  return (
    <div style={{ position: "relative", width: NS_NB.w + 80, height: NS_NB.h + 40 }}>
      <div style={{ position: "absolute", left: 40, top: 0, width: NS_NB.w, height: NS_NB.h, borderRadius: 24, background: "#0C0E12", padding: 14, boxSizing: "border-box", border: "1.5px solid #2E323B", boxShadow: NS_SOMBRA_UI }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", background: "#121418", color: "#F1F1F1" }}>
          {/* vídeo da aula (hero à direita) */}
          <div style={{ position: "absolute", left: 300, right: 0, top: 0, height: 360, overflow: "hidden" }}>
            <Sequence from={Math.round(B.aulas * fps)} layout="none">
              <Video src={staticFile(au.video)} muted objectFit="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectPosition: "62% 30%" }} />
            </Sequence>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 362, background: "linear-gradient(90deg, #121418 0%, #121418 34%, rgba(18,20,24,.72) 50%, rgba(18,20,24,0) 72%), linear-gradient(180deg, rgba(18,20,24,.65) 0%, rgba(18,20,24,0) 22%, rgba(18,20,24,0) 70%, #121418 100%)" }} />
          {/* navegação */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 52, display: "flex", alignItems: "center", gap: 12, padding: "0 28px" }}>
            <NsMonograma tam={28} txt={p.marca.sigla} fundo={NS_APP.verde} />
            <p style={{ fontSize: 17, fontWeight: 600, whiteSpace: "nowrap" }}>{p.marca.nome}</p>
            <div style={{ display: "flex", gap: 6, marginLeft: 22 }}>
              {["Início", "Aulas", "Trilhas", "Comunidade"].map((x, i) => (
                <span key={x} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 13, fontWeight: 500, background: i === 0 ? "rgba(255,255,255,.12)" : "transparent", opacity: i === 0 ? 1 : 0.6 }}>{x}</span>
              ))}
            </div>
            <div style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255,255,255,.6)" }}>
              <Img src={staticFile(au.retrato)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
            </div>
          </div>
          {/* texto do hero */}
          <div style={{ position: "absolute", left: 32, top: 78 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              <span style={{ opacity: 0.6 }}>Aula {atual + 1}{` de ${au.titulos.length} · `}</span>
              <span style={{ color: NS_VERDE_CLARO }}>Em destaque</span>
            </p>
            <div style={{ marginTop: 12, opacity: troca, translate: `0px ${lerp(10, 0, troca).toFixed(1)}px` }}>
              <p style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-.03em", lineHeight: "42px", whiteSpace: "nowrap" }}>{au.titulos[atual][0]}</p>
              <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 50, fontWeight: 400, color: NS_VERDE_CLARO, lineHeight: "50px", letterSpacing: "-.01em", whiteSpace: "nowrap" }}>{au.titulos[atual][1]}</p>
            </div>
            <p style={{ fontSize: 14, marginTop: 12, opacity: 0.75, whiteSpace: "nowrap" }}>
              com <span style={{ fontWeight: 600, opacity: 1 }}>{p.marca.pessoa}</span>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, opacity: 0.65, whiteSpace: "nowrap" }}>
              <NsIconeTraco d={NS_IC.play} tam={15} cor="#F1F1F1" largura={2.2} />{` ${au.meta}`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
              <div style={{ height: 38, padding: "0 18px", borderRadius: 999, background: "#FFFFFF", color: NS_TINTA, display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600 }}>
                <svg width={12} height={12} viewBox="0 0 12 12"><path d="M2 1 L11 6 L2 11 Z" fill={NS_TINTA} /></svg> Assista já
              </div>
              <div style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.35)", display: "grid", placeItems: "center" }}>
                <svg width={14} height={16} viewBox="0 0 14 16"><path d="M2 1.5 H12 V14.5 L7 11 L2 14.5 Z" fill="none" stroke="#F1F1F1" strokeWidth={1.6} strokeLinejoin="round" /></svg>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
              {au.titulos.map((_, i) => (
                <span key={i} style={{ width: i === atual ? 34 : 22, height: 3, borderRadius: 2, background: i === atual ? NS_VERDE_CLARO : "rgba(255,255,255,.25)" }} />
              ))}
            </div>
          </div>
          {/* trilho de módulos */}
          <div style={{ position: "absolute", left: 32, top: 372, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, rotate: "45deg", background: NS_VERDE_CLARO }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Continuar assistindo</p>
          </div>
          <div style={{ position: "absolute", left: 32, top: 398, display: "flex", gap: 12 }}>
            {au.modulos.map((m) => {
              const ativo = m.n === au.moduloAtivo;
              return (
                <div key={m.n} style={{ position: "relative", width: capaW, height: 112, borderRadius: 10, overflow: "hidden", background: "#1B1E24", boxShadow: ativo ? `0 0 0 2px ${NS_VERDE_CLARO}` : "none" }}>
                  <Img src={staticFile(m.img)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: m.pos, scale: String(m.zoom) }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(47,143,107,.30) 0%, rgba(18,20,24,0) 45%), linear-gradient(180deg, rgba(10,12,14,0) 30%, rgba(10,12,14,.88) 100%)" }} />
                  <p style={{ position: "absolute", left: 12, top: 10, fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", opacity: 0.85 }}>MÓDULO {m.n}</p>
                  <div style={{ position: "absolute", left: 12, bottom: ativo ? 16 : 10, lineHeight: 1.0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>{m.a}</p>
                    <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 19, color: NS_VERDE_CLARO, whiteSpace: "nowrap" }}>{m.b}</p>
                  </div>
                  {ativo && (
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "rgba(255,255,255,.2)" }}>
                      <div style={{ width: `${(35 + 15 * atual).toFixed(0)}%`, height: "100%", background: NS_VERDE_CLARO }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* base */}
      <div style={{ position: "absolute", left: 0, top: NS_NB.h - 2, width: NS_NB.w + 80, height: 26, borderRadius: "4px 4px 18px 18px", background: "linear-gradient(#C9CDD3, #9EA3AB)", boxShadow: "0 18px 36px rgba(25,28,35,.22)" }} />
      <div style={{ position: "absolute", left: (NS_NB.w + 80) / 2 - 70, top: NS_NB.h - 2, width: 140, height: 9, borderRadius: "0 0 8px 8px", background: "#8C9199" }} />
    </div>
  );
};

// Um mockup por vez: entra na fala do item, centralizado na vaga, e sai quando entra o próximo.
// Vaga do mockup: x 680–1376 (centro 1028), centro vertical 625 (o do card de câmera).
const NS_AREA = { cx: NS_VAGA.x + NS_VAGA.w / 2, cy: 625, h: 740 };
const NsVez: React.FC<{ t: number; a: number; b: number; w: number; h: number; s: number; children: React.ReactNode }> = ({ t, a, b, w, h, s, children }) => {
  if (t < a - 0.1 || t > b + 0.05) return null;
  const k = eob(seg(t, a, a + 0.5), 1.1);
  const kin = seg(t, a, a + 0.3);
  const out = eio(seg(t, b - 0.3, b));
  return (
    <div
      style={{
        position: "absolute",
        left: NS_AREA.cx - w / 2,
        top: NS_AREA.cy - h / 2,
        width: w,
        height: h,
        translate: `0px ${(lerp(40, 0, k) - 24 * out).toFixed(1)}px`,
        scale: String(s * lerp(0.96, 1, k) * lerp(1, 0.97, out)),
        opacity: kin * (1 - out),
      }}
    >
      {children}
    </div>
  );
};

// Selo da garantia (momento-chave): disco laranja com texto girando em arco.
const NS_SELO_R = 96;
const NsSelo: React.FC<{ t: number; cx: number; cy: number; p: GraficoSemComProps }> = ({ t, cx, cy, p }) => {
  const B = p.batidas;
  const SELO = { cx, cy, r: NS_SELO_R };
  if (t < B.devolve - 0.1) return null;
  const sai = eio(seg(t, B.sai, B.sai + 0.45));
  const giro = (t - B.devolve) * 9; // rotação contínua lenta (linear)
  return (
    <div style={{ position: "absolute", left: SELO.cx - SELO.r, top: SELO.cy - SELO.r, width: SELO.r * 2, height: SELO.r * 2, ...nsChave(t, B.devolve), opacity: (nsChave(t, B.devolve).opacity as number) * (1 - sai) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#FC5C20", boxShadow: "0 24px 50px rgba(0,0,0,.4)", rotate: "-8deg" }} />
      <svg viewBox="0 0 256 256" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", rotate: `${giro.toFixed(2)}deg` }}>
        <defs>
          <path id="nd-selo-arco" d="M128 128 m-100 0 a100 100 0 1 1 200 0 a100 100 0 1 1 -200 0" />
        </defs>
        <text style={{ fontFamily: "var(--mono)", fontSize: 17, letterSpacing: "0.2em", fill: "#FFFFFF" }}>
          <textPath href="#nd-selo-arco">{p.selo.arco}</textPath>
        </text>
        <circle cx={128} cy={128} r={84} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={1.5} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", color: "#FFFFFF", rotate: "-8deg" }}>
        <div style={{ lineHeight: 1 }}>
          <p className="nd-num" style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-.04em" }}>{p.selo.valor}</p>
          <p style={{ fontSize: 20, fontWeight: 500, marginTop: 4, lineHeight: 1.05 }}>{p.selo.linhas[0]}<br />{p.selo.linhas[1]}</p>
        </div>
      </div>
    </div>
  );
};

export const GraficoSemCom: React.FC<GraficoSemComProps> = (p) => {
  const { camera, batidas: B } = p;
  const t = useT();
  // Câmera: cheia → card (padrão da GraficoCommodity) → cheia na volta.
  const pIn = eio(seg(t, B.palco - 0.05, B.palco + 0.7));
  const pOut = eio(seg(t, B.volta, B.volta + 0.6));
  const pCam = pIn * (1 - pOut);
  // Quadro claro com grade de pontos: abre em círculo; some depois que a câmera volta a encher.
  const raio = lerp(0, 2100, eo(seg(t, B.palco - 0.2, B.palco + 0.45)));
  const quadro = t < B.volta + 0.65;
  // Contraste do card: papel (0 sobre a câmera, 1 sobre o quadro claro).
  // Segue o card de câmera: o papel só aparece atrás do card da oferta quando a câmera já encolheu.
  const papel = clamp01((pCam - 0.2) / 0.55);

  return (
    <Palco>
      {quadro && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: cores.branco,
            backgroundImage: "radial-gradient(#C9CDD4 1.3px, transparent 1.6px)",
            backgroundSize: "26px 26px",
            clipPath: `circle(${raio.toFixed(0)}px at 180px 118px)`,
          }}
        />
      )}
      <GraficoCameraCard camera={camera} p={pCam} rostoX={p.rostoX} />

      {/* Mockups, um de cada vez (janela 3), grandes e centralizados na área de motion */}
      <NsVez t={t} a={B.palco + 0.5} b={B.guias} w={380} h={780} s={NS_AREA.h / 780}>
        <NsCelular w={380} h={780} fundo={NS_APP.fundo}>
          <NsTelaCheckin t={t} p={p} />
        </NsCelular>
      </NsVez>
      <NsVez t={t} a={B.guias} b={B.grupo} w={380} h={780} s={NS_AREA.h / 780}>
        <NsCelular w={380} h={780} fundo="#F7F5F0">
          <NsTelaPlano t={t} p={p} />
        </NsCelular>
      </NsVez>
      <NsVez t={t} a={B.grupo} b={B.aulas} w={470} h={560} s={1.2}>
        <NsCardGrupo t={t} p={p} />
      </NsVez>
      <NsVez t={t} a={B.aulas} b={B.volta + 0.2} w={NS_NB.w + 80} h={NS_NB.h + 40} s={NS_VAGA.w / (NS_NB.w + 80)}>
        <NsNotebook t={t} p={p} />
      </NsVez>

      <NsOferta t={t} papel={papel} card={pCam} p={p} />
    </Palco>
  );
};
