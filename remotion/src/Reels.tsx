// Composição vertical dividida (reels): imagem/motion na faixa de cima, câmera embaixo, emenda em degradê,
// headline só na abertura e palavras-chave no peito (estilo.md §3.1).
// Câmera e sons vêm do aula.json (09/10), igual à composição Aula.
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Img, useCurrentFrame } from "remotion";
import { eio, seg } from "./movimento";
import { Camera, Sons, type DadosCamera, type DadosSfx } from "./Camera";
import { reels } from "./reels/index";
import { Headline, LAYOUT } from "./reels/kit";
import { mapear, TempoCtx, type Pares } from "./reels/remapa";

type DadosAula = {
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  camera?: DadosCamera;
  sfx?: DadosSfx;
};

export type ReelsProps = {
  aula: string; // pasta em public/
  duracaoVideo?: number;
  camera?: DadosCamera;
  sfx?: DadosSfx;
  proporcao?: number; // largura/altura do vídeo da câmera
  remapa?: Pares; // public/<aula>/remapa.json (opcional)
};

export const calcularReels: CalculateMetadataFunction<ReelsProps> = async ({ props }) => {
  const resposta = await fetch(staticFile(`${props.aula}/aula.json`));
  if (!resposta.ok) throw new Error(`public/${props.aula}/aula.json não encontrado. Rode o 08.`);
  const dados: DadosAula = await resposta.json();
  const r = await fetch(staticFile(`${props.aula}/remapa.json`)).catch(() => null);
  const remapa: Pares | undefined = r && r.ok ? await r.json() : undefined;
  const def = reels[props.aula];
  if (!def) throw new Error(`Reels sem linha do tempo: ${props.aula} (src/reels/index.ts)`);
  return {
    fps: dados.fps,
    width: LAYOUT.largura,
    height: LAYOUT.altura,
    durationInFrames: Math.ceil((dados.duracao + def.final.dur) * dados.fps),
    props: {
      ...props,
      duracaoVideo: dados.duracao,
      camera: dados.camera,
      sfx: dados.sfx,
      proporcao: dados.largura / dados.altura,
      remapa,
    },
  };
};

// Frame congelado no lugar de uma inserção do vídeo original; aproxima devagar (zoom) para parecer movimento de câmera.
const Congelado: React.FC<{ src: string; dur: number; zoom: number }> = ({ src, dur, zoom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = eio(seg(frame / fps, 0, dur));
  return (
    <Img
      src={staticFile(src)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: `scale(${1 + zoom * p})`, transformOrigin: "50% 35%" }}
    />
  );
};

export const Reels: React.FC<ReelsProps> = ({ aula, duracaoVideo = 0, camera, sfx, proporcao = 16 / 9, remapa }) => {
  const { fps } = useVideoConfig();
  const def = reels[aula];
  const novo = (t: number) => mapear(remapa, t, 0, 1);
  const novoParaVelho = (t: number) => mapear(remapa, t, 1, 0);
  const congelar = (def.congelar ?? []).map((c) => ({ ...c, inicio: novo(c.inicio), fim: novo(c.fim) }));
  const larguraCamera = LAYOUT.cameraAltura * proporcao;
  const video = (
    <Video
      name="Vídeo editado"
      src={staticFile(`${aula}/editado.mp4`)}
      style={{ width: "100%", height: "100%" }}
    />
  );
  const mascara = `linear-gradient(to bottom, transparent 0, black ${LAYOUT.fadeCamera}px)`;
  const itens = (zona: "topo" | "frente") =>
    def.itens
      .filter((i) => i.zona === zona)
      .map((item) => (
        <Sequence
          key={item.id}
          name={item.id}
          from={Math.round(novo(item.inicio) * fps)}
          durationInFrames={Math.max(1, Math.round((novo(item.inicio + item.dur) - novo(item.inicio)) * fps))}
          layout="none"
        >
          <TempoCtx.Provider value={{ novoParaVelho, inicioNovo: novo(item.inicio), inicioVelho: item.inicio }}>
            <AbsoluteFill>{item.render()}</AbsoluteFill>
          </TempoCtx.Provider>
        </Sequence>
      ));

  return (
    <AbsoluteFill style={{ backgroundColor: def.tema.fundo }}>
      {/* fundo da faixa de cima quando não há imagem: a própria câmera, ampliada, escura e desfocada */}
      <AbsoluteFill style={{ height: LAYOUT.faixaFim + 200, overflow: "hidden", opacity: 0.5 }}>
        <div
          style={{
            position: "absolute",
            height: LAYOUT.faixaFim + 200,
            width: (LAYOUT.faixaFim + 200) * proporcao,
            left: (LAYOUT.largura - (LAYOUT.faixaFim + 200) * proporcao) / 2,
            filter: "blur(28px) brightness(.55) saturate(1.1)",
          }}
        >
          {video}
          {congelar.map((c) => (
            <Sequence key={c.src} from={Math.round(c.inicio * fps)} durationInFrames={Math.max(1, Math.round((c.fim - c.inicio) * fps))} layout="none">
              <Img src={staticFile(c.src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
            </Sequence>
          ))}
        </div>
      </AbsoluteFill>

      <Sequence name="faixa de cima" layout="none">
        {itens("topo")}
      </Sequence>

      {/* câmera: quadro 16:9 com altura fixa, centralizado; topo em degradê */}
      <div
        style={{
          position: "absolute",
          top: LAYOUT.cameraTopo,
          left: 0,
          width: LAYOUT.largura,
          height: LAYOUT.cameraAltura,
          overflow: "hidden",
          maskImage: mascara,
          WebkitMaskImage: mascara,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            height: LAYOUT.cameraAltura,
            width: larguraCamera,
            left: (LAYOUT.largura - larguraCamera) / 2,
            overflow: "hidden",
          }}
        >
          <Camera dados={camera}>
            {video}
            {congelar.map((c) => (
              <Sequence key={c.src} name="câmera congelada" from={Math.round(c.inicio * fps)} durationInFrames={Math.max(1, Math.round((c.fim - c.inicio) * fps))} layout="none">
                <Congelado src={c.src} dur={c.fim - c.inicio} zoom={c.zoom ?? 0} />
              </Sequence>
            ))}
          </Camera>
        </div>
      </div>

      <Sons dados={sfx} />
      {def.trilha ? def.trilha(duracaoVideo) : null}

      <Sequence name="frente" layout="none">
        {itens("frente")}
      </Sequence>

      <Sequence name="headline" durationInFrames={Math.round(novo(def.headlineFim) * fps)} layout="none">
        <TempoCtx.Provider value={{ novoParaVelho, inicioNovo: 0, inicioVelho: 0 }}>
          <Headline linhas={def.headline} tema={def.tema} dur={def.headlineFim} />
        </TempoCtx.Provider>
      </Sequence>

      <Sequence name="cartão final" from={Math.round(duracaoVideo * fps)} layout="none">
        <AbsoluteFill>{def.final.render()}</AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
