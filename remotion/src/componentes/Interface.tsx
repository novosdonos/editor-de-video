// `interface` · variação "jornada" (v4): layout reduzido de framework longo, limpo.
// Trilha vertical à esquerda (6 etapas com o ícone real do app, número e nome) · tela principal grande sem moldura de
// aparelho, recuada para a câmera não cobrir conteúdo · câmera ~28% à direita · no máximo 1 satélite por vez sobre a
// tela (na chamada, 2 finos: selo "Em chamada" e barra da sessão), como na referência do O Novo Mercado.
// Telas, uma ideia por vez: Google (3 resultados) → formulário de orçamento (×3) → Instagram (Explorar com poucas células
// grandes, reel, perfil, post do amigo) → WhatsApp (só a conversa) → Reclame Aqui (nome, reputação, 0 reclamações) +
// nota do Google → WhatsApp → Meet (tela dividida: arquiteto | "Você") → proposta R$ 10→40 mil, "Proposta aceita".
// Pessoas: vídeos de banco com cara de brasileiras, na mesma chamada (setup/biblioteca/b-roll/b-roll_pessoa-*).
// Interfaces de terceiros recriadas a partir de prints reais (setup/referencias/interface/*-real-*); dados fictícios.
import { Video } from "@remotion/media";
import { Img, staticFile, useVideoConfig } from "remotion";
import { brl, clamp01, eio, eo, eob, lerp, pulso, seg } from "../movimento";
import { autor } from "../marca";
import { Cursor, Palco, Ripple, useT, type Camera } from "./comum";

// Marcas da fala (s desde o início da cena), ancoradas nas palavras de aula.json.
export type MarcasJornada = {
  digitaBusca: [number, number]; // digita a busca (início, fim)
  sites: number; // aparecem os resultados
  form: number; // abre o formulário
  envios: [number, number, number]; // envio de cada orçamento
  aguarde: number; // espera
  insta: number; // volta ao celular
  abreInsta: number; // abre o Instagram
  swipes: number[]; // rolagem do Explorar, uma por palavra
  arquitetos: number; // grade de perfis
  enquanto: number; // virada da cena
  responderam: number; // sem resposta
  enxurrada: number; // muitos posts
  interessa: number; // foco num perfil
  abrePerfil: number; // abre o perfil
  seguir: number; // clique em seguir
  fotos: number; // rola as fotos
  amigo: number; // post do amigo
  foto: number; // foto do amigo com o profissional
  fez: number; // legenda do post
  zap: number; // abre o WhatsApp
  msgs: [number, number, number]; // cada mensagem enviada
  digitando: number; // amigo digitando
  contato: number; // chega o contato
  conversar: number; // conversa com o profissional
  verifica: number; // começa a checar
  digitaRA: [number, number]; // digita a busca de reputação (início, fim)
  reclameAqui: number; // abre o Reclame Aqui
  avaliacoes: number; // nota do Google
  reclamacao: number; // zero reclamações
  zap2: number; // volta ao WhatsApp
  pedeOrcamento: number; // pede orçamento
  chama: number; // convite para a chamada
  meet: number; // abre a chamada
  fecha: number; // proposta
  valores: [number, number, number, number]; // cada valor da proposta
  aceita: number; // clique em "Aceitar"
};

export type InterfaceJornadaProps = {
  camera: Camera;
  dur: number;
  m: MarcasJornada;
  busca: string;
  buscaRA: string;
  proposta: number;
};

// ---------- geometria (palco 1920×1080) ----------
const S = { x: 404, y: 84, w: 940, h: 830 }; // tela principal; termina antes da câmera
const CAM = { x: 1352, y: 140, w: 528, h: 800 }; // câmera ~28%
const BARRA = 100; // barra do navegador
const naS = (x: number, y: number): [number, number] => [S.x + x, S.y + y];

const COR = {
  texto: "#191C23",
  mudo: "#5F6368",
  linha: "#E4E6EA",
  googleAzul: "#1A0DAB",
  googleVisitado: "#681DA8",
  googleAmarelo: "#FBBC04",
  igAzul: "#0095F6",
  igLinha: "#DBDBDB",
  waVerde: "#00A884",
  waFundo: "#EFEAE2",
  waSaida: "#D9FDD3",
  waLido: "#53BDEB",
  raVerde: "#0E5A3A",
  meetFundo: "#202124",
  meetVermelho: "#EA4335",
  autofill: "#E8F0FE",
};

const arq = (n: string) => staticFile(`biblioteca/interfaces/${n}`);
const broll = (n: string) => staticFile(`biblioteca/b-roll/${n}`);

// Pessoas da cena (mesma chamada): arquiteto fictício André Lacerda e o cliente "Você".
const ARQ_RETRATO = "b-roll_pessoa-arquiteto-retrato-02.jpg";
const ARQ_CHAMADA = "b-roll_pessoa-arquiteto-chamada-02.mp4";
const CLIENTE_RETRATO = "b-roll_pessoa-cliente-retrato-02.jpg";
const CLIENTE_CHAMADA = "b-roll_pessoa-cliente-chamada-02.mp4";
// Amiga que indica (Júlia Mendes): retrato de banco, o mesmo no Instagram e no WhatsApp.
const JULIA_RETRATO = "b-roll_pessoa-cliente-retrato-01.jpg";

// Vidro claro (satélites sobre fundo claro) e escuro (sobre imagem/tela escura): mesma luz em todas as cenas.
const VIDRO: React.CSSProperties = {
  background: "rgba(255,255,255,.80)",
  backdropFilter: "blur(24px) saturate(1.5)",
  border: "1px solid rgba(255,255,255,.95)",
  boxShadow: "0 18px 44px rgba(25,28,35,.16), 0 2px 6px rgba(25,28,35,.06)",
  borderRadius: 28,
  color: COR.texto,
};
const VIDRO_ESCURO: React.CSSProperties = {
  background: "rgba(32,33,36,.70)",
  backdropFilter: "blur(24px) saturate(1.3)",
  border: "1px solid rgba(255,255,255,.16)",
  boxShadow: "0 18px 44px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.12)",
  borderRadius: 28,
  color: "#FFFFFF",
};
const SOMBRA_TELA = "0 30px 70px rgba(25,28,35,.16), 0 2px 8px rgba(25,28,35,.08)";

// ---------- tempo ----------
// Tela principal: entra subindo e assenta; sai cedendo para a próxima (troca com sobreposição curta).
const janela = (t: number, a: number, b: number) => {
  const pin = a <= 0 ? 1 : eo(seg(t, a - 0.1, a + 0.55));
  const pout = eio(seg(t, b - 0.25, b + 0.2));
  return {
    on: t >= a - 0.1 && t < b + 0.2,
    style: {
      opacity: pin * (1 - pout),
      translate: `0px ${(lerp(28, 0, pin) - 18 * pout).toFixed(1)}px`,
      scale: String(lerp(0.975, 1, pin) - 0.012 * pout),
    } as React.CSSProperties,
  };
};
// Satélite: entra com passagem e assenta; sai rápido.
const sat = (t: number, a: number, b: number, dy = 18) => {
  const pin = eob(seg(t, a, a + 0.45), 1.3);
  const pout = eio(seg(t, b - 0.25, b + 0.05));
  return {
    on: t >= a && t < b + 0.05,
    style: {
      opacity: clamp01(pin * 1.6) * (1 - pout),
      translate: `0px ${(lerp(dy, 0, pin) - 10 * pout).toFixed(1)}px`,
      scale: String(lerp(0.94, 1, pin)),
    } as React.CSSProperties,
  };
};
// Troca de página dentro da mesma tela (crossfade com deslize lateral curto).
const pagina = (t: number, a: number, b: number, dx = 36) => {
  const pin = a <= 0 ? 1 : eo(seg(t, a - 0.05, a + 0.35));
  const pout = eio(seg(t, b - 0.12, b + 0.18));
  return {
    on: t >= a - 0.05 && t < b + 0.18,
    style: {
      opacity: pin * (1 - pout),
      translate: `${(lerp(dx, 0, pin) - dx * 0.6 * pout).toFixed(1)}px 0px`,
    } as React.CSSProperties,
  };
};
const digitar = (txt: string, t: number, a: number, b: number) => txt.slice(0, Math.round(txt.length * seg(t, a, b)));
const pop = (k: number, dist = 20): React.CSSProperties => ({
  opacity: clamp01(k * 1.6),
  translate: `0px ${lerp(dist, 0, k).toFixed(1)}px`,
  scale: String(lerp(0.94, 1, k)),
});
const clique = (t: number, c: number) => 1 - 0.04 * Math.sin(seg(t, c, c + 0.22) * Math.PI);

