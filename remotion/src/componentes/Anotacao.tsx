// `anotacao` (setup/elementos.md): desenho sobre a imagem, sem bloco de interface. Duas variações:
// `AnotacaoObjetos` (objetos físicos desenhados que se acumulam + a consequência vazia) e
// `AnotacaoCaminho` (trilha tracejada desenhada de "você" até a bandeira com check).
// Desenhadas em 1920×1080; batidas em segundos desde o início da cena (palavra falada − inicio).
import React from "react";
import { CameraCheia, Palco, Traco, useT, type Camera } from "./comum";
import { cores, fonteMao, fonteMono } from "../marca";
import { clamp01, eio, eo, lerp, pulso, seg, tremido } from "../movimento";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// AnotacaoObjetos
// Raciocínio: o que a pessoa ACUMULOU (títulos, estrutura) contra o que isso RENDE quando ela fica parada.
// Os documentos caem em leque à esquerda do rosto, um por palavra, como objetos de verdade (papel, ouro,
// couro); o porta-retrato do lugar bonito fecha a pilha. Na palavra da passividade a pilha recua e escurece
// e entra à direita a agenda da semana vazia, com uma linha do "agora" descendo (o tempo passa, ninguém chega)
// e um único selo laranja com a consequência ("0 atendimentos").
// Quando usar: fala que lista credenciais/investimentos e termina na falta de resultado por esperar o cliente.
// Quando não usar: lista sem virada (vai de `lista`); dado numérico a comparar (vai de `grafico`); mais de
// 4 documentos (o leque só tem 4 lugares + o porta-retrato).
// Origem: cena d24-passividade da aula 01 (2026-11-12; promovida ao catálogo em 2026-11-13). Ref.
// interface_tivita-documentos-01 (pilha) e interface_tivita-agenda-04 (agenda). Câmera cheia, rosto no centro.
// Props:
//   camera, dur      vídeo de fundo (câmera cheia) e duração da cena.
//   documentos       até 4, na ordem do leque: modelo do desenho, texto gravado nele e batida em que cai.
//   quadro           porta-retrato do consultório: batida em que cai (`t`) e em que o reflexo passa (`brilho`).
//   agenda           batida em que entra (`t`, a pilha recua junto), título, período, dias [sigla, número],
//                    horas da coluna, texto do selo laranja e batida do selo (`tSelo`).
//   saida            batida em que tudo sai (0,4 s com ease-in).
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════

export type ModeloDocumento = "certificado" | "retrato" | "faixa" | "pasta";
export type DocumentoObjeto = { modelo: ModeloDocumento; titulo: string; t: number };
export type AnotacaoObjetosProps = {
  camera: Camera;
  dur: number;
  documentos: DocumentoObjeto[];
  quadro: { t: number; brilho: number };
  agenda: { t: number; titulo: string; periodo: string; dias: [string, string][]; horas: string[]; selo: string; tSelo: number };
  saida: number;
};

// Papel e tinta dos objetos (fora da paleta de interface: são objetos físicos; laranja fica só no selo da agenda).
const PAPEL = "#FBF8F1";
const TINTA = "#2B2F38";
const OURO = "#C4A15E";
const OURO_ESC = "#9C7C3E";
const MARINHO = "#22324B";
const SOMBRA_OBJETO = "0 26px 50px rgba(0,0,0,.42), 0 4px 10px rgba(0,0,0,.25)";

