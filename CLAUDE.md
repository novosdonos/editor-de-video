# Editor de vídeo

Repositório que transforma o bruto gravado em vídeo pronto (corte, áudio, cor, motion, legenda), com o padrão de um único autor/marca configurado em `setup/`. Cada pessoa usa a própria cópia. Tudo roda local (Mac Apple Silicon testado; Windows previsto).

## Skills (a ordem do processo)

1. `/video-setup` — ambiente, entrevista, referências, biblioteca, calibração. Uma vez, depois manutenção.
2. `/video-roteiro` — do "quero gravar" ao `video.md` aprovado (A1).
3. `/video-editar` — do bruto ao final por plataforma, em etapas com portão: cortes (A2) → mapa de motion (A3) → material → motion (A4) → câmera → som → entrega (A5). Retoma pela `etapa` do `video.md`. Também: vídeo sem roteiro, variações, cortes curtos, lote.

Toda skill confere o que existe e cria o que falta; `/video-roteiro` e `/video-editar` rodam `codigos/verificar_ambiente.py` antes de começar.

## Mapa

```
setup/            ← configuração do autor (lida por todas as skills)
  perfil.md         quem fala, público, tom, formatos, roteiro, legenda/trilha, captação, telas
  estilo.md         design system de edição: tokens, layouts, movimento, corte, cor, áudio, aprendizados
  elementos.md      taxonomia única de elementos (cena × componente × referência × biblioteca)
  plataformas.md    formatos, zonas seguras, exportação, calibração
  vocabulario.md    palavras que a transcrição erra (lido pelo 03)
  referencias/      como os outros fazem: entrada/ (o autor solta aqui) + indice.md + <tipo>/ (clipes e frames; nunca entram no render)
  fontes/           o que o autor fala e sabe: entrada/ (o autor solta tudo aqui) + indice.md + reunioes/ videos/ textos/ clientes/ externas/ (transcrições; nunca entram no render)
  biblioteca/       material recorrente (marca, fotos, b-roll, telas, provas, interfaces, audio, cor)
                    cor/: look.cube (look do autor), entrada.cube (log -> Rec.709), referencia.png (lidos pelo 05)
videos/<nn-slug>/ ← um vídeo
  video.md          briefing, pesquisa, roteiro, plano de cenas, captação, correções, aprovações
  brutos/           original.<ext> + material só deste vídeo
  edicao/           transcricao.json (decisões: uma seção por etapa), transcricao.txt, qualidade.json
                    (relatório: bruto/audio/imagem), audio_tratado.wav (04), editado.mp4 (único vídeo intermediário)
  previas/          só o que o autor revisa no portão aberto, nomes fixos e sobrescritos (amostra-<etapa>.mp4,
                    revisao-cortes.*, auditoria.txt, storyboard.*); apagada ao fechar cada portão
  final/            <plataforma>.mp4
codigos/          ← pipeline Python (rodar com .venv/bin/python)
  numerados na ordem do processo (renumerado em 2026-11-11):
  01 preparar (pasta + ficha do bruto) · 02 transcrever · 03 conferir erros e cortes editoriais · 04 tratar áudio
  · 05 tratar imagem · 06 render (cortes + áudio + cor; chama o 07 no fim) · 07 revisar cortes (confere as
  emendas retranscrevendo; previas/revisao-cortes só com o que falhou ou é dúvida, para a A2-cortes)
  · 08 exportar para o Remotion (aula.json: legendas + câmera + sons) · 09 enquadrar (etapa 7: rosto + planos,
  seção "enquadramento") · 10 sonorizar (etapa 8: SFX por evento, seção "sfx") · 11 legenda .srt (só se a plataforma pede)
  · 12 remapar motion (congela a base de tempo na A4, seção "remapa"; editado refeito depois → public/<slug>/remapa.json)
  · 13 conferir motion (mede nos destaques da aula montada: texto sobre o rosto em cada plano da câmera, faixa do player, frase longa
  ou esticada, colisões; seção "conferencia"; falha bloqueia a amostra; onde o rosto fica livre num plano mais aberto,
  chama o 09 --so-tetos para abrir a câmera só naquele trecho)
  sem número (não são etapas): caminhos.py (caminhos + ficha do bruto) · transcricao.py (leitura/gravação por
  seção, linha do tempo editada) · verificar_ambiente.py · requirements.txt
remotion/         ← composição e motion (React); public/<slug>/ é montado pelo 08
  src/Aula.tsx (composição) · src/Camera.tsx (aplica câmera do 09 e sons do 10) · src/aulas/<aula>.tsx (linha
  do tempo de cenas e destaques) · src/componentes/<Tipo>.tsx (catálogo: só a forma, com props) · src/registro/
  (dados de cada vídeo: textos, tempos, imagens) · src/novas/ (cenas em construção; aprovadas, viram forma no
  catálogo + dados no registro, com render idêntico) · scripts/linha.mjs (imprime essa linha em JSON para o 09 e o 10)
.agents/skills/   ← skill remotion-best-practices (instalada via skills-lock.json; ligada em .claude/skills/)
README.md · guia/ ← guia do autor (01 como funciona … 09 problemas); as skills apontam para o capítulo certo
INSTALAR.md       ← instalação pelo link (lida pelo Claude do autor antes e depois de baixar)
```

