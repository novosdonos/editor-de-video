# Elementos

Taxonomia única do sistema. O mesmo nome (slug) é usado em quatro lugares:

| Onde | Como aparece |
|---|---|
| Plano de cenas (`videos/<slug>/video.md`) | `tipo: numero` |
| Componente de motion | `remotion/src/componentes/<Tipo>.tsx` |
| Referências | `setup/referencias/<tipo>/` |
| Biblioteca | `setup/biblioteca/<pasta>/` (coluna "Pasta da biblioteca") |

Três pastas de material no `setup/`, cada uma com um papel: `referencias/` (como os outros fazem; vira regra no `estilo.md`), `biblioteca/` (material que aparece no vídeo) e `fontes/` (o que o autor fala e sabe: transcrições e textos; vira regra no `perfil.md` e no `vocabulario.md`; ver `fontes/indice.md`).

Slugs em português; quando o mercado usa termo em inglês, a descrição traz o termo (CTA, b-roll, SFX = efeito sonoro). Ao falar com o autor, usar sempre a descrição, nunca o slug sozinho.

Pastas só são criadas quando chega o primeiro arquivo. Tipo novo só entra aqui se nenhum existente resolver.

**Tipo não é forma.** O tipo diz o que a cena faz (`lista` = enumera); a forma visual sai do repertório do `estilo.md` §13 (uma `lista` pode ser checklist desenhado sobre a câmera, objetos em leque, rajada de b-roll com um item por plano...). Nunca escolher a forma pelo componente que já existe no catálogo.

---

## 1. Elementos por etapa do vídeo

| Etapa do vídeo | Objetivo | Elementos usados |
|---|---|---|
| Gancho (primeiros 3 s) | Parar a rolagem / prender | `gancho`, `numero`, `prova`, `interface`, zoom, `sfx` de impacto |
| Apresentação | Dizer quem fala | `nome-na-tela`, `vinheta` |
| Credibilidade | Provar que sabe | `prova`, `numero`, `foto`, `grafico`, `arquivo` |
| Desenvolvimento | Explicar a ideia | `titulo`, `lista`, `citacao`, `anotacao`, `interface`, `grafico`, `tela`, `b-roll` |
| Exemplo / case | Tornar concreto | `prova`, `foto`, `grafico` (antes/depois), `b-roll`, `arquivo` |
| CTA | Dizer o próximo passo | `cta`, `interface` |
| Encerramento | Fechar e assinar | `vinheta` |
| Em todo o vídeo | Ritmo e leitura | `legenda`, `transicao`, zoom, reenquadramento, cor, trilha, `sfx` |

---

## 2. Catálogo

**Prioridade** define o que a skill de setup pede:
- **essencial**: sem isso o primeiro vídeo não sai no padrão (entra no setup mínimo);
- **recomendado**: melhora muito o resultado; a skill pede depois do primeiro vídeo;
- **opcional**: pedido só quando o roteiro precisar.

### Motion (componentes)

| Tipo | O que é | Quando usar | Pasta da biblioteca | O que pedir ao autor | Prioridade |
|---|---|---|---|---|---|
| `gancho` | Frase curta de impacto na tela nos primeiros segundos | Abertura de reels, criativos e YouTube | — | Referências de aberturas que prenderam a atenção dele | essencial |
| `titulo` | Título de seção ou capítulo | Mudança de assunto, aulas e YouTube | — | Referência de título que ele goste | essencial |
| `nome-na-tela` | Nome e credencial do autor (ou convidado) na parte de baixo da tela; no mercado, "lower third" | Primeira aparição do autor ou de convidado | `marca/` | Nome como quer ser apresentado, credencial principal | essencial |
| `legenda` | Texto da fala na tela: palavras-chave (só a palavra forte) ou legenda corrida palavra a palavra | Conforme `perfil.md` §6 (por formato) e o campo `legenda` do `video.md` | `marca/` (tipografia) | Referência de legenda (print ou vídeo) | essencial |
| `numero` | Número grande que cresce até o valor | Faturamento, alunos, porcentagens, prazos | — | Os números que ele mais cita (resultados, base de clientes) | essencial |
| `lista` | Itens que entram um a um | "3 erros", "4 passos", qualquer enumeração | — | — | essencial |
| `citacao` | Frase ou palavra forte em destaque | Tese do vídeo, frase de efeito | — | Frases que ele repete | recomendado |
| `anotacao` | Traço manuscrito: seta, círculo, risco, sublinhado | Apontar algo na tela, corrigir uma ideia | — | Referência de estilo de anotação | recomendado |
| `grafico` | Barras, linha, antes/depois, comparação | Evolução, comparação, resultado | — | Dados reais que usa com frequência | recomendado |
| `interface` | UI do dia a dia: notificação, calendário, checklist, chat, clique, busca | Ilustrar rotina, venda chegando, tarefa feita | `interfaces/` | Prints da plataforma de vendas (notificação de venda), do perfil do Instagram, das ferramentas que usa | recomendado |
| `prova` | Print de resultado ou depoimento com moldura e destaque | Credibilidade e cases | `provas/` | Prints de faturamento, depoimentos, mensagens de alunos, notificações de venda (sem dados sensíveis) | essencial |
| `foto` | Foto com tratamento: recorte sem fundo, moldura, Ken Burns | História, contexto, bastidores | `fotos/` | Fotos do autor sem fundo, palco, equipe, eventos | recomendado |
| `cta` | Chamada final para ação ("comenta X", "link na descrição") | Final de reels/YouTube, criativos | `interfaces/` | Print do perfil, @, link, palavra-chave de comentário, página de vendas | essencial |
| `vinheta` | Abertura/encerramento com logo | Aulas e YouTube | `marca/`, `audio/` | Logo em SVG (ideal) ou PNG com fundo transparente, assinatura sonora se tiver | recomendado |
| `transicao` | Passagem entre blocos/cenas | Troca de seção, entrada de tela cheia | — | Referência de transição | opcional |