// Selo dourado com fitas.
const Selo: React.FC<{ tam: number; fitas?: boolean }> = ({ tam, fitas = true }) => {
  const pontas = 22;
  const pts = Array.from({ length: pontas * 2 }, (_, i) => {
    const a = (i / (pontas * 2)) * Math.PI * 2;
    const raio = i % 2 === 0 ? 48 : 42;
    return `${(50 + raio * Math.cos(a)).toFixed(1)},${(50 + raio * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={tam} height={tam * 1.3} viewBox="0 0 100 130" style={{ overflow: "visible" }}>
      {fitas && (
        <>
          <path d="M32 70 L20 126 L34 116 L44 128 L50 76 Z" fill={OURO_ESC} />
          <path d="M68 70 L80 126 L66 116 L56 128 L50 76 Z" fill={OURO} />
        </>
      )}
      <polygon points={pts} fill={OURO} />
      <circle cx={50} cy={50} r={33} fill="none" stroke={OURO_ESC} strokeWidth={2.5} />
      <circle cx={50} cy={50} r={26} fill={OURO_ESC} opacity={0.35} />
      <path d="M50 34 L54 46 L67 46 L56.5 53.5 L60.5 66 L50 58.5 L39.5 66 L43.5 53.5 L33 46 L46 46 Z" fill={PAPEL} opacity={0.9} />
    </svg>
  );
};

// Linhas de texto fingido (cinza) para o corpo dos documentos.
const Linhas: React.FC<{ larguras: number[]; cor?: string; alt?: number; gap?: number; centro?: boolean }> = ({
  larguras,
  cor = "#D9D3C6",
  alt = 7,
  gap = 11,
  centro = true,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap, alignItems: centro ? "center" : "flex-start" }}>
    {larguras.map((w, i) => (
      <div key={i} style={{ width: `${w}%`, height: alt, borderRadius: alt, background: cor }} />
    ))}
  </div>
);

const Assinatura: React.FC<{ largura: number }> = ({ largura }) => (
  <svg width={largura} height={40} viewBox="0 0 120 40">
    <path d="M6 28 C 16 6, 22 34, 30 20 S 44 8, 48 24 S 62 30, 70 16 S 86 26, 96 18 L 112 22" fill="none" stroke={TINTA} strokeWidth={2.4} strokeLinecap="round" />
    <line x1={4} y1={36} x2={116} y2={36} stroke="#BDB6A6" strokeWidth={1.5} />
  </svg>
);

const tituloDoc: React.CSSProperties = { fontWeight: 600, letterSpacing: "0.08em", color: TINTA, lineHeight: 1 };

// certificado: paisagem, moldura dupla, selo com fitas.
const DocCertificado: React.FC<{ titulo: string }> = ({ titulo }) => (
  <div style={{ width: 460, height: 320, background: PAPEL, borderRadius: 10, padding: 14, boxSizing: "border-box" }}>
    <div style={{ position: "absolute", inset: 14, border: `3px solid ${OURO}`, borderRadius: 4 }} />
    <div style={{ position: "absolute", inset: 22, border: `1px solid ${OURO}`, borderRadius: 2 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 50, textAlign: "center" }}>
      <div style={{ ...tituloDoc, fontSize: 36 }}>{titulo}</div>
      <div style={{ marginTop: 22, padding: "0 70px" }}>
        <Linhas larguras={[80, 92, 60]} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 50, bottom: 40 }}>
      <Assinatura largura={130} />
    </div>
    <div style={{ position: "absolute", right: 40, bottom: 18 }}>
      <Selo tam={78} />
    </div>
  </div>
);

// retrato: brasão no topo, duas assinaturas.
const DocRetrato: React.FC<{ titulo: string }> = ({ titulo }) => (
  <div style={{ width: 340, height: 450, background: "#FDFCF8", borderRadius: 10 }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 16, background: MARINHO, borderRadius: "10px 10px 0 0" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 46, display: "flex", justifyContent: "center" }}>
      <svg width={84} height={84} viewBox="0 0 100 100">
        <path d="M50 8 L86 22 L86 50 C86 72 70 86 50 94 C30 86 14 72 14 50 L14 22 Z" fill={MARINHO} />
        <path d="M50 20 L74 30 L74 50 C74 66 64 76 50 82 C36 76 26 66 26 50 L26 30 Z" fill="none" stroke={OURO} strokeWidth={3} />
        <path d="M36 52 L50 40 L64 52 M40 50 L40 64 L60 64 L60 50" fill="none" stroke={OURO} strokeWidth={3.5} strokeLinejoin="round" />
      </svg>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 156, textAlign: "center" }}>
      <div style={{ ...tituloDoc, fontSize: 30, letterSpacing: "0.04em" }}>{titulo}</div>
      <div style={{ marginTop: 24, padding: "0 46px" }}>
        <Linhas larguras={[90, 74, 86, 52]} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 36, display: "flex", justifyContent: "space-around", padding: "0 20px" }}>
      <Assinatura largura={110} />
      <Assinatura largura={110} />
    </div>
  </div>
);

// faixa: paisagem com faixa lateral, selo sem fitas.
const DocFaixa: React.FC<{ titulo: string }> = ({ titulo }) => (
  <div style={{ width: 440, height: 300, background: PAPEL, borderRadius: 10, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 64, background: "#5B7A8C" }} />
    <div style={{ position: "absolute", left: 64, top: 0, bottom: 0, width: 6, background: OURO }} />
    <div style={{ position: "absolute", left: 104, right: 30, top: 56 }}>
      <div style={{ ...tituloDoc, fontSize: 30, letterSpacing: "0.04em" }}>{titulo}</div>
      <div style={{ marginTop: 24 }}>
        <Linhas larguras={[96, 82, 64]} centro={false} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 104, bottom: 34 }}>
      <Assinatura largura={130} />
    </div>
    <div style={{ position: "absolute", right: 28, bottom: 22 }}>
      <Selo tam={64} fitas={false} />
    </div>
  </div>
);

// pasta: couro marinho com gravação dourada (título curto, letras grandes).
const DocPasta: React.FC<{ titulo: string }> = ({ titulo }) => (
  <div
    style={{
      width: 330,
      height: 430,
      borderRadius: 14,
      background: `linear-gradient(160deg, #2C3F5E, ${MARINHO} 55%, #1A2639)`,
    }}
  >
    <div style={{ position: "absolute", inset: 18, border: `2px solid ${OURO}`, borderRadius: 8, opacity: 0.85 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 96, display: "flex", justifyContent: "center" }}>
      <svg width={90} height={60} viewBox="0 0 90 60">
        <path d="M45 6 L86 24 L45 42 L4 24 Z" fill={OURO} />
        <path d="M20 32 L20 46 C 30 56, 60 56, 70 46 L70 32 L45 43 Z" fill={OURO_ESC} />
        <line x1={80} y1={26} x2={80} y2={48} stroke={OURO} strokeWidth={3} />
      </svg>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 188, textAlign: "center", color: OURO, fontWeight: 600, fontSize: 92, letterSpacing: "0.06em", lineHeight: 1 }}>
      {titulo}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 120, height: 2, background: OURO, opacity: 0.7 }} />
    </div>
  </div>
);

