# Estilo

O design system de edição do autor: **base, não lei**. Lido pela `/video-roteiro` e pela `/video-editar` depois da seção "Direção" do `video.md` do vídeo. Como decidir: `.claude/skills/video-editar/direcao.md`. Arquivo longo: cada skill lista as seções da etapa; não precisa ser lido inteiro.

## Como ler

Três camadas, marcadas no título de cada seção:

- **[Identidade]**: marca, ética e limites técnicos. Fixo; só o autor muda.
- **[Base]**: princípios com o porquê e o valor que funcionou até agora. Ponto de partida de todo vídeo. A Direção pode mudar a base quando ela atrapalha o que o vídeo precisa causar, e anota o motivo ("Quebras da base").
- **[Repertório]**: formatos, referências e cenas aprovadas, com o que foi medido. Exemplo para traduzir o raciocínio, nunca molde; número medido é exemplo, não meta.

As seções 3, 5, 6, 9, 12 (palavra em destaque) e 13 já vêm com uma base inicial (ofício que vale para qualquer autor); as demais são preenchidas pela `/video-setup` e pelo uso. Cada princípio segue o formato **porquê → base → muda quando**. Aprendizado novo entra como caso (princípio + o que se fez + em que tipo de vídeo + quando não vale), na seção do assunto ou no §11. Origem entre parênteses (data, vídeo).

Fixo em qualquer vídeo (camada Identidade): tokens do §2; material real e do próprio caso, nunca distorcer fala ou imagem de ninguém (`elementos.md` §5); dado de cliente fora da tela; zonas seguras e volume da plataforma (`plataformas.md`); texto que não se lê no tamanho final não entra.

---

## 1. Perfil de edição [Base]

Base: (sóbrio, dinâmico ou cinematográfico — escolhido na `/video-setup`)
Referências:

## 2. Tokens [Identidade]

Valores também em `remotion/src/marca.ts` (os dois sempre iguais).

| Token | Valor |
|---|---|
| Fundo escuro | |
| Fundo claro | |
| Destaque (único) | |
| Superfície elevada (escuro) | |
| Texto secundário | |
| Fonte principal (e pesos) | |
| Entrelinha | 0,95–1,0 em títulos e blocos de palavra-chave; 1,4–1,5 em texto corrido |
| Fonte técnica (rótulos) | |
| Fonte manuscrita (anotações) | |

## 3. Layouts [Base]

- `cheia`: câmera em tela cheia, motion por cima, sem cobrir o rosto; degradê no pé da imagem.
- `reduzida`: câmera num painel à direita, motion à esquerda. Cena de até ~15 s: câmera ~40% (cantos 36 px), sem sobrepor. Framework longo (mais de ~15 s): câmera ~28% num card que sobrepõe a borda do framework.
- `dividida` e `motion`: ver `elementos.md`.
- **Alinhamento das telas lado a lado** (2026-11-13: tela e câmera desalinhadas numa aula). Porquê: blocos lado a lado com topos e bases diferentes parecem erro, não intenção. Base: tela e câmera com o mesmo topo e a mesma base, o conjunto centrado na vertical; margens laterais iguais (ex.: 60 px dos dois lados); respiro fixo entre os blocos (ex.: 24 px); o rótulo da trilha no topo das telas. Desalinhar só quando é intenção visível (card que sobrepõe a borda de propósito), nunca por sobra de medida.


### 3.1 Vertical / reels (aprendizado dos cortes de 2026-11-12)

Repertório, não regra fixa (§13): o briefing escolhe. Quando o reels sai do formato dividido (composição `Reels`):
- **Layout dividido**: imagem real ou motion na faixa de cima, sangrando até o topo e sempre preenchida (nunca tarja nem faixa vazia); câmera 16:9 embaixo; emenda em degradê, sem linha de divisão.
- **Headline só na abertura** (~2 s, centralizada, peso forte); some quando a dinâmica começa. Câmera (zoom + rastreio) carrega o resto.
- **Palavra-chave = só a palavra destaque**, grande, no peito (y ≈ 1350). Sem texto de apoio acima ou abaixo: no vertical rápido não dá tempo de ler.
- Gráficos de cima ficam ≥ 120 px acima da cabeça; texto nunca encosta no queixo com a câmera fechada.
- Cobrir inserção do bruto com **imagem contextual** (ex.: mosaico de pessoas reais fazendo o que a fala diz), nunca tela preta com texto.
- **Tag de seguir** (avatar real, @, selo, "Seguir" → "Seguindo" com som) uma vez, em trecho sem palavra-chave.
- **Cartão final** (~3,5 s): print do bloco do perfil (sem os posts), headline com a oferta real + selo de urgência, link da bio acende e é tocado, pílula "Toque no link da bio".
- Saídas: §5. Material de terceiros: o que a fala cita, contextualizado.

