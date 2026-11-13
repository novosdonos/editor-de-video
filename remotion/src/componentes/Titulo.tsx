// `titulo` · abertura da aula sobre a câmera cheia: rótulo da trilha (com o traço laranja) + título grande no peito.
// O título entra 12% maior e assenta (momento-chave); sai junto no fim da cena.
import { eio, eo, eob, lerp, seg, subir } from "../movimento";
import { CameraPlanos, type Plano } from "./Citacao";
import { Palco, useT, type Camera } from "./comum";

export type TituloAulaProps = {
  camera: Camera;
  dur: number;
  rotulo: string; // ex.: "Módulo 1 · Aula 01"
  linhas: string[]; // ex.: ["Título", "da aula."]
  rotuloEm: number; // palavra que traz o rótulo
  tituloEm: number; // quando o título entra e assenta
  planos?: Plano[];
};

export const TituloAula: React.FC<TituloAulaProps> = (p) => {
  const t = useT();
  const out = 1 - eio(seg(t, p.dur - 0.35, p.dur));
  const rot = subir(t, p.rotuloEm, 0.5, 18);
  const traco = eo(seg(t, p.rotuloEm, p.rotuloEm + 0.45));
  return (
    <Palco>
      <div className="nd-fundo">
        <CameraPlanos camera={p.camera} dur={p.dur} planos={p.planos ?? []} />
        <div
          className="nd-palavras"
          style={{ left: 96, bottom: 92, width: 1200, gap: 26, opacity: out, textShadow: "0 2px 18px rgba(0,0,0,.45)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: rot.opacity, translate: `0px ${rot.y}px` }}>
            <span
              style={{
                width: 64,
                height: 6,
                borderRadius: 3,
                background: "var(--main)",
                transformOrigin: "0 50%",
                scale: `${traco} 1`,
              }}
            />
            <p className="nd-rotulo" style={{ fontSize: 28 }}>
              {p.rotulo}
            </p>
          </div>
          <div>
            {p.linhas.map((l, i) => {
              const a = p.tituloEm + i * 0.12;
              const e = eob(seg(t, a, a + 0.55), 1.2);
              return (
                <h2
                  key={i}
                  className="nd-linha"
                  style={{
                    fontSize: 132,
                    lineHeight: 0.95,
                    opacity: eo(seg(t, a, a + 0.25)),
                    scale: String(lerp(1.12, 1, e)),
                    translate: `0px ${lerp(20, 0, eo(seg(t, a, a + 0.45))).toFixed(1)}px`,
                    transformOrigin: "0 70%",
                  }}
                >
                  {l}
                </h2>
              );
            })}
          </div>
        </div>
      </div>
    </Palco>
  );
};
