---
name: video-editar
description: Edita um vídeo gravado — confere o bruto, transcreve, corta erros e pausas, trata áudio e cor, planeja e monta motion e legenda no Remotion e entrega por plataforma, com aprovações em lote. Também faz roteiro reverso de vídeo pronto sem roteiro, variações (hooks/CTAs), cortes curtos de vídeo longo e lotes. Use quando o usuário enviar um vídeo, disser "edita", "edita esse vídeo/aula", "gravei", "faz os cortes para reels", "troca o hook", ou pedir ajuste num vídeo já editado.
---

# /video-editar

Leia sempre: `CLAUDE.md`, o `video.md` do vídeo (a seção "Direção" primeiro) e `direcao.md` (nesta pasta: como decidir). O resto, só o da etapa em que o vídeo está. O `setup/estilo.md` é longo: abra as seções da etapa, não o arquivo inteiro (ele é base, não lei).

| Etapa | Ler |
|---|---|
| 1–3 Preparar, transcrever, cortes | `setup/vocabulario.md`; `estilo.md` §6 e §6.2; `perfil.md` §7 (checagem do bruto) |
| 4–5 Mapa e material | `estilo.md` §3, §4, §8, §11–§13; `setup/referencias/indice.md`; `elementos.md` §5 se houver `arquivo` |
| 6 Motion | o mapa aprovado no `video.md`; `estilo.md` §2, §5, §10–§13; `plataformas.md` §2 |
| 7 Câmera | `estilo.md` §6.1 |
| 8 Som | `estilo.md` §9 |
| 9 Entrega | `revisor.md` (nesta pasta); `plataformas.md` §2–§3 |

Antes de mandar qualquer amostra ao autor: os itens do `revisor.md` que valem para a etapa.
Todos os códigos rodam com `.venv/bin/python codigos/<nn>_*.py videos/<slug>` a partir da raiz.

## Princípios

- **Direção antes de decisão.** Toda escolha (formato, ritmo, transição, câmera, som) responde à seção "Direção" do `video.md`; o `estilo.md` é a base de partida, e a direção pode mudá-la com o motivo escrito (`direcao.md`). Nenhuma etapa aplica a base sem conferir se ela serve a este vídeo.
- **Decidir em texto, renderizar uma vez.** Cada etapa grava só a sua seção no `edicao/transcricao.json`; o render final junta as camadas.
- **Uma etapa, um assunto, um portão.** Cortes → mapa de motion → material → motion → câmera → som, nessa ordem; cada etapa só começa com a anterior aprovada no `video.md`. Nunca planejar nem produzir motion sobre cortes não aprovados: corte mudado depois desloca todas as cenas, e erro de corte escondido atrás de motion só aparece na revisão do motion (2026-11-11, aula 01: fala invertida e emendas repetidas descobertas na revisão do motion; ref. fluxo de Lucas Leite, W7E7Ln0z6aY).
- **Revisão por exceção.** O autor nunca precisa assistir ao vídeo inteiro antes da entrega: cada portão mostra só os pontos de risco (revisão de cortes, tabela do mapa, storyboard, amostra). Quem assiste ao vídeo montado inteiro antes de cada amostra é o Claude (`revisor.md`); o autor recebe só as exceções. Na dúvida, o ponto entra na revisão; nunca decidir sozinho um corte de conteúdo.
- **Toda correção vira registro** ("Correções" do `video.md`) e, ao fim de cada aprovação, aprendizado (ver `CLAUDE.md`): princípio + caso + em que tipo de vídeo vale, nunca regra solta.
- Leia `edicao/qualidade.json` antes de analisar: alertas do bruto (01), do áudio (04: ruído, picos, travadas) e da imagem (05: exposição, cor, rosto estourado).

## Etapas, portões e retomada

Em cada portão, diga ao autor o que olhar (resumo de `guia/05-revisar-e-aprovar.md`, seção do portão) e indique o capítulo na primeira aprovação de cada vídeo.