### Imagem (material filmado)

| Tipo | O que é | Quando usar | Pasta da biblioteca | O que pedir ao autor | Prioridade |
|---|---|---|---|---|---|
| `b-roll` | Imagens de apoio sem fala: do autor (trabalhando, eventos, bastidores) ou de banco (situações citadas na fala) | Mudar o ambiente, ilustrar o que é dito, quebrar plano longo; onde e com que frequência, a Direção do vídeo decide (`estilo.md` §13) | `b-roll/` | Ele trabalhando, mãos no teclado, escritório, eventos, cidade, rotina (10 a 30 takes de 5 a 15 s). O de banco a skill busca | essencial |
| `tela` | Gravação de tela de produto/plataforma real, com cursor, clique e zoom feitos no Remotion | Mostrar ferramenta, planilha, dashboard | `telas/` | Quais plataformas mostra com frequência e quais exigem login. A fonte segue esta ordem: 1. gravação do autor (`brutos/`); 2. biblioteca; 3. gravação automática (Playwright); 4. gravação assistida (autor navega, script grava) | opcional |
| `arquivo` | Imagem ou vídeo de terceiros: pessoa pública, evento, marca, notícia, trecho de outro criador (inclui react) | Toda vez que a fala cita pessoa pública, grupo de pessoas ("influenciadores", "médicos"), evento, marca ou notícia: propor sempre | `brutos/` do vídeo (pontual) | Nada: a skill pesquisa (ver seção 5). Se o autor já souber o vídeo, basta o link | recomendado |

### Edição (não são componentes)

| Recurso | O que é | Padrão |
|---|---|---|
| Zoom / punch-in | Aproximar ou afastar o enquadramento (aberto/médio/fechado) | Três planos em escada, troca seca, ênfase no fechado; o intervalo de troca vem da Direção do vídeo (base e casos em `estilo.md` §6.1) |
| Reenquadramento | Enquadrar o rosto em cada plano (travado por plano, sem seguir quadro a quadro) e ao gerar vertical a partir de horizontal | Rosto deslocado para o terço oposto quando card entra de lado; no vertical, rosto no terço superior da zona segura |
| Transição de câmera | Como a câmera entra e sai de uma tela de motion (volta seca, câmera que vira card, whip, desfoque) | Escolha da Direção; base e opções em `estilo.md` §6.1 |
| Layout | Como câmera e motion dividem a tela | Ver seção 3 |
| Cor | LUT + correção por vídeo | `biblioteca/cor/` |
| Trilha | Música de fundo por clima | `biblioteca/audio/` com prefixo `trilha_<clima>` |
| `sfx` | Efeito curto sincronizado com motion | `biblioteca/audio/` com prefixo `sfx_<tipo>` (tabela abaixo) |

SFX por elemento: repertório para quando a Direção pede som em eventos visuais (`10 --modo eventos`). A base é som só com contexto (`estilo.md` §9); esta tabela não é para aplicar em todo item:

| Elemento | SFX |
|---|---|
| `gancho`, `numero` (ao fechar o valor) | `sfx_impacto` |
| `titulo`, `transicao` | `sfx_whoosh` |
| `lista` (cada item), `cta` | `sfx_pop` |
| `interface` | `sfx_click`, `sfx_notificacao` |
| `numero` (crescendo), revelação | `sfx_riser` |
| Texto sendo digitado | `sfx_digitacao` |

---

## 3. Layouts

| Layout | Descrição | Uso típico |
|---|---|---|
| `cheia` | Câmera em tela cheia, motion por cima (sem cobrir o rosto) | Padrão de fala |
| `reduzida` | Câmera reduzida (~40%) num lado, motion no outro | Explicação com lista, gráfico, interface (16:9) |
| `dividida` | Motion em cima, rosto embaixo (ou o inverso) | Vertical com conteúdo visual denso |
| `motion` | Só motion ou tela, voz por baixo | Gráfico, tela gravada |
| `ambiente` | Imagem real em tela cheia (b-roll, `arquivo`, foto), voz por baixo; pode levar palavra gigante ou traço por cima | Troca de ambiente, exemplo concreto, pessoa citada |

