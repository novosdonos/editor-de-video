#!/usr/bin/env python3
"""
Revisão de cortes por exceção: a máquina confere as emendas; o autor vê só o que falhou na
conferência ou depende do gosto dele, sem assistir ao vídeo inteiro (A2-cortes). Roda sozinho no fim do 06.

Uso:
    .venv/bin/python codigos/07_revisar_cortes.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/07_revisar_cortes.py videos/01-meu-primeiro-video --todos
    .venv/bin/python codigos/07_revisar_cortes.py videos/01-meu-primeiro-video --sem-conferir --margem 3

1. Conferência automática de toda emenda de corte da seção "erros": transcreve de novo (Parakeet)
   --margem segundos antes e depois da emenda no editado.mp4 e compara com o texto que deveria estar
   ali. Palavra a mais (sobra de palavra cortada), palavra repetida na emenda ou texto diferente =
   emenda suspeita. Emenda que passa não vai para o autor (só com --todos).
2. Vão para o autor (cada ponto vira um clipe de --margem segundos antes e depois):
    - emendas suspeitas da conferência;
    - cortes marcados "incerto" e cortes editoriais (conteúdo: o autor decide);
    - palavras com cara de gagueira e trechos repetidos que ficaram no vídeo (os mesmos avisos do 03).
   Não voltam: corte editorial com "aprovado": true e todo ponto cuja palavra está em "decididos"
   da seção "erros" (o autor já respondeu; ver o 03). O autor nunca responde a mesma coisa duas vezes.
Pausas cortadas e trechos acelerados pelo 06 não viram pontos (são centenas), mas a auditoria
transcreve o vídeo inteiro e lista em previas/auditoria.txt toda palavra esperada que não foi ouvida.

Entrada: edicao/editado.mp4 + edicao/transcricao.json ("palavras", "erros", "edicao"; para se os
cortes mudaram depois do render).

Saída (em previas/, apagável):
    revisao-cortes.mp4  ->  os clipes em ordem, com legenda embutida (ligar a legenda no player) e
                            um capítulo por ponto (menu de capítulos do QuickTime/IINA/VLC)
    revisao-cortes.srt  ->  a mesma legenda, para players que não leem a embutida
    revisao-cortes.txt  ->  lista numerada: tempo na revisão, no editado e no original, tipo e texto.
                            O autor responde pelo número ("7: volta", "12: corta mais 2 palavras").
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import caminhos
import transcricao

ERROS = transcricao.carregar_codigo("03_remover_erros.py")


def mmss(t: float) -> str:
    m, s = divmod(max(t, 0), 60)
    return f"{int(m):02d}:{s:04.1f}"


def srt_tempo(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def para_editado(t: float, trechos: list[tuple], velocidade: float) -> float:
    """Tempo do original -> tempo do editado.mp4 (um ponto cortado vai para a emenda seguinte).
    Trecho (início, fim, fator) do 06 é acelerado: dura `fator` vezes menos."""
    acumulado = 0.0
    for trecho in trechos:
        inicio, fim = trecho[0], trecho[1]
        fator = trecho[2] if len(trecho) > 2 else 1.0
        if t < fim:
            return acumulado + (max(t, inicio) - inicio) / (velocidade * fator)
        acumulado += (fim - inicio) / (velocidade * fator)
    return acumulado


def resumo(texto: str, palavras: int = 12) -> str:
    partes = texto.split()
    return texto if len(partes) <= palavras else "… " + " ".join(partes[-palavras:])


def conferir_emendas(editado: Path, pontos: list[dict], palavras_editadas: list[dict], margem: float) -> None:
    """Marca p["suspeita"] nas emendas cujo áudio não diz o texto esperado (ver docstring)."""
    asr = transcricao.carregar_codigo("02_transcrever_audio.py")
    taxa = asr.TAXA_AMOSTRAGEM
    print(f"Conferindo {len(pontos)} emendas (transcrição de {2 * margem:g} s em volta de cada uma)...")
    onda = asr.carregar_audio(editado)
    modelo = asr.onnx_asr.load_model(asr.MODELO, asr.PASTA_MODELO, providers=asr.PROVEDORES)
    janelas = [onda[int(max(0, p["t"] - margem) * taxa):int((p["t"] + margem) * taxa)] for p in pontos]
    ouvidos = [modelo.recognize(j, sample_rate=taxa) for j in janelas]
    for p, ouvido in zip(pontos, ouvidos):
        # esperado: palavras cujo meio cai na janela (as das bordas podem sair pela metade)
        esperado = [w["palavra"] for w in palavras_editadas
                    if p["t"] - margem + 0.25 <= (w["inicio"] + w["fim"]) / 2 <= p["t"] + margem - 0.25]
        a = ERROS.normalizar(" ".join(esperado)).split()
        b = ERROS.normalizar(ouvido).split()
        # a transcrição de um pedaço curto varia; só contam os dois defeitos reais de emenda:
        # 1) palavra ou par de palavras repetido em seguida que o texto esperado não tem
        def repeticoes(w):
            return {x for x, y in zip(w, w[1:]) if x == y and len(x) > 1} | \
                   {w[i:i + 2] == w[i + 2:i + 4] and " ".join(w[i:i + 2]) for i in range(len(w) - 3)} - {False}
        repetida = repeticoes(b) - repeticoes(a)
        # 2) sobra da fala cortada: palavra (4+ letras) do trecho removido que não existe em nenhum
        #    lugar do texto mantido perto da emenda (regravação repete palavras de propósito)
        perto = {x for w in palavras_editadas if abs((w["inicio"] + w["fim"]) / 2 - p["t"]) <= margem + 8
                 for x in ERROS.normalizar(w["palavra"]).split()}
        sobra = {w for w in b if len(w) >= 4 and w in p["removidas"] and w not in perto}
        p["ouvido"] = ouvido.strip()
        p["suspeita"] = bool(repetida or sobra)
        p["motivo_suspeita"] = ", ".join([f"repetiu «{r}»" for r in repetida] + [f"sobrou «{s}»" for s in sorted(sobra)])


def coletar_pontos(dados: dict) -> list[dict]:
    palavras = dados["palavras"]
    edicao = dados["edicao"]
    trechos = [tuple(t) for t in edicao["trechos"]]
    velocidade = edicao.get("velocidade", 1.0)
    cortes = ERROS.validar(dados.get("erros", {}).get("cortes", []), palavras, "corte")
    removidas = {i for c in cortes for i in range(c["de"], c["ate"] + 1)}

    pontos = []
    for c in cortes:
        fim_original = palavras[c["ate"]]["fim"]
        # corte editorial/incerto deixa de ser dúvida quando o autor aprovou ("aprovado": true);
        # a emenda dele continua passando pela conferência automática
        duvida = (c.get("incerto") or c.get("tipo") == "editorial") and not c.get("aprovado")
        rotulo = c.get("tipo", "corte") + (f" ({c['motivo']})" if c.get("motivo") else "")
        pontos.append({"t": para_editado(fim_original, trechos, velocidade),
                       "original": palavras[c["de"]]["inicio"], "duvida": duvida, "emenda": True, "ancoras": {c["de"]},
                       "removidas": set(ERROS.normalizar(c["texto"]).split()),
                       "rotulo": rotulo, "texto": f"saiu: «{resumo(c['texto'])}»"})
    for i in ERROS.palavras_suspeitas(palavras, removidas):
        pontos.append({"t": para_editado(palavras[i]["inicio"], trechos, velocidade),
                       "original": palavras[i]["inicio"], "duvida": True, "ancoras": {i},
                       "rotulo": "gagueira?", "texto": f"ficou: «{palavras[i]['palavra']}»"})
    repetidos = ERROS.trechos_repetidos(palavras, removidas) + ERROS.ideias_repetidas(palavras, removidas)
    for a, b in repetidos:
        frase = " ".join(p["palavra"] for p in palavras[b:b + 8])
        for i, ordem in ((a, "1ª"), (b, "2ª")):
            pontos.append({"t": para_editado(palavras[i]["inicio"], trechos, velocidade),
                           "original": palavras[i]["inicio"], "duvida": True, "ancoras": {i},
                           "rotulo": f"repetição ({ordem} vez)", "texto": f"«{frase}…»"})
    # cortes vizinhos que caem na mesma emenda viram um ponto só
    juntos = []
    for p in sorted(pontos, key=lambda p: p["t"]):
        if juntos and p["t"] - juntos[-1]["t"] < 0.05:
            j = juntos[-1]
            j["duvida"] = j["duvida"] or p["duvida"]
            j["rotulo"] += " + " + p["rotulo"]
            j["texto"] += " | " + p["texto"]
            j["removidas"] = j.get("removidas", set()) | p.get("removidas", set())
            j["emenda"] = j.get("emenda") or p.get("emenda")
            j["ancoras"] = j["ancoras"] | p["ancoras"]
        else:
            juntos.append(dict(p))
            juntos[-1].setdefault("emenda", False)
    return juntos


def agrupar(pontos: list[dict], margem: float, duracao: float) -> list[dict]:
    """Junta pontos cujos clipes se sobrepõem num clipe só."""
    clipes = []
    for p in pontos:
        inicio, fim = max(0.0, p["t"] - margem), min(duracao, p["t"] + margem)
        if clipes and inicio <= clipes[-1]["fim"]:
            clipes[-1]["fim"] = max(clipes[-1]["fim"], fim)
            clipes[-1]["pontos"].append(p)
        else:
            clipes.append({"inicio": inicio, "fim": fim, "pontos": [p]})
    return clipes


# formas faladas que a transcrição escreve de outro jeito (não é palavra perdida)
FALADO = {"pra": "para", "pro": "para o", "ta": "esta", "to": "estou", "tava": "estava", "ce": "voce",
          "teu": "seu", "tua": "sua", "teus": "seus", "tuas": "suas", "quica": "quiza"}


def auditar(editado: Path, palavras_editadas: list[dict], saida: Path, janela: float = 20.0) -> list[dict]:
    """
    Auditoria do vídeo INTEIRO (não só das emendas de erro): transcreve o editado.mp4 em janelas e
    alinha com o texto aprovado. Palavra esperada que não foi ouvida = possível sílaba ou palavra
    comida pelo corte de pausas ou pela aceleração (aula 01, 2026-11-12: "num me-nino" perdeu
    "num me-" e só apareceu quando o autor assistiu). Ignora palavras de até 2 letras e as que caem
    a menos de 1 s da borda da janela (a transcrição de borda falha sozinha). Grava a lista em `saida`.
    """
    import difflib
    asr = transcricao.carregar_codigo("02_transcrever_audio.py")
    taxa = asr.TAXA_AMOSTRAGEM
    onda = asr.carregar_audio(editado)
    modelo = asr.onnx_asr.load_model(asr.MODELO, asr.PASTA_MODELO, providers=asr.PROVEDORES)
    duracao = len(onda) / taxa
    print(f"Auditoria: transcrevendo o vídeo inteiro ({duracao / 60:.1f} min)...")
    faltando = []
    t = 0.0
    while t < duracao:
        fim = min(t + janela, duracao)
        ouvido = ERROS.normalizar(modelo.recognize(onda[int(t * taxa):int(fim * taxa)], sample_rate=taxa)).split()
        esperadas = [w for w in palavras_editadas if t <= (w["inicio"] + w["fim"]) / 2 < fim]
        texto = [ERROS.normalizar(w["palavra"]) for w in esperadas]
        ouvido = [FALADO.get(x, x) for x in " ".join(ouvido).split()]
        texto_cmp = [" ".join(FALADO.get(y, y) for y in x.split()) for x in texto]
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, texto_cmp, ouvido, autojunk=False).get_opcodes():
            if op not in ("delete", "replace"):
                continue
            trocado = ouvido[j1:j2]
            for w, x in zip(esperadas[i1:i2], texto_cmp[i1:i2]):
                meio = (w["inicio"] + w["fim"]) / 2
                parecida = any(difflib.SequenceMatcher(None, x, y).ratio() >= 0.7 for y in trocado)
                if len(x.replace(" ", "")) > 2 and t + 1 < meio < fim - 1 and not parecida:
                    faltando.append({"t": w["inicio"], "palavra": w["palavra"],
                                     "contexto": " ".join(v["palavra"] for v in esperadas[max(0, i1 - 4):i2 + 4])})
        t = fim
    linhas = [f"{mmss(p['t'])}  «{p['palavra']}»  …{p['contexto']}…" for p in faltando]
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(f"Auditoria do editado: {len(faltando)} palavra(s) esperada(s) não ouvida(s)\n" + "\n".join(linhas) + "\n",
                     encoding="utf-8")
    print(f"  {len(faltando)} palavra(s) esperada(s) não ouvida(s) (conferir no áudio): {saida.name}")
    return faltando


def gerar(pasta: caminhos.Video, caminho: Path, margem: float = 2.5, editado: Path | None = None,
          todos: bool = False, conferir: bool = True) -> Path | None:
    dados = transcricao.carregar(caminho, exigir=("palavras", "edicao"))
    if dados["edicao"].get("cortes") != transcricao.assinatura_dos_cortes(dados):
        sys.exit("Erro: os cortes mudaram depois do último render; rode o 06 antes da revisão.")
    editado = (editado or pasta.editado).expanduser().resolve()
    if not editado.is_file():
        sys.exit(f"Erro: vídeo editado não encontrado: {editado}")
    duracao = dados["edicao"]["duracao"]
    if conferir:
        auditar(editado, transcricao.linha_do_tempo(caminho)["palavras"], pasta.pasta_previas / "auditoria.txt")
    pontos = coletar_pontos(dados)
    emendas = [p for p in pontos if p["emenda"]]
    if conferir and emendas:
        conferir_emendas(editado, emendas, transcricao.linha_do_tempo(caminho)["palavras"], margem)
        for p in emendas:
            if p["suspeita"]:
                p["duvida"] = True
                p["rotulo"] = "emenda suspeita · " + p["rotulo"]
                p["texto"] += f" | {p['motivo_suspeita']} | ouvi: «{resumo(p['ouvido'], 16)}»"
        print(f"  {sum(p['suspeita'] for p in emendas)} emendas suspeitas, "
              f"{sum(not p['suspeita'] for p in emendas)} conferidas sem problema.")
    total = len(pontos)
    # o que o autor já decidiu (seção "erros", lista "decididos") não volta para ele
    decididos = {d["palavra"] for d in dados.get("erros", {}).get("decididos", [])}
    ja = [p for p in pontos if p["duvida"] and p["ancoras"] <= decididos]
    for p in ja:
        p["duvida"] = False
    if ja:
        print(f"  {len(ja)} pontos já decididos pelo autor (fora da revisão).")
    if not todos:
        pontos = [p for p in pontos if p["duvida"]]
    if not pontos:
        print(f"Revisão de cortes: nenhum ponto para o autor ({total} conferidos).")
        return None
    clipes = agrupar(pontos, margem, duracao)

    legendas, capitulos, linhas, offset, n = [], [], [], 0.0, 0
    for clipe in clipes:
        dur = clipe["fim"] - clipe["inicio"]
        tempos = [p["t"] for p in clipe["pontos"]]
        # limites entre pontos vizinhos do mesmo clipe: no meio do caminho entre os dois
        limites = [clipe["inicio"]] + [(a + b) / 2 for a, b in zip(tempos, tempos[1:])] + [clipe["fim"]]
        for k, p in enumerate(clipe["pontos"]):
            n += 1
            no_reel = offset + p["t"] - clipe["inicio"]
            antes_ini = offset + limites[k] - clipe["inicio"]
            depois_fim = offset + limites[k + 1] - clipe["inicio"]
            tag = "DÚVIDA · " if p["duvida"] else ""
            # antes do ponto: avisa o que vem; depois: o que saiu/ficou
            legendas.append((antes_ini, no_reel, f"[{n}] {tag}{p['rotulo']} · editado {mmss(p['t'])}\nponto em instantes ▸"))
            legendas.append((no_reel, depois_fim, f"[{n}] {tag}{p['rotulo']}\n{p['texto']}"))
            capitulos.append((antes_ini, f"{n} · {mmss(p['t'])} · {tag}{p['rotulo']}"))
            linhas.append(f"{n:>3} | revisão {mmss(no_reel)} | editado {mmss(p['t'])} | original {mmss(p['original'])} "
                          f"| {tag}{p['rotulo']} | {p['texto']}")
        offset += dur

    pasta.pasta_previas.mkdir(parents=True, exist_ok=True)
    saida = pasta.pasta_previas / "revisao-cortes.mp4"
    srt = saida.with_suffix(".srt")
    srt.write_text("\n".join(f"{i}\n{srt_tempo(a)} --> {srt_tempo(b)}\n{texto}\n"
                             for i, (a, b, texto) in enumerate(legendas, 1)), encoding="utf-8")
    duvidas = sum(p["duvida"] for p in pontos)
    cabecalho = (f"Revisão de cortes de {pasta.nome}: {len(pontos)} pontos ({duvidas} dúvidas) em "
                 f"{mmss(offset)} de vídeo (o editado tem {mmss(duracao)}).\n"
                 "Responda pelo número: 'ok' para tudo certo, ou '<n>: <o que fazer>'.\n")
    saida.with_suffix(".txt").write_text(cabecalho + "\n" + "\n".join(linhas) + "\n", encoding="utf-8")

    with tempfile.TemporaryDirectory() as tmp:
        meta = Path(tmp) / "capitulos.txt"
        blocos = [";FFMETADATA1"]
        fins = [c[0] for c in capitulos[1:]] + [offset]
        for (inicio, titulo), fim in zip(capitulos, fins):
            titulo = titulo.replace("=", "\\=").replace(";", "\\;").replace("#", "\\#")
            blocos.append(f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={int(inicio * 1000)}\nEND={int(fim * 1000)}\ntitle={titulo}")
        meta.write_text("\n".join(blocos) + "\n", encoding="utf-8")

        comando = ["ffmpeg", "-y", "-v", "error"]
        for clipe in clipes:
            comando += ["-ss", f"{clipe['inicio']:.3f}", "-t", f"{clipe['fim'] - clipe['inicio']:.3f}", "-i", str(editado)]
        k = len(clipes)
        comando += ["-i", str(srt), "-i", str(meta)]
        filtro = "".join(f"[{i}:v][{i}:a]" for i in range(k)) + f"concat=n={k}:v=1:a=1[v0][a];[v0]scale=-2:'min(720,ih)'[v]"
        comando += ["-filter_complex", filtro, "-map", "[v]", "-map", "[a]", "-map", f"{k}:s",
                    "-map_chapters", str(k + 1), "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
                    "-c:a", "aac", "-b:a", "128k", "-c:s", "mov_text", "-metadata:s:s:0", "language=por",
                    "-disposition:s:0", "default", str(saida)]
        resultado = subprocess.run(comando, capture_output=True, text=True)
        if resultado.returncode != 0:
            sys.exit(f"Erro no FFmpeg ao montar a revisão:\n{resultado.stderr[-2000:]}")

    print(f"\nRevisão de cortes: {len(pontos)} pontos ({duvidas} dúvidas) em {mmss(offset)} "
          f"(o vídeo editado tem {mmss(duracao)}).")
    print(f"  {saida}\n  {saida.with_suffix('.txt')}")
    return saida


def main() -> None:
    parser = argparse.ArgumentParser(description="Monta o vídeo de revisão dos cortes (A2-cortes).")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("-t", "--transcricao", type=Path, help="Arquivo de decisões (padrão: edicao/transcricao.json)")
    parser.add_argument("-e", "--editado", type=Path, help="Vídeo editado (padrão: edicao/editado.mp4)")
    parser.add_argument("--margem", type=float, default=2.5, help="Segundos antes e depois de cada ponto (padrão: 2.5)")
    parser.add_argument("--todos", action="store_true", help="Inclui também as emendas que passaram na conferência")
    parser.add_argument("--sem-conferir", action="store_true", help="Não transcreve as emendas (mais rápido)")
    args = parser.parse_args()
    pasta = caminhos.video(args.video)
    gerar(pasta, (args.transcricao or pasta.transcricao).expanduser().resolve(), args.margem, args.editado,
          todos=args.todos, conferir=not args.sem_conferir)


if __name__ == "__main__":
    main()
