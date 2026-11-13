# 9. Problemas comuns

[← Ferramentas](08-ferramentas.md) · [Voltar ao início](../README.md)

Primeiro passo para qualquer problema: **conte ao Claude o que aconteceu**, com print se puder. Na maioria dos casos ele resolve. Abaixo estão os casos mais comuns.

## Instalação

| O que aconteceu | O que fazer |
|---|---|
| Digito a senha no Terminal e nada aparece | É normal: o Mac esconde a senha enquanto você digita. Digite e aperte Enter |
| Apareceu uma janela pedindo "ferramentas de desenvolvedor" | Clique em **Instalar** e aceite. Quando terminar, avise o Claude |
| O Claude diz que não acha o `brew` depois de instalar o Homebrew | Feche e abra o app do Claude (Command + Q), abra a mesma pasta e diga: "continua a instalação do editor" |
| "Not an Administrator" no Terminal | O Homebrew só instala com um usuário administrador do Mac. Entre com um usuário administrador ou peça a quem cuida do computador |
| A instalação aconteceu "na nuvem" e a pasta não aparece no Mac | Na aba Code, escolha rodar **no seu Mac (local)** e peça a instalação de novo |
| "Pouco espaço em disco" | Libere espaço (apague vídeos antigos, esvazie a lixeira) até ter 30 GB livres. Os vídeos ocupam bastante |
| Meu Mac é Intel ou uso Windows | O editor ainda não foi testado nesses sistemas. Pode tentar; se travar, fale com o Pedro |
| Pedi para instalar duas vezes | O Claude não sobrescreve a pasta existente; ele pergunta se você quer usar a que já está lá |
| Erro durante a instalação de algum programa | Diga ao Claude: "roda o verificador do editor e resolve o que falta" |

## Uso

| O que aconteceu | O que fazer |
|---|---|
| Digito `/video-setup` e não aparece nada | A pasta aberta não é a do editor. Na aba Code, abra uma conversa nova e escolha **Documentos → editor-de-video** |
| O Claude parou: "limite de uso atingido" | O seu plano tem um limite por período. Espere o horário que ele indicar, abra a conversa e digite `/video-editar`. Ele continua da última aprovação, porque tudo fica no `video.md`. O que estava no meio de uma etapa ainda não aprovada pode ser refeito. No plano Max isso acontece bem menos |
| Fechei o app no meio da edição | Abra de novo, na pasta do editor, e digite `/video-editar`. Ele retoma de onde parou |
| O Claude está esquecendo coisas que eu já pedi | A conversa ficou longa. Digite `/clear` e chame o comando de novo. Os pedidos ficam guardados no `video.md` |
| O Claude pede uma chave de API (senha de acesso a um serviço) ou um cadastro | Não precisa. Diga: "resolve sem chave, com uma alternativa gratuita" |
| O Mac ficou lento durante a edição | É esperado em transcrição e montagem do vídeo: são etapas pesadas. Evite editar dois vídeos ao mesmo tempo |
| Pedi permissão para o Claude rodar comandos o tempo todo | Quando aparecer o pedido, escolha a opção de permitir sempre para esta pasta |

## Resultado

| O que aconteceu | O que fazer |
|---|---|
| O vídeo saiu estranho | Não recomece do zero. Diga o que está errado, citando a palavra falada perto do ponto (ver [5. Revisar e aprovar](05-revisar-e-aprovar.md#como-pedir-ajustes)). Ele volta só à etapa necessária |
| Palavras cortadas no fim | Avise na aprovação dos cortes. Se o seu vídeo já tinha sido editado antes (pausas tiradas), diga isso: o editor muda a forma de cortar |
| A transcrição erra o meu nome ou termos do meu mercado | Diga o certo uma vez: "a transcrição escreve X, o certo é Y; grava no vocabulário" |
| A legenda ou o texto ficou embaixo dos botões do Instagram | Avise na aprovação final. As margens das redes mudam; o editor ajusta e guarda para os próximos |
| O som está alto demais no final | Peça: "confere o volume final e normaliza para a plataforma" |
| A cor ficou diferente da gravação | Na aprovação, diga o que está errado ("pele alaranjada", "escuro"). Se gravou em perfil "log", avise |
| O áudio ficou com eco ou chiado | O editor limpa o que dá, mas eco forte não sai. Veja as dicas de som em [4. Gravar bem](04-gravar-bem.md#som) para o próximo |
| Vídeo do iPhone com o som um pouco atrasado | É conhecido e o editor compensa sozinho. Se ainda notar, avise |

## Não resolveu?

Fale com o Pedro no Instagram: [@eupedromaciel](https://instagram.com/eupedromaciel). Mande:
- o que você estava fazendo;
- o que apareceu (print da tela);
- em que etapa o vídeo está (o Claude te diz).