## 4. Linguagem visual [Repertório]

(Como o motion do autor se parece: anotações à mão, interfaces desenhadas, vidro, fundo claro ou escuro etc. Preenchido a partir das referências.)

## 5. Movimento [Base]

- Entrada com ease-out; saída com ease-in; linear só em rotação contínua e barra de progresso.
- **Toda cena e todo texto saem com transição** (0,3–0,4 s, ease-in): esmaecer junto com movimento (encolher 4–6%, subir 15–25 px, desfoque na imagem, células em cascata); nunca corte seco de motion para câmera nem esmaecimento curto (≤ 0,2 s) que parece falha. Cena que cobre algo do bruto só começa a sair depois que o que ela cobre terminou (2026-11-12, reels 02a: mosaico saía "de repente").
- Antecipação de 4–8 px por 80–120 ms antes de movimento grande.
- Um foco por vez: o resto cai para 40% ou desfoca.
- Filhos entram 40–80 ms depois do pai.
- O que para passa 2–4% (escala) ou 4–6 px do ponto e assenta em 150–250 ms.
- Duração pelo tamanho: botão/ícone 150–300 ms; card 350–600 ms; tela inteira 600–900 ms.
- Cursor e objetos que viajam andam em arco; clique comprime para 96% e volta.
- **Um momento-chave por cena** (entra 10–20% maior e assenta); o resto quieto.
- Texto na tela por pelo menos ~0,3 s por palavra.
- Mesma luz e sombra por nível em todas as cenas.
- **Tirar um acessório**: antes de fechar a cena, cortar um elemento decorativo que não muda o entendimento (2026-11-12, ref. skill frontend-design).
- **Movimento vivo depois da entrada** (2026-11-13, ref. site de plataforma de vendas). Porquê: em tela que fica mais de ~2 s, o que congela parece imagem colada; uma deriva pequena (flutuar 3–6 px em 5–7 s, anel de pulso, linha pontilhada correndo) mantém a cena viva sem pedir atenção. Serve a satélites: cards de apoio, pinos, ícones, chips. Não serve ao foco que está sendo lido (texto longo, número contando, notificação), que fica parado para ler, nem a cena que pede peso e silêncio (frase de impacto, fecho), onde o parado é a intenção. Conviver com "um foco por vez": se o movimento compete com a fala, a amplitude está grande demais. `flutua` em `movimento.ts`.
- **Duas curvas de entrada, escolhidas pelo papel** (2026-11-13). `eo` (cúbica) chega com freio no fim e marca tempo: batida de fala, palavra em destaque, contador junto da voz. `eox` (expo-out, ~0,55 s) chega quase inteira no primeiro terço e passa o resto assentando: card ou objeto que entra e fica (notificação, card de venda, janela), com sensação leve e cara. Na dúvida, perguntar: isto marca um tempo da fala ou só precisa estar lá? Marca tempo → `eo`; precisa estar lá → `eox`.
- Todas as curvas e durações vêm de `remotion/src/movimento.ts`; nenhum componente define curva própria.

## 6. Corte e ritmo [Base]

