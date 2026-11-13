// Curvas e tempos únicos do sistema (estilo.md §5). Nenhum componente define curva própria.
// Tudo é função pura do tempo t (segundos desde o início da cena): renderiza igual em qualquer frame.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// Progresso 0→1 de t entre a e b.
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

// Entrada (ease-out), movimento entre dois pontos (ease-in-out), entrada com passagem e assentamento (back).
export const eo = (p: number) => 1 - Math.pow(1 - p, 3);
export const eio = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
export const eob = (p: number, s = 1.70158) => {
  const c3 = s + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
};

// Curva cúbica de Bézier (mesma conta do CSS `cubic-bezier`), para curvas medidas em referência.
export const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const x = (u: number) => ((ax * u + bx) * u + cx) * u;
  const y = (u: number) => ((ay * u + by) * u + cy) * u;
  return (p: number) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let lo = 0, hi = 1, u = p;
    for (let i = 0; i < 24; i++) { // bisseção: estável em qualquer quadro
      if (x(u) < p) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return y(u);
  };
};

// Entrada longa (expo-out, cubic-bezier(0.16, 1, 0.3, 1); medida em onprofit.com.br, 2026-11-13): chega quase
// inteira no primeiro terço e passa o resto assentando. Serve a card e objeto que entram e ficam (notificação,
// card de venda, janela de chat): parece leve e caro, sem o "freio" do fim do `eo`. Não serve a batida de fala
// (palavra em destaque, contador sincronizado com a voz), onde o `eo` marca o tempo com mais clareza, nem a
// objeto que viaja de um ponto a outro (aí é `eio`). Duração de referência: ~0,55 s para card.
export const eox = bezier(0.16, 1, 0.3, 1);

// Movimento vivo: deriva lenta em volta do ponto de repouso (seno), para o que já entrou não congelar.
// Amplitude pequena (3–6 px) e período longo (5–7 s); `fase` defasa elementos vizinhos para não andarem juntos.
// Usar em satélites (cards no mapa, chips, ícones) enquanto a fala segue; não no foco que está sendo lido
// (texto longo, número que conta) nem quando a cena pede peso e silêncio (fecho, frase de impacto).
export const flutua = (t: number, amp = 4, periodo = 6, fase = 0) => amp * Math.sin((t / periodo) * 2 * Math.PI + fase);

// Saída (ease-in, espelho do ease-out).
export const ei = (p: number) => 1 - eo(1 - p);

// Saída padrão de cena/texto (estilo.md §5): nos últimos `d` s da janela, esmaece, sobe e encolhe (ease-in).
// Acontece dentro da duração da cena (não a estende).
export const sair = (t: number, dur: number, d = 0.35, dist = 20, enc = 0.05) => {
  const p = ei(seg(t, dur - d, dur));
  return { opacity: 1 - p, y: -dist * p, scale: 1 - enc * p, p };
};

// Pulso 0→1→0 (momento-chave que entra maior e assenta).
export const pulso = (p: number) => Math.sin(clamp01(p) * Math.PI);

// Tremido do traço manuscrito: 3 variações a 12 fps.
export const tremido = (t: number) =>
  ["0px, 0px", "1.2px, -0.8px", "-0.9px, 1px"][Math.floor(t * 12) % 3];

// Entrada padrão de texto/card: sobe e aparece.
export const subir = (t: number, inicio: number, dur = 0.6, dist = 26) => {
  const p = eo(seg(t, inicio, inicio + dur));
  return { opacity: p, y: lerp(dist, 0, p) };
};

export const brl = (v: number) => Math.round(v).toLocaleString("pt-BR");
