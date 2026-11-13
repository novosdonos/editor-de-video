import type { Caption } from "@remotion/captions";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontFamily } from "../marca";

// Divide as palavras em blocos pelo "pageBreakAfter" que o 08 grava (mesmas regras do 11).
const paginar = (legendas: Caption[]): Caption[][] => {
  const paginas: Caption[][] = [];
  let atual: Caption[] = [];
  for (const legenda of legendas) {
    atual.push(legenda);
    if (legenda.pageBreakAfter) {
      paginas.push(atual);
      atual = [];
    }
  }
  if (atual.length) paginas.push(atual);
  return paginas;
};

const FOLGA_MS = 300; // bloco fica na tela depois da última palavra

export const LegendaAnimada: React.FC<{ legendas: Caption[] }> = ({ legendas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const paginas = useMemo(() => paginar(legendas), [legendas]);
  const agoraMs = (frame / fps) * 1000;

  const pagina = paginas.find((p, i) => {
    const proxima = paginas[i + 1]?.[0].startMs ?? Infinity;
    return agoraMs >= p[0].startMs && agoraMs < Math.min(p[p.length - 1].endMs + FOLGA_MS, proxima);
  });
  if (!pagina) return null;

  return (
    <div
      className="absolute inset-x-0 flex justify-center px-16"
      style={{ bottom: "9%" }}
    >
      <div
        className="rounded-xl px-6 py-3 text-center"
        style={{
          fontFamily,
          fontWeight: 600,
          fontSize: 44,
          lineHeight: 1.15,
          color: cores.branco,
          backgroundColor: `${cores.preto}CC`,
          whiteSpace: "pre",
        }}
      >
        {pagina.map((palavra) => {
          const falando = agoraMs >= palavra.startMs && agoraMs < palavra.endMs;
          return (
            <span
              key={palavra.startMs}
              style={{ color: falando ? cores.sinopia : cores.branco }}
            >
              {palavra.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
