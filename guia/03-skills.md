# 3. Os três comandos

[← Primeiro uso](02-primeiro-uso.md) · Próximo: [Gravar bem →](04-gravar-bem.md)

O editor tem três comandos (chamados **skills**). Você digita o comando na conversa, com a pasta `editor-de-video` aberta, e o Claude segue o roteiro daquela tarefa. Também dá para pedir em palavras normais ("quero gravar um vídeo sobre X", "gravei, edita"); ele entende e chama o comando certo.

---

## `/video-setup` — configurar o editor para você

**Quando usar:** na primeira vez, e sempre que quiser acrescentar algo (uma referência nova, fotos, uma logo, transcrições) ou saber o que falta para os vídeos melhorarem.

**O que ele faz:**
1. Confere se o Mac tem tudo instalado.
2. Mostra o **diagnóstico**: uma tabela do que falta, do que mais melhora o vídeo para o que menos melhora.
3. Faz a **entrevista**, em blocos curtos: quem é você, seu negócio, para que servem os vídeos, público, tom de voz, gostos visuais, formatos e redes, como você roteiriza, legenda e trilha, como você grava.
4. Recebe **materiais e referências**.
5. Faz uma **calibração** com um vídeo-piloto (acertar a cor e a gravação com um vídeo real seu).

**O que mais faz diferença, nesta ordem:**
1. **Identidade visual da marca** (cores, fontes, logo em boa qualidade, exemplos de posts ou slides). Sem isso, tudo o que aparece escrito na tela sai com cara de modelo pronto.
2. **Referências explicadas.** Vídeos de outras pessoas de que você gosta, **cada um com o que você gosta nele** ("gosto de como o texto entra", "gosto do ritmo dos primeiros segundos"). Sem a explicação, o Claude adivinha o que copiar.
3. **Suas fontes.** Transcrições de reuniões (de venda e de entrega), vídeos seus, textos seus. É o que faz o roteiro soar como você, com os seus exemplos e as dúvidas reais do seu público.

**Como entregar material:** você não precisa organizar nada.
- Transcrições, textos e vídeos seus: solte em `setup/fontes/entrada/`.
- Vídeos de referência: mande o link na conversa e diga o que gosta nele.
- Fotos, logos, provas (prints de depoimentos, resultados): mande na conversa ou indique a pasta onde estão. Se você usa o app **Fotos** do Mac, o Claude pode montar um álbum com uma pré-seleção para você aprovar (na primeira vez ele instala um programa a mais e o Mac pede permissões; ver [8. Ferramentas](08-ferramentas.md#opcional-melhora-mas-não-é-obrigatório)).

**O que ele grava:** os arquivos de `setup/` (perfil, estilo, vocabulário, referências, fontes, biblioteca). Você não precisa abrir nenhum.

---

## `/video-roteiro` — do "quero gravar" ao roteiro aprovado

**Quando usar:** antes de gravar.

**O que ele pergunta (briefing):** objetivo do vídeo, público, formato e rede, a ideia central, uma referência (se tiver), a chamada final (o que a pessoa deve fazer depois de assistir), o que não pode faltar e o que evitar. O que o seu perfil já responde vem preenchido para você só confirmar.

**O que ele entrega**, num arquivo `videos/<número-nome>/video.md`:
- **Pesquisa:** nas suas fontes (o que você já falou sobre o tema, objeções reais dos seus clientes) e na internet, quando o tema pede dado atual.
- **Direção:** tipo de vídeo, o que precisa causar, mensagem em uma frase, ritmo.
- **Roteiro**, em um de dois modos:
  - **Tópicos:** tese, tópicos em ordem, argumento de cada um, frases que não podem faltar e o gancho dos primeiros segundos. Para quem fala bem de improviso.
  - **Integral:** o texto completo para ler, no seu tom.
- **Plano de cenas:** onde entra cada animação, tela, foto ou imagem de apoio, e por quê.
- **Variações** (se for anúncio): ganchos diferentes (dor, número, polêmica, prova, pergunta) e chamadas finais diferentes.
- **Checklist de gravação:** câmera, luz, som e o que gravar além da fala.

**Aprovação A1:** você lê, pede ajustes e aprova. Aí é só gravar.

---

## `/video-editar` — do bruto ao vídeo pronto

**Quando usar:** depois de gravar. Arraste o arquivo do vídeo para a conversa (ou diga em que pasta ele está, por exemplo "está em Downloads, chama aula3.mov") e o Claude cuida do resto.

**As etapas:**

| # | Etapa | O que acontece | Você aprova? |
|---|---|---|---|
| 1 | Preparar | Cria a pasta do vídeo e confere o bruto (resolução, som, duração) | — |
| 2 | Transcrever, áudio e imagem | Transforma a fala em texto, limpa o áudio, mede a cor | — |
| 3 | Cortes | Tira erros, repetições e pausas; confere cada emenda | **A2** |
| 4 | Mapa das animações | Decide onde entra cada animação, palavra em destaque e imagem, presa à palavra falada | **A3** |
| 5 | Material | Busca as imagens, prints e vídeos de que o mapa precisa | junto da A3 |
| 6 | Animações | Monta as animações e mostra quadros e uma amostra | **A4** |
| 7 | Câmera | Aproxima e afasta no seu rosto nos momentos de ênfase | junto da A5 |
| 8 | Sons | Efeitos sonoros nos momentos em que fazem sentido | junto da A5 |
| 9 | Entrega | Monta o vídeo final por rede | **A5** |

O vídeo pronto sai em `videos/<número-nome>/final/`.

**Retomar outro dia:** digite `/video-editar` e diga qual vídeo (ou deixe ele perguntar). Ele lê o `video.md`, vê em que etapa parou e continua dali. Ao fim de cada aprovação, ele sugere **limpar a conversa** (`/clear`) e chamar `/video-editar` de novo. Isso deixa o Claude mais rápido e mais preciso, e nada se perde, porque tudo está no `video.md`.

**Outros usos do `/video-editar`:**
- **Vídeo sem roteiro:** você gravou sem passar pelo `/video-roteiro`, ou já tem um vídeo pronto. Ele monta o roteiro a partir da transcrição e segue.
- **Variações para anúncio:** a mesma base com ganchos e chamadas diferentes, uma saída por variação.
- **Cortes curtos de um vídeo longo:** ele lista os melhores trechos (uma ideia completa, com gancho natural), você escolhe e cada um vira um vertical com legenda e chamada. O corte vertical reaproveita a imagem do vídeo horizontal; para ela não ficar com pouca definição, grave o vídeo longo **na horizontal, em 4K** (a resolução mais alta das câmeras e celulares atuais).
- **Lote:** vários vídeos de uma vez. A análise corre em paralelo e a montagem em fila.

Os pedidos prontos para cada caso estão em [6. Pedidos prontos](06-pedidos-prontos.md).