| # | Etapa | Saída | Portão | `etapa:` no `video.md` |
|---|---|---|---|---|
| 1 | Preparar | pasta, ficha do bruto, briefing | — | `preparar` |
| 2 | Transcrever, áudio, imagem | seções `palavras`, `cor`; `audio_tratado.wav` | — | `transcrever` |
| 3 | Cortes | seção `erros`, `editado.mp4` (06), `previas/revisao-cortes.*` (07) | **A2-cortes** | `cortes` |
| 4 | Mapa de motion | plano de cenas, destaques, ganchos de câmera, lista de material | **A3-mapa** | `mapa` |
| 5 | Material | b-roll, `arquivo`, prints, fotos baixados | junto da A3 (só o que faltar vira pergunta) | `material` |
| 6 | Motion | cenas no Remotion, storyboard, amostra | **A4-motion** | `motion` |
| 7 | Câmera | seção `enquadramento` (09) | vai na A5 | `camera` |
| 8 | Som | seção `sfx` (10; trilha, se o formato pede) | vai na A5 | `som` |
| 9 | Revisão e entrega | `final/<plataforma>.mp4` | **A5-final** | `entregue` |

- **Retomada:** ao entrar, leia `etapa` e `aprovacoes` do `video.md` e continue da primeira etapa sem aprovação. Nunca refaça etapa aprovada sem pedido.
- **Pendências primeiro:** ao entrar (e antes de cada portão), liste toda linha de "Correções" do `video.md` com destino "A refazer" ou pedido sem "Feito", e resolva ou leve ao autor junto da próxima aprovação. Nada aprovado fecha com pedido aberto (aula 01: um título e uma frase pedidos num dia só entraram dois dias depois, já na entrega). Pedido feito no meio de uma sessão vai para "Correções" na hora, não só para a conversa.
- **Prévias com nome fixo** (`previas/`, sobrescritas a cada rodada; o que mudou entre rodadas fica em "Correções", não em arquivo novo):

  | Portão | Prévias |
  |---|---|
  | A2-cortes | `revisao-cortes.*` e `auditoria.txt` (07), `amostra-cortes.mp4` (06 `--amostra`: ritmo, velocidade, cortes) |
  | A3-mapa / material | `material.jpg` (folha de candidatos) |
  | A4-motion | `storyboard.*` (`storyboard.mjs`), `amostra-motion.mp4` |
  | A5-final | `amostra-final.mp4` (trechos com motion, câmera e som antes do render completo) |

  Capturas que o autor manda ficam no scratchpad; o que ele disse sobre elas vai para "Correções". Rascunho de trabalho (scripts de teste, frames, simulações, cópias de decisões) só no scratchpad.
- **Ao fechar cada portão:** (1) colha o aprendizado antes de apagar (`CLAUDE.md`, Aprendizado, itens 2 e 5: comentários do autor em "Correções" e classificados; script de teste útil vira código; dado de que outra etapa depende vira seção do `transcricao.json`); (2) apague as prévias daquele portão; na A5, a `previas/` inteira, e confira que a pasta do vídeo ficou só com `video.md`, `brutos/`, `edicao/` e `final/`; (3) registre a aprovação, atualize `etapa` e diga: "pode limpar o chat (`/clear`) e chamar `/video-editar` de novo; continuo da etapa <próxima>". Tudo o que a próxima etapa precisa fica nos arquivos (`video.md`, `transcricao.json`), nunca só na conversa.
- Pedido de ajuste numa etapa já aprovada: volte só àquela etapa e refaça as seguintes que dependem dela (corte mudado → refazer âncoras do mapa e conferir o motion; motion mudado → conferir câmera e som).

## 1. Preparar

1. `python3 codigos/verificar_ambiente.py`; falhou → etapa 0 da `/video-setup`.
2. `codigos/01_preparar_video.py <bruto> --nome <nn-slug>` cria a pasta (ou usa a da `/video-roteiro`), move o bruto para `brutos/original.<ext>` e grava a ficha técnica na seção `bruto` do `qualidade.json`. Bruto jogado em `brutos/` com outro nome: o 01 renomeia.
3. **Sem `video.md` (vídeo pronto, sem roteiro):** pergunte em um bloco: formato e plataformas; objetivo; seguiu roteiro? (anexar); avisou as regravações?; tem gravação de tela para algum trecho?; o que precisa de destaque (números, provas, CTA); o bruto é a gravação crua ou um vídeo já editado/publicado (cartelas, b-roll e pausas já tiradas mudam o 06 e pedem cobertura no mapa); para reels, um reels de referência; o que não pode ser cortado; **o que pode sair** (assuntos que o autor já sabe que não ficaram bons). Crie o `video.md` pelo modelo da `/video-roteiro` e, depois da transcrição, escreva o **roteiro reverso** (tese, tópicos) e a **Direção** (`direcao.md`), que vai para aprovação junto da A2-cortes.
   **Com `video.md` aprovado:** releia a Direção; se a fala real mudou o vídeo (tese, tom, ritmo), proponha o ajuste junto da A2-cortes.