## Regras

- **Direção antes de regra.** O `estilo.md` é base, não lei: cada vídeo tem uma seção "Direção" no `video.md` (tipo, o que precisa causar, mensagem, ritmo, material, quebras da base) e toda escolha de formato, transição, câmera e som diz a que ela serve. Como decidir: `.claude/skills/video-editar/direcao.md`. Fixos de verdade só a identidade (marca), a ética (material real, nunca distorcer) e os limites técnicos de plataforma.
- **Decidir em texto, renderizar uma vez.** Cada etapa grava só a própria seção do `transcricao.json`; ninguém renderiza em cima do resultado anterior.
- **Cenas ancoradas em palavras** da transcrição, não em segundos.
- **Uma etapa por assunto, com portão.** Cortes, motion, câmera e som são etapas separadas, nessa ordem; motion só sobre cortes aprovados (A2-cortes no `video.md`). O 06 não faz mais zoom (padrão `--zoom 1`): câmera é o 09.
- **Remotion é o motor de motion** (decidido em 2026-11-11 após teste contra HyperFrames). Não adicionar outro.
- **Um arquivo por papel, sem cópias.** Bruto: só `brutos/original.*` (nenhum código altera, copia ou apaga; 02, 04, 05 e 06 leem dele). Decisões: só `transcricao.json`. Relatório: só `qualidade.json`. Vídeo intermediário: só `editado.mp4` (o 06 refaz a partir do original; nada se aplica em cima dele; teste é amostra, nunca segundo vídeo inteiro). Nenhum código apaga arquivo, exceto o que é da `previas/`.
- **Pasta do vídeo sempre limpa.** `previas/` guarda só o que o autor revisa no portão aberto, com nome fixo por tipo e sobrescrito a cada rodada (`amostra-cortes.mp4`, `amostra-motion.mp4`, `amostra-final.mp4`, `revisao-cortes.*`, `auditoria.txt`, `storyboard.*`, `material.jpg`, `conferencia.*`); nunca `-2`, `-ajustes`, `-novas`. Ao fechar cada portão (aprovado ou reprovado e refeito), as prévias daquela etapa são apagadas; na entrega (A5), a `previas/` inteira. Rascunho de trabalho (scripts de teste, frames de conferência, simulações, notas de passagem) vai para o scratchpad da sessão, nunca para a pasta do vídeo.
- **Uma seção por etapa.** Cada código grava só a sua seção (via `transcricao.py`, que relê o arquivo e preserva o resto); por isso 02 ‖ 04 ‖ 05 rodam em paralelo. Quem depende de outra camada confere a assinatura dela (07/08 param se os cortes mudaram; o 08 avisa se a cor mudou depois do render).
- Referências baixadas são só para estudo e nunca entram no render.
- Material de terceiros (`arquivo`: pessoas públicas, eventos, react): o autor decide o que usar, inclusive sem licença; não bloquear nem insistir. Nunca editar fala ou imagem para a pessoa parecer dizer ou fazer o que não fez.
- **Nunca pedir chave de API, conta ou trabalho manual ao autor.** Resolver sozinho (fonte aberta, `yt-dlp --cookies-from-browser chrome`, Chrome do autor pela extensão); se só existir caminho com conta/chave, propor a alternativa sem chave; criar conta ou gerar chave fica com o autor (o Claude não cria contas), e a chave vai em `.env` (fora do git).
- Commits e push só quando o usuário pedir.

