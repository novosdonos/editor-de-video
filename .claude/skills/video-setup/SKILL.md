---
name: video-setup
description: Configura o editor de vídeo para um autor (pessoa/marca) — instala o ambiente, mostra o diagnóstico do que falta para a qualidade subir, entrevista o autor, coleta design system, referências (com o que o autor gosta em cada uma), materiais da biblioteca e fontes (transcrições de reuniões e vídeos do autor) e calibra com um vídeo-piloto. Use quando o usuário disser "setup", "configurar o editor", "começar do zero", "quero preparar meu editor de vídeo", "o que falta no meu setup", quando adicionar referências ("olha esse vídeo/perfil", links do YouTube/Instagram/TikTok), design system/brand book, transcrições de reuniões ou vídeos próprios, ou materiais recorrentes (fotos, b-roll, provas, logos, sons), ou quando outra skill encontrar o setup incompleto.
---

# /video-setup

Deixa `setup/` pronto para que roteiro e edição saiam no padrão do autor sem perguntar de novo. Um setup por repositório.
Leia antes: `CLAUDE.md` (mapa), `setup/elementos.md` (o que pedir e com que prioridade), `setup/perfil.md`, `setup/estilo.md`, `setup/referencias/indice.md` e `setup/fontes/indice.md` (o que já existe).

## Regra de ouro

- O objetivo é um setup **completo**: o autor responde a entrevista uma vez e os vídeos saem no padrão dele, sem perguntas novas depois. Não pule bloco por achar que "dá para descobrir depois".
- Pergunte só o que falta: campo vazio ou marcado **[confirmar]** em `perfil.md`/`estilo.md`. Nunca refaça uma pergunta já respondida no arquivo. Se o autor tiver documentos prontos (brand book, design system, posicionamento), leia-os e só confirme.
- **Linguagem de leigo**: todo termo técnico vem traduzido e com exemplo ("nome na tela: seu nome e cargo embaixo, quando você aparece pela primeira vez"; "b-roll: imagens de apoio, você trabalhando, palestrando"). Nunca use o slug ou o jargão sozinho.
- Perguntas em blocos curtos (no máximo 4 por vez, com `AskUserQuestion` quando houver opções claras). Grave cada resposta no arquivo certo **na hora**, e remova o **[confirmar]** correspondente.
- Pergunta técnica sempre com uma recomendação ("Recomendado: …").
- Ao fim de cada bloco, diga em uma linha o que foi gravado e onde.
- **O autor sempre sabe o que falta.** Mostre o diagnóstico abaixo no início do setup (depois da etapa 0), ao fim de cada sessão e sempre que ele perguntar. Nunca encerre uma sessão sem dizer qual é o próximo material que mais sobe a qualidade.

## Diagnóstico — o que falta para a qualidade subir

Confira cada item nos arquivos (não pergunte o que já dá para ver) e mostre uma tabela curta, **ordenada por impacto**, só com o que está parcial ou faltando:

| Item | Situação | Por que importa (em uma frase, para leigo) | O que fornecer |
|---|---|---|---|

Itens, nesta ordem de impacto:

1. **Design system da marca** (`estilo.md` §2 + `biblioteca/marca/`). Sem ele, todo texto, gráfico e animação na tela sai genérico, com cara de modelo pronto; é o item que mais muda a qualidade visual. Pronto = cores (hex), tipografia, logo em SVG (versão clara e escura) e exemplos aplicados (posts, slides, site). Ver "Design system" na etapa 1.
2. **Referências explicadas** (`referencias/indice.md`). Vídeos, reels e perfis de que o autor gosta, **cada um com o que ele gosta nele**. Sem a explicação, o Claude adivinha o que copiar. Meta: 5–10 referências, cobrindo abertura, texto na tela, legenda e ritmo.
3. **Fontes** (`fontes/indice.md`). O que o autor fala e escreve: faz o roteiro soar como ele, com os exemplos, as histórias e as objeções reais do público dele. Meta: 3+ vídeos dele, 3+ reuniões (entrega e venda). Para o autor, um pedido só: "solte tudo em `setup/fontes/entrada/`" + a lista da etapa 3.
4. **Entrevista completa** (`perfil.md` sem **[confirmar]**).
5. **Biblioteca essencial** (prioridade "essencial" do `elementos.md`): logo, provas, fotos.
6. **Vídeo-piloto** (etapa 4): sem ele, cor e captação ficam no chute.