4. **Checagem do bruto**: compare a seção `bruto` do `qualidade.json` com o `perfil.md` §7 (resolução, fps, perfil de cor, áudio). Gravações de tela: resolução para o zoom pedido, fps, caminho que o plano pede, nenhum dado sensível. Diga o que está fora e siga se for aceitável.

## 2. Transcrever, áudio e imagem

Em paralelo (cada um lê só o original e grava só a própria seção): `02` (transcreve; Parakeet em CPU) ‖ `04` (áudio → `audio_tratado.wav` + `qualidade.json` "audio") ‖ `05` (imagem → seção `cor` + `qualidade.json` "imagem"). No modo lote, em fila.

## 3. Cortes (A2-cortes)

Só cortes nesta etapa: nada de cena, destaque ou motion.

1. **Erros de fala** (`estilo.md` §6): seção `erros` do `transcricao.json` (cortes por índice de palavra: `de`, `ate` inclusivo, `tipo`, `texto` conferido), comparando com o roteiro.
2. **Corte editorial** (`estilo.md` §6.2): leia o texto mantido inteiro, em blocos de ~2 min, como editor, e marque o que sai mesmo bem falado (`tipo: "editorial"`, `motivo` obrigatório, `incerto: true` quando depender do gosto do autor). Para vídeo longo, um subagent por bloco de ~5 min, cada um com a tese do `video.md` e o texto dos blocos vizinhos.
3. Rode o `03`. **Todo item "Revisar" do relatório recebe decisão**: vira corte ou fica com o motivo anotado na seção "Cortes" do `video.md` (ex.: paralelismo intencional). Nenhum aviso fica sem resposta.
4. `06`: um encode a partir do original com cortes, pausas, áudio tratado, cor (entrada + ajuste por trecho + look) e velocidade → `edicao/editado.mp4`. O 06 para se algum trecho mantido contiver fala de um corte (trava contra frase repetida na emenda) e, no fim, chama o **07 (revisão de cortes por exceção)**: retranscreve ~5 s em volta de cada emenda e marca como suspeita a que repete palavra ou deixa sobra da fala cortada; o autor só recebe as emendas suspeitas, os cortes editoriais/incertos e os avisos do 03, em `previas/revisao-cortes.mp4` (legenda e capítulos por ponto) + `revisao-cortes.txt` numerado. `--todos` inclui também as emendas que passaram (aula 01: 64 pontos em 4:55 → 5 pontos em 25 s).
5. **Ritmo de fala** (antes da A2): leia a transcrição inteira procurando hesitações vocalizadas (palavra com "..."; o Parakeet não transcreve o "é" e estica a palavra vizinha), autocorreções (mesma ideia dita duas vezes em seguida, com outras palavras) e trechos arrastados; proponha os cortes e a velocidade (com amostra se mudar: `06 --amostra INI-FIM,...` grava `previas/amostra-cortes.mp4`, sempre o mesmo arquivo; nunca um segundo vídeo inteiro) junto da A2.
6. **A2-cortes**, um lote só: minutos removidos, número de cortes e quantas emendas a máquina conferiu sem problema; em texto, todos os cortes editoriais e incertos (o que sai, por quê); o vídeo e a lista da revisão. Revisar cada corte não é trabalho do autor: ele só vê o que a conferência não garante. O autor responde pelo número ("7: volta a frase", "ok"). **Toda resposta é gravada na seção `erros`**: corte editorial/incerto aprovado ganha `"aprovado": true`; aviso ou emenda que fica entra em `"decididos"` (índice da palavra, decisão, motivo, data). O 03 e o 07 pulam o que já foi decidido: o autor nunca responde a mesma coisa duas vezes. Correção: ajuste a seção `erros`, rode 03 e 06 de novo (gera nova revisão) até "ok". Decidir os cortes editoriais em texto **antes** do render (renderizar uma vez). Ritmo geral (pausas, velocidade) também se decide aqui.
7. Registre `A2-cortes: <data> (cortes <assinatura>)` com a assinatura que o 06 imprime. O 08 avisa se os cortes mudaram depois da aprovação.

