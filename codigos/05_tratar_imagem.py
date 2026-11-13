#!/usr/bin/env python3
"""
Trata a imagem do vídeo: mede exposição, balanço de branco e contraste no rosto ao longo da
gravação e decide a correção de cor por trecho. Não renderiza nada: grava a decisão na seção
"cor" do edicao/transcricao.json e o 06 aplica tudo no mesmo render dos cortes (encode único).

Uso:
    .venv/bin/python codigos/05_tratar_imagem.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/05_tratar_imagem.py videos/01-meu-primeiro-video --segmento-minimo 60
    .venv/bin/python codigos/05_tratar_imagem.py videos/<piloto> --gerar-referencia 12.5

Pode rodar em paralelo com o 02 e o 04: lê só o original e grava só a própria seção.

Três camadas, nesta ordem (o 06 monta o filtro):
    1. entrada     ->  conversão do perfil da câmera para Rec.709 (ex.: Apple Log). LUT em
                       setup/biblioteca/cor/entrada.cube; aplicada quando o bruto não está marcado
                       como Rec.709 (ou com --entrada sim/nao)
    2. ajuste      ->  correção adaptativa, por trecho (a luz pode mudar durante a gravação):
                       ganho de vermelho/azul (balanço de branco), gama (exposição do rosto) e
                       contraste (com pivô na luz do rosto, que não sai do lugar)
    3. look        ->  identidade fixa do autor: setup/biblioteca/cor/look.cube; sem LUT, o primeiro
                       filtro ffmpeg entre crases da seção "## 7. Cor" do setup/estilo.md

Alvo da correção:
    - com setup/biblioteca/cor/referencia.png (frame aprovado do vídeo-piloto, já convertido pela
      entrada e SEM look; gerado com --gerar-referencia): copia a luz do rosto, o tom dos neutros e
      o contraste da referência;
    - sem referência: só corrige o que está claramente fora (rosto fora de 0,44-0,62 de luz,
      dominante de cor acima de 3%, corrigida pela metade, imagem lavada).
Limites: ganho 0,85-1,15, gama 0,65-1,5, contraste 0,85-1,2. Precisou de mais que isso, vira alerta
(ex.: subexposição forte não se corrige na edição).

Medição: um frame a cada --intervalo segundos (máx. ~400), rosto pelo YuNet (OpenCV; sem rosto,
o trecho fica sem ajuste de exposição). Os trechos são separados quando a correção necessária
muda e se mantém por pelo menos --segmento-minimo segundos.

Saída:
    edicao/transcricao.json, seção "cor"    ->  {"origem", "entrada", "look", "referencia", "alvo",
                                                  "trechos": [{"inicio", "fim", "ajuste", "medido"}]}
                                                  tempos no relógio da transcrição (início do áudio).
                                                  O Claude pode ajustar "ajuste" à mão; o 06 respeita.
    edicao/qualidade.json, seção "imagem"   ->  medições e alertas
"""

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

import caminhos
import transcricao

MODELO_ROSTO = Path.home() / ".cache" / "opencv" / "face_detection_yunet_2023mar.onnx"
LARGURA_ANALISE = 640
MAX_AMOSTRAS = 400
REC709 = {"bt709", "smpte170m", "bt470bg", "bt470m", "iec61966-2-1", "gamma22", "gamma28"}

# Sem referência: faixa aceitável da luz do rosto (luma Rec.709, 0-1) e força da correção de cor
ROSTO_MIN, ROSTO_MAX = 0.44, 0.62
DOMINANTE_TOLERADA = 0.03
FORCA_BRANCO_SEM_REFERENCIA = 0.5
CONTRASTE_LAVADO = 0.45          # p95 - p5 da luma abaixo disso = imagem lavada (ou log sem conversão)
LIMITES = {"ganho": (0.85, 1.15), "gama": (0.65, 1.5), "contraste": (0.85, 1.2)}
MUDANCA = {"ganho": 0.03, "gama": 0.06, "contraste": 0.05}   # diferença que abre um trecho novo
NEUTRO = {"ajuste": {"r": 1.0, "g": 1.0, "b": 1.0, "gama": 1.0, "contraste": 1.0, "pivo": 0.5}}