Para cada item faltando, diga exatamente como entregar (ex.: "mande o link do reels e me diga o que te chamou atenção nele"). Itens 1–3 não travam o primeiro vídeo, mas avise que sem eles o resultado fica abaixo do possível.

## Etapa 0 — Ambiente

1. Rode `python3 codigos/verificar_ambiente.py`.
2. Para cada FALTA, rode o comando indicado. Exceção: Homebrew (pede senha do Mac) — mostre o comando e espere o usuário rodar.
3. Repita até ficar tudo ok; depois `python3 codigos/verificar_ambiente.py --teste`.
4. Espaço livre abaixo de 30 GB: avise, não bloqueie.

## Etapa 1 — Entrevista (só o que falta)

| Bloco | Perguntas | Grava em |
|---|---|---|
| Autor | Nome na tela; credencial em uma frase; números que mais cita; **todas as redes e links** (Instagram, YouTube, TikTok, LinkedIn, site) | `perfil.md` §1 |
| Negócio | O que faz em uma frase; produtos/ofertas (nome, para quem, faixa de preço); o que os vídeos devem vender; histórias e cases que sempre conta; resultados que pode provar | `perfil.md` §9 (ou aponta para documento existente) |
| Objetivo | Por formato: para que serve (atrair, nutrir, vender, ensinar aluno), frequência, o que conta como sucesso | `perfil.md` §9 |
| Público | Para quem fala; quem não é público | `perfil.md` §2 |
| Tom | Como fala; palavras proibidas; frases que repete (o "jeito de falar" detalhado sai das fontes, etapa 3) | `perfil.md` §3 |
| Direção criativa | Criadores/canais que admira (links: viram referência na etapa 2); a sensação do vídeo em 3 palavras; o que nunca quer ver; ambientação (cenário, luz, cores); quanto o rosto aparece × telas de motion | `perfil.md` §10 + `estilo.md` §1 |
| Formatos e plataformas | Quais formatos (aula, YouTube, reels, anúncio) e onde publica cada um; chamada final padrão (CTA) ou varia por vídeo | `perfil.md` §4 |
| Reels (se publica) | Um **reels de referência** que gostaria de ter feito (link); @ e topo do perfil para o cartão final e a tag de seguir; a oferta e o destino do link da bio; palavra-chave só a palavra ou legenda completa | `perfil.md` §4 + `estilo.md` §3.1 |
| Roteiro | Fala a partir de tópicos ou lê o texto inteiro? Usa sinais falados ("de novo", "corta essa parte")? | `perfil.md` §5 |
| Legenda e trilha | Por formato, com exemplo de cada opção: **palavras-chave** na tela (só a palavra forte) / legenda completa animada / só arquivo `.srt` / nenhuma. Trilha sim/não, clima | `perfil.md` §6 |
| Captação | Câmera e app, resolução/fps/perfil de cor, luz, microfone, cenário; grava horizontal em 4K? | `perfil.md` §7 |
| Telas | Ferramentas e sites que mostra nos vídeos (só o nome ou link); quais exigem login | `perfil.md` §8 |
| Perfil de edição | Escolher um: **sóbrio** (motion só para estruturar, cortes discretos), **dinâmico** (cortes rápidos, zoom nos cortes, motion frequente), **cinematográfico** (planos mais longos, cor forte, b-roll) | `estilo.md` §1 |
| Design system | Tem design system ou brand book? Link ou arquivos. Ver abaixo | `estilo.md` §2 + `remotion/src/marca.ts` (mesmos valores, e o rótulo do autor) + `biblioteca/marca/` |
| Origem dos arquivos | Onde estão fotos, vídeos e gravações de reuniões dele (app Fotos, Google Drive, HD externo, celular, Meet/Zoom) | `perfil.md` §11 |

**Design system.** Pergunte primeiro se existe. Explique para que serve em uma frase: "é o manual visual da marca (cores, tipografia, logo, jeito dos elementos); é o que faz os textos e animações do vídeo parecerem da sua marca e não de um modelo pronto".
- **Existe** (link do claude.ai, Figma, PDF de brand book, site): leia pelo link ou peça os arquivos, baixe logos em SVG para `biblioteca/marca/`, grave os tokens (cores, tipografia com pesos, raios, sombras) no `estilo.md` §2 e em `remotion/src/marca.ts` e só confirme com o autor.
- **Não existe**: recomende com ênfase construir antes dos vídeos importantes. Caminhos: (a) pedir ao Claude no claude.ai para montar o design system da marca a partir do logo, das cores atuais e das referências, e depois colar o link aqui; (b) um designer, entregando brand book em PDF ou Figma com o logo em SVG. Enquanto não chega, monte tokens provisórios a partir do logo e do que o autor já usa (posts, site), grave no `estilo.md` §2 com **[provisório]** e mantenha o item no topo do diagnóstico.
- Tipografia: confira se a fonte existe no Google Fonts (`@remotion/google-fonts`); se for paga ou própria, peça o arquivo (.ttf/.otf) para `biblioteca/marca/`.