- Manter sempre a última versão completa da frase; "corta essa parte" dita em vídeo = cortar o bloco.
- Procurar autocorreções de uma palavra ("avalia" → "analisa"): fica a segunda.
- Gagueira = palavra curta de baixa confiança isolada: cortar.
- Regravação pode começar com palavras diferentes e repetir só o fim: a mesma ideia nunca aparece duas vezes seguidas. Comparar o fim das frases, não só o início. Conferir a lista de trechos repetidos do 03.
- Paralelismo retórico intencional fica, desde que as duas frases digam o que o autor quis dizer; na dúvida, perguntar (fala invertida passa despercebida como paralelismo).
- Ritmo do 06: pausa como se ouve = volume 13 dB abaixo do nível da fala e sem consoante (`--queda-pausa 13`; a cauda da voz depois da frase soa como pausa e sai com fade; respiração não é consoante); vogal arrastada (som parado > 0,14 s) fica com 0,10 s; última sílaba antes de pausa não se estica ("s" final até 0,08 s; vogal final até 0,14 s tirando o miolo, nunca o decaimento, que sem ele a fala fica seca): soa como espera e mostra a expressão de quem vai continuar (2026-11-12, 01); pausa dentro da frase a partir de 0,15 s perde o meio; respiro de 0,08 depois de fim de frase, 0,05 no meio da frase e 0,05 antes da fala; trecho mínimo 0,4, **Pausa máxima e velocidade não têm número fixo**: o vídeo fica o mais dinâmico que aguenta sem engolir palavra nem soar acelerado. Ponto de partida do 06: pausa máxima 0,3 e 1,1×. Apertar a partir daí e conferir na amostra, ouvindo fim de palavra e de frase (o 06 avisa quando palavra mantida perde pedaço); onde comer sílaba ou a fala perder o sentido, afrouxar. Ajustar ao gosto do autor no vídeo-piloto.
- Ritmo nunca às custas da imagem: só erro e pausa a partir de 0,35 s viram corte (salto); pausa mais curta e vogal arrastada viram trecho acelerado na imagem, sem salto. Corte dentro de palavra trava o vídeo (2026-11-13, 01).
- Frase de destaque é síntese objetiva, não transcrição ("Errar aqui custa caro."); raciocínio construído em etapas ("primeiro isso, depois aquilo… e agora?") ganha animação que acompanha cada etapa (2026-11-13, 01).
- Áudio: o tratamento não pode subir "s", "x", "f" e respiração acima do original (soa como ruído de fundo); de-esser forte depois do compressor (2026-11-13, 01).
- Dado de apoio ao lado do rosto fica na altura dos olhos (como uma lista de itens curtos), nunca no topo do quadro; número conta contínuo e notificação entra em feed, com a cena começando antes da 1ª batida (2026-11-13, 01).
- Câmera: troca de plano só em corte com salto do rosto (no mínimo 4 s depois da anterior) e em destaque; escada a cada ~6 s; sem desfoque na volta de cena (2026-11-13, 01).
- Nunca confiar nos tempos de palavra do Parakeet para cortar: erram até 0,25 s. Toda borda de corte vai para a emenda real medida no áudio, e o "aparar" só se usa em arrasto que aparece no volume.
- Amostra para o autor: `06 --amostra INI-FIM,...` (grava sempre `previas/amostra-cortes.mp4`), janelas começando e terminando em fim de frase; conferir retranscrevendo antes de mandar.
- Emendas com crossfade de 20 ms; nunca fade até zero (o ruído de fundo some e soa como picote).
- Zoom e reenquadramento: ver §6.1 (etapa própria, depois do motion aprovado).
- Conteúdo que sai mesmo bem falado: ver §6.2.
- Todo aviso "Revisar" do 03 (gagueira, trecho repetido, frase repetida longe) recebe decisão antes do render: corta ou fica com motivo anotado.

### 6.1 Câmera e transições (enquadramento)

- **Porquê**: a câmera muda para renovar a atenção e para marcar ênfase; câmera que mexe sem motivo treme e cansa.
- **Base**: enquadramento travado por plano (nada de seguir o rosto quadro a quadro), três planos (aberto 100% com cenário visível, médio, fechado com rosto e ombros), escada a cada ~6 s (`09 --troca 6`); troca em corte só quando o rosto salta (no mínimo 4 s depois da anterior) e em destaque. Escalas: até 1080p 1,0/1,15/1,3 (em 720p o fechado vai no máximo a ~1,14×); 4K 1,0/1,25/1,5. Porquê da base: num vídeo real, troca a cada 1,5 s com rastreio contínuo deixou a imagem tremendo e o zoom em excesso, e 4 s ainda ficou agitado.
- **Fluidez**: nenhum plano com menos de 2,5 s que não nasça de corte (o 09 absorve no anterior, `--plano-minimo`); dois planos iguais seguidos viram um; plano de corte curto já entra no enquadramento seguinte; sem aproximação antes de cena (`--rampa 0`); câmera parada dentro de cena (sem aproximação lenta, sem zoom que desfaz no fim); zoom dentro de cena só quando um elemento pede espaço (card lateral), até ~1,2× em bruto 720p.
- **Muda quando**: o vídeo pede mais energia (vertical de caso real, anúncio) e o bruto aguenta (4K). Mudou a base: testar 1 min no bruto do autor antes do vídeo inteiro.
- **Caso medido** (referência de câmera dinâmica, YuNet): troca de plano a cada ~1,5 s em média (0,8–3 s), inclusive no meio de um take, os três planos em partes parecidas; câmera visível ~70% do tempo, tela só de motion ~30%. É exemplo de energia, não meta.
- **Escada**: fechar aos poucos ao longo de um raciocínio (aberto → médio → fechado) e voltar para o aberto num salto seco quando o assunto muda ou ao voltar de uma tela de motion. Pingue-pongue fechado → aberto → fechado não tem sentido para o olho.
- **Troca seca** (punch-in no corte ou na entrada de destaque). Aproximação/afastamento lento (~1 s, 6–10%) fica fora da base (zoom que vai e volta); **muda quando** a Direção pede tensão numa frase e o teste de 1 min no bruto mostra que não treme.
- **Ênfase = fechado**: frase forte, número ou pergunta direta pedem o plano fechado; quando um **destaque** entra, a câmera fecha no mesmo frame (o zoom acompanha a animação). Em **cena**, a câmera fica aberta e parada (Fluidez).
- **Card lateral sem dividir a tela**: quando um card entra de um lado sobre a câmera cheia, o rosto vai para o terço oposto (centro do rosto em x ≈ 25% ou 75%) no mesmo frame, junto com um fechamento e 3–4 frames de desfoque de movimento. Bom para cenas curtas (até ~8 s); `reduzida` serve melhor a frameworks longos.
- **Câmera → motion** (repertório, quando a Direção pede; a base é a câmera aberta e parada até a cena entrar): a câmera não some, vira elemento. Afasta devagar (~0,5 s), ganha borda e cantos arredondados, encolhe para um card sobre o fundo e pode virar o próprio assunto (vertical de reels, miniatura, player) antes de dar lugar à tela de motion.
- **Motion → câmera**: base é voltar seco no plano aberto, sem desfoque, e fechar a partir dali. **Muda quando** a Direção pede transição marcada: whip (desfoque horizontal de 4–6 frames) ou desfoque de foco que resolve em ~0,3 s.
- [Identidade] Nunca mexer o enquadramento no layout `reduzida` nem durante motion que cobre a tela; o rosto nunca fica atrás de card (`plataformas.md` §2).
- Ordem: o gancho de câmera de cada cena é decidido no mapa de motion (A3) e executado depois do motion aprovado (etapa 7 da `/video-editar`), porque o zoom acompanha a animação.
- Quem aplica: `codigos/09_enquadrar.py` (planos na seção `enquadramento`; `--troca` vem da Direção) + `remotion/src/Camera.tsx`. O 06 não faz zoom.