# --------------------------------------------------------------------------------------------
# Camadas e filtros (usados também pelo 06)
# --------------------------------------------------------------------------------------------


def relativo(caminho: Path) -> str:
    return caminho.resolve().relative_to(caminhos.RAIZ_PROJETO).as_posix()


def look_do_autor() -> dict | None:
    lut = caminhos.PASTA_COR / "look.cube"
    if lut.is_file():
        return {"lut": relativo(lut)}
    if caminhos.ESTILO.is_file():
        texto = caminhos.ESTILO.read_text(encoding="utf-8")
        secao = re.search(r"^## 7\. Cor\s*$(.*?)(?=^## )", texto, re.S | re.M)
        achado = re.search(r"`([a-z0-9_]+=[^`]+)`", secao.group(1)) if secao else None
        if achado:
            return {"filtro": achado.group(1)}
    return None


def entrada_da_camera(info: dict, modo: str) -> dict | None:
    lut = caminhos.PASTA_COR / "entrada.cube"
    transferencia = (info.get("cor") or {}).get("transferencia")
    usar = modo == "sim" or (modo == "auto" and transferencia not in REC709 and transferencia not in (None, "unknown"))
    if not usar:
        return None
    if not lut.is_file():
        sys.exit(f"Erro: o bruto está em {transferencia or 'perfil desconhecido'} e precisa da LUT de conversão "
                 f"em {relativo(caminhos.PASTA_COR)}/entrada.cube (ex.: Apple Log -> Rec.709, da Apple). "
                 "Use --entrada nao para seguir sem ela.")
    return {"lut": relativo(lut)}


def filtro_da_camada(camada: dict | None) -> str | None:
    """{"lut": caminho relativo à raiz} ou {"filtro": "..."} -> filtro ffmpeg (rodar com cwd na raiz)."""
    if not camada:
        return None
    if "lut" in camada:
        return f"lut3d=file='{camada['lut']}':interp=tetrahedral"
    return camada["filtro"]


def filtro_do_ajuste(ajuste: dict) -> str | None:
    """Ajuste adaptativo -> lutrgb (uma curva por canal; mesma conta da medição)."""
    a = {**NEUTRO["ajuste"], **ajuste}
    if all(abs(a[k] - 1.0) < 1e-3 for k in ("r", "g", "b", "gama", "contraste")):
        return None

    def canal(ganho: float) -> str:
        return (f"clip(maxval*({a['pivo']:.4f}+(pow(clip(val/maxval*{ganho:.4f},0,1),{a['gama']:.4f})"
                f"-{a['pivo']:.4f})*{a['contraste']:.4f}),minval,maxval)")

    return f"lutrgb=r='{canal(a['r'])}':g='{canal(a['g'])}':b='{canal(a['b'])}'"


def aplicar_ajuste(rgb: np.ndarray, a: dict) -> np.ndarray:
    """Mesma conta do filtro_do_ajuste, em numpy (0-1)."""
    ganhos = np.array([a["r"], a["g"], a["b"]], dtype=np.float32)
    x = np.clip(rgb * ganhos, 0, 1) ** a["gama"]
    return np.clip(a["pivo"] + (x - a["pivo"]) * a["contraste"], 0, 1)


# --------------------------------------------------------------------------------------------
# Medição
# --------------------------------------------------------------------------------------------


def luma(rgb: np.ndarray) -> np.ndarray:
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


