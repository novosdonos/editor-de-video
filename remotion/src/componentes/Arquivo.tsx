// `arquivo` · variação "feed" (material real em caixas): câmera cheia; um leque compacto de 1→3 cartões pequenos e finos
// com post/reel real de pessoas públicas no terço esquerdo (x≈120–620), chips finos de @ e seguidores colados abaixo,
// a palavra que traduz o pensamento no peito (rótulo pequeno + palavra grande em sinopia) e, opcionalmente, uma conversa
// de mensagem parada com etiqueta no mesmo bloco.
// Raciocínio: fala que cita pessoas reais ou um grupo ("influenciadores") pede a imagem real delas, reconhecível de relance
// (estilo.md §11–13); o material entra uma vez só, na palavra, e sai quando a fala dele termina; nada encosta no rosto.
// Quando usar: a fala aponta para gente/conteúdo real (posts, reels, perfis) e o autor está em câmera cheia, com um terço
// livre à esquerda. Quando não usar: conceito abstrato (vira animação), banco de imagem genérico ou thumbnail, rosto do
// autor no terço esquerdo (o bloco é fixo em x≈120–620, y≈200–600), mais de 3 cartões ou 4 perfis.
// Origem: cena c06c-influenciadores da aula 01 (2026-11-12, v4), aprovada (estilo.md §10).
// Desenhada em 1920×1080; batidas em segundos desde o início da cena.
//
// Props:
//   camera, dur — trecho do editado.mp4 e duração da cena.
//   leque — cartões [centro, esquerda, direita] (1 a 3); `a` = entrada (o central; os laterais abrem +0,15/+0,22 a partir
//           dele), `ate` = saída. Os chips de perfil entram e saem junto com o leque, em cascata.
//   perfis — até 4 chips (avatar recortado do print do perfil + @ + seguidores).
//   conversa — opcional: contato, mensagem e etiqueta; `a` entrada, `etiqueta` estouro da etiqueta, `ate` saída.
//   peito — palavras no peito, cada uma com rótulo, palavra, `aRot` (rótulo), `aPal` (palavra) e `ate` (saída).
import React from "react";
import { Video } from "@remotion/media";
import { Freeze, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraCheia, Palco, useT, type Camera } from "./comum";
import { cores } from "../marca";
import { clamp01, eio, eo, eob, lerp, seg } from "../movimento";

const VERMELHO = "#FF3B30"; // selo de notificação (ref. Matt Gray 99UKPcsiKF4); fora disso, só o laranja da marca

// Material real. `arquivo` = caminho em public/ (ex.: "<slug>/arquivo_x.png").
// `corte` = retângulo [x, y, w, h] da fonte que deve preencher o cartão (tira ícone de usuário, seta de carrossel,
// cursor e texto legal dos prints/vídeos). `quadros` = duração do vídeo (toca uma vez e congela no fim, sem loop).
export type FonteArquivo = { arquivo: string; w: number; h: number; video?: boolean; quadros?: number; corte: [number, number, number, number] };
// Avatar recortado do print do perfil: `w` largura do print; centro (cx, cy) e raio `r` do círculo da foto, em px da fonte.
export type PerfilArquivo = { handle: string; seguidores: string; arquivo: string; w: number; cx: number; cy: number; r: number };
export type ConversaArquivo = {
  iniciais: string;
  nome: string;
  visto: string; // linha abaixo do nome
  mensagem: string; // última mensagem enviada (sem resposta)
  hora: string; // carimbo da mensagem
  textoEtiqueta: string; // etiqueta laranja (mono, caixa alta)
  a: number;
  etiqueta: number;
  ate: number;
};
export type PeitoArquivo = { rotulo: string; palavra: string; aRot: number; aPal: number; ate: number };

export type ArquivoFeedProps = {
  camera: Camera;
  dur: number;
  leque: { cartoes: FonteArquivo[]; a: number; ate: number };
  perfis: PerfilArquivo[];
  conversa?: ConversaArquivo;
  peito: PeitoArquivo[];
};

