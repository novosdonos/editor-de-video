#!/usr/bin/env python3
"""
Onde fica cada arquivo de um vídeo e o que o bruto tem dentro. Todos os códigos 01-08 usam este módulo.

Estrutura (nomes fixos dentro da pasta do vídeo):
    videos/<nn-nome-do-video>/
        video.md                 ->  briefing, roteiro, plano de cenas, correções, aprovações (skills)
        brutos/
            original.<ext>       ->  gravação principal (nenhum código altera, copia ou apaga)
            ...                  ->  hooks, telas e b-roll só deste vídeo
        edicao/
            transcricao.json     ->  arquivo do vídeo: decisões de todas as etapas, uma seção por etapa
                                     (palavras 02, erros 03, cor 05, edicao 06, cenas...; ver transcricao.py)
            transcricao.txt      ->  texto bruto depois do 02, texto final depois do 06
            qualidade.json       ->  relatório da gravação: bruto (01), audio (04), imagem (05)
            audio_tratado.wav    ->  camada de áudio do 04 (lida pelo 06; recriável)
            editado.mp4          ->  único vídeo intermediário: do 06 (cortes + áudio + cor), lido pelo Remotion
            legenda.srt          ->  do 11 (só quando a plataforma pede .srt)
        previas/                 ->  só o que o autor revisa no portão aberto, nomes fixos e sobrescritos
                                     (amostra-<etapa>.mp4, revisao-cortes.*, auditoria.txt, storyboard.*);
                                     apagada ao fechar cada portão e inteira na entrega
        final/
            <plataforma>.mp4     ->  render final do Remotion, um por plataforma

Projeto Remotion (remotion/): o 08 monta remotion/public/<nn-nome-do-video>/ com
        editado.mp4              ->  hard link do editado.mp4 (mesmo arquivo, não ocupa espaço extra)
        aula.json                ->  fps, tamanho, duração e legendas no formato Caption

Configuração do autor: setup/ (perfil, estilo, elementos, plataformas, vocabulário, biblioteca).
Cor do autor: setup/biblioteca/cor/ (look.cube, entrada.cube, referencia.png; ver o 05).

Os códigos recebem a pasta do vídeo ou qualquer arquivo dentro dela (ex.: brutos/original.mov).
"""

import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

PASTA_CODIGOS = Path(__file__).resolve().parent
RAIZ_PROJETO = PASTA_CODIGOS.parent
PASTA_VIDEOS = RAIZ_PROJETO / "videos"
PASTA_REMOTION = RAIZ_PROJETO / "remotion"
PASTA_SETUP = RAIZ_PROJETO / "setup"
PASTA_BIBLIOTECA = PASTA_SETUP / "biblioteca"
PASTA_COR = PASTA_BIBLIOTECA / "cor"
ESTILO = PASTA_SETUP / "estilo.md"
VOCABULARIO = PASTA_SETUP / "vocabulario.md"
EXTENSOES_VIDEO = {".mov", ".mp4", ".m4v", ".mkv", ".avi"}


class Video:
    def __init__(self, pasta: Path):
        self.pasta = pasta
        self.nome = pasta.name
        self.video_md = pasta / "video.md"
        self.pasta_brutos = pasta / "brutos"
        self.pasta_edicao = pasta / "edicao"
        self.pasta_previas = pasta / "previas"
        self.pasta_final = pasta / "final"
        self.audio_tratado = self.pasta_edicao / "audio_tratado.wav"
        self.qualidade = self.pasta_edicao / "qualidade.json"
        self.transcricao = self.pasta_edicao / "transcricao.json"
        self.texto = self.pasta_edicao / "transcricao.txt"
        self.legenda = self.pasta_edicao / "legenda.srt"
        self.editado = self.pasta_edicao / "editado.mp4"
        self.pasta_remotion = PASTA_REMOTION / "public" / self.nome

    def final(self, plataforma: str = "aula") -> Path:
        """Arquivo final de uma plataforma (final/<plataforma>.mp4)."""
        return self.pasta_final / f"{plataforma}.mp4"

    @property
    def original(self) -> Path:
        """brutos/original.<ext> (a extensão é a do bruto: .mov, .mp4...)."""
        achados = sorted(p for p in self.pasta_brutos.glob("original.*") if p.suffix.lower() in EXTENSOES_VIDEO)
        if not achados:
            sys.exit(f"Erro: vídeo original não encontrado em {self.pasta_brutos}\n"
                     "Rode antes o 01_preparar_video.py com o vídeo bruto.")
        return achados[0]


