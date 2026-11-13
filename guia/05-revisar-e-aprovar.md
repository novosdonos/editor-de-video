# 5. Revisar e aprovar

[← Gravar bem](04-gravar-bem.md) · Próximo: [Pedidos prontos →](06-pedidos-prontos.md)

É na pós-produção que o vídeo fica com a sua cara. Cada aprovação é uma chance de corrigir cedo, quando ainda é barato. Este capítulo diz o que olhar em cada uma e como pedir ajustes que o Claude entende de primeira.

## A regra mais importante

**Aprove só o que você viu funcionando no vídeo, não na descrição.** Um texto como "a palavra entra no peito, com movimento" pode parecer ótimo e ficar ruim no vídeo, atravessando o rosto ou rápido demais. Sempre que houver uma amostra em vídeo, assista à amostra antes de aprovar.

As prévias ficam na pasta `previas`, dentro da pasta do vídeo. O Claude diz o nome de cada arquivo e o que olhar nele. Para abrir, peça: **"abre a prévia"**. Ele abre o vídeo ou a imagem no seu Mac. Ou, pelo Finder: Documentos → editor-de-video → videos → pasta do vídeo → previas, e clique duas vezes no arquivo.

## O que olhar em cada aprovação

### A1 — Roteiro e plano de cenas (`/video-roteiro`)

- **A mensagem em uma frase** está certa? Se ela estiver errada, todo o resto também vai estar.
- O **gancho** dos primeiros segundos prende? Você diria isso desse jeito?
- O roteiro soa como **você**? Tem algum termo que você nunca usaria?
- O plano de cenas pede algum **material** que você não tem? Diga agora.

### A2 — Cortes (`/video-editar`)

Prévias: `revisao-cortes` (os cortes de conteúdo que ele propõe e as emendas em que ficou em dúvida, numerados) e, quando o ritmo muda, `amostra-cortes.mp4` (um trecho do vídeo cortado). Você pode responder pelo número: "7: volta a frase", "o resto ok".

- **Ritmo:** está lento? Sobrou hesitação ("éé", "então assim"), autocorreção ("três... quer dizer, quatro")? Está corrido demais, sem respiro?
- **Emendas:** alguma palavra foi cortada pela metade? Alguma frase ficou repetida?
- **Conteúdo:** saiu algo que deveria ficar? Ficou algo que deveria sair?

Esta é a hora de acertar o ritmo. Mudar corte depois das animações desloca tudo.

### A3 — Mapa das animações (`/video-editar`)

Prévias: uma tabela com cada animação (em que palavra entra, o que mostra e por quê) e, se houver busca de material, a folha `material.jpg` com as imagens candidatas.

- Cada animação **ajuda a entender** ou só enfeita? Corte as que só enfeitam.
- Há **variedade**? O mesmo tipo de quadro repetido o vídeo todo cansa.
- O texto na tela é **curto** (de 2 a 5 palavras)? Texto longo na tela compete com a sua fala.
- As **imagens** são reais e reconhecíveis (o perfil de verdade de quem você citou, o print do seu sistema)? Imagem genérica de banco de imagens derruba a qualidade.
- Tem **trecho longo sem nada** acontecendo na tela? Em aula, mais de meio minuto parado costuma cansar.

### A4 — Animações (`/video-editar`)

Prévias: `storyboard` (quadros de cada cena) e `amostra-motion.mp4`.

- **Assista à amostra.** Os quadros mostram a posição; a amostra mostra o tempo.
- O texto **entra na palavra certa** e sai antes de ficar parado?
- Alguma animação **cobre o seu rosto**?
- A **cor e a fonte** são as da sua marca?

### A5 — Vídeo final (`/video-editar`)

Prévias: `amostra-final.mp4` (trechos com câmera e som) e, depois, o vídeo em `final/`.

- **Assista no celular**, como o seu público vai assistir. Confira se a legenda e os textos ficam fora da área coberta pelos botões do app.
- **Câmera:** as aproximações acontecem nos momentos de ênfase? Está tremido ou aproximando demais?
- **Sons:** cada efeito tem motivo (uma notificação, um clique)? Som em toda entrada de animação vira ruído.
- **Volume:** a voz está clara e no mesmo volume do começo ao fim?

## Como pedir ajustes

Um bom pedido tem **onde**, **o que está errado** e **o que você quer**.

| Pedido vago | Pedido que funciona |
|---|---|
| "O começo está ruim" | "No começo, entre 'você já parou' e 'três anos', está lento. Corta a pausa e o 'então assim'." |
| "Não gostei da animação" | "Na animação do 'R$ 30 mil', o número aparece depois de eu falar. Quero que entre junto com a palavra 'trinta'." |
| "Muda a cor" | "O texto amarelo some no fundo claro. Usa a cor escura da marca nessa cena." |
| "Tira o som" | "Os sons de entrada das animações estão demais. Deixa só o da notificação no minuto 2." |

Dicas:
- **Cite a palavra falada** perto do ponto ("quando eu falo 'faturamento'"). É mais preciso que o minuto, porque o minuto muda quando o corte muda.
- **Um assunto por vez.** Junte todos os ajustes de cortes numa mensagem e os de animação em outra.
- **Mande print** quando for visual: arraste a imagem para a conversa.
- **Diga se vale para sempre.** "Nunca use essa fonte", "sempre corte mais as pausas": o Claude grava no seu estilo e não pergunta de novo.

## Como ele aprende

1. Todo ajuste que você pede vira uma linha em **"Correções"**, no `video.md` do vídeo.
2. Ao fim de cada aprovação, o Claude classifica cada correção:
   - **só deste vídeo:** fica no `video.md`;
   - **seu gosto:** vai para `setup/estilo.md` e vale para os próximos vídeos;
   - **palavra que a transcrição errou** (seu nome, sua empresa, um termo do seu mercado): vai para `setup/vocabulario.md`;
   - **erro técnico:** vira correção no próprio editor.
3. Quando não estiver claro se vale para todos os vídeos, ele pergunta **uma vez**, junto com a aprovação.

Um pedido aberto nunca fica para trás: antes de cada aprovação, o Claude lista o que você pediu e ainda não foi feito.

## Limpar a conversa entre etapas

Ao fim de cada aprovação, o Claude sugere digitar `/clear` (limpa a conversa) e chamar `/video-editar` de novo. Faça isso. Conversa muito longa faz o Claude esquecer detalhes e regras do começo. Nada se perde, porque tudo o que importa está no `video.md` e em `setup/`.