// ---------- material real ----------
// Imagem/vídeo recortado para preencher W×H (cover sobre o retângulo `corte`).
const Recorte: React.FC<{ f: FonteArquivo; W: number; H: number; inicio: number }> = ({ f, W, H, inicio }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const [cx, cy, cw, ch] = f.corte;
  const s = Math.max(W / cw, H / ch);
  const style: React.CSSProperties = {
    position: "absolute",
    width: f.w * s,
    height: f.h * s,
    left: -cx * s + (W - cw * s) / 2,
    top: -cy * s + (H - ch * s) / 2,
    maxWidth: "none",
  };
  if (!f.video) return <Img src={staticFile(f.arquivo)} style={style} />;
  const de = Math.round(inicio * fps);
  const ultimo = (f.quadros ?? 90) - 2; // penúltimo quadro: o último às vezes não decodifica
  return (
    <Sequence from={de} layout="none">
      <Freeze frame={ultimo} active={frame - de >= ultimo}>
        <Video src={staticFile(f.arquivo)} muted objectFit="fill" style={style} />
      </Freeze>
    </Sequence>
  );
};

const Avatar: React.FC<{ p: PerfilArquivo; d: number }> = ({ p, d }) => {
  const s = d / (2 * p.r);
  return (
    <div style={{ width: d, height: d, borderRadius: "50%", overflow: "hidden", position: "relative", flex: "none", boxShadow: `0 0 0 2px ${cores.branco}` }}>
      <Img src={staticFile(p.arquivo)} style={{ position: "absolute", width: p.w * s, maxWidth: "none", left: d / 2 - p.cx * s, top: d / 2 - p.cy * s }} />
    </div>
  );
};

// ---------- tempo ----------
// Cartão que nasce de `de` (ponto de origem, em geral o cartão central), viaja até o lugar e assenta; sai em `ate`.
const viagem = (t: number, a: number, ate: number, de: [number, number] | null, fora: [number, number]) => {
  const pin = seg(t, a, a + 0.55);
  const k = eob(pin, 1.1);
  const pout = eio(seg(t, ate - 0.35, ate));
  return {
    on: t >= a && t < ate,
    op: clamp01(pin * 3) * (1 - pout),
    dx: (de ? de[0] * (1 - k) : 0) + fora[0] * pout,
    dy: (de ? de[1] * (1 - k) : lerp(30, 0, k)) + fora[1] * pout,
    sc: lerp(0.72, 1, k) - 0.06 * pout,
  };
};
// Selo/elemento pequeno que estoura na palavra.
const estoura = (t: number, a: number) => {
  const p = seg(t, a, a + 0.3);
  return { opacity: clamp01(p * 4), scale: String(eob(p, 2.2)) };
};
const surge = (t: number, a: number, dy = 18, dur = 0.45) => {
  const p = eo(seg(t, a, a + dur));
  return { opacity: p, translate: `0px ${lerp(dy, 0, p).toFixed(1)}px` };
};
// Flutuação leve para nada ficar congelado (±3 px).
const flutua = (t: number, i: number) => Math.sin(t * 1.25 + i * 1.7) * 3;

// ---------- peças ----------
const Selo: React.FC<{ t: number; a: number; ate?: number; style?: React.CSSProperties }> = ({ t, a, ate = 99, style }) => (
  <div
    style={{
      position: "absolute",
      padding: "3px 8px 4px",
      borderRadius: 999,
      background: VERMELHO,
      color: cores.puro,
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.1,
      boxShadow: "0 4px 10px rgba(0,0,0,.35)",
      ...estoura(t, a),
      ...(t > ate - 0.25 ? { opacity: 1 - eio(seg(t, ate - 0.25, ate)) } : {}),
      ...style,
    }}
  >
    +999
  </div>
);

type Slot = { x: number; y: number; rot: number };
const W = 140;
const H = 175;

