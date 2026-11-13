// Tokens da marca (setup/estilo.md §2). Valores neutros de fábrica: a /video-setup troca pelos do autor.
import { loadFont as carregarPrincipal } from "@remotion/google-fonts/Inter";
import { loadFont as carregarMono } from "@remotion/google-fonts/DMMono";
import { loadFont as carregarCaveat } from "@remotion/google-fonts/Caveat";

const latino = { subsets: ["latin", "latin-ext"] as ("latin" | "latin-ext")[] };

// Autor: rótulo que aparece no painel da câmera (layout `reduzida`). Preenchido pela /video-setup.
export const autor = {
  rotulo: "Seu nome · Sua marca",
};

export const { fontFamily } = carregarPrincipal("normal", {
  weights: ["400", "500", "600"],
  ...latino,
});
export const fonteMono = carregarMono("normal", { weights: ["400", "500"], ...latino }).fontFamily;
export const fonteMao = carregarCaveat("normal", { weights: ["700"], ...latino }).fontFamily;

// Os nomes das chaves são usados pelos componentes; troque só os valores.
export const cores = {
  sinopia: "#2F6FED", // destaque único — usar com parcimônia
  preto: "#16181D",
  branco: "#F2F2F2",
  puro: "#FFFFFF",
  superficie: "#22252C",
  mudo: "#5C6370",
  linha: "#E4E6EA",
  ok: "#1F8A5B",
};
