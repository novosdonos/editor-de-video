#!/usr/bin/env python3
"""
Transcreve a fala do vídeo com o Parakeet TDT 0.6B v3 (onnx_asr) e gera timestamps por palavra.

Uso:
    .venv/bin/python codigos/02_transcrever_audio.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/02_transcrever_audio.py videos/01-meu-primeiro-video --quantizacao int8
    .venv/bin/python codigos/02_transcrever_audio.py /tmp/referencia.mp4      # vídeo de referência
    Com a pasta do vídeo, lê o áudio direto de brutos/original.<ext> (sem cópia em MP3).
    Arquivo fora de videos/ (referência baixada pela /video-roteiro): grava <arquivo>.json e
    <arquivo>.txt ao lado dele (ou em --saida).

Saída (pasta edicao/ do vídeo):
    transcricao.json  ->  seções "arquivo", "modelo", "duracao" e "palavras":
                          [{"palavra", "inicio", "fim", "confianca"}]; as outras seções são
                          preservadas (ver transcricao.py)
    transcricao.txt   ->  texto bruto, um trecho de fala por linha (o 06 troca pelo final)
Tempos em segundos, a partir do início do áudio do original.

Transcrever de novo muda os índices das palavras e invalida as seções presas a eles (erros,
edicao, cenas, enquadramento): se alguma existir, o script para antes de transcrever; com
--forcar, descarta só essas. "cor" e "trilha" não dependem das palavras e ficam.
"""

import argparse
import math
import shutil
import subprocess
import sys
from collections import deque
from pathlib import Path

import numpy as np
import onnx_asr

import caminhos
import transcricao

MODELO = "nemo-parakeet-tdt-0.6b-v3"
TAXA_AMOSTRAGEM = 16_000
# Pasta local do modelo: o cache padrão do Hugging Face usa symlinks, e o onnxruntime
# recusa carregar o arquivo de pesos externo (encoder-model.onnx.data) através deles.
PASTA_MODELO = Path.home() / ".cache" / "onnx-asr" / MODELO
# Só CPU: com o CoreML (padrão no Mac) o onnxruntime vaza memória a cada trecho
# de tamanho diferente e o processo é morto pelo sistema em áudios longos.
PROVEDORES = ["CPUExecutionProvider"]


def carregar_audio(caminho: Path) -> np.ndarray:
    """Decodifica qualquer formato com FFmpeg para float32 mono 16 kHz."""
    if shutil.which("ffmpeg") is None:
        sys.exit("Erro: FFmpeg não encontrado. Instale com: brew install ffmpeg")
    if not caminho.is_file():
        sys.exit(f"Erro: arquivo não encontrado: {caminho}")

    comando = [
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-i", str(caminho),
        "-vn", "-ac", "1", "-ar", str(TAXA_AMOSTRAGEM),
        "-f", "f32le", "-",
    ]
    resultado = subprocess.run(comando, capture_output=True)
    if resultado.returncode != 0:
        sys.exit(f"Erro: FFmpeg falhou: {resultado.stderr.decode(errors='ignore')}")
    return np.frombuffer(resultado.stdout, dtype=np.float32)


def capturar_duracoes_tdt(modelo) -> deque:
    """
    O onnx_asr devolve só o frame de início de cada token e descarta a duração
    prevista pelo TDT. Este wrapper registra essa duração (em frames) para cada
    token emitido, na mesma ordem em que os tokens são gerados.
    """
    asr = modelo.asr
    duracoes: deque = deque()
    decode_original = asr._decode

    def decode_com_duracao(prev_tokens, prev_state, encoder_out):
        logits, passo, estado = decode_original(prev_tokens, prev_state, encoder_out)
        if logits.argmax() != asr._blank_idx:
            duracoes.append(int(passo))
        return logits, passo, estado

    asr._decode = decode_com_duracao
    return duracoes


def agrupar_palavras(segmento, duracoes_tokens: list[int], frame: float) -> list[dict]:
    """Junta tokens em palavras (token iniciado por espaço abre uma nova palavra)."""
    palavras: list[dict] = []
    tokens = segmento.tokens or []
    tempos = segmento.timestamps or []
    logprobs = segmento.logprobs or [0.0] * len(tokens)

    for i, (token, inicio_rel, logprob) in enumerate(zip(tokens, tempos, logprobs)):
        inicio = segmento.start + inicio_rel
        duracao = duracoes_tokens[i] if i < len(duracoes_tokens) else None
        fim = inicio + max(duracao or 1, 1) * frame

        if not palavras or token.startswith(" "):
            palavras.append({"palavra": "", "inicio": inicio, "fim": fim, "_logprobs": []})
        atual = palavras[-1]
        atual["palavra"] += token
        atual["fim"] = max(atual["fim"], fim)
        atual["_logprobs"].append(logprob)

    for i, p in enumerate(palavras):
        # Sem duração do TDT: o fim nunca ultrapassa o início da próxima palavra
        if i + 1 < len(palavras):
            p["fim"] = min(p["fim"], palavras[i + 1]["inicio"])
        p["fim"] = min(p["fim"], segmento.end)
        p["palavra"] = p["palavra"].strip()
        lps = p.pop("_logprobs")
        p["confianca"] = round(math.exp(sum(lps) / len(lps)), 3)
        p["inicio"] = round(p["inicio"], 3)
        p["fim"] = round(p["fim"], 3)

    return [p for p in palavras if p["palavra"]]


