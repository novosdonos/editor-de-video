# 6. Pedidos prontos

[← Revisar e aprovar](05-revisar-e-aprovar.md) · Próximo: [Dicas →](07-dicas.md)

Textos para copiar, colar na conversa e completar. Troque o que está entre `< >`. Quanto mais você preencher, menos o Claude pergunta e mais preciso fica.

Sempre com a pasta `editor-de-video` aberta no app do Claude.

---

## Setup

### Primeiro setup

```
/video-setup
Sou <nome>, <o que faço em uma frase>. Faço vídeos para <rede(s)> com o objetivo de <atrair / vender / ensinar alunos>.
Minha identidade visual está em <link do site, Figma, Canva ou pasta com logo e cores>.
```

### Adicionar uma referência

```
/video-setup
Referência: <link do vídeo ou perfil>
O que eu gosto: <ex.: como o texto entra na tela; o ritmo dos primeiros 5 segundos; a legenda grande no meio>
O que eu não gosto: <ex.: a música alta; o excesso de efeitos>
Quero usar em: <reels / aula / YouTube / anúncio>
```

### Adicionar materiais

```
/video-setup
Coloquei em setup/fontes/entrada/ <transcrições de reuniões de venda / vídeos meus / textos>. Organiza e me diz o que ainda falta.
```

```
/video-setup
Quero adicionar à biblioteca: <logo nova / fotos profissionais / prints de depoimentos / imagens de apoio>. Estão em <pasta ou álbum do app Fotos>.
```

### Saber o que falta

```
/video-setup
O que falta no meu setup para os vídeos ficarem melhores? Em ordem de impacto.
```

---

## Roteiro

### Ideia de vídeo

```
/video-roteiro
Tema: <assunto>
Para quem: <público específico deste vídeo>
O que precisa causar: <ex.: perceber que perde dinheiro sem saber; confiar em mim; pedir o diagnóstico>
Formato: <reels / aula / YouTube / anúncio>, cerca de <duração>
Chamada final: <o que a pessoa deve fazer depois>
Não pode faltar: <história, número, exemplo>
Modo de roteiro: <tópicos / texto inteiro>
```

### Anúncio com variações

```
/video-roteiro
Anúncio de <produto/oferta> para <público>.
Quero <número> ganchos diferentes (dor, número, prova, pergunta) e <número> chamadas finais.
Duração: <15–60 s>.
```

---

## Edição

### Editar o que gravei

```
/video-editar
Gravei o vídeo <nome ou número da pasta>. <Arrastei o arquivo para a conversa / O arquivo está na pasta Downloads e se chama aula3.mov>.
<Opcional: o bruto já foi editado antes / gravei em log / tem trechos para tirar>
```

### Editar vídeo sem roteiro

```
/video-editar
Tenho um vídeo pronto, sem roteiro. <Arrastei o arquivo para a conversa / Está na pasta ... e se chama ...>.
Formato de saída: <reels / YouTube / aula>. Objetivo: <atrair / vender / ensinar>.
Monta o roteiro a partir da fala e segue a edição.
```

### Cortes curtos de um vídeo longo

```
/video-editar
Do vídeo <nome>, quero cortes verticais para <Instagram / TikTok / Shorts>.
Lista os melhores trechos (ideia completa, gancho forte, de 30 a 90 s) com o motivo de cada um, que eu escolho.
```

### Retomar outro dia

```
/video-editar
Continua o vídeo <nome ou número>.
```

---

## Ajustes

### Pedir um ajuste numa aprovação

```
Ajuste em <cortes / animação / câmera / som>:
- Onde: quando eu falo "<palavra ou frase>"
- O que está errado: <descrição>
- O que eu quero: <descrição>
Vale <só para este vídeo / para todos os vídeos>.
```

### Registrar um gosto para sempre

```
A partir de agora, em todos os vídeos: <ex.: nunca use texto em caixa alta; corte mais as pausas em reels; legenda sempre no meio da tela>.
Grava no meu estilo.
```

### Palavra que a transcrição sempre erra

```
A transcrição escreve "<como sai errado>", o certo é "<como é>". Grava no vocabulário.
```

---

## Manutenção

### Atualizar para uma versão nova do editor

Abra o app do Claude na pasta **Documentos** (não dentro do editor) e envie:

```
Tenho o editor de vídeo instalado em Documentos/editor-de-video.
1. Renomeie essa pasta para editor-de-video-antigo.
2. Instale a versão nova seguindo o INSTALAR.md de https://github.com/eupedromaciel/editor-de-video
3. Traga da antiga para a nova tudo o que é meu: setup/ (perfil, vocabulário, referências, fontes, biblioteca),
   videos/ inteira, remotion/src/marca.ts (minha marca), remotion/src/aulas/, remotion/src/registro/
   e os componentes que não existem na versão nova.
4. Nos arquivos que existem nas duas (setup/estilo.md, elementos.md, plataformas.md e os componentes),
   mantenha a base da versão nova e traga as minhas preferências e aprendizados da antiga. Me mostre o que mudou.
5. Rode o verificador e um teste. Não apague a pasta antiga até eu conferir.
```

### Conferir se está tudo instalado

```
Roda o verificador de ambiente do editor e resolve o que estiver faltando.
```