Correção de cortes ou cor depois da A2: ajuste a seção no `transcricao.json` e rode o 06 de novo; nunca aplique nada em cima do `editado.mp4`. Cor fora do gosto: `ajuste` do trecho na seção `cor` (gama, ganhos R/B, contraste) ou o look em `estilo.md` §7 / `biblioteca/cor/look.cube` (look vale para todos os vídeos: rode o 05 de novo antes do 06).

## 4. Mapa de motion (A3-mapa)

Planejamento só em texto, sobre a linha do tempo dos cortes aprovados (tempos do `editado.mp4`, âncoras em índices de palavra). É aqui que se acerta o vídeo: mapa certo = motion aprovado em 1–2 rodadas.

Realinhe o plano pela transcrição: cada cena ancorada em índices de palavra; a fala real vence o roteiro; ideia não dita cai; momento forte espontâneo vira cena proposta; plataforma citada sem tela vira cena `tela` proposta; pessoa, grupo de pessoas ("influenciadores", "médicos"), evento ou conteúdo de terceiros citado vira cena `arquivo` proposta (avise que dá para buscar). Escreva no `video.md`.

**Conceito de arte por cena** (`estilo.md` §13), antes de qualquer código: raciocínio da fala; 3 formatos de famílias diferentes do repertório; o escolhido e **por que serve à direção** (o que a cena precisa causar naquele ponto do vídeo); vizinhos na linha do tempo. Confira a variedade olhando a sequência inteira na tabela da A3: forma repetida sem motivo troca (`estilo.md` §13; o teste é o olho, não a conta). Estrutura já aprovada só se repete para o mesmo raciocínio. Leia o `referencias/indice.md` inteiro (não só a pasta do tipo) e, quando o conceito vier de uma referência, diga qual. Decida por cena se precisa de imagem real (`estilo.md` §13, "Quando usar imagem real"): ideia abstrata vira animação; imagem só para o concreto e reconhecível. **Revisão contra o genérico**: com o mapa pronto, pergunte de cada cena "é o que eu faria para qualquer vídeo parecido?"; se for, troque e diga no `video.md` o que mudou e por quê (2026-11-12, ref. skill frontend-design).

**Destaques** (`estilo.md` §12, "Palavra em destaque"): formato pela função da fala; a densidade vem da Direção (base de aula: ~1–2 por minuto fora das cenas). Frase é síntese curta (base 2–5 palavras), não transcrição, que entra junta na palavra-chave, em formas alternadas (lado, empilhada, embaixo com câmera aberta, palavra à mão), nunca no peito no horizontal (no `Reels` dividido a palavra-chave no peito, y ≈ 1350, é a regra daquele layout); raciocínio em etapas vira animação com uma batida por etapa (lista que acumula, desenho, contador), não frase esticada pela fala.

**Gancho de câmera por cena** (`estilo.md` §6.1): como a câmera entra e sai de cada cena. Base: aberta e parada durante a cena, volta seca no plano aberto; em destaque, fecha no frame em que ele entra. As outras opções (rosto no terço oposto do card, câmera que vira card antes da tela de motion, whip na volta) entram quando a Direção pede, com o motivo. A etapa 7 executa; o motion é desenhado já contando com isso.

**Material por cena**: o que cada cena precisa de imagem real (b-roll, `arquivo`, foto, print, gravação de tela).

**A3-mapa**: uma tabela só — tempo (editado) · palavra-âncora · o que a fala faz · formato (família) · serve à direção porque · câmera · material — mais a conferência de variedade e as **quebras da base** que o mapa propõe (cada uma com o motivo). A densidade e o ritmo vêm da Direção; pergunte só o que estiver incerto.

