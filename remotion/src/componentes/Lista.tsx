// `lista` · variação "framework convergente" (nome mantido `ListaChecklist` enquanto o Root importa assim):
// layout reduzido em fundo papel. A estrutura (nós vazios + linhas que convergem) entra junto com "quatro coisas";
// cada meio ganha ícone de traço fino e rótulo na palavra falada e a sua linha (conector ortogonal, como organograma)
// escurece até o ponto de encontro;
// o último item (o fim) desce pela seta e ganha o preenchimento laranja com texto branco — momento-chave. Depois, o que NÃO
// conta aparece embaixo e é riscado na palavra.
// Origem: cena "As 4 coisas" da aula 01 (2026-11-11; refeita a partir da lista com checklist, estilo.md §11–12).
import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { clamp01, eio, eo, lerp, pulso, sair, seg, tremido } from "../movimento";
import { cores, fontFamily, fonteMao, fonteMono } from "../marca";
import { CameraPainel, Palco, Traco, useT, type Camera, useInicioCamera } from "./comum";
import { Balao } from "./Destaque";

export type Icone = "clareza" | "direcao" | "risco" | "resultado";
type Item = { nome: string; icone: Icone; t: number }; // t: segundo da palavra falada
type Descarte = { nome: string; t: number };

export type ListaChecklistProps = {
  camera: Camera;
  dur: number;
  rotulo: string; // nome curto do framework (mono)
  titulo: string;
  meios: Item[]; // 3 itens no alto, convergem
  fim: Item; // destino, recebe o laranja
  descartes: Descarte[]; // riscados no fim
};

// Ícones de traço fino num quadro de 64; cada string é um traço desenhado em sequência.
const ICONES: Record<Icone, string[]> = {
  clareza: [
    "M6 32 C14 19 23 13 32 13 C41 13 50 19 58 32 C50 45 41 51 32 51 C23 51 14 45 6 32 Z",
    "M32 23 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18",
  ],
  direcao: ["M32 6 a26 26 0 1 1 0 52 a26 26 0 1 1 0 -52", "M42 22 L36 36 L22 42 L28 28 Z"],
  risco: ["M32 7 L52 14 V30 C52 43 44 52 32 57 C20 52 12 43 12 30 V14 Z", "M23 32 L30 39 L42 26"],
  resultado: ["M8 48 L24 32 L34 40 L54 18", "M41 18 H54 V31"],
};

const IconeTraco: React.FC<{ icone: Icone; p: number; x: number; y: number; escala: number; cor: string }> = ({
  icone,
  p,
  x,
  y,
  escala,
  cor,
}) => {
  const tracos = ICONES[icone];
  return (
    <g transform={`translate(${x - 32 * escala} ${y - 32 * escala}) scale(${escala})`}>
      {tracos.map((d, i) => (
        <Traco key={d} d={d} p={eio(clamp01(p * tracos.length - i))} largura={3.6 / escala} cor={cor} />
      ))}
    </g>
  );
};

// Geometria (palco 1920×1080; câmera ocupa x ≥ 1176).
const CX = 600;
const XS = [250, 600, 950];
const NY = 380; // centro dos nós
const R = 64;
const LY = 470; // topo dos rótulos
const SAI = 580; // onde as linhas saem
const BARRA = 636; // horizontal que reúne as linhas (conector ortogonal, como organograma)
const JUNTA = 680; // ponto de encontro (fim das linhas, começo da seta)
const CANTO = 14; // raio dos cantos dos conectores
const PY = 830; // centro da pílula do fim
const PW = 520;
const PH = 136;
const RESPIRO = 34; // distância da ponta da seta à pílula
const DY = 988; // linha dos descartes
const TINTA = cores.preto;
const VAZIO = "#CDD0D6";

const anel = (x: number, y: number, r: number) => `M${x} ${y - r} a${r} ${r} 0 1 1 0 ${2 * r} a${r} ${r} 0 1 1 0 ${-2 * r}`;
// desce, corre na horizontal até o centro e desce até o encontro; canto externo levemente arredondado
const linha = (x: number) => {
  if (x === CX) return `M${CX} ${SAI} L${CX} ${JUNTA}`;
  const d = Math.sign(CX - x);
  return (
    `M${x} ${SAI} L${x} ${BARRA - CANTO} Q${x} ${BARRA} ${x + d * CANTO} ${BARRA} ` +
    `L${CX} ${BARRA} L${CX} ${JUNTA}` // encontro em T: canto vivo no centro, escondido pela linha do meio
  );
};
const PONTA_Y = PY - PH / 2 - RESPIRO;
const SETA = `M${CX} ${JUNTA} L${CX} ${PONTA_Y}`;
const PONTA = `M${CX - 14} ${PONTA_Y - 14} L${CX} ${PONTA_Y} L${CX + 14} ${PONTA_Y - 14}`;

