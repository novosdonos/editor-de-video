import "./index.css";
import { AbsoluteFill, Composition } from "remotion";
import { Aula, calcularAula, type AulaProps } from "./Aula";
import { Reels, calcularReels, type ReelsProps } from "./Reels";

// Componentes do catálogo ficam em src/componentes (estilo.md §10). Cada vídeo registra aqui as cenas que usa,
// com os parâmetros do próprio vídeo (câmera e batidas ancoradas nas palavras faladas).

const TesteAmbiente: React.FC = () => (
  <AbsoluteFill style={{ background: "#111", color: "#fff", justifyContent: "center", alignItems: "center", fontSize: 48 }}>ok</AbsoluteFill>
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Aula"
        component={Aula}
        // fps, tamanho e duração reais vêm do aula.json (calcularAula)
        durationInFrames={30}
        fps={30}
        width={1280}
        height={720}
        defaultProps={
          {
            aula: "01-meu-primeiro-video",
            mostrarLegendas: true,
          } satisfies AulaProps
        }
        calculateMetadata={calcularAula}
      />
      <Composition
        id="Reels"
        component={Reels}
        // vertical dividido 1080×1920; duração = editado + cartão final (calcularReels)
        durationInFrames={30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ aula: "01a-meu-corte" } satisfies ReelsProps}
        calculateMetadata={calcularReels}
      />
      {/* Teste do ambiente (verificar_ambiente.py --teste): não depende de vídeo, só confere que o Remotion renderiza. */}
      <Composition id="Teste" component={TesteAmbiente} fps={30} width={320} height={180} durationInFrames={1} />
    </>
  );
};