class Rosto:
    def __init__(self):
        import cv2
        cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_ERROR)  # só erros (o YuNet avisa sobre o motor novo a cada carga)
        self.cv2 = cv2
        self.detector = None
        if MODELO_ROSTO.is_file():
            self.detector = cv2.FaceDetectorYN.create(str(MODELO_ROSTO), "", (320, 320), 0.7)

    def regiao(self, bgr: np.ndarray) -> tuple[int, int, int, int] | None:
        """Miolo do maior rosto (60% central: pele, sem cabelo nem fundo)."""
        if self.detector is None:
            return None
        h, w = bgr.shape[:2]
        self.detector.setInputSize((w, h))
        _, rostos = self.detector.detect(bgr)
        if rostos is None or not len(rostos):
            return None
        x, y, rw, rh = max(rostos, key=lambda r: r[2] * r[3])[:4]
        x0, y0 = int(max(0, x + rw * 0.2)), int(max(0, y + rh * 0.2))
        x1, y1 = int(min(w, x + rw * 0.8)), int(min(h, y + rh * 0.8))
        return (x0, y0, x1, y1) if x1 - x0 > 4 and y1 - y0 > 4 else None


def medir(rgb: np.ndarray, regiao) -> dict:
    """Luz do rosto, tom dos neutros, contraste (p95 - p5) e estouro no rosto."""
    y = luma(rgb)
    # neutro = pouca cor relativa ao brilho (até 20%: pega parede/camisa cinza mesmo com dominante; pele fica fora)
    cromia = (rgb.max(axis=2) - rgb.min(axis=2)) / np.maximum(rgb.max(axis=2), 1e-3)
    neutros = (cromia < 0.2) & (y > 0.15) & (y < 0.9)
    medida = {"contraste": float(np.percentile(y, 95) - np.percentile(y, 5)),
              "neutro": rgb[neutros].mean(axis=0).tolist() if neutros.mean() > 0.03 else None,
              "rosto_luma": None, "rosto_estourado": 0.0}
    if regiao:
        x0, y0, x1, y1 = regiao
        rosto = y[y0:y1, x0:x1]
        medida["rosto_luma"] = float(rosto.mean())
        medida["rosto_estourado"] = float((rosto > 0.97).mean())
    return medida


def alvo_da_referencia(rosto: Rosto) -> tuple[dict, str | None]:
    candidatas = [p for p in sorted(caminhos.PASTA_COR.glob("referencia.*")) if p.suffix.lower() in {".png", ".jpg", ".jpeg"}]
    if not candidatas:
        return {"rosto_luma": None, "neutro": None, "contraste": None}, None
    bgr = rosto.cv2.imread(str(candidatas[0]))
    escala = LARGURA_ANALISE / bgr.shape[1]
    bgr = rosto.cv2.resize(bgr, (LARGURA_ANALISE, round(bgr.shape[0] * escala)), interpolation=rosto.cv2.INTER_AREA)
    rgb = bgr[..., ::-1].astype(np.float32) / 255
    m = medir(rgb, rosto.regiao(bgr))
    if m["rosto_luma"] is None:
        print(f"Aviso: nenhum rosto na referência {candidatas[0].name}; usando só neutros e contraste dela.")
    return {"rosto_luma": m["rosto_luma"], "neutro": m["neutro"], "contraste": m["contraste"]}, relativo(candidatas[0])


def limitar(valor: float, limites: tuple[float, float], estourou: list) -> float:
    if valor < limites[0] or valor > limites[1]:
        estourou.append(valor)
    return float(min(max(valor, limites[0]), limites[1]))