## 5. Material

Só para as cenas que o mapa marcou com imagem real. Busque tudo o que o mapa pede num lote só, antes do motion (`elementos.md` §5): biblioteca primeiro, depois banco de imagens (b-roll) e busca de `arquivo`. Mostre os candidatos de todas as cenas numa folha só, de preferência junto da A3. Sem o material, avise o autor; nunca troque imagem real por ícone + texto em silêncio.

Cenas `arquivo`: o autor decide o que usar (inclusive sem licença); não bloquear nem insistir em direitos. Única regra: nunca editar fala ou imagem de terceiros para parecer o que não foi.

## 6. Motion (A4-motion)

1. `08` (exporta para o Remotion; avisa se os cortes ou a cor mudaram depois do render ou da A2-cortes).
2. Subagents por cena, em paralelo: cada cena nova num arquivo próprio em `remotion/src/novas/<cena>.tsx` (esqueleto com `ID`, `Props`, `Cena`, `props`, registrado em `novas/index.tsx`: lista `CENAS`, uma `Composition` por cena numa `Folder` para o Studio e `linhaNovas` para a linha do tempo; importado no `Root.tsx` e em `aulas/<aula>.tsx`), e cada subagent só edita o seu arquivo. A linha da aula troca as cenas antigas pelas novas (lista de substituídas em `aulas/<aula>.tsx`); depois da entrega, a cena com chance de reuso vai para o catálogo (etapa 9). O catálogo (`estilo.md` §10) é ponto de partida só quando o raciocínio é o mesmo; cena nova segue o conceito de arte aprovado e `estilo.md` §4–5 e §13.
   - **Brief do subagent:** o conceito de arte da cena (raciocínio + formato escolhido), o gancho de câmera, o material real já baixado, os vizinhos da linha do tempo e o que não pode repetir. Nunca mandar "igual às aprovadas" ou "como a cena X" para raciocínio diferente: isso copia a forma. Peça identidade (tipografia, cor, linha, curvas), não contêiner.
   - **Verificação:** stills + um render curto de cada cena (movimento repetido não aparece em still). Depois, na aula **montada** (câmera do 09 aplicada): `node scripts/quadros.mjs <aula> <pasta>` (um quadro por cena e destaque) e conferir uma a uma: rosto livre (o motion fica fora do zoom da câmera), frase curta (síntese, não transcrição), nenhum elemento esquecido na tela esperando a fala (base ~2 s entre batidas no registro; parado para ler ou dar peso é intenção).
3. Linha do tempo: `remotion/src/aulas/<aula>.tsx` junta cenas e destaques; a composição `Aula` monta tudo. Conferir colisões antes do storyboard. Storyboard: `remotion/scripts/storyboard.mjs`.
4. **A4-motion**: storyboard + amostra renderizada das cenas novas (`previas/amostra-motion.mp4`). Ajuste só nas cenas pedidas. Cena que não fecha em duas rodadas de ajuste não se remenda de novo: volta ao conceito de arte e é redesenhada inteira (`estilo.md` §12, "Um objeto só"), ou vira pergunta fechada ao autor.
5. Aprovada a A4: `12_remapar_motion.py videos/<slug> --congelar` grava a base de tempo do motion (seção `remapa`). Se o `editado.mp4` mudar depois (ritmo, corte, velocidade), rode o 06 e em seguida o `12` sem opção: gera `public/<slug>/remapa.json` e o Remotion reposiciona cenas, destaques, câmera e sons sem reescrever tempos à mão; confira num render curto as cenas em trecho que mudou.

## 7. Câmera (enquadramento)