const MODELOS: Record<ModeloDocumento, { el: React.FC<{ titulo: string }>; w: number; h: number }> = {
  certificado: { el: DocCertificado, w: 460, h: 320 },
  retrato: { el: DocRetrato, w: 340, h: 450 },
  faixa: { el: DocFaixa, w: 440, h: 300 },
  pasta: { el: DocPasta, w: 330, h: 430 },
};

// Porta-retrato do consultório (ilustrado): poltrona do paciente vazia.
const PortaRetrato: React.FC<{ brilho: number }> = ({ brilho }) => (
  <div style={{ width: 480, height: 370, borderRadius: 12, background: "linear-gradient(145deg, #A27D58, #7A5A3C)", padding: 22, boxSizing: "border-box" }}>
    <div style={{ position: "absolute", inset: 22, background: "#F4EFE6", borderRadius: 4, overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 436 326" preserveAspectRatio="xMidYMid slice">
        <rect width={436} height={326} fill="#EDE3D6" />
        <rect y={232} width={436} height={94} fill="#CDB08C" />
        <rect y={228} width={436} height={6} fill="#B99A75" />
        {/* janela com luz */}
        <rect x={250} y={34} width={150} height={150} rx={6} fill="#D7E8EC" />
        <rect x={250} y={34} width={150} height={150} rx={6} fill="none" stroke="#FFFFFF" strokeWidth={8} />
        <line x1={325} y1={34} x2={325} y2={184} stroke="#FFFFFF" strokeWidth={6} />
        <line x1={250} y1={109} x2={400} y2={109} stroke="#FFFFFF" strokeWidth={6} />
        <path d="M250 34 L290 34 L270 184 L250 184 Z" fill="#E9D9C4" opacity={0.9} />
        {/* quadro (diploma) na parede */}
        <rect x={66} y={50} width={84} height={62} rx={3} fill="#FBF8F1" stroke="#8C6A48" strokeWidth={5} />
        <circle cx={132} cy={96} r={7} fill={OURO} />
        <rect x={80} y={66} width={46} height={5} rx={2} fill="#D9D3C6" />
        <rect x={80} y={78} width={34} height={5} rx={2} fill="#D9D3C6" />
        {/* mesa */}
        <rect x={40} y={170} width={170} height={14} rx={4} fill="#8C6A48" />
        <rect x={52} y={184} width={10} height={58} fill="#7A5A3C" />
        <rect x={188} y={184} width={10} height={58} fill="#7A5A3C" />
        <rect x={84} y={146} width={52} height={26} rx={3} fill="#3B4250" />
        {/* planta */}
        <rect x={392} y={196} width={34} height={42} rx={6} fill="#C9B8A0" />
        <ellipse cx={409} cy={176} rx={10} ry={26} fill="#6E8B63" transform="rotate(-18 409 176)" />
        <ellipse cx={402} cy={182} rx={9} ry={24} fill="#5C7A53" transform="rotate(-48 402 182)" />
        <ellipse cx={416} cy={182} rx={9} ry={24} fill="#7C9B70" transform="rotate(30 416 182)" />
        {/* poltrona do paciente, vazia */}
        <rect x={262} y={190} width={110} height={70} rx={18} fill="#5D7B8C" />
        <rect x={250} y={204} width={26} height={60} rx={12} fill="#4F6C7C" />
        <rect x={358} y={204} width={26} height={60} rx={12} fill="#4F6C7C" />
        <rect x={270} y={232} width={94} height={30} rx={10} fill="#6A8899" />
        <rect x={268} y={262} width={8} height={18} fill="#3E3A36" />
        <rect x={358} y={262} width={8} height={18} fill="#3E3A36" />
        {/* tapete */}
        <ellipse cx={312} cy={294} rx={110} ry={16} fill="#E3D3BC" />
      </svg>
      {/* reflexo de vidro do porta-retrato passando na batida `quadro.brilho` */}
      <div
        style={{
          position: "absolute",
          top: -60,
          bottom: -60,
          width: 120,
          left: 0,
          rotate: "18deg",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)",
          translate: `${lerp(-200, 560, brilho)}px 0`,
          opacity: brilho > 0 && brilho < 1 ? 1 : 0,
        }}
      />
    </div>
  </div>
);

// Lugares do leque (centro final, rotação final, de onde vem): 4 documentos + o porta-retrato por cima.
type Lugar = { x: number; y: number; rot: number; deX: number; deY: number; deRot: number };
const LUGARES_DOC: Lugar[] = [
  { x: 245, y: 300, rot: -11, deX: -320, deY: 560, deRot: -32 },
  { x: 505, y: 330, rot: 7, deX: 200, deY: 680, deRot: 26 },
  { x: 230, y: 580, rot: -6, deX: -340, deY: 560, deRot: -24 },
  { x: 495, y: 615, rot: 9, deX: 220, deY: 600, deRot: 30 },
];
const LUGAR_QUADRO: Lugar = { x: 340, y: 860, rot: -3, deX: -120, deY: 520, deRot: -16 };
const ESC_OBJ = 0.82; // escala dos objetos no palco

type Obj = Lugar & { t: number; w: number; h: number; el: (t: number) => React.ReactNode };

const Objeto: React.FC<{ o: Obj; t: number; queda: number; escuro: number }> = ({ o, t, queda, escuro }) => {
  const p = seg(t, o.t - 0.06, o.t + 0.5);
  if (p <= 0) return null;
  const m = eo(p);
  // trajeto em arco: sobe um pouco no meio
  const x = lerp(o.x + o.deX, o.x, m);
  const y = lerp(o.y + o.deY, o.y, m) - Math.sin(m * Math.PI) * 60;
  const rot = lerp(o.deRot, o.rot, m);
  // pouso: passa 3% e assenta em ~200 ms
  const pouso = seg(t, o.t + 0.36, o.t + 0.58);
  const s = ESC_OBJ * (1 + 0.03 * pulso(pouso));
  // a pilha afunda alguns px quando um objeto novo pousa por cima
  return (
    <div
      style={{
        position: "absolute",
        left: x - o.w / 2,
        top: y - o.h / 2 + queda,
        width: o.w,
        height: o.h,
        rotate: `${rot.toFixed(2)}deg`,
        scale: String(s),
        boxShadow: SOMBRA_OBJETO,
        borderRadius: 12,
      }}
    >
      {o.el(t)}
      {/* recuo sem transparência: o objeto escurece (fica opaco, a parede não vaza por ele) */}
      {escuro > 0 && <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: cores.preto, opacity: escuro }} />}
    </div>
  );
};