const Cartao: React.FC<{
  t: number;
  i: number;
  slot: Slot;
  f: FonteArquivo;
  a: number;
  ate: number;
  de: [number, number] | null;
  fora: [number, number];
  selo?: number;
  seloAte?: number;
  seloEsq?: boolean;
  chave?: number;
}> = ({ t, i, slot, f, a, ate, de, fora, selo, seloAte, seloEsq, chave }) => {
  const v = viagem(t, a, ate, de, fora);
  if (!v.on) return null;
  const pc = chave === undefined ? 1 : 1 + 0.07 * Math.sin(Math.PI * seg(t, chave, chave + 0.5));
  return (
    <div
      style={{
        position: "absolute",
        left: slot.x - W / 2,
        top: slot.y - H / 2,
        width: W,
        height: H,
        opacity: v.op,
        translate: `${v.dx.toFixed(1)}px ${(v.dy + flutua(t, i)).toFixed(1)}px`,
        rotate: `${slot.rot.toFixed(2)}deg`,
        scale: String(v.sc * pc),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          overflow: "hidden",
          background: cores.superficie,
          border: `2px solid ${cores.branco}`,
          boxShadow: "0 16px 32px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.25)",
        }}
      >
        <Recorte f={f} W={W - 4} H={H - 4} inicio={a} />
      </div>
      {selo !== undefined && <Selo t={t} a={selo} ate={seloAte} style={seloEsq ? { left: -10, top: -9 } : { right: -10, top: -9 }} />}
    </div>
  );
};

// Chip de perfil recriado (avatar do print + @ + seguidores), pequeno, chapado (sem vidro), colado ao bloco.
const Chip: React.FC<{ t: number; i: number; x: number; y: number; p: PerfilArquivo; a: number; ate: number; selo?: number; seloAte?: number }> = ({
  t,
  i,
  x,
  y,
  p,
  a,
  ate,
  selo,
  seloAte,
}) => {
  const v = viagem(t, a, ate, [-60, 0], [-40, 0]);
  if (!v.on) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: `${v.dx.toFixed(1)}px calc(-50% + ${(v.dy + flutua(t, i) * 0.5).toFixed(1)}px)`,
        scale: String(v.sc),
        transformOrigin: "left center",
        opacity: v.op,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "5px 14px 5px 5px",
        borderRadius: 999,
        background: cores.superficie,
        border: `1px solid color-mix(in srgb, ${cores.branco} 20%, transparent)`,
        boxShadow: "0 10px 24px rgba(0,0,0,.40)",
        whiteSpace: "nowrap",
      }}
    >
      <Avatar p={p} d={30} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, lineHeight: 1 }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: cores.puro }}>@{p.handle}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: cores.branco, opacity: 0.7 }}>{p.seguidores}</span>
      </div>
      {selo !== undefined && <Selo t={t} a={selo} ate={seloAte} style={{ left: -8, top: -11 }} />}
    </div>
  );
};

// Palavra no peito: rótulo pequeno + palavra grande na cor de destaque (abaixo do queixo).
const Peito: React.FC<{ t: number; rotulo: string; palavra: string; aRot: number; aPal: number; ate: number }> = ({ t, rotulo, palavra, aRot, aPal, ate }) => {
  if (t < aRot || t >= ate) return null;
  const pout = eio(seg(t, ate - 0.3, ate));
  const pk = eo(seg(t, aPal, aPal + 0.5));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 802, // zona segura do player (plataformas.md): base da palavra em y ≈ 935
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity: 1 - pout,
        translate: `0px ${(-10 * pout).toFixed(1)}px`,
        textShadow: "0 4px 24px rgba(0,0,0,.55)",
      }}
    >
      <div className="nd-rotulo" style={{ fontSize: 24, color: cores.puro, ...surge(t, aRot, 12, 0.4) }}>
        {rotulo}
      </div>
      <div
        style={{
          fontSize: 104,
          fontWeight: 600,
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          color: cores.sinopia,
          opacity: clamp01(pk * 2),
          scale: String(lerp(1.12, 1, pk)),
        }}
      >
        {palavra}
      </div>
    </div>
  );
};