### 6.2 Corte editorial

O 03 pega erro de fala; o corte editorial pega **conteúdo** que deixa o vídeo pior mesmo bem falado. Feito na etapa de cortes, antes de qualquer motion, lendo o texto mantido inteiro em blocos de ~2 min. Marcar como `editorial` (com `motivo`) quando:

- **Ideia repetida longe**: o mesmo argumento, exemplo ou conclusão dito de novo minutos depois sem acrescentar nada; fica a versão mais forte (o 03 lista frases repetidas longe, mas paráfrase só a leitura pega).
- **Tangente**: desvio que não serve à tese do `video.md` e não volta para ela.
- **Bastidor**: fala com alguém fora do quadro, comentário sobre a gravação ("deixa eu ver", "vou fazer de novo", "tá gravando?"), contagem, teste de áudio.
- **Anúncio sem entrega**: "vou mostrar daqui a pouco" e nunca mostra; referência a algo que foi cortado.
- **Raciocínio enfraquecido**: a mesma conclusão sai melhor alguns segundos depois; ou a explicação continua depois que a ideia já fechou (cauda que tira a força da frase final).
- **Fala invertida ou que contradiz o que o autor quis dizer**: sempre perguntar.
- **Abertura lenta**: os primeiros ~30 s precisam entrar na tese; aquecimento ("bom, então, hoje eu queria...") sai.

Na dúvida, `incerto: true`: o autor decide na revisão de cortes; nunca cortar conteúdo em silêncio. Nunca cortar o que o briefing marcou como "não pode faltar".

## 7. Cor

- Como a cor entra no vídeo: o 05 mede cada gravação e decide a correção por trecho (seção `cor`); o 06 aplica entrada da câmera + correção + look no mesmo render dos cortes. O look é `biblioteca/cor/look.cube` se existir; senão, **o primeiro filtro entre crases desta seção** (o 05 lê daqui: mudar o filtro muda o look de todos os vídeos seguintes). Sem LUT nem filtro, não há look: só a correção.
- Look atual (filtro ffmpeg entre crases, escolhido com o autor na calibração):
- Meta:
- O alto padrão vem da ambientação, não do rosto: pele natural; fundo desfocado, luzes práticas no cenário e separação clara entre pessoa e fundo. Resolver na captação (`perfil.md` §7); na edição, só reforçar (vinheta, fundo um pouco mais escuro que o rosto).
- Frame de referência de cor: definido a partir do vídeo-piloto e gravado com `05_tratar_imagem.py --gerar-referencia` em `biblioteca/cor/referencia.png`; até lá, o 05 só corrige o que está claramente fora (rosto escuro/claro demais, dominante de cor, imagem lavada).

## 8. Legenda [Base]

Estilo do autor: (palavras-chave na tela / legenda completa animada / só `.srt` / nenhuma — por formato em `perfil.md` §6)

- Vertical: base do bloco no máximo em y = 1400, nunca no terço inferior (ver `plataformas.md`).

## 9. Áudio, SFX e trilha [Base]