export const ListaChecklist: React.FC<ListaChecklistProps> = (p) => {
  const t = useT();
  const cab = eo(seg(t, 0.1, 0.7));
  const est = (i: number) => eo(seg(t, 0.45 + i * 0.07, 0.85 + i * 0.07)); // estrutura entra em cascata
  const estLinhas = eio(seg(t, 0.8, 1.5));
  const estFim = eo(seg(t, 0.95, 1.45));
  const tf = p.fim.t;
  const desce = eio(seg(t, tf - 0.3, tf));
  const enche = eio(seg(t, tf, tf + 0.45));
  const chave = 1 + 0.12 * pulso(seg(t, tf, tf + 0.75));
  const conteudoFim = eo(seg(t, tf + 0.06, tf + 0.4));
  const recua = lerp(1, 0.4, eio(seg(t, tf + 0.9, tf + 1.5)));

  return (
    // saída (§5): a cena encolhe/sobe e esmaece sobre a câmera nos últimos 0,4 s da janela (antes sumia seco)
    <Palco saida={sair(t, p.dur, 0.4, 20, 0.05)}>
      <div className="nd-papel" />
      <div className="nd-papel-pontos" style={{ right: 744 }} />

      {/* nome do framework */}
      <div style={{ position: "absolute", left: CX - 500, width: 1000, top: 108, textAlign: "center", opacity: cab, translate: `0px ${lerp(20, 0, cab)}px` }}>
        <p className="nd-rotulo" style={{ color: cores.mudo, fontSize: 28 }}>{p.rotulo}</p>
        <h2 className="nd-linha" style={{ color: TINTA, fontSize: 60, marginTop: 14 }}>{p.titulo}</h2>
      </div>

      <svg className="nd-arte" viewBox="0 0 1920 1080">
        {/* linhas: trilho vazio + traço de tinta que desce na palavra */}
        {p.meios.map((m, i) => (
          <g key={m.nome} style={{ opacity: recua }}>
            <Traco d={linha(XS[i])} p={estLinhas} largura={3} cor={VAZIO} />
            <Traco d={linha(XS[i])} p={eio(seg(t, m.t + 0.12, m.t + 0.6))} largura={3.5} cor={TINTA} />
          </g>
        ))}
        <Traco d={SETA} p={estLinhas} largura={3} cor={VAZIO} />
        <Traco d={SETA} p={desce} largura={3.5} cor={TINTA} />
        <Traco d={PONTA} p={eio(seg(t, tf - 0.05, tf + 0.15))} largura={3.5} cor={TINTA} />

        {/* nós */}
        {p.meios.map((m, i) => {
          const e = est(i);
          const ativo = seg(t, m.t - 0.08, m.t + 0.32);
          const s = (1 + 0.03 * pulso(seg(t, m.t, m.t + 0.35))) * lerp(0.85, 1, e);
          return (
            <g key={m.nome} style={{ opacity: e * recua, transformOrigin: `${XS[i]}px ${NY}px`, scale: String(s) }}>
              <circle cx={XS[i]} cy={NY} r={R} style={{ fill: cores.puro, stroke: VAZIO, strokeWidth: 3 }} />
              <Traco d={anel(XS[i], NY, R)} p={eio(ativo)} largura={3.5} cor={TINTA} />
              <IconeTraco icone={m.icone} p={seg(t, m.t, m.t + 0.45)} x={XS[i]} y={NY} escala={1.05} cor={TINTA} />
            </g>
          );
        })}
      </svg>

      {/* rótulos dos meios, na palavra (filho entra 60 ms depois do nó) */}
      {p.meios.map((m, i) => {
        const k = eo(seg(t, m.t + 0.06, m.t + 0.46));
        return (
          <p
            key={m.nome}
            style={{
              position: "absolute",
              left: XS[i] - 170,
              width: 340,
              top: LY,
              textAlign: "center",
              whiteSpace: "pre-line",
              color: TINTA,
              fontSize: 38,
              fontWeight: 600,
              lineHeight: 1.12,
              letterSpacing: "-.02em",
              opacity: k * recua,
              translate: `0px ${lerp(16, 0, k)}px`,
            }}
          >
            {m.nome}
          </p>
        );
      })}

      {/* o fim: pílula vazia na estrutura; enche de laranja na palavra (momento-chave) */}
      <div
        style={{
          position: "absolute",
          left: CX - PW / 2,
          top: PY - PH / 2,
          width: PW,
          height: PH,
          borderRadius: PH / 2,
          boxSizing: "border-box",
          border: `3px dashed ${VAZIO}`,
          opacity: estFim,
          scale: String(lerp(0.9, 1, estFim) * chave),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: PH / 2,
            background: cores.sinopia,
            clipPath: `inset(0 ${((1 - enche) * 100).toFixed(2)}% 0 0 round ${PH / 2}px)`,
          }}
        />
        {/* conteúdo: escuro sobre a pílula vazia; a cópia branca acompanha o preenchimento laranja */}
        {[TINTA, cores.puro].map((cor) => (
          <div
            key={cor}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
              color: cor,
              opacity: conteudoFim,
              translate: `0px ${lerp(12, 0, conteudoFim)}px`,
              clipPath: cor === TINTA ? `inset(0 0 0 ${(enche * 100).toFixed(2)}%)` : `inset(0 ${((1 - enche) * 100).toFixed(2)}% 0 0)`,
            }}
          >
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ overflow: "visible" }}>
              <IconeTraco icone={p.fim.icone} p={seg(t, tf + 0.1, tf + 0.55)} x={36} y={36} escala={1.1} cor={cor} />
            </svg>
            <span style={{ fontSize: 60, fontWeight: 600, letterSpacing: "-.03em" }}>{p.fim.nome}</span>
          </div>
        ))}
      </div>

      {/* o que não conta: entra na palavra e é riscado logo depois */}
      {p.descartes.map((d, i) => {
        const k = eo(seg(t, d.t - 0.1, d.t + 0.3));
        const x = CX + (i - (p.descartes.length - 1) / 2) * 300;
        return (
          <div key={d.nome} style={{ position: "absolute", left: x - 140, width: 280, top: DY - 26, height: 52, opacity: k, translate: `0px ${lerp(14, 0, k)}px` }}>
            <p style={{ textAlign: "center", color: cores.mudo, fontSize: 38, fontWeight: 500, lineHeight: "52px", letterSpacing: "-.02em" }}>
              <span style={{ position: "relative", display: "inline-block" }}>
                {d.nome}
                <span
                  style={{
                    position: "absolute",
                    left: -10,
                    right: -10,
                    top: "54%",
                    height: 4.5,
                    borderRadius: 3,
                    background: TINTA,
                    clipPath: `inset(0 ${((1 - eio(seg(t, d.t + 0.35, d.t + 0.7))) * 100).toFixed(2)}% 0 0)`,
                  }}
                />
              </span>
            </p>
          </div>
        );
      })}

      <CameraPainel camera={p.camera} dur={p.dur} />
    </Palco>
  );
};

