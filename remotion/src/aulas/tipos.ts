// Item da linha do tempo de uma aula. `inicio` e `dur` em segundos do vídeo editado.
// tipo "cena": desenha a própria câmera (tela inteira). tipo "destaque": camada transparente sobre o vídeo.
import type React from "react";

export type ItemLinha = {
  id: string;
  tipo: "cena" | "destaque";
  inicio: number;
  dur: number;
  // segundos desde `inicio` em que o primeiro elemento aparece de fato (o 10 toca o som de entrada aqui; padrão 0)
  entrada?: number;
  // sons com contexto real (o 10 só toca estes): t em s desde `inicio`; tipo: notificacao, contador, clique,
  // digitacao, impacto, rolagem, revelar, transicao, obturador
  sons?: { t: number; tipo: string }[];
  render: () => React.ReactNode;
};
