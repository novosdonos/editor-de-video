// `citacao` · variação "riscada": frase sobre a câmera cheia; uma palavra é riscada à mão e a palavra certa entra num bloco laranja.
// Origem: cena do teste da aula 01 (artifact Motion, 2026-11-10).
import { Video } from "@remotion/media";
import { staticFile, useVideoConfig } from "remotion";
import { eob, lerp, pulso, sair, seg, eio, eo, subir, tremido } from "../movimento";
import { CameraCheia, Palco, Traco, useT, type Camera, useInicioCamera } from "./comum";

export type CitacaoRiscadaProps = {
  camera: Camera;
  dur: number;
  rotulo: string;
  antes: string; // "O segredo não é"
  riscada: string; // "sorte"
  nota: string; // anotação manuscrita ao lado da palavra riscada
  depois: string; // "é"
  destaque: string; // "método."
  // Batidas em segundos desde o início da cena (ancorar nas palavras faladas).
  risco: number; // quando a palavra é riscada
  bloco: number; // quando o bloco laranja entra
};

export const CitacaoRiscada: React.FC<CitacaoRiscadaProps> = (p) => {
  const t = useT();
  const kicker = subir(t, -0.5);
  const l1 = subir(t, -0.3);
  const l2 = subir(t, p.bloco - 0.55);
  const b = seg(t, p.bloco, p.bloco + 0.45);
  const momento = t > p.bloco ? lerp(1, 1.03, pulso(seg(t, p.bloco, p.bloco + 0.65))) : 1;
  // Saída (§5): o texto sobe/encolhe e a cena esmaece sobre o vídeo da aula nos últimos 0,35 s (sem corte seco).
  const out = sair(t, p.dur, 0.35, 20, 0.05);

  return (
    <Palco saida={{ opacity: out.opacity }}>
      <div className="nd-fundo">
        <CameraCheia camera={p.camera} dur={p.dur} />
        <div
          className="nd-palavras"
          style={{
            left: 96,
            bottom: 142, // zona segura do player (plataformas.md)
            width: 900,
            gap: 14,
            translate: `${(t * 1.5).toFixed(1)}px ${out.y.toFixed(1)}px`,
            scale: String(out.scale),
            transformOrigin: "0 100%",
          }}
        >
          <p className="nd-rotulo" style={{ fontSize: 20, opacity: kicker.opacity, translate: `0px ${kicker.y}px` }}>
            {p.rotulo}
          </p>
          <h2 className="nd-linha" style={{ opacity: l1.opacity, translate: `0px ${l1.y}px` }}>
            {p.antes}{" "}
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ opacity: lerp(1, 0.45, eo(seg(t, p.risco + 0.5, p.risco + 1))) }}>{p.riscada}</span>
              <svg
                viewBox="0 0 300 40"
                preserveAspectRatio="none"
                style={{ position: "absolute", left: -10, top: "44%", width: "calc(100% + 20px)", height: 40, overflow: "visible" }}
              >
                <Traco d="M4 24 C70 14 150 30 296 10" p={eio(seg(t, p.risco, p.risco + 0.5))} />
              </svg>
              <svg
                viewBox="0 0 76 70"
                style={{ position: "absolute", left: 64, top: -70, width: 76, height: 70, overflow: "visible" }}
              >
                <Traco
                  d="M70 6 C40 6 18 22 8 56 M8 56 L4 36 M8 56 L24 44"
                  p={eio(seg(t, p.risco + 0.5, p.risco + 0.9))}
                  largura={5}
                />
              </svg>
              <p
                className="nd-mao"
                style={{
                  position: "absolute",
                  left: -156,
                  top: -104,
                  fontSize: 50,
                  transformOrigin: "0 100%",
                  opacity: eo(seg(t, p.risco + 0.6, p.risco + 1)),
                  transform: `rotate(-4deg) translate(${tremido(t)})`,
                }}
              >
                {p.nota}
              </p>
            </span>
          </h2>
          <h2
            className="nd-linha"
            style={{ opacity: l2.opacity, translate: `0px ${l2.y}px`, scale: String(momento), transformOrigin: "0 50%" }}
          >
            {p.depois}{" "}
            <span style={{ position: "relative", display: "inline-block", padding: "0 .16em", marginLeft: ".04em" }}>
              <span
                style={{
                  position: "absolute",
                  inset: ".06em 0 0 0",
                  background: "var(--main)",
                  borderRadius: ".08em",
                  transformOrigin: "0 50%",
                  scale: `${eio(b)} 1`,
                }}
              />
              <span style={{ position: "relative", color: b > 0.5 ? "var(--accent)" : "var(--second)" }}>{p.destaque}</span>
            </span>
          </h2>
        </div>
      </div>
    </Palco>
  );
};

