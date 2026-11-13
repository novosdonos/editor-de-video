import type { ItemLinha } from "./tipos";

// Linha do tempo de motion por vídeo (chave = pasta em public/, ex.: "01-meu-primeiro-video").
// Cada vídeo ganha um arquivo nesta pasta (ex.: video01.tsx, exportando linhaVideo01) com as cenas
// e destaques ancorados nas palavras faladas, e entra aqui. Lido pelo Aula.tsx e pelo scripts/linha.mjs (09 e 10).
export const linhas: Record<string, ItemLinha[]> = {};