- Voz: -16 LUFS em aula, -14 LUFS em redes (pico -1 dBTP).
- SFX é a última camada (etapa 8 da `/video-editar`, depois do motion e da câmera): a lista de eventos visuais sai deles. Quem escolhe: `codigos/10_sonorizar.py` (seção `sfx`); volume pelo pico do arquivo: cena -12 dBFS, destaque -15, câmera -20; troca de plano da escada não tem som.
- SFX só onde há evento visual; começa no mesmo frame do movimento; nunca o mesmo som duas vezes seguidas; nunca sintetizar som por código; sempre abaixo da voz.
- SFX nunca no acento forte da música; trilha e SFX nunca cobrem palavra.
- Biblioteca: `biblioteca/audio/` (kit CC0 incluído; origem em `ORIGEM.md`). Nunca usar licença CC BY-NC.
- Trilha por formato: `perfil.md` §6.

## 10. Componentes do catálogo [Repertório]

Catálogo em `remotion/src/componentes/<Tipo>.tsx` (um arquivo por tipo de `elementos.md`, uma exportação por variação; peças comuns em `comum.tsx`). Batidas são props em segundos desde o início da cena, ancoradas nas palavras faladas. Cada arquivo traz um exemplo de parâmetros (`<tipo>Aula01`) do vídeo de demonstração; a câmera e as imagens desse exemplo não vêm no repositório.
Storyboard: `node scripts/storyboard.mjs <videos/<slug>/previas>` (lê `storyboard.json`, gera `storyboard.html`).

Os componentes já vêm com as cores e fontes de `marca.ts`. Status "disponível" = pronto para usar, ainda não aprovado no gosto deste autor; ao aprovar no primeiro vídeo, trocar para **aprovado** com a data.

| Componente | Variação | Layout | Status | Data |
|---|---|---|---|---|
| `citacao` | `CitacaoRiscada` (palavra riscada à mão + palavra certa num bloco na cor de destaque) | cheia | disponível | |
| `numero` | `NumeroSaldo` (total crescendo em vidro, notificações de venda uma por vez, tag com bandeiras, mapa pontilhado com pinos) | cheia | disponível | |
| `interface` | `InterfaceJornada` (trilha vertical de etapas com logos + tela grande recriada por etapa: busca, formulário, perfil, conversa, avaliação, chamada, proposta) | reduzida longa | disponível | |
| `lista` | `ListaChecklist` (framework convergente: meios com ícones levam ao item-chave; descartes riscados) | reduzida | disponível | |
| `grafico` | `GraficoTeto` (calendário semanal que trava num limite e vira gráfico hora × resultado) | reduzida | disponível | |
| `titulo` | `TituloAula` (rótulo da trilha com traço na cor de destaque + título grande no peito, sobre a câmera cheia) | cheia | disponível | |
| `comparacao` | `ComparacaoListaAmarela`, `ComparacaoVizinhos`, `ComparacaoFeed`, `ComparacaoConfianca`, `ComparacaoNutriOpcoes`, `ComparacaoNutriPrograma`, `ComparacaoNutriGarantia` (contrastes antes × hoje e opção × opção, em janelas curtas para a câmera ficar visível) | cheia / reduzida | disponível | |
| `destaque` | `Frase`, `Palavra`, `Riscadas`, `Icones`, `Pilha`, `NumeroDestaque`, `Balao` (palavras-chave transparentes sobre a câmera; ver §12 "Palavra em destaque") | cheia | disponível | |
| `balao` | `Balao` com `pb` → voz do outro (aluno, objeção): câmera em preto e branco enquanto o autor fala como o outro, volta à cor seco na resposta | cheia | disponível | |
| `arquivo` | `ArquivoFeed` (Arquivo.tsx) → material real em caixas: até 3 cartões com posts/reels reais num canto livre, chips de @ e seguidores, palavra no peito; conversa parada com etiqueta | cheia | disponível | |
| `grafico` | `GraficoCalendario` → calendário de verdade comprimindo ano → mês → semana → dia, para num dia circulado à mão | tela cheia | disponível | |
| `grafico` | `GraficoCommodity` → grade de cards idênticos em que só o preço muda, vira tabela de preços; câmera em card à direita | reduzida | disponível | |
| `grafico` | `GraficoSemCom` → oferta "antes × depois" em faixas empilhadas, preço com multiplicador, entregáveis com ícone, mockups um por vez, área de aulas, selo de garantia | cheia → reduzida | disponível | |
| `grafico` | `GraficoAnoVolta`, `GraficoConsultaAnos`, `GraficoAcasoSorteio`, `GraficoInconscientes` → contador de ano voltando; barras "pouco × muito"; sorteio entre iguais que para em "você"; grade de pessoas com "?" e seta de ação | cheia (terço livre) | disponível | |
| `lista` | `ListaVozDoAluno` → voz do aluno em P&B: "entendi que…" vira lista com check; cenário desenhado em traço, relógio de espera, pergunta em mensagem | cheia | disponível | |
| `anotacao` | `AnotacaoObjetos` (Anotacao.tsx) → documentos em leque como objetos + agenda vazia; `AnotacaoCaminho` → trilha tracejada com marcos até a bandeira com check | cheia | disponível | |
| `fecho` | `FechoBatida` (Fecho.tsx) → frase de maior impacto: imagem escurece em volta do rosto, palavras em batida, palavra negada riscada, final grande na cor de destaque | cheia | disponível | |

