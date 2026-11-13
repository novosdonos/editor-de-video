import type React from "react";
import type { Tema, Trecho } from "./kit";

// Item da linha do tempo do reels. `inicio` e `dur` em segundos do editado.mp4.
// zona "topo": faixa de cima (atrás da câmera). zona "frente": por cima de tudo (palavra-chave, anotações).
export type ItemReel = {
  id: string;
  zona: "topo" | "frente";
  inicio: number;
  dur: number;
  render: () => React.ReactNode;
  // como a câmera (09) e os sons (10) tratam o item; padrão: frente = "destaque", topo = "nenhum"
  camera?: "cena" | "destaque" | "nenhum";
};

export type DefReel = {
  tema: Tema;
  headline: Trecho[][];
  headlineFim: number; // a headline só abre o vídeo e some quando a dinâmica começa
  itens: ItemReel[];
  final: { dur: number; render: () => React.ReactNode };
  trilha?: (fimFala: number) => React.ReactNode; // fimFala = duração do editado (onde começa o cartão final)
  // trechos do editado em que o bruto tem inserção do vídeo original (cartela): congela a câmera num frame
  congelar?: { inicio: number; fim: number; src: string; zoom?: number }[]; // zoom: aproximação durante o congelamento
};

// Um corte por pasta em public/ (videos/<nn>a-<slug>); cada corte exporta o seu DefReel de src/reels/<arquivo>.tsx.
export const reels: Record<string, DefReel> = {};
