// Peças do formato vertical dividido (reels): headline fixa, palavra-chave no peito, imagem da faixa de cima,
// traço à mão, cartão final. Tudo em pixels de 1080×1920. Curvas só de ../movimento.
import { loadFont as carregarJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { Audio, Video } from "@remotion/media";
import type React from "react";
import { useContext } from "react";
import { TempoCtx } from "./remapa";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp01, eo, eob, lerp, seg } from "../movimento";

// Tempo do item em segundos. Com remapa (ver remapa.ts), devolve o tempo da versão em que o motion foi desenhado.
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tempo = useContext(TempoCtx);
  const t = frame / fps;
  return tempo ? tempo.novoParaVelho(tempo.inicioNovo + t) - tempo.inicioVelho : t;
};

export type Tema = {
  destaque: string; // cor da palavra em destaque
  alerta: string; // cor secundária, rara
  fundo: string;
  texto: string;
  apoio: string;
};

// Helvetica Neue é do sistema (render local no Mac); Plus Jakarta só no cartão final.
export const HN = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const fonteCartao = carregarJakarta("normal", {
  weights: ["400", "700", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

// Geometria do layout dividido (estilo.md §3.1).
export const LAYOUT = {
  largura: 1080,
  altura: 1920,
  cameraTopo: 640, // topo do quadro da câmera
  cameraAltura: 1280,
  fadeCamera: 220, // degradê do topo da câmera (termina antes da cabeça)
  faixaFim: 880, // fim da imagem da faixa de cima (já transparente)
  headlineY: 350,
  peito: 1350, // centro da palavra-chave (abaixo do queixo mesmo no plano fechado; base ≤ 1440)
};

const sombra = "0 2px 22px rgba(0,0,0,.75), 0 1px 4px rgba(0,0,0,.7)";

// Saída padrão: some nos últimos `s` segundos do item.
// Saída padrão (estilo.md §5): ~0,3 s com ease-in; quem usa soma movimento (escala, deslocamento ou desfoque).
export const SAIDA = 0.3;
export const saida = (t: number, dur: number, s = SAIDA) => 1 - Math.pow(seg(t, dur - s, dur), 2);

// ---------------------------------------------------------------------------------------------
// Headline fixa (centralizada, Helvetica Neue Bold, uma palavra no destaque)
// ---------------------------------------------------------------------------------------------
export type Trecho = { texto: string; destaque?: boolean };

export const Headline: React.FC<{ linhas: Trecho[][]; tema: Tema; dur: number }> = ({ linhas, tema, dur }) => {
  const t = useT();
  const fora = eo(seg(t, dur - 0.35, dur));
  return (
    <div
      style={{
        opacity: 1 - fora,
        transform: `translateY(${-24 * fora}px)`,
        position: "absolute",
        top: LAYOUT.headlineY,
        left: 65,
        right: 65,
        textAlign: "center",
        fontFamily: HN,
        fontWeight: 700,
        fontSize: 60,
        lineHeight: 1.12,
        letterSpacing: "-0.01em",
        color: tema.texto,
        textShadow: sombra,
      }}
    >
      {linhas.map((linha, i) => {
        const p = eo(seg(t, 0.05 + i * 0.08, 0.55 + i * 0.08));
        return (
          <div key={i} style={{ opacity: p, transform: `translateY(${lerp(14, 0, p)}px)` }}>
            {linha.map((tr, j) => (
              <span key={j} style={{ color: tr.destaque ? tema.destaque : undefined }}>
                {tr.texto}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Palavra-chave sobre o peito: palavra grande + apoio pequeno colado (estilo.md §8)
// ---------------------------------------------------------------------------------------------
export const Chave: React.FC<{
  grande: string;
  apoio?: string;
  apoioAcima?: string;
  dur: number;
  tema: Tema;
  cor?: string;
  tamanho?: number;
  atrasoApoio?: number;
}> = ({ grande, apoio, apoioAcima, dur, tema, cor, tamanho = 104, atrasoApoio = 0.12 }) => {
  const t = useT();
  const p = eob(seg(t, 0, 0.32), 1.2);
  const pa = eo(seg(t, atrasoApoio, atrasoApoio + 0.35));
  const s = saida(t, dur);
  return (
    <div
      style={{
        transform: `translateY(${-14 * (1 - s)}px) scale(${lerp(0.94, 1, s)})`,
        position: "absolute",
        left: 65,
        right: 65,
        top: LAYOUT.peito - tamanho * 0.75,
        textAlign: "center",
        fontFamily: HN,
        color: tema.texto,
        textShadow: sombra,
        opacity: s,
      }}
    >
      {apoioAcima ? (
        <div style={{ fontSize: 38, fontWeight: 500, opacity: pa, color: tema.apoio, marginBottom: 6 }}>{apoioAcima}</div>
      ) : null}
      <div
        style={{
          fontSize: tamanho,
          fontWeight: 700,
          lineHeight: 0.98,
          letterSpacing: "-0.02em",
          color: cor ?? tema.texto,
          opacity: clamp01(p * 1.4),
          transform: `scale(${lerp(1.12, 1, p)})`,
        }}
      >
        {grande}
      </div>
      {apoio ? (
        <div style={{ fontSize: 38, fontWeight: 500, marginTop: 10, opacity: pa, color: tema.apoio }}>{apoio}</div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Imagem real na faixa de cima (sangra até o topo; o pé some no degradê)
// ---------------------------------------------------------------------------------------------
export const Faixa: React.FC<{ children: React.ReactNode; dur: number; entrada?: number; zoom?: number }> = ({
  children,
  dur,
  entrada = 0.25,
  zoom = 0.06,
}) => {
  const t = useT();
  const p = eo(seg(t, 0, entrada));
  const s = saida(t, dur, 0.28);
  return (
    <AbsoluteFill
      style={{
        height: LAYOUT.faixaFim,
        overflow: "hidden",
        opacity: Math.min(p, s),
        filter: s < 0.999 ? `blur(${(1 - s) * 10}px)` : undefined,
        maskImage: `linear-gradient(to bottom, black 0, black ${LAYOUT.faixaFim - 340}px, transparent ${LAYOUT.faixaFim}px)`,
        WebkitMaskImage: `linear-gradient(to bottom, black 0, black ${LAYOUT.faixaFim - 340}px, transparent ${LAYOUT.faixaFim}px)`,
      }}
    >
      <AbsoluteFill style={{ transform: `scale(${1 + zoom * clamp01(t / Math.max(dur, 0.1))})` }}>{children}</AbsoluteFill>
      {/* escurece o topo para a headline */}
      <AbsoluteFill
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.55) 0, rgba(0,0,0,.6) 300px, rgba(0,0,0,.45) 520px, rgba(0,0,0,0) 720px)" }}
      />
    </AbsoluteFill>
  );
};

// Vídeo de material (16:9) cobrindo uma caixa de `largura`×`altura` (o <Video> não respeita object-fit).
// `x` desloca o enquadramento horizontal (0 = centro, -1 = mostra a esquerda, 1 = a direita).
export const Clipe: React.FC<{ src: string; inicio?: number; largura?: number; altura?: number; x?: number; proporcao?: number }> = ({
  src,
  inicio = 0,
  largura = LAYOUT.largura,
  altura = LAYOUT.faixaFim,
  x = 0,
  proporcao = 16 / 9,
}) => {
  const { fps } = useVideoConfig();
  const h = Math.max(altura, largura / proporcao);
  const w = h * proporcao;
  const sobra = w - largura;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: (altura - h) / 2, left: -sobra / 2 - (x * sobra) / 2, width: w, height: h }}>
        <Video src={staticFile(src)} muted loop trimBefore={Math.round(inicio * fps)} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};

export const Foto: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />
);

// ---------------------------------------------------------------------------------------------
// Traço à mão (risco / sublinhado) que se desenha
// ---------------------------------------------------------------------------------------------
export const Risco: React.FC<{ largura: number; cor: string; p: number; espessura?: number; inclinado?: boolean }> = ({
  largura,
  cor,
  p,
  espessura = 9,
  inclinado = true,
}) => {
  const d = inclinado
    ? `M 4 ${18} C ${largura * 0.3} ${10}, ${largura * 0.6} ${26}, ${largura - 4} ${12}`
    : `M 4 18 C ${largura * 0.35} 14, ${largura * 0.65} 22, ${largura - 4} 16`;
  const comp = largura * 1.1;
  return (
    <svg width={largura} height={36} style={{ position: "absolute", left: 0, top: "50%", marginTop: -18, overflow: "visible" }}>
      <path
        d={d}
        fill="none"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinecap="round"
        strokeDasharray={comp}
        strokeDashoffset={comp * (1 - clamp01(p))}
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------
// Cartão final (botão no padrão do site do autor)
// ---------------------------------------------------------------------------------------------
export const CartaoFinal: React.FC<{ pergunta: string[]; botao: string; rodape: string; tema: Tema }> = ({
  pergunta,
  botao,
  rodape,
  tema,
}) => {
  const t = useT();
  const fundo = eo(seg(t, 0, 0.35));
  const q = eo(seg(t, 0.15, 0.6));
  const b = eob(seg(t, 0.45, 0.85), 1.4);
  const r = eo(seg(t, 0.75, 1.1));
  const brilho = 0.5 + 0.5 * Math.sin(t * 4);
  return (
    <AbsoluteFill style={{ opacity: fundo }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% 52%, ${tema.destaque}33 0%, ${tema.fundo} 65%)`,
          backgroundColor: tema.fundo,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 700,
          left: 65,
          right: 65,
          textAlign: "center",
          fontFamily: fonteCartao,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          color: tema.texto,
          opacity: q,
          transform: `translateY(${lerp(20, 0, q)}px)`,
        }}
      >
        {pergunta.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 930, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: fonteCartao,
            fontWeight: 700,
            fontSize: 40,
            color: "#04130A",
            background: tema.destaque,
            padding: "30px 56px",
            borderRadius: 999,
            boxShadow: `0 0 ${40 + 30 * brilho}px ${tema.destaque}88`,
            opacity: clamp01(b * 1.5),
            transform: `scale(${lerp(0.85, 1, b)})`,
          }}
        >
          {botao} &nbsp;→
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1080,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonteCartao,
          fontWeight: 400,
          fontSize: 34,
          color: tema.apoio,
          opacity: r,
        }}
      >
        {rodape}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// Tag discreta de seguir no Instagram: entra, o dedo toca em "Seguir", vira "Seguindo" (com SFX)
// ---------------------------------------------------------------------------------------------
export const Seguir: React.FC<{ arroba: string; descricao: string; avatar: string; dur: number; y?: number }> = ({
  arroba,
  descricao,
  avatar,
  dur,
  y = 1370,
}) => {
  const t = useT();
  const { fps } = useVideoConfig();
  const TOQUE = 1.1;
  const p = eob(seg(t, 0, 0.4), 1.3);
  const s = saida(t, dur, 0.3);
  const dedo = eo(seg(t, TOQUE - 0.45, TOQUE - 0.05));
  const aperto = seg(t, TOQUE - 0.05, TOQUE + 0.12);
  const escala = 1 - 0.06 * Math.sin(aperto * Math.PI);
  const seguindo = t >= TOQUE + 0.04;
  return (
    <div style={{ position: "absolute", top: y - 50, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(clamp01(p * 1.5), s) }}>
      <Sequence from={0} durationInFrames={Math.round(1 * fps)} layout="none">
        <Audio src={staticFile("biblioteca/audio/sfx_pop-02.wav")} volume={0.35} />
      </Sequence>
      <Sequence from={Math.round((TOQUE - 0.03) * fps)} durationInFrames={Math.round(1 * fps)} layout="none">
        <Audio src={staticFile("biblioteca/audio/sfx_click-02.wav")} volume={0.45} />
      </Sequence>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "14px 16px 14px 14px",
          borderRadius: 999,
          background: "rgba(16,16,16,.78)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,.14)",
          boxShadow: "0 14px 40px rgba(0,0,0,.45)",
          transform: `translateY(${lerp(30, 0, p)}px) scale(${lerp(0.9, 1, p)})`,
          fontFamily: HN,
        }}
      >
        <div style={{ width: 72, height: 72, borderRadius: 999, padding: 3, background: "linear-gradient(45deg,#F9CE34,#EE2A7B,#6228D7)" }}>
          <Img src={staticFile(avatar)} style={{ width: "100%", height: "100%", borderRadius: 999, border: "3px solid #101010", objectFit: "cover" }} />
        </div>
        <div style={{ paddingRight: 6 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            {arroba}
            {/* selo de verificado */}
            <svg width={26} height={26} viewBox="0 0 40 40">
              <path d="M20 2l4.6 3.4 5.7-.2 1.8 5.4 4.6 3.4-1.8 5.4 1.8 5.4-4.6 3.4-1.8 5.4-5.7-.2L20 38l-4.6-3.4-5.7.2-1.8-5.4-4.6-3.4 1.8-5.4-1.8-5.4 4.6-3.4 1.8-5.4 5.7.2z" fill="#0095F6" />
              <path d="M13 20.5l4.6 4.6L27.5 15" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 400, color: "rgba(255,255,255,.65)", marginTop: 2 }}>{descricao}</div>
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            background: seguindo ? "rgba(255,255,255,.16)" : "#0095F6",
            padding: "14px 28px",
            borderRadius: 14,
            transform: `scale(${escala})`,
            minWidth: 150,
            textAlign: "center",
          }}
        >
          {seguindo ? "Seguindo ✓" : "Seguir"}
        </div>
        {/* dedo: círculo de toque que chega no botão */}
        <div
          style={{
            position: "absolute",
            right: 70,
            top: 40,
            width: 54,
            height: 54,
            borderRadius: 999,
            background: "rgba(255,255,255,.85)",
            boxShadow: "0 6px 18px rgba(0,0,0,.35)",
            opacity: dedo * (1 - seg(t, TOQUE + 0.25, TOQUE + 0.5)),
            transform: `translate(${lerp(60, 0, dedo)}px, ${lerp(90, 0, dedo)}px) scale(${1 - 0.15 * Math.sin(aperto * Math.PI)})`,
          }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Cartão final com print do perfil: headline forte, print entra, o link da bio acende e é tocado
// (`link` = caixa do link dentro do print, em px do arquivo; o print é desenhado com `largura`)
// ---------------------------------------------------------------------------------------------
export const CtaPerfil: React.FC<{
  tema: Tema;
  linhas: Trecho[][];
  selo: string;
  print: string;
  printTam: [number, number];
  link: [number, number, number, number];
  chamada: string;
}> = ({ tema, linhas, selo, print, printTam, link, chamada }) => {
  const t = useT();
  const { fps } = useVideoConfig();
  const largura = 960;
  const k = largura / printTam[0];
  const topo = 930;
  const fundo = eo(seg(t, 0, 0.3));
  const pc = eob(seg(t, 0.35, 0.8), 1.2);
  const TOQUE = 1.75;
  const acende = eo(seg(t, 1.0, 1.3));
  const pulsoLink = 0.5 + 0.5 * Math.sin((t - 1.0) * 7);
  const dedo = eo(seg(t, TOQUE - 0.45, TOQUE - 0.05));
  const aperto = Math.sin(seg(t, TOQUE - 0.05, TOQUE + 0.15) * Math.PI);
  const pc2 = eob(seg(t, TOQUE + 0.1, TOQUE + 0.45), 1.4);
  const [lx0, ly0, lx1, ly1] = link.map((v) => v * k);
  const cx = 60 + (lx0 + lx1) / 2;
  const cy = topo + (ly0 + ly1) / 2;
  return (
    <AbsoluteFill style={{ opacity: fundo, backgroundColor: tema.fundo }}>
      <Sequence from={Math.round((TOQUE - 0.03) * fps)} durationInFrames={Math.round(1 * fps)} layout="none">
        <Audio src={staticFile("biblioteca/audio/sfx_click-02.wav")} volume={0.5} />
      </Sequence>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 45% at 50% 55%, ${tema.destaque}26 0%, ${tema.fundo} 70%)` }} />
      {/* selo de urgência (do site do autor) */}
      <div style={{ position: "absolute", top: 500, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: eo(seg(t, 0.05, 0.35)) }}>
        <div style={{ fontFamily: fonteCartao, fontWeight: 700, fontSize: 26, color: tema.alerta, border: `1.5px solid ${tema.alerta}88`, borderRadius: 999, padding: "8px 20px", letterSpacing: "0.04em" }}>
          ● {selo}
        </div>
      </div>
      <div style={{ position: "absolute", top: 570, left: 50, right: 50, textAlign: "center", fontFamily: fonteCartao, fontWeight: 800, letterSpacing: "-0.02em", color: tema.texto }}>
        {linhas.map((linha, i) => {
          const p = eob(seg(t, 0.1 + i * 0.12, 0.5 + i * 0.12), 1.2);
          return (
            <div key={i} style={{ fontSize: i === 0 ? 70 : 92, lineHeight: 1.04, opacity: clamp01(p * 1.4), transform: `translateY(${lerp(24, 0, p)}px) scale(${lerp(1.06, 1, p)})` }}>
              {linha.map((tr, j) => (
                <span key={j} style={{ color: tr.destaque ? tema.destaque : undefined, textShadow: tr.destaque ? `0 0 40px ${tema.destaque}66` : undefined }}>
                  {tr.texto}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      {/* print do perfil */}
      <div
        style={{
          position: "absolute",
          top: topo,
          left: 60,
          width: largura,
          height: printTam[1] * k,
          borderRadius: 28,
          overflow: "hidden",
          border: "1.5px solid rgba(255,255,255,.14)",
          boxShadow: "0 30px 80px rgba(0,0,0,.6)",
          opacity: clamp01(pc * 1.4),
          transform: `translateY(${lerp(60, 0, pc)}px) scale(${lerp(0.92, 1, pc)})`,
        }}
      >
        <Img src={staticFile(print)} style={{ width: "100%", height: "100%" }} />
        <div
          style={{
            position: "absolute",
            left: lx0 - 12,
            top: ly0 - 8,
            width: lx1 - lx0 + 24,
            height: ly1 - ly0 + 16,
            borderRadius: 12,
            border: `3px solid ${tema.destaque}`,
            boxShadow: `0 0 ${18 + 22 * pulsoLink}px ${tema.destaque}`,
            opacity: acende,
            transform: `scale(${1 + 0.04 * aperto})`,
          }}
        />
      </div>
      {/* dedo tocando no link */}
      <div
        style={{
          position: "absolute",
          left: cx - 30,
          top: cy - 30,
          width: 60,
          height: 60,
          borderRadius: 999,
          background: "rgba(255,255,255,.9)",
          boxShadow: "0 8px 20px rgba(0,0,0,.4)",
          opacity: dedo * (1 - seg(t, TOQUE + 0.3, TOQUE + 0.6)),
          transform: `translate(${lerp(90, 0, dedo)}px, ${lerp(160, 0, dedo)}px) scale(${1 - 0.18 * aperto})`,
        }}
      />
      <div style={{ position: "absolute", top: topo + printTam[1] * k + 34, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: fonteCartao,
            fontWeight: 800,
            fontSize: 40,
            color: "#04130A",
            background: tema.destaque,
            padding: "22px 44px",
            borderRadius: 999,
            boxShadow: `0 0 40px ${tema.destaque}88`,
            opacity: clamp01(pc2 * 1.5),
            transform: `scale(${lerp(0.85, 1, pc2)})`,
          }}
        >
          ↑ {chamada}
        </div>
      </div>
    </AbsoluteFill>
  );
};
