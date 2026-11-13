#!/usr/bin/env python3
"""
Gera a legenda (.srt) do vídeo editado a partir do arquivo de decisões, agrupando as palavras
em blocos com o tempo de início e fim de cada um.

Uso:
    .venv/bin/python codigos/11_gerar_legenda.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/11_gerar_legenda.py videos/01-meu-primeiro-video --linhas 1 --max-caracteres 32

Entrada:
    edicao/transcricao.json  ->  precisa da seção "edicao" do 06, de onde sai o tempo de cada
                                  palavra no vídeo editado

Saída:
    edicao/legenda.srt  ->  legenda do editado.mp4 (para subir na plataforma junto com o vídeo)

Regras dos blocos:
    - um bloco termina no fim da frase (. ? !), numa pausa maior que --pausa ou num corte do
      vídeo (troca de trecho do 06), para a legenda não atravessar a emenda;
    - um bloco tem no máximo --linhas linhas de --max-caracteres e dura no máximo --duracao-maxima;
      quando estoura, quebra na vírgula mais próxima do fim, se houver, e nunca deixa
      artigo/preposição/conjunção solto no fim do bloco ("de", "a", "que", "e"...);
    - cada bloco fica na tela pelo menos --duracao-minima (estende até o início do próximo)
      e some até --extensao segundos depois da última palavra, sem encostar no próximo.
"""

import argparse
import re
import sys
from pathlib import Path

import caminhos
import transcricao

FIM_DE_FRASE = re.compile(r"[.?!…]\W*$")
VIRGULA = re.compile(r"[,;:]\W*$")
PALAVRAS_FRACAS = {
    "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "da", "do", "das", "dos", "em", "na",
    "no", "nas", "nos", "e", "ou", "que", "se", "por", "pra", "para", "com", "ao", "à", "aos",
    "às", "num", "numa", "mas", "nem", "eu", "tu", "você", "ele", "ela", "me", "te", "lhe",
}
INTERVALO_ENTRE_BLOCOS = 0.04  # folga entre o fim de um bloco e o início do próximo


def tamanho(palavras: list[dict]) -> int:
    return len(" ".join(p["palavra"] for p in palavras))


def fraca(palavra: dict) -> bool:
    return re.sub(r"[^\w]", "", palavra["palavra"].lower()) in PALAVRAS_FRACAS


def quebrar_em_linhas(texto: str, max_caracteres: int, linhas: int) -> list[str]:
    """Divide o texto em até `linhas` linhas, o mais equilibradas possível."""
    if linhas <= 1 or len(texto) <= max_caracteres:
        return [texto]
    palavras = texto.split()
    melhor, melhor_custo = None, None
    for i in range(1, len(palavras)):
        a, b = " ".join(palavras[:i]), " ".join(palavras[i:])
        custo = max(len(a), len(b)) + (3 if palavras[i - 1].lower().strip(",.") in PALAVRAS_FRACAS else 0)
        if melhor_custo is None or custo < melhor_custo:
            melhor, melhor_custo = [a, b], custo
    return melhor


def cabe(bloco: list[dict], args) -> bool:
    if tamanho(bloco) > args.max_caracteres * args.linhas:
        return False
    if args.linhas > 1 and len(bloco) > 1:  # confere se as linhas equilibradas respeitam o limite
        linhas = quebrar_em_linhas(" ".join(p["palavra"] for p in bloco), args.max_caracteres, args.linhas)
        if any(len(l) > args.max_caracteres for l in linhas):
            return False
    return bloco[-1]["fim"] - bloco[0]["inicio"] <= args.duracao_maxima


def dividir(segmento: list[dict], args) -> list[list[dict]]:
    """
    Divide uma frase que não cabe num bloco no menor número de blocos que cabem, com tamanhos
    equilibrados (sem sobrar uma palavra sozinha), preferindo quebrar em vírgula e evitando
    terminar bloco em palavra fraca. Programação dinâmica sobre os pontos de quebra.
    """
    n = len(segmento)
    if cabe(segmento, args):
        return [segmento]
    # melhor[j] = (n_blocos, custo, i): melhor divisão de segmento[:j] com último bloco segmento[i:j]
    melhor: list[tuple | None] = [None] * (n + 1)
    melhor[0] = (0, 0.0, 0)
    for j in range(1, n + 1):
        for i in range(j - 1, -1, -1):
            bloco = segmento[i:j]
            if len(bloco) > 1 and not cabe(bloco, args):
                break  # blocos que começam antes também não cabem
            if melhor[i] is None:
                continue
            custo = (args.max_caracteres * args.linhas - tamanho(bloco)) ** 2 / 100
            if j < n:
                if VIRGULA.search(bloco[-1]["palavra"]):
                    custo -= 20
                elif fraca(bloco[-1]):
                    custo += 40
            candidato = (melhor[i][0] + 1, melhor[i][1] + custo, i)
            if melhor[j] is None or candidato[:2] < melhor[j][:2]:
                melhor[j] = candidato
    blocos, j = [], n
    while j > 0:
        i = melhor[j][2]
        blocos.append(segmento[i:j])
        j = i
    return blocos[::-1]