// Parâmetros da aula 01 (câmera e batidas ancoradas nas palavras faladas; tempos do vídeo editado).
const cam = (inicio: number) => ({ src: "01-meu-primeiro-video/editado.mp4", inicio });
// Exemplo de preenchimento (vídeo de demonstração do criador do sistema). A câmera e as imagens citadas
// não vêm no repositório: use como modelo de parâmetros, não registre no Root sem trocar pelos arquivos do seu vídeo.
export const citacaoAula01: CitacaoRiscadaProps = {
  camera: cam(84.17), // "O segredo não é sorte."
  dur: 7.5,
  rotulo: "Ponto de partida",
  antes: "O segredo não é",
  riscada: "sorte",
  nota: "esquece isso",
  depois: "é",
  destaque: "método.",
  risco: 1.1, // "sorte." 85,28 s
  bloco: 5.3, // "método." 89,48 s
};

// ───────────────────────────────────────────────────────────────────────────────
// Lote 2 (2026-11-11): variações de citação escolhidas pelo sentido da frase.
// Peças locais: câmera com planos (§6.1) e fades de leitura. CSS só inline.
// ───────────────────────────────────────────────────────────────────────────────

// Posição do rosto no bruto (fração do quadro): centralizado, olhos em y≈30%.
const ROSTO = { x: 0.48, y: 0.3 };

// Plano de câmera a partir de `t` (s desde o início da cena):
// `s` = escala (1 aberto, ~1,15 médio, ~1,3 fechado; teto 1,3 com bruto 720p),
// `x` = onde o rosto fica na tela (fração da largura; é limitado para não mostrar borda),
// `dur` = tempo da troca (0 = troca seca; ~0,13 s ≈ 4 frames = card lateral).
export type Plano = { t: number; s: number; x?: number; dur?: number };

const enquadrar = (s: number, x: number) => {
  const fx = ROSTO.x * 1920;
  const fy = ROSTO.y * 1080;
  const ox = Math.min(0, Math.max(1920 - 1920 * s, x * 1920 - s * fx));
  const oy = Math.min(0, Math.max(1080 - 1080 * s, fy - s * fy));
  return { ox, oy };
};