// Agenda da semana vazia (cards claros, coluna de horas, colunas por dia).
const PASTEL = ["#EEF1F6", "#F3EFF7", "#EEF5F1", "#F7F2EA", "#F1F3F6"];

const AgendaVazia: React.FC<{ t: number; agenda: AnotacaoObjetosProps["agenda"]; saida: number }> = ({ t, agenda, saida }) => {
  const { dias, horas } = agenda;
  const t0 = agenda.t;
  const ent = eo(seg(t, t0, t0 + 0.6));
  const sai = seg(t, saida, saida + 0.4);
  const saiE = sai * sai * sai; // saída com ease-in
  if (ent <= 0) return null;
  const L = 1250;
  const TOP = 150;
  const W = 610;
  const colH = 46;
  const corpoTop = 128;
  const colX = 86;
  const colW = (W - colX - 24) / dias.length;
  // linha do "agora" atravessando o dia (tempo passando, ninguém chega): linear
  const agora = clamp01((t - (t0 + 0.5)) / (saida - (t0 + 0.5)));
  const agoraY = corpoTop + 12 + agora * (horas.length * colH - 20);
  // selo laranja: momento-chave da cena (entra 15% maior e assenta)
  const pS = seg(t, agenda.tSelo, agenda.tSelo + 0.45);
  const seloS = pS <= 0 ? 0 : lerp(1.15, 1, eo(pS));
  return (
    <div
      style={{
        position: "absolute",
        left: L,
        top: TOP,
        width: W,
        height: corpoTop + horas.length * colH + 26,
        borderRadius: 28,
        background: "#FAF9F6",
        boxShadow: "0 30px 70px rgba(0,0,0,.40), 0 4px 12px rgba(0,0,0,.2)",
        opacity: ent * (1 - saiE),
        translate: `${lerp(80, 0, ent) + saiE * 60}px ${lerp(20, 0, ent) + saiE * 40}px`,
        scale: String(lerp(0.96, 1, ent)),
        color: cores.preto,
      }}
    >
      <div style={{ position: "absolute", left: 30, top: 26, fontSize: 32, fontWeight: 600, letterSpacing: "-0.01em" }}>{agenda.titulo}</div>
      <div style={{ position: "absolute", right: 30, top: 34, fontFamily: "var(--mono)", fontSize: 18, letterSpacing: ".12em", color: "#8A909B" }}>{agenda.periodo}</div>
      {dias.map(([d, n], i) => {
        const pd = eo(seg(t, t0 + 0.12 + i * 0.05, t0 + 0.5 + i * 0.05));
        return (
          <div key={d} style={{ position: "absolute", left: colX + i * colW, top: 82, width: colW, textAlign: "center", opacity: pd, translate: `0 ${lerp(8, 0, pd)}px` }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 17, letterSpacing: ".1em", color: "#8A909B" }}>{d} </span>
            <span style={{ fontSize: 20, fontWeight: 500 }}>{n}</span>
          </div>
        );
      })}
      {/* colunas por dia, vazias */}
      {dias.map(([d], i) => {
        const pd = eo(seg(t, t0 + 0.15 + i * 0.05, t0 + 0.55 + i * 0.05));
        return (
          <div
            key={d + "c"}
            style={{
              position: "absolute",
              left: colX + i * colW + 4,
              top: corpoTop,
              width: colW - 8,
              height: horas.length * colH,
              borderRadius: 14,
              background: PASTEL[i % PASTEL.length],
              opacity: pd,
            }}
          />
        );
      })}
      {horas.map((h, j) => (
        <React.Fragment key={h}>
          <div style={{ position: "absolute", left: 28, top: corpoTop + j * colH + 2, fontFamily: "var(--mono)", fontSize: 16, color: "#A0A6B0" }}>{h}</div>
          {j > 0 && <div style={{ position: "absolute", left: colX, right: 24, top: corpoTop + j * colH, height: 1.5, background: "rgba(25,28,35,.07)" }} />}
        </React.Fragment>
      ))}
      {/* agora */}
      <div style={{ position: "absolute", left: colX - 6, right: 24, top: agoraY, height: 2, background: "#6B7280", opacity: 0.55 * eo(seg(t, t0 + 0.5, t0 + 0.8)) }}>
        <div style={{ position: "absolute", left: -5, top: -5, width: 12, height: 12, borderRadius: 6, background: "#6B7280" }} />
      </div>
      {/* selo laranja: único elemento de destaque da tela */}
      {pS > 0 && (
        <div
          style={{
            position: "absolute",
            right: -12,
            bottom: -30,
            padding: "16px 28px",
            borderRadius: 999,
            background: cores.sinopia,
            color: cores.puro,
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            boxShadow: "0 18px 40px rgba(0,0,0,.35)",
            opacity: eo(clamp01(pS * 2)),
            scale: String(seloS),
            whiteSpace: "nowrap",
          }}
        >
          {agenda.selo}
        </div>
      )}
    </div>
  );
};