## 11. Aprendizados [Base]

Casos agrupados pelo princípio que ensinam. Formato: princípio → o que se fez → quando não vale (data, vídeo). Aprendizados repetidos ou contraditórios são fundidos; quando dois tipos de vídeo pedem coisas opostas, os dois casos ficam, cada um com o seu contexto.

## 12. Sistema visual (destilado das referências) [Repertório]

Origem: `referencias/indice.md`. O que copiar das referências é a **estrutura**; cor, fonte e cor de imagem continuam as do autor (§2, §7).

**Fora (não copiar)**:

**Ofício gráfico** (2026-11-12, destilado das skills frontend-design e ui-ux-pro-max; vale para toda cena):
- Se a paleta do autor cair num visual comum de design gerado por IA (fundo quase preto + um único destaque quente ou ácido; fundo creme + destaque terracota; rótulo mono em caixa alta), ela fica (é marca, §2). A diferença do vídeo vem de outro lugar: imagem real, tipografia tratada como elemento (escala, recorte, profundidade), e não de enfeite.
- Estrutura carrega informação: numeração (01/02/03) só quando a fala é uma sequência de verdade; rótulo acima do conteúdo só quando diz algo que o conteúdo não diz.
- Gráfico: valor escrito direto na barra ou no ponto (sem legenda separada), uma informação por gráfico, grade quase apagada, destaque na tendência e não no acabamento.
- Texto sobre vídeo: legível no **pior** quadro do trecho, não no médio; degradê ou sombra conferidos sobre a imagem real.
- Número que conta usa algarismos tabulares (classe `nd-num`) para não tremer.

### Palavra em destaque

Padrão inicial: nunca um formato único. Ler o que a fala **faz** e escolher o formato que intensifica isso; o vídeo usa vários formatos.

| A fala… | Formato (`Destaque.tsx`) |
|---|---|
| afirma uma tese ou frase de efeito | `Frase`: síntese de 2–5 palavras no terço livre, na altura dos olhos, entrando junta no momento-chave; uma na cor de destaque |
| bate uma palavra só, com pausa | `Palavra`: palavra grande no terço livre do quadro |
| nega, descarta ou troca uma palavra | `Riscadas`: palavras riscadas à mão; a certa entra depois |
| enumera exemplos concretos | `Icones`: ícones de traço fino ao redor do rosto, cada um na palavra |
| acumula coisas que não resolvem | `Pilha`: pílulas empilhando na fala |
| diz número, valor ou contagem | `Numero`: número grande e solto (atrás da cabeça, no terço livre ou sobre imagem real), contando na fala; vidro só se o orçamento de §13 permitir |
| imagina uma fala, pergunta ou objeção do aluno | `Balao`: bolha de chat ou de pensamento; ou a cena imaginada em imagem real (ex.: alguém de jaleco sem diploma) |
| numera um raciocínio interno | `Topico` (em `Lista.tsx`): número + frase curta |
| abre um aprendizado da aula | `Capitulo` (em `Lista.tsx`): o mesmo card da lista de fechamento, item da vez acende |

- Frequência: ~1–2 por minuto fora das cenas; nunca dois ao mesmo tempo; nunca em cima de cena de motion.
- Só destacar o que muda o entendimento; frase comum fica sem destaque.
- Texto na tela **complementa** a fala: síntese objetiva de 2–5 palavras, não transcrição ("A maioria das pessoas leva meses para perceber esse erro" → "Meses sem perceber"). Nunca mudar o sentido.
- Fica longe do rosto: terço livre na altura dos olhos. **Nunca no peito**: quando a câmera fecha, o queixo desce e o texto do peito atravessa o rosto. Vale para o horizontal: no `Reels` dividido a palavra-chave fica no peito (y ≈ 1350), regra daquele layout; componentes que põem texto no peito com a câmera cheia (`TituloAula`, `ArquivoFeed`, vidro) pedem a câmera aberta no trecho. Texto e destaque ficam fora da transformação da câmera: conferir em still do vídeo montado, com a câmera aplicada.
- A síntese entra junta (palavras a ~0,08 s) na palavra-chave, nunca esticada pela fala inteira. Raciocínio em etapas ganha animação com uma batida por etapa (um item por vez, o anterior sai), não lista parada.
- Frase alterna a forma ao longo do vídeo, nunca a mesma em seguida: bloco no terço livre (esquerda ou parede à direita), palavras empilhadas grandes, linha embaixo com câmera aberta, palavra-chave à mão. A troca com risco ("Eu ~~sou~~ estou") fica numa linha só, embaixo, com a câmera aberta. Raciocínio enumerado vira lista que acumula na tela (quem ouve não esquece o item anterior); a frase de maior impacto (fecho) ganha peça própria: imagem escurece, palavras grandes em batida e um som de impacto.
- Enumeração de coisas diferentes ganha um ícone **por item**, que represente aquele item (pós-doutorado ≠ MBA ≠ certificado), nunca a mesma pílula repetida.
- Nada fica parado na tela esperando a próxima fala: se há mais de ~2 s sem batida, o elemento sai ou a cena muda de forma (parado para ler ou para dar peso é intenção, §5).

