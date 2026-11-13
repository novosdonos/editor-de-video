#!/usr/bin/env python3
"""
Trata o áudio do vídeo (reparo, limpeza, voz e volume) e salva em WAV sem perda.

Lê direto do vídeo original. Não corta nem desloca nada: a duração sai idêntica, então os
timestamps da transcrição (02) e os cortes (03) continuam valendo para o áudio tratado.
O 06 usa este WAV automaticamente no lugar do áudio do vídeo. Pode rodar em paralelo com o
02 e o 05 (cada um grava só a própria seção).

Por que depois da transcrição: o modelo de transcrição foi treinado com áudio
natural, e compressão e redução de ruído podem criar artefatos que atrapalham.

Uso:
    .venv/bin/python codigos/04_tratar_audio.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/04_tratar_audio.py videos/01-meu-primeiro-video --alvo-lufs -14

Saída (pasta edicao/ do vídeo):
    audio_tratado.wav  ->  camada de áudio (48 kHz, 24 bits, mono), lida pelo 06 a cada render
    qualidade.json     ->  seção "audio" do relatório da gravação: volume, ruído, picos,
                           travadas de conexão e alertas. Consultar antes de editar.

Cadeia (nesta ordem, cada etapa depende da anterior):
    1. Reparo      -> adeclick: estalos e microdescontinuidades de conexão
    2. Limpeza     -> passa-alta 80 Hz (ronco, vibração de mesa) + redução de ruído leve
    3. Voz         -> tira o "embolado" (250 Hz), clareza leve (2,5 kHz) e desce acima de 5 kHz
    4. Dinâmica    -> compressor suave 2:1 (fala com volume mais constante)
    5. Sibilância  -> de-esser forte nos "s", "x" e "f", depois do compressor (o compressor
                      sobe o que é baixo; antes dele, o chiado ficava 6 dB acima do original)
    6. Volume      -> mede o loudness (EBU R128), aplica ganho fixo até o alvo e
                      um limitador de pico (volume constante, sem "respiração")
"""

import argparse
import re
from datetime import datetime
import shutil
import subprocess
import sys
from pathlib import Path

import caminhos
import transcricao

TAXA_AMOSTRAGEM = 48_000

# Padrão para aula online (YouTube normaliza em -14, plataformas de curso e
# Apple em -16). -16 deixa margem para o compressor sem esmagar a voz.
ALVO_LUFS_PADRAO = -16.0
TRUE_PEAK = -1.5   # dBTP: folga para o reencode em AAC da plataforma não clipar

# Limites dos alertas do relatório de qualidade
RUIDO_ALTO = -50.0        # dBFS: ruído de fundo audível depois da normalização
VOLUME_BAIXO = -30.0      # LUFS: gravação baixa, o ganho sobe o ruído junto
VOLUME_ALTO = -12.0       # LUFS: gravação alta, perto de distorcer
PICO_ESTOURADO = -0.1     # dBTP: pico encostando em 0 dB na gravação original
GANHO_ALTO = 12.0         # dB de ganho aplicado no tratamento
VARIACAO_ALTA = 15.0      # LU: volume oscila muito entre trechos
TRAVADAS_MUITAS = 10      # travadas de vídeo (conexão iPhone -> Mac instável)


def cadeia_de_tratamento(ruido_db: float) -> list[str]:
    return [
        # 1. Reparo
        "adeclick=window=55:overlap=75:threshold=4",
        # 2. Limpeza
        "highpass=f=80:poles=2",
        f"afftdn=noise_reduction=10:noise_floor={ruido_db}:track_noise=1",
        # 3. Voz: tira o embolado e dá clareza leve (2,5 kHz); acima de 5 kHz desce, onde mora o chiado
        "equalizer=f=250:t=q:w=1.0:g=-2",
        "equalizer=f=2500:t=q:w=0.8:g=1",
        "highshelf=f=5000:g=-3",
        # 4. Dinâmica suave (2:1)
        "acompressor=threshold=-18dB:ratio=2:attack=15:release=150:knee=6",
        # 5. Sibilância DEPOIS do compressor e forte: a cadeia antiga (presença +2 dB em 3,5 kHz, compressor
        #    3:1, de-esser leve antes dele) subia "s", "x", "f" e respiração 6 dB acima da voz e soava como
        #    chiado/ruído de fundo (aula 01, 2026-11-13). Agora o chiado fica no nível do original.
        "deesser=i=1:m=0.75:f=0.5",
    ]


def rodar_ffmpeg(comando: list[str], capturar: bool = False) -> subprocess.CompletedProcess:
    resultado = subprocess.run(comando, capture_output=capturar, text=capturar)
    if resultado.returncode != 0:
        detalhe = resultado.stderr[-2000:] if capturar else ""
        sys.exit(f"Erro: FFmpeg falhou (código {resultado.returncode}).\n{detalhe}")
    return resultado


