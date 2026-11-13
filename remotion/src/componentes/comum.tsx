// Peças comuns do catálogo: palco 1920×1080, câmera (cheia e painel), cursor, traço manuscrito.
import "./base.css";
import { Video } from "@remotion/media";
import { useContext } from "react";
import { TempoCtx } from "../reels/remapa";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { autor, cores, fontFamily, fonteMao, fonteMono } from "../marca";
import { clamp01, eio, lerp, seg } from "../movimento";

// Tempo da cena em segundos. Com remapa (editado refeito depois do motion; ver reels/remapa.ts), devolve o tempo
// da versão em que a cena foi desenhada: toda batida continua presa à mesma palavra.
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tempo = useContext(TempoCtx);
  const t = frame / fps;
  return tempo ? tempo.novoParaVelho(tempo.inicioNovo + t) - tempo.inicioVelho : t;
};

// Segundo do editado.mp4 atual em que o trecho da câmera da cena começa (com remapa, o tempo novo).
export const useInicioCamera = (camera?: Camera) => {
  const tempo = useContext(TempoCtx);
  if (!camera) return 0;
  // o mapeamento pode cair alguns frames antes de 0 numa cena do começo (trimBefore não aceita negativo)
  return Math.max(0, tempo?.velhoParaNovo ? tempo.velhoParaNovo(camera.inicio) : camera.inicio);
};

// Trecho do vídeo do autor que aparece na cena (sem áudio: o áudio vem da composição da aula).
export type Camera = { src: string; inicio: number };

// Saída da cena inteira (valores de `sair` em movimento.ts): a cena esmaece sobre o vídeo da aula e o conteúdo
// sobe/encolhe. Sem `y`/`scale` só esmaece (cenas de câmera cheia: a câmera não deve encolher).
export type SaidaPalco = { opacity: number; y?: number; scale?: number };

// Todas as cenas são desenhadas em 1920×1080 e escaladas para o tamanho da composição.
export const Palco: React.FC<{ children: React.ReactNode; saida?: SaidaPalco }> = ({ children, saida }) => {
  const { width, height } = useVideoConfig();
  const escala = Math.min(width / 1920, height / 1080);
  const move = saida && (saida.y || (saida.scale !== undefined && saida.scale !== 1));
  return (
    // com saída, o fundo do palco é transparente: o que encolhe revela o vídeo da aula (destino), não preto
    <AbsoluteFill style={{ backgroundColor: saida ? "transparent" : cores.preto, overflow: "hidden", opacity: saida?.opacity }}>
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
        {/* sempre o mesmo wrapper (não remonta os vídeos quando a saída começa) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            translate: move ? `0px ${(saida?.y ?? 0).toFixed(1)}px` : undefined,
            scale: move ? String(saida?.scale ?? 1) : undefined,
            transformOrigin: "50% 50%",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const VideoCamera: React.FC<{ camera: Camera; escala: number }> = ({ camera, escala }) => {
  const { fps } = useVideoConfig();
  return (
    <Video
      src={staticFile(camera.src)}
      trimBefore={Math.round(useInicioCamera(camera) * fps)}
      muted
      objectFit="cover"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", scale: String(escala) }}
    />
  );
};

// Layout `cheia`: câmera em tela cheia parada e degradê no pé. Sem aproximação lenta: no fim da cena a câmera
// da aula volta a 100% e o zoom "ia e voltava" (autor, 2026-11-13).
export const CameraCheia: React.FC<{ camera: Camera; dur: number }> = ({ camera }) => {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <VideoCamera camera={camera} escala={1} />
      <div className="nd-camfade" />
    </div>
  );
};

// Layout `reduzida`: câmera num painel à direita (~40%), motion à esquerda.
export const CameraPainel: React.FC<{ camera: Camera; dur: number; rotulo?: string }> = ({
  camera,
  dur,
  rotulo = autor.rotulo,
}) => {
  const t = useT();
  const p = eio(seg(t, 0, 0.7));
  return (
    <div
      className="nd-campainel"
      style={{ scale: String(lerp(1.06, 1, p)), opacity: seg(t, 0, 0.35) }}
    >
      <VideoCamera camera={camera} escala={1.02 + 0.015 * clamp01(t / dur)} />
      <div className="nd-camfade" style={{ height: "34%" }} />
      <div className="nd-camtag">{rotulo}</div>
    </div>
  );
};

// Traço manuscrito desenhado de 0 a 1 (seta, risco, sublinhado, check).
export const Traco: React.FC<{
  d: string;
  p: number;
  largura?: number;
  cor?: string;
  transform?: string;
}> = ({ d, p, largura = 10, cor = "var(--main)", transform }) => (
  <path
    d={d}
    pathLength={1}
    transform={transform}
    style={{
      fill: "none",
      stroke: cor,
      strokeWidth: largura,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeDasharray: "1 1",
      strokeDashoffset: (1 - p).toFixed(4),
    }}
  />
);

// Cursor que anda em arco entre chaves [t, x, y] e comprime no clique.
export const Cursor: React.FC<{
  t: number;
  chaves: [number, number, number][];
  cliques?: number[];
  visivel: boolean;
}> = ({ t, chaves, cliques = [], visivel }) => {
  let x = chaves[0][1];
  let y = chaves[0][2];
  for (let i = 1; i < chaves.length; i++) {
    const [t0, x0, y0] = chaves[i - 1];
    const [t1, x1, y1] = chaves[i];
    if (t >= t0) {
      const p = eio(seg(t, t0, t1));
      x = lerp(x0, x1, p);
      y = lerp(y0, y1, p) - Math.sin(p * Math.PI) * 30;
    }
  }
  let s = 1;
  for (const c of cliques) {
    const q = seg(t, c, c + 0.22);
    if (q > 0 && q < 1) s = 1 - 0.18 * Math.sin(q * Math.PI);
  }
  return (
    <svg
      className="nd-cursor"
      viewBox="0 0 44 52"
      style={{ translate: `${(x - 4).toFixed(1)}px ${(y - 3).toFixed(1)}px`, scale: String(s), opacity: visivel ? 1 : 0 }}
    >
      <path
        d="M4 3 L4 41 L14 32 L21 48 L28 45 L21 29 L35 29 Z"
        style={{ fill: "var(--accent)", stroke: "var(--ground)", strokeWidth: 3, strokeLinejoin: "round" }}
      />
    </svg>
  );
};

// Anel que se espalha a partir do clique.
export const Ripple: React.FC<{ t: number; clique: number; x: number; y: number; tamanho?: number }> = ({
  t,
  clique,
  x,
  y,
  tamanho = 90,
}) => {
  const q = seg(t, clique, clique + 0.5);
  return (
    <div
      className="nd-ripple"
      style={{
        width: tamanho,
        height: tamanho,
        left: x,
        top: y,
        opacity: q > 0 && q < 1 ? (1 - q) * 0.8 : 0,
        transform: `translate(-50%,-50%) scale(${0.3 + q * 1.4})`,
      }}
    />
  );
};