export const AnotacaoObjetos: React.FC<AnotacaoObjetosProps> = ({ camera, dur, documentos, quadro, agenda, saida }) => {
  const t = useT();
  const objetos: Obj[] = [
    ...documentos.map((d, i) => {
      const Doc = MODELOS[d.modelo].el;
      return { ...LUGARES_DOC[i], t: d.t, w: MODELOS[d.modelo].w, h: MODELOS[d.modelo].h, el: () => <Doc titulo={d.titulo} /> };
    }),
    { ...LUGAR_QUADRO, t: quadro.t, w: 480, h: 370, el: (tt: number) => <PortaRetrato brilho={eio(seg(tt, quadro.brilho - 0.1, quadro.brilho + 0.6))} /> },
  ];
  // último objeto a pousar: dali até a agenda a pilha deriva devagar
  const ultimo = Math.max(...objetos.map((o) => o.t));
  // a pilha recua (40–50%) quando a agenda vira o foco
  const recuo = eio(seg(t, agenda.t, agenda.t + 0.5));
  const sai = seg(t, saida, saida + 0.4);
  const saiE = sai * sai * sai;
  // afundamento: cada pouso empurra o que já está embaixo 4 px
  const pousos = objetos.map((o) => eo(seg(t, o.t + 0.36, o.t + 0.6)));
  return (
    <Palco>
      <CameraCheia camera={camera} dur={dur} />
      {/* sombra suave à esquerda para os objetos assentarem sobre a parede */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 760px 620px at 360px 600px, rgba(15,17,22,.45), transparent 70%)",
          opacity: eo(seg(t, 0, 0.6)) * (1 - saiE),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - saiE,
          // deriva lenta enquanto a fala segue, para nada ficar parado
          scale: String(lerp(1, 0.96, recuo) * (1 + 0.015 * eio(seg(t, ultimo + 0.6, agenda.t)))),
          transformOrigin: "300px 600px",
          translate: `${-saiE * 80}px ${saiE * 60}px`,
        }}
      >
        {objetos.map((o, i) => {
          const queda = pousos.slice(i + 1).reduce((acc, p) => acc + p * 4, 0);
          return <Objeto key={i} o={o} t={t} queda={queda} escuro={0.55 * recuo} />;
        })}
      </div>
      <AgendaVazia t={t} agenda={agenda} saida={saida} />
    </Palco>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// AnotacaoCaminho