def medir_original(entrada: Path) -> dict:
    """Mede a gravação original: volume (EBU R128), variação, pico real e ruído de fundo."""
    comando = [
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(entrada), "-vn", "-ac", "1",
        "-af", "astats=measure_overall=Noise_floor+Peak_level:measure_perchannel=none,"
               "ebur128=peak=true:framelog=quiet",
        "-f", "null", "-",
    ]
    saida = rodar_ffmpeg(comando, capturar=True).stderr
    medidas = ler_ebur128(saida)
    achado = re.search(r"Noise floor dB:\s*(-?[\d.]+)", saida)
    medidas["ruido"] = float(achado.group(1)) if achado else -60.0
    return medidas


def ruido_para_limpeza(ruido: float) -> float:
    """afftdn aceita de -80 a -20; um pouco acima do piso para não comer a voz."""
    return round(min(max(ruido + 4, -80.0), -20.0), 1)


def travadas_de_video(entrada: Path) -> list[dict]:
    """Instantes em que o vídeo ficou sem quadros (conexão engasgou). Vazio se não houver vídeo."""
    comando = ["ffprobe", "-v", "error", "-select_streams", "v:0",
               "-show_entries", "packet=pts_time", "-of", "csv=p=0", str(entrada)]
    resultado = subprocess.run(comando, capture_output=True, text=True)
    tempos = sorted(float(t) for t in resultado.stdout.split() if t.strip() not in ("", "N/A"))
    if len(tempos) < 3:
        return []
    intervalos = [b - a for a, b in zip(tempos, tempos[1:])]
    quadro = sorted(intervalos)[len(intervalos) // 2]
    return [{"tempo": round(a, 2), "duracao_ms": round(d * 1000)}
            for a, d in zip(tempos, intervalos) if d > 1.5 * quadro]


def gerar_alertas(original: dict, ganho: float, travadas: list[dict], duracao: float) -> list[str]:
    alertas = []
    if original["ruido"] > RUIDO_ALTO:
        alertas.append(f"Ruído de fundo alto ({original['ruido']:.0f} dBFS): vai aparecer nas pausas e emendas.")
    if original["I"] < VOLUME_BAIXO:
        alertas.append(f"Gravação baixa ({original['I']:.1f} LUFS): o ganho sobe o ruído junto. Aproximar o microfone.")
    elif original["I"] > VOLUME_ALTO:
        alertas.append(f"Gravação alta ({original['I']:.1f} LUFS): risco de distorção na fonte.")
    if original["pico"] > PICO_ESTOURADO:
        alertas.append(f"Picos de {original['pico']:+.1f} dBTP no original: pode haver distorção que o tratamento não remove.")
    if ganho > GANHO_ALTO:
        alertas.append(f"Ganho alto aplicado ({ganho:+.1f} dB).")
    if original["LRA"] > VARIACAO_ALTA:
        alertas.append(f"Volume oscila muito na gravação ({original['LRA']:.1f} LU).")
    if len(travadas) > TRAVADAS_MUITAS:
        metade = sum(t["tempo"] > duracao / 2 for t in travadas)
        onde = "concentradas na 2ª metade" if metade > 0.7 * len(travadas) else (
               "concentradas na 1ª metade" if metade < 0.3 * len(travadas) else "espalhadas pela gravação")
        alertas.append(f"Conexão instável: {len(travadas)} travadas de vídeo ({onde}). "
                       "Conferir a imagem nesses pontos.")
    return alertas


def duracao_do_arquivo(entrada: Path) -> float:
    comando = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(entrada)]
    resultado = subprocess.run(comando, capture_output=True, text=True)
    try:
        return float(resultado.stdout.strip())
    except ValueError:
        return 0.0


def medir_loudness(entrada: Path, filtros: list[str]) -> float:
    """1ª passada: mede o volume integrado (LUFS) do áudio já tratado, sem gravar nada."""
    comando = [
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(entrada),
        "-vn", "-ac", "1", "-af", ",".join(filtros + ["ebur128=framelog=quiet"]),
        "-f", "null", "-",
    ]
    return ler_ebur128(rodar_ffmpeg(comando, capturar=True).stderr)["I"]


def ler_ebur128(log: str) -> dict:
    """Extrai o resumo final do filtro ebur128 (I em LUFS, LRA em LU, pico em dBTP)."""
    resumo = log[log.rfind("Summary:"):]
    valores = {}
    for chave, padrao in (("I", r"I:\s*(-?[\d.]+)"), ("LRA", r"LRA:\s*(-?[\d.]+)"), ("pico", r"Peak:\s*(-?[\d.]+)")):
        achado = re.search(padrao, resumo)
        valores[chave] = float(achado.group(1)) if achado else float("nan")
    return valores