// Parâmetros da aula 01 (câmera e batidas ancoradas nas palavras faladas; tempos do vídeo editado, t 0 = 551,0 s).
const cam = (inicio: number) => ({ src: "01-meu-primeiro-video/editado.mp4", inicio });
// Exemplo de preenchimento (vídeo de demonstração do criador do sistema). A câmera e as imagens citadas
// não vêm no repositório: use como modelo de parâmetros, não registre no Root sem trocar pelos arquivos do seu vídeo.
export const listaAula01: ListaChecklistProps = {
  camera: cam(542.58),
  dur: 14.2,
  rotulo: "4 coisas",
  titulo: "O que faz a diferença",
  meios: [
    { nome: "Clareza", icone: "clareza", t: 2.09 }, // 544,66
    { nome: "Direção", icone: "direcao", t: 3.61 }, // 546,19
    { nome: "Diminuição\nde riscos", icone: "risco", t: 4.95 },
  ],
  fim: { nome: "Resultado", icone: "resultado", t: 7.26 }, // 549,84
  descartes: [
    { nome: "Sorte", t: 10.32 }, // 552,8
    { nome: "Talento", t: 12.07 }, // 554,55
  ],
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// `lista` · variação "trilha numerada sobre a câmera" (bloco Listas, lote 2 da aula 01).
// Um sistema visual só para: uma lista curta dita em janelas (ex.: "3 coisas que você vai levar"), a lista de fechamento
// de um vídeo (ex.: "3 ideias principais"), o `Capitulo` que abre cada ideia e o `Topico` de raciocínio interno.
// Desenho: card de vidro no terço esquerdo (longe do rosto); número em DM Mono + nome em Instrument Sans 600; linha
// fina sob cada item. Item da vez em branco; os já ditos caem para 42%; os que faltam ficam fantasma ("você está aqui",
// mapa de capítulos do Matt Gray, ref. lista_matt-gray-YIm4R2RAzfQ-02 e titulo_matt-gray-YIm4R2RAzfQ-01).
// Laranja único: o traço fino sob o item da vez — ou, no momento-chave, a palavra/risco que carrega a ideia.
// Cenas (tipo "cena"): a câmera cheia fecha (~120%) e leva o rosto para a direita no frame em que o card entra
// (estilo §6.1 "card lateral"), e volta ao aberto quando ele sai. Destaques (tipo "destaque"): camada transparente.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const BRANCO_LINHA = "rgba(241,241,241,.22)";
const FEITO = 0.42; // item já dito (estilo §5: o resto cai para 40%)
const FANTASMA = 0.24; // item que ainda vem

// Palco transparente equivalente ao <Palco> (mesmas variáveis de marca), para destaques sobre o vídeo.
export const PalcoTransparente: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const escala = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        className="nd-palco"
        style={
          {
            position: "absolute",
            width: 1920,
            height: 1080,
            left: (width - 1920 * escala) / 2,
            top: (height - 1080 * escala) / 2,
            scale: String(escala),
            transformOrigin: "0 0",
            "--ground": cores.preto,
            "--main": cores.sinopia,
            "--second": cores.branco,
            "--accent": cores.puro,
            "--muted": cores.mudo,
            "--line": cores.linha,
            "--raised": cores.superficie,
            "--ok": cores.ok,
            "--sans": fontFamily,
            "--mono": fonteMono,
            "--hand": fonteMao,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Câmera cheia que fecha e desloca o rosto para a direita enquanto o card está na tela (troca seca, 6 quadros).
// Zoom 1,2 (bruto 720p: fechado no máximo ~130%); deslocamento máximo sem borda: (1,2 − 1) × 1920 / 2 = 192 px.
const ZOOM_LADO = 1; // era 1,2: a câmera fechava e deslizava a cada janela e voltava no fim (zoom ia e voltava, 2026-11-13)
const DESLOCA = 190;
const CameraLado: React.FC<{ camera: Camera; dur: number; entra: number; sai: number; zoom?: number }> = ({
  camera,
  dur,
  entra,
  sai,
  zoom = ZOOM_LADO,
}) => {
  const desloca = Math.max(0, Math.min(DESLOCA, (zoom - 1) * 960 - 2)); // sem mostrar a borda
  const t = useT();
  const { fps } = useVideoConfig();
  const p = eio(seg(t, entra, entra + 0.2)) * (1 - eio(seg(t, sai - 0.2, sai)));
  const lento = 0; // sem aproximação lenta (voltava a 100% no fim da cena)
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: cores.preto }}>
      <Video
        src={staticFile(camera.src)}
        trimBefore={Math.round(useInicioCamera(camera) * fps)}
        muted
        objectFit="cover"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          scale: String(lerp(1, zoom, p) + lento),
          translate: `${(desloca * p).toFixed(1)}px 0px`,
        }}
      />
    </div>
  );
};