// ---------- peças ----------
const Foto: React.FC<{ n: string; pos?: string; style?: React.CSSProperties }> = ({ n, pos = "50% 50%", style }) => (
  <Img src={arq(n)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, ...style }} />
);
const Clipe: React.FC<{ n: string; style?: React.CSSProperties }> = ({ n, style }) => (
  <Video src={broll(n)} muted loop objectFit="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }} />
);
const Logo: React.FC<{ n: string; w: number; h?: number; style?: React.CSSProperties }> = ({ n, w, h, style }) => (
  <Img src={arq(n)} style={{ width: w, height: h ?? w, objectFit: "contain", display: "block", flex: "none", ...style }} />
);
// Avatar: retrato de pessoa (b-roll), letra ou nada.
const Avatar: React.FC<{ tam: number; retrato?: string; letra?: string; fundo?: string }> = ({ tam, retrato, letra, fundo = "#8A94A6" }) => (
  <div style={{ position: "relative", width: tam, height: tam, flex: "none", borderRadius: "50%", overflow: "hidden", background: fundo, display: "grid", placeItems: "center", color: "#FFFFFF", fontWeight: 600, fontSize: tam * 0.42 }}>
    {retrato ? <Img src={broll(retrato)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%" }} /> : letra}
  </div>
);
const Monograma: React.FC<{ tam: number; txt: string; fundo: string; raio?: number }> = ({ tam, txt, fundo, raio = 10 }) => (
  <div style={{ width: tam, height: tam, flex: "none", borderRadius: raio, background: fundo, color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 600, fontSize: tam * (txt.length > 1 ? 0.36 : 0.5), letterSpacing: "-0.02em" }}>{txt}</div>
);

// Ícones de traço (2.4 px), no estilo dos apps.
const Svg: React.FC<{ tam: number; cor?: string; largura?: number; d: string; cheio?: boolean }> = ({ tam, cor = "#111111", largura = 2.4, d, cheio }) => (
  <svg width={tam} height={tam} viewBox="0 0 32 32" style={{ display: "block", flex: "none" }}>
    <path d={d} style={{ fill: cheio ? cor : "none", stroke: cor, strokeWidth: largura, strokeLinecap: "round", strokeLinejoin: "round" }} />
  </svg>
);
const D = {
  lupa: "M14 5 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18 M20.5 20.5 L27 27",
  casa: "M5 14 L16 5 L27 14 V27 H19 V19 H13 V27 H5 Z",
  bussola: "M16 3 a13 13 0 1 1 0 26 a13 13 0 1 1 0 -26 M21 11 L18 18 L11 21 L14 14 Z",
  reels: "M5 5 H27 V27 H5 Z M5 11 H27 M11 5 L15 11 M19 5 L23 11 M13.5 15.5 L20 19 L13.5 22.5 Z",
  mensagem: "M16 4 C9 4 4 9 4 15 C4 18.5 5.6 21.4 8.2 23.3 V28 L12.6 25.6 C13.7 25.9 14.8 26 16 26 C23 26 28 21 28 15 C28 9 23 4 16 4 Z M9 18 L14 13 L18 16 L23 11",
  coracao: "M16 27 C 6 20, 3 15, 3 10.5 C 3 6.5, 6 4, 9.5 4 C 12.5 4, 14.6 5.8, 16 8 C 17.4 5.8, 19.5 4, 22.5 4 C 26 4, 29 6.5, 29 10.5 C 29 15, 26 20, 16 27 Z",
  mais: "M5 5 H27 V27 H5 Z M16 10 V22 M10 16 H22",
  balao: "M27 15.5 A11.5 11 0 1 0 22 24.5 L28 27 L26.5 21 A11 11 0 0 0 27 15.5 Z",
  aviao: "M28 4 L3 13 L13 17 L17 28 Z M13 17 L28 4",
  check: "M5 16.5 L12.5 24 L27 8.5",
  mic: "M16 4 a4.5 4.5 0 0 1 4.5 4.5 v6 a4.5 4.5 0 0 1 -9 0 v-6 a4.5 4.5 0 0 1 4.5 -4.5 Z M8 15 a8 8 0 0 0 16 0 M16 23 v5",
  cam: "M4 9 H20 V23 H4 Z M20 13.5 L28 9 V23 L20 18.5",
  fone: "M4 19 C 11 12, 21 12, 28 19 L 25.5 23 L 20.5 21.5 V 18 C 17.5 17, 14.5 17, 11.5 18 V 21.5 L 6.5 23 Z",
  envelope: "M4 8 H28 V25 H4 Z M4 9 L16 18 L28 9",
  form: "M8 3 H24 V29 H8 Z M12 10 H20 M12 15.5 H20 M12 21 H17",
  escudo: "M16 3 L27 7 V15 C27 22 22 27 16 29 C10 27 5 22 5 15 V7 Z M11 16 L14.5 19.5 L21 12.5",
};

const Estrelas: React.FC<{ n: number; tam: number; cor?: string }> = ({ n, tam, cor = COR.googleAmarelo }) => (
  <svg width={Math.round((tam * 250) / 46)} height={tam} viewBox="0 0 250 46" style={{ display: "block", flex: "none" }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <path key={i} transform={`translate(${i * 50} 0)`} d="M23 2 L29 16 L44 17 L32 27 L36 42 L23 34 L10 42 L14 27 L2 17 L17 16 Z" style={{ fill: n > i + 0.3 ? cor : "#DADCE0" }} />
    ))}
  </svg>
);