def agrupar(palavras: list[dict], args) -> list[list[dict]]:
    """Separa em frases (fim de frase, pausa longa ou corte do vídeo) e divide as que não cabem."""
    segmentos, atual = [], []
    for i, p in enumerate(palavras):
        if atual:
            anterior = palavras[i - 1]
            if (FIM_DE_FRASE.search(anterior["palavra"]) or p["inicio"] - anterior["fim"] > args.pausa
                    or p["_trecho"] != anterior["_trecho"]):
                segmentos.append(atual)
                atual = []
        atual.append(p)
    if atual:
        segmentos.append(atual)
    return [bloco for segmento in segmentos for bloco in dividir(segmento, args)]


def marcar_trechos(editada: dict) -> list[dict]:
    """Trecho do vídeo editado de cada palavra, pelos limites de "trechos" (só nos cortes de verdade:
    trecho acelerado do 06 continua o anterior, sem salto)."""
    mapa = editada.get("trechos", [])
    fins = [t["fim"] for k, t in enumerate(mapa) if k + 1 == len(mapa) or mapa[k + 1].get("emenda", True)]
    palavras, k = [], 0
    for p in editada["palavras"]:
        while k < len(fins) - 1 and p["inicio"] >= fins[k] - 1e-3:
            k += 1
        palavras.append({**p, "_trecho": k})
    return palavras


def calcular_tempos(blocos: list[list[dict]], duracao: float, args) -> list[tuple[float, float, str]]:
    legendas = []
    for n, bloco in enumerate(blocos):
        inicio = bloco[0]["inicio"]
        limite = blocos[n + 1][0]["inicio"] - INTERVALO_ENTRE_BLOCOS if n + 1 < len(blocos) else duracao
        fim = min(bloco[-1]["fim"] + args.extensao, limite)
        fim = max(fim, min(inicio + args.duracao_minima, limite), bloco[-1]["fim"])
        texto = " ".join(p["palavra"] for p in bloco)
        legendas.append((inicio, fim, "\n".join(quebrar_em_linhas(texto, args.max_caracteres, args.linhas))))
    return legendas


def tempo_srt(segundos: float) -> str:
    ms = max(0, round(segundos * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera a legenda .srt do vídeo editado.")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("-t", "--transcricao", type=Path,
                        help="Arquivo de decisões (padrão: edicao/transcricao.json)")
    parser.add_argument("-o", "--saida", type=Path, help="Arquivo .srt (padrão: edicao/legenda.srt)")
    parser.add_argument("-c", "--max-caracteres", type=int, default=42,
                        help="Máximo de caracteres por linha (padrão: 42)")
    parser.add_argument("-l", "--linhas", type=int, default=2, help="Máximo de linhas por bloco (padrão: 2)")
    parser.add_argument("--duracao-maxima", type=float, default=6.0,
                        help="Duração máxima da fala de um bloco, em segundos (padrão: 6.0)")
    parser.add_argument("--duracao-minima", type=float, default=1.0,
                        help="Tempo mínimo de um bloco na tela, em segundos (padrão: 1.0)")
    parser.add_argument("--pausa", type=float, default=0.6,
                        help="Pausa entre palavras que fecha o bloco, em segundos (padrão: 0.6)")
    parser.add_argument("--extensao", type=float, default=0.3,
                        help="Tempo que o bloco fica na tela após a última palavra (padrão: 0.3)")
    args = parser.parse_args()

    video = caminhos.video(args.video)
    caminho = (args.transcricao or video.transcricao).expanduser().resolve()
    editada = transcricao.linha_do_tempo(caminho)
    saida = (args.saida or video.legenda).expanduser().resolve()

    palavras = [p for p in marcar_trechos(editada) if p["palavra"].strip()]
    if not palavras:
        sys.exit("Erro: a transcrição não tem palavras.")
    duracao = editada.get("duracao") or palavras[-1]["fim"]

    blocos = agrupar(palavras, args)
    legendas = calcular_tempos(blocos, duracao, args)

    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(
        "\n".join(f"{n}\n{tempo_srt(ini)} --> {tempo_srt(fim)}\n{texto}\n"
                  for n, (ini, fim, texto) in enumerate(legendas, 1)),
        encoding="utf-8",
    )

    duracoes = [fim - ini for ini, fim, _ in legendas]
    print(f"Transcrição: {caminho.name} ({len(palavras)} palavras)")
    print(f"{len(legendas)} blocos de legenda (média {sum(duracoes) / len(duracoes):.1f}s, "
          f"máx. {max(duracoes):.1f}s)")
    print(f"Legenda salva em: {saida}")


if __name__ == "__main__":
    main()