## Etapa 2 — Materiais e referências

**Checklist da biblioteca**: monte a lista a partir da coluna "Prioridade" de `elementos.md` e mostre ao usuário o que falta, nesta ordem, sempre com o "para quê" de cada item:

1. **Essencial**: logo (SVG ideal); prints de provas (faturamento, depoimentos, notificações de venda — sem dados sensíveis); referências de abertura, título, legenda e chamada final.
2. **Recomendado** (pode vir depois do primeiro vídeo): fotos do autor (palco, bastidores, equipe); 10–30 vídeos curtos de apoio (b-roll: trabalhando, mãos no teclado, escritório, eventos); vinheta sonora (som curto da marca que abre ou fecha o vídeo, como o "tudum" da Netflix), se tiver.
3. **Opcional**: gravações de tela, transições.

**Puxar da origem dos arquivos (sem duplicar):**
- **App Fotos (Mac)**: a skill monta um álbum de nome operacional (ex.: "Fotos profissionais"; se o autor já tiver um álbum com esse papel, usar o dele) com uma pré-seleção (fotos do autor reconhecido pelo Fotos, feitas com câmera profissional, fora de álbuns pessoais) via `osxphotos query ... --add-to-album`; o autor aprova removendo do álbum o que não quer. A skill exporta só esse álbum pelo próprio Fotos, que baixa os originais do iCloud: `osascript` com `export (get media items of album "<nome>") to (POSIX file "<tmp>" as alias) with using originals` (o VS Code/Terminal precisa de Acesso Total ao Disco e de permissão de Automação para o Fotos; o modo PhotoKit do osxphotos pede outra permissão e não é necessário). Depois: renomear pelo conteúdo, reduzir para no máximo 3840 px e registrar no `ORIGEM.md` da pasta. Depois cada arquivo entra pela regra de entrada abaixo.
- **Google Drive**: listar a pasta pelo conector, mostrar uma folha de miniaturas, baixar só as escolhidas. Antes de baixar, comparar com o que já está na biblioteca/Fotos (hash perceptual com `imagehash`) e pular repetidas.
- **Design system/brand book por link**: ler e baixar logos e tokens direto.

**Telas e ferramentas (elemento `tela` e `interface`)**: não peça prints. Peça só a lista de ferramentas/sites. Páginas públicas: a skill captura no Chrome. Páginas com login (plataforma de vendas, planilhas): o autor grava a tela uma vez ou autoriza a skill a navegar no Chrome dele; dado de cliente é borrado.

**Entrada de cada arquivo na biblioteca:**
- Olhe o conteúdo uma vez e renomeie: `<tipo>_<descricao>-<nn>.<ext>`, minúsculas, sem acento, na pasta certa de `setup/biblioteca/` (ver `elementos.md` §4).
- Fotos: versão sem fundo **só** para retrato do autor isolado (perfil, selfie, meio corpo com fundo simples), que vai virar recorte na tela; foto de palco, evento ou grupo fica só original. Na dúvida, gerar sob demanda quando o plano de cenas pedir:
  `.venv/bin/python -c "from rembg import remove; from PIL import Image; remove(Image.open('IN')).save('OUT_sem-fundo.png')"`
- Provas: procure dado sensível (nome de cliente, e-mail, CPF, telefone); se houver, borre antes de salvar.
- Material de terceiros: anote a origem no `ORIGEM.md` da pasta.

**O que o autor gosta em cada referência.** Referência sem explicação vale pouco: o Claude não sabe se ele gostou do ritmo, da cor, do texto na tela ou do jeito de falar. Para cada referência nova (arquivo ou link), depois de olhar os frames:
1. Mostre ao autor o frame ou trecho principal e pergunte: "O que te chamou atenção aqui?" e "Tem algo de que você não gosta nele?". Até 4 referências por vez.
2. Se ele não souber dizer, ofereça opções a partir da sua leitura (`AskUserQuestion` com múltipla escolha: ritmo dos cortes, texto e palavras na tela, cor e luz, enquadramento e cenário, animações e gráficos, jeito de falar e gancho, trilha e efeitos sonoros).
3. Grave as palavras dele na coluna "O que o autor gosta" do `indice.md`, separadas da sua leitura ("O que copiar"). Ao destilar no `estilo.md`, o que o autor disse manda; sua leitura só completa.
4. Referência antiga com **[perguntar]** nessa coluna: pergunte na próxima sessão de setup, em lotes.