// ---------- molduras ----------
type Aba = { icone: React.ReactNode; titulo: string; k: number };
const Navegador: React.FC<{ abas: Aba[]; ativa: number; url: string; children: React.ReactNode }> = ({ abas, ativa, url, children }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 46, background: "#DEE1E6", display: "flex", alignItems: "flex-end", padding: "0 18px", gap: 2 }}>
      <div style={{ display: "flex", gap: 9, alignSelf: "center", marginRight: 16 }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c }} />
        ))}
      </div>
      {abas.map((a, i) => (
        <div
          key={a.titulo}
          style={{
            height: 38,
            width: 196,
            borderRadius: "11px 11px 0 0",
            background: i === ativa ? "#FFFFFF" : "transparent",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            fontSize: 20,
            fontWeight: 500,
            color: "#3C4043",
            whiteSpace: "nowrap",
            overflow: "hidden",
            opacity: clamp01(a.k * 1.5),
            scale: String(lerp(0.6, 1, clamp01(a.k))),
            transformOrigin: "0 100%",
          }}
        >
          <span style={{ flex: "none", display: "grid", placeItems: "center" }}>{a.icone}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{a.titulo}</span>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 46, height: 54, background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 20px", borderBottom: `1px solid ${COR.linha}` }}>
      <div style={{ flex: 1, maxWidth: 760, height: 38, borderRadius: 19, background: "#F1F3F4", display: "flex", alignItems: "center", padding: "0 18px", fontSize: 20, color: "#3C4043", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden" }}>{url}</div>
    </div>
    <div style={{ position: "absolute", left: 0, top: BARRA, right: 0, bottom: 0, overflow: "hidden", background: "#FFFFFF" }}>{children}</div>
  </>
);

// ---------- câmera (card ~28% à direita) ----------
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

// ---------- trilha vertical (esquerda) ----------
const ETAPAS: { nome: string; icone: React.ReactNode }[] = [
  { nome: "Busca", icone: <Logo n="logo_google_g.svg" w={30} /> },
  { nome: "Orçamento", icone: <Svg tam={32} cor={COR.texto} d={D.form} largura={2.2} /> },
  { nome: "Feed", icone: <Logo n="logo_instagram.svg" w={34} /> },
  { nome: "Indicação", icone: <Logo n="logo_whatsapp.svg" w={36} /> },
  { nome: "Avaliação", icone: <Logo n="logo_reclameaqui_icone.png" w={32} /> },
  { nome: "Fechamento", icone: <Logo n="logo_google_meet.svg" w={34} /> },
];
const TR = { x: 92, y0: 250, passo: 132 };

const Trilha: React.FC<{ t: number; inicios: number[] }> = ({ t, inicios }) => {
  const k = eo(seg(t, 0.1, 0.8));
  let prog = 0;
  inicios.forEach((a, i) => {
    if (i > 0) prog += eio(seg(t, a - 0.2, a + 0.45));
  });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: k, translate: `${lerp(-16, 0, k).toFixed(1)}px 0px` }}>
      <p className="nd-rotulo" style={{ position: "absolute", left: TR.x - 32, top: 132, fontSize: 22, color: "#575E6B", whiteSpace: "nowrap" }}>Jornada de compra</p>
      <div style={{ position: "absolute", left: TR.x - 1.5, top: TR.y0, width: 3, height: TR.passo * 5, borderRadius: 2, background: "#D5D8DE" }} />
      <div style={{ position: "absolute", left: TR.x - 1.5, top: TR.y0, width: 3, height: TR.passo * 5, borderRadius: 2, background: "var(--ground)", scale: `1 ${(prog / 5).toFixed(4)}`, transformOrigin: "50% 0" }} />
      {ETAPAS.map((e, i) => {
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
            <p className="nd-rotulo nd-num" style={{ position: "absolute", left: TR.x + 52, top: -4, fontSize: 22, color: "#575E6B" }}>{String(i + 1).padStart(2, "0")}</p>
            <p style={{ position: "absolute", left: TR.x + 52, top: 22, fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ground)", whiteSpace: "nowrap" }}>{e.nome}</p>
          </div>
        );
      })}
    </div>
  );
};

// ---------- 01 · Google ----------
const RESULTADOS: { nome: string; url: string; titulo: string; cor: string }[] = [
  { nome: "Estúdio Linha Arquitetura", url: "estudiolinha.com.br", titulo: "Projetos e reformas residenciais em SP", cor: "#3F4A5A" },
  { nome: "Casa Viva Reformas", url: "casavivareformas.com.br", titulo: "Reforma completa de apartamentos", cor: "#2F6B4F" },
  { nome: "Atelier Prumo", url: "atelierprumo.com.br", titulo: "Arquitetura de interiores · Pinheiros", cor: "#8A4B2A" },
];
const RES_Y = (i: number) => 150 + i * 170; // topo de cada resultado (área de conteúdo)

const CaixaBusca: React.FC<{ texto: string; t: number; largura: number; altura: number; fonte: number; caret: boolean }> = ({ texto, t, largura, altura, fonte, caret }) => (
  <div style={{ width: largura, height: altura, borderRadius: altura / 2, border: "1px solid #DFE1E5", boxShadow: "0 1px 6px rgba(32,33,36,.18)", display: "flex", alignItems: "center", gap: 16, padding: "0 24px", fontSize: fonte, fontWeight: 500, color: "#202124", background: "#FFFFFF", boxSizing: "border-box" }}>
    <Svg tam={fonte} cor="#9AA0A6" d={D.lupa} largura={2.6} />
    <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
      {texto}
      <span style={{ opacity: caret && Math.floor(t * 2.5) % 2 === 0 ? 1 : 0, fontWeight: 300 }}>|</span>
    </span>
  </div>
);

const GoogleInicio: React.FC<{ t: number; texto: string; caret: boolean }> = ({ t, texto, caret }) => (
  <div style={{ position: "absolute", inset: 0, background: "#FFFFFF" }}>
    <Logo n="logo_google.svg" w={300} h={102} style={{ position: "absolute", left: S.w / 2 - 150, top: 190 }} />
    <div style={{ position: "absolute", left: S.w / 2 - 360, top: 340 }}>
      <CaixaBusca texto={texto} t={t} largura={720} altura={76} fonte={30} caret={caret} />
    </div>
  </div>
);

const GoogleResultados: React.FC<{ t: number; busca: string; inicio: number; visitado: number[] }> = ({ t, busca, inicio, visitado }) => (
  <div style={{ position: "absolute", inset: 0, background: "#FFFFFF" }}>
    <div style={{ position: "absolute", left: 30, top: 30, display: "flex", alignItems: "center", gap: 28 }}>
      <Logo n="logo_google.svg" w={112} h={38} />
      <CaixaBusca texto={busca} t={t} largura={600} altura={60} fonte={24} caret={false} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 118, height: 1, background: COR.linha }} />
    {RESULTADOS.map((r, i) => {
      const k = eo(seg(t, inicio + i * 0.1, inicio + 0.4 + i * 0.1));
      return (
        <div key={r.nome} style={{ position: "absolute", left: 170, top: RES_Y(i), width: 680, ...pop(k, 14) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Monograma tam={34} txt={r.nome[0]} fundo={r.cor} raio={17} />
            <div style={{ lineHeight: 1.2 }}>
              <p style={{ fontSize: 21, color: "#202124", fontWeight: 500 }}>{r.nome}</p>
              <p style={{ fontSize: 19, color: "#4D5156" }}>https://{r.url}</p>
            </div>
          </div>
          <p style={{ fontSize: 34, lineHeight: 1.2, marginTop: 10, color: t >= visitado[i] ? COR.googleVisitado : COR.googleAzul, whiteSpace: "nowrap" }}>{r.titulo}</p>
        </div>
      );
    })}
  </div>
);

// ---------- 02 · formulários de orçamento ----------
const SITES = [
  { site: "Estúdio Linha", nome: "Estúdio Linha Arquitetura", url: "estudiolinha.com.br/orcamento", cor: "#3F4A5A", foto: "img_reforma-sala-clara.jpg" },
  { site: "Casa Viva", nome: "Casa Viva Reformas", url: "casavivareformas.com.br/contato", cor: "#2F6B4F", foto: "img_reforma-cozinha.jpg" },
  { site: "Atelier Prumo", nome: "Atelier Prumo", url: "atelierprumo.com.br/orcamento", cor: "#8A4B2A", foto: "img_reforma-sala-boho.jpg" },
];
const CAMPOS = ["Reforma de apartamento", "80 m² · Pinheiros, SP", "Início em 3 meses"];
const FORM = { x: 470, w: 420 };
const BTN_ENVIAR = naS(FORM.x + FORM.w / 2, BARRA + 562);

const SiteOrcamento: React.FC<{ t: number; s: (typeof SITES)[number]; envio: number }> = ({ t, s, envio }) => {
  const env = eo(seg(t, envio + 0.05, envio + 0.25));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", color: COR.texto }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 76, display: "flex", alignItems: "center", gap: 14, padding: "0 32px", borderBottom: `1px solid ${COR.linha}` }}>
        <Monograma tam={40} txt={s.site[0]} fundo={s.cor} />
        <b style={{ fontSize: 26 }}>{s.nome}</b>
      </div>
      <div style={{ position: "absolute", left: 0, top: 76, width: 420, bottom: 0, overflow: "hidden" }}>
        <Foto n={s.foto} />
      </div>
      <div style={{ position: "absolute", left: FORM.x, top: 150, width: FORM.w }}>
        <p style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Solicite um orçamento</p>
        {CAMPOS.map((c) => (
          <div key={c} style={{ height: 68, marginTop: 18, borderRadius: 12, border: "1.5px solid #C9D3E6", background: COR.autofill, display: "flex", alignItems: "center", padding: "0 20px", fontSize: 28, color: "#202124", whiteSpace: "nowrap", overflow: "hidden" }}>{c}</div>
        ))}
        <div style={{ position: "relative", height: 76, marginTop: 28, scale: String(clique(t, envio)) }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: s.cor, color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 30, fontWeight: 600, opacity: 1 - env }}>Enviar</div>
          <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "var(--ok)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 30, fontWeight: 600, opacity: env }}>
            <Svg tam={30} cor="#FFFFFF" d={D.check} largura={3.4} /> Enviado
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- 03 · Instagram ----------
const VIDEOS = [
  "b-roll_reforma-porta-aberta-01.mp4",
  "b-roll_sala-aconchegante-01.mp4",
  "b-roll_reforma-pintura-casal-01.mp4",
  "b-roll_arquiteto-planta-01.mp4",
  "b-roll_reforma-raspando-parede-01.mp4",
  "b-roll_arquiteta-maquete-01.mp4",
  "b-roll_reforma-escolhendo-cores-01.mp4",
  "b-roll_reforma-lixando-parede-01.mp4",
];
const VIDEO_ARQ = "b-roll_arquiteto-mostra-planta-01.mp4";
const FOTOS = [
  "img_reforma-sala-azul.jpg",
  "img_reforma-cozinha.jpg",
  "img_reforma-casa-fachada.jpg",
  "img_reforma-sala-quadros.jpg",
  "img_reforma-poltrona.jpg",
  "img_reforma-sala-janela.jpg",
  "img_reforma-integrado.jpg",
  "img_reforma-sala-boho.jpg",
];

// Explorar com poucas células grandes: 2 colunas em mosaico (a segunda deslocada meia célula).
const IG_TRILHO = 92; // barra lateral do Instagram web
const GRADE = { x: IG_TRILHO + 18, col: 406, gap: 8, alt: 500 };
const LINHA_ARQ = 5; // a grade para com o vídeo do arquiteto (coluna 0) no alto
type Tile = { x: number; y: number; w: number; h: number; video?: string; foto?: string; chave: string };
const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  let v = 0;
  let f = 0;
  for (let c = 0; c < 2; c++) {
    for (let r = 0; r < 8; r++) {
      const y = 18 + r * (GRADE.alt + GRADE.gap) - (c === 1 ? GRADE.alt / 2 : 0);
      const ehArq = c === 0 && r === LINHA_ARQ;
      const ehVideo = ehArq || (r + c) % 2 === 0;
      out.push({ x: GRADE.x + c * (GRADE.col + GRADE.gap), y, w: GRADE.col, h: GRADE.alt, video: ehArq ? VIDEO_ARQ : ehVideo ? VIDEOS[v++ % VIDEOS.length] : undefined, foto: ehVideo ? undefined : FOTOS[f++ % FOTOS.length], chave: `t${c}${r}` });
    }
  }
  return out;
})();
const ROLAGEM_ARQ = LINHA_ARQ * (GRADE.alt + GRADE.gap) - 70;
const TILE_ARQ = naS(GRADE.x + GRADE.col / 2, 18 + 70 + GRADE.alt / 2);