def tratar_audio(entrada: Path, saida: Path, relatorio: Path, alvo: float) -> None:
    if shutil.which("ffmpeg") is None:
        sys.exit("Erro: FFmpeg não encontrado. Instale com: brew install ffmpeg")
    if not entrada.is_file():
        sys.exit(f"Erro: arquivo não encontrado: {entrada}")

    saida.parent.mkdir(parents=True, exist_ok=True)

    print(f"Tratando áudio de: {entrada.name}")
    print("  Medindo a gravação original...")
    original = medir_original(entrada)
    print(f"  Original: {original['I']} LUFS | pico {original['pico']} dBTP | "
          f"variação (LRA) {original['LRA']} LU | ruído {original['ruido']:.1f} dBFS")
    filtros = cadeia_de_tratamento(ruido_para_limpeza(original["ruido"]))

    print("  Passada 1/2: medindo volume...")
    volume_medido = medir_loudness(entrada, filtros)
    ganho = round(alvo - volume_medido, 2)
    print(f"  Volume após tratamento: {volume_medido} LUFS -> ganho de {ganho:+} dB até {alvo} LUFS")

    # Ganho fixo + limitador em vez do loudnorm: o loudnorm cai no modo dinâmico
    # quando o ganho estoura o pico, e aí o volume "respira" ao longo do vídeo.
    limite = 10 ** ((TRUE_PEAK - 0.5) / 20)   # 0,5 dB extra: o limitador mede pico de amostra, não true peak
    final_da_cadeia = [
        f"volume={ganho}dB",
        f"alimiter=limit={limite:.4f}:attack=5:release=50:level=false",
        "ebur128=peak=true:framelog=quiet",   # só mede o resultado, não altera o áudio
    ]
    comando = [
        "ffmpeg", "-hide_banner", "-nostats", "-y",
        "-i", str(entrada),
        "-vn", "-ac", "1",
        "-af", ",".join(filtros + final_da_cadeia),
        "-ar", str(TAXA_AMOSTRAGEM),
        "-c:a", "pcm_s24le",
        str(saida),
    ]
    print("  Passada 2/2: aplicando tratamento...")
    final = ler_ebur128(rodar_ffmpeg(comando, capturar=True).stderr)
    print(f"  Resultado: {final['I']} LUFS | pico {final['pico']} dBTP | variação (LRA) {final['LRA']} LU")

    duracao = duracao_do_arquivo(entrada)
    travadas = travadas_de_video(entrada)
    alertas = gerar_alertas(original, ganho, travadas, duracao)
    dados = {
        "arquivo": entrada.name,
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
        "duracao": round(duracao, 3),
        "original": {"volume_lufs": original["I"], "variacao_lu": original["LRA"],
                     "pico_dbtp": original["pico"], "ruido_dbfs": round(original["ruido"], 1)},
        "tratado": {"arquivo": saida.name, "volume_lufs": final["I"], "variacao_lu": final["LRA"],
                    "pico_dbtp": final["pico"], "ganho_aplicado_db": ganho},
        "travadas_de_video": travadas,
        "alertas": alertas,
    }
    transcricao.atualizar(relatorio, {"audio": dados})

    print(f"\n{len(alertas)} alerta(s) de qualidade:" if alertas else "\nSem alertas de qualidade.")
    for alerta in alertas:
        print(f"  - {alerta}")
    print(f"\nÁudio tratado salvo em: {saida}")
    print(f"Relatório salvo em:     {relatorio} (seção \"audio\")")


def main() -> None:
    parser = argparse.ArgumentParser(description="Trata o áudio do vídeo (reparo, limpeza, voz e volume).")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("-e", "--entrada", type=Path,
                        help="Vídeo ou áudio sem perda a tratar (padrão: o original do vídeo)")
    parser.add_argument(
        "-o", "--saida", type=Path,
        help="Caminho do WAV de saída (padrão: edicao/audio_tratado.wav)",
    )
    parser.add_argument(
        "--alvo-lufs", type=float, default=ALVO_LUFS_PADRAO,
        help=f"Volume integrado alvo em LUFS (padrão: {ALVO_LUFS_PADRAO}; use -14 para YouTube)",
    )
    args = parser.parse_args()

    video = caminhos.video(args.video)
    entrada = (args.entrada or video.original).expanduser().resolve()
    saida = (args.saida or video.audio_tratado).expanduser().resolve()
    relatorio = video.qualidade

    tratar_audio(entrada, saida, relatorio, args.alvo_lufs)


if __name__ == "__main__":
    main()