**Referências em arquivo** (prints, vídeos, gravações de tela de aulas fechadas, sites): o autor solta em `setup/referencias/entrada/`. Para cada arquivo: compare com as referências existentes (hash perceptual; repetida ou quase igual sai), olhe, classifique pelo tipo de `elementos.md`, renomeie `<tipo>_<origem>-<nn>.<ext>`, mova para `setup/referencias/<tipo>/` (vídeo: recortar 2–4 s dos momentos de motion e medir o ritmo), pergunte o que o autor gosta, registre no `indice.md` e destile no `estilo.md`. Descartar o que não acrescenta nada novo ao repertório. `entrada/` fica vazia ao fim. Sites: abrir no Chrome, capturar prints/gravação dos trechos com motion e seguir o mesmo caminho.

**Referências por link** (perfil do Instagram, canal/vídeo do YouTube, TikTok):
1. Baixe para uma pasta temporária: `yt-dlp -o "<tmp>/%(id)s.%(ext)s" <link>` (perfil: limite a ~5 vídeos com `--playlist-end 5`; Instagram pode pedir `--cookies-from-browser chrome`). Uso só para estudo; nunca entra no render.
2. Extraia um frame por mudança de cena: `ffmpeg -i <video> -vf "select='gt(scene,0.3)',showinfo" -vsync vfr <tmp>/f_%03d.jpg`.
3. Olhe os frames, classifique pelos tipos de `elementos.md`, recorte clipes curtos (2–4 s) dos momentos de motion para `setup/referencias/<tipo>/`.
4. Meça o ritmo (cortes por minuto, duração média de plano) a partir dos cortes detectados.
5. Pergunte o que o autor gosta (bloco acima), escreva uma linha por referência em `setup/referencias/indice.md` (link, tipo, o que copiar, o que o autor gosta) e destile no `estilo.md` como repertório: o formato, o raciocínio por trás dele, para que tipo de vídeo serve e o que foi medido (como exemplo, não meta). Choque com a base atual vira pergunta ao autor, não regra nova (`.claude/skills/video-editar/direcao.md`).
6. Apague os downloads brutos.

**Sons (efeitos)**: o kit padrão já vem no repositório em `setup/biblioteca/audio/` (36 efeitos CC0, origem em `ORIGEM.md`). Não peça nada ao autor; só confira se a pasta existe. Para ampliar, buscar no acervo AtomCut (GitHub, ~90 pacotes CC0) e baixar o arquivo direto. Nunca usar licença CC BY-NC; nunca pedir conta ou chave de API ao autor (regra geral no `CLAUDE.md`).

## Etapa 3 — Fontes (o que o autor fala e sabe)

Transcrições e textos do autor, em `setup/fontes/` (pastas e regras em `setup/fontes/indice.md`). Servem para o roteiro soar como ele e para a transcrição acertar os termos dele. Nunca entram no render.

**Para o autor, um pedido só:** "Solte tudo em `setup/fontes/entrada/`, do jeito que estiver (transcrição, áudio, vídeo, PDF, print, link num .txt). Eu organizo." Nunca peça para ele escolher pasta ou nomear arquivo. Mostre esta lista do que vale enviar:
- Vídeos seus já gravados: aulas, YouTube, reels, lives, podcasts em que participou.
- Reuniões que você conduz: aulas ao vivo, mentorias, consultorias (entrega) e calls de venda. Transcrição exportada do Meet, Zoom, tl;dv ou Fireflies serve.
- O que você escreveu: roteiros, posts, carrosséis, e-mails, página de vendas, slides, apostilas.
- A voz do seu cliente: depoimentos escritos, perguntas que mais recebe, DMs, comentários, pesquisas com alunos.
- Conteúdo de outras pessoas que você usa como base (podcasts, aulas, livros).

Pastas no Drive: listar pelo conector e baixar só o que o autor escolher.

**Organização interna** (a skill faz; o autor não precisa saber):

