---
name: video-roteiro
description: Cria a pasta de um vídeo novo e o video.md completo (briefing, pesquisa, roteiro em tópicos ou integral, plano de cenas, matriz de variações e checklist de captação) a partir de uma ideia. Use quando o usuário disser "quero gravar um vídeo", "roteiro", "tenho uma ideia de vídeo/aula/reels", "monta o roteiro", "criativos com vários hooks", ou pedir para planejar um vídeo antes de gravar.
---

# /video-roteiro

Do "quero gravar" ao `videos/<nn-slug>/video.md` aprovado (A1). Leia antes: `CLAUDE.md`, `.claude/skills/video-editar/direcao.md` (como decidir), `setup/perfil.md`, `setup/plataformas.md` §1 e, do `setup/estilo.md` (base, não lei; arquivo longo), só §1, §3 e §13. `setup/elementos.md` quando for montar o plano de cenas.

## 0. Pré-requisitos

- `python3 codigos/verificar_ambiente.py`; se falhar, mande para a etapa 0 da `/video-setup`.
- Setup mínimo (ver `/video-setup`) incompleto: faça só as perguntas que faltam antes de seguir.

## 1. Pasta e briefing

1. Crie `videos/<nn-slug>/` (próximo número livre + slug curto) com `video.md` a partir de `modelo-video.md` (nesta pasta da skill). Pastas `brutos/`, `edicao/`, `previas/`, `final/` só nascem quando têm conteúdo.
2. Briefing em perguntas curtas (no máximo 4 por vez); o que o perfil já responde vem preenchido e só é confirmado:
   - objetivo do vídeo e o que o autor espera dele;
   - público específico deste vídeo;
   - formato e plataformas (padrão do perfil);
   - ideia ou tese central;
   - referência (opcional: link ou arquivo);
   - CTA;
   - o que não pode faltar e o que evitar;
   - legenda e trilha (herdam do perfil).

## 2. Pesquisa

`setup/fontes/` (o que o autor fala e sabe: comece pelo `indice.md` e abra só os arquivos do tema; de reuniões de venda tire objeções e argumentos reais, de reuniões de entrega exemplos, histórias e dúvidas dos clientes, de `videos/` ganchos e jeito de abrir, de `textos/` teses e estrutura de argumento, de `clientes/` dores e objeções nas palavras do público; dado de cliente não vai para a tela sem o autor decidir), busca na web quando o tema pede dado atual, e vídeos de referência enviados por link (baixar com yt-dlp para pasta temporária, transcrever com `codigos/02_transcrever_audio.py <arquivo>` (fora de `videos/`, grava `<arquivo>.json`/`.txt` ao lado), extrair estrutura do gancho e argumentos). Resultado curto na seção "Pesquisa" do `video.md`. Apagar downloads depois.

Vídeo que conta um caso real (empresa, pessoa, decisão): a pesquisa inclui o **material** do caso, porque o vídeo vai precisar de imagem real a cada poucos segundos: fotos e vídeos da pessoa e da família, a empresa (fachada, fábrica, produto, logo da época), matérias e manchetes reais, perfis, fotos antigas. Lista com fonte por item na "Pesquisa"; o que faltar vira pergunta ou item de captação.

## 2.1 Direção

Antes do roteiro, preencha a seção "Direção" do `video.md` seguindo `direcao.md`: tipo de vídeo, o que precisa causar, mensagem em uma frase, contexto de consumo, referência que serve, ritmo, material, quebras da base e risco. O roteiro e o plano de cenas saem dela; vai para aprovação junto da A1.

## 3. Roteiro

- **Modo tópicos** (recomendado para quem fala bem de improviso): tese, tópicos em ordem, argumento-chave de cada um, frases que não podem faltar, gancho falado dos primeiros segundos.
- **Modo integral**: texto completo para ler, no tom de `perfil.md` §3.
- Estrutura do formato em `plataformas.md` §1. Respeitar palavras proibidas do perfil.

## 4. Plano de cenas (preliminar)

Curto, uma linha por cena prevista: tópico do roteiro, o que a fala faz ali (narra, prova, compara, nega…), a ideia de cena com o porquê de servir à direção, e o **material real** que ela pede (b-roll, `arquivo`, foto, gravação de tela). Serve para saber o que gravar e pesquisar antes; o formato de cada cena se decide no mapa de motion da `/video-editar` (A3), sobre a fala real.
- Plataforma/produto citado → proponha cena `tela` e pergunte "já tem gravada?"; registre a fonte (gravação do autor, biblioteca, automática, assistida).
- Pessoa, evento, marca ou conteúdo de terceiros citado → proponha cena `arquivo` e avise que dá para buscar o material (YouTube, redes, fontes abertas; fluxo em `elementos.md` §5). O autor decide o que usar.
- Prefira componentes e assets que já existem na biblioteca.
- É intenção: a edição realinha pela transcrição depois.

## 5. Criativos (quando o formato for `criativo` ou o usuário pedir variações)

Matriz de variações no `video.md`: o que varia (hook falado, hook visual, CTA, duração, ordem) e quantas versões; escreva os hooks com ângulos diferentes (dor, número, polêmica, prova, pergunta).

## 6. Checklist de captação

Ao entregar o checklist, indique ao autor `guia/04-gravar-bem.md` (câmera, luz, som, o que mandar junto).

Do `perfil.md` §7 (câmera, resolução, fps, perfil de cor, luz, áudio) + lista do que gravar: hooks extras, b-roll, telas que o autor vai gravar. Inclua os sinais falados ("de novo", "corta essa parte"). Se houver cortes verticais previstos, lembrar de gravar horizontal em 4K.

## 7. Aprovação A1

Mostre direção + roteiro + plano de cenas e peça aprovação. Toda alteração pedida vira linha em "Correções" do `video.md`; ao aprovar, classifique cada correção (ver "Aprendizado" no `CLAUDE.md`). Atualize o cabeçalho: `etapa: gravacao`, `aprovacoes.A1: <data>`.
