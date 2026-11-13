#!/usr/bin/env python3
"""
Cria (ou usa) a pasta do vídeo, põe o bruto em brutos/original.<ext> e registra o que ele tem
dentro (resolução, fps, codec, cor, áudio, desvio de sincronia) no relatório da gravação.

Uso:
    .venv/bin/python codigos/01_preparar_video.py "01 - Meu primeiro video.mov"
    .venv/bin/python codigos/01_preparar_video.py "bruto.mov" --nome 02-objecoes
    .venv/bin/python codigos/01_preparar_video.py videos/01-meu-primeiro-video

Vídeo bruto (de qualquer pasta):
    vira videos/<nn-nome>/brutos/original.<ext>; o nome da pasta sai do nome do arquivo
    ("01 - Meu primeiro video" -> "01-meu-primeiro-video") ou de --nome.
    Se a pasta já existe (criada pela skill de roteiro) e ainda não tem original, o bruto entra nela.
    O vídeo é só movido (nunca copiado, recodificado ou apagado).
Bruto já dentro de videos/<nome>/brutos/ com outro nome (ex.: IMG_4821.mov): vira original.<ext>.
Pasta do vídeo (ou o original dela): só registra o bruto de novo.

Saída:
    edicao/qualidade.json, seção "bruto"  ->  ficha técnica + alertas; a skill compara com o perfil.md §7

Não extrai áudio: 02, 04 e 05 leem direto do original (nenhuma cópia do bruto).
"""

import argparse
import shutil
import sys
from pathlib import Path

import caminhos
import transcricao


def preparar(alvo: Path, nome: str | None) -> caminhos.Video:
    """Devolve o vídeo; se for um bruto fora de videos/, cria a pasta e move para ela."""
    if alvo.is_dir():
        return caminhos.video(alvo)
    if caminhos.dentro_de_videos(alvo):
        video = caminhos.video(alvo)
        if alvo.parent == video.pasta_brutos and alvo.stem != "original" and not any(video.pasta_brutos.glob("original.*")):
            destino = video.pasta_brutos / f"original{alvo.suffix.lower()}"
            alvo.rename(destino)
            print(f"Bruto renomeado para: brutos/{destino.name}")
        return video
    if not alvo.is_file():
        sys.exit(f"Erro: vídeo não encontrado: {alvo}")
    if alvo.suffix.lower() not in caminhos.EXTENSOES_VIDEO:
        sys.exit(f"Erro: {alvo.name} não é um vídeo ({', '.join(sorted(caminhos.EXTENSOES_VIDEO))}).")

    video = caminhos.Video(caminhos.PASTA_VIDEOS / (nome or caminhos.nome_da_pasta(alvo.stem)))
    if any(video.pasta_brutos.glob("original.*")):
        sys.exit(f"Erro: a pasta {video.pasta} já tem um vídeo original. Use --nome para outro vídeo.")
    destino = video.pasta_brutos / f"original{alvo.suffix.lower()}"
    video.pasta_brutos.mkdir(parents=True, exist_ok=True)
    shutil.move(str(alvo), destino)
    print(f"Pasta do vídeo: {video.pasta}\nBruto movido para: brutos/{destino.name}")
    return video


def alertas_do_bruto(info: dict) -> list[str]:
    alertas = []
    if not info["audio"]:
        alertas.append("Sem trilha de áudio: o fluxo de edição (transcrição e cortes) precisa da voz.")
    if info["fps_variavel"]:
        alertas.append(f"Taxa de quadros variável ({info['fps']} fps nominal): o 06 converte para fps fixo.")
    altura = min(info["largura"] or 0, info["altura"] or 0)
    if altura and altura < 1080:
        alertas.append(f"Resolução baixa ({info['largura']}x{info['altura']}): zoom fechado limitado e "
                       "cortes verticais (9:16) ficam com pouca definição.")
    elif altura and altura < 2160:
        alertas.append("Abaixo de 4K: cortes verticais (9:16) de vídeo horizontal ficam com ~600 px de largura.")
    if info["audio"] and abs(info["audio"]["desvio"]) > 0.001:
        alertas.append(f"Áudio começa {info['audio']['desvio'] * 1000:.0f} ms depois do vídeo (o 06 compensa).")
    return alertas


def main() -> None:
    parser = argparse.ArgumentParser(description="Cria a pasta do vídeo, move o bruto e registra a ficha técnica.")
    parser.add_argument("video", type=Path, help="Vídeo bruto, ou a pasta do vídeo já criada")
    parser.add_argument("-n", "--nome", help="Nome da pasta do vídeo (padrão: tirado do nome do arquivo)")
    args = parser.parse_args()

    for programa in ("ffmpeg", "ffprobe"):
        if shutil.which(programa) is None:
            sys.exit("Erro: FFmpeg não encontrado. Rode python3 codigos/verificar_ambiente.py.")

    video = preparar(args.video.expanduser().resolve(), args.nome)
    original = video.original
    info = caminhos.sondar(original)
    alertas = alertas_do_bruto(info)
    transcricao.atualizar(video.qualidade, {"bruto": {"arquivo": original.name, **info, "alertas": alertas}})

    cor = info["cor"]
    print(f"\nBruto: {original.name} | {info['largura']}x{info['altura']} | {info['fps']:g} fps | "
          f"{info['codec']} {info['bits']} bits | cor {cor['transferencia'] or '?'}/{cor['primarias'] or '?'} | "
          f"{info['duracao'] / 60:.1f} min")
    for alerta in alertas:
        print(f"  - {alerta}")
    print(f"Ficha salva em: {video.qualidade} (seção \"bruto\")")


if __name__ == "__main__":
    main()
