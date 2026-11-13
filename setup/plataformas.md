# Plataformas e formatos

**Formato** define a estrutura do vídeo (o que o roteiro monta).
**Plataforma** define o arquivo final (o que a edição exporta).
Um vídeo tem um formato e uma ou mais plataformas; a edição gera um arquivo em `final/` para cada plataforma.

---

## 1. Formatos

| Formato | Duração | Proporção | Estrutura | Ritmo |
|---|---|---|---|---|
| `reels` | 30–90 s (ideal até 60 s) | 9:16 | Gancho (0–3 s) → desenvolvimento → CTA | Corte ou mudança visual a cada 2–4 s; legenda sempre; sem respiro |
| `youtube` | 8–20 min | 16:9 | Gancho (0–30 s) → promessa → capítulos → CTA no meio e no fim | Mudança visual a cada 5–10 s; título por capítulo |
| `aula` | 5–30 min | 16:9 | Objetivo → conteúdo em seções → resumo → tarefa | Mudança visual a cada 10–20 s; motion para estruturar, não para enfeitar |
| `criativo` | 15–60 s | 9:16 (e 1:1 / 4:5 se pedido) | Gancho → problema → prova → oferta → CTA | Igual a reels, gancho ainda mais curto (0–2 s); gera matriz de variações |

O ritmo é o ponto de partida; o `estilo.md` do autor ajusta.

---

## 2. Plataformas

### Vertical (9:16, 1080 × 1920, 30 fps)

As interfaces dos apps cobrem partes do vídeo (@, legenda do post, botões). Os números abaixo são **conservadores**: os números publicados divergem e os apps mudam a interface. Conferir no celular no primeiro vídeo de cada plataforma e ajustar aqui.

| Plataforma | Livre no topo | Livre embaixo | Livre à direita | Livre à esquerda | Duração máx. | Áudio |
|---|---|---|---|---|---|---|
| `instagram` (Reels) | 250 px | 480 px | 150 px | 65 px | 3 min | -14 LUFS |
| `tiktok` | 220 px | 480 px | 180 px | 65 px | 10 min | -14 LUFS |
| `shorts` (YouTube) | 290 px | 480 px | 190 px | 50 px | 3 min | -14 LUFS |

**Zona segura comum** (para um único arquivo servir às três): `x 65–890`, `y 290–1440` (≈ 825 × 1150 px).

Regras para vertical:
- **Legenda**: base do bloco no máximo em `y = 1400`; posição padrão centrada entre `y 1100–1400`. Nunca no terço inferior da tela.
- **Rosto**: olhos entre `y 500–750`; nada de motion sobre o rosto.
- **Texto e CTA**: dentro da zona segura comum; evitar o canto inferior direito (botões e "inscrever-se").
- **Primeiro frame**: precisa funcionar como capa (gancho legível, rosto visível).

### Horizontal (16:9, 1920 × 1080 ou 3840 × 2160, 30 fps)

| Plataforma | Áreas a evitar | Áudio | Observações |
|---|---|---|---|
| `youtube` | Faixa inferior de ~120 px (controles do player); últimos 5–20 s no canto direito se usar tela final | -14 LUFS | Capítulos a partir dos títulos de seção (primeiro em 00:00) |
| `aula` (área de membros) | Faixa inferior de ~120 px (controles do player) | -16 LUFS | Legenda opcional (definida no `estilo.md`); sem tela final |

Regras para horizontal:
- **Margem de título**: 5% de cada lado (96 px em 1080p).
- **Legenda**: base em no máximo `y = 960` (1080p).

---

## 3. Exportação

| Item | Valor |
|---|---|
| Codec | H.264 (High), MP4 |
| Bitrate vertical 1080p | 12–16 Mbps |
| Bitrate horizontal 1080p / 4K | 12–16 / 35–45 Mbps |
| Áudio | AAC 48 kHz, 320 kbps, pico máximo -1 dBTP |
| Nome do arquivo | `final/<plataforma>.mp4`; variações: `final/<variacao>_<plataforma>.mp4` |

---

## 4. Calibração

Quando o autor conferir no celular e algo ficar coberto, a correção vem para esta tabela (com data), não para o vídeo. Assim vale para todos os próximos.

| Data | Plataforma | Ajuste | Motivo |
|---|---|---|---|
| | | | |