const TrilhoIG: React.FC<{ ativo: "explorar" | "inicio" | "perfil" }> = ({ ativo }) => (
  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: IG_TRILHO, borderRight: `1px solid ${COR.igLinha}`, background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 30, gap: 32 }}>
    <Logo n="logo_instagram.svg" w={40} />
    <div style={{ height: 6 }} />
    <Svg tam={32} d={D.casa} largura={ativo === "inicio" ? 3.2 : 2.2} />
    <Svg tam={32} d={D.lupa} largura={2.2} />
    <Svg tam={32} d={D.bussola} largura={ativo === "explorar" ? 3.2 : 2.2} />
    <Svg tam={32} d={D.reels} largura={2.2} />
    <Svg tam={32} d={D.mensagem} largura={2.2} />
    <div style={{ borderRadius: "50%", boxShadow: ativo === "perfil" ? "0 0 0 2px #111111" : undefined }}>
      <Avatar tam={34} retrato={CLIENTE_RETRATO} />
    </div>
  </div>
);

const IconeReel: React.FC = () => (
  <div style={{ position: "absolute", right: 14, top: 14, filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }}>
    <Svg tam={34} cor="#FFFFFF" d={D.reels} largura={2.4} />
  </div>
);

const Explorar: React.FC<{ t: number; m: MarcasJornada }> = ({ t, m }) => {
  let f = 0;
  m.swipes.forEach((s, i) => {
    f += eio(seg(t, s, s + (i >= 6 ? 0.3 : 0.55)));
  });
  const rola = (f / m.swipes.length) * ROLAGEM_ARQ;
  const foco = eo(seg(t, m.interessa - 0.8, m.interessa - 0.3)); // o resto cai para 40%
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, translate: `0px ${(-rola).toFixed(1)}px` }}>
        {TILES.filter((ti) => ti.y - rola < S.h + 20 && ti.y + ti.h - rola > -20).map((ti) => {
          const ordem = (ti.x - GRADE.x) / 400 + ti.y / 500;
          const k = eo(seg(t, m.abreInsta - 0.6 + ordem * 0.08, m.abreInsta - 0.1 + ordem * 0.08));
          const ehArq = ti.video === VIDEO_ARQ;
          return (
            <div key={ti.chave} style={{ position: "absolute", left: ti.x, top: ti.y, width: ti.w, height: ti.h, borderRadius: 6, overflow: "hidden", background: "#EFEFEF", opacity: k * (ehArq ? 1 : lerp(1, 0.4, foco)), scale: ehArq ? String(1 + 0.03 * foco) : undefined, zIndex: ehArq ? 2 : 1, boxShadow: ehArq && foco > 0 ? "0 18px 40px rgba(25,28,35,.25)" : undefined }}>
              {ti.video ? <Clipe n={ti.video} /> : <Foto n={ti.foto ?? FOTOS[0]} />}
              {ti.video ? <IconeReel /> : null}
            </div>
          );
        })}
      </div>
      <TrilhoIG ativo="explorar" />
    </div>
  );
};

// Reel aberto (modal do Instagram web): vídeo à esquerda, painel do autor à direita.
const MODAL = { x: 50, y: 60, video: 360, painel: 480, h: 710 };
const SEGUIR = naS(MODAL.x + MODAL.video + MODAL.painel - 60, MODAL.y + 44);
const ModalReel: React.FC<{ t: number; m: MarcasJornada }> = ({ t, m }) => {
  const seguindo = eo(seg(t, m.seguir + 0.08, m.seguir + 0.3));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.62)" }} />
      <div style={{ position: "absolute", left: MODAL.x, top: MODAL.y, width: MODAL.video, height: MODAL.h, overflow: "hidden", borderRadius: "6px 0 0 6px", background: "#000000" }}>
        <Clipe n={VIDEO_ARQ} />
      </div>
      <div style={{ position: "absolute", left: MODAL.x + MODAL.video, top: MODAL.y, width: MODAL.painel, height: MODAL.h, background: "#FFFFFF", borderRadius: "0 6px 6px 0", color: "#111111" }}>
        <div style={{ height: 88, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", borderBottom: `1px solid ${COR.igLinha}` }}>
          <Avatar tam={46} retrato={ARQ_RETRATO} />
          <b style={{ fontSize: 24, whiteSpace: "nowrap" }}>andre.lacerda.arq</b>
          <span style={{ position: "relative", marginLeft: "auto", width: 128, height: 34, flex: "none", fontSize: 26, fontWeight: 600, whiteSpace: "nowrap", scale: String(clique(t, m.seguir)) }}>
            <span style={{ position: "absolute", right: 0, top: 0, color: COR.igAzul, opacity: 1 - seguindo }}>Seguir</span>
            <span style={{ position: "absolute", right: 0, top: 0, color: "#111111", opacity: seguindo }}>Seguindo</span>
          </span>
        </div>
        <p style={{ padding: "26px 22px", fontSize: 30, lineHeight: 1.3 }}>O que você NÃO deve fazer na reforma da sua casa</p>
      </div>
    </div>
  );
};

