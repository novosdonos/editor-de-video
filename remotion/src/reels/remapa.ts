// Remapeamento de tempo: o motion foi desenhado sobre uma versão do editado.mp4 ("velho") e o editado mudou
// (ex.: 06 refeito com outra velocidade/pausas) sem mudar as palavras. public/<corte>/remapa.json guarda pares
// [tempo velho, tempo novo] por palavra; o Reels posiciona cada item no tempo novo e o useT do kit devolve o
// tempo velho, então toda batida interna continua presa à mesma palavra. Sem remapa.json, nada muda.
import { createContext } from "react";

export type Pares = [number, number][];

export const mapear = (pares: Pares | undefined, t: number, de: 0 | 1, para: 0 | 1) => {
  if (!pares || pares.length < 2) return t;
  let a = 0;
  let b = pares.length - 1;
  if (t <= pares[0][de]) return pares[0][para] + (t - pares[0][de]);
  if (t >= pares[b][de]) return pares[b][para] + (t - pares[b][de]);
  while (b - a > 1) {
    const m = (a + b) >> 1;
    if (pares[m][de] <= t) a = m;
    else b = m;
  }
  const [x0, x1] = [pares[a][de], pares[b][de]];
  const [y0, y1] = [pares[a][para], pares[b][para]];
  return x1 === x0 ? y0 : y0 + ((y1 - y0) * (t - x0)) / (x1 - x0);
};

export type Tempo = {
  novoParaVelho: (t: number) => number;
  inicioNovo: number;
  inicioVelho: number;
  velhoParaNovo?: (t: number) => number; // aula: o vídeo da câmera dentro da cena toca no tempo novo
};
export const TempoCtx = createContext<Tempo | null>(null);
