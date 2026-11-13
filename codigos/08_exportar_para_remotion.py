#!/usr/bin/env python3
"""
Prepara o vídeo para o Remotion: liga o editado.mp4 em remotion/public/<video>/ e grava as
legendas palavra a palavra, com os tempos do vídeo editado, no formato Caption do @remotion/captions.

Uso:
    .venv/bin/python codigos/08_exportar_para_remotion.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/08_exportar_para_remotion.py videos/01-meu-primeiro-video --max-caracteres 40

Entrada:
    edicao/editado.mp4       ->  vídeo do 06 (cortes + áudio + cor)
    edicao/transcricao.json  ->  precisa da seção "edicao" do 06; avisa se a cor mudou depois do render

Saída (em remotion/public/<video>/):
    editado.mp4  ->  hard link do edicao/editado.mp4 (mesmo arquivo, sem cópia)
    aula.json    ->  {"fps", "largura", "altura", "duracao", "legendas": [Caption...],
                      "camera" (seção "enquadramento" do 09, se existir e valer para estes cortes),
                      "sfx" (seção "sfx" do 10, idem)}
O 09 e o 10 chamam exportar() no fim; rodar o 08 de novo nunca perde câmera nem sons.

Cada palavra vira um Caption ({"text", "startMs", "endMs", "timestampMs", "confidence"}).
"pageBreakAfter": true marca o fim de cada bloco de legenda, agrupado pelas mesmas regras do 11
(fim de frase, pausa, corte do vídeo, tamanho máximo).

Depois: cd remotion && npm run dev, e escolher o vídeo no campo "aula" da composição "Aula".
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import caminhos
import transcricao

def info_do_video(video: Path) -> tuple[int, int, float]:
    """(largura, altura, fps) da trilha de vídeo."""
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,r_frame_rate", "-of", "json", str(video)],
        capture_output=True, text=True, check=True,
    )
    stream = json.loads(saida.stdout)["streams"][0]
    num, den = stream["r_frame_rate"].split("/")
    return stream["width"], stream["height"], float(num) / float(den)


def ligar_video(origem: Path, destino: Path) -> str:
    """Hard link do editado.mp4 (refaz se o 06 gerou um arquivo novo). Cai para cópia se não der."""
    if destino.exists():
        if os.path.samefile(origem, destino):
            return "já ligado"
        destino.unlink()
    try:
        os.link(origem, destino)
        return "hard link"
    except OSError:
        shutil.copy2(origem, destino)
        return "cópia (hard link não suportado neste disco)"


def camadas(caminho: Path) -> dict:
    """Seções do 09 (câmera) e do 10 (sons) que valem para os cortes atuais, no formato do aula.json."""
    dados = transcricao.carregar(caminho)
    cortes = transcricao.assinatura_dos_cortes(dados)
    saida = {}
    for secao, chave, etapa in (("enquadramento", "camera", "09"), ("sfx", "sfx", "10")):
        valor = dados.get(secao)
        if not valor:
            continue
        if valor.get("cortes") != cortes:
            print(f"Atenção: a seção \"{secao}\" é de outros cortes; rode o {etapa} de novo (fica fora do aula.json).")
            continue
        saida[chave] = {k: v for k, v in valor.items() if k not in ("cortes", "linha")}
    return saida


def criar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Exporta vídeo editado e legendas para o Remotion.")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("-c", "--max-caracteres", type=int, default=32,
                        help="Máximo de caracteres por bloco de legenda (padrão: 32)")
    parser.add_argument("-l", "--linhas", type=int, default=1, help="Linhas por bloco (padrão: 1)")
    parser.add_argument("--duracao-maxima", type=float, default=3.0,
                        help="Duração máxima da fala de um bloco, em segundos (padrão: 3.0)")
    parser.add_argument("--pausa", type=float, default=0.5,
                        help="Pausa entre palavras que fecha o bloco, em segundos (padrão: 0.5)")
    return parser


def exportar(pasta: Path, opcoes: list[str] | None = None) -> None:
    """Chamado pelo 09 e pelo 10 depois de gravar a própria seção."""
    executar(criar_parser().parse_args([str(pasta), *(opcoes or [])]))


def main() -> None:
    executar(criar_parser().parse_args())


def executar(args: argparse.Namespace) -> None:
    gerar_legenda = transcricao.carregar_codigo("11_gerar_legenda.py")
    video = caminhos.video(args.video)
    if not video.editado.exists():
        sys.exit(f"Erro: {video.editado} não existe. Rode antes o 06_remover_silencios.py.")

    editada = transcricao.linha_do_tempo(video.transcricao)
    for aviso in transcricao.avisar_se_desatualizado(video.transcricao):
        print(f"Atenção: {aviso}")
    palavras = [p for p in gerar_legenda.marcar_trechos(editada) if p["palavra"].strip()]
    if not palavras:
        sys.exit("Erro: a transcrição não tem palavras.")
    blocos = gerar_legenda.agrupar(palavras, args)

    legendas = []
    for bloco in blocos:
        for n, p in enumerate(bloco):
            inicio, fim = round(p["inicio"] * 1000), round(p["fim"] * 1000)
            legenda = {
                "text": (" " if n else "") + p["palavra"],
                "startMs": inicio,
                "endMs": max(fim, inicio + 1),
                "timestampMs": round((inicio + fim) / 2),
                "confidence": p.get("confianca"),
            }
            if n == len(bloco) - 1:
                legenda["pageBreakAfter"] = True
            legendas.append(legenda)

    largura, altura, fps = info_do_video(video.editado)
    duracao = editada.get("duracao") or palavras[-1]["fim"]

    extras = camadas(video.transcricao)
    video.pasta_remotion.mkdir(parents=True, exist_ok=True)
    modo = ligar_video(video.editado, video.pasta_remotion / "editado.mp4")
    (video.pasta_remotion / "aula.json").write_text(
        json.dumps({"fps": fps, "largura": largura, "altura": altura, "duracao": duracao,
                    "legendas": legendas, **extras}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )

    print(f"Vídeo: {video.nome} ({largura}x{altura}, {fps:g} fps, {duracao / 60:.1f} min)")
    print(f"{len(legendas)} palavras em {len(blocos)} blocos de legenda")
    print(f"Vídeo: {modo}")
    if extras:
        print("Camadas: " + ", ".join(f"{k} ({len(v.get('planos', v.get('eventos', [])))} itens)" for k, v in extras.items()))
    print(f"Pronto em: {video.pasta_remotion}")


if __name__ == "__main__":
    main()
