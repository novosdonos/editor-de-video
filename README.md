# Editor de vídeo

<!-- Para o Claude: se a pessoa pediu para instalar, siga INSTALAR.md (https://github.com/eupedromaciel/editor-de-video/blob/main/INSTALAR.md). -->

Você grava. O Claude edita.

Este editor transforma o vídeo bruto que você gravou em vídeo pronto: corta erros e pausas, limpa o áudio, acerta a cor, coloca animações e legenda no padrão da sua marca e entrega no formato de cada rede (aula, YouTube, Reels, anúncio).

Tudo roda no seu computador, comandado pelo **Claude** (o assistente de IA da Anthropic). Você conversa, aprova e pede ajustes, como faria com um editor humano. Cada correção que você pede fica guardada, e o próximo vídeo já sai mais perto do seu jeito.

Criado por **Pedro Maciel · Novos Donos**.

---

## O que você precisa

- **Um Mac com chip Apple** (M1, M2, M3, M4 ou mais novo). Para conferir: menu  → *Sobre este Mac* → linha "Chip". Mac com processador Intel e Windows ainda não foram testados.
- **30 GB livres no disco.** Para conferir: menu  → *Configurações do Sistema* → *Geral* → *Armazenamento*.
- **Uma assinatura do Claude.** O plano **Pro** basta. O **Max** é melhor: dá para editar mais vídeos seguidos sem pausa por limite de uso.

Não precisa saber programar, nem ter conta no GitHub (o site onde este editor está guardado).

## Instalar em 4 passos

1. **Instale o app do Claude** em [claude.com/download](https://claude.com/download), abra e entre com a sua conta.
2. **Abra a aba Code** no topo do app, escolha rodar **no seu Mac** (não na nuvem) e escolha a pasta **Documentos**.
3. **Copie e cole este pedido** na conversa e envie:

   ```
   Instale o editor de vídeo seguindo o INSTALAR.md deste link: https://github.com/eupedromaciel/editor-de-video
   ```

   O Claude baixa o editor, confere o seu Mac e instala o que falta. Em um momento ele vai pedir para você colar **um comando no Terminal** (o app do Mac para digitar comandos) e digitar a **senha do Mac**. Ele explica cada passo.
4. **Feche e abra de novo o app do Claude**, abra a pasta `editor-de-video` (aba Code → escolher pasta → Documentos → `editor-de-video`) e digite **`/video-setup`**. Ele vai te entrevistar sobre a sua marca e o seu jeito de gravar.

O passo a passo detalhado, com o que aparece na tela, está em [guia/02-primeiro-uso.md](guia/02-primeiro-uso.md).

## Como usar no dia a dia

Com a pasta `editor-de-video` aberta no Claude, digite:

| Quando | Digite | O que acontece |
|---|---|---|
| Vai gravar um vídeo | `/video-roteiro` | Monta o roteiro, o plano das cenas e o checklist de gravação |
| Gravou | `/video-editar` | Edita do bruto ao vídeo final, parando para você aprovar em cada etapa |
| Quer acrescentar referências, fotos, logos ou transcrições | `/video-setup` | Guarda tudo no lugar certo e diz o que mais falta |
| Quer saber o que falta para os vídeos ficarem melhores | `/video-setup` | Mostra o que falta, do mais importante para o menos |

Cada vídeo ganha uma pasta própria dentro de `editor-de-video/videos/` (por exemplo, `videos/01-como-precificar/`), e o vídeo pronto sai na pasta `final/` dentro dela.

## Guia

Leia na ordem na primeira vez. Depois, volte ao capítulo de que precisar.

1. [Como funciona](guia/01-como-funciona.md): o caminho de um vídeo e por que o editor trabalha assim.
2. [Primeiro uso](guia/02-primeiro-uso.md): instalação passo a passo e o que foi instalado no seu Mac.
3. [Os três comandos](guia/03-skills.md): o que cada um faz, o que pede e o que entrega.
4. [Gravar bem](guia/04-gravar-bem.md): roteiro, câmera, luz, som e checklist antes de gravar.
5. [Revisar e aprovar](guia/05-revisar-e-aprovar.md): o que olhar em cada aprovação e como pedir ajustes.
6. [Pedidos prontos](guia/06-pedidos-prontos.md): textos para copiar e colar em cada situação.
7. [Dicas](guia/07-dicas.md): o que aprendemos editando vídeos de verdade.
8. [Ferramentas](guia/08-ferramentas.md): o que é obrigatório, o que foi instalado e o que é opcional.
9. [Problemas comuns](guia/09-problemas.md): o que fazer quando algo dá errado.

## O que ainda não faz

O editor está em evolução. Hoje ele ainda **não**:

- exporta sozinho o mesmo vídeo em vertical e horizontal de uma vez (é preciso pedir cada formato);
- escolhe e mixa trilha sonora sozinho, no ritmo da música (os efeitos sonoros já funcionam; trilha de fundo é feita sob pedido, com ajuste na conversa);
- grava sozinho telas de sistemas que pedem login (você grava ou manda prints; páginas abertas o Claude consegue capturar com a extensão do Chrome);
- publica nas redes nem cria thumbnail.

## Licenças

- **Este editor:** pode ser usado por você e para os seus clientes. Não pode ser repassado nem revendido. Detalhes em [LICENSE](LICENSE).
- **Remotion** (o programa que monta as animações): gratuito para pessoa física e empresas de até 3 pessoas. Empresas maiores precisam de licença própria em [remotion.dev/license](https://www.remotion.dev/license).
- **Efeitos sonoros** (`setup/biblioteca/audio/`): licença CC0 (domínio público), uso livre, inclusive comercial.
- **Bandeiras e logos** (`setup/biblioteca/interfaces/`): ver `ORIGEM.md` na pasta.

## Ajuda

Travou e o Claude não resolveu? Veja [Problemas comuns](guia/09-problemas.md). Se não resolver, fale com o Pedro no Instagram: [@eupedromaciel](https://instagram.com/eupedromaciel).
