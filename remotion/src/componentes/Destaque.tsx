// `destaque` · palavras-chave sobre a câmera cheia (estilo.md §12 "Palavra em destaque").
// Camadas TRANSPARENTES: desenhadas num palco 1920×1080 sem fundo e sem câmera; a aula põe o vídeo editado embaixo.
// `comCamera` desenha a câmera cheia atrás só para prévia (Studio e stills).
// Formatos: Frase · Palavra · Riscadas (lista ou troca) · Icones · Pilha · Numero · Balao.
// Batidas em segundos desde o início do destaque, ancoradas nas palavras faladas.
// Câmera: rosto no centro (x ≈ 740–1180, y ≈ 100–600). Zonas livres: terço esquerdo (porta), parede à direita da
// estante (x > 1420). Peito NÃO: o queixo vai a y ≈ 810 no plano aberto e ≈ 880 no fechado (2026-11-13).
import "./base.css";
import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { cores, fontFamily, fonteMao, fonteMono } from "../marca";
import { eio, eo, eob, lerp, sair, seg, tremido } from "../movimento";
import { Traco, useT, type Camera, useInicioCamera } from "./comum";

// Saída comum (estilo.md §5): 0,35 s ease-in, esmaece + sobe 18 px + encolhe 4%, dentro da janela do destaque.
const SAIDA = 0.35;
const ATRASO_FILHO = 0.06; // filhos 40–80 ms depois do pai
// Sombra suave para ler sobre a câmera (nunca contorno).
const SOMBRA = "0 2px 18px rgba(0,0,0,.62), 0 1px 3px rgba(0,0,0,.45)";

export type BaseDestaque = {
  dur: number;
  comCamera?: boolean; // só prévia
  camera?: Camera;
};