## 13. Repertório e variedade [Base + Repertório]

Padrão inicial, aprendido em revisão real: repetir o mesmo bloco de vidro, texto e tela dividida para tudo deixa o vídeo monótono. As referências do `indice.md` valem para **qualquer** cena, não só para o tipo em que foram catalogadas.

**Formatos são repertório, nunca regra.** Todo formato aprovado (react em tela dividida, vidro, palavra atrás da cabeça, P&B na voz do outro…) é mais uma opção, não obrigação nem exclusividade de uma plataforma: reels pode sair sem tela dividida, aula pode usar react. Para cada vídeo, a direção criativa (`perfil.md` §10 + briefing do `video.md`) escolhe o formato de edição que faz mais sentido; o formato do vídeo inteiro (ex.: react) não conta no orçamento de cenas abaixo. Anúncios pedem variação de formato de propósito (testar vários); reels e YouTube também testam formatos novos. Quando um formato vira padrão fixo, o vídeo fica repetitivo.

**No mapa de motion (A3), antes de desenhar uma cena, responder por escrito no `video.md`:**
1. Qual o raciocínio da fala (narra uma jornada, compara, prova, nega, conta, enumera, imagina, provoca)?
2. Três formatos possíveis do repertório abaixo, de famílias diferentes, e o escolhido com o porquê.
3. O que veio antes e depois na linha do tempo (o formato não pode repetir o vizinho).

**Repetição**: o teste é o olho, não a conta. Olhando a sequência inteira, alguma forma volta sem motivo, a ponto de o vídeo parecer modelo pronto? A Direção muda a base com motivo (ex.: na faixa viva a faixa de cima é o contêiner do vídeo inteiro).
- Mesmo contêiner (card de vidro, pílula, bolha), tela dividida/`reduzida` ou texto puro em itens seguidos pede motivo.
- Aula longa pede troca de ambiente (imagem real em tela cheia: b-roll, `arquivo`, foto) de tempos em tempos; a Direção diz onde.
- O que funcionou na aula 16:9 (exemplo, não cota): mesmo contêiner em até ~1 a cada 4 itens, tela dividida em ~1 a cada 5 cenas, texto puro em ~1 a cada 3 destaques, uma troca de ambiente a cada ~3 min.
- Uma estrutura aprovada só é reaproveitada para o **mesmo raciocínio** (jornada → jornada); raciocínio diferente pede forma diferente (comparação de ofertas ≠ jornada de compra).

**Repertório por família** (escolher de famílias diferentes):
- *Mudar o ambiente* — b-roll ou `arquivo` em tela cheia com a voz por baixo; rajada de b-roll com uma palavra gigante por plano; pessoas públicas citadas em vídeo/print real; manchetes/matérias reais em colagem; caixa de destaque sobre pessoa numa multidão.
- *A câmera vira objeto* — a câmera encolhe e vira card, miniatura, vertical de reels, player ou tela de celular dentro de um feed; câmera-círculo com frase digitada.
- *Desenhar sobre a imagem* — traço luminoso, setas, framework e palavras desenhados por cima da câmera ou de uma foto; grifo marca-texto sobre texto real; círculo e risco à mão.
- *Profundidade* — palavra ou número gigante **atrás** da cabeça; ícones de traço flutuando em volta do rosto.
- *Tempo e quantidade* — **animação desenhada**, nunca filmagem de banco: calendário de verdade (colunas por dia) comprimindo anos → meses → semanas → dias, linha do tempo com pontos, contador acelerando, rolagem infinita acelerada (excesso de informação), grade de cards iguais, pilha de objetos crescendo. "Relógio/calendário acelerado" quer dizer essa animação, não um time-lapse de relógio.
- *Sistema e equação* — equação em pílulas, equação de valor/empilhamento de oferta, núcleo + satélites, pirâmide, árvore, Venn, mapa de capítulos que volta ("você está aqui").
- *Material real em caixas* — câmera cheia (sem tela dividida); 2–4 cartões arredondados em leque acima da cabeça com foto ou vídeo real (post, story, trecho do próprio influenciador), entrando um a um na fala, e a palavra que traduz o pensamento no peito (rótulo pequeno + palavra grande na cor de destaque).
- *Objetos e cena real* — objetos do dia a dia em leque com sombra; foto real com cards por cima; produto real no notebook.
- *Interface* — telas reais e reconhecíveis (só quando a fala é sobre usar a ferramenta); nunca como padrão para ilustrar ideia abstrata.
- *Vidro e texto* — card de vidro, frase no peito, tag em pílula: usar quando nenhuma outra família representa melhor e respeitando o orçamento.