Depois do motion aprovado, porque a câmera acompanha o motion. `codigos/09_enquadrar.py videos/<slug>`: lê a linha do tempo do Remotion (`remotion/scripts/linha.mjs`), rastreia o rosto (YuNet) e grava a seção `enquadramento` (regras de `estilo.md` §6 e §6.1): três planos (aberto, médio, fechado) em escada a cada ~6 s (`--troca`), troca em corte só quando o rosto salta (`--salto`, no mínimo `--intervalo-minimo` s depois da anterior), entrada de destaque fecha, rosto ancorado durante destaque, câmera aberta e parada durante cena; **fluidez** (aula 01, 2026-11-13): nenhum plano com menos de `--plano-minimo` 2,5 s fora de corte, planos iguais seguidos viram um, corte curto já entra no enquadramento seguinte, sem aproximação antes de cena (`--rampa 0`). No fim roda o 08. O Remotion aplica em `src/Camera.tsx`. Item de motion que precisa da câmera aberta (texto embaixo, peça longa) declara-se `cena` na linha (`TIPO = "cena"` em `src/novas/`, `tipo: "cena"` no registro de destaques). Zoom dentro de cena só quando um elemento pede espaço (card lateral), até ~1,2× em bruto 720p; nada de aproximação lenta nem zoom que desfaz no fim. Mudou a base: testar 1 min no bruto antes do vídeo inteiro. Confira num render curto de um trecho com destaque e uma volta de cena.
Ainda manual (fica no componente da cena): câmera que vira card dentro da cena e rosto no terço oposto quando um card entra de lado.

## 8. Som

Depois da câmera. `codigos/10_sonorizar.py videos/<slug>` grava a seção `sfx` e roda o 08. **Base: `--modo contexto`**, só os sons que cada item declara em `sons` (som em toda entrada soa sem contexto). `--modo eventos` (um SFX por evento visual: entrada e saída de cena, entrada de destaque pelo formato, fechamento de câmera em ênfase no máximo a cada 4 s) só quando a Direção pede tensão; no caso real contado, a direção marca quais itens levam som (impacto e riser nas viradas, flash, número que fecha o caso). `--modo`, `--intervalo` e `--intervalo-camera` vêm da Direção. Em qualquer modo: o som entra no início do item ou, se o item declarar `entrada` em `aulas/<aula>.tsx`, na entrada visual de fato (cena cuja janela abre antes do primeiro elemento); só da `biblioteca/audio/`, sem repetir o mesmo arquivo em seguida, volume pelo pico de cada arquivo (sempre abaixo da voz). O Remotion toca em `src/Camera.tsx` (`Sons`). O que faltar na biblioteca o 10 lista: peça ao autor ou busque som CC0 (`biblioteca/audio/ORIGEM.md`). SFX de dentro de uma cena (clique, notificação) fica no componente. Trilha só nos formatos que pedem (`perfil.md` §6).

## 9. Revisão e entrega (A5-final)

Render: `cd remotion && npx remotion render Aula ../videos/<slug>/final/<plataforma>.mp4 --props='{"aula":"<slug>","mostrarLegendas":<true|false>}'`. `mostrarLegendas` segue o campo `legenda` do `video.md`: `palavras-chave` ou `nenhuma` = `false` (legenda corrida por cima dos destaques de baixo; aula 01, 2026-11-13); `corrida` = `true`. Renderizar a amostra da A4 com o mesmo valor do final. `11` só se a plataforma pedir `.srt`.
Rode o checklist de `revisor.md` inteiro (subagent revisor, com o vídeo montado do começo ao fim; cada falha volta só para a cena que falhou). Entregue o arquivo final + o que ficou diferente do pedido e por quê + as 3 correções que mais melhorariam o vídeo. Registre A5-final no cabeçalho do `video.md`.
- **Catálogo: depois da entrega e só para o que tem reuso.** Com a A5 registrada, escolha as cenas cujo raciocínio tende a voltar em outros vídeos (prova de venda, comparação de oferta, lista de fechamento) e promova só essas; cena feita para um caso único fica em `novas/` como está. Não fazer no meio da aprovação do motion: é trabalho de código, não de direção, e catálogo cheio de cena de caso único empurra para repetir forma. Promoção (um subagent por arquivo de tipo, nunca dois no mesmo arquivo): a forma vira `componentes/<Tipo>.tsx` → `<Tipo><Variacao>` com props (conteúdo, textos, imagens e batidas relativas ao início da cena; ficam fixos layout, cores e curvas), com comentário de raciocínio, quando usar, quando não usar e o que fica fixo; os dados do vídeo vão para `registro/` (arquivo fino com `ID`, `Cena`, `props`, `TIPO`, `SONS`); a cena promovida sai de `novas/`; linha da cena no `estilo.md` §10 apontando o componente. Prova: `node scripts/stills.mjs <aula> <pasta> <ids,Aula>` antes e depois + `../.venv/bin/python scripts/comparar.py <antes> <depois>` (render determinístico), cena a cena e na `Aula`; só vale "idêntico". Texto partido em pedaços muda o render: manter os trechos de texto como no original (aula 01, 2026-11-13: 12 cenas promovidas, 72 quadros idênticos).
- **Volume final do Remotion**: SFX e trilha somam à voz e o render sai acima do alvo (−12,4 LUFS, pico 0 dB num teste). Depois do render, medir (`ebur128`) e normalizar só o áudio em 2 passadas (`loudnorm` linear, alvo da plataforma, pico −1,5) copiando o vídeo (2026-11-12). Trilha CC0 sem conta: Wikimedia Commons (ex.: Loyalty Freak Music); FreePD fechou.

