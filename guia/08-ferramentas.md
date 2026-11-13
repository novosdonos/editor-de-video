# 8. Ferramentas

[← Dicas](07-dicas.md) · Próximo: [Problemas comuns →](09-problemas.md)

O que o editor usa, o que você precisa ter, o que é instalado sozinho e o que é opcional.

## Obrigatório (você providencia)

| O quê | Para quê | Custo |
|---|---|---|
| **Mac com chip Apple** (M1 ou mais novo) | Onde o vídeo é cortado, tratado e montado. Os arquivos de vídeo não são enviados para nenhum serviço | — |
| **App do Claude**, aba Code | O editor é comandado por ele | Gratuito para baixar |
| **Assinatura do Claude** | Pro basta; Max permite editar mais seguido, sem pausa por limite de uso | Plano Pro ou Max |
| **30 GB livres** | Programas, modelos de IA e os arquivos de cada vídeo | — |

## Instalado sozinho (o Claude cuida)

Tudo gratuito. A lista completa, com o que cada um faz, está em [2. Primeiro uso](02-primeiro-uso.md#o-que-foi-instalado-no-seu-mac). Em resumo:

- **Homebrew:** instalador de programas (o único passo em que você digita a senha).
- **ffmpeg:** corta, junta, trata áudio e cor, exporta.
- **Python e Node.js:** as linguagens em que os programas do editor são escritos.
- **Remotion:** monta animações, legenda e o vídeo final.
- **yt-dlp:** baixa vídeos de referência e material de redes.
- **Modelos de IA locais:** transcrição (Parakeet) e detecção de rosto (YuNet). Rodam no seu Mac, sem enviar o áudio nem a imagem para a internet.

> **Privacidade:** o Claude roda na internet (na Anthropic). Para decidir os cortes e as animações, ele lê a transcrição da sua fala, alguns quadros do vídeo e as suas mensagens, como em qualquer conversa com ele. Os arquivos de vídeo em si ficam no seu Mac.

## Opcional (melhora, mas não é obrigatório)

| O quê | O que destrava | Como ligar |
|---|---|---|
| **Extensão Claude in Chrome** | O Claude usa o seu Chrome, já logado nas suas contas, para baixar material de redes, capturar telas de sites e acessar o que precisa de login | Peça ao Claude: "me ajuda a instalar a extensão Claude in Chrome". Ele indica a página da extensão na Chrome Web Store; clique em **Usar no Chrome**, entre com a mesma conta do Claude e permita os sites que ele pedir |
| **App Fotos do Mac** | O Claude monta um álbum com uma pré-seleção das suas fotos profissionais para você aprovar e leva as escolhidas para a biblioteca | Na primeira vez, o Claude instala o programa que lê o Fotos (osxphotos) e o Mac pede duas permissões: *Configurações do Sistema → Privacidade e Segurança → Acesso Total ao Disco* → ligar para o app do Claude; e, quando aparecer o aviso "Claude quer controlar Fotos", clicar em **Permitir** (permissão de Automação) |
| **Google Drive** (ou outra pasta na nuvem) | Puxar transcrições, fotos e provas direto de onde já estão | Se o Drive estiver sincronizado no Mac, basta dizer a pasta. Ou conecte o Google Drive no app do Claude (Configurações → Conectores) |
| **Teleprompter** (app no celular ou tablet) | Gravar no modo de roteiro integral | Qualquer app de teleprompter |
| **Microfone de lapela** | Som limpo, sem eco | Ver [4. Gravar bem](04-gravar-bem.md#som) |

O editor **nunca** precisa de chave de API (senha de acesso a um serviço pago) nem de cadastro em serviço pago para funcionar. Se o Claude sugerir algo assim, peça a alternativa gratuita.

## Licenças

- **Este editor:** uso seu e para os seus clientes; não pode ser repassado nem revendido ([LICENSE](../LICENSE)).
- **Remotion:** gratuito para pessoa física e empresas de até 3 pessoas. Acima disso, licença própria em [remotion.dev/license](https://www.remotion.dev/license).
- **Efeitos sonoros incluídos:** CC0 (uso livre, inclusive comercial).
- **Logos e bandeiras incluídos:** ver `setup/biblioteca/interfaces/ORIGEM.md`.
- **Material de terceiros** que você pede para baixar (vídeos de pessoas públicas, matérias): o uso é decisão e responsabilidade sua.

## Por dentro (para curiosos)

Não precisa ler para usar. Se quiser entender a parte técnica:

- `codigos/`: programas numerados na ordem do processo (01 preparar, 02 transcrever, 03 cortes de erros, 04 áudio, 05 imagem, 06 montar o vídeo cortado, 07 conferir emendas, 08 levar para o Remotion, 09 câmera, 10 sons, 11 legenda em arquivo, 12 reajustar animações quando o corte muda).
- `remotion/`: as animações (`src/componentes/`), as cores e fontes da sua marca (`src/marca.ts`) e a montagem final (`src/Aula.tsx`, `src/Reels.tsx`).
- `.claude/skills/`: os roteiros dos três comandos.
- `CLAUDE.md`: o mapa que o Claude lê toda vez que abre a pasta.