const PERFIL_GRADE: { video?: string; foto?: string }[] = [
  { video: VIDEO_ARQ },
  { foto: "img_reforma-integrado.jpg" },
  { video: "b-roll_arquiteto-planta-01.mp4" },
  { foto: "img_reforma-sala-quadros.jpg" },
  { video: "b-roll_reforma-porta-aberta-01.mp4" },
  { foto: "img_reforma-casa-fachada.jpg" },
];
const Perfil: React.FC<{ t: number; m: MarcasJornada }> = ({ t, m }) => {
  const rola = eio(seg(t, m.fotos - 0.9, m.fotos - 0.1)) * 150;
  const curtida = seg(t, m.fotos + 0.1, m.fotos + 0.8);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", color: "#111111", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: IG_TRILHO, right: 0, top: 0, bottom: 0, translate: `0px ${(-rola).toFixed(1)}px` }}>
        <div style={{ position: "absolute", left: 60, top: 44 }}>
          <Avatar tam={150} retrato={ARQ_RETRATO} />
        </div>
        <div style={{ position: "absolute", left: 250, top: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <b style={{ fontSize: 32 }}>andre.lacerda.arq</b>
            <span style={{ padding: "8px 16px", borderRadius: 10, background: "#EFEFEF", fontSize: 22, fontWeight: 600 }}>Seguindo</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 600, marginTop: 18 }}>André Lacerda · Arquiteto</p>
          <p style={{ fontSize: 28, color: "#3C4043" }}>Reformas residenciais em São Paulo</p>
        </div>
        <div style={{ position: "absolute", left: 30, top: 290, width: 790, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {PERFIL_GRADE.map((g, i) => (
            <div key={`pg${i}`} style={{ position: "relative", height: 340, overflow: "hidden", background: "#EFEFEF" }}>
              {g.video ? <Clipe n={g.video} /> : <Foto n={g.foto ?? FOTOS[0]} />}
              {g.video ? <IconeReel /> : null}
              {i === 4 ? (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: curtida > 0 && curtida < 1 ? 1 : 0, scale: String(lerp(0.4, 1.12, eo(curtida))) }}>
                  <Svg tam={110} cor="#FFFFFF" d={D.coracao} cheio />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <TrilhoIG ativo="perfil" />
    </div>
  );
};

// Post em colaboração no feed (a foto do amigo com o arquiteto).
const PostAmigo: React.FC<{ t: number; m: MarcasJornada }> = ({ t, m }) => {
  const tag = eob(seg(t, m.foto, m.foto + 0.5), 1.4);
  const leg = eo(seg(t, m.fez - 0.1, m.fez + 0.4));
  const X = 220;
  const W = 580;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", color: "#111111" }}>
      <div style={{ position: "absolute", left: X, top: 28, width: W, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 78, height: 52 }}>
          <div style={{ position: "absolute", left: 0, top: 0 }}><Avatar tam={52} retrato={JULIA_RETRATO} /></div>
          <div style={{ position: "absolute", left: 26, top: 0, borderRadius: "50%", boxShadow: "0 0 0 3px #FFFFFF" }}><Avatar tam={52} retrato={ARQ_RETRATO} /></div>
        </div>
        <p style={{ fontSize: 28, lineHeight: 1.2 }}>
          <b>julia.mendes</b> e <b>andre.lacerda.arq</b>
        </p>
      </div>
      <div style={{ position: "absolute", left: X, top: 100, width: W, height: 580, overflow: "hidden", borderRadius: 4 }}>
        <Foto n="img_reforma-sala-quadros.jpg" />
        <div style={{ position: "absolute", left: 200, top: 420, padding: "10px 16px", borderRadius: 10, background: "var(--main)", color: "#FFFFFF", fontSize: 28, fontWeight: 600, ...pop(tag, 12), scale: String(lerp(0.9, 1, clamp01(tag)) + 0.1 * pulso(seg(t, m.foto + 0.45, m.foto + 1.0))) }}>andre.lacerda.arq</div>
      </div>
      <p style={{ position: "absolute", left: X, width: W, top: 704, fontSize: 30, lineHeight: 1.3, opacity: lerp(0.3, 1, leg) }}>
        <b>julia.mendes</b> Casa nova! Reforma feita com o <b>@andre.lacerda.arq</b>
      </p>
      <TrilhoIG ativo="inicio" />
    </div>
  );
};

// ---------- 04 / 06 · WhatsApp (só a conversa) ----------
type Msg = { de: "eu" | "ele"; t: number; txt?: string; linhas?: number; tipo?: "contato" | "convite" | "digitando"; ate?: number; hora: string };
const WA = { topo: 40, cab: 92, rodape: 84, margem: 40 };
const WA_BASE = S.h - WA.rodape - 22; // base da pilha de mensagens (as novas entram embaixo)
const altura = (mm: Msg) => (mm.tipo === "contato" ? 162 : mm.tipo === "convite" ? 190 : mm.tipo === "digitando" ? 58 : (mm.linhas ?? 1) * 42 + 46);
const BTN_CONVERSAR = naS(WA.margem + 190, WA_BASE - 30);
const BTN_PARTICIPAR = naS(WA.margem + 210, WA_BASE - 64);

const Bolha: React.FC<{ mm: Msg; t: number; toque?: number }> = ({ mm, t, toque }) => {
  const eu = mm.de === "eu";
  const base: React.CSSProperties = {
    position: "relative",
    whiteSpace: "pre",
    borderRadius: 14,
    borderTopRightRadius: eu ? 4 : 14,
    borderTopLeftRadius: eu ? 14 : 4,
    background: eu ? COR.waSaida : "#FFFFFF",
    boxShadow: "0 1px 1px rgba(11,20,26,.12)",
    fontSize: 32,
    lineHeight: "42px",
    color: "#111B21",
    boxSizing: "border-box",
  };
  const hora = (
    <span style={{ position: "absolute", right: 12, bottom: 6, display: "flex", alignItems: "center", gap: 4, fontSize: 17, color: "#667781" }}>
      {mm.hora}
      {eu ? <Svg tam={20} cor={COR.waLido} d="M3 17 L8 22 L18 10 M12 21 L13 22 L23 10" largura={2.2} /> : null}
    </span>
  );
  const qt = toque === undefined ? 1 : clique(t, toque);
  if (mm.tipo === "digitando") {
    return (
      <div style={{ ...base, padding: "19px 22px", display: "flex", gap: 8, width: 100 }}>
        {[0, 1, 2].map((d) => (
          <span key={d} style={{ width: 12, height: 12, borderRadius: "50%", background: "#8696A0", translate: `0px ${(-5 * pulso((((t * 2.2 - d * 0.18) % 1) + 1) % 1)).toFixed(1)}px` }} />
        ))}
      </div>
    );
  }
  if (mm.tipo === "contato") {
    return (
      <div style={{ ...base, width: 380, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px 24px" }}>
          <Avatar tam={62} retrato={ARQ_RETRATO} />
          <div style={{ lineHeight: 1.2 }}>
            <b style={{ fontSize: 30 }}>André Lacerda</b>
            <p style={{ fontSize: 22, color: "#667781" }}>Arquiteto</p>
          </div>
        </div>
        {hora}
        <div style={{ borderTop: "1px solid #E9EDEF", height: 58, display: "grid", placeItems: "center", fontSize: 28, fontWeight: 600, color: COR.waVerde, scale: String(qt) }}>Conversar</div>
      </div>
    );
  }
  if (mm.tipo === "convite") {
    return (
      <div style={{ ...base, width: 420, overflow: "hidden", padding: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 12px", borderRadius: 10, background: "#F5F6F6" }}>
          <Logo n="logo_google_meet.svg" w={48} />
          <b style={{ fontSize: 28 }}>Projeto da reforma</b>
        </div>
        <div style={{ margin: "10px 4px 28px", height: 60, borderRadius: 12, border: `1.5px solid ${COR.waVerde}`, color: COR.waVerde, display: "grid", placeItems: "center", fontSize: 28, fontWeight: 600, scale: String(qt) }}>Participar</div>
        {hora}
      </div>
    );
  }
  return (
    <div style={{ ...base, padding: "10px 20px 32px" }}>
      {mm.txt}
      {hora}
    </div>
  );
};

const Conversa: React.FC<{ t: number; msgs: Msg[]; toque?: number }> = ({ t, msgs, toque }) => {
  let acum = 0;
  const pos = [...msgs]
    .reverse()
    .map((mm) => {
      const k = eo(seg(t, mm.t, mm.t + 0.32));
      const sai = mm.ate === undefined ? 0 : eo(seg(t, mm.ate, mm.ate + 0.2));
      const vis = k * (1 - sai);
      const y = WA_BASE - acum - altura(mm);
      acum += (altura(mm) + 14) * vis;
      return { mm, k, vis, y };
    })
    .reverse();
  return (
    <>
      {pos.map(({ mm, k, vis, y }) => {
        if (vis <= 0.001 || y < WA.topo + WA.cab - 220) return null;
        const eu = mm.de === "eu";
        return (
          <div key={`m${mm.t}`} style={{ position: "absolute", top: y, left: eu ? undefined : WA.margem, right: eu ? WA.margem : undefined, display: "flex", justifyContent: eu ? "flex-end" : "flex-start", transformOrigin: eu ? "100% 100%" : "0 100%", ...pop(k, 14), opacity: clamp01(k * 1.6) * vis }}>
            <Bolha mm={mm} t={t} toque={mm.tipo === "contato" || mm.tipo === "convite" ? toque : undefined} />
          </div>
        );
      })}
    </>
  );
};

const WhatsApp: React.FC<{ t: number; nome: string; retrato?: string; letra?: string; status: string; msgs: Msg[]; toque?: number }> = ({ t, nome, retrato, letra, status, msgs, toque }) => (
  <div style={{ position: "absolute", inset: 0, background: COR.waFundo, color: "#111B21" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(84,101,111,.07) 2px, transparent 2.4px)", backgroundSize: "28px 28px" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: WA.topo, background: "#F0F2F5", display: "flex", alignItems: "center", gap: 9, padding: "0 18px" }}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <span key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c }} />
      ))}
    </div>
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: `inset(${WA.topo + WA.cab}px 0px ${WA.rodape}px 0px)` }}>
      <Conversa t={t} msgs={msgs} toque={toque} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: WA.topo, height: WA.cab, background: "#F0F2F5", display: "flex", alignItems: "center", gap: 18, padding: "0 28px", borderBottom: "1px solid #E9EDEF" }}>
      <Logo n="logo_whatsapp.svg" w={40} />
      <Avatar tam={58} retrato={retrato} letra={letra} fundo="#B7791F" />
      <div style={{ lineHeight: 1.15 }}>
        <b style={{ fontSize: 30 }}>{nome}</b>
        <p style={{ fontSize: 22, color: status === "digitando…" ? COR.waVerde : "#667781" }}>{status}</p>
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: WA.rodape, background: "#F0F2F5", display: "flex", alignItems: "center", gap: 16, padding: "0 28px" }}>
      <div style={{ flex: 1, height: 54, borderRadius: 27, background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 24px", fontSize: 22, color: "#8696A0" }}>Digite uma mensagem</div>
      <Svg tam={30} cor="#54656F" d={D.mic} largura={2} />
    </div>
  </div>
);

// ---------- 05 · Reclame Aqui (só o essencial) e nota do Google ----------
const ReclameAqui: React.FC<{ t: number; m: MarcasJornada }> = ({ t, m }) => {
  const destaque = eob(seg(t, m.reclamacao - 0.15, m.reclamacao + 0.4), 1.6);
  const card = eob(seg(t, m.reclameAqui + 0.1, m.reclameAqui + 0.6), 1.4);
  const stats = eob(seg(t, m.reclameAqui + 0.4, m.reclameAqui + 0.9), 1.4);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F7F8FA", color: "#1F2937", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 80, background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", padding: "0 36px" }}>
        <Img src={arq("logo_reclameaqui.png")} style={{ height: 34, display: "block" }} />
      </div>
      {/* empresa */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 130, display: "flex", alignItems: "center", gap: 28, ...pop(card, 18) }}>
        <div style={{ width: 128, height: 128, flex: "none", borderRadius: 18, background: "#FFFFFF", border: "1px solid #E5E7EB", display: "grid", placeItems: "center" }}>
          <Monograma tam={96} txt="AL" fundo="var(--ground)" raio={12} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <b style={{ fontSize: 40, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>André Lacerda Arquitetura</b>
            <Svg tam={34} cor="#1E4FD8" d={D.escudo} largura={2.4} />
          </div>
          <p style={{ fontSize: 26, color: "#4B5563", marginTop: 4 }}>Arquitetura e reformas · São Paulo</p>
        </div>
      </div>
      {/* reputação e reclamações */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 340, display: "flex", gap: 24, ...pop(stats, 18) }}>
        <div style={{ flex: 1, height: 230, borderRadius: 20, background: "#F1F9E8", border: "1px solid #CFE6B4", padding: "30px 34px", boxSizing: "border-box" }}>
          <p style={{ fontSize: 26, color: "#4B5563" }}>Reputação</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
            <svg width="64" height="64" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" style={{ fill: "#7CC242" }} />
              <circle cx="14" cy="16" r="2.4" style={{ fill: "#1F2937" }} />
              <circle cx="26" cy="16" r="2.4" style={{ fill: "#1F2937" }} />
              <path d="M12 23 C15 29 25 29 28 23" style={{ fill: "none", stroke: "#1F2937", strokeWidth: 2.6, strokeLinecap: "round" }} />
            </svg>
            <b style={{ fontSize: 56, letterSpacing: "-0.02em" }}>ÓTIMO</b>
          </div>
        </div>
        <div style={{ position: "relative", flex: 1, height: 230, borderRadius: 20, background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "30px 34px", boxSizing: "border-box", scale: String(1 + 0.05 * clamp01(destaque)), boxShadow: destaque > 0.01 ? "0 18px 40px rgba(25,28,35,.14)" : undefined }}>
          <div style={{ position: "absolute", inset: -3, borderRadius: 22, border: "3px solid var(--main)", opacity: clamp01(destaque) }} />
          <p style={{ fontSize: 26, color: "#4B5563" }}>Reclamações</p>
          <p className="nd-num" style={{ fontSize: 110, fontWeight: 600, lineHeight: 1, marginTop: 8, color: destaque > 0.5 ? "var(--main)" : "#1F2937" }}>0</p>
        </div>
      </div>
    </div>
  );
};