// Palco transparente 1920×1080 escalado para a composição; saída comum de 0,35 s no fim do destaque.
const Camada: React.FC<BaseDestaque & { children: React.ReactNode; pe?: boolean }> = ({
  dur,
  comCamera,
  camera,
  children,
  pe,
}) => {
  const t = useT();
  const { width, height, fps } = useVideoConfig();
  const escala = Math.min(width / 1920, height / 1080);
  const sai = sair(t, dur, SAIDA, 18, 0.04);
  const entra = eo(seg(t, 0, 0.35));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {comCamera && camera ? (
        <Video
          src={staticFile(camera.src)}
          trimBefore={Math.round(useInicioCamera(camera) * fps)}
          muted
          objectFit="cover"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      ) : null}
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
            opacity: sai.opacity,
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
        {/* degradê suave no pé para o texto sobre o peito ler (não é tarja) */}
        {pe ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 400,
              opacity: entra,
              background: "linear-gradient(transparent, rgba(12,14,18,.62))",
            }}
          />
        ) : null}
        {/* movimento da saída só no conteúdo (o degradê do pé só esmaece) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            translate: `0px ${sai.y.toFixed(1)}px`,
            scale: String(sai.scale),
            transformOrigin: "50% 50%",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Risco à mão sobre uma palavra (com tremido), desenhado de 0 a 1.
const Risco: React.FC<{ p: number; t: number; largura?: number }> = ({ p, t, largura = 8 }) => (
  <svg
    viewBox="0 0 300 40"
    preserveAspectRatio="none"
    style={{
      position: "absolute",
      left: -12,
      top: "40%",
      width: "calc(100% + 24px)",
      height: 40,
      overflow: "visible",
      translate: tremido(t).replace(",", ""),
    }}
  >
    <Traco d="M4 26 C70 16 150 30 296 10" p={p} largura={largura} />
  </svg>
);

// Bloco laranja atrás da palavra certa (mesmo desenho da CitacaoRiscada aprovada).
const Bloco: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => (
  <span style={{ position: "relative", display: "inline-block", padding: "0 .16em" }}>
    <span
      style={{
        position: "absolute",
        inset: ".06em 0 0 0",
        background: "var(--main)",
        borderRadius: ".08em",
        transformOrigin: "0 50%",
        scale: `${eio(p)} 1`,
      }}
    />
    <span style={{ position: "relative", color: "var(--accent)" }}>{children}</span>
  </span>
);

// ───────────────────────────── Frase ─────────────────────────────
// Síntese de 2–5 palavras no terço livre (estilo.md §12), entrando junto no momento-chave; uma em laranja.
export type PalavraFalada = { texto: string; t: number; destaque?: boolean };
export type FraseProps = BaseDestaque & {
  palavras: PalavraFalada[];
  mao?: boolean; // destaque na fonte manuscrita (Caveat) em vez de só laranja
  tamanho?: number;
  lado?: "esquerda" | "direita";
  forma?: "lado" | "pilha" | "baixo";
};

export const Frase: React.FC<FraseProps> = ({ palavras, mao, tamanho, lado = "esquerda", forma = "lado", ...base }) => {
  const t = useT();
  const esq = lado === "esquerda";
  // Formas alternadas ao longo do vídeo (autor, 2026-11-13: "um único padrão… alternar para dar dinâmica"):
  // lado  = bloco no terço livre, altura dos olhos (esquerda ou parede à direita)
  // pilha = uma palavra por linha, grande, entrando com batida (frase curta de efeito)
  // baixo = linha única embaixo, centralizada; vai como "cena" na linha do tempo (câmera aberta, queixo em y ≈ 810)
  // Nunca no peito com a câmera fechada: o queixo vai a y ≈ 880.
  const pilha = forma === "pilha";
  const baixo = forma === "baixo";
  const fs = tamanho ?? (pilha ? 84 : baixo ? 60 : 58);
  const caixa: React.CSSProperties = baixo
    ? { left: 160, right: 160, bottom: 132, justifyContent: "center" }
    : {
        left: esq ? 96 : undefined,
        right: esq ? undefined : 96,
        width: pilha ? 640 : esq ? 540 : 460,
        top: 480,
        translate: "0 -50%",
        justifyContent: esq ? "flex-start" : "flex-end",
        ...(pilha ? { flexDirection: "column" as const, alignItems: esq ? "flex-start" : "flex-end" } : {}),
      };
  return (
    <Camada {...base} pe={baixo}>
      {!baixo ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: eo(seg(t, 0, 0.35)),
            background: esq
              ? "radial-gradient(ellipse 640px 440px at 300px 480px, rgba(12,14,18,.42), transparent 72%)"
              : "radial-gradient(ellipse 580px 440px at 1640px 480px, rgba(12,14,18,.42), transparent 72%)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexWrap: pilha ? "nowrap" : "wrap",
          alignItems: pilha ? undefined : "baseline",
          columnGap: "0.24em",
          rowGap: pilha ? 0 : 6,
          fontSize: fs,
          fontWeight: pilha ? 600 : 500,
          lineHeight: pilha ? 0.98 : 1.04,
          letterSpacing: pilha ? "-0.035em" : "-0.02em",
          textShadow: SOMBRA,
          ...caixa,
        }}
      >
        {palavras.map((w, i) => {
          const e = eo(seg(t, w.t - 0.06, w.t + (pilha ? 0.22 : 0.3)));
          const k = w.destaque ? eo(seg(t, w.t - 0.06, w.t + 0.4)) : 1;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: e,
                translate: pilha ? `${lerp(esq ? -30 : 30, 0, e).toFixed(1)}px 0px` : `0px ${lerp(18, 0, e).toFixed(1)}px`,
                scale: pilha ? String(lerp(1.25, 1, e)) : w.destaque ? String(lerp(1.16, 1, k)) : undefined,
                transformOrigin: baixo ? "50% 80%" : esq ? "0% 80%" : "100% 80%",
                color: w.destaque ? "var(--main)" : "var(--accent)",
                fontWeight: w.destaque ? 600 : undefined,
                fontFamily: w.destaque && mao ? "var(--hand)" : undefined,
                fontSize: w.destaque && mao ? "1.28em" : undefined,
                lineHeight: w.destaque && mao ? 0.8 : undefined,
                whiteSpace: "nowrap",
              }}
            >
              {w.texto}
            </span>
          );
        })}
      </div>
    </Camada>
  );
};

// ───────────────────────────── Palavra ─────────────────────────────
// Palavra grande no terço livre, com sublinhado laranja à mão.
export type PalavraProps = BaseDestaque & {
  texto: string;
  t: number;
  lado?: "esquerda" | "direita";
  tamanho?: number;
};

export const Palavra: React.FC<PalavraProps> = ({ texto, t: tp, lado = "esquerda", tamanho = 156, ...base }) => {
  const t = useT();
  const e = eo(seg(t, tp - 0.08, tp + 0.4));
  const s = seg(t, tp + 0.2, tp + 0.6);
  const x = lado === "esquerda" ? 380 : 1680;
  return (
    <Camada {...base}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: 440,
          translate: "-50% 0",
          opacity: e,
          scale: String(lerp(1.18, 1, e)),
          transformOrigin: "50% 60%",
        }}
      >
        <p
          style={{
            fontSize: tamanho,
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: "-0.035em",
            color: "var(--accent)",
            textShadow: SOMBRA,
            whiteSpace: "nowrap",
          }}
        >
          {texto}
        </p>
        <svg
          viewBox="0 0 300 30"
          preserveAspectRatio="none"
          style={{ display: "block", width: "100%", height: 30, overflow: "visible", translate: tremido(t).replace(",", "") }}
        >
          <Traco d="M6 18 C80 8 190 24 294 10" p={eio(s)} largura={9} />
        </svg>
      </div>
    </Camada>
  );
};

// ───────────────────────────── Riscadas ─────────────────────────────
// Lista: palavras (texto ou pílula) riscadas à mão na fala; opcional palavra certa entrando depois num bloco laranja.
// Troca: "Eu ~~sou~~ estou aprendendo" — a palavra nova entra escrita à mão acima da riscada.
export type ItemRiscado = { texto: string; t: number; risco: number };
export type Troca = {
  antes: string;
  riscada: string;
  nova: string;
  depois: string;
  t: number; // frase entra
  risco: number;
  novaT: number;
};
export type RiscadasProps = BaseDestaque & {
  itens?: ItemRiscado[];
  estilo?: "texto" | "pilula";
  certa?: { texto: string; t: number };
  certas?: { texto: string; t: number }[]; // mais de uma certa, uma por linha (cada uma na sua palavra)
  troca?: Troca;
  tamanho?: number;
  limpa?: boolean; // as riscadas sempre saem antes das certas (só as certas ficam na tela)
};

const RiscadasTroca: React.FC<{ tr: Troca; tamanho: number }> = ({ tr, tamanho }) => {
  const t = useT();
  const e = eo(seg(t, tr.t - 0.06, tr.t + 0.35));
  const r = eio(seg(t, tr.risco, tr.risco + 0.4));
  const n = eio(seg(t, tr.novaT, tr.novaT + 0.55));
  // uma linha, embaixo, como o autor aprovou (2026-11-13); o item vai como "cena" na linha do tempo para a câmera
  // ficar aberta (queixo em y ≈ 810) e a palavra manuscrita não encostar no rosto
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 132,
        textAlign: "center",
        fontSize: tamanho,
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        textShadow: SOMBRA,
        opacity: e,
        translate: `0px ${lerp(18, 0, e).toFixed(1)}px`,
      }}
    >
      {tr.antes}{" "}
      <span style={{ position: "relative", display: "inline-block", margin: "0 .12em" }}>
        <span style={{ opacity: lerp(1, 0.5, r) }}>{tr.riscada}</span>
        <Risco p={r} t={t} largura={6} />
        <span
          className="nd-mao"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "86%",
            fontSize: tamanho * 1.45,
            color: "var(--main)",
            translate: "-50% 0",
            rotate: "-5deg",
            whiteSpace: "nowrap",
            clipPath: `inset(-20% ${((1 - n) * 100).toFixed(1)}% -20% -10%)`,
            transform: `translate(${tremido(t)})`,
          }}
        >
          {tr.nova}
        </span>
      </span>{" "}
      {tr.depois}
    </div>
  );
};

export const Riscadas: React.FC<RiscadasProps> = ({ itens = [], estilo = "texto", certa, certas, troca, tamanho, limpa, ...base }) => {
  const t = useT();
  if (troca) {
    return (
      <Camada {...base} pe>
        <RiscadasTroca tr={troca} tamanho={tamanho ?? 64} />
      </Camada>
    );
  }
  const pil = estilo === "pilula";
  const fs = tamanho ?? (pil ? 40 : 54);
  const lista = certas ?? (certa ? [certa] : []);
  const primeira = lista[0]?.t;
  const ultimoRisco = Math.max(0, ...itens.map((i) => i.risco));
  // nada fica parado esperando (estilo.md §12): se a certa demora mais de ~1,8 s depois do último risco,
  // as riscadas saem antes e a certa entra sozinha no lugar
  const longe = primeira !== undefined && (limpa || primeira - ultimoRisco > 1.8);
  const fimSaida = Math.min(ultimoRisco + 1.3, (primeira ?? 99) - 0.12);
  const saiItens = longe ? eio(seg(t, fimSaida - 0.4, fimSaida)) : 0;
  return (
    <Camada {...base}>
      <div
        style={{
          position: "absolute",
          left: 96,
          width: 560,
          top: 500,
          translate: "0 -50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: pil ? 16 : 8,
        }}
      >
        {itens.map((it, i) => {
          const e = eo(seg(t, it.t - 0.06, it.t + 0.3));
          const r = eio(seg(t, it.risco, it.risco + 0.35));
          const apaga = lerp(1, lista.length ? 0.45 : 0.6, eo(seg(t, it.risco + 0.35, it.risco + 0.7)));
          if (longe && saiItens >= 1) return null;
          return (
            <div
              key={i}
              className={pil ? "nd-glass" : undefined}
              style={{
                position: "relative",
                opacity: e * apaga * (1 - saiItens),
                translate: `${lerp(-22, 0, e) - 30 * saiItens}px 0px`,
                fontSize: fs,
                fontWeight: 500,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                textShadow: pil ? undefined : SOMBRA,
                padding: pil ? "14px 26px 16px" : 0,
                borderRadius: pil ? 999 : undefined,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                {it.texto}
                <Risco p={r} t={t} largura={pil ? 5 : 6} />
              </span>
            </div>
          );
        })}
        {lista.map((c, i) => {
          const ce = eo(seg(t, c.t - 0.06, c.t + 0.35));
          const cb = seg(t, c.t + ATRASO_FILHO, c.t + 0.5);
          return (
            <p
              key={`c${i}`}
              style={{
                marginTop: i === 0 && itens.length && !longe ? 22 : 4,
                fontSize: fs * 0.94,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                opacity: ce,
                translate: `0px ${lerp(20, 0, ce).toFixed(1)}px`,
                scale: String(lerp(1.12, 1, ce)),
                transformOrigin: "0 50%",
                textShadow: cb > 0.5 ? undefined : SOMBRA,
                whiteSpace: "nowrap",
              }}
            >
              <Bloco p={cb}>{c.texto}</Bloco>
            </p>
          );
        })}
      </div>
    </Camada>
  );
};

// ───────────────────────────── Ícones ─────────────────────────────
// Ícones de traço fino (desenhados na palavra) em vidro redondo ao redor do rosto, sem cobri-lo.
// Um foco por vez: o anterior cai quando o próximo entra.
const ICONES = {
  coracao: "M32 54 C14 42 6 32 6 22 C6 13 13 8 20 8 C26 8 30 12 32 16 C34 12 38 8 44 8 C51 8 58 13 58 22 C58 32 50 42 32 54 Z",
  curriculo:
    "M16 6 H40 L50 16 V58 H16 Z M40 6 V16 H50 M27 26 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M24 40 C26 35 40 35 42 40 M22 48 H44 M22 53 H36",
  sorvete: "M18 30 C16 18 23 9 32 9 C41 9 48 18 46 30 Z M18 30 L32 58 L46 30 M24 36 L40 40 M27 45 L37 47",
  haltere: "M8 26 V38 M15 18 V46 M22 18 V46 M42 18 V46 M49 18 V46 M56 26 V38 M22 32 H42",
  dinheiro:
    "M8 32 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0 M40 23 C38 19 35 18 32 18 C27 18 24 21 24 25 C24 33 40 30 40 39 C40 43 36 46 32 46 C27 46 24 44 23 40 M32 13 V18 M32 46 V51",
  emocional: "M8 32 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0 M24 26 V29 M40 26 V29 M23 40 C28 45 36 45 41 40",
  dor: "M37 6 L16 36 H30 L26 58 L48 26 H34 Z",
  idioma: "M8 32 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0 M32 8 C21 18 21 46 32 56 C43 46 43 18 32 8 M8 32 H56 M12 20 H52 M12 44 H52",
  ciclo: "M50 24 A20 20 0 0 0 13 26 M14 40 A20 20 0 0 0 51 38 M51 13 V24 H40 M13 51 V40 H24",
} as const;
export type NomeIcone = keyof typeof ICONES;

export const IconeTraco: React.FC<{ nome: NomeIcone; p: number; tamanho: number; cor?: string; largura?: number }> = ({
  nome,
  p,
  tamanho,
  cor = "var(--accent)",
  largura = 3.4,
}) => (
  <svg viewBox="0 0 64 64" style={{ width: tamanho, height: tamanho, overflow: "visible", display: "block" }}>
    <Traco d={ICONES[nome]} p={p} largura={largura} cor={cor} />
  </svg>
);

export type ItemIcone = { icone: NomeIcone; t: number; x: number; y: number; rotulo?: string; rotuloT?: number };
// segura: segundos que cada ícone fica antes de sair quando o próximo demora (nada parado esperando a fala).
export type IconesProps = BaseDestaque & { itens: ItemIcone[]; tamanho?: number; segura?: number };

export const Icones: React.FC<IconesProps> = ({ itens, tamanho = 148, segura, ...base }) => {
  const t = useT();
  return (
    <Camada {...base}>
      {itens.map((it, i) => {
        const e = seg(t, it.t - 0.08, it.t + 0.4);
        const d = eio(seg(t, it.t + ATRASO_FILHO, it.t + 0.6));
        const prox = itens[i + 1];
        const foco = prox ? lerp(1, 0.5, eio(seg(t, prox.t - 0.05, prox.t + 0.3))) : 1;
        const cedo = segura !== undefined && (!prox || prox.t - it.t > segura) ? eio(seg(t, it.t + segura, it.t + segura + 0.35)) : 0;
        const rt = it.rotuloT ?? it.t + 0.12;
        const r = eo(seg(t, rt, rt + 0.3));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: it.x,
              top: it.y,
              translate: "-50% -50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              opacity: eo(e) * foco * (1 - cedo),
            }}
          >
            <div
              className="nd-glass"
              style={{
                position: "relative",
                width: tamanho,
                height: tamanho,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                scale: String(lerp(0.6, 1, eob(e, 1.4))),
              }}
            >
              <IconeTraco nome={it.icone} p={d} tamanho={tamanho * 0.52} />
            </div>
            {it.rotulo ? (
              <p
                className="nd-rotulo"
                style={{
                  fontSize: 28,
                  color: "var(--accent)",
                  textShadow: SOMBRA,
                  whiteSpace: "nowrap",
                  opacity: r,
                  translate: `0px ${lerp(8, 0, r).toFixed(1)}px`,
                }}
              >
                {it.rotulo}
              </p>
            ) : null}
          </div>
        );
      })}
    </Camada>
  );
};

// ───────────────────────────── Pilha ─────────────────────────────
// Pílulas de vidro empilhando na fala (a nova entra embaixo e empurra as outras); fecho manuscrito no momento-chave.
export type PilhaProps = BaseDestaque & {
  itens: { texto: string; t: number }[];
  fecho?: { texto: string; t: number };
};

export const Pilha: React.FC<PilhaProps> = ({ itens, fecho, ...base }) => {
  const t = useT();
  const PASSO = 94;
  const BASE = 700; // topo da pílula mais recente
  const f = fecho ? eo(seg(t, fecho.t - 0.06, fecho.t + 0.45)) : 0;
  const cai = fecho ? lerp(1, 0.5, eio(seg(t, fecho.t, fecho.t + 0.4))) : 1;
  return (
    <Camada {...base}>
      {itens.map((it, i) => {
        const e = eo(seg(t, it.t - 0.06, it.t + 0.35));
        let sobe = 0;
        for (let j = i + 1; j < itens.length; j++) sobe += eio(seg(t, itens[j].t - 0.06, itens[j].t + 0.3));
        return (
          <div
            key={i}
            className="nd-glass"
            style={{
              left: 120,
              top: BASE - sobe * PASSO,
              padding: "16px 30px 18px",
              borderRadius: 999,
              fontSize: 44,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              opacity: e * cai,
              translate: `0px ${lerp(34, 0, e).toFixed(1)}px`,
              rotate: `${[-1.2, 0.9, -0.6, 1.1, -0.9][i % 5]}deg`,
            }}
          >
            {it.texto}
          </div>
        );
      })}
      {fecho ? (
        <p
          className="nd-mao"
          style={{
            position: "absolute",
            left: 132,
            top: BASE + 104,
            fontSize: 64,
            color: "var(--main)",
            opacity: f,
            scale: String(lerp(1.15, 1, f)),
            transformOrigin: "0 50%",
            transform: `rotate(-3deg) translate(${tremido(t)})`,
          }}
        >
          {fecho.texto}
        </p>
      ) : null}
    </Camada>
  );
};

// ───────────────────────────── Numero ─────────────────────────────
// Vidro discreto no canto superior direito; o número conta/troca na fala (apoio pequeno colado na mesma linha de base).
// Modo contador: valor fixo + "semana N" trocando, com ícone de ciclo girando a cada troca.
export type NumeroDestaqueProps = BaseDestaque & {
  valores: { n: number; t: number }[];
  prefixo?: string;
  sufixo?: string;
  contador?: { rotulo: string; ts: number[] }; // "semana" · uma batida por troca (1, 2, 3…)
};

export const NumeroDestaque: React.FC<NumeroDestaqueProps> = ({ valores, prefixo, sufixo, contador, ...base }) => {
  const t = useT();
  const v0 = valores[0];
  const e = eo(seg(t, v0.t - 0.12, v0.t + 0.35));
  let n = v0.n;
  for (let i = 1; i < valores.length; i++) n = lerp(n, valores[i].n, eo(seg(t, valores[i].t, valores[i].t + 0.25)));
  const ultimo = valores[valores.length - 1];
  const chave = valores.length > 1 ? eo(seg(t, ultimo.t, ultimo.t + 0.4)) : e;
  const escalaChave = t >= ultimo.t ? lerp(1.12, 1, chave) : 1;
  // contador
  const ts = contador?.ts ?? [];
  let k = 0;
  let giro = 0;
  ts.forEach((x, i) => {
    if (t >= x) k = i + 1;
    giro += eio(seg(t, x, x + 0.55));
  });
  const trocaRot = ts.length ? eo(seg(t, ts[Math.max(0, k - 1)], ts[Math.max(0, k - 1)] + 0.25)) : 1;
  return (
    <Camada {...base}>
      <div
        className="nd-glass"
        style={{
          right: 60,
          top: 56,
          padding: contador ? "18px 30px 18px 22px" : "14px 30px 14px",
          borderRadius: 26,
          display: "flex",
          alignItems: "center",
          gap: 20,
          opacity: e,
          translate: `0px ${lerp(-12, 0, e).toFixed(1)}px`,
          scale: String(lerp(0.96, 1, e)),
          transformOrigin: "100% 0",
        }}
      >
        {contador ? (
          <div style={{ rotate: `${(-360 * giro).toFixed(1)}deg` }}>
            <IconeTraco nome="ciclo" p={eio(seg(t, v0.t + ATRASO_FILHO, v0.t + 0.6))} tamanho={60} cor="var(--main)" largura={4} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p
            className="nd-num"
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              whiteSpace: "nowrap",
              lineHeight: 1,
              scale: String(escalaChave),
              transformOrigin: "100% 70%",
            }}
          >
            {prefixo ? <span style={{ fontSize: 36, fontWeight: 500, opacity: 0.85 }}>{prefixo}</span> : null}
            <span style={{ fontSize: 88, fontWeight: 600, letterSpacing: "-0.04em" }}>{Math.round(n)}</span>
            {sufixo ? <span style={{ fontSize: 36, fontWeight: 500, opacity: 0.85 }}>{sufixo}</span> : null}
          </p>
          {contador && k > 0 ? (
            <p
              className="nd-rotulo"
              style={{ fontSize: 28, opacity: 0.6 + 0.4 * trocaRot, translate: `0px ${lerp(6, 0, trocaRot).toFixed(1)}px` }}
            >
              {contador.rotulo} <span className="nd-num">{k}</span>
            </p>
          ) : null}
        </div>
      </div>
    </Camada>
  );
};

// ───────────────────────────── Balao ─────────────────────────────
// Chat: bolhas de vidro do aluno empilhando no terço esquerdo (três pontinhos antes de cada mensagem).
// Pensamento: nuvem de vidro com bolinhas que saem da cabeça; palavras entram na fala.
export type BalaoProps = BaseDestaque & {
  modo: "chat" | "pensamento";
  mensagens?: { texto: string; t: number }[];
  palavras?: { texto: string; t: number }[];
  rotulo?: string; // quem fala (chat)
  pb?: boolean; // voz do outro: a câmera da aula fica em preto e branco e volta à cor seco no fim (2026-11-13)
};

const Pontinhos: React.FC<{ t: number }> = ({ t }) => (
  <span style={{ display: "inline-flex", gap: 10, padding: "6px 4px" }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.35 + 0.65 * Math.max(0, Math.sin((t * 6 - i * 0.7) * Math.PI) ),
        }}
      />
    ))}
  </span>
);

export const Balao: React.FC<BalaoProps> = (props) => {
  const t = useT();
  if (!props.pb) return <BalaoBase {...props} />;
  const g = eo(seg(t, 0, 0.25)).toFixed(3);
  return (
    <>
      <AbsoluteFill style={{ backdropFilter: `grayscale(${g})`, WebkitBackdropFilter: `grayscale(${g})` }} />
      <BalaoBase {...props} />
    </>
  );
};

const BalaoBase: React.FC<BalaoProps> = ({ modo, mensagens = [], palavras = [], rotulo, pb: _pb, ...base }) => {
  const t = useT();
  if (modo === "pensamento") {
    const w0 = palavras[0]?.t ?? 0;
    const nuvem = eo(seg(t, w0 - 0.3, w0 + 0.1));
    const b1 = eo(seg(t, w0 - 0.4, w0 - 0.2));
    const b2 = eo(seg(t, w0 - 0.35, w0 - 0.1));
    return (
      <Camada {...base}>
        {/* bolinhas saindo da cabeça */}
        <div className="nd-glass" style={{ left: 668, top: 330, width: 26, height: 26, borderRadius: "50%", opacity: b1, scale: String(b1) }} />
        <div className="nd-glass" style={{ left: 622, top: 282, width: 40, height: 40, borderRadius: "50%", opacity: b2, scale: String(b2) }} />
        <div
          className="nd-glass"
          style={{
            right: 1920 - 640,
            top: 120,
            maxWidth: 560,
            padding: "30px 40px 34px",
            borderRadius: 70,
            opacity: nuvem,
            scale: String(lerp(0.88, 1, eob(nuvem, 1.2))),
            transformOrigin: "100% 100%",
            fontSize: 50,
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: "-0.015em",
            display: "flex",
            flexWrap: "wrap",
            columnGap: "0.24em",
          }}
        >
          {palavras.map((w, i) => {
            const e = eo(seg(t, w.t - 0.06, w.t + 0.25));
            return (
              <span key={i} style={{ display: "inline-block", opacity: e, translate: `0px ${lerp(10, 0, e).toFixed(1)}px` }}>
                {w.texto}
              </span>
            );
          })}
        </div>
      </Camada>
    );
  }
  const r0 = mensagens[0] ? eo(seg(t, mensagens[0].t - 0.5, mensagens[0].t - 0.2)) : 0;
  return (
    <Camada {...base}>
      <div style={{ position: "absolute", left: 90, top: 250, width: 580, display: "flex", flexDirection: "column", gap: 16 }}>
        {rotulo ? (
          <p className="nd-rotulo" style={{ fontSize: 28, marginLeft: 8, opacity: 0.85 * r0, textShadow: SOMBRA }}>
            {rotulo}
          </p>
        ) : null}
        {mensagens.map((m, i) => {
          const pre = m.t - 0.45;
          const caixa = eo(seg(t, pre, pre + 0.25));
          const texto = eo(seg(t, m.t, m.t + 0.25));
          if (t < pre) return null;
          return (
            <div
              key={i}
              className="nd-glass"
              style={{
                position: "relative",
                alignSelf: "flex-start",
                maxWidth: 560,
                padding: "22px 30px 24px",
                borderRadius: "34px 34px 34px 10px",
                fontSize: 42,
                fontWeight: 500,
                lineHeight: 1.18,
                letterSpacing: "-0.01em",
                opacity: caixa,
                scale: String(lerp(0.85, 1, eob(caixa, 1.3))),
                transformOrigin: "0 100%",
              }}
            >
              {t < m.t ? <Pontinhos t={t} /> : <span style={{ opacity: texto }}>{m.texto}</span>}
            </div>
          );
        })}
      </div>
    </Camada>
  );
};
