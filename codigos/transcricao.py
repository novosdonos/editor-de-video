#!/usr/bin/env python3
"""
Leitura e gravação dos arquivos de decisão de um vídeo, usadas por todos os códigos 01-11.

Um arquivo de decisões por vídeo, edicao/transcricao.json, com uma seção por etapa. Cada etapa
grava SÓ a própria seção (função atualizar): duas etapas rodando em paralelo (02, 04 e 05) nunca
apagam o trabalho uma da outra, e ninguém renderiza em cima do resultado de outra etapa.

    seção            quem grava          o que é
    arquivo/modelo/  02                  origem da transcrição
    duracao
    erros            Claude (03 confere) cortes e correções de fala, por índice de palavra
    cor              05                  correção de imagem por trecho + look do autor
    edicao           06                  trechos mantidos do original, velocidade e assinaturas
                                         do que o render usou (erros, cor)
    cenas            Claude/skill        plano de cenas ancorado em índices de palavra (a fazer)
    enquadramento    09                  rastreio do rosto + planos da câmera (aberto/médio/fechado)
    sfx              10                  efeitos sonoros por evento visual (cenas, destaques, câmera)
    trilha           (a fazer)           BPM, beats e acentos da trilha
    palavras         02                  transcrição com os tempos do original (nunca muda)

Seções presas aos índices de "palavras" (erros, edicao, cenas, enquadramento, sfx) ficam inválidas se
o 02 transcrever de novo; as demais (cor, trilha) continuam valendo.

O relatório da gravação, edicao/qualidade.json, segue a mesma regra: "bruto" (01), "audio" (04)
e "imagem" (05), cada um com os seus alertas.
"""

import hashlib
import importlib.util
import json
import os
import re
import sys
import time
from contextlib import contextmanager
from pathlib import Path

ORDEM_SECOES = ["arquivo", "modelo", "duracao", "erros", "cor", "edicao", "cenas", "enquadramento",
                "sfx", "trilha", "remapa", "conferencia", "palavras"]
PRESAS_AS_PALAVRAS = ("erros", "edicao", "cenas", "enquadramento", "sfx", "conferencia")


def carregar_codigo(arquivo: str):
    """Importa outro código desta pasta (o nome começa com número, então via importlib)."""
    caminho = Path(__file__).resolve().parent / arquivo
    nome = f"_{caminho.stem}"
    if nome in sys.modules:
        return sys.modules[nome]
    spec = importlib.util.spec_from_file_location(nome, caminho)
    modulo = importlib.util.module_from_spec(spec)
    sys.modules[nome] = modulo
    spec.loader.exec_module(modulo)
    return modulo


# --------------------------------------------------------------------------------------------
# Leitura e gravação
# --------------------------------------------------------------------------------------------


def carregar(caminho: Path, exigir: tuple[str, ...] = ()) -> dict:
    """Lê o arquivo; `exigir` = seções que precisam existir (para com mensagem de qual etapa rodar)."""
    if not caminho.is_file():
        sys.exit(f"Erro: {caminho} não encontrado. Rode antes o 02_transcrever_audio.py.")
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erro:
        sys.exit(f"Erro: JSON inválido em {caminho.name}: {erro}")
    etapa = {"palavras": "02_transcrever_audio.py", "erros": "a análise de erros (03)",
             "edicao": "06_remover_silencios.py", "cor": "05_tratar_imagem.py"}
    for secao in exigir:
        if secao not in dados:
            sys.exit(f"Erro: {caminho.name} ainda não tem a seção \"{secao}\". Rode antes {etapa.get(secao, secao)}.")
    return dados


