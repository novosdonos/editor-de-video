#!/usr/bin/env python3
"""
Confere se a máquina tem tudo o que o editor de vídeo precisa e diz como instalar o que falta.

Uso (de qualquer lugar; não precisa do .venv para rodar):
    python3 codigos/verificar_ambiente.py            # conferência rápida
    python3 codigos/verificar_ambiente.py --teste    # + teste curto (renderizar 1 frame no Remotion)

Saída: uma linha por item ("ok" ou "FALTA" + comando para resolver). Código de saída 0 se tudo ok, 1 se falta algo.
As skills /video-roteiro e /video-editar rodam este script antes de começar.

Regras aprendidas na prática (não mudar sem motivo):
- onnxruntime só em CPU: com CoreML o macOS mata o processo em áudio longo.
- Modelo do Parakeet em ~/.cache/onnx-asr/: o cache padrão do Hugging Face usa symlinks que o onnxruntime recusa.
- Tudo dentro do .venv: o Python do Homebrew bloqueia instalação global (PEP 668).
- ffmpeg sem libass não é problema: a legenda é desenhada no Remotion.
"""

import argparse
import platform
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WINDOWS = platform.system() == "Windows"
VENV_PY = RAIZ / ".venv" / ("Scripts/python.exe" if WINDOWS else "bin/python")
ESPACO_MINIMO_GB = 30
MODULOS = ["onnx_asr", "onnxruntime", "cv2", "PIL", "numpy", "librosa", "rembg"]
MODELO_PARAKEET = Path.home() / ".cache" / "onnx-asr" / "nemo-parakeet-tdt-0.6b-v3"
MODELO_ROSTO = Path.home() / ".cache" / "opencv" / "face_detection_yunet_2023mar.onnx"
URL_ROSTO = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"

problemas: list[str] = []


def item(nome: str, ok: bool, como_resolver: str = "") -> None:
    print(f"{'ok   ' if ok else 'FALTA'}  {nome}" + ("" if ok else f"\n       -> {como_resolver}"))
    if not ok:
        problemas.append(nome)


def instalar(mac: str, win: str) -> str:
    return win if WINDOWS else mac


def rodar(comando: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(comando, capture_output=True, text=True, **kw)


def main() -> None:
    parser = argparse.ArgumentParser(description="Confere o ambiente do editor de vídeo.")
    parser.add_argument("--teste", action="store_true", help="Roda também um teste curto de transcrição e render")
    args = parser.parse_args()

    print(f"Sistema: {platform.system()} {platform.machine()}\n")
    if not WINDOWS:
        item("Homebrew", shutil.which("brew") is not None,
             'instale você mesmo no Terminal (pede a senha do Mac): /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')
    item("ffmpeg", shutil.which("ffmpeg") is not None, instalar("brew install ffmpeg", "winget install Gyan.FFmpeg"))
    item("ffprobe", shutil.which("ffprobe") is not None, instalar("brew install ffmpeg", "winget install Gyan.FFmpeg"))
    item("Node.js", shutil.which("node") is not None, instalar("brew install node", "winget install OpenJS.NodeJS"))
    item("yt-dlp", shutil.which("yt-dlp") is not None, instalar("brew install yt-dlp", "winget install yt-dlp.yt-dlp"))

    if not WINDOWS:
        # O python3 da Apple (Xcode) é antigo para as versões do requirements.txt; o .venv nasce do Python do Homebrew.
        # Versão fixa (a testada): o python mais novo do Homebrew pode ainda não ter as bibliotecas prontas.
        item("Python 3.14 do Homebrew", shutil.which("brew") is not None and Path(rodar(["brew", "--prefix"]).stdout.strip() or "/opt/homebrew", "bin", "python3.14").exists(),
             "brew install python@3.14")
    item(".venv do projeto", VENV_PY.is_file(),
         instalar('"$(brew --prefix)/bin/python3.14" -m venv .venv && .venv/bin/pip install -r codigos/requirements.txt',
                  "py -m venv .venv && .venv\\Scripts\\pip install -r codigos\\requirements.txt"))
    if VENV_PY.is_file():
        faltam = rodar([str(VENV_PY), "-c", "import importlib.util as u;print(','.join(m for m in %r if u.find_spec(m) is None))" % MODULOS]).stdout.strip()
        item("bibliotecas Python (" + ", ".join(MODULOS) + ")", not faltam,
             f"faltam: {faltam} -> " + instalar(".venv/bin/pip install -r codigos/requirements.txt", ".venv\\Scripts\\pip install -r codigos\\requirements.txt"))
        coreml = rodar([str(VENV_PY), "-c", "import onnxruntime as o;print('CoreMLExecutionProvider' in o.get_available_providers())"]).stdout.strip()
        if coreml == "True":
            print("aviso  onnxruntime tem CoreML disponível: o 02 força CPU (com CoreML o macOS mata o processo em áudio longo)")

    # Não é falta: o 02 baixa sozinho na primeira transcrição. Se contasse como falta, o --teste nunca rodaria numa instalação nova.
    parakeet = MODELO_PARAKEET.is_dir() and any(MODELO_PARAKEET.glob("*.onnx"))
    print(f"{'ok   ' if parakeet else 'depois'}  modelo de transcrição (Parakeet)" + ("" if parakeet else " -> baixado sozinho na primeira transcrição (~600 MB, ~/.cache/onnx-asr/)"))
    item("modelo de rosto (YuNet)", MODELO_ROSTO.is_file(),
         f"mkdir -p ~/.cache/opencv && curl -L -o {MODELO_ROSTO} {URL_ROSTO}")

    remotion = RAIZ / "remotion"
    item("Remotion (node_modules)", (remotion / "node_modules" / "remotion").is_dir(), "cd remotion && npm install")
    item("esbuild (linha do tempo para o 09 e o 10)", (remotion / "node_modules" / "esbuild").is_dir(), "cd remotion && npm install")
    navegador = list((remotion / "node_modules" / ".remotion").glob("chrome-headless-shell*")) if (remotion / "node_modules" / ".remotion").is_dir() else []
    item("navegador do Remotion", bool(navegador), "cd remotion && npx remotion browser ensure")
    pw = (remotion / "node_modules" / "playwright").is_dir()
    print(f"{'ok   ' if pw else 'depois'}  Playwright (gravação de tela)" + ("" if pw else " -> ainda não usado no fluxo; entra junto com a gravação automática de telas"))

    livre = shutil.disk_usage(RAIZ).free / 1e9
    item(f"espaço livre ({livre:.0f} GB)", livre >= ESPACO_MINIMO_GB,
         f"libere espaço: o fluxo precisa de ~{ESPACO_MINIMO_GB} GB (modelos, Remotion, bruto 4K e intermediários)")

    if args.teste and not problemas:
        print("\nTeste curto...")
        teste_render = rodar(["npx", "remotion", "still", "Teste", "--frame=0", "--output=" + str(Path(tempfile.gettempdir()) / "editor-teste.png")], cwd=remotion, shell=WINDOWS)
        item("render de 1 frame no Remotion", teste_render.returncode == 0, (teste_render.stderr or teste_render.stdout)[-300:])

    print("\nTudo certo." if not problemas else f"\n{len(problemas)} item(ns) faltando.")
    sys.exit(0 if not problemas else 1)


if __name__ == "__main__":
    main()
