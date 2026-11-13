// `fecho` · variação "batida" (FechoBatida): a frase de maior impacto que fecha o vídeo.
// Raciocínio: o fecho precisa criar movimento e ficar visualmente mais forte que o resto (autor, aula 01). A frase vem
// em batida, palavra a palavra, no terço livre (esquerdo); o que é negado é riscado à mão; quando a fala vira para a
// conclusão, a imagem escurece em volta do rosto (o fecho ganha peso) e a palavra final entra grande na cor de
// destaque, com um pequeno tranco no impacto (o único som do fecho é declarado pela cena: SONS, tipo "impacto").
// Quando usar: a última frase do vídeo, a de maior impacto, com estrutura "abertura · não X · e sim Y" (negação + final).
// Quando não usar: no meio do vídeo (gasta o peso do fecho), em frase sem contraste/negação, ou em frase longa que não
// cabe em três linhas grandes. Câmera aberta (TIPO "cena"): o texto grande fica longe do rosto.
// Origem: cena de fecho da aula 01 (2026-11-13), estilo.md §10 (linha `fecho`).
//
// Props:
// - camera, dur: padrão das cenas (dur em segundos).
// - abertura: primeira linha, grande e branca ("Exemplo de fecho").
// - antesNegada: texto da linha média antes da palavra riscada ("não é sobre").
// - negada: palavra riscada à mão ("sorte").
// - final: palavra/frase final, grande na cor de destaque ("é sobre método.").
// - batidas: segundos desde o início da cena — abertura (entra a 1ª linha), negacao (entra a linha média),
//   risco (começa o risco), escurece (imagem escurece em volta do rosto), final (entra a final, impacto).
// - rosto: centro do escurecimento no palco 1920×1080 (padrão 1000×470, rosto em câmera aberta).
import React from "react";
import { Palco, Traco, useT, type Camera } from "./comum";
import { cores } from "../marca";
import { eio, eo, lerp, seg, tremido } from "../movimento";

export type FechoBatidaProps = {
  camera: Camera;
  dur: number;
  abertura: string;
  antesNegada: string;
  negada: string;
  final: string;
  batidas: { abertura: number; negacao: number; risco: number; escurece: number; final: number };
  rosto?: { x: number; y: number };
};

const SOMBRA = "0 2px 22px rgba(0,0,0,.7), 0 1px 3px rgba(0,0,0,.5)";

export const FechoBatida: React.FC<FechoBatidaProps> = ({ dur, abertura, antesNegada, negada, final, batidas: B, rosto = { x: 1000, y: 470 } }) => {
  const t = useT();
  const sai = eio(seg(t, dur - 0.3, dur));
  const n = eo(seg(t, B.abertura - 0.04, B.abertura + 0.22));
  const a = eo(seg(t, B.negacao - 0.04, B.negacao + 0.3));
  const rs = eio(seg(t, B.risco, B.risco + 0.35));
  const esc = eio(seg(t, B.escurece - 0.1, B.escurece + 0.35));
  const si = eo(seg(t, B.final - 0.04, B.final + 0.2));
  // pequeno tranco no impacto
  const tranco = Math.sin(Math.min(1, Math.max(0, (t - B.final) / 0.25)) * Math.PI) * 6;
  return (
    <Palco saida={{ opacity: 1 - sai }}>
      {/* escurece em volta do rosto: o fecho ganha peso */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: lerp(0.55, 1, esc) * eo(seg(t, 0, 0.3)),
          background: `radial-gradient(ellipse 520px 600px at ${rosto.x}px ${rosto.y}px, transparent 40%, rgba(8,9,12,${lerp(0.25, 0.62, esc).toFixed(2)}) 100%)`,
        }}
      />
      <div style={{ position: "absolute", left: 96, top: 250, translate: `0px ${tranco.toFixed(1)}px` }}>
        <p
          style={{
            fontSize: 118,
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: cores.puro,
            textShadow: SOMBRA,
            opacity: n,
            scale: String(lerp(1.3, 1, n)),
            transformOrigin: "0 80%",
          }}
        >
          {abertura}
        </p>
        <p style={{ marginTop: 26, fontSize: 50, fontWeight: 500, letterSpacing: "-0.02em", color: cores.puro, textShadow: SOMBRA, opacity: a * lerp(1, 0.55, esc), translate: `${lerp(-20, 0, a).toFixed(1)}px 0px` }}>
          {antesNegada}{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            {negada}
            <svg viewBox="0 0 300 40" preserveAspectRatio="none" style={{ position: "absolute", left: -10, top: "38%", width: "calc(100% + 20px)", height: 36, overflow: "visible", translate: tremido(t).replace(",", "") }}>
              <Traco d="M4 26 C70 16 150 30 296 10" p={rs} largura={7} />
            </svg>
          </span>
        </p>
        <p
          style={{
            marginTop: 22,
            fontSize: 124,
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-0.045em",
            color: cores.sinopia,
            textShadow: SOMBRA,
            opacity: si,
            scale: String(lerp(1.45, 1, si)),
            transformOrigin: "0 80%",
            whiteSpace: "nowrap",
          }}
        >
          {final}
        </p>
      </div>
    </Palco>
  );
};
