// `comparacao` (cenas de contraste da aula 01), em janelas curtas para a câmera ficar visível ~70% (estilo.md §6.1).
// Cena 6 "Antes × hoje": foto real de arquivo (cheia) → pessoas próximas com profissão e relação (cheia) →
// feed do Instagram + story × conversa parada (reduzida ~40%) → três palavras em sequência (cheia).
// Cena 13 "Opção tradicional × opção nova": meta + opção 1 | opção 2 dos dois lados do rosto (cheia) →
// o que a opção nova entrega, uma tela por vez (reduzida longa, câmera ~28%) → promessa (cheia, momento-chave).
// Regras: um laranja por tela, texto ≥ 28 px (texto decorativo de interface pode ser menor), vidro escuro sobre a câmera,
// vidro claro / telas brancas sobre o papel, curvas só de movimento.ts. Interfaces de terceiros com dados fictícios.
import { Video } from "@remotion/media";
import { Img, staticFile, useVideoConfig } from "remotion";
import { clamp01, eio, eo, eob, lerp, seg, tremido } from "../movimento";
import { autor } from "../marca";
import { CameraCheia, CameraPainel, Palco, Traco, useT, type Camera } from "./comum";

const broll = (n: string) => staticFile(`biblioteca/b-roll/${n}`);
const arq = (n: string) => staticFile(`biblioteca/interfaces/${n}`);

// ---------- tempo ----------
// Bloco que entra subindo e sai no fim.
const bloco = (t: number, a: number, b: number, dy = 24): React.CSSProperties => {
  const pin = eo(seg(t, a, a + 0.55));
  const pout = eio(seg(t, b - 0.3, b));
  return {
    opacity: pin * (1 - pout),
    translate: `0px ${(lerp(dy, 0, pin) - 12 * pout).toFixed(1)}px`,
    scale: String(lerp(0.97, 1, pin)),
  };
};
// Filho que aparece na palavra.
const surge = (t: number, a: number, dy = 16, dur = 0.45): React.CSSProperties => {
  const p = eo(seg(t, a, a + dur));
  return { opacity: p, translate: `0px ${lerp(dy, 0, p).toFixed(1)}px` };
};
// Momento-chave: entra 15% maior e assenta.
const chave = (t: number, a: number): React.CSSProperties => {
  const p = eo(seg(t, a, a + 0.5));
  return { opacity: clamp01(p * 3), scale: String(lerp(1.15, 1, p)) };
};
// Vidro que cresce com o conteúdo (clip-path): altura visível passa por cada [tempo, altura].
const cresce = (t: number, h0: number, passos: [number, number][], total: number): React.CSSProperties => {
  let h = h0;
  passos.forEach(([a, alvo]) => (h = lerp(h, alvo, eio(seg(t, a - 0.1, a + 0.35)))));
  return { clipPath: `inset(0px 0px ${Math.max(0, total - h).toFixed(1)}px 0px round 32px)` };
};
// Foco: o que sai de foco cai para `baixo`.
const apaga = (t: number, a: number, baixo = 0.4) => lerp(1, baixo, eio(seg(t, a, a + 0.4)));
// Tela principal (reduzida): entra subindo, sai cedendo.
const janela = (t: number, a: number, b: number) => {
  const pin = a <= 0 ? 1 : eo(seg(t, a - 0.1, a + 0.5));
  const pout = eio(seg(t, b - 0.25, b + 0.15));
  return {
    on: t >= a - 0.1 && t < b + 0.15,
    style: {
      opacity: pin * (1 - pout),
      translate: `0px ${(lerp(28, 0, pin) - 18 * pout).toFixed(1)}px`,
      scale: String(lerp(0.975, 1, pin) - 0.012 * pout),
    } as React.CSSProperties,
  };
};
const pop = (k: number, dist = 16): React.CSSProperties => ({
  opacity: clamp01(k * 1.6),
  translate: `0px ${lerp(dist, 0, k).toFixed(1)}px`,
  scale: String(lerp(0.94, 1, k)),
});

// ---------- peças ----------
const Icone: React.FC<{ d: string; tam?: number; cor?: string; largura?: number }> = ({ d, tam = 40, cor = "currentColor", largura = 2.2 }) => (
  <svg width={tam} height={tam} viewBox="0 0 32 32" style={{ display: "block", flex: "none" }}>
    <path d={d} style={{ fill: "none", stroke: cor, strokeWidth: largura, strokeLinecap: "round", strokeLinejoin: "round" }} />
  </svg>
);
const IC = {
  balanca: "M16 5 V27 M10 27 H22 M6 9 H26 M6 9 L3 17 Q6 20.5 9 17 Z M26 9 L23 17 Q26 20.5 29 17 Z",
  calculadora: "M8 4 H24 V28 H8 Z M11.5 8 H20.5 V12.5 H11.5 Z M12 17.5 H12.1 M16 17.5 H16.1 M20 17.5 H20.1 M12 21.5 H12.1 M16 21.5 H16.1 M20 21.5 H20.1 M12 25 H12.1 M16 25 H16.1 M20 25 H20.1",
  dente: "M10.5 4.5 C6.5 4.5 4.5 7.5 4.5 11 C4.5 15 6.5 17 7.5 22 C8.5 27 9.5 28.5 11 28.5 C13 28.5 13.2 23 16 23 C18.8 23 19 28.5 21 28.5 C22.5 28.5 23.5 27 24.5 22 C25.5 17 27.5 15 27.5 11 C27.5 7.5 25.5 4.5 21.5 4.5 C19 4.5 18 6.2 16 6.2 C14 6.2 13 4.5 10.5 4.5 Z",
  documento: "M8 3 H19 L25 9 V29 H8 Z M19 3 V9 H25 M12 16 H21 M12 20.5 H21 M12 25 H17",
  grupo: "M11 5 a4.5 4.5 0 1 1 -0.01 0 Z M3 27 C3 21.5 6.5 18.5 11 18.5 C15.5 18.5 19 21.5 19 27 M21.5 5.5 a4 4 0 0 1 0 8.5 M23.5 18.8 C27 19.5 29 22.5 29 27",
  play: "M4 6 H28 V26 H4 Z M13 11 L21 16 L13 21 Z",
  escudo: "M16 3 L27 7 V15 C27 22 22 27 16 29 C10 27 5 22 5 15 V7 Z M11 16 L14.5 19.5 L21 12.5",
  check: "M5 16.5 L12.5 24 L27 8.5",
  calendario: "M5 8 H27 V27 H5 Z M5 13 H27 M11 4 V9 M21 4 V9",
  coracao: "M16 27 C 6 20, 3 15, 3 10.5 C 3 6.5, 6 4, 9.5 4 C 12.5 4, 14.6 5.8, 16 8 C 17.4 5.8, 19.5 4, 22.5 4 C 26 4, 29 6.5, 29 10.5 C 29 15, 26 20, 16 27 Z",
  aviao: "M28 4 L3 13 L13 17 L17 28 Z M13 17 L28 4",
  casa: "M5 14 L16 5 L27 14 V27 H19 V19 H13 V27 H5 Z",
  lupa: "M14 5 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18 M20.5 20.5 L27 27",
  mais: "M5 5 H27 V27 H5 Z M16 10 V22 M10 16 H22",
  reels: "M5 5 H27 V27 H5 Z M5 11 H27 M11 5 L15 11 M19 5 L23 11 M13.5 15.5 L20 19 L13.5 22.5 Z",
  mic: "M16 4 a4.5 4.5 0 0 1 4.5 4.5 v6 a4.5 4.5 0 0 1 -9 0 v-6 a4.5 4.5 0 0 1 4.5 -4.5 Z M8 15 a8 8 0 0 0 16 0 M16 23 v5",
  seta: "M12 7 L21 16 L12 25",
};