// Um item da trilha. `t`: segundo em que vira o item da vez (palavra falada).
export type ItemTrilha = {
  num: string;
  nome: string;
  t?: number;
  inicio?: "vazio" | "fantasma" | "feito"; // antes de `t`: vazio = só o número e um trilho (nome ainda não dito)
  laranja?: boolean; // traço laranja sob o item da vez (padrão: sim)
  risco?: number; // risco manuscrito laranja no nome (ex.: "para de adiar")
  chave?: boolean; // momento-chave: entra ~12% maior e assenta
};

export type FechoTrilha = { partes: { txt: string; laranja?: boolean }[]; t: number; chave?: boolean };

type CartaoTrilhaProps = {
  rotulo?: string; // mono, caixa alta
  itens: ItemTrilha[];
  fecho?: FechoTrilha;
  entra: number;
  sai: number;
  top?: number;
  alturaNome?: number; // altura mínima do nome (88 = duas linhas): card do mesmo tamanho em todas as janelas
};

const X_CARD = 96;
const W_CARD = 640;

const LinhaTrilha: React.FC<{
  it: ItemTrilha;
  t: number;
  proximo?: number;
  apaga?: number;
  atraso: number;
  entra: number;
  alturaNome?: number;
}> = ({
  alturaNome = 44,
  it,
  t,
  proximo,
  apaga,
  atraso,
  entra,
}) => {
  const ini = it.inicio ?? "fantasma";
  const base = ini === "feito" ? FEITO : FANTASMA;
  const at = it.t === undefined ? 0 : eo(seg(t, it.t - 0.05, it.t + 0.3));
  const fim = Math.min(proximo ?? Infinity, apaga ?? Infinity);
  const cai = it.t !== undefined && fim < Infinity ? eo(seg(t, fim, fim + 0.35)) : 0;
  const op = lerp(lerp(base, 1, at), FEITO, cai);
  const nomeOp = ini === "vazio" ? at * lerp(1, FEITO, cai) : op;
  const trilho = ini === "vazio" ? 1 - at : 0; // trilho vazio no lugar do nome ainda não dito
  const e = eo(seg(t, entra + 0.12 + atraso, entra + 0.52 + atraso)); // filho entra depois do card
  const pul = it.t === undefined ? 0 : pulso(seg(t, it.t, it.t + (it.chave ? 0.6 : 0.35)));
  const s = 1 + (it.chave ? 0.12 : 0.03) * pul;
  const laranja = it.t !== undefined && it.laranja !== false;
  const traco = laranja ? eio(seg(t, it.t! + 0.1, it.t! + 0.55)) * (1 - cai) : 0;
  const risco = it.risco === undefined ? 0 : eio(seg(t, it.risco, it.risco + 0.4));
  return (
    <div style={{ position: "relative", padding: "22px 0 24px", opacity: e, translate: `${lerp(-14, 0, e).toFixed(1)}px 0px` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 26, transformOrigin: "0% 50%", scale: s.toFixed(4) }}>
        <span className="nd-rotulo" style={{ fontSize: 30, lineHeight: "44px", width: 50, flex: "none", color: cores.branco, opacity: Math.max(op, 0.5) }}>
          {it.num}
        </span>
        <span style={{ position: "relative", flex: 1, minHeight: alturaNome }}>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 19,
              width: 300,
              height: 6,
              borderRadius: 3,
              background: "rgba(241,241,241,.16)",
              opacity: trilho,
            }}
          />
          <span
            style={{
              position: "relative",
              display: "inline-block",
              fontSize: 44,
              fontWeight: 600,
              lineHeight: 1.0,
              textWrap: "balance",
              letterSpacing: "-.02em",
              color: cores.branco,
              opacity: nomeOp,
              translate: `0px ${lerp(10, 0, ini === "vazio" ? at : 1).toFixed(1)}px`,
            }}
          >
            {it.nome}
            {it.risco !== undefined && (
              <span
                style={{
                  position: "absolute",
                  left: -8,
                  right: -8,
                  top: "50%",
                  height: 6,
                  borderRadius: 3,
                  background: cores.sinopia,
                  rotate: "-2.5deg",
                  translate: tremido(t),
                  clipPath: `inset(0 ${((1 - risco) * 100).toFixed(2)}% 0 0)`,
                }}
              />
            )}
          </span>
        </span>
      </div>
      {/* linha fina do item + traço laranja do item da vez */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1.5, background: BRANCO_LINHA }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -0.5,
          height: 2.5,
          background: cores.sinopia,
          clipPath: `inset(0 ${((1 - traco) * 100).toFixed(2)}% 0 0)`,
        }}
      />
    </div>
  );
};