## Modos

- **Variações**: lê a matriz do `video.md`; edita a base comum uma vez; hooks e CTAs como peças curtas; saída `final/<variacao>_<plataforma>.mp4`.
- **Cortes (longo → curtos)**: liste momentos candidatos (ideia autônoma, 30–90 s, gancho natural) com trecho, motivo e nota → aprovação em lote → 9:16 com rosto enquadrado, gancho na tela, legenda na zona segura, CTA → `final/cortes/`. Reaproveita a transcrição e os cortes aprovados. Cada corte vira uma pasta própria (`videos/<nn>a-<slug>`), porque 08–10 e o Remotion trabalham uma pasta por linha do tempo: `brutos/original.*` e `edicao/audio_tratado.wav` entram por hard link do vídeo longo (mesmo arquivo, sem cópia), o `transcricao.json` leva `palavras` + `cor` e a seção `erros` corta tudo fora dos trechos (`tipo: "fora do corte"`, `aprovado: true`); depois 03 → 06 (`--lufs -14`) → A2-cortes normal. O 06 mantém a ordem da fala: escolher trechos que funcionem nessa ordem (gancho de um trecho posterior ainda não é possível; 2026-11-12). Formato vertical: composição `Reels` (`remotion/src/Reels.tsx` + `src/reels/kit.tsx`): imagem/motion na faixa de cima, câmera 16:9 embaixo com emenda em degradê, headline só na abertura (`headlineFim`), palavra-chave no peito (y ≈ 1350), tag de seguir (`Seguir`) e cartão final; cada corte registra o seu `DefReel` em `src/reels/index.ts` e o `linha.mjs` passa os itens para o 09/10 (frente = destaque). Bruto que já é vídeo editado (cartelas/b-roll do original): achar as inserções no `editado.mp4` (queda de saturação) e cobrir com tela cheia ou `congelar` (2026-11-12). Bruto já editado: 06 com `--limiar-fala 0 -v 1` (o corte por volume come fim de palavra). Mudou o editado depois do motion aprovado: `12_remapar_motion.py` (base congelada na A4; gera `public/<corte>/remapa.json`, [tempo velho, tempo novo] por palavra) — o Reels, a Aula e o `linha.mjs` reposicionam tudo, sem redesenhar.
- **Lote**: análise em paralelo (um subagent por vídeo); render em fila, um por vez (Parakeet, ffmpeg e Remotion travam o Mac em paralelo); portões juntos por etapa; aprendizados gravados só no fim.

## Estado atual do sistema (atualizar quando mudar)

- Pronto: 01–12 (12 remapa testado num vídeo real em 2026-11-13; 01–08 e 11 testados ponta a ponta em 2026-11-11; 07 conferência automática, 09 e 10 testados num vídeo real no mesmo dia), corte editorial no 03, composição `Aula` com legenda animada, câmera e sons, verificador.
- Ainda não existe (seguir o contorno descrito acima): câmera que vira card e rosto no terço oposto ao card (manual, no componente), seção `cenas` lida pelo 08 (hoje as cenas de cada vídeo ficam em `remotion/src/aulas/<video>.tsx`, registrado em `aulas/index.ts`), `checar-curvas.ts`, exportação multiplataforma 9:16, análise de trilha, gravação de tela, LUT definitiva e frame de referência de cor.