// Raciocínio: quem conduz é você; mostrar a condução como um trajeto com etapas e um ponto de chegada.
// Ponto laranja "você" no terço esquerdo; na palavra do caminho uma trilha tracejada se desenha passando por
// três marcos (as etapas) até uma bandeira; na palavra da solução a bandeira fica laranja, ganha check e uma
// anotação à mão. Título curto em cima, com uma palavra em laranja. Camada transparente (sem câmera própria).
// Quando usar: frase curta de condução/direção ("você escolhe o caminho", "é você que leva até lá…").
// Quando não usar: passos com nome que precisam ser lidos (vai de `lista`); jornada com telas reais (vai de
// `interface`); quando a câmera fechada põe o rosto no terço esquerdo (o título encosta no rosto).
// Origem: destaque d35-caminho-proposto da aula 01 (2026-11-13; promovido ao catálogo no mesmo dia).
// Props:
//   camera, dur      vídeo de referência (a cena não desenha a câmera) e duração; sai nos últimos 0,35 s.
//   titulo           antes + destaque (laranja) + depois; os espaços vão nos textos.
//   rotulo           texto mono embaixo do ponto de partida.
//   anotacao         palavra à mão que se escreve ao lado da bandeira na batida `resolver`.
//   batidas          voce (ponto), titulo, caminho (trilha começa a se desenhar), marcos (3, um por etapa),
//                    bandeira (trilha termina e a bandeira sobe), resolver (check + anotação).
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════

export type AnotacaoCaminhoProps = {
  camera: Camera;
  dur: number;
  titulo: { antes: string; destaque: string; depois: string };
  rotulo: string;
  anotacao: string;
  batidas: { voce: number; titulo: number; caminho: number; marcos: [number, number, number]; bandeira: number; resolver: number };
};