export const CartaoTrilha: React.FC<CartaoTrilhaProps> = ({ rotulo, itens, fecho, entra, sai, top = 250, alturaNome }) => {
  const t = useT();
  const e = eo(seg(t, entra, entra + 0.5)); // card: 500 ms
  const x = eio(seg(t, sai - 0.35, sai)); // saída
  const ativos = itens.map((i) => i.t).filter((v): v is number => v !== undefined);
  const fe = fecho ? eo(seg(t, fecho.t, fecho.t + 0.45)) : 0;
  const fs = fecho ? 1 + (fecho.chave === false ? 0.03 : 0.12) * pulso(seg(t, fecho.t, fecho.t + 0.6)) : 1;
  return (
    <div style={{ position: "absolute", left: X_CARD, top, width: W_CARD, display: "flex", flexDirection: "column", gap: 18, opacity: 1 - x, translate: `${(-16 * x).toFixed(1)}px 0px` }}>
      <div
        className="nd-glass"
        style={{
          position: "relative",
          boxSizing: "border-box",
          padding: "40px 48px 34px",
          opacity: e,
          translate: `${lerp(-28, 0, e).toFixed(1)}px 0px`,
          scale: lerp(0.98, 1, e).toFixed(4),
          transformOrigin: "0% 50%",
        }}
      >
        {rotulo && (
          <p className="nd-rotulo" style={{ fontSize: 28, color: cores.branco, opacity: 0.6, marginBottom: 10 }}>
            {rotulo}
          </p>
        )}
        {itens.map((it, i) => (
          <LinhaTrilha
            key={it.num}
            it={it}
            t={t}
            proximo={it.t === undefined ? undefined : ativos.filter((v) => v > it.t!).sort((a, b) => a - b)[0]}
            apaga={fecho?.t}
            atraso={i * 0.06}
            entra={entra}
            alturaNome={alturaNome}
          />
        ))}
      </div>
      {/* fecho: card próprio logo abaixo (momento-chave entra maior e assenta) */}
      {fecho && (
        <div
          className="nd-glass"
          style={{
            position: "relative",
            boxSizing: "border-box",
            padding: "34px 48px 38px",
            opacity: fe,
            translate: `0px ${lerp(18, 0, fe).toFixed(1)}px`,
            scale: fs.toFixed(4),
            transformOrigin: "0% 0%",
          }}
        >
          <p style={{ fontSize: 56, fontWeight: 600, lineHeight: 0.98, letterSpacing: "-.025em", color: cores.branco, textWrap: "balance" }}>
            {fecho.partes.map((p, i) => (
              <span key={i} style={{ color: p.laranja ? cores.sinopia : undefined, whiteSpace: p.laranja ? "nowrap" : undefined }}>
                {p.txt}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
};

// ── Cena (janela) da trilha: câmera cheia que abre espaço + card. Uma janela = um item da linha do tempo. ──
export type ListaTrilhaProps = {
  camera: Camera;
  dur: number;
  rotulo?: string;
  itens: ItemTrilha[];
  fecho?: FechoTrilha;
  top?: number;
  alturaNome?: number;
  zoom?: number; // fechamento da câmera com o card (padrão 1,2); menor quando o bruto já vem fechado
};

export const ListaTrilha: React.FC<ListaTrilhaProps> = ({ camera, dur, rotulo, itens, fecho, top, alturaNome, zoom }) => (
  <Palco>
    <CameraLado camera={camera} dur={dur} entra={0} sai={dur} zoom={zoom} />
    <CartaoTrilha rotulo={rotulo} itens={itens} fecho={fecho} entra={0} sai={dur} top={top} alturaNome={alturaNome} />
  </Palco>
);

// ── Capitulo: abre uma ideia. Mesmo card da lista de fechamento; o capítulo da vez sai do fantasma na palavra. ──
// Camada transparente (tipo "destaque"). Reutilizável para abrir cada ideia de um fechamento.
export const APRENDIZADOS = ["Primeira ideia", "Segunda ideia", "Terceira ideia"];

export type CapituloProps = {
  dur: number;
  atual: 1 | 2 | 3; // ideia que abre
  t: number; // palavra que abre o capítulo ("segunda ideia")
  rotulo?: string;
  fundoPrevia?: Camera; // só para conferir no Studio/still; na aula fica transparente
};

export const Capitulo: React.FC<CapituloProps> = ({ dur, atual, t, rotulo = "3 ideias", fundoPrevia }) => {
  const itens: ItemTrilha[] = APRENDIZADOS.map((nome, i) => ({
    num: String(i + 1).padStart(2, "0"),
    nome,
    inicio: i + 1 < atual ? "feito" : "fantasma",
    t: i + 1 === atual ? t : undefined,
    chave: i + 1 === atual,
  }));
  return (
    <PalcoTransparente>
      {fundoPrevia && <CameraLado camera={fundoPrevia} dur={dur} entra={dur + 1} sai={dur + 2} />}
      <CartaoTrilha rotulo={rotulo} itens={itens} entra={0} sai={dur} top={330} />
    </PalcoTransparente>
  );
};

// ── Topico: numera um raciocínio interno (número + frase curta), mesmo vidro e linha. Camada transparente. ──
export type TopicoProps = { dur: number; num: string; frase: string; t: number; fundoPrevia?: Camera };

export const Topico: React.FC<TopicoProps> = ({ dur, num, frase, t, fundoPrevia }) => (
  <PalcoTransparente>
    {fundoPrevia && <CameraLado camera={fundoPrevia} dur={dur} entra={dur + 1} sai={dur + 2} />}
    <CartaoTrilha itens={[{ num, nome: frase, t, inicio: "vazio" }]} entra={0} sai={dur} top={420} />
  </PalcoTransparente>
);

// ── ListaVozDoAluno · `lista` variação "voz do aluno" (c-aluno-entendi). ──
// Raciocínio: quando o autor faz a VOZ DO ALUNO (cita o que o aluno pensa ou já entendeu), a tela vai para preto e
// branco enquanto fala o aluno e volta à cor seco no fim da cena (repertório `Balao`). Por cima, no terço esquerdo
// (rosto em x ≥ 700): 1) o que o aluno "entendeu" vira lista que acumula com check (cada item entra na palavra, os
// anteriores ficam mais apagados; nunca três linhas paradas desde o início); 2) a lista sai na `troca` e o cenário
// citado é desenhado em traço no mesmo lugar, um objeto por palavra; 3) na `espera` o desenho apaga e um relógio
// gira cada vez mais rápido, com a palavra à mão (ex.: "esperando…"); 4) a pergunta do aluno entra como mensagem.
// Quando usar: fala em primeira pessoa do aluno com 2–4 coisas que ele já sabe + um cenário concreto de passividade
// (o que ele faz parado) + uma pergunta no fim. Quando não usar: lista do próprio autor (use `ListaTrilha`/
// `ListaChecklist`), cenário abstrato que não dá para desenhar em traço, ou fala sem pergunta/virada no fim.
// Camada transparente: a câmera vem da aula (o 09 não troca plano dentro da cena; exportar TIPO "cena").
// Origem: aula 01, cena "alunoEntendi" (2026-11-13), no lugar da janela "Até aqui" + riscadas + balão.
// Props (tempos em segundos desde o início da cena):
//  - camera, dur: padrão das cenas (camera não é desenhada aqui; serve à linha do tempo).
//  - pb: palavra em que a tela entra em P&B (entra suave; a volta à cor é seca, no fim da cena).
//  - rotulo: rótulo mono acima da lista (ex.: "entendi que").
//  - itens: { texto, t, sobe? } — t: palavra em que o item entra com check; `sobe` troca o check por seta de
//    crescimento que sobe nesse instante (ex.: "alavancar").
//  - troca: palavra em que a lista sai e o desenho começa (a 1ª peça costuma ser o piso, nesse tempo).
//  - pecas: { d, t, dur } — traços do cenário numa caixa 520×460 (x 80–600, y 300–760 do palco), desenhados de t a t+dur.
//  - espera: { t, texto, tTexto } — t: desenho apaga e relógio começa a girar; tTexto: a palavra à mão se escreve.
//  - sai: tempo em que desenho, relógio e sombra saem.
//  - pergunta: { texto, t, rotulo } — mensagem do aluno (Balao modo chat).
export type ItemVozDoAluno = { texto: string; t: number; sobe?: number };
export type PecaVozDoAluno = { d: string; t: number; dur: number };

export type ListaVozDoAlunoProps = {
  camera: Camera;
  dur: number;
  pb: number;
  rotulo: string;
  itens: ItemVozDoAluno[];
  troca: number;
  pecas: PecaVozDoAluno[];
  espera: { t: number; texto: string; tTexto: number };
  sai: number;
  pergunta: { texto: string; t: number; rotulo: string };
};

const SOMBRA_VOZ = "0 2px 18px rgba(0,0,0,.62), 0 1px 3px rgba(0,0,0,.45)";

const VozEntendi: React.FC<{ t: number; rotulo: string; itens: ItemVozDoAluno[]; troca: number }> = ({ t, rotulo, itens, troca }) => {
  const sai = eio(seg(t, troca - 0.3, troca));
  if (sai >= 1) return null;
  const rot = eo(seg(t, itens[0].t - 0.3, itens[0].t));
  return (
    <div style={{ position: "absolute", left: 96, top: 330, width: 560, opacity: 1 - sai, translate: `0px ${(-24 * sai).toFixed(1)}px` }}>
      <p style={{ fontFamily: fonteMono, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: cores.puro, opacity: 0.75 * rot, textShadow: SOMBRA_VOZ, marginBottom: 18 }}>
        {rotulo}
      </p>
      {itens.map((it, i) => {
        const e = eo(seg(t, it.t - 0.02, it.t + 0.3));
        const check = eio(seg(t, it.t + 0.05, it.t + 0.45));
        const prox = itens[i + 1]?.t;
        const recua = prox !== undefined ? eio(seg(t, prox - 0.05, prox + 0.3)) : 0;
        const sobe = it.sobe !== undefined ? eio(seg(t, it.sobe, it.sobe + 0.5)) : 0;
        if (t < it.t - 0.02) return <div key={i} style={{ height: 82 }} />;
        return (
          <div
            key={i}
            style={{
              height: 82,
              display: "flex",
              alignItems: "center",
              gap: 20,
              opacity: e * lerp(1, 0.62, recua),
              translate: `${lerp(-24, 0, e).toFixed(1)}px 0px`,
            }}
          >
            <svg viewBox="0 0 64 64" style={{ width: 54, height: 54, overflow: "visible", flex: "none" }}>
              <circle cx={32} cy={32} r={28} fill="none" stroke={cores.sinopia} strokeWidth={3.6} opacity={0.9} />
              {it.sobe !== undefined ? (
                <Traco d="M20 42 L32 28 L44 34 M36 22 H46 V32" p={check} largura={4} cor={cores.puro} transform={`translate(0 ${(-4 * sobe).toFixed(1)})`} />
              ) : (
                <Traco d="M19 33 L28 42 L46 23" p={check} largura={4.4} cor={cores.puro} />
              )}
            </svg>
            <span style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-0.02em", color: cores.puro, textShadow: SOMBRA_VOZ, whiteSpace: "nowrap" }}>
              {it.texto}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const VozCenario: React.FC<{ t: number; troca: number; pecas: PecaVozDoAluno[]; espera: ListaVozDoAlunoProps["espera"]; saiT: number }> = ({
  t,
  troca,
  pecas,
  espera,
  saiT,
}) => {
  const apaga = eio(seg(t, espera.t, espera.t + 0.4)); // desenho recua quando a espera começa
  const sai = eio(seg(t, saiT, saiT + 0.35));
  const relogio = eo(seg(t, espera.t + 0.1, espera.t + 0.45));
  // ponteiro dá voltas cada vez mais rápido (o tempo passando parado)
  const dt = Math.max(0, t - espera.t);
  const giro = 300 * dt + 260 * dt * dt;
  const esp = eio(seg(t, espera.tTexto, espera.tTexto + 0.5));
  if (t < troca - 0.1 || sai >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 80, top: 300, width: 520, height: 460, opacity: 1 - sai, translate: `0px ${(-24 * sai).toFixed(1)}px` }}>
      <svg viewBox="0 0 520 460" style={{ position: "absolute", inset: 0, width: 520, height: 460, overflow: "visible", opacity: lerp(1, 0.38, apaga) }}>
        {pecas.map((pc, i) => (
          <Traco key={i} d={pc.d} p={eio(seg(t, pc.t - 0.05, pc.t + pc.dur))} largura={3.6} cor={cores.puro} />
        ))}
      </svg>
      {/* relógio acima, à direita */}
      <svg
        viewBox="0 0 100 100"
        style={{ position: "absolute", left: 400, top: 6, width: 104, height: 104, overflow: "visible", opacity: relogio, scale: String(lerp(0.7, 1, relogio)) }}
      >
        <circle cx={50} cy={50} r={44} fill="rgba(12,14,18,.35)" stroke={cores.puro} strokeWidth={3.6} />
        <line x1={50} y1={50} x2={50} y2={24} stroke={cores.puro} strokeWidth={4} strokeLinecap="round" transform={`rotate(${(giro / 12).toFixed(1)} 50 50)`} />
        <line x1={50} y1={50} x2={50} y2={14} stroke={cores.sinopia} strokeWidth={3.4} strokeLinecap="round" transform={`rotate(${giro.toFixed(1)} 50 50)`} />
        <circle cx={50} cy={50} r={4} fill={cores.sinopia} />
      </svg>
      <p
        style={{
          position: "absolute",
          left: 40,
          top: 14,
          fontFamily: fonteMao,
          fontSize: 66,
          color: cores.sinopia,
          rotate: "-4deg",
          whiteSpace: "nowrap",
          clipPath: `inset(-30% ${((1 - esp) * 100).toFixed(1)}% -30% -10%)`,
          transform: `translate(${tremido(t)})`,
        }}
      >
        {espera.texto}
      </p>
    </div>
  );
};

export const ListaVozDoAluno: React.FC<ListaVozDoAlunoProps> = ({ dur, pb: pbT, rotulo, itens, troca, pecas, espera, sai, pergunta }) => {
  const t = useT();
  const pb = eo(seg(t, pbT - 0.1, pbT + 0.2)); // entra suave; a volta à cor é seca (fim da cena)
  return (
    <>
      <Palco saida={{ opacity: 1 }}>
        {/* voz do aluno: a câmera da aula, embaixo, fica em preto e branco */}
        <div style={{ position: "absolute", inset: 0, backdropFilter: `grayscale(${pb.toFixed(3)})`, WebkitBackdropFilter: `grayscale(${pb.toFixed(3)})` }} />
        {/* sombra suave à esquerda: o traço branco lê sobre fundo claro */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: pb * (1 - eio(seg(t, sai, sai + 0.35))),
            background: "radial-gradient(ellipse 640px 560px at 330px 520px, rgba(12,14,18,.5), transparent 72%)",
          }}
        />
        <VozEntendi t={t} rotulo={rotulo} itens={itens} troca={troca} />
        <VozCenario t={t} troca={troca} pecas={pecas} espera={espera} saiT={sai} />
      </Palco>
      <Balao modo="chat" rotulo={pergunta.rotulo} mensagens={[{ texto: pergunta.texto, t: pergunta.t }]} dur={dur} />
    </>
  );
};
