# Instalação (instruções para o Claude)

Este arquivo é lido pelo Claude quando a pessoa pede "Instale o editor de vídeo seguindo o INSTALAR.md deste link". Se você está lendo pelo navegador (antes de baixar), siga a partir do passo 0 e baixe no passo 1; o link direto deste arquivo é https://raw.githubusercontent.com/eupedromaciel/editor-de-video/main/INSTALAR.md. A pessoa provavelmente **não é técnica**: não sabe o que é Terminal, Homebrew, git ou Python. Fale com ela em português simples, um passo por vez, dizendo o que vai acontecer e por quê, sem jargão sem tradução. Não peça que ela digite nada além do que está descrito aqui.

## 0. Antes de baixar

1. **Está rodando no Mac da pessoa?** `uname -s` deve dar `Darwin`. Se não der, você provavelmente está num ambiente na nuvem: explique que a instalação precisa acontecer no computador dela e peça que ela abra a aba Code escolhendo rodar **no Mac (local)**, não na nuvem.
2. **Mac com chip Apple?** `uname -m` deve dar `arm64`. Se der outra coisa (Mac Intel): explique que o editor só foi testado em Mac com chip Apple e pergunte se ela quer tentar mesmo assim.
3. **Espaço:** `df -h ~`. Abaixo de 30 GB livres, avise que vai faltar espaço para os vídeos e pergunte se quer continuar.
4. **A pasta já existe?** Se já houver `editor-de-video/` na pasta atual, **não sobrescreva**: pergunte se ela quer usar a que já existe (vá para o passo 3 deste arquivo) ou instalar numa pasta nova.

## 1. Baixar

- Se `xcode-select -p` funcionar (git disponível): `git clone https://github.com/eupedromaciel/editor-de-video.git`
- Se não: baixe o ZIP, sem precisar de git:
  `curl -L -o editor-de-video.zip https://github.com/eupedromaciel/editor-de-video/archive/refs/heads/main.zip && unzip -q editor-de-video.zip && mv editor-de-video-main editor-de-video && rm editor-de-video.zip`
  (não use `git` antes do Homebrew: num Mac novo ele abre uma janela pedindo as ferramentas de desenvolvedor da Apple; o Homebrew instala essas ferramentas no passo 2.)

Entre na pasta: `cd editor-de-video`. A partir daqui, todo comando roda dentro dela.

## 2. Homebrew (a pessoa faz, com a sua ajuda)

O Homebrew é o instalador de programas do Mac pelo Terminal. Ele pede a senha do Mac, que você não pode digitar. Se `brew` já existir (`which brew` ou `/opt/homebrew/bin/brew`), pule.

Explique, nesta ordem:
1. "Vou pedir para você colar um comando no **Terminal**, o app do Mac para digitar comandos. Para abrir: aperte **Command + Espaço**, digite **Terminal** e aperte Enter."
2. "Cole este comando e aperte Enter:"
   `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
3. "Ele vai pedir a **senha do Mac** (a mesma que você usa para ligar o computador). **Enquanto você digita, nada aparece na tela**: é normal. Digite e aperte Enter. Se perguntar algo, aperte Enter de novo."
4. "Se aparecer uma janela pedindo para instalar as **ferramentas de desenvolvedor**, clique em **Instalar** e aceite."
5. "Quando terminar e aparecer 'Installation successful', me avise aqui."

Se o Terminal disser que o usuário não é administrador ("not an Administrator", "not in the sudoers file"), explique: o Homebrew só instala com um usuário administrador do Mac (comum em computador da empresa). Ela precisa entrar com um usuário administrador ou pedir a quem cuida do computador.

Depois que ela avisar: confira `/opt/homebrew/bin/brew --version`. Deixe o Homebrew disponível para os próximos comandos e para o futuro:
`grep -q 'brew shellenv' ~/.zprofile 2>/dev/null || echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile`
e comece cada comando seguinte com `eval "$(/opt/homebrew/bin/brew shellenv)" && ` (o app do Claude só enxerga o Homebrew sozinho depois de ser reaberto).

## 3. Programas e bibliotecas (você faz sozinho)

Diga em uma linha o que vai instalar e para quê (detalhes em `guia/02-primeiro-uso.md`, quadro "O que foi instalado"). Depois rode:

1. `brew install ffmpeg node yt-dlp python@3.14`
2. `"$(brew --prefix)/bin/python3.14" -m venv .venv && .venv/bin/pip install -r codigos/requirements.txt`
3. `cd remotion && npm install && npx remotion browser ensure && cd ..`
4. `mkdir -p ~/.cache/opencv && curl -L -o ~/.cache/opencv/face_detection_yunet_2023mar.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx`
5. `.venv/bin/python codigos/verificar_ambiente.py` → resolva cada `FALTA` pelo comando que ele mostra. Linhas marcadas `depois` não são erro (o modelo de transcrição, por exemplo, é baixado sozinho no primeiro vídeo).
6. `.venv/bin/python codigos/verificar_ambiente.py --teste`

Se algum comando falhar, leia o erro, tente resolver e, se não conseguir, explique à pessoa em português simples o que aconteceu e consulte `guia/09-problemas.md`.

## 4. Fim

Diga à pessoa, exatamente:

> Pronto, o editor está instalado na pasta **editor-de-video** dentro de **<pasta atual>**.
>
> Agora:
> 1. **Feche o app do Claude** (Command + Q) e abra de novo. Isso faz ele enxergar os programas que acabamos de instalar.
> 2. Na aba **Code**, abra uma conversa nova e escolha a pasta **editor-de-video** (os comandos do editor só aparecem com essa pasta aberta).
> 3. Digite **/video-setup** e envie. Ele vai te entrevistar sobre a sua marca e o seu jeito de gravar.
>
> Enquanto isso, vale ler o guia "Como funciona": `guia/01-como-funciona.md`.