// Câmera cheia que troca de plano nas batidas (rastreio fixo no rosto centralizado do bruto).
export const CameraPlanos: React.FC<{ camera: Camera; dur: number; planos: Plano[] }> = ({ camera, dur, planos }) => {
  const t = useT();
  const { fps } = useVideoConfig();
  let s = 1;
  let x = ROSTO.x;
  for (const pl of planos) {
    const alvoX = pl.x ?? ROSTO.x;
    if (!pl.dur) {
      if (t >= pl.t) {
        s = pl.s;
        x = alvoX;
      }
    } else if (t >= pl.t) {
      const p = eio(seg(t, pl.t, pl.t + pl.dur));
      s = lerp(s, pl.s, p);
      x = lerp(x, alvoX, p);
    }
  }
  // Sem aproximação lenta (a câmera da aula volta a 100% no fim da cena: zoom ia e voltava; 2026-11-13).
  const { ox, oy } = enquadrar(s, x);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Video
        src={staticFile(camera.src)}
        trimBefore={Math.round(useInicioCamera(camera) * fps)}
        muted
        objectFit="cover"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) scale(${s.toFixed(4)})`,
        }}
      />
      <div className="nd-camfade" />
    </div>
  );
};

// Saída de todo o texto no fim da cena (ease-in-out curto), para não sumir no corte.
const saida = (t: number, dur: number) => 1 - eio(seg(t, dur - 0.35, dur));

// Momento-chave: entra 10–20% maior e assenta (estilo.md §5).
const chave = (t: number, a: number, de = 1.14) => {
  const p = seg(t, a, a + 0.5);
  return { opacity: eo(seg(t, a, a + 0.25)), scale: lerp(de, 1, eob(p, 1.2)) };
};

const sombra = "0 2px 18px rgba(0,0,0,.45)";

// Bloco laranja atrás de uma palavra, que cresce da esquerda (texto branco no laranja).
const BlocoLaranja: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => (
  <span style={{ position: "relative", display: "inline-block", padding: "0 .16em", marginLeft: ".04em" }}>
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

// Palavras que entram uma a uma, cada uma no seu segundo.
const Palavras: React.FC<{ t: number; itens: [string, number][] }> = ({ t, itens }) => (
  <>
    {itens.map(([w, a], i) => {
      const e = subir(t, a, 0.4, 18);
      return (
        <span key={i} style={{ display: "inline-block", opacity: e.opacity, translate: `0px ${e.y}px`, marginRight: ".24em" }}>
          {w}
        </span>
      );
    })}
  </>
);

// ── `CitacaoCard` ─────────────────────────────────────────────────────────────
// Frase com sujeito + qualificação forte ("trabalho em equipe: a vantagem do ano").
// Card de vidro entra à direita; no mesmo frame a câmera fecha (~130%) e leva o rosto para o terço esquerdo (§6.1).
// Momento-chave sublinhado à mão em laranja sob a expressão final.
export type CitacaoCardProps = {
  camera: Camera;
  dur: number;
  sujeito: string; // "Trabalho em equipe"
  frase: string; // "a vantagem"
  chaveFrase: string; // "do ano."
  card: number; // card entra + câmera fecha (palavra do sujeito)
  frasePalavra: number; // "vantagem"
  sublinhado: number; // "ano"
};

export const CitacaoCard: React.FC<CitacaoCardProps> = (p) => {
  const t = useT();
  const c = eo(seg(t, p.card, p.card + 0.5));
  const suj = subir(t, p.card + 0.08, 0.5, 18);
  const fr = subir(t, p.frasePalavra - 0.1, 0.5, 18);
  const k = chave(t, p.sublinhado - 0.25);
  const out = saida(t, p.dur);
  return (
    <Palco>
      <div className="nd-fundo">
        <CameraPlanos camera={p.camera} dur={p.dur} planos={[{ t: p.card, s: 1.2, x: 0.33, dur: 0.14 }]} /* 1,3 era zoom demais em bruto 720p (2026-11-13) */ />
        <div
          className="nd-glass"
          style={{
            left: 1060,
            top: 300,
            width: 780,
            padding: "52px 56px 60px",
            opacity: c * out,
            transform: `translateX(${lerp(60, 0, c).toFixed(1)}px) scale(${lerp(0.97, 1, c).toFixed(4)})`,
            transformOrigin: "100% 50%",
          }}
        >
          <p style={{ fontSize: 44, fontWeight: 500, lineHeight: 1.1, color: "var(--second)", opacity: suj.opacity, translate: `0px ${suj.y}px` }}>
            {p.sujeito}
          </p>
          <h2 className="nd-linha" style={{ fontSize: 84, marginTop: 26, color: "var(--accent)", opacity: fr.opacity, translate: `0px ${fr.y}px` }}>
            {p.frase}
          </h2>
          <h2
            className="nd-linha"
            style={{ fontSize: 84, color: "var(--accent)", opacity: k.opacity, scale: String(k.scale), transformOrigin: "0 60%" }}
          >
            <span style={{ position: "relative", display: "inline-block" }}>
              {p.chaveFrase}
              <svg
                viewBox="0 0 400 30"
                preserveAspectRatio="none"
                style={{ position: "absolute", left: -6, bottom: -26, width: "calc(100% + 12px)", height: 30, overflow: "visible", translate: tremido(t) }}
              >
                <Traco d="M4 18 C90 8 210 24 396 10" p={eio(seg(t, p.sublinhado, p.sublinhado + 0.45))} largura={9} />
              </svg>
            </span>
          </h2>
        </div>
      </div>
    </Palco>
  );
};

// ── `CitacaoBloco` ────────────────────────────────────────────────────────────
// Tese dita devagar, palavra a palavra ("a organização da rotina diária").
// Rótulo-frase antes ("A ideia principal"), depois a tese no peito; a palavra-chave entra num bloco laranja
// e a câmera dá um punch-in seco (médio → fechado) no mesmo frame.
export type CitacaoBlocoProps = {
  camera: Camera;
  dur: number;
  abertura: string; // "A ideia principal:"
  aberturaEm: number;
  antes: [string, number][]; // palavras antes da chave, cada uma no seu segundo
  destaque: [string, number]; // palavra-chave no bloco laranja
  depois: [string, number][]; // resto da tese
  quebraDepois?: number; // índice em `depois` que começa a 2ª linha
};

export const CitacaoBloco: React.FC<CitacaoBlocoProps> = (p) => {
  const t = useT();
  const ab = subir(t, p.aberturaEm, 0.5, 20);
  const [dw, da] = p.destaque;
  const k = chave(t, da - 0.05, 1.12);
  const b = seg(t, da + 0.05, da + 0.5);
  const foco = lerp(1, 0.55, eo(seg(t, da - 0.2, da + 0.3)));
  const out = saida(t, p.dur);
  const q = p.quebraDepois ?? p.depois.length;
  return (
    <Palco>
      <div className="nd-fundo">
        <CameraPlanos
          camera={p.camera}
          dur={p.dur}
          planos={[]} // sem zoom em duas etapas que desfazia no fim da cena (autor, 2026-11-13)
        />
        <div className="nd-palavras" style={{ left: 96, bottom: 154, width: 1300, gap: 18, opacity: out, textShadow: sombra }}>
          <p style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.1, opacity: ab.opacity * foco, translate: `0px ${ab.y}px` }}>{p.abertura}</p>
          <h2 className="nd-linha" style={{ fontSize: 84 }}>
            <Palavras t={t} itens={p.antes} />
            <span style={{ display: "inline-block", opacity: k.opacity, scale: String(k.scale), transformOrigin: "0 60%", textShadow: "none" }}>
              <BlocoLaranja p={b}>{dw}</BlocoLaranja>
            </span>
          </h2>
          <h2 className="nd-linha" style={{ fontSize: 84 }}>
            <Palavras t={t} itens={p.depois.slice(0, q)} />
            {q < p.depois.length ? <br /> : null}
            <Palavras t={t} itens={p.depois.slice(q)} />
          </h2>
        </div>
      </div>
    </Palco>
  );
};

// ── `CitacaoTese` ─────────────────────────────────────────────────────────────
// Ordem + consequência numa palavra ("pare de copiar os outros" → "genérico").
// Fase 1: rótulo do tópico e a ordem no peito. Fase 2 (palavra-tese): a ordem sai, a câmera fecha e leva o rosto
// para a direita (§6.1) e a palavra-tese entra grande no terço livre da esquerda, em laranja; nota manuscrita e
// pílulas de preço lado a lado (o "igual") entram nas palavras e um "=" à mão fecha a comparação.
export type CitacaoTeseProps = {
  camera: Camera;
  dur: number;
  rotulo: string; // "Ideia 01"
  ordem: [string, number][]; // "Pare de copiar os outros."
  apoio: string; // "você fica"
  tese: string; // "genérico."
  nota: string; // "igual a todo mundo"
  precos: [string, number][]; // [["R$ 200", t], ["R$ 300", t]]
  rotuloEm: number;
  teseEm: number; // "genérico"
  notaEm: number; // "igual"
  igualEm: number; // "sem diferença"
};

export const CitacaoTese: React.FC<CitacaoTeseProps> = (p) => {
  const t = useT();
  const out = saida(t, p.dur);
  const rot = subir(t, p.rotuloEm, 0.5, 18);
  const sai1 = 1 - eio(seg(t, p.teseEm - 0.5, p.teseEm - 0.1));
  const ap = subir(t, p.teseEm - 0.45, 0.4, 18);
  const k = chave(t, p.teseEm, 1.16);
  const nota = eo(seg(t, p.notaEm, p.notaEm + 0.45));
  const fundo = eo(seg(t, p.teseEm - 0.3, p.teseEm + 0.3));
  return (
    <Palco>
      <div className="nd-fundo">
        <CameraPlanos camera={p.camera} dur={p.dur} planos={[{ t: p.ordem[0][1], s: 1.12 }, { t: p.teseEm, s: 1.3, x: 0.63, dur: 0.14 }]} />
        {/* sombra à esquerda para a leitura no terço livre */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(25,28,35,.78) 0%, rgba(25,28,35,.45) 34%, transparent 52%)",
            opacity: fundo * out,
          }}
        />
        {/* Fase 1: rótulo + ordem no peito */}
        <div className="nd-palavras" style={{ left: 96, bottom: 84, width: 1100, gap: 18, opacity: sai1 * out, textShadow: sombra }}>
          <p className="nd-rotulo" style={{ fontSize: 28, opacity: rot.opacity, translate: `0px ${rot.y}px` }}>
            {p.rotulo}
          </p>
          <h2 className="nd-linha" style={{ fontSize: 84 }}>
            <Palavras t={t} itens={p.ordem} />
          </h2>
        </div>
        {/* Fase 2: palavra-tese no terço livre */}
        <div className="nd-palavras" style={{ left: 96, top: 268, width: 800, gap: 0, opacity: out, textShadow: sombra }}>
          <p className="nd-rotulo" style={{ fontSize: 28, opacity: ap.opacity, translate: `0px ${ap.y}px`, marginBottom: 30 }}>
            {p.rotulo}
          </p>
          <p style={{ fontSize: 52, fontWeight: 500, lineHeight: 1, opacity: ap.opacity, translate: `0px ${ap.y}px` }}>{p.apoio}</p>
          <h2
            className="nd-linha"
            style={{
              fontSize: 136,
              lineHeight: 0.95,
              marginTop: 10,
              color: "var(--main)",
              opacity: k.opacity,
              scale: String(k.scale),
              transformOrigin: "0 70%",
            }}
          >
            {p.tese}
          </h2>
          <p
            className="nd-mao"
            style={{
              fontSize: 60,
              marginTop: 18,
              opacity: nota,
              transformOrigin: "0 100%",
              transform: `rotate(-3deg) translate(${tremido(t)})`,
            }}
          >
            {p.nota}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 40, height: 84 }}>
            {p.precos.map(([v, a], i) => {
              const e = subir(t, a, 0.45, 16);
              return (
                <div key={i} style={{ display: "contents" }}>
                  {i > 0 ? (
                    <svg viewBox="0 0 60 40" style={{ width: 60, height: 40, overflow: "visible", translate: tremido(t) }}>
                      <Traco d="M6 12 C22 10 38 13 54 11" p={eio(seg(t, p.igualEm, p.igualEm + 0.25))} largura={6} cor="var(--accent)" />
                      <Traco d="M6 30 C22 28 38 31 54 29" p={eio(seg(t, p.igualEm + 0.15, p.igualEm + 0.4))} largura={6} cor="var(--accent)" />
                    </svg>
                  ) : null}
                  <div
                    className="nd-glass nd-num"
                    style={{
                      position: "relative",
                      borderRadius: 999,
                      padding: "16px 30px",
                      fontSize: 40,
                      fontWeight: 500,
                      textShadow: "none",
                      opacity: e.opacity,
                      translate: `0px ${e.y}px`,
                    }}
                  >
                    {v}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Palco>
  );
};

// ── `CitacaoParalela` ─────────────────────────────────────────────────────────
// Paralelismo "X vem antes de A. E X vem antes de B": o começo comum aparece uma vez e os dois finais empilham
// embaixo, alinhados; "antes" ganha o sublinhado laranja à mão. O começo pulsa de leve quando é repetido na fala.
// Câmera fecha e leva o rosto para a direita (§6.1); texto no terço livre da esquerda.
export type CitacaoParalelaProps = {
  camera: Camera;
  dur: number;
  comum: string[]; // ["O plano", "vem antes"] (linhas; a palavra-chave fecha a última)
  palavraChave: string; // "antes"
  finais: [string, number][]; // [["da ação.", t], ["do resultado.", t]]
  comumEm: number; // "plano"
  chaveEm: number; // "antes" (1ª vez)
  repeteEm: number; // "E o plano vem antes" (2ª vez)
};

export const CitacaoParalela: React.FC<CitacaoParalelaProps> = (p) => {
  const t = useT();
  const out = saida(t, p.dur);
  const c = subir(t, p.comumEm - 0.1, 0.45, 20);
  const rep = lerp(1, 1.025, pulso(seg(t, p.repeteEm, p.repeteEm + 0.5)));
  const ultima = p.comum[p.comum.length - 1];
  const base = ultima.slice(0, ultima.length - p.palavraChave.length);
  const [f1, f1Em] = p.finais[0];
  const k = chave(t, f1Em - 0.05, 1.14);
  // um foco por vez: quando o 2º final entra, o 1º cai
  const cai = lerp(1, 0.5, eo(seg(t, p.finais[1][1] - 0.1, p.finais[1][1] + 0.3)));
  const fundo = eo(seg(t, p.comumEm - 0.3, p.comumEm + 0.2));
  return (
    <Palco>
      <div className="nd-fundo">
        <CameraPlanos camera={p.camera} dur={p.dur} planos={[{ t: p.comumEm - 0.1, s: 1.3, x: 0.63, dur: 0.14 }]} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(25,28,35,.78) 0%, rgba(25,28,35,.45) 34%, transparent 52%)",
            opacity: fundo * out,
          }}
        />
        <div className="nd-palavras" style={{ left: 96, top: 300, width: 800, gap: 0, opacity: out, textShadow: sombra }}>
          <div style={{ opacity: c.opacity, translate: `0px ${c.y}px`, scale: String(rep), transformOrigin: "0 50%", marginBottom: 22 }}>
            {p.comum.slice(0, -1).map((l, i) => (
              <h2 key={i} className="nd-linha" style={{ fontSize: 88 }}>
                {l}
              </h2>
            ))}
            <h2 className="nd-linha" style={{ fontSize: 88 }}>
              {base}
              <span style={{ position: "relative", display: "inline-block" }}>
                {p.palavraChave}
                <svg
                  viewBox="0 0 200 30"
                  preserveAspectRatio="none"
                  style={{ position: "absolute", left: -4, bottom: -20, width: "calc(100% + 8px)", height: 24, overflow: "visible", translate: tremido(t) }}
                >
                  <Traco d="M4 16 C60 8 130 22 196 10" p={eio(seg(t, p.chaveEm, p.chaveEm + 0.4))} largura={9} />
                </svg>
              </span>
            </h2>
          </div>
          <h2
            className="nd-linha"
            style={{ fontSize: 88, paddingLeft: 64, opacity: k.opacity * cai, scale: String(k.scale), transformOrigin: "0 60%" }}
          >
            {f1}
          </h2>
          {p.finais.slice(1).map(([f, a], i) => {
            const e = chave(t, a - 0.05, 1.08);
            return (
              <h2 key={i} className="nd-linha" style={{ fontSize: 88, paddingLeft: 64, opacity: e.opacity, scale: String(e.scale), transformOrigin: "0 60%" }}>
                {f}
              </h2>
            );
          })}
        </div>
      </div>
    </Palco>
  );
};

// ── `CitacaoContraste` ────────────────────────────────────────────────────────
// Contraste "com atenção, e não no automático": rótulo do conceito, a frase certa com o trecho-chave no bloco
// laranja e a versão errada embaixo, riscada à mão em branco. Câmera fecha e leva o rosto para a esquerda (§6.1);
// texto à direita, sobre sombra suave.
export type CitacaoContrasteProps = {
  camera: Camera;
  dur: number;
  rotulo: string; // "Foco"
  frase: string; // "O trabalho rende"
  certo: string; // "com atenção,"
  errado: string; // "no automático."
  rotuloEm: number; // "foco"
  fraseEm: number; // "o trabalho render"
  certoEm: number; // "atenção"
  erradoEm: number; // "no automático"
  riscoEm: number; // "automático." final
};

export const CitacaoContraste: React.FC<CitacaoContrasteProps> = (p) => {
  const t = useT();
  const out = saida(t, p.dur);
  const rot = subir(t, p.rotuloEm, 0.5, 18);
  const fr = subir(t, p.fraseEm, 0.5, 20);
  const k = chave(t, p.certoEm - 0.05, 1.14);
  const b = seg(t, p.certoEm + 0.05, p.certoEm + 0.5);
  const er = subir(t, p.erradoEm, 0.4, 16);
  const risco = eio(seg(t, p.riscoEm, p.riscoEm + 0.4));
  const apaga = lerp(1, 0.5, eo(seg(t, p.riscoEm + 0.3, p.riscoEm + 0.8)));
  const fundo = eo(seg(t, p.rotuloEm - 0.2, p.rotuloEm + 0.3));
  return (
    <Palco>
      <div className="nd-fundo">
        <CameraPlanos
          camera={p.camera}
          dur={p.dur}
          planos={[
            { t: p.rotuloEm, s: 1.2, x: 0.33, dur: 0.14 }, // 1,3 era zoom demais em bruto 720p (2026-11-13)
          ]}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(270deg, rgba(25,28,35,.86) 0%, rgba(25,28,35,.6) 36%, transparent 52%)",
            opacity: fundo * out,
          }}
        />
        <div className="nd-palavras" style={{ left: 1120, top: 540, width: 760, gap: 14, opacity: out, textShadow: sombra }}>
          <p className="nd-rotulo" style={{ fontSize: 28, opacity: rot.opacity, translate: `0px ${rot.y}px`, marginBottom: 14 }}>
            {p.rotulo}
          </p>
          <h2 className="nd-linha" style={{ fontSize: 76, opacity: fr.opacity, translate: `0px ${fr.y}px` }}>
            {p.frase}
          </h2>
          <h2 className="nd-linha" style={{ fontSize: 76, opacity: k.opacity, scale: String(k.scale), transformOrigin: "0 60%", textShadow: "none" }}>
            <BlocoLaranja p={b}>{p.certo}</BlocoLaranja>
          </h2>
          <h2 className="nd-linha" style={{ fontSize: 76, marginTop: 8, opacity: er.opacity, translate: `0px ${er.y}px` }}>
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ opacity: apaga }}>{p.errado}</span>
              <svg
                viewBox="0 0 300 40"
                preserveAspectRatio="none"
                style={{ position: "absolute", left: -10, top: "40%", width: "calc(100% + 20px)", height: 40, overflow: "visible", translate: tremido(t) }}
              >
                <Traco d="M4 26 C80 12 170 30 296 8" p={risco} cor="var(--accent)" />
              </svg>
            </span>
          </h2>
        </div>
      </div>
    </Palco>
  );
};