**Alternar as famílias ao longo da aula:** a sequência deve ficar dinâmica, ora tela dividida, ora material real em caixas, ora ícone ou animação; nunca a mesma família em cenas seguidas.

**Elementos sobre a câmera:** nunca encostam no rosto; menores, finos, agrupados em bloco compacto num canto ou terço livre. Bloco de informação grande (oferta, lista) fica fino, com respiro e cor para contrastar, nunca um bloco escuro chapado.

**Ritmo e lado certo:** elemento sai quando a fala dele termina (assunto encerrado não fica na tela durante a próxima ideia). Em comparação "genérico × do jeito do autor", o lado certo veste a identidade da marca do autor e o genérico fica neutro e apagado. Bloco de produto/oferta parece tela de software: item concreto vira objeto de interface (ex.: arquivo PDF com ícone), rótulos curtos.

**Formatos consagrados primeiro:** elemento tradicional de persuasão (comparação, ancoragem de preço, empilhamento de oferta, garantia, antes × depois, depoimento) usa direto o melhor formato das referências e se adapta à identidade; não reinventar a roda. A criatividade vai para o que não tem formato pronto.

**Termos próprios:** comparações usam o vocabulário da marca do autor (definido no `perfil.md`) nos rótulos e tags, em vez de rótulos genéricos.

**Sem repetição e tela de oferta limpa:** a mesma imagem não aparece duas vezes na mesma cena; vídeo curto em cartão toca uma vez e congela, sem loop. Oferta/comparação em colunas lado a lado (tabela de preço), no máximo 3 tamanhos de texto e 2 pesos, grade de 8 px, entregáveis em cor única, mockups um de cada vez.

**Câmera em card e área cheia:** a câmera em card tem o mesmo tamanho em todas as telas divididas do vídeo, e a área de motion ao lado fica preenchida. Limpar não é esvaziar: manter título com peso, ícone por item, objeto concreto.

**Padrão entre telas e plataforma real:** telas divididas do mesmo vídeo usam o mesmo fundo e a mesma geometria de câmera das já aprovadas; o grupo de motion fica centralizado na área livre. Tela de plataforma/área de membros parece produto real: vídeo real de alguém ensinando no contexto, capas com foto + título elegante, nada de blocos genéricos.

**Entrega:** respeitar a faixa dos controles do player na plataforma (`plataformas.md`); saída de tela ou frase com 0,3–0,4 s de movimento, nunca seca; som de entrada na entrada visual de fato (campo `entrada` do item).

**Som, câmera, ritmo e ênfase:** efeito sonoro só com contexto real na cena (o 10 toca só os `sons` declarados pelos itens). Câmera com enquadramento travado por plano, zoom contido (~1,14× em 720p) e escada a cada ~6 s (nenhum plano abaixo de 2,5 s fora de corte); ritmo de câmera de referência só depois de testar 1 min no bruto do autor. Na A2, procurar hesitações vocalizadas, autocorreções e trechos arrastados, e propor velocidade com amostra. Nenhum trecho de mais de ~30–40 s sem ênfase. Correção pedida pelo autor nunca se encerra sem ser feita.

**Material real é parte do desenho, não exceção:** se a cena pede imagem real e ela não está na biblioteca, a skill busca (`elementos.md` §5 para terceiros; banco de imagens para b-roll) e mostra candidatos; na falta, avisa o autor em vez de cair para ícone + texto.

**Quando usar imagem real, e qual:**
- Primeiro decidir se a cena precisa de imagem. Imagem real só quando a fala cita algo concreto e reconhecível (pessoa, marca, lugar, prova, ferramenta). Ideia abstrata (tempo passando, preço, valor, acúmulo, comparação) vira animação desenhada (famílias *Sistema e equação*, *Tempo e quantidade*, *Objetos*), não foto de banco.
- Pessoa pública: o conteúdo dela como aparece nas redes (post do feed, story, perfil), que se reconhece de relance. Nunca thumbnail do YouTube, montagem com texto ou recorte de programa.
- B-roll de banco só se for autêntico e no nível das referências do autor (luz natural, profundidade, gente real em situação real) e ligado diretamente à fala. Proibido o genérico: profissional de jaleco sorrindo para a câmera, relógio, prato de comida, aperto de mão.
- Pouca imagem e certeira vale mais que muita: 1 imagem que se entende de relance > 4 que ilustram.
- Ao desenhar, ler o `referencias/indice.md` inteiro: as pastas por tipo são só arquivo; um frame catalogado como CTA ou gancho pode resolver qualquer cena com o mesmo raciocínio.