---

## 4. Biblioteca

Pastas de `setup/biblioteca/` (material recorrente, usado em vários vídeos):

| Pasta | Conteúdo |
|---|---|
| `marca/` | Logos, tipografia (arquivos .ttf/.otf), texturas e padrões da marca |
| `fotos/` | Fotos do autor, equipe, palco, bastidores |
| `b-roll/` | Takes reutilizáveis |
| `telas/` | Gravações de tela reutilizáveis |
| `provas/` | Prints de resultado, depoimentos, notificações de venda |
| `interfaces/` | Prints de perfil, plataformas e ferramentas |
| `audio/` | Trilhas, SFX e vinhetas sonoras |
| `cor/` | LUTs |

Regras:
- **Recorrente vai para a biblioteca; pontual vai para `videos/<slug>/brutos/`.** Se um material pontual servir para outros vídeos, a skill sugere promovê-lo.
- **Nome descreve o conteúdo**: `<tipo>_<descricao>-<nn>.<ext>`, minúsculas, sem acento (ex.: `b-roll_escritorio-digitando-01.mov`, `prova_notificacao-venda-hotmart-02.png`). Arquivo que chega com nome de câmera (`IMG_4821.mov`) é olhado uma vez e renomeado na entrada.
- **Sem dados sensíveis** em provas (nome de cliente, e-mail, CPF): borrar antes de salvar.
- **Trilha, SFX e b-roll de banco**: só com licença que permita uso comercial (nunca CC BY-NC); origem anotada no `ORIGEM.md` da pasta. Cena `arquivo` (pessoa pública, evento, react) segue a seção 5: o autor decide.

---

## 5. Arquivo de terceiros (`arquivo`)

Quando o roteiro, o plano de cenas ou a transcrição citam uma pessoa, evento, marca ou conteúdo de terceiros, a skill **propõe uma cena `arquivo`** e avisa que pode buscar o material.

**Uso:** o autor decide o que usar, inclusive material sem licença (YouTube, redes sociais, react). A skill não bloqueia nem insiste em direitos; se houver reclamação, o autor tira o vídeo do ar.
**Única regra fixa:** nunca editar fala ou imagem para a pessoa parecer dizer ou fazer o que não disse/fez (sem cortar frase fora de contexto, sem dublagem, sem montagem enganosa).

**Busca:**
1. Link do autor, se houver.
2. YouTube via yt-dlp: `yt-dlp "ytsearch20:<descrição do momento>" --flat-playlist --print "%(id)s | %(title)s | %(channel)s | %(duration)s"` (o campo `license` mostra quando é Creative Commons).
3. Outras origens: Wikimedia Commons (fotos/vídeos abertos e domínio público), acervos públicos, redes sociais (`yt-dlp <link>`; Instagram pode pedir `--cookies-from-browser chrome`), busca na web. Termo genérico na fala ("influenciadores famosos", "médicos", "grandes empresas"): não esperar o autor dar nomes. Pesquisar na web quem são hoje (rankings, matérias recentes), escolher 3–6 nomes que o público do autor reconhece de relance e ir às redes reais deles (perfil, post do feed, story, reels; Instagram pelo Chrome do autor ou `yt-dlp --cookies-from-browser chrome`). Nomes citados pelo autor entram primeiro; a pesquisa completa o resto.

**B-roll de banco** (não é de terceiros identificáveis), nesta ordem, sem pedir nada ao autor:
- **Mixkit** (sem chave, 1080p, uso comercial sem crédito): listar em `https://mixkit.co/free-stock-video/<termo>/` (`curl -A "Mozilla/5.0"`) e baixar o `https://assets.mixkit.co/videos/<id>/<id>-1080.mp4` direto.
- **Pexels** (acervo maior; API com `PEXELS_API_KEY` no `.env`): opcional; sem chave, seguir com Mixkit e Commons. Criar a conta/chave é ação do autor (o Claude não cria contas). O site bloqueia download sem API.
- **Wikimedia Commons** (API aberta): fotos e vídeos de arquivo/históricos; conferir a licença de cada um.
Guardar o que for reutilizável em `biblioteca/b-roll/` com a origem no `ORIGEM.md`.
4. Achar o momento exato: baixar para pasta temporária, detectar mudanças de cena (`ffmpeg -vf "select='gt(scene,0.3)'"`), montar folha de frames e, se houver fala, transcrever com o 02.
5. Mostrar os candidatos de todas as cenas `arquivo` num lote só (frame, fonte, trecho) para o autor escolher.
6. Recortar só o trecho escolhido para `brutos/arquivo_<descricao>-<nn>.mp4`, apagar o resto e anotar fonte (link, canal, trecho) no plano de cenas do `video.md`.