// Conversa parada (interface de mensagem desenhada, dados fictícios), no mesmo bloco dos cartões.
const Conversa: React.FC<{ t: number; x: number; y: number; c: ConversaArquivo }> = ({ t, x, y, c }) => {
  const { a, etiqueta: tag, ate } = c;
  if (t < a || t >= ate) return null;
  const pin = eob(seg(t, a, a + 0.55), 1.1);
  const pout = eio(seg(t, ate - 0.35, ate));
  const CW = 400;
  return (
    <div
      style={{
        position: "absolute",
        left: x - CW / 2,
        top: y,
        width: CW,
        borderRadius: 22,
        background: cores.branco,
        color: cores.preto,
        padding: "14px 16px 16px",
        boxShadow: "0 18px 40px rgba(0,0,0,.45)",
        opacity: clamp01(seg(t, a, a + 0.2)) * (1 - pout),
        translate: `${(-30 * pout).toFixed(1)}px ${lerp(24, 0, pin).toFixed(1)}px`,
        scale: String(lerp(0.9, 1, pin)),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#C9CDD4", color: cores.puro, display: "grid", placeItems: "center", fontSize: 17, fontWeight: 600 }}>{c.iniciais}</div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{c.nome}</div>
          <div style={{ fontSize: 14, color: cores.mudo, marginTop: 2 }}>{c.visto}</div>
        </div>
      </div>
      <div style={{ height: 1, background: cores.linha, margin: "12px -16px 12px" }} />
      <div style={{ display: "flex", justifyContent: "flex-end", ...surge(t, a + 0.15, 10, 0.4) }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 9, padding: "9px 13px 9px 14px", borderRadius: "15px 15px 5px 15px", background: "#DCF5DE" }}>
          <span style={{ fontSize: 19 }}>{c.mensagem}</span>
          <span style={{ fontSize: 12, color: cores.mudo, whiteSpace: "nowrap", paddingBottom: 2 }}>{c.hora}</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: -16,
          padding: "6px 12px 7px",
          borderRadius: 999,
          background: cores.sinopia,
          color: cores.puro,
          fontFamily: "var(--mono)",
          fontSize: 14,
          letterSpacing: ".1em",
          boxShadow: "0 6px 14px rgba(0,0,0,.30)",
          transformOrigin: "left center",
          ...estoura(t, tag),
        }}
      >
        {c.textoEtiqueta}
      </div>
    </div>
  );
};

// ---------- cena ----------
// Bloco compacto no terço esquerdo (x≈120–620), longe do rosto (x≈700–1260, topo da cabeça y≈180–225).
const BX = 370;
const BY = 300;
const CHIP_X = 168; // chips alinhados à esquerda, logo abaixo do leque
const CHIP_Y = [436, 480, 524, 568];
// cascata do leque [centro, esquerda, direita] e dos chips: atraso de entrada e de saída (s) em relação ao leque
const LEQUE_IN = [0, 0.15, 0.22];
const LEQUE_OUT = [0, 0.04, 0.08];
const CHIP_IN = [0.25, 0.31, 0.37, 0.43];
const CHIP_OUT = [0.1, 0.12, 0.14, 0.16];
const rel = (s: Slot): [number, number] => [BX - s.x, BY - s.y];

export const ArquivoFeed: React.FC<ArquivoFeedProps> = ({ camera, dur, leque, perfis, conversa, peito }) => {
  const t = useT();
  const slot = (dx: number, dy: number, rot: number, k = 1): Slot => ({ x: BX + dx * k, y: BY + dy * k, rot: rot * k });
  const S = [slot(0, 0, 0), slot(-92, 14, -8), slot(92, 14, 8)];
  // laterais primeiro, central por cima
  const ordem = [1, 2, 0].filter((i) => i < leque.cartoes.length);
  return (
    <Palco>
      <CameraCheia camera={camera} dur={dur} />

      {/* leque: entra uma vez só, na palavra; abre de 1 para 3 a partir do central */}
      {ordem.map((i) => (
        <Cartao
          key={i}
          t={t}
          i={i}
          slot={S[i]}
          f={leque.cartoes[i]}
          a={i === 0 ? leque.a : leque.a + LEQUE_IN[i]}
          ate={i === 0 ? leque.ate : leque.ate + LEQUE_OUT[i]}
          de={i === 0 ? null : rel(S[i])}
          fora={[-60, -10]}
        />
      ))}

      {/* quem são: @ e seguidores colados ao leque */}
      {perfis.slice(0, 4).map((p, i) => (
        <Chip key={p.handle} t={t} i={9 + i} x={CHIP_X} y={CHIP_Y[i]} p={p} a={leque.a + CHIP_IN[i]} ate={leque.ate + CHIP_OUT[i]} />
      ))}

      {conversa && <Conversa t={t} x={BX} y={BY - 95} c={conversa} />}

      {/* palavra no peito */}
      {peito.map((w) => (
        <Peito key={w.palavra} t={t} rotulo={w.rotulo} palavra={w.palavra} aRot={w.aRot} aPal={w.aPal} ate={w.ate} />
      ))}
    </Palco>
  );
};