const Monograma: React.FC<{ tam: number; txt: string; fundo: string; cor?: string }> = ({ tam, txt, fundo, cor = "#FFFFFF" }) => (
  <div style={{ width: tam, height: tam, flex: "none", borderRadius: "50%", background: fundo, color: cor, display: "grid", placeItems: "center", fontWeight: 600, fontSize: tam * (txt.length > 1 ? 0.36 : 0.46), letterSpacing: "-0.02em" }}>{txt}</div>
);

// Linha manuscrita (traço que se desenha com tremido), em SVG com as coordenadas do pai.
const Mao: React.FC<{ w: number; h: number; t: number; children: React.ReactNode }> = ({ w, h, t, children }) => (
  <svg viewBox={`0 0 ${w} ${h}`} className="nd-arte" style={{ translate: tremido(t) }}>
    {children}
  </svg>
);
// Círculo à mão em volta de (cx, cy), com ponta que passa do início.
const circuloMao = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx * 0.15} ${cy - ry} C${cx + rx * 0.9} ${cy - ry * 1.06}, ${cx + rx * 1.06} ${cy + ry * 0.92}, ${cx} ${cy + ry} ` +
  `C${cx - rx * 1.08} ${cy + ry * 0.96}, ${cx - rx * 1.02} ${cy - ry * 0.9}, ${cx + rx * 0.3} ${cy - ry * 1.1}`;

const Rotulo: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p className="nd-rotulo" style={{ fontSize: 28, opacity: 0.7, whiteSpace: "nowrap", ...style }}>{children}</p>
);

const SOMBRA_TELA = "0 30px 70px rgba(25,28,35,.16), 0 2px 8px rgba(25,28,35,.08)";
const VIDRO_CLARO: React.CSSProperties = {
  background: "rgba(255,255,255,.86)",
  backdropFilter: "blur(24px) saturate(1.5)",
  border: "1px solid rgba(255,255,255,.95)",
  boxShadow: "0 18px 44px rgba(25,28,35,.16), 0 2px 6px rgba(25,28,35,.06)",
  borderRadius: 28,
  color: "#191C23",
};
const WA = { verde: "#00A884", fundo: "#EFEAE2", saida: "#D9FDD3", lido: "#53BDEB", cinza: "#667781", texto: "#111B21", barra: "#F0F2F5" };

// ======================================================================================================
// Cena 6a · foto de arquivo (cheia): foto real de uma página impressa; aproxima num ponto da foto
// e o circula na palavra-chave.
// ======================================================================================================
export type ListaAmarelaProps = {
  camera: Camera;
  dur: number;
  foto: string;
  alvo: { x: number; y: number }; // centro do anúncio na foto (0–1)
  entra: number; // palavra que traz a foto
  aproxima: number; // palavra que aproxima no alvo
  circula: number; // palavra-chave (círculo à mão)
  sai: number;
};

export const ComparacaoListaAmarela: React.FC<ListaAmarelaProps> = (p) => {
  const t = useT();
  const W = 520;
  const H = 693;
  const e = eob(seg(t, p.entra, p.entra + 0.65), 1.2);
  const s = eio(seg(t, p.sai, p.sai + 0.35));
  const z = eio(seg(t, p.aproxima, p.aproxima + 1.4));
  const deriva = 0.03 * clamp01((t - p.entra) / Math.max(1, p.dur - p.entra));
  const c = eo(seg(t, p.circula, p.circula + 0.6));
  const cx = p.alvo.x * W;
  const cy = p.alvo.y * H;
  return (
    <Palco>
      <CameraCheia camera={p.camera} dur={p.dur} />
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 150,
          width: W,
          height: H,
          borderRadius: 28,
          overflow: "hidden",
          background: "#EDE6D6",
          border: "1.5px solid rgba(255,255,255,.22)",
          boxShadow: "0 34px 70px rgba(0,0,0,.45), 0 2px 8px rgba(0,0,0,.25)",
          opacity: clamp01(e * 1.6) * (1 - s),
          translate: `0px ${(lerp(34, 0, e) - 16 * s).toFixed(1)}px`,
          scale: String(lerp(0.95, 1, e)),
        }}
      >
        <Img
          src={p.foto}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            scale: String(lerp(1, 2, z) + deriva),
            transformOrigin: `${(p.alvo.x * 100).toFixed(1)}% ${(p.alvo.y * 100).toFixed(1)}%`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 90px rgba(40,30,10,.28)" }} />
        <Mao w={W} h={H} t={t}>
          <Traco d={circuloMao(cx, cy, 152, 150)} p={c} largura={8} />
        </Mao>
      </div>
    </Palco>
  );
};

// ======================================================================================================
// Cena 6b · pessoas próximas (cheia): profissão na palavra, relação em seguida.
// ======================================================================================================
export type VizinhosProps = {
  camera: Camera;
  dur: number;
  linhas: { profissao: string; relacao: string; icone: keyof typeof IC; t: number; tRel: number }[];
  sai: number;
};

export const ComparacaoVizinhos: React.FC<VizinhosProps> = (p) => {
  const t = useT();
  return (
    <Palco>
      <CameraCheia camera={p.camera} dur={p.dur} />
      {p.linhas.map((l, i) => {
        const r = eo(seg(t, l.tRel, l.tRel + 0.45));
        return (
          <div
            key={l.profissao}
            className="nd-glass"
            style={{
              left: 88,
              top: 268 + i * 156,
              width: 540,
              height: 128,
              borderRadius: 30,
              boxSizing: "border-box",
              padding: "0 30px 0 26px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              ...bloco(t, l.t - 0.1, p.sai + i * 0.06),
            }}
          >
            <div style={{ width: 76, height: 76, flex: "none", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.32)", display: "grid", placeItems: "center" }}>
              <Icone d={IC[l.icone]} tam={40} />
            </div>
            <div style={{ lineHeight: 1.12, translate: `0px ${lerp(19, 0, r).toFixed(1)}px` }}>
              <p style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>{l.profissao}</p>
              <p style={{ fontSize: 31, fontWeight: 500, opacity: 0.74 * r, whiteSpace: "nowrap", marginTop: 4 }}>{l.relacao}</p>
            </div>
          </div>
        );
      })}
    </Palco>
  );
};

// ======================================================================================================
// Cena 6c · hoje (reduzida ~40%): feed do Instagram cheio de produtos e serviços rolando na fala; volta ao topo e
// abre o story de um perfil; ao lado, uma conversa parada há meses (laranja só no grifo da data).
// ======================================================================================================
type Post = { handle: string; cor: string; img?: string; video?: string; cta: string };
export type FeedProps = {
  camera: Camera;
  dur: number;
  posts: Post[];
  rolagens: number[]; // cada palavra rola um post
  topo: number; // volta ao topo
  story: number; // toca no story
  influencer: { handle: string; video: string; retrato: string; ha: string };
  outros: { retrato?: string; img?: string; nome: string }[]; // demais stories
  parente: { t: number; nome: string; iniciais: string; msg: string; data: string; grifo: number };
};

const TELA = { x: 250, y: 56, w: 544, h: 968 };
const POST_H = 740;
const FEED_Y = 270;
const IG_GRAD = "linear-gradient(45deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5)";

const PostIG: React.FC<{ post: Post }> = ({ post }) => (
  <div style={{ position: "relative", width: TELA.w, height: POST_H, background: "#FFFFFF" }}>
    <div style={{ height: 72, display: "flex", alignItems: "center", gap: 14, padding: "0 18px" }}>
      <Monograma tam={42} txt={post.handle[0].toUpperCase()} fundo={post.cor} />
      <div style={{ lineHeight: 1.15 }}>
        <p style={{ fontSize: 24, fontWeight: 600, color: "#111111" }}>{post.handle}</p>
        <p style={{ fontSize: 19, color: "#737373" }}>Patrocinado</p>
      </div>
    </div>
    <div style={{ position: "relative", width: TELA.w, height: 544, overflow: "hidden", background: "#DDD" }}>
      {post.video ? (
        <Video src={broll(post.video)} muted loop objectFit="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      ) : (
        <Img src={arq(post.img!)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
    </div>
    <div style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", borderBottom: "1px solid #EFEFEF", color: "#0095F6", fontSize: 24, fontWeight: 600 }}>
      {post.cta}
      <Icone d={IC.seta} tam={26} cor="#0095F6" largura={2.6} />
    </div>
    <div style={{ height: 62, display: "flex", alignItems: "center", gap: 20, padding: "0 18px" }}>
      <Icone d={IC.coracao} tam={32} cor="#111111" />
      <Icone d={IC.aviao} tam={32} cor="#111111" />
    </div>
  </div>
);

export const ComparacaoFeed: React.FC<FeedProps> = (p) => {
  const t = useT();
  const tela = bloco(t, 0.15, p.dur + 1, 30);

  // Rolagem: cada palavra avança um post; "topo" volta ao começo.
  let rola = 0;
  p.rolagens.forEach((r) => (rola += POST_H * eio(seg(t, r - 0.1, r + 0.4))));
  rola *= 1 - eio(seg(t, p.topo, p.topo + 0.6));

  // Story abre a partir do avatar.
  const st = eio(seg(t, p.story, p.story + 0.5));
  const toque = seg(t, p.story - 0.25, p.story + 0.1);
  const barra = seg(t, p.story, p.story + 6); // progresso do story (linear: barra de progresso)

  // Conversa parada.
  const wa = eob(seg(t, p.parente.t, p.parente.t + 0.5), 1.3);
  const grifo = eo(seg(t, p.parente.grifo, p.parente.grifo + 0.5));

  const stories = [{ src: broll(p.influencer.retrato), nome: p.influencer.handle }, ...p.outros.map((o) => ({ src: o.retrato ? broll(o.retrato) : arq(o.img ?? ""), nome: o.nome }))];

  return (
    <Palco>
      <div className="nd-fundo">
        <div className="nd-papel" />
        <div className="nd-papel-pontos" />

        {/* Tela do celular, sem moldura de aparelho */}
        <div style={{ position: "absolute", left: TELA.x, top: TELA.y, width: TELA.w, height: TELA.h, borderRadius: 44, overflow: "hidden", background: "#FFFFFF", boxShadow: SOMBRA_TELA, ...tela }}>
          {/* Feed rolando por baixo do cabeçalho */}
          <div style={{ position: "absolute", left: 0, top: FEED_Y, translate: `0px ${(-rola).toFixed(1)}px` }}>
            {p.posts.map((post, i) => (
              <PostIG key={i} post={post} />
            ))}
          </div>
          {/* Cabeçalho + stories (rolam junto com o feed) */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: FEED_Y, background: "#FFFFFF", translate: `0px ${(-Math.min(rola, FEED_Y + 40)).toFixed(1)}px`, borderBottom: "1px solid #EFEFEF" }}>
            <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 30px", fontSize: 20, fontWeight: 600, color: "#111111" }}>9:41</div>
            <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px" }}>
              <Img src={arq("logo_instagram.svg")} style={{ width: 38, height: 38 }} />
              <div style={{ display: "flex", gap: 22 }}>
                <Icone d={IC.coracao} tam={32} cor="#111111" />
                <Icone d={IC.aviao} tam={32} cor="#111111" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 18, padding: "6px 18px 0" }}>
              {stories.map((s, i) => (
                <div key={i} style={{ width: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "none", scale: i === 0 ? String(1 - 0.06 * Math.sin(toque * Math.PI)) : "1" }}>
                  <div style={{ width: 100, height: 100, borderRadius: "50%", background: IG_GRAD, display: "grid", placeItems: "center" }}>
                    <div style={{ width: 92, height: 92, borderRadius: "50%", background: "#FFFFFF", display: "grid", placeItems: "center" }}>
                      <Img src={s.src} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 17, color: "#262626", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 100, textAlign: "center" }}>{s.nome}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Barra inferior */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 84, background: "#FFFFFF", borderTop: "1px solid #EFEFEF", display: "flex", alignItems: "center", justifyContent: "space-around", paddingBottom: 10 }}>
            {[IC.casa, IC.lupa, IC.mais, IC.reels].map((d, i) => (
              <Icone key={i} d={d} tam={34} cor="#111111" />
            ))}
          </div>

          {/* Story do influenciador */}
          {st > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#000000",
                opacity: clamp01(st * 2),
                scale: String(lerp(0.2, 1, st)),
                transformOrigin: "68px 210px",
                borderRadius: lerp(200, 0, st),
                overflow: "hidden",
              }}
            >
              <Video src={broll(p.influencer.video)} muted loop objectFit="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectPosition: "44% 50%" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(rgba(0,0,0,.45), transparent)" }} />
              <div style={{ position: "absolute", left: 14, right: 14, top: 54, display: "flex", gap: 5 }}>
                {[0, 1, 2, 3].map((k) => (
                  <div key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,.38)", overflow: "hidden" }}>
                    <div style={{ width: "100%", height: "100%", background: "#FFFFFF", scale: `${k === 0 ? 1 : k === 1 ? barra.toFixed(3) : 0} 1`, transformOrigin: "0 50%" }} />
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", left: 18, top: 74, display: "flex", alignItems: "center", gap: 14, color: "#FFFFFF" }}>
                <Img src={broll(p.influencer.retrato)} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.8)" }} />
                <p style={{ fontSize: 26, fontWeight: 600 }}>{p.influencer.handle}</p>
                <p style={{ fontSize: 26, opacity: 0.75 }}>{p.influencer.ha}</p>
              </div>
              <div style={{ position: "absolute", left: 18, right: 18, bottom: 30, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ flex: 1, height: 62, borderRadius: 31, border: "1.5px solid rgba(255,255,255,.7)", display: "flex", alignItems: "center", padding: "0 24px", fontSize: 22, color: "#FFFFFF" }}>Enviar mensagem</div>
                <Icone d={IC.coracao} tam={34} cor="#FFFFFF" />
                <Icone d={IC.aviao} tam={34} cor="#FFFFFF" />
              </div>
            </div>
          )}
        </div>

        {/* Conversa com o tio, parada há meses (vidro claro sobre o papel) */}
        {wa > 0 && (
          <div style={{ position: "absolute", left: 690, top: 420, width: 420, ...VIDRO_CLARO, padding: "22px 26px 26px", boxSizing: "border-box", opacity: clamp01(wa * 1.6), translate: `0px ${lerp(18, 0, wa).toFixed(1)}px`, scale: String(lerp(0.94, 1, wa)) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <Img src={arq("logo_whatsapp.svg")} style={{ width: 34, height: 34 }} />
              <p style={{ fontSize: 28, fontWeight: 600 }}>Conversas</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Monograma tam={76} txt={p.parente.iniciais} fundo="#A3ACB9" />
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 30, fontWeight: 600, whiteSpace: "nowrap" }}>{p.parente.nome}</p>
                  <div style={{ position: "relative" }}>
                    <p className="nd-num" style={{ fontSize: 28, fontWeight: 500, color: WA.cinza }}>{p.parente.data}</p>
                    <svg viewBox="0 0 90 24" style={{ position: "absolute", left: -8, top: 34, width: 90, height: 24, overflow: "visible", translate: tremido(t) }}>
                      <Traco d="M3 12 C 28 7, 58 15, 86 9" p={grifo} largura={6} />
                    </svg>
                  </div>
                </div>
                <p style={{ fontSize: 26, color: WA.cinza, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 4 }}>{p.parente.msg}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <CameraPainel camera={p.camera} dur={p.dur} />
    </Palco>
  );
};

// ======================================================================================================
// Cena 6d · três palavras em sequência (cheia, momento-chave): anos (riscado) → semanas → dias (laranja).
// ======================================================================================================
export type ConfiancaProps = {
  camera: Camera;
  dur: number;
  rotulo: number; // rótulo da cena
  anos: number; // "anos"
  risca: number; // palavra que risca a primeira
  semanas: number; // "semanas"
  dias: number; // "dias" (momento-chave)
};

export const ComparacaoConfianca: React.FC<ConfiancaProps> = (p) => {
  const t = useT();
  const risco = eo(seg(t, p.risca, p.risca + 0.45));
  const palavra: React.CSSProperties = { fontSize: 112, fontWeight: 600, letterSpacing: "-.035em", lineHeight: 1, whiteSpace: "nowrap" };
  return (
    <Palco>
      <CameraCheia camera={p.camera} dur={p.dur} />
      <div
        className="nd-glass"
        style={{
          left: 88,
          top: 196,
          width: 560,
          height: 640,
          ...bloco(t, p.rotulo - 0.1, p.dur + 1),
          // o vidro cresce com as palavras (sem área vazia esperando a fala)
          clipPath: `inset(0px 0px ${(640 - lerp(lerp(lerp(150, 296, eio(seg(t, p.anos - 0.1, p.anos + 0.35))), 446, eio(seg(t, p.semanas - 0.1, p.semanas + 0.35))), 640, eio(seg(t, p.dias - 0.1, p.dias + 0.35)))).toFixed(1)}px 0px round 32px)`,
        }}
      >
        <Rotulo style={{ position: "absolute", left: 48, top: 52 }}>Tempo até a decisão</Rotulo>
        <div style={{ position: "absolute", left: 48, top: 150, ...surge(t, p.anos), opacity: eo(seg(t, p.anos, p.anos + 0.45)) * apaga(t, p.risca, 0.38) }}>
          <p style={palavra}>anos</p>
          <svg viewBox="0 0 270 112" className="nd-arte" style={{ translate: tremido(t) }}>
            <Traco d="M-8 62 C 70 52, 170 66, 278 50" p={risco} largura={9} cor="var(--accent)" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 48, top: 300, ...surge(t, p.semanas), opacity: eo(seg(t, p.semanas, p.semanas + 0.45)) * apaga(t, p.dias, 0.45) }}>
          <p style={palavra}>semanas</p>
        </div>
        <div style={{ position: "absolute", left: 48, top: 450, transformOrigin: "0 60%", ...chave(t, p.dias) }}>
          <p style={{ ...palavra, color: "var(--main)" }}>dias</p>
        </div>
      </div>
    </Palco>
  );
};

// ======================================================================================================
// Cena 13a · meta + opção 1 | opção 2 dos dois lados do rosto (cheia). Laranja só no selo da opção 2.
// ======================================================================================================
export type NutriOpcoesProps = {
  camera: Camera;
  dur: number;
  m: {
    meta: number; // a meta
    seisMeses: number; // o prazo
    opcao1: number; // "primeira opção"
    consulta: number; // o serviço da opção 1
    preco: number; // o preço
    dieta: number; // o que a opção 1 entrega
    espera: number; // a espera
    retorno: number; // "retorno"
    opcao2: number; // "outra opção"
    programa: number; // o nome da opção 2
    dezVezes: number; // a diferença de preço
    novaDona: number; // selo da opção 2
    produtizou: number; // frase de apoio da opção 2
  };
};

const NoLinha: React.FC<{ t: number; a: number; titulo: string; detalhe?: string; tDetalhe?: number; icone?: string; y: number }> = ({ t, a, titulo, detalhe, tDetalhe, icone, y }) => (
  <div style={{ position: "absolute", left: 40, top: y, right: 36, display: "flex", alignItems: "flex-start", gap: 22, ...surge(t, a) }}>
    <div style={{ width: 22, height: 22, marginTop: 10, flex: "none", borderRadius: "50%", border: "3px solid var(--accent)", background: "rgba(25,28,35,.6)" }} />
    <div style={{ flex: 1, lineHeight: 1.15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icone ? <Icone d={icone} tam={34} /> : null}
        <p style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-.015em", whiteSpace: "nowrap" }}>{titulo}</p>
      </div>
      {detalhe ? (
        <p className="nd-num" style={{ fontSize: 32, fontWeight: 500, opacity: 0.74, marginTop: 6, whiteSpace: "nowrap", ...surge(t, tDetalhe ?? a, 10) }}>{detalhe}</p>
      ) : null}
    </div>
  </div>
);

export const ComparacaoNutriOpcoes: React.FC<NutriOpcoesProps> = (p) => {
  const t = useT();
  const m = p.m;
  const fim = p.dur + 1;
  const tras1 = eio(seg(t, m.opcao2, m.opcao2 + 0.45));
  const espera = eio(seg(t, m.espera, m.espera + 0.9));
  return (
    <Palco>
      <CameraCheia camera={p.camera} dur={p.dur} />

      {/* Meta (canto superior esquerdo) */}
      <div className="nd-glass" style={{ left: 88, top: 62, height: 96, borderRadius: 26, boxSizing: "border-box", padding: "0 30px", display: "flex", alignItems: "center", gap: 18, ...bloco(t, m.meta - 0.15, fim) }}>
        <Rotulo>Meta</Rotulo>
        <p className="nd-num" style={{ fontSize: 50, fontWeight: 600, letterSpacing: "-.03em", whiteSpace: "nowrap" }}>−10 kg</p>
        <p style={{ fontSize: 34, fontWeight: 500, opacity: 0.8, whiteSpace: "nowrap", ...surge(t, m.seisMeses, 10) }}>em 6 meses</p>
      </div>

      {/* Opção 1 · tradicional (esquerda) */}
      <div
        className="nd-glass"
        style={{
          left: 88,
          top: 196,
          width: 500,
          height: 790,
          ...bloco(t, m.opcao1 - 0.1, fim),
          opacity: (bloco(t, m.opcao1 - 0.1, fim).opacity as number) * lerp(1, 0.4, tras1),
          scale: String(lerp(1, 0.95, tras1)),
          transformOrigin: "0 0",
          ...cresce(t, 230, [[m.consulta, 400], [m.dieta, 500], [m.espera, 650], [m.retorno, 790]], 790),
        }}
      >
        <Rotulo style={{ position: "absolute", left: 40, top: 40 }}>Opção 1 · Tradicional</Rotulo>
        <p style={{ position: "absolute", left: 40, top: 90, width: 420, fontSize: 44, fontWeight: 600, letterSpacing: "-.025em", lineHeight: 1.0 }}>A opção mais conhecida</p>
        {/* linha do tempo: consulta, dieta, espera longa e vazia, retorno */}
        <div style={{ position: "absolute", left: 50, top: 268, width: 3, height: 130, background: "rgba(255,255,255,.35)", opacity: clamp01(seg(t, m.dieta, m.dieta + 0.3) * 2) }} />
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 432,
            width: 3,
            height: 236,
            backgroundImage: "linear-gradient(rgba(255,255,255,.55) 50%, transparent 50%)",
            backgroundSize: "3px 16px",
            scale: `1 ${espera.toFixed(3)}`,
            transformOrigin: "50% 0",
          }}
        />
        <p className="nd-num" style={{ position: "absolute", left: 96, top: 520, fontSize: 34, fontWeight: 500, opacity: 0.8, whiteSpace: "nowrap", ...surge(t, m.espera + 0.2, 10) }}>2 a 3 meses</p>
        <NoLinha t={t} a={m.consulta} titulo="Consulta" detalhe="R$ 400 a 500" tDetalhe={m.preco} y={248} />
        <NoLinha t={t} a={m.dieta} titulo="Dieta" icone={IC.documento} y={398} />
        <NoLinha t={t} a={m.retorno} titulo="Retorno" y={670} />
      </div>

      {/* Opção 2 · nova (direita) */}
      <div className="nd-glass" style={{ left: 1332, top: 196, width: 500, height: 560, ...bloco(t, m.opcao2, fim), ...cresce(t, 100, [[m.programa, 212], [m.dezVezes, 368], [m.novaDona, 464], [m.produtizou, 560]], 560) }}>
        <Rotulo style={{ position: "absolute", left: 40, top: 40 }}>Opção 2</Rotulo>
        <p style={{ position: "absolute", left: 40, top: 90, width: 420, fontSize: 44, fontWeight: 600, letterSpacing: "-.025em", lineHeight: 1.0, ...surge(t, m.programa) }}>Opção nova com suporte</p>
        <div style={{ position: "absolute", left: 40, top: 220, display: "flex", alignItems: "baseline", gap: 18, ...surge(t, m.dezVezes) }}>
          <p className="nd-num" style={{ fontSize: 120, fontWeight: 600, letterSpacing: "-.045em", lineHeight: 1 }}>10×</p>
          <p style={{ fontSize: 36, fontWeight: 500, opacity: 0.8 }}>mais caro</p>
        </div>
        <div style={{ position: "absolute", left: 40, top: 392, transformOrigin: "0 50%", ...chave(t, m.novaDona) }}>
          <span style={{ display: "inline-block", padding: "12px 26px", borderRadius: 999, background: "var(--main)", color: "var(--accent)", fontSize: 36, fontWeight: 600 }}>Novidade</span>
        </div>
        <p style={{ position: "absolute", left: 40, top: 474, fontSize: 32, fontWeight: 500, opacity: 0.78, whiteSpace: "nowrap", ...surge(t, m.produtizou, 10) }}>formato diferente</p>
      </div>
    </Palco>
  );
};

// ======================================================================================================
// Cena 13b · o que a opção nova entrega (reduzida longa: trilha à esquerda, tela grande, câmera ~28%).
// Uma ideia por tela: WhatsApp da equipe (check-in semanal + PDF) → PDF de receitas → grupo com treino → aulas.
// ======================================================================================================
export type NutriProgramaProps = {
  camera: Camera;
  dur: number;
  nutri: string; // nome fictício da nutricionista
  aluna: string;
  m: {
    semana: number; // 1ª tela (conversa)
    pratica: number; // resposta na conversa
    guias: number; // chega o PDF
    receitas: number; // abre o PDF
    gostosas: number; // vira a página
    grupo: number; // abre o grupo
    treino: number; // convite no grupo
    exercicios: number; // respostas no grupo
    aulas: number; // abre as aulas
    licoes: [number, number, number, number]; // uma batida por lição
  };
  professora: string; // vídeo (b-roll) da aula
};

const S = { x: 376, y: 125, w: 940, h: 830 }; // tela principal; topo e base iguais aos da câmera, centradas na vertical
const CAM = { x: 1340, y: 125, w: 520, h: 830 }; // câmera ~27%; margem de 60 px à direita (igual à esquerda), 24 px da tela

const CameraCard: React.FC<{ camera: Camera; dur: number }> = ({ camera, dur }) => {
  const t = useT();
  const { fps } = useVideoConfig();
  const p = eio(seg(t, 0, 0.7));
  return (
    <div style={{ position: "absolute", left: CAM.x, top: CAM.y, width: CAM.w, height: CAM.h, borderRadius: 36, overflow: "hidden", background: "var(--raised)", boxShadow: "0 30px 70px rgba(0,0,0,.28)", scale: String(lerp(1.05, 1, p)), opacity: seg(t, 0, 0.35) }}>
      <Video
        src={staticFile(camera.src)}
        trimBefore={Math.round(camera.inicio * fps)}
        muted
        objectFit="cover"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", scale: String(1.02 + 0.015 * clamp01(t / dur)) }}
      />
      <div className="nd-camfade" style={{ height: "30%" }} />
      <div className="nd-camtag">{autor.rotulo}</div>
    </div>
  );
};

const TR = { x: 92, y0: 260, passo: 150 }; // 1ª etapa logo abaixo do rótulo (alinhado ao topo das telas)
const Trilha: React.FC<{ t: number; inicios: number[]; etapas: { nome: string; icone: React.ReactNode }[] }> = ({ t, inicios, etapas }) => {
  const k = eo(seg(t, 0.1, 0.8));
  let prog = 0;
  inicios.forEach((a, i) => {
    if (i > 0) prog += eio(seg(t, a - 0.2, a + 0.45));
  });
  const n = etapas.length - 1;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: k, translate: `${lerp(-16, 0, k).toFixed(1)}px 0px` }}>
      <p className="nd-rotulo" style={{ position: "absolute", left: TR.x - 32, top: S.y + 4, fontSize: 28, color: "#575E6B", whiteSpace: "nowrap" }}>O programa</p>
      <div style={{ position: "absolute", left: TR.x - 1.5, top: TR.y0, width: 3, height: TR.passo * n, borderRadius: 2, background: "#D5D8DE" }} />
      <div style={{ position: "absolute", left: TR.x - 1.5, top: TR.y0, width: 3, height: TR.passo * n, borderRadius: 2, background: "var(--ground)", scale: `1 ${(prog / n).toFixed(4)}`, transformOrigin: "50% 0" }} />
      {etapas.map((e, i) => {
        const a = inicios[i];
        const b = inicios[i + 1] ?? 1e9;
        const chegou = i === 0 ? 1 : eo(seg(t, a - 0.1, a + 0.35));
        const ativo = (i === 0 ? 1 : eo(seg(t, a, a + 0.45))) * (1 - eo(seg(t, b, b + 0.45)));
        const y = TR.y0 + i * TR.passo;
        return (
          <div key={e.nome} style={{ position: "absolute", left: 0, top: y - 32, height: 64, opacity: lerp(0.36, 1, chegou) }}>
            <div style={{ position: "absolute", left: TR.x - 32, top: 0, width: 64, height: 64, scale: String(1 + 0.14 * ativo) }}>
              <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "2.5px solid var(--ground)", opacity: ativo }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#FFFFFF", display: "grid", placeItems: "center", boxShadow: "0 8px 20px rgba(25,28,35,.10), 0 1px 3px rgba(25,28,35,.08)" }}>{e.icone}</div>
            </div>
            <p className="nd-rotulo nd-num" style={{ position: "absolute", left: TR.x + 52, top: -6, fontSize: 22, color: "#575E6B" }}>{String(i + 1).padStart(2, "0")}</p>
            <p style={{ position: "absolute", left: TR.x + 52, top: 20, fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ground)", whiteSpace: "nowrap" }}>{e.nome}</p>
          </div>
        );
      })}
    </div>
  );
};

// --- WhatsApp (só a conversa) ---
type Msg = { de: "eu" | "ela"; t: number; txt?: string; autor?: { nome: string; cor: string }; tipo?: "pdf" | "evento"; hora: string };
const WAG = { topo: 40, cab: 96, rodape: 84, margem: 36 };
const altMsg = (mm: Msg) => (mm.tipo === "pdf" ? 150 : mm.tipo === "evento" ? 300 : mm.autor ? 118 : 88);

const Bolha: React.FC<{ mm: Msg }> = ({ mm }) => {
  const eu = mm.de === "eu";
  const base: React.CSSProperties = {
    position: "relative",
    whiteSpace: "pre",
    borderRadius: 14,
    borderTopRightRadius: eu ? 4 : 14,
    borderTopLeftRadius: eu ? 14 : 4,
    background: eu ? WA.saida : "#FFFFFF",
    boxShadow: "0 1px 1px rgba(11,20,26,.12)",
    fontSize: 30,
    lineHeight: "40px",
    color: WA.texto,
    boxSizing: "border-box",
  };
  const hora = (
    <span style={{ position: "absolute", right: 12, bottom: 6, display: "flex", alignItems: "center", gap: 4, fontSize: 17, color: WA.cinza }}>
      {mm.hora}
      {eu ? <Icone d="M3 17 L8 22 L18 10 M12 21 L13 22 L23 10" tam={20} cor={WA.lido} /> : null}
    </span>
  );
  const autor = mm.autor ? <p style={{ fontSize: 22, fontWeight: 600, color: mm.autor.cor, lineHeight: "30px" }}>{mm.autor.nome}</p> : null;
  if (mm.tipo === "pdf") {
    return (
      <div style={{ ...base, width: 470, padding: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 10, background: "#F5F6F6" }}>
          <div style={{ width: 52, height: 64, flex: "none", borderRadius: 6, background: "#E5484D", color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 600 }}>PDF</div>
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <p style={{ fontSize: 28, fontWeight: 600 }}>Guia de receitas.pdf</p>
            <p style={{ fontSize: 20, color: WA.cinza }}>24 páginas · PDF</p>
          </div>
        </div>
        <div style={{ height: 34 }} />
        {hora}
      </div>
    );
  }
  if (mm.tipo === "evento") {
    return (
      <div style={{ ...base, width: 500, padding: "10px 12px 12px" }}>
        {autor}
        <div style={{ marginTop: 6, padding: "16px 18px", borderRadius: 10, background: "#F5F6F6", lineHeight: 1.2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "#E1F2F4", display: "grid", placeItems: "center", flex: "none" }}>
              <Icone d={IC.calendario} tam={30} cor="#2A6F76" />
            </div>
            <p style={{ fontSize: 30, fontWeight: 600 }}>Treino ao ar livre</p>
          </div>
          <p style={{ fontSize: 28, marginTop: 12 }}>Sábado, 7:00</p>
          <p style={{ fontSize: 26, color: WA.cinza }}>Parque do Ibirapuera</p>
        </div>
        <div style={{ marginTop: 10, height: 58, borderRadius: 12, border: `1.5px solid ${WA.verde}`, color: WA.verde, display: "grid", placeItems: "center", fontSize: 28, fontWeight: 600 }}>Vou</div>
        <div style={{ height: 22 }} />
        {hora}
      </div>
    );
  }
  return (
    <div style={{ ...base, padding: mm.autor ? "8px 20px 30px" : "10px 20px 30px", minWidth: 200 }}>
      {autor}
      {mm.txt}
      {hora}
    </div>
  );
};

const Conversa: React.FC<{ t: number; msgs: Msg[] }> = ({ t, msgs }) => {
  const base = S.h - WAG.rodape - 22;
  let acum = 0;
  const pos = [...msgs]
    .reverse()
    .map((mm) => {
      const k = eo(seg(t, mm.t, mm.t + 0.32));
      const y = base - acum - altMsg(mm);
      acum += (altMsg(mm) + 14) * k;
      return { mm, k, y };
    })
    .reverse();
  return (
    <>
      {pos.map(({ mm, k, y }) => {
        if (k <= 0.001) return null;
        const eu = mm.de === "eu";
        return (
          <div key={`m${mm.t}`} style={{ position: "absolute", top: y, left: eu ? undefined : WAG.margem, right: eu ? WAG.margem : undefined, transformOrigin: eu ? "100% 100%" : "0 100%", ...pop(k, 14) }}>
            <Bolha mm={mm} />
          </div>
        );
      })}
    </>
  );
};

const WhatsApp: React.FC<{ t: number; avatar: React.ReactNode; nome: string; status: string; msgs: Msg[] }> = ({ t, avatar, nome, status, msgs }) => (
  <div style={{ position: "absolute", inset: 0, background: WA.fundo, color: WA.texto }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(84,101,111,.07) 2px, transparent 2.4px)", backgroundSize: "28px 28px" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: WAG.topo, background: WA.barra, display: "flex", alignItems: "center", gap: 9, padding: "0 18px" }}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <span key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c }} />
      ))}
    </div>
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: `inset(${WAG.topo + WAG.cab}px 0px ${WAG.rodape}px 0px)` }}>
      <Conversa t={t} msgs={msgs} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: WAG.topo, height: WAG.cab, background: WA.barra, display: "flex", alignItems: "center", gap: 18, padding: "0 28px", borderBottom: "1px solid #E9EDEF" }}>
      <Img src={arq("logo_whatsapp.svg")} style={{ width: 40, height: 40 }} />
      {avatar}
      <div style={{ lineHeight: 1.15, minWidth: 0 }}>
        <b style={{ fontSize: 30, fontWeight: 600 }}>{nome}</b>
        <p style={{ fontSize: 22, color: WA.cinza, whiteSpace: "nowrap" }}>{status}</p>
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: WAG.rodape, background: WA.barra, display: "flex", alignItems: "center", gap: 16, padding: "0 28px" }}>
      <div style={{ flex: 1, height: 54, borderRadius: 27, background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 24px", fontSize: 22, color: "#8696A0" }}>Digite uma mensagem</div>
      <Icone d={IC.mic} tam={30} cor="#54656F" largura={2} />
    </div>
  </div>
);

// --- PDF de receitas ---
type Receita = { categoria: string; nome: string; tempo: string; tom: { fundo: string; texto: string }; itens: string[] };
const PaginaReceita: React.FC<{ r: Receita; pagina: number }> = ({ r, pagina }) => (
  <div style={{ position: "absolute", left: (S.w - 620) / 2, top: 96, width: 620, height: 700, background: "#FFFFFF", boxShadow: "0 12px 30px rgba(25,28,35,.12)", borderRadius: 6, overflow: "hidden", color: "#191C23" }}>
    <div style={{ height: 120, background: r.tom.fundo, padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <p className="nd-rotulo" style={{ fontSize: 22, color: r.tom.texto }}>{r.categoria}</p>
      <p className="nd-num" style={{ fontSize: 22, color: r.tom.texto }}>{pagina}</p>
    </div>
    <div style={{ padding: "36px 48px 0" }}>
      <p style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-.025em", lineHeight: 1.02 }}>{r.nome}</p>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {[r.tempo, "Fácil"].map((x) => (
          <span key={x} style={{ padding: "6px 16px", borderRadius: 999, background: r.tom.fundo, color: r.tom.texto, fontSize: 24, fontWeight: 500 }}>{x}</span>
        ))}
      </div>
      <p style={{ fontSize: 30, fontWeight: 600, marginTop: 34 }}>Ingredientes</p>
      {r.itens.map((x) => (
        <p key={x} style={{ fontSize: 28, lineHeight: 1.5, color: "#3A3F4A" }}>· {x}</p>
      ))}
      <p style={{ fontSize: 30, fontWeight: 600, marginTop: 26 }}>Preparo</p>
      {[0.92, 0.78, 0.86].map((w, i) => (
        <div key={i} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: "#ECEEF1", marginTop: 16 }} />
      ))}
    </div>
  </div>
);

// --- área de membros (aulas) ---
const Aulas: React.FC<{ t: number; licoes: string[]; tempos: number[]; video: string; curso: string }> = ({ t, licoes, tempos, video, curso }) => {
  let atual = 0;
  tempos.forEach((x, i) => {
    if (t >= x) atual = i;
  });
  const progresso = seg(t, tempos[atual], tempos[atual] + 8);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#14161B", color: "#FFFFFF" }}>
      <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 40px", fontSize: 22, color: "rgba(255,255,255,.62)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>{curso}</div>
      <div style={{ position: "absolute", left: 40, top: 92, width: S.w - 80, height: 400, borderRadius: 18, overflow: "hidden", background: "#000" }}>
        <Video src={broll(video)} muted loop objectFit="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectPosition: "50% 35%" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 80, background: "linear-gradient(transparent, rgba(0,0,0,.55))" }} />
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 20, height: 5, borderRadius: 3, background: "rgba(255,255,255,.3)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 3, background: "#FFFFFF", scale: `${progresso.toFixed(3)} 1`, transformOrigin: "0 50%" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 516 }}>
        {licoes.map((l, i) => {
          const feita = i < atual;
          const ativa = i === atual;
          const k = eo(seg(t, tempos[i] - 0.1, tempos[i] + 0.3));
          return (
            <div key={l} style={{ height: 70, display: "flex", alignItems: "center", gap: 20, padding: "0 20px", borderRadius: 14, background: ativa ? `rgba(255,255,255,${(0.09 * (i === 0 ? 1 : k)).toFixed(3)})` : "transparent" }}>
              <div style={{ width: 38, height: 38, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center", border: feita ? "none" : "1.5px solid rgba(255,255,255,.4)", background: feita ? "#5DB386" : "transparent" }}>
                {feita ? <Icone d={IC.check} tam={22} cor="#FFFFFF" largura={3} /> : <span className="nd-num" style={{ fontSize: 18, opacity: 0.7 }}>{i + 1}</span>}
              </div>
              <p style={{ fontSize: 32, fontWeight: ativa ? 600 : 500, opacity: ativa ? 1 : feita ? 0.62 : 0.5 }}>{l}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ComparacaoNutriPrograma: React.FC<NutriProgramaProps> = (p) => {
  const t = useT();
  const m = p.m;
  const inicios = [0, m.guias, m.grupo - 0.4, m.aulas - 0.6];
  const W = {
    wa: janela(t, 0.2, m.receitas),
    pdf: janela(t, m.receitas, m.grupo - 0.4),
    grupo: janela(t, m.grupo - 0.4, m.aulas - 0.6),
    aulas: janela(t, m.aulas - 0.6, p.dur + 1),
  };
  const virou = eio(seg(t, m.gostosas, m.gostosas + 0.5));
  const tela = (st: React.CSSProperties, fundo = "#FFFFFF"): React.CSSProperties => ({ position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", background: fundo, boxShadow: SOMBRA_TELA, ...st });

  const msgsEquipe: Msg[] = [
    { de: "ela", t: m.semana, txt: `Oi, ${p.aluna}! Check-in da semana 3`, hora: "08:02" },
    { de: "ela", t: m.semana + 0.9, txt: "Como foi com a dieta?", hora: "08:02" },
    { de: "eu", t: m.pratica, txt: "Segui tudo! Só escapei no sábado", hora: "08:15" },
    { de: "ela", t: m.guias + 0.25, tipo: "pdf", hora: "08:16" },
  ];
  const msgsGrupo: Msg[] = [
    { de: "ela", t: m.treino, tipo: "evento", autor: { nome: `Equipe ${p.nutri}`, cor: "#2A6F76" }, hora: "18:30" },
    { de: "ela", t: m.exercicios, txt: "Eu vou!", autor: { nome: "Bia", cor: "#9C3F66" }, hora: "18:31" },
    { de: "ela", t: m.exercicios + 0.6, txt: "Bora, turma!", autor: { nome: "Carla", cor: "#5A4BA8" }, hora: "18:31" },
  ];
  const receitas: Receita[] = [
    { categoria: "Café da manhã", nome: "Panqueca de banana e aveia", tempo: "15 min", tom: { fundo: "#E3F3EA", texto: "#2E7652" }, itens: ["1 banana madura", "2 ovos", "3 colheres de aveia", "Canela a gosto"] },
    { categoria: "Almoço", nome: "Bowl de frango com legumes", tempo: "25 min", tom: { fundo: "#FBE9F0", texto: "#9C3F66" }, itens: ["150 g de frango", "Arroz integral", "Brócolis e cenoura", "Azeite e limão"] },
  ];

  const etapas = [
    { nome: "Equipe", icone: <Img src={arq("logo_whatsapp.svg")} style={{ width: 36, height: 36 }} /> },
    { nome: "Receitas", icone: <Icone d={IC.documento} tam={32} cor="#191C23" /> },
    { nome: "Grupo", icone: <Icone d={IC.grupo} tam={32} cor="#191C23" /> },
    { nome: "Aulas", icone: <Icone d={IC.play} tam={32} cor="#191C23" /> },
  ];

  return (
    <Palco>
      <div className="nd-fundo">
        <div className="nd-papel" />
        <div className="nd-papel-pontos" />
        <Trilha t={t} inicios={inicios} etapas={etapas} />

        <div style={{ position: "absolute", left: S.x, top: S.y, width: S.w, height: S.h }}>
          {W.wa.on && (
            <div style={tela(W.wa.style)}>
              <WhatsApp t={t} avatar={<Monograma tam={58} txt="NC" fundo="#5DB386" />} nome={`Equipe ${p.nutri}`} status="online" msgs={msgsEquipe} />
            </div>
          )}
          {W.pdf.on && (
            <div style={tela(W.pdf.style, "#E8EAED")}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 72, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: "1px solid #E4E6EA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 34, height: 42, borderRadius: 5, background: "#E5484D", color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600 }}>PDF</div>
                  <p style={{ fontSize: 26, fontWeight: 600, color: "#191C23" }}>Guia de receitas.pdf</p>
                </div>
                <p className="nd-num" style={{ fontSize: 24, color: "#5F6368" }}>{virou > 0.5 ? 4 : 3} / 24</p>
              </div>
              <div style={{ position: "absolute", inset: 0, opacity: 1 - virou, translate: `${(-60 * virou).toFixed(1)}px 0px` }}>
                <PaginaReceita r={receitas[0]} pagina={3} />
              </div>
              <div style={{ position: "absolute", inset: 0, opacity: virou, translate: `${lerp(60, 0, virou).toFixed(1)}px 0px` }}>
                <PaginaReceita r={receitas[1]} pagina={4} />
              </div>
            </div>
          )}
          {W.grupo.on && (
            <div style={tela(W.grupo.style)}>
              <WhatsApp t={t} avatar={<Monograma tam={58} txt="TV" fundo="#4FAAB3" />} nome="Turma Verão" status="Bia, Carla, Duda, Lu e mais 18" msgs={msgsGrupo} />
            </div>
          )}
          {W.aulas.on && (
            <div style={tela(W.aulas.style, "#14161B")}>
              <Aulas t={t} licoes={["Anatomia do corpo", "O que é carboidrato", "Macronutrientes", "Micronutrientes"]} tempos={m.licoes} video={p.professora} curso={`${p.nutri} · Programa 6 meses · Módulo 2`} />
            </div>
          )}
        </div>
      </div>
      <CameraCard camera={p.camera} dur={p.dur} />
    </Palco>
  );
};

// ======================================================================================================
// Cena 13c · promessa (cheia, momento-chave): a frase da promessa no bloco laranja.
// ======================================================================================================
export type NutriGarantiaProps = {
  camera: Camera;
  dur: number;
  abre: number; // abre a cena
  pergunta: number; // a condição
  devolve: number; // a promessa (momento-chave)
  condicao: number; // a regra
};

export const ComparacaoNutriGarantia: React.FC<NutriGarantiaProps> = (p) => {
  const t = useT();
  return (
    <Palco>
      <CameraCheia camera={p.camera} dur={p.dur} />
      <div className="nd-glass" style={{ left: 88, top: 214, width: 580, height: 600, ...bloco(t, p.abre - 0.1, p.dur + 1) }}>
        <div style={{ position: "absolute", left: 48, top: 46, display: "flex", alignItems: "center", gap: 16 }}>
          <Icone d={IC.escudo} tam={44} />
          <Rotulo style={{ opacity: 0.8 }}>Garantia</Rotulo>
        </div>
        <p style={{ position: "absolute", left: 48, top: 126, fontSize: 34, fontWeight: 500, opacity: 0.8, whiteSpace: "nowrap", ...surge(t, p.abre + 0.3) }}>6 meses de uso</p>
        <p style={{ position: "absolute", left: 48, top: 186, width: 490, fontSize: 56, fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.0, ...surge(t, p.pergunta), opacity: eo(seg(t, p.pergunta, p.pergunta + 0.45)) * apaga(t, p.devolve, 0.55) }}>
          Não perdeu 10 kg?
        </p>
        <div style={{ position: "absolute", left: 40, top: 326, width: 500, transformOrigin: "0 50%", ...chave(t, p.devolve) }}>
          <div style={{ padding: "26px 32px 28px", borderRadius: 24, background: "var(--main)", color: "var(--accent)", boxShadow: "0 20px 44px rgba(0,0,0,.28)" }}>
            <p style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.0 }}>Exemplo de promessa central</p>
          </div>
        </div>
        <p style={{ position: "absolute", left: 48, top: 508, fontSize: 31, fontWeight: 500, opacity: 0.78, whiteSpace: "nowrap", ...surge(t, p.condicao, 10) }}>exemplo de condição da promessa</p>
      </div>
    </Palco>
  );
};

// ======================================================================================================
// Parâmetros da aula 01 (batidas em segundos do vídeo editado, convertidas para t da cena).
// ======================================================================================================
// Exemplo de preenchimento (vídeo de demonstração do criador do sistema). A câmera e as imagens citadas
// não vêm no repositório: use como modelo de parâmetros, não registre no Root sem trocar pelos arquivos do seu vídeo.
const cam = (inicio: number) => ({ src: "01-meu-primeiro-video/editado.mp4", inicio });
const rel = (ini: number) => (abs: number) => Number((abs - ini).toFixed(2));

const I6A = 302.4;
const a6 = rel(I6A);
export const listaAmarelaAula01: ListaAmarelaProps = {
  camera: cam(I6A),
  dur: 14.4,
  foto: staticFile("biblioteca/b-roll/b-roll_lista-telefonica-pagina-01.jpg"),
  alvo: { x: 0.595, y: 0.505 },
  entra: a6(302.75),
  aproxima: a6(308.17),
  circula: a6(313.28),
  sai: a6(316.3),
};

const I6B = 329.9;
const b6 = rel(I6B);
export const vizinhosAula01: VizinhosProps = {
  camera: cam(I6B),
  dur: 11.6,
  linhas: [
    { profissao: "Advogado", relacao: "colega de faculdade", icone: "balanca", t: b6(330.52), tRel: b6(335.83) },
    { profissao: "Contador", relacao: "colega de escola", icone: "calculadora", t: b6(331.39), tRel: b6(337.0) },
    { profissao: "Dentista", relacao: "vizinho", icone: "dente", t: b6(332.56), tRel: b6(338.24) },
  ],
  sai: b6(341.2),
};

const I6C = 346.2;
const c6 = rel(I6C);
export const feedAula01: FeedProps = {
  camera: cam(I6C),
  dur: 15.8,
  posts: [
    { handle: "casaviva.reformas", cor: "#2F6B4F", img: "img_reforma-cozinha.jpg", cta: "Pedir orçamento" },
    { handle: "atelier.prumo", cor: "#8A4B2A", video: "b-roll_arquiteta-maquete-01.mp4", cta: "Saiba mais" },
    { handle: "lar.moveis", cor: "#5A4BA8", img: "img_reforma-poltrona.jpg", cta: "Comprar agora" },
    { handle: "studio.decor", cor: "#9C3F66", img: "img_reforma-sala-boho.jpg", cta: "Saiba mais" },
    { handle: "pinta.ja", cor: "#2F5C9E", video: "b-roll_reforma-pintura-casal-01.mp4", cta: "Agendar" },
    { handle: "marcenaria.luz", cor: "#2A6F76", img: "img_reforma-sala-janela.jpg", cta: "Comprar agora" },
    { handle: "imob.centro", cor: "#3F4A5A", img: "img_reforma-casa-fachada.jpg", cta: "Ver imóveis" },
    { handle: "casa.clara", cor: "#2E7652", img: "img_reforma-sala-clara.jpg", cta: "Saiba mais" },
  ],
  // batidas: segundos das palavras faladas no vídeo editado
  rolagens: [c6(349.28), c6(351.17), c6(352.4), c6(352.91), c6(353.93), c6(354.73)],
  topo: c6(355.54),
  story: c6(357.6),
  influencer: { handle: "rafa.nogueira", video: "b-roll_pessoa-arquiteto-chamada-01.mp4", retrato: "b-roll_pessoa-arquiteto-retrato-01.jpg", ha: "2 h" },
  outros: [
    { img: "img_reforma-sala-azul.jpg", nome: "casaviva" },
    { img: "img_reforma-integrado.jpg", nome: "lar.moveis" },
    { img: "img_reforma-sala-quadros.jpg", nome: "studio.decor" },
    { img: "img_reforma-sala-clara.jpg", nome: "casa.clara" },
  ],
  parente: { t: c6(359.6), nome: "Tio Carlos", iniciais: "TC", msg: "Feliz aniversário! Saudades", data: "12/03", grifo: c6(360.56) },
};

const I6D = 362.0;
const d6 = rel(I6D);
export const confiancaAula01: ConfiancaProps = {
  camera: cam(I6D),
  dur: 7.0,
  rotulo: d6(362.02),
  anos: d6(364.13),
  risca: d6(365.12),
  semanas: d6(366.04),
  dias: d6(367.06),
};

const I13A = 829.2;
const n1 = rel(I13A);
export const nutriOpcoesAula01: NutriOpcoesProps = {
  camera: cam(I13A),
  dur: 34.7,
  m: {
    meta: n1(829.78),
    seisMeses: n1(832.18),
    opcao1: n1(835.02),
    consulta: n1(835.97),
    preco: n1(838.88),
    dieta: n1(842.87),
    espera: n1(844.73),
    retorno: n1(846.11),
    opcao2: n1(849.55),
    programa: n1(853.85),
    dezVezes: n1(856.39),
    novaDona: n1(861.42),
    produtizou: n1(862.65),
  },
};

const I13B = 863.9;
const n2 = rel(I13B);
export const nutriProgramaAula01: NutriProgramaProps = {
  camera: cam(I13B),
  dur: 27.2,
  nutri: "Nutri Camila",
  aluna: "Mari",
  professora: "b-roll_pessoa-cliente-chamada-01.mp4",
  m: {
    semana: n2(866.02),
    pratica: n2(869.8),
    guias: n2(871.62),
    receitas: n2(873.66),
    gostosas: n2(874.39),
    grupo: n2(880.33),
    treino: n2(881.24),
    exercicios: n2(882.47),
    aulas: n2(884.2),
    licoes: [n2(885.05), n2(888.11), n2(889.2), n2(890.22)], // uma por lição
  },
};

const I13C = 891.1;
const n3 = rel(I13C);
export const nutriGarantiaAula01: NutriGarantiaProps = {
  camera: cam(I13C),
  dur: 7.7,
  abre: n3(891.16),
  pergunta: n3(893.56),
  devolve: n3(895.31),
  condicao: n3(897.0),
};