def transcrever(audio: Path, saida: Path, quantizacao: str | None, remover: tuple[str, ...]) -> None:
    print(f"Carregando modelo {MODELO}" + (f" ({quantizacao})" if quantizacao else "") + "...")
    modelo = onnx_asr.load_model(MODELO, PASTA_MODELO, quantization=quantizacao, providers=PROVEDORES)
    duracoes = capturar_duracoes_tdt(modelo)
    frame = modelo.asr.window_step * modelo.asr._subsampling_factor  # 0,08 s por frame

    # O Parakeet não aceita áudios longos de uma vez: o VAD (Silero) quebra em trechos de fala
    vad = onnx_asr.load_vad("silero", providers=PROVEDORES)
    modelo_vad = modelo.with_vad(vad, max_speech_duration_s=20, min_silence_duration_ms=300).with_timestamps()

    print(f"Lendo áudio: {audio.name}")
    onda = carregar_audio(audio)
    duracao_total = len(onda) / TAXA_AMOSTRAGEM
    print(f"Duração: {duracao_total / 60:.1f} min. Transcrevendo...")

    textos, palavras = [], []
    for seg in modelo_vad.recognize(onda, sample_rate=TAXA_AMOSTRAGEM):
        n_tokens = len(seg.tokens or [])
        duracoes_seg = [duracoes.popleft() for _ in range(min(n_tokens, len(duracoes)))]

        texto = seg.text.strip()
        if not texto:
            continue
        textos.append(texto)
        palavras.extend(agrupar_palavras(seg, duracoes_seg, frame))
        print(f"\r  {seg.end / duracao_total:6.1%}  ({seg.end / 60:.1f}/{duracao_total / 60:.1f} min)", end="", flush=True)

    secoes = {"arquivo": audio.name, "modelo": MODELO, "duracao": round(duracao_total, 3), "palavras": palavras}
    transcricao.atualizar(saida, secoes, remover=remover)  # preserva o que 04/05 gravaram em paralelo
    saida_texto = transcricao.salvar_texto(saida, textos)  # um trecho de fala por linha
    print(f"\n\n{len(palavras)} palavras transcritas.")
    print(f"Timestamps salvos em: {saida}")
    print(f"Texto salvo em:       {saida_texto}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Transcreve a fala com Parakeet TDT 0.6B v3 (timestamps por palavra).")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de áudio/vídeo)")
    parser.add_argument("-o", "--saida", type=Path,
                        help="JSON de saída (padrão: edicao/transcricao.json; o .txt vai ao lado)")
    parser.add_argument("-q", "--quantizacao", choices=["int8"], default=None,
                        help="Usa o modelo quantizado (menor e mais rápido, leve perda de precisão)")
    parser.add_argument("--forcar", action="store_true",
                        help="Transcreve de novo mesmo com seções presas às palavras (descarta erros, edicao, cenas...)")
    args = parser.parse_args()

    alvo = args.video.expanduser().resolve()
    if caminhos.dentro_de_videos(alvo):
        video = caminhos.video(alvo)
        audio = alvo if alvo.is_file() else video.original
        saida = (args.saida or video.transcricao).expanduser().resolve()
    else:  # referência fora de videos/: JSON e TXT ao lado do arquivo
        audio = alvo
        saida = (args.saida or alvo.with_suffix(".json")).expanduser().resolve()

    remover: tuple[str, ...] = ()
    if saida.is_file():
        feitas = [s for s in transcricao.PRESAS_AS_PALAVRAS if s in transcricao.carregar(saida)]
        if feitas and not args.forcar:
            sys.exit(f"Erro: {saida.name} já tem as seções {', '.join(feitas)}; transcrever de novo muda os "
                     "índices das palavras e invalida esse trabalho. Use --forcar para descartar.")
        remover = tuple(feitas)

    transcrever(audio, saida, args.quantizacao, remover)


if __name__ == "__main__":
    main()
