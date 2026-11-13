// Etapa 7 (câmera) e etapa 8 (som) da /video-editar: aplicam as seções "enquadramento" (09) e "sfx" (10)
// que o 08 grava no aula.json. Toda decisão de tempo vem do Python; aqui só se desenha.
import { Audio } from "@remotion/media";
import type React from "react";
import { Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp01, eio, seg } from "./movimento";

export type Plano = {
  inicio: number;
  fim: number;
  plano: "aberto" | "medio" | "fechado";
  escala: number;
  ancorar?: boolean; // durante destaque: o rosto não anda para o centro
  rampa?: number; // aproximação lenta no último segundo (prepara a cena seguinte)
  entrada?: "foco"; // volta de cena: desfoque que resolve em ~0,3 s
  fx?: number; // posição do rosto travada para o plano inteiro (mediana do 09); sem ela, interpola o rastreio
  fy?: number;
};

export type DadosCamera = {
  amostras: number;
  rosto: [number, number, number, number][]; // [t, x, y, altura], frações do quadro
  planos: Plano[];
};

export type DadosSfx = {
  eventos: { t: number; arquivo: string; volume: number; evento: string }[];
};

// Quanto o rosto anda em direção ao centro do quadro quando a câmera fecha (0 = fica onde está).
const CENTRALIZAR = 0.5;

const acharPlano = (planos: Plano[], t: number) => {
  let a = 0;
  let b = planos.length - 1;
  while (a <= b) {
    const m = (a + b) >> 1;
    if (t < planos[m].inicio) b = m - 1;
    else if (t >= planos[m].fim) a = m + 1;
    else return planos[m];
  }
  return null;
};

export const Camera: React.FC<{ dados?: DadosCamera; children: React.ReactNode }> = ({ dados, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!dados) return <>{children}</>;
  const t = frame / fps;
  const plano = acharPlano(dados.planos, t);
  if (!plano) return <>{children}</>;

  let s = plano.escala;
  if (plano.rampa) s *= 1 + plano.rampa * eio(seg(t, plano.fim - 1, plano.fim));
  // posição travada por plano (sem tremer); render antigo sem fx/fy: interpola entre amostras em vez de saltar
  let fx: number;
  let fy: number;
  if (plano.fx !== undefined && plano.fy !== undefined) {
    fx = plano.fx;
    fy = plano.fy;
  } else {
    const u = Math.min(dados.rosto.length - 1, Math.max(0, t * dados.amostras));
    const a = dados.rosto[Math.floor(u)];
    const b = dados.rosto[Math.min(dados.rosto.length - 1, Math.floor(u) + 1)];
    const f = u - Math.floor(u);
    fx = a[1] + (b[1] - a[1]) * f;
    fy = a[2] + (b[2] - a[2]) * f;
  }
  const k = plano.ancorar ? 0 : CENTRALIZAR;
  // posição na tela = s·x + deslocamento; o deslocamento fica em [1 − s, 0] para nunca mostrar borda
  const desloc = (f: number) => Math.min(0, Math.max(1 - s, f + k * (0.5 - f) - s * f));
  const desfoque = plano.entrada === "foco" ? 8 * (1 - clamp01((t - plano.inicio) / 0.3)) : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "0 0",
        transform: `translate(${desloc(fx) * 100}%, ${desloc(fy) * 100}%) scale(${s})`,
        filter: desfoque > 0.05 ? `blur(${desfoque}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

export const Sons: React.FC<{ dados?: DadosSfx }> = ({ dados }) => {
  const { fps } = useVideoConfig();
  if (!dados) return null;
  return (
    <>
      {dados.eventos.map((e, n) => (
        <Sequence key={n} name={`sfx ${e.evento}`} from={Math.round(e.t * fps)} durationInFrames={Math.round(3 * fps)} layout="none">
          <Audio src={staticFile(`biblioteca/audio/${e.arquivo}`)} volume={e.volume} />
        </Sequence>
      ))}
    </>
  );
};