## Aprendizado

Os arquivos do repositório são a memória do processo.
1. Toda alteração pedida vira linha em "Correções" do `video.md`.
2. Ao fim de cada aprovação, classificar: só deste vídeo (fica no `video.md`) · gosto do autor (`estilo.md` §11) · palavra (`vocabulario.md`) · coberto pela interface do app (`plataformas.md` §4) · componente (catálogo + `estilo.md` §10) · erro de código/ambiente (código + `verificar_ambiente.py` ou "Problemas conhecidos" abaixo).
3. Dúvida se vale para todos os vídeos: perguntar uma vez, junto com a aprovação.
4. Princípio + caso + origem (data, vídeo): o porquê, o que se fez, em que tipo de vídeo funcionou e quando não vale. Número medido entra como base ou exemplo, não como meta. Aprendizados repetidos ou contraditórios são fundidos; quando dois tipos de vídeo pedem coisas opostas, os dois casos ficam, cada um com o seu contexto.

5. **Antes de apagar, colher.** Nada que o próximo vídeo precise mora só em `previas/`, no scratchpad ou na conversa. Antes de limpar (fim de portão, entrega ou fim de sessão): (a) o que o autor disse sobre cada prévia virou linha em "Correções" e foi classificado (item 2); (b) script de teste que resolveu um problema virou código em `codigos/` (com docstring do porquê) ou foi descartado de propósito; (c) dado de que outra etapa depende vira seção do `transcricao.json`, nunca arquivo solto; (d) passagem para a próxima sessão vai no `video.md` (`etapa`, aprovações, "Correções"), não em nota à parte.
6. Pedido não some entre sessões: toda sessão começa listando as linhas de "Correções" ainda abertas ("A refazer", pedido sem "Feito") e nenhum portão fecha com elas abertas. Regra escrita não basta: antes de mandar qualquer amostra, rodar o `13_conferir_motion.py` (o que dá para medir, a máquina mede) e conferir o vídeo montado contra o resto (`revisor.md`), porque em conversa longa a regra cai do contexto (aula 01, 2026-11-13: título e frase pedidos em 11/11 só entraram na entrega; frases longas e no rosto apesar do `estilo.md` §12).

## Problemas conhecidos

- onnxruntime só em CPU (CoreML: o macOS mata o processo em áudio longo).
- Áudio do .mov do iPhone começa ~0,19 s depois do vídeo: o 06 compensa.
- Google bloqueia (captcha) gravação automática em navegador invisível e buscas repetidas; usar Chrome visível ou gravação assistida.
- Bruto que já é vídeo editado/publicado (áudio comprimido, pausas já tiradas): o corte de pausas por volume do 06 come o fim das palavras. Usar `--limiar-fala 0 -v 1`; o 06 avisa quando alguma palavra mantida perde pedaço (2026-11-12, 02a/02b).
- Motion e destaques ficam fora da transformação da câmera (o zoom do 09 só mexe no vídeo): quando a câmera fecha, o rosto cresce e chega no texto. O 13 mede isso na aula montada e o 09 (`--so-tetos`) abre a câmera só no trecho; `remotion/scripts/quadros.mjs` serve para olhar de perto. Item que cobre o rosto mesmo com a câmera aberta precisa mudar de lugar ou de forma (2026-11-13, aula 01; 13 desde 2026-11-14).
- O comando de render com `mostrarLegendas: true` liga a legenda corrida por cima dos destaques; seguir o campo `legenda` do `video.md` (2026-11-13, aula 01).