| Pasta | O que vai | Nome |
|---|---|---|
| `reunioes/` | Reuniões de entrega e de venda | `<aaaa-mm-dd>_<entrega\|venda>_<tema>.md` |
| `videos/` | Transcrições de vídeos do autor | `<aaaa-mm-dd>_<tema>.md` |
| `textos/` | Tudo que o autor escreveu (roteiros, posts, e-mails, página de vendas, slides, apostilas) | `<aaaa-mm-dd>_<tema>.md` |
| `clientes/` | Voz do cliente (depoimentos, perguntas, DMs, comentários, pesquisas) | `<aaaa-mm-dd>_<tema>.md` |
| `externas/` | Conteúdo de terceiros usado como pesquisa | `<origem>_<tema>.md` |

Pastas são criadas quando chega o primeiro arquivo.

**Entrada de cada arquivo:**
1. Áudio ou vídeo: transcrever com `.venv/bin/python codigos/02_transcrever_audio.py <arquivo>` (link: baixar com yt-dlp para pasta temporária antes). Fica só a transcrição em `.md`; PDF e slides viram texto em `.md`.
2. Ler uma vez, classificar pela tabela acima, renomear e mover.
3. Uma linha no `indice.md`: data, arquivo, tipo, tema, o que tem de útil.
4. `entrada/` fica vazia ao fim.

**Destilar** (só do material do autor; `externas/` nunca vira jeito de falar):
- `perfil.md` §3 "Jeito de falar": expressões que repete, como abre e fecha um raciocínio, analogias favoritas, perguntas que faz ao público, o que nunca diz. Com 1–2 trechos curtos de exemplo.
- `perfil.md` §9: histórias e cases que conta (com os números que ele usa).
- `perfil.md` §2: dores, objeções e perguntas do público nas palavras dele (de `clientes/` e das reuniões de venda).
- `vocabulario.md`: nomes de clientes, ferramentas, produtos e termos dele que a transcrição erra.
- Marque no `indice.md` onde cada arquivo foi destilado. Refaça a destilação quando entrar material novo relevante, não a cada vídeo.

**Privacidade:** dado de cliente que aparece em reunião (nome, faturamento, problema interno) serve de inspiração para o roteiro, mas nunca vai para a tela nem é citado sem o autor decidir. Não copie esses dados para o `perfil.md`.

## Etapa 4 — Calibração

1. Peça um vídeo-piloto de ~1 min gravado no setup definitivo.
2. Confira resolução, fps e perfil de cor contra o `perfil.md` §7 e diga o que ajustar na câmera.
3. Cor: se grava em log (ex.: Apple Log), a LUT de conversão para Rec.709 vai em `biblioteca/cor/entrada.cube`; LUT do look do autor (se tiver) em `biblioteca/cor/look.cube` (sem ela, vale o filtro de `estilo.md` §7). Rode o 01 e o 05 no piloto, escolha com o autor o frame de referência e grave com `codigos/05_tratar_imagem.py videos/<piloto> --gerar-referencia <segundos>` (→ `biblioteca/cor/referencia.png`, sem look). Registre em `estilo.md` §7.
4. Monte o kit: os componentes essenciais com a marca do autor, em stills, para aprovar (quando o catálogo existir — ver estado atual).

Ao fim do setup (e de cada sessão de setup), indique ao autor `guia/06-pedidos-prontos.md` (pedidos para copiar) e `guia/07-dicas.md`; antes do primeiro vídeo, `guia/04-gravar-bem.md`.

## Setup mínimo

Para não travar o primeiro vídeo bastam: `perfil.md` §1, §4, §5, §6 e §9 respondidos + `estilo.md` com o perfil escolhido + logo. O resto se completa com o uso; mostre o diagnóstico com o que ficou faltando, com o design system no topo se ainda não existir.

## Estado atual do sistema (atualizar quando mudar)

- Pronto: ambiente, pipeline 01–04 e 06–08, `elementos.md`, `plataformas.md`, verificador, remoção de fundo, catálogo Remotion com 5 variações (`citacao`, `numero`, `interface`, `lista`, `grafico`; ver `estilo.md` §10) e script de storyboard (`remotion/scripts/storyboard.mjs`).
- Ainda não existe: componentes essenciais `gancho`, `titulo`, `nome-na-tela`, `prova`, `cta` (o kit da etapa 4 cobre só o que existe), integração das cenas na composição `Aula`, script de referências (fazer os passos da etapa 2 à mão), gravação de tela pelo Playwright, biblioteca de SFX.