def video(alvo: Path) -> Video:
    """Pasta do vídeo a partir da própria pasta ou de qualquer arquivo dentro dela."""
    alvo = alvo.expanduser().resolve()
    for candidata in [alvo, *alvo.parents]:
        if candidata.parent == PASTA_VIDEOS.resolve():
            return Video(candidata)
    sys.exit(f"Erro: {alvo} não está dentro de uma pasta de vídeo em {PASTA_VIDEOS}/.\n"
             "Passe a pasta do vídeo (ex.: videos/01-meu-primeiro-video) ou rode antes o 01.")


def dentro_de_videos(alvo: Path) -> bool:
    return PASTA_VIDEOS.resolve() in alvo.expanduser().resolve().parents


def nome_da_pasta(nome_do_video: str) -> str:
    """'01 - Meu primeiro video' -> '01-meu-primeiro-video'."""
    texto = unicodedata.normalize("NFKD", nome_do_video.lower())
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    texto = re.sub(r"[^a-z0-9]+", "-", texto).strip("-")
    return re.sub(r"^(\d+)-aula-", r"\1-", texto)


def sondar(arquivo: Path) -> dict:
    """
    O que o arquivo de vídeo tem dentro (ffprobe): tamanho, fps, codec, bits, cor, áudio e o
    desvio de sincronia (quanto o áudio começa depois do vídeo; ~0,19 s no .mov do iPhone).
    Transcrição (02), áudio tratado (04) e cor (05) contam o tempo a partir do início do ÁUDIO.
    """
    resultado = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,pix_fmt,"
         "bits_per_raw_sample,color_transfer,color_primaries,color_space,start_time,duration,sample_rate",
         "-of", "json", str(arquivo)],
        capture_output=True, text=True)
    if resultado.returncode != 0:
        sys.exit(f"Erro: ffprobe falhou em {arquivo.name}: {resultado.stderr}")
    info = json.loads(resultado.stdout)
    trilhas: dict[str, dict] = {}
    for s in info.get("streams", []):
        trilhas.setdefault(s["codec_type"], s)
    v, a = trilhas.get("video", {}), trilhas.get("audio")

    def fracao(texto: str | None) -> float:
        try:
            num, den = (texto or "0/1").split("/")
            return float(num) / float(den) if float(den) else 0.0
        except ValueError:
            return 0.0

    inicio = lambda s: float(s.get("start_time") or 0)
    pix = v.get("pix_fmt", "")
    bits = int(v.get("bits_per_raw_sample") or (10 if "10" in pix else 8))
    fps, fps_medio = fracao(v.get("r_frame_rate")), fracao(v.get("avg_frame_rate"))
    return {
        "largura": v.get("width"), "altura": v.get("height"),
        "fps": round(fps, 3), "fps_variavel": bool(fps and fps_medio and abs(fps - fps_medio) > 0.5),
        "codec": v.get("codec_name"), "bits": bits,
        "cor": {"transferencia": v.get("color_transfer"), "primarias": v.get("color_primaries"),
                "matriz": v.get("color_space")},
        "duracao": round(float(info.get("format", {}).get("duration") or 0), 3),
        "audio": None if not a else {
            "codec": a.get("codec_name"), "taxa": int(a.get("sample_rate") or 0),
            "duracao": round(float(a.get("duration") or 0), 3),
            "desvio": round(inicio(a) - inicio(v), 4) if v else 0.0,
        },
    }