const TRILHA = "M140 640 C 205 640, 205 548, 285 556 S 390 606, 450 480";
const MARCOS_TRILHA: [number, number][] = [
  [200, 602],
  [285, 556],
  [384, 576],
];
const SOMBRA_TEXTO = "0 2px 18px rgba(0,0,0,.62), 0 1px 3px rgba(0,0,0,.45)";

export const AnotacaoCaminho: React.FC<AnotacaoCaminhoProps> = ({ dur, titulo, rotulo, anotacao, batidas: T }) => {
  const t = useT();
  const sai = eio(seg(t, dur - 0.35, dur));
  const v = eo(seg(t, T.voce - 0.06, T.voce + 0.3));
  const ti = eo(seg(t, T.titulo - 0.04, T.titulo + 0.3));
  const tr = eio(seg(t, T.caminho, T.bandeira));
  const b = eio(seg(t, T.bandeira - 0.05, T.bandeira + 0.35));
  const ok = eio(seg(t, T.resolver, T.resolver + 0.4));
  return (
    <Palco saida={{ opacity: 1 - sai }}>
      <div style={{ position: "absolute", inset: 0, opacity: v, background: "radial-gradient(ellipse 620px 440px at 330px 520px, rgba(12,14,18,.45), transparent 72%)" }} />
      <p style={{ position: "absolute", left: 96, top: 338, fontSize: 42, fontWeight: 500, letterSpacing: "-0.02em", color: cores.puro, textShadow: SOMBRA_TEXTO, opacity: ti, translate: `0px ${lerp(16, 0, ti).toFixed(1)}px`, whiteSpace: "nowrap" }}>
        {titulo.antes}
        <span style={{ color: cores.sinopia, fontWeight: 600 }}>{titulo.destaque}</span>
        {titulo.depois}
      </p>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: 1920, height: 1080, overflow: "visible" }}>
        {/* trilha tracejada: o tracejado aparece por trás de uma máscara que se desenha */}
        <defs>
          <mask id="m-trilha">
            <Traco d={TRILHA} p={tr} largura={14} cor="#fff" />
          </mask>
        </defs>
        <path d={TRILHA} fill="none" stroke={cores.puro} strokeWidth={4} strokeDasharray="14 12" strokeLinecap="round" mask="url(#m-trilha)" />
        {MARCOS_TRILHA.map(([x, y], i) => {
          const m = eo(seg(t, T.marcos[i] - 0.04, T.marcos[i] + 0.25));
          return <circle key={i} cx={x} cy={y} r={9 * m} fill={cores.puro} stroke="rgba(0,0,0,.35)" strokeWidth={1} />;
        })}
        {/* você */}
        <circle cx={140} cy={640} r={16 * v} fill={cores.sinopia} />
        {/* bandeira */}
        <g opacity={b} transform={`translate(450 480) scale(${lerp(0.6, 1, b).toFixed(3)}) translate(-450 -480)`}>
          <line x1={450} y1={480} x2={450} y2={404} stroke={cores.puro} strokeWidth={4} strokeLinecap="round" />
          <path d="M450 404 L500 420 L450 436 Z" fill={ok > 0 ? cores.sinopia : cores.puro} opacity={lerp(1, 1, ok)} />
        </g>
        <circle cx={488} cy={478} r={20} fill="none" stroke={cores.sinopia} strokeWidth={3.5} opacity={ok} />
        <Traco d="M478 479 L485 486 L498 471" p={ok} largura={4} cor={cores.puro} />
      </svg>
      <p style={{ position: "absolute", left: 140, top: 664, translate: "-50% 0", fontFamily: fonteMono, fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: cores.puro, opacity: 0.8 * v, textShadow: SOMBRA_TEXTO }}>
        {rotulo}
      </p>
      <p
        style={{
          position: "absolute",
          left: 300,
          top: 492,
          fontFamily: fonteMao,
          fontSize: 56,
          color: cores.sinopia,
          rotate: "-5deg",
          whiteSpace: "nowrap",
          clipPath: `inset(-30% ${((1 - ok) * 100).toFixed(1)}% -30% -10%)`,
          transform: `translate(${tremido(t)})`,
        }}
      >
        {anotacao}
      </p>
    </Palco>
  );
};
