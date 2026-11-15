# Checklist do revisor

Rodado por um subagent revisor: os itens da etapa antes de toda amostra que vai ao autor, e o checklist inteiro, com o vídeo montado do começo ao fim, antes da A5-final. Cada falha volta só para a cena/trecho que falhou. Falha que continua depois de duas tentativas de ajuste é sinal de conceito errado: repensar a cena (ou levar a dúvida ao autor) em vez de remendar de novo. Nada vai para a A5 como "exceção" sem o autor saber o que é e por quê.

O checklist confere **o resultado na tela**, não cota: número citado aqui é a base do `estilo.md`; se a Direção do vídeo definiu outro, vale o da Direção.

## Técnico

- [ ] **Portões**: `video.md` com A2-cortes (assinatura igual à do render atual), A3-mapa e A4-motion registrados; o 08 não avisou corte mudado depois da aprovação.
- [ ] **Corte**: nenhuma ideia repetida em seguida nem longe (`estilo.md` §6.2); nenhuma frase cortada no meio; regravações removidas (`estilo.md` §6). O 07 já confere cada emenda retranscrevendo: rodar `07_revisar_cortes.py` no render final e não pode sobrar emenda suspeita sem decisão do autor.
- [ ] **Ortografia** de todo texto na tela e na legenda contra `setup/vocabulario.md` e as palavras proibidas do `perfil.md`.
- [ ] **Zonas seguras** de cada plataforma (`plataformas.md` §2): legenda, textos e CTA dentro da área livre.
- [ ] **Sincronia**: cada cena entra na palavra em que está ancorada; legenda acompanha a fala.
- [ ] **Sobreposição**: motion não cobre o rosto; zoom não acontece durante motion que cobre a tela nem no layout `reduzida`.
- [ ] **Conferência automática sem falha**: `codigos/13_conferir_motion.py videos/<slug>` (rosto livre em cada plano da câmera, faixa do player, frase longa ou esticada, colisões). Falha só passa se estiver em `liberados` com o motivo da Direção. Os avisos (`perto`, `parado`) foram olhados um a um em `previas/conferencia.jpg`. Texto nunca no peito no horizontal (no `Reels` dividido, a palavra-chave no peito é a regra do layout).
- [ ] **Pendências**: nenhuma linha "A refazer" ou pedido sem "Feito" em "Correções" do `video.md`.
- [ ] **Legenda**: `mostrarLegendas` do render igual ao campo `legenda` do `video.md` (palavras-chave = sem legenda corrida; ela cobre os destaques de baixo).
- [ ] **Câmera e som**: seções `enquadramento` e `sfx` existem e valem para os cortes atuais (o 08 avisa); render curto de um trecho com destaque e uma volta de cena: rosto não encosta no texto, nenhuma borda preta, SFX abaixo da voz.
- [ ] **Revisar em vídeo, não em foto**: antes de mandar storyboard ou amostra ao autor, renderizar e assistir ~2 s em volta de cada ponto de risco (entrada e saída de tela cheia, gráfico perto da cabeça, texto sobre imagem clara, troca de headline, cobertura de inserção do bruto). Still esconde sobreposição e saída seca (2026-11-12: três rodadas do reels saíram de pontos assim).
- [ ] **Movimento** (`estilo.md` §5, salvo quebra anotada na Direção): sem parada seca, sem entrada simultânea de filhos, texto na tela ≥ 0,3 s por palavra (automatizar com `checar-curvas.ts` quando existir).
- [ ] **Leitura**: texto de leitura ≥ 28 px em 1080 de altura; contraste suficiente (exceto elementos apagados de propósito no foco).
- [ ] **Áudio**: volume alvo da plataforma; SFX só em evento visual, nunca no acento forte da música, nunca cobrindo palavra; nenhuma emenda com fade até zero.
- [ ] **Cor** aplicada no render (seção `cor`; o 08 avisa se ela mudou depois do render).
- [ ] **Arquivo de terceiros**: fonte (link, canal, trecho) anotada no `video.md`; nenhuma fala ou imagem editada para parecer o que não foi.
- [ ] **Dado sensível**: nenhum nome de cliente, e-mail, CPF, telefone ou localização em provas e telas.

## Direção (`direcao.md`)

- [ ] O vídeo cumpre a Direção do `video.md`: causa o que ela pede, onde ela pede (abertura, meio, prova, fim)?
- [ ] Toda quebra da base (`estilo.md`) tem motivo escrito na Direção ou no mapa. Quebra com motivo não é falha; base aplicada onde atrapalha a direção é.
- [ ] Ritmo como a Direção definiu: a imagem muda no intervalo previsto, sem trecho em que a atenção cai sem nada mudar.

## Variedade (`estilo.md` §13)

- [ ] Olhando a linha do tempo inteira (o formato de cada item, em sequência): algum contêiner, layout ou forma se repete sem motivo, a ponto de o vídeo parecer modelo pronto? Repetição com motivo (mesmo raciocínio, formato do vídeo inteiro) não é falha.
- [ ] Trocas de ambiente (imagem real em tela cheia) onde a Direção pediu.
- [ ] Nenhuma cena com raciocínio diferente reaproveitando a estrutura de outra.
- [ ] Nenhum elemento esquecido na tela esperando a próxima fala (base ~2 s; parado de propósito, para ler ou dar peso, não é falha).
- [ ] Frases de destaque: síntese curta (base 2–5 palavras), não transcrição, entrando junta; formas alternadas (a mesma em seguida pede motivo).
- [ ] **Fluidez da câmera** (`estilo.md` §6): nenhum zoom que vai e volta (plano < 2,5 s fora de corte), nenhuma aproximação lenta ou zoom dentro de cena que desfaz no fim, nenhum reenquadramento pequeno sem motivo.

## Diretor (só pelo que aparece na tela)

- [ ] A ideia do vídeo em 1 frase — bate com a mensagem da Direção?
- [ ] Algo na tela que não foi falado nem está no roteiro?
- [ ] Interface ou número inventado sobre gravação real (botão ou valor que não existe)?
- [ ] O momento-chave é o único exagero da cena?
- [ ] As 3 correções que mais melhorariam o vídeo (vão para a A5).