@contextmanager
def _trava(caminho: Path, espera: float = 30.0):
    """Trava simples por arquivo (Mac e Windows): uma etapa grava de cada vez."""
    trava = caminho.with_name(caminho.name + ".trava")
    limite = time.monotonic() + espera
    while True:
        try:
            fd = os.open(trava, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            break
        except FileExistsError:
            if time.time() - trava.stat().st_mtime > 120:  # sobra de um processo que morreu
                trava.unlink(missing_ok=True)
            elif time.monotonic() > limite:
                sys.exit(f"Erro: {trava.name} travado por outra etapa há mais de {espera:.0f} s.")
            time.sleep(0.1)
    try:
        yield
    finally:
        os.close(fd)
        trava.unlink(missing_ok=True)


def _gravar(caminho: Path, dados: dict, ordem: list[str] | None) -> None:
    """Grava num temporário e renomeia: o arquivo nunca fica pela metade se algo falhar."""
    if ordem:
        ordenado = {k: dados[k] for k in ordem if k in dados}
        ordenado.update({k: v for k, v in dados.items() if k not in ordenado})
        if "palavras" in ordenado:  # lista longa sempre no fim, para o arquivo ser fácil de ler
            ordenado["palavras"] = ordenado.pop("palavras")
        dados = ordenado
    caminho.parent.mkdir(parents=True, exist_ok=True)
    temporario = caminho.with_name(caminho.name + ".tmp")
    temporario.write_text(json.dumps(dados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporario, caminho)


def atualizar(caminho: Path, secoes: dict, remover: tuple[str, ...] = ()) -> dict:
    """
    Grava só as seções passadas (e remove as de `remover`), relendo o arquivo do disco na hora:
    o que outra etapa gravou nesse meio-tempo é preservado. Cria o arquivo se não existir.
    """
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with _trava(caminho):
        dados = json.loads(caminho.read_text(encoding="utf-8")) if caminho.is_file() else {}
        for secao in remover:
            dados.pop(secao, None)
        dados.update(secoes)
        _gravar(caminho, dados, ORDEM_SECOES if caminho.name == "transcricao.json" else None)
    return dados


def salvar_texto(caminho_transcricao: Path, linhas: list[str]) -> Path:
    caminho = caminho_transcricao.with_suffix(".txt")
    caminho.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    return caminho


def assinatura(valor) -> str:
    """Identifica o conteúdo de uma seção (o 06 grava o que usou; 07 a 11 conferem se ainda vale)."""
    return hashlib.sha1(json.dumps(valor, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]


def assinatura_dos_cortes(dados: dict) -> str:
    erros = dados.get("erros", {})
    cortes = sorted((c["de"], c["ate"]) for c in erros.get("cortes", []))
    if erros.get("aparar"):  # só entra quando existe: não muda a assinatura de vídeos sem "aparar"
        cortes = [cortes, sorted((a["palavra"], a["manter"]) for a in erros["aparar"])]
    return hashlib.sha1(json.dumps(cortes).encode()).hexdigest()[:12]


def assinatura_da_cor(dados: dict) -> str | None:
    """Só o que muda a imagem (parâmetros por trecho, entrada e look), não as medições."""
    cor = dados.get("cor")
    if not cor:
        return None
    return assinatura({"entrada": cor.get("entrada"), "look": cor.get("look"),
                       "trechos": [{k: t.get(k) for k in ("inicio", "fim", "ajuste")} for t in cor.get("trechos", [])]})


# --------------------------------------------------------------------------------------------
# Linha do tempo do vídeo editado (original -> editado.mp4)
# --------------------------------------------------------------------------------------------


def ajustar_transcricao(transcricao: dict, trechos: list[tuple], velocidade: float = 1.0) -> dict:
    """
    Reposiciona cada palavra na linha do tempo do vídeo editado (já acelerado por `velocidade`).
    Trecho = (início, fim) ou (início, fim, fator): trecho acelerado do 06 (pausa curta ou vogal
    arrastada) dura `fator` vezes menos. No mapa, "emenda" marca o trecho que começa depois de um
    corte de verdade (salto na imagem); trecho acelerado emenda no anterior sem salto.
    """
    mapa, acumulado, fim_anterior = [], 0.0, None
    for t in trechos:
        inicio, fim = t[0], t[1]
        fator = t[2] if len(t) > 2 else 1.0
        dur = (fim - inicio) / (velocidade * fator)
        mapa.append({"inicio_original": round(inicio, 3), "fim_original": round(fim, 3),
                     "inicio": round(acumulado, 3), "fim": round(acumulado + dur, 3), "fator": fator,
                     "emenda": fim_anterior is not None and abs(inicio - fim_anterior) > 1e-4})
        acumulado += dur
        fim_anterior = fim

    def para_editado(t: float, i: int) -> float:
        ini_trecho, fim_trecho = trechos[i][0], trechos[i][1]
        t = min(max(t, ini_trecho), fim_trecho)
        return mapa[i]["inicio"] + (t - ini_trecho) / (velocidade * mapa[i]["fator"])

    palavras_novas, i = [], 0
    for p in transcricao["palavras"]:
        while i < len(trechos) - 1 and p["inicio"] >= trechos[i][1]:
            i += 1
        j = i  # o fim da palavra pode cair num trecho seguinte contíguo (acelerado)
        while j < len(trechos) - 1 and p["fim"] > trechos[j][1] and not mapa[j + 1]["emenda"]:
            j += 1
        inicio = para_editado(p["inicio"], i)
        fim = max(para_editado(p["fim"], j), inicio)
        palavra = {k: v for k, v in p.items() if k != "apos_corte"}
        palavras_novas.append({**palavra, "inicio": round(inicio, 3), "fim": round(fim, 3), "_trecho": i})

    return {"arquivo": transcricao.get("arquivo"), "modelo": transcricao.get("modelo"),
            "duracao": round(acumulado, 3), "duracao_original": transcricao.get("duracao"),
            "trechos": mapa, "palavras": palavras_novas}


def linha_do_tempo(caminho: Path) -> dict:
    """
    Palavras com os tempos do editado.mp4, calculadas de "palavras" + "erros" + "edicao".
    Usada pelo 07 ao 11: {"duracao", "trechos" (mapa original -> editado), "palavras" (com "_trecho")}.
    Para se os cortes mudaram depois do render (o vídeo não corresponde mais à transcrição).
    """
    dados = carregar(caminho, exigir=("palavras", "edicao"))
    edicao = dados["edicao"]
    if edicao.get("cortes") != assinatura_dos_cortes(dados):
        sys.exit("Erro: os cortes da seção \"erros\" mudaram depois do último render; "
                 "o editado.mp4 não corresponde mais à transcrição. Rode o 06 de novo.")
    erros = carregar_codigo("03_remover_erros.py")
    trechos = [tuple(t) for t in edicao["trechos"]]
    return ajustar_transcricao(erros.aplicar_erros(dados, relatorio=False), trechos, edicao.get("velocidade", 1.0))


def avisar_se_desatualizado(caminho: Path) -> list[str]:
    """Camadas que mudaram depois do render do 06 (a cor) e cortes sem a A2-cortes. Devolve os avisos."""
    dados = carregar(caminho)
    edicao = dados.get("edicao", {})
    avisos = []
    if "cor" in edicao and edicao["cor"] != assinatura_da_cor(dados):
        avisos.append("a seção \"cor\" mudou depois do último render: rode o 06 de novo para aplicá-la.")
    aprovada = cortes_aprovados(caminho.parent.parent / "video.md")
    if aprovada != assinatura_dos_cortes(dados):
        avisos.append("os cortes atuais não estão aprovados (A2-cortes do video.md sem a assinatura "
                      f"{assinatura_dos_cortes(dados)}): aprovar a revisão de cortes antes do motion.")
    return avisos


def cortes_aprovados(video_md: Path) -> str | None:
    """Assinatura registrada na linha "A2-cortes:" do cabeçalho do video.md (None se não houver)."""
    if not video_md.is_file():
        return None
    m = re.search(r"^\s*A2-cortes:.*?\b([0-9a-f]{12})\b", video_md.read_text(encoding="utf-8"), re.MULTILINE)
    return m.group(1) if m else None