def calcular_ajuste(rgb: np.ndarray, regiao, medida: dict, alvo: dict) -> tuple[dict, list[str]]:
    """Ajuste que leva este frame ao alvo. Devolve (ajuste, limites estourados)."""
    estouros: list[str] = []
    a = dict(NEUTRO["ajuste"])

    # 1. Balanço de branco pelos neutros (G fica fixo; R e B se ajustam)
    if medida["neutro"]:
        r, g, b = (max(v, 1e-3) for v in medida["neutro"])
        if alvo["neutro"]:
            rr, gr, br = alvo["neutro"]
            alvo_r, alvo_b, forca = rr / gr, br / gr, 1.0
        else:
            alvo_r = alvo_b = 1.0
            forca = FORCA_BRANCO_SEM_REFERENCIA
        for canal, atual, desejado in (("r", r / g, alvo_r), ("b", b / g, alvo_b)):
            ganho = desejado / atual
            if alvo["neutro"] or abs(ganho - 1) > DOMINANTE_TOLERADA:
                e: list = []
                a[canal] = limitar(1 + (ganho - 1) * forca, LIMITES["ganho"], e)
                if e:
                    estouros.append("cor")

    # 2. Exposição pelo rosto: gama que leva a luz média do rosto ao alvo
    if regiao and medida["rosto_luma"] is not None:
        atual = medida["rosto_luma"]
        alvo_luz = alvo["rosto_luma"] if alvo["rosto_luma"] else min(max(atual, ROSTO_MIN), ROSTO_MAX)
        x0, y0, x1, y1 = regiao
        pele = rgb[y0:y1, x0:x1].reshape(-1, 3)[::max(1, (y1 - y0) * (x1 - x0) // 5000)]
        pele = np.clip(pele * np.array([a["r"], a["g"], a["b"]], dtype=np.float32), 0, 1)
        if abs(luma(pele).mean() - alvo_luz) > 0.01:
            baixo, alto = 0.2, 3.0                     # luma(pele ** gama) cai quando a gama sobe
            for _ in range(30):
                meio = (baixo + alto) / 2
                if luma(pele ** meio).mean() > alvo_luz:
                    baixo = meio
                else:
                    alto = meio
            e = []
            a["gama"] = limitar((baixo + alto) / 2, LIMITES["gama"], e)
            if e:
                estouros.append("exposicao")
        a["pivo"] = float(alvo_luz)

    # 3. Contraste (pivô na luz do rosto: o rosto não sai do lugar)
    depois = luma(aplicar_ajuste(rgb[::4, ::4], a))
    espalhamento = float(np.percentile(depois, 95) - np.percentile(depois, 5))
    if espalhamento > 0.05:
        if alvo["contraste"]:
            desejado = alvo["contraste"]
        elif espalhamento < CONTRASTE_LAVADO:
            desejado = CONTRASTE_LAVADO + 0.05
        else:
            desejado = espalhamento
        e = []
        a["contraste"] = limitar(desejado / espalhamento, LIMITES["contraste"], e)
        if e:
            estouros.append("contraste")
    return a, estouros


def extrair_amostras(original: Path, intervalo: float, entrada: str | None, pasta: Path) -> list[Path]:
    filtros = [f"fps=1/{intervalo:.4f}", f"scale={LARGURA_ANALISE}:-2:flags=area"]
    if entrada:
        filtros.append(entrada)
    comando = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-skip_frame", "nokey", "-i", str(original),
               "-an", "-vf", ",".join(filtros), "-fps_mode", "passthrough", str(pasta / "q_%05d.png")]
    resultado = subprocess.run(comando, cwd=caminhos.RAIZ_PROJETO, capture_output=True, text=True)
    if resultado.returncode != 0:
        sys.exit(f"Erro: ffmpeg falhou ao extrair frames:\n{resultado.stderr[-1500:]}")
    return sorted(pasta.glob("q_*.png"))


# --------------------------------------------------------------------------------------------
# Trechos
# --------------------------------------------------------------------------------------------


def mediana(amostras: list[dict], chave: str) -> float:
    valores = [s["ajuste"][chave] for s in amostras if chave not in ("gama", "pivo") or s["rosto"]]
    return float(np.median(valores)) if valores else NEUTRO["ajuste"][chave]


def resumo(amostras: list[dict]) -> dict:
    return {k: round(mediana(amostras, k), 3) for k in NEUTRO["ajuste"]}


def diferente(a: dict, b: dict) -> bool:
    return (max(abs(a["r"] - b["r"]), abs(a["b"] - b["b"])) > MUDANCA["ganho"]
            or abs(a["gama"] - b["gama"]) > MUDANCA["gama"] or abs(a["contraste"] - b["contraste"]) > MUDANCA["contraste"])


def segmentar(amostras: list[dict], janela: int) -> list[list[dict]]:
    """Abre trecho novo quando a correção das próximas `janela` amostras difere da do trecho atual."""
    trechos, inicio, i = [], 0, janela
    while i + janela <= len(amostras):
        atual = resumo(amostras[inicio:i])
        if diferente(resumo(amostras[i:i + janela]), atual):
            # fronteira exata: primeira amostra da janela que já difere do trecho atual
            corte = next((j for j in range(i, i + janela) if diferente(resumo([amostras[j]]), atual)), i)
            trechos.append(amostras[inicio:corte])
            inicio = corte
            i = corte + janela
        else:
            i += 1
    trechos.append(amostras[inicio:])
    return trechos


# --------------------------------------------------------------------------------------------


def gerar_referencia(video: caminhos.Video, tempo: float, modo_entrada: str) -> None:
    original = video.original
    entrada = filtro_da_camada(entrada_da_camera(caminhos.sondar(original), modo_entrada))
    caminhos.PASTA_COR.mkdir(parents=True, exist_ok=True)
    destino = caminhos.PASTA_COR / "referencia.png"
    comando = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{tempo}", "-i", str(original),
               "-frames:v", "1"] + (["-vf", entrada] if entrada else []) + [str(destino)]
    if subprocess.run(comando, cwd=caminhos.RAIZ_PROJETO).returncode != 0:
        sys.exit("Erro: ffmpeg falhou ao gerar a referência.")
    print(f"Frame de referência salvo em: {destino}\nRode o 05 de novo nos vídeos que devem seguir esta referência.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Mede a imagem e decide a correção de cor por trecho (seção cor).")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("--intervalo", type=float, default=2.0, help="Segundos entre frames medidos (padrão: 2)")
    parser.add_argument("--segmento-minimo", type=float, default=30.0,
                        help="Duração mínima, em segundos, de uma mudança de luz para virar trecho próprio (padrão: 30)")
    parser.add_argument("--entrada", choices=["auto", "sim", "nao"], default="auto",
                        help="Aplica a LUT de conversão da câmera (setup/biblioteca/cor/entrada.cube) (padrão: auto)")
    parser.add_argument("--gerar-referencia", type=float, metavar="SEGUNDOS",
                        help="Grava o frame deste instante do original como setup/biblioteca/cor/referencia.png e sai")
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None:
        sys.exit("Erro: FFmpeg não encontrado. Rode python3 codigos/verificar_ambiente.py.")
    video = caminhos.video(args.video)
    if args.gerar_referencia is not None:
        gerar_referencia(video, args.gerar_referencia, args.entrada)
        return

    original = video.original
    info = caminhos.sondar(original)
    desvio = (info["audio"] or {}).get("desvio", 0.0)
    camada_entrada = entrada_da_camera(info, args.entrada)
    look = look_do_autor()
    rosto = Rosto()
    alvo, referencia = alvo_da_referencia(rosto)
    intervalo = max(args.intervalo, info["duracao"] / MAX_AMOSTRAS)

    print(f"Imagem de: {original.name} ({info['largura']}x{info['altura']}, cor {info['cor']['transferencia'] or '?'})")
    print(f"Entrada: {camada_entrada['lut'] if camada_entrada else 'nenhuma (Rec.709)'} | "
          f"Look: {(look or {}).get('lut') or ('filtro do estilo.md §7' if look else 'nenhum')} | "
          f"Referência: {referencia or 'nenhuma (só corrige o que está fora da faixa)'}")
    if rosto.detector is None:
        print(f"Aviso: modelo de rosto não encontrado ({MODELO_ROSTO}); sem ajuste de exposição. "
              "Rode python3 codigos/verificar_ambiente.py.")
    print(f"Medindo um frame a cada {intervalo:.1f} s...")

    amostras = []
    with tempfile.TemporaryDirectory() as pasta:
        frames = extrair_amostras(original, intervalo, filtro_da_camada(camada_entrada), Path(pasta))
        for k, arquivo in enumerate(frames):
            bgr = rosto.cv2.imread(str(arquivo))
            rgb = bgr[..., ::-1].astype(np.float32) / 255
            regiao = rosto.regiao(bgr)
            medida = medir(rgb, regiao)
            ajuste, estouros = calcular_ajuste(rgb, regiao, medida, alvo)
            amostras.append({"tempo": k * intervalo - desvio, "rosto": regiao is not None,
                             "medida": medida, "ajuste": ajuste, "estouros": estouros})
            print(f"\r  {k + 1}/{len(frames)}", end="", flush=True)
    print()
    if not amostras:
        sys.exit("Erro: nenhum frame extraído do original.")

    duracao = (info["audio"] or {}).get("duracao") or info["duracao"]
    grupos = segmentar(amostras, max(1, round(args.segmento_minimo / intervalo)))
    trechos, alertas = [], []
    for n, grupo in enumerate(grupos):
        inicio = 0.0 if n == 0 else round((grupos[n - 1][-1]["tempo"] + grupo[0]["tempo"]) / 2, 3)
        fim = round(duracao, 3) if n == len(grupos) - 1 else round((grupo[-1]["tempo"] + grupos[n + 1][0]["tempo"]) / 2, 3)
        ajuste = resumo(grupo)
        com_rosto = [s["medida"]["rosto_luma"] for s in grupo if s["rosto"]]
        medido = {"amostras": len(grupo), "com_rosto": len(com_rosto),
                  "rosto_luma": round(float(np.median(com_rosto)), 3) if com_rosto else None,
                  "contraste": round(float(np.median([s["medida"]["contraste"] for s in grupo])), 3)}
        trechos.append({"inicio": max(0.0, inicio), "fim": fim, "ajuste": ajuste, "medido": medido})

        quando = f"{int(inicio // 60):02d}:{inicio % 60:04.1f}-{int(fim // 60):02d}:{fim % 60:04.1f}"
        estouros = [e for s in grupo for e in s["estouros"]]
        for tipo, texto in (("exposicao", "exposição do rosto fora do que dá para corrigir (sub ou superexposição forte)"),
                            ("cor", "dominante de cor forte (balanço de branco errado na câmera)"),
                            ("contraste", "contraste muito fora do alvo")):
            if estouros.count(tipo) > len(grupo) / 2:
                alertas.append(f"{quando}: {texto}; corrigido até o limite. Conferir na amostra.")
        estourado = [s["medida"]["rosto_estourado"] for s in grupo if s["rosto"]]
        if estourado and np.median(estourado) > 0.05:
            alertas.append(f"{quando}: rosto estourado (branco sem detalhe); não se recupera na edição.")
        if medido["contraste"] < CONTRASTE_LAVADO and not camada_entrada:
            alertas.append(f"{quando}: imagem lavada (contraste {medido['contraste']:.2f}); se gravou em log "
                           "(ex.: Apple Log), coloque a LUT de conversão em setup/biblioteca/cor/entrada.cube e rode com --entrada sim.")
    com_rosto = sum(s["rosto"] for s in amostras)
    if com_rosto < len(amostras) * 0.5 and rosto.detector is not None:
        alertas.append(f"Rosto encontrado em só {com_rosto} de {len(amostras)} frames: exposição corrigida só onde há rosto.")

    cor = {"origem": original.name, "entrada": camada_entrada, "look": look, "referencia": referencia,
           "alvo": {k: (round(v, 3) if isinstance(v, float) else v) for k, v in alvo.items()},
           "trechos": trechos}
    transcricao.atualizar(video.transcricao, {"cor": cor})
    transcricao.atualizar(video.qualidade, {"imagem": {
        "arquivo": original.name, "intervalo": round(intervalo, 2), "amostras": len(amostras),
        "com_rosto": com_rosto, "alertas": alertas}})

    print(f"{len(trechos)} trecho(s) de cor:")
    for t in trechos:
        a = t["ajuste"]
        print(f"  {t['inicio']:7.1f}-{t['fim']:7.1f}s | R {a['r']:.3f} B {a['b']:.3f} | gama {a['gama']:.3f} | "
              f"contraste {a['contraste']:.3f} | rosto {t['medido']['rosto_luma']}")
    print(f"\n{len(alertas)} alerta(s) de imagem:" if alertas else "\nSem alertas de imagem.")
    for alerta in alertas:
        print(f"  - {alerta}")
    print(f"\nDecisão salva em: {video.transcricao} (seção \"cor\"); o 06 aplica no render.")


if __name__ == "__main__":
    main()
