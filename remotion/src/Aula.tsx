import type { Caption } from "@remotion/captions";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { linhas } from "./aulas";
import { LegendaAnimada } from "./legendas/LegendaAnimada";
import { Camera, Sons, type DadosCamera, type DadosSfx } from "./Camera";
import { mapear, TempoCtx, type Pares } from "./reels/remapa";

// Dados gravados pelo codigos/08_exportar_para_remotion.py em public/<aula>/aula.json
type DadosAula = {
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  legendas: Caption[];
  camera?: DadosCamera; // seção "enquadramento" (09)
  sfx?: DadosSfx; // seção "sfx" (10)
};

export type AulaProps = {
  aula: string; // nome da pasta da aula, ex.: "01-meu-primeiro-video"
  mostrarLegendas: boolean;
  legendas?: Caption[];
  camera?: DadosCamera;
  sfx?: DadosSfx;
  // public/<aula>/remapa.json: [tempo velho, tempo novo] por palavra, quando o editado foi refeito depois do motion
  remapa?: Pares;
};

export const calcularAula: CalculateMetadataFunction<AulaProps> = async ({
  props,
}) => {
  const resposta = await fetch(staticFile(`${props.aula}/aula.json`));
  if (!resposta.ok) {
    throw new Error(
      `public/${props.aula}/aula.json não encontrado. Rode o codigos/08_exportar_para_remotion.py da aula.`,
    );
  }
  const dados: DadosAula = await resposta.json();
  const r = await fetch(staticFile(`${props.aula}/remapa.json`)).catch(() => null);
  const remapa: Pares | undefined = r && r.ok ? await r.json() : undefined;
  // Bruto menor que 1080p renderiza ampliado para 1080p: o motion é desenhado em 1920×1080 e, no tamanho
  // do bruto (720p), traço fino ficava com menos de 1 px e pixelado (aula 01, 2026-11-12).
  const amplia = Math.max(1, 1080 / Math.min(dados.largura, dados.altura));
  return {
    fps: dados.fps,
    width: Math.round((dados.largura * amplia) / 2) * 2,
    height: Math.round((dados.altura * amplia) / 2) * 2,
    durationInFrames: Math.ceil(dados.duracao * dados.fps),
    props: { ...props, legendas: dados.legendas, camera: dados.camera, sfx: dados.sfx, remapa },
  };
};

export const Aula: React.FC<AulaProps> = ({ aula, mostrarLegendas, legendas, camera, sfx, remapa }) => {
  const { fps } = useVideoConfig();
  const novo = (t: number) => mapear(remapa, t, 0, 1);
  const novoParaVelho = (t: number) => mapear(remapa, t, 1, 0);
  return (
    <AbsoluteFill className="bg-black">
      <Camera dados={camera}>
        <Video
          name="Vídeo editado"
          src={staticFile(`${aula}/editado.mp4`)}
          style={{ width: "100%", height: "100%" }}
        />
      </Camera>
      <Sons dados={sfx} />
      {(linhas[aula] ?? []).map((item) => {
        // com remapa, a cena vai para o tempo novo e recebe o tempo velho por dentro (useT / useInicioCamera)
        const inicio = novo(item.inicio);
        const fim = novo(item.inicio + item.dur);
        const tempo = remapa ? { novoParaVelho, velhoParaNovo: novo, inicioNovo: inicio, inicioVelho: item.inicio } : null;
        return (
          <Sequence
            key={item.id}
            name={item.id}
            from={Math.round(inicio * fps)}
            durationInFrames={Math.max(1, Math.round((fim - inicio) * fps))}
            layout="none"
          >
            <TempoCtx.Provider value={tempo}>
              <AbsoluteFill>{item.render()}</AbsoluteFill>
            </TempoCtx.Provider>
          </Sequence>
        );
      })}
      {mostrarLegendas && legendas ? <LegendaAnimada legendas={legendas} /> : null}
    </AbsoluteFill>
  );
};