// Nota do Google (satélite pequeno): logo, nota, estrelas, número de avaliações.
const NotaGoogle: React.FC<{ t: number; m: MarcasJornada }> = ({ t, m }) => {
  const nota = eio(seg(t, m.avaliacoes + 0.2, m.avaliacoes + 1.2));
  return (
    <div style={{ ...VIDRO, display: "flex", alignItems: "center", gap: 22, padding: "22px 30px", whiteSpace: "nowrap" }}>
      <Logo n="logo_google_g.svg" w={44} />
      <p className="nd-num" style={{ fontSize: 64, fontWeight: 600, lineHeight: 1 }}>{lerp(4.0, 4.9, nota).toFixed(1).replace(".", ",")}</p>
      <div>
        <Estrelas n={5} tam={28} />
        <p className="nd-num" style={{ fontSize: 26, color: COR.mudo, marginTop: 6 }}>{Math.round(lerp(12, 38, nota))} avaliações no Google</p>
      </div>
    </div>
  );
};

// ---------- 06 · Meet e proposta ----------
// Chamada: janela menor que a tela, dividida entre as duas pessoas do mesmo tamanho (arquiteto | Você), conversando.
const MEET = { w: 860, h: 560, x: (S.w - 860) / 2, y: (S.h - 560) / 2 }; // relativo a S; respiro até a câmera
const MEET_PAD = 14;
const TileMeet: React.FC<{ n: string; nome: string; zoom: number }> = ({ n, nome, zoom }) => ( // nome acima da barra da sessão
  <div style={{ position: "relative", flex: 1, borderRadius: 16, overflow: "hidden", background: "#3C4043" }}>
    <Clipe n={n} style={{ objectPosition: "50% 35%", scale: String(zoom), transformOrigin: "50% 30%" }} />
    <div style={{ position: "absolute", left: 16, bottom: 58, padding: "6px 14px", borderRadius: 10, background: "rgba(32,33,36,.6)", color: "#FFFFFF", fontSize: 28, fontWeight: 500, whiteSpace: "nowrap" }}>{nome}</div>
  </div>
);
const Meet: React.FC<{ t: number; m: MarcasJornada }> = ({ t, m }) => {
  const zoom = 1.02 + 0.02 * clamp01((t - m.meet) / 6);
  return (
    <div style={{ position: "absolute", inset: 0, background: COR.meetFundo, padding: MEET_PAD, boxSizing: "border-box", display: "flex", gap: MEET_PAD }}>
      <TileMeet n={ARQ_CHAMADA} nome="André Lacerda" zoom={zoom + 0.1} />
      <TileMeet n={CLIENTE_CHAMADA} nome="Você" zoom={zoom} />
    </div>
  );
};

const PROP = { w: 600, h: 640 };
const PROP_X = (S.w - PROP.w) / 2;
const PROP_Y = (S.h - PROP.h) / 2;
const BTN_ACEITAR = naS(PROP_X + PROP.w / 2, PROP_Y + PROP.h - 44 - 42);
const Proposta: React.FC<{ t: number; p: InterfaceJornadaProps }> = ({ t, p }) => {
  const m = p.m;
  const [v1, v2, v3, v4] = m.valores;
  const passo = (a: number) => eio(seg(t, a, a + 0.3));
  const valor = Math.round(((p.proposta / 4) * (1 + passo(v2) + passo(v3) + passo(v4))) / 500) * 500;
  const contou = eo(seg(t, v1 - 0.2, v1));
  const chave = eob(seg(t, v4, v4 + 0.5), 1.6); // momento-chave: R$ 40 mil
  const aceito = eo(seg(t, m.aceita + 0.05, m.aceita + 0.3));
  return (
    <div style={{ position: "absolute", left: PROP_X, top: PROP_Y, width: PROP.w, height: PROP.h, borderRadius: 22, background: "#FFFFFF", boxShadow: "0 30px 80px rgba(0,0,0,.35)", overflow: "hidden", color: COR.texto }}>
      <div style={{ padding: "44px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Monograma tam={52} txt="AL" fundo="var(--ground)" />
          <b style={{ fontSize: 28 }}>André Lacerda Arquitetura</b>
        </div>
        <p style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 40 }}>Proposta comercial</p>
        <p style={{ fontSize: 30, color: "var(--muted)", marginTop: 6 }}>Reforma · apartamento 80 m²</p>
        <p style={{ fontSize: 28, color: "var(--muted)", marginTop: 40 }}>Investimento</p>
        <p className="nd-num" style={{ fontSize: 96, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.05, opacity: lerp(0.25, 1, contou), scale: String(1 + 0.12 * pulso(clamp01(chave))), transformOrigin: "0 60%" }}>
          R$ {brl(valor)}
        </p>
      </div>
      <div style={{ position: "absolute", left: 48, right: 48, bottom: 44, height: 84, scale: String(clique(t, m.aceita)) }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "var(--ground)", color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 600, opacity: 1 - aceito }}>Aceitar proposta</div>
        <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "var(--main)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 32, fontWeight: 600, opacity: aceito, scale: String(lerp(1.12, 1, eob(aceito, 2))) }}>
          <Svg tam={34} cor="#FFFFFF" d={D.check} largura={3.6} /> Proposta aceita
        </div>
      </div>
    </div>
  );
};

