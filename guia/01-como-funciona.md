# 1. Como funciona

[← Voltar ao início](../README.md) · Próximo: [Primeiro uso →](02-primeiro-uso.md)

Este capítulo explica o caminho de um vídeo e o raciocínio por trás dele. Entender isso faz você pedir melhor e aprovar mais rápido.

## A ideia em uma frase

Você trata o Claude como um editor humano: explica o que quer, ele faz, você aprova ou pede ajuste, e ele anota o que aprendeu sobre o seu gosto para o próximo vídeo.

## O caminho de um vídeo

```
 UMA VEZ           A CADA VÍDEO
 ─────────         ──────────────────────────────────────────────────────────────
 /video-setup  →   /video-roteiro  →  você grava  →  /video-editar
 (sua marca,       roteiro + plano                    1-2. preparar e transcrever
  referências,     de cenas                           3. cortes            → você aprova (A2)
  materiais)       → você aprova (A1)                 4. mapa das animações→ você aprova (A3)
                                                      5. busca de material
                                                      6. animações         → você aprova (A4)
                                                      7. câmera
                                                      8. sons
                                                      9. vídeo final       → você aprova (A5)
```

As letras **A1 a A5** são as aprovações: os momentos em que o Claude para e mostra o resultado para você decidir. Nada passa para a etapa seguinte sem a sua aprovação.

## Por que ele trabalha assim

**1. Primeiro a direção, depois as regras.**
Antes de editar, o Claude escreve a "direção" do vídeo: que tipo de vídeo é, o que ele precisa causar em quem assiste, qual a mensagem principal e qual o ritmo. Todas as escolhas (cortar mais ou menos, que animação usar, se põe som ou não) respondem a essa direção. O padrão da sua marca é o ponto de partida, mas cada vídeo pode pedir algo diferente. Uma aula precisa de respiro para entender; um reels de história precisa de imagem nova a cada poucos segundos.

**2. Uma etapa por assunto, com aprovação no meio.**
Primeiro os cortes, depois as animações, depois a câmera, depois o som. Se o corte muda depois que as animações estão prontas, todas as animações saem do lugar. Por isso cada etapa só começa com a anterior aprovada.

**3. Decide no texto e monta sempre a partir do original.**
O Claude não monta vídeo em cima de vídeo. Ele anota as decisões (o que cortar, onde entra cada animação, quando a câmera aproxima) num arquivo e monta a partir do seu bruto original. Quando um corte muda, o vídeo cortado é montado de novo do original, e as animações, a câmera e o som entram por cima só na montagem final. Isso evita perda de qualidade e economiza tempo e espaço no Mac.

**4. As animações se prendem às palavras, não aos segundos.**
Quando você diz "três anos", a animação do número entra exatamente nessa palavra. Se um corte muda, ela continua presa à palavra certa.

**5. Você revisa só o que importa.**
Você não precisa assistir ao vídeo inteiro a cada etapa. O Claude mostra só os pontos de risco: os cortes em que ficou em dúvida, uma tabela das animações, quadros do vídeo, uma amostra curta. O vídeo inteiro você assiste no fim.

**6. Ele aprende com cada correção.**
Todo ajuste que você pede fica anotado no arquivo do vídeo. Ao fim de cada aprovação, o Claude decide onde aquilo vale: só para este vídeo, para o seu gosto em geral, ou é uma palavra que a transcrição errou. O que vale sempre vai para a pasta `setup/`, e o próximo vídeo já sai com isso.

## O que fica em cada pasta

Você não precisa mexer nessas pastas. O Claude organiza tudo. Mas é bom saber onde as coisas estão:

| Pasta | O que tem |
|---|---|
| `setup/` | Tudo sobre você: perfil, estilo, palavras que a transcrição erra, referências de que você gosta, sua biblioteca (logo, fotos, provas, imagens de apoio) |
| `setup/fontes/entrada/` | Onde você solta transcrições de reuniões, vídeos seus e textos, do jeito que estiverem |
| `setup/referencias/entrada/` | Onde você solta vídeos de outras pessoas que servem de inspiração |
| `videos/01-nome-do-video/` | Um vídeo: o arquivo `video.md` (roteiro, decisões, correções), o bruto, as decisões da edição e o vídeo final |
| `videos/.../final/` | **O vídeo pronto**, um arquivo por rede |
| `guia/` | Este guia |
| `codigos/` e `remotion/` | A parte técnica (os programas que cortam, tratam e montam o vídeo). Você não precisa abrir |

## Como chegar às pastas

Pelo **Finder** (o ícone de rosto azul e branco no Dock): na barra lateral, clique em **Documentos** → **editor-de-video** e vá abrindo as pastas. Por exemplo, para soltar transcrições: Documentos → editor-de-video → setup → fontes → entrada. Arraste os arquivos para dentro.

Mais fácil ainda: peça ao Claude "abre a pasta de entrada das fontes" ou "abre a pasta do vídeo final". Ele abre a janela do Finder no lugar certo.

## O arquivo mais importante: `video.md`

Cada vídeo tem um `video.md`. É a ficha do vídeo, escrita em texto simples: o briefing, a pesquisa, a direção, o roteiro, o plano de cenas, o checklist de gravação, as correções que você pediu e as aprovações com data. É por ele que o Claude sabe em que etapa o vídeo parou quando você volta outro dia.

## O que é uma "skill"

Os três comandos que começam com barra (`/video-setup`, `/video-roteiro`, `/video-editar`) são **skills**: roteiros de trabalho que ensinam o Claude a fazer uma tarefa do jeito certo. Você digita o comando e ele segue o roteiro, perguntando o que precisa. O capítulo [3. Os três comandos](03-skills.md) explica cada um.
