# 2. Primeiro uso

[← Como funciona](01-como-funciona.md) · Próximo: [Os três comandos →](03-skills.md)

Do zero ao primeiro `/video-setup`. Você não precisa saber programar. O Claude faz quase tudo; você só instala o app dele, cola um pedido e digita a senha do Mac uma vez.

## Antes de começar

- **Mac com chip Apple.** Menu  (a maçã no canto superior esquerdo) → *Sobre este Mac* → a linha "Chip" deve dizer Apple M1, M2, M3, M4 ou mais novo.
- **30 GB livres.** Menu  → *Configurações do Sistema* → *Geral* → *Armazenamento*.
- **Assinatura do Claude** (Pro ou Max) em [claude.ai](https://claude.ai).
- **A senha do Mac** à mão (a que você usa para ligar o computador).

## Passo 1. Instalar o app do Claude

1. Acesse [claude.com/download](https://claude.com/download) e baixe a versão para Mac.
2. Abra o arquivo baixado e arraste o ícone do Claude para a pasta **Aplicativos**.
3. Abra o Claude (em Aplicativos, ou aperte **Command + Espaço**, digite "Claude" e Enter) e entre com a sua conta.

## Passo 2. Abrir a aba Code

No topo do app há abas. Clique em **Code**. É o modo em que o Claude consegue trabalhar com arquivos e programas do seu Mac, não só conversar.

Se ele perguntar onde rodar, escolha **no seu Mac (local)**, não na nuvem: o editor precisa ficar no seu computador.

Ele vai pedir para você **escolher uma pasta**. Escolha **Documentos**. É ali que o editor vai ficar.

> Pode aparecer um aviso pedindo permissão para o Claude acessar a pasta. Clique em **Permitir**.

## Passo 3. Colar o pedido de instalação

Copie o texto abaixo, cole na conversa e envie:

```
Instale o editor de vídeo seguindo o INSTALAR.md deste link: https://github.com/novosdonos/editor-de-video
```

O Claude vai:
1. conferir se o seu Mac serve e se tem espaço;
2. baixar o editor para a pasta `Documentos/editor-de-video`;
3. pedir sua ajuda para instalar o **Homebrew** (explicado abaixo);
4. instalar sozinho o resto e fazer um teste.

Durante a instalação, o Claude pode pedir **permissão para rodar comandos** (aparece um botão "Permitir" ou "Allow"). Pode permitir: são os comandos de instalação. Se quiser, marque a opção de permitir sempre nesta pasta.

### A parte que é com você: o Homebrew

O **Homebrew** é o instalador de programas do Mac. O editor usa ele para instalar os programas que cortam e montam o vídeo. Ele precisa da sua senha, e o Claude não pode digitar senha por você. Então ele vai pedir:

1. **Abra o Terminal.** O Terminal é um app do Mac onde se digitam comandos. Aperte **Command + Espaço**, digite **Terminal** e aperte Enter. Abre uma janela com texto.
2. **Cole o comando** que o Claude mostrar (Command + V) e aperte **Enter**.
3. **Digite a senha do Mac** quando pedir. **Enquanto você digita, nada aparece na tela, nem bolinhas.** É normal. Digite com calma e aperte Enter.
4. Se ele perguntar algo ("Press RETURN to continue"), aperte **Enter**.
5. Se aparecer uma janela pedindo para instalar as **ferramentas de desenvolvedor** da Apple, clique em **Instalar** e aceite os termos.
6. Quando aparecer **"Installation successful"**, volte ao Claude e escreva: **"terminei"**.

Pronto. Daqui em diante o Claude segue sozinho.

> **"Not an Administrator"?** O Homebrew só instala com um usuário **administrador** do Mac. Em computador de empresa, às vezes o seu usuário não é. Entre com um usuário administrador ou peça a quem cuida do computador.

## Passo 4. Abrir a pasta do editor e começar

Quando o Claude disser que terminou:

1. **Feche o app do Claude** (Command + Q) e abra de novo. Assim ele enxerga os programas recém-instalados.
2. Na aba **Code**, comece uma conversa nova e escolha a pasta **Documentos → editor-de-video**.
3. Digite **`/video-setup`** e envie.

> **Por que abrir a pasta?** Os comandos `/video-...` são do editor. O Claude só os enxerga quando a pasta `editor-de-video` está aberta. Se você digitar `/video-setup` e nada aparecer, quase sempre é porque a pasta aberta é outra.

O `/video-setup` vai te entrevistar sobre a sua marca, o seu público, o seu jeito de falar e de gravar, e pedir materiais (logo, fotos, vídeos de que você gosta). Não precisa fazer tudo de uma vez: ele sempre mostra o que falta e você continua outro dia.

## O que foi instalado no seu Mac

Tudo isso é gratuito e fica no seu computador. Os arquivos de vídeo são cortados, tratados e montados no seu Mac e não são enviados para nenhum serviço. O que vai para o Claude (que roda na internet, na Anthropic) é o que ele precisa ler para decidir: a transcrição da fala, alguns quadros do vídeo e as suas mensagens, como em qualquer conversa com ele.

| Programa | O que é | Para que o editor usa |
|---|---|---|
| **Homebrew** | Instalador de programas pelo Terminal | Instalar e atualizar os programas abaixo |
| **Ferramentas de desenvolvedor da Apple** | Pacote básico da Apple para programas técnicos | Exigido pelo Homebrew |
| **ffmpeg** | O "motor" de vídeo e áudio mais usado do mundo | Cortar, juntar, tratar áudio e cor, exportar o vídeo |
| **Python** (3.14) | Linguagem de programação | Roda os programas do editor (transcrever, cortar, tratar) |
| **Node.js** | Outra linguagem de programação | Roda o Remotion |
| **Remotion** | Programa que monta vídeo a partir de código | Desenha as animações, a legenda e junta tudo no vídeo final |
| **Navegador do Remotion** | Um Chrome invisível, só para o Remotion | O Remotion "fotografa" cada quadro da animação com ele |
| **yt-dlp** | Baixador de vídeos | Baixar vídeos de referência e material que você indicar (YouTube, Instagram) |
| **Modelo de transcrição** (Parakeet, ~600 MB) | Uma IA que transforma fala em texto, no seu Mac | Transcrever o bruto palavra por palavra. É baixado no primeiro vídeo |
| **Modelo de rosto** (YuNet) | Uma IA pequena que acha rostos na imagem | Enquadrar a câmera no seu rosto |
| **Bibliotecas Python** (OpenCV, librosa, rembg e outras) | Peças de apoio | Imagem, som, recorte de fundo |

As bibliotecas do projeto ficam dentro da própria pasta `editor-de-video`, em duas pastas técnicas (`.venv` para o Python e `remotion/node_modules` para o Remotion). Não mexa nelas. O resto fica nas pastas normais de programas do Mac.

Alguns programas só são instalados quando você usa o recurso pela primeira vez. Por exemplo, o **osxphotos** (que lê o app Fotos) e o **imagehash** (que acha fotos repetidas) entram quando você pede para puxar fotos do app Fotos.

## Como desinstalar

- **O editor:** apague a pasta `Documentos/editor-de-video`. Antes, guarde os seus vídeos prontos (`videos/.../final/`).
- **Os programas:** podem ficar; não atrapalham. Se quiser remover, peça ao Claude: "desinstale o ffmpeg, node, yt-dlp e python@3.14 do Homebrew".
- **Os modelos de IA** (cerca de 600 MB): ficam numa pasta escondida do seu usuário. Peça ao Claude: "apague os modelos do editor em ~/.cache (onnx-asr e opencv)".

## Versão nova do editor

Não há atualização automática. Quando sair uma versão nova, use o pedido pronto "Atualizar para uma versão nova" em [6. Pedidos prontos](06-pedidos-prontos.md): o Claude baixa a nova e traz a sua configuração (`setup/`) e os seus vídeos (`videos/`) da cópia antiga.