// ---------- cena ----------
export const InterfaceJornada: React.FC<InterfaceJornadaProps> = (p) => {
  const t = useT();
  const m = p.m;
  const inicios = [0, m.form, m.insta, m.zap, m.verifica, m.zap2];

  // telas principais
  const W = {
    nav1: janela(t, 0, m.insta),
    ig: janela(t, m.insta, m.zap),
    wa: janela(t, m.zap, m.verifica),
    nav2: janela(t, m.verifica, m.zap2),
    wa2: janela(t, m.zap2, m.meet),
    meet: janela(t, m.meet, p.dur + 1),
  };

  // 01–02 · navegador: Google → sites
  const fimBusca = m.digitaBusca[1] + 0.25;
  const visitado = [m.sites + 0.25, m.sites + 0.65, m.sites + 1.05];
  const fimSite = [m.envios[0] + 0.2, m.envios[1] + 0.2, 1e9];
  const iniSite = [m.form, fimSite[0], fimSite[1]];
  const siteAtual = t < fimSite[0] ? 0 : t < fimSite[1] ? 1 : 2;
  const abas1: Aba[] = [
    { icone: <Logo n="logo_google_g.svg" w={20} />, titulo: "Google", k: 1 },
    ...SITES.map((s, i) => ({ icone: <Monograma tam={20} txt={s.site[0]} fundo={s.cor} raio={5} />, titulo: s.nome, k: eob(seg(t, visitado[i] - 0.05, visitado[i] + 0.25), 1.6) })),
  ];
  const ativa1 = t < m.form ? 0 : 1 + siteAtual;
  const url1 = t < m.form ? (t < fimBusca ? "google.com" : "google.com/search?q=arquitetos+na+minha+regiao") : SITES[siteAtual].url;

  // 05 · navegador: Google → Reclame Aqui
  const naRA = t >= m.reclameAqui - 0.1;
  const abas2: Aba[] = [
    { icone: <Logo n="logo_google_g.svg" w={20} />, titulo: "Google", k: 1 },
    { icone: <Logo n="logo_reclameaqui_icone.png" w={20} />, titulo: "Reclame AQUI", k: eob(seg(t, m.reclameAqui - 0.2, m.reclameAqui + 0.1), 1.6) },
  ];
  const url2 = naRA ? "reclameaqui.com.br/empresa/andre-lacerda-arquitetura" : "google.com";

  // 03 · Instagram: subtelas
  const fimModal = m.abrePerfil + 1.4;
  const IG = {
    explorar: pagina(t, m.insta, fimModal + 0.1, 0),
    modal: sat(t, m.interessa + 0.05, fimModal, 0),
    perfil: pagina(t, fimModal, m.amigo + 0.3),
    post: pagina(t, m.amigo + 0.3, m.zap + 1),
  };

  // 04 / 06 · WhatsApp
  const msgsJ: Msg[] = [
    { de: "eu", t: m.msgs[0], linhas: 2, txt: "Júlia, vi a foto da sua reforma\ncom o André!", hora: "19:02" },
    { de: "eu", t: m.msgs[1], linhas: 1, txt: "Ele é bom? Gostou do trabalho?", hora: "19:02" },
    { de: "eu", t: m.msgs[2], linhas: 1, txt: "Me recomenda? Posso chamar?", hora: "19:03" },
    { de: "ele", t: m.digitando, tipo: "digitando", ate: m.digitando + 1.0, hora: "" },
    { de: "ele", t: m.digitando + 1.05, linhas: 1, txt: "Recomendo demais!", hora: "19:04" },
    { de: "ele", t: m.contato, tipo: "contato", hora: "19:04" },
  ];
  const msgsA: Msg[] = [
    { de: "eu", t: m.conversar + 0.3, linhas: 1, txt: "Oi, André! A Júlia me indicou.", hora: "19:06" },
    { de: "ele", t: m.conversar + 0.9, linhas: 1, txt: "Oi! Me conta do projeto.", hora: "19:07" },
    { de: "eu", t: m.pedeOrcamento, linhas: 1, txt: "Me passa um orçamento?", hora: "19:12" },
    { de: "ele", t: m.chama, linhas: 1, txt: "Bora uma call pra eu entender?", hora: "19:13" },
    { de: "ele", t: m.chama + 0.5, tipo: "convite", hora: "19:13" },
  ];
  const naAndre = t >= m.conversar;
  const statusJ = t >= m.digitando && t < m.digitando + 1.0 ? "digitando…" : "online";
  const statusA = (t >= m.conversar + 0.6 && t < m.conversar + 0.9) || (t >= m.chama - 0.6 && t < m.chama) ? "digitando…" : "online";

  // satélites: no máximo 1 por vez (na chamada, selo + barra)
  const SAT = {
    enviados: sat(t, m.envios[0] + 0.08, m.aguarde - 0.1),
    email: sat(t, m.aguarde, m.insta - 0.1),
    respostas: sat(t, m.enquanto + 0.1, m.enxurrada),
    google: sat(t, m.avaliacoes, m.reclamacao - 0.2),
    emChamada: sat(t, m.meet + 0.5, m.fecha),
    barra: sat(t, m.meet + 0.3, m.fecha),
    proposta: sat(t, m.fecha, p.dur + 1, 40),
  };
  const nEnviados = m.envios.filter((e) => t >= e + 0.08).length;
  const dimMeet = eio(seg(t, m.fecha - 0.1, m.fecha + 0.4));
  const timer = 18 * 60 + 32 + Math.max(0, Math.floor(t - m.meet));
  const relogio = `00:${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;

  // cursor
  const R = (i: number): [number, number] => naS(400, BARRA + RES_Y(i) + 74);
  const cliques = [visitado[0], visitado[1], visitado[2], ...m.envios, m.interessa, m.seguir, m.conversar - 0.25, m.meet - 0.3, m.aceita];
  const visivel =
    (t > m.sites - 0.4 && t < m.envios[2] + 0.6) ||
    (t > m.interessa - 0.9 && t < m.seguir + 0.5) ||
    (t > m.conversar - 1.0 && t < m.conversar + 0.2) ||
    (t > m.meet - 1.0 && t < m.meet - 0.05) ||
    (t > m.aceita - 1.0 && t < m.aceita + 0.9);

  const tela = (st: React.CSSProperties, fundo = "#FFFFFF"): React.CSSProperties => ({ position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", background: fundo, boxShadow: SOMBRA_TELA, ...st });

  return (
    <Palco>
      <div className="nd-fundo">
        <div className="nd-papel" />
        <div className="nd-papel-pontos" />

        <Trilha t={t} inicios={inicios} />

        {/* tela principal */}
        <div style={{ position: "absolute", left: S.x, top: S.y, width: S.w, height: S.h }}>
          {W.nav1.on ? (
            <div style={tela(W.nav1.style)}>
              <Navegador abas={abas1} ativa={ativa1} url={url1}>
                {t < m.form + 0.3 ? (
                  <div style={{ position: "absolute", inset: 0, ...pagina(t, 0, m.form).style }}>
                    {t < fimBusca + 0.3 ? (
                      <div style={{ position: "absolute", inset: 0, opacity: 1 - eo(seg(t, fimBusca, fimBusca + 0.3)) }}>
                        <GoogleInicio t={t} texto={digitar(p.busca, t, m.digitaBusca[0], m.digitaBusca[1])} caret />
                      </div>
                    ) : null}
                    {t >= fimBusca ? (
                      <div style={{ position: "absolute", inset: 0, opacity: eo(seg(t, fimBusca, fimBusca + 0.3)) }}>
                        <GoogleResultados t={t} busca={p.busca} inicio={fimBusca + 0.1} visitado={visitado} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {SITES.map((s, i) => {
                  const pg = pagina(t, iniSite[i], fimSite[i], 50);
                  return pg.on ? (
                    <div key={s.site} style={{ position: "absolute", inset: 0, ...pg.style }}>
                      <SiteOrcamento t={t} s={s} envio={m.envios[i]} />
                    </div>
                  ) : null;
                })}
              </Navegador>
            </div>
          ) : null}

          {W.ig.on ? (
            <div style={tela(W.ig.style)}>
              {IG.explorar.on ? <div style={{ position: "absolute", inset: 0, ...IG.explorar.style }}><Explorar t={t} m={m} /></div> : null}
              {IG.modal.on ? (
                <div style={{ position: "absolute", inset: 0, opacity: IG.modal.style.opacity, scale: String(lerp(0.7, 1, eo(seg(t, m.interessa + 0.05, m.interessa + 0.5)))), transformOrigin: `${TILE_ARQ[0] - S.x}px ${TILE_ARQ[1] - S.y}px` }}>
                  <ModalReel t={t} m={m} />
                </div>
              ) : null}
              {IG.perfil.on ? <div style={{ position: "absolute", inset: 0, ...IG.perfil.style }}><Perfil t={t} m={m} /></div> : null}
              {IG.post.on ? <div style={{ position: "absolute", inset: 0, ...IG.post.style }}><PostAmigo t={t} m={m} /></div> : null}
            </div>
          ) : null}

          {W.wa.on ? (
            <div style={tela(W.wa.style, COR.waFundo)}>
              {!naAndre || t < m.conversar + 0.2 ? (
                <div style={{ position: "absolute", inset: 0, opacity: 1 - eo(seg(t, m.conversar, m.conversar + 0.2)) }}>
                  <WhatsApp t={t} nome="Júlia Mendes" retrato={JULIA_RETRATO} status={statusJ} msgs={msgsJ} toque={m.conversar - 0.25} />
                </div>
              ) : null}
              {naAndre ? (
                <div style={{ position: "absolute", inset: 0, opacity: eo(seg(t, m.conversar, m.conversar + 0.25)) }}>
                  <WhatsApp t={t} nome="André Lacerda" retrato={ARQ_RETRATO} status={statusA} msgs={msgsA} />
                </div>
              ) : null}
            </div>
          ) : null}

          {W.nav2.on ? (
            <div style={tela(W.nav2.style)}>
              <Navegador abas={abas2} ativa={naRA ? 1 : 0} url={url2}>
                {t < m.reclameAqui + 0.3 ? (
                  <div style={{ position: "absolute", inset: 0, opacity: 1 - eo(seg(t, m.reclameAqui - 0.05, m.reclameAqui + 0.3)) }}>
                    <GoogleInicio t={t} texto={digitar(p.buscaRA, t, m.digitaRA[0], m.digitaRA[1])} caret />
                  </div>
                ) : null}
                {naRA ? (
                  <div style={{ position: "absolute", inset: 0, ...pagina(t, m.reclameAqui, 1e9, 50).style }}>
                    <ReclameAqui t={t} m={m} />
                  </div>
                ) : null}
              </Navegador>
            </div>
          ) : null}

          {W.wa2.on ? (
            <div style={tela(W.wa2.style, COR.waFundo)}>
              <WhatsApp t={t} nome="André Lacerda" retrato={ARQ_RETRATO} status={statusA} msgs={msgsA} toque={m.meet - 0.3} />
            </div>
          ) : null}

          {W.meet.on ? (
            <div style={{ ...tela(W.meet.style, COR.meetFundo), inset: "auto", left: MEET.x, top: MEET.y, width: MEET.w, height: MEET.h }}>
              <div style={{ position: "absolute", inset: 0, opacity: lerp(1, 0.35, dimMeet) }}>
                <Meet t={t} m={m} />
              </div>
            </div>
          ) : null}
        </div>

        {/* satélites (sobre as bordas da tela principal) */}
        {SAT.enviados.on ? (
          <div style={{ position: "absolute", left: S.x + 40, top: S.y + S.h - 50, ...SAT.enviados.style }}>
            <div style={{ ...VIDRO, borderRadius: 24, padding: "18px 28px", display: "flex", alignItems: "center", gap: 16, whiteSpace: "nowrap" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ok)", display: "grid", placeItems: "center" }}>
                <Svg tam={24} cor="#FFFFFF" d={D.check} largura={3.6} />
              </div>
              <span className="nd-num" style={{ fontSize: 30, fontWeight: 500 }}>
                Orçamento enviado · <b>{nEnviados} de 3</b>
              </span>
            </div>
          </div>
        ) : null}
        {SAT.email.on ? (
          <div style={{ position: "absolute", left: S.x + S.w - 640, top: 40, width: 600, padding: "24px 30px", boxSizing: "border-box", ...VIDRO, ...SAT.email.style }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Svg tam={30} cor={COR.mudo} d={D.envelope} largura={2.2} />
              <span style={{ fontSize: 24, color: COR.mudo }}>Resposta automática</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.01em", marginTop: 12, lineHeight: 1.25 }}>
              Retornaremos em até <span style={{ color: "var(--main)" }}>5 dias úteis</span>.
            </p>
          </div>
        ) : null}
        {SAT.respostas.on ? (
          <div style={{ position: "absolute", left: S.x + 40, top: S.y + S.h - 150, padding: "24px 32px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 22, ...VIDRO, ...SAT.respostas.style }}>
            <Svg tam={40} cor={COR.mudo} d={D.envelope} largura={2.2} />
            <div>
              <p style={{ fontSize: 26, color: COR.mudo }}>3 orçamentos · há 3 dias</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4, scale: String(1 + 0.12 * pulso(seg(t, m.responderam, m.responderam + 0.6))), transformOrigin: "0 60%" }}>
                <p className="nd-num" style={{ fontSize: 72, fontWeight: 600, lineHeight: 1, color: "var(--main)" }}>0</p>
                <p style={{ fontSize: 34, fontWeight: 600 }}>respostas</p>
              </div>
            </div>
          </div>
        ) : null}
        {SAT.google.on ? (
          <div style={{ position: "absolute", left: S.x + 60, top: S.y + S.h - 70, ...SAT.google.style }}>
            <NotaGoogle t={t} m={m} />
          </div>
        ) : null}
        {SAT.emChamada.on ? (
          <div style={{ position: "absolute", left: S.x + MEET.x - 40, top: S.y + MEET.y - 30, padding: "14px 26px 14px 20px", display: "flex", alignItems: "center", gap: 14, ...VIDRO_ESCURO, borderRadius: 40, ...SAT.emChamada.style }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: COR.meetVermelho, opacity: 0.55 + 0.45 * pulso((t * 0.8) % 1) }} />
            <b style={{ fontSize: 28, letterSpacing: "0.02em" }}>Em chamada</b>
          </div>
        ) : null}
        {SAT.barra.on ? (
          <div style={{ position: "absolute", left: S.x + (S.w - 680) / 2, top: S.y + MEET.y + MEET.h - 32, width: 680, height: 96, padding: "0 18px 0 30px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 18, ...VIDRO_ESCURO, borderRadius: 30, ...SAT.barra.style }}>
            <span style={{ fontSize: 28, fontWeight: 500, whiteSpace: "nowrap" }}>Projeto da reforma</span>
            <span className="nd-num" style={{ fontSize: 26, color: "rgba(255,255,255,.75)", fontFamily: "var(--mono)", marginLeft: 10 }}>{relogio}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
              {[D.cam, D.mic].map((d) => (
                <div key={d} style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "grid", placeItems: "center" }}>
                  <Svg tam={26} cor="#FFFFFF" d={d} largura={2.2} />
                </div>
              ))}
              <div style={{ width: 80, height: 56, borderRadius: 28, background: COR.meetVermelho, display: "grid", placeItems: "center" }}>
                <Svg tam={32} cor="#FFFFFF" d={D.fone} cheio largura={1} />
              </div>
            </div>
          </div>
        ) : null}
        {SAT.proposta.on ? (
          <div style={{ position: "absolute", left: S.x, top: S.y, ...SAT.proposta.style }}>
            <Proposta t={t} p={p} />
          </div>
        ) : null}

        {cliques.map((c, i) => {
          const pos: [number, number] = i < 3 ? R(i) : i < 6 ? BTN_ENVIAR : i === 6 ? TILE_ARQ : i === 7 ? SEGUIR : i === 8 ? BTN_CONVERSAR : i === 9 ? BTN_PARTICIPAR : BTN_ACEITAR;
          return <Ripple key={`rp${i}`} t={t} clique={c} x={pos[0]} y={pos[1]} tamanho={80} />;
        })}
        <Cursor
          t={t}
          chaves={[
            [0, 1000, 1000],
            [m.sites - 0.4, 1000, 1000],
            [visitado[0] - 0.1, ...R(0)],
            [visitado[1] - 0.1, ...R(1)],
            [visitado[2] - 0.1, ...R(2)],
            [m.envios[0] - 0.1, ...BTN_ENVIAR],
            [m.envios[2] + 0.6, BTN_ENVIAR[0] + 40, BTN_ENVIAR[1] + 60],
            [m.interessa - 0.9, 1000, 800],
            [m.interessa - 0.1, ...TILE_ARQ],
            [m.seguir - 0.1, ...SEGUIR],
            [m.seguir + 0.5, SEGUIR[0] - 30, SEGUIR[1] + 80],
            [m.conversar - 1.0, 1000, 900],
            [m.conversar - 0.3, ...BTN_CONVERSAR],
            [m.meet - 1.0, 1000, 900],
            [m.meet - 0.35, ...BTN_PARTICIPAR],
            [m.aceita - 1.0, 1150, 1000],
            [m.aceita - 0.1, ...BTN_ACEITAR],
            [m.aceita + 0.9, BTN_ACEITAR[0] + 60, BTN_ACEITAR[1] + 120],
          ]}
          cliques={cliques}
          visivel={visivel}
        />
      </div>
      <CameraCard camera={p.camera} dur={p.dur} />
    </Palco>
  );
};

// Parâmetros da aula 01 (câmera e marcas ancoradas nas palavras faladas; tempos do vídeo editado, cena começa em 397,3 s).
// Exemplo de preenchimento (vídeo de demonstração do criador do sistema). A câmera e as imagens citadas
// não vêm no repositório: use como modelo de parâmetros, não registre no Root sem trocar pelos arquivos do seu vídeo.
const cam = (inicio: number) => ({ src: "01-meu-primeiro-video/editado.mp4", inicio });
export const interfaceAula01: InterfaceJornadaProps = {
  camera: cam(397.3),
  dur: 80.1,
  busca: "arquitetos na minha região",
  buscaRA: "andré lacerda arquitetura reclame aqui",
  proposta: 40000,
  m: {
    digitaBusca: [1.2, 3.3],
    sites: 4.1,
    form: 5.6,
    envios: [5.95, 6.3, 6.75],
    aguarde: 8.0,
    insta: 12.3,
    abreInsta: 13.6,
    swipes: [15.6, 17.3, 18.7, 20.4, 22.5, 26.0, 29.4, 29.75, 30.1, 30.45, 30.8, 31.15],
    arquitetos: 18.4,
    enquanto: 23.8,
    responderam: 26.9,
    enxurrada: 29.7,
    interessa: 33.9,
    abrePerfil: 35.0,
    seguir: 35.3,
    fotos: 37.8,
    amigo: 39.6,
    foto: 42.5,
    fez: 43.9,
    zap: 45.3,
    msgs: [46.2, 49.3, 51.7],
    digitando: 52.4,
    contato: 54.1,
    conversar: 55.3,
    verifica: 56.6,
    digitaRA: [59.6, 61.0],
    reclameAqui: 61.2,
    avaliacoes: 63.0,
    reclamacao: 65.4,
    zap2: 67.8,
    pedeOrcamento: 69.2,
    chama: 70.6,
    meet: 72.4,
    fecha: 74.0,
    valores: [75.0, 75.5, 76.0, 76.4],
    aceita: 77.1,
  },
};
