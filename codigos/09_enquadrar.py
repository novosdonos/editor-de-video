#!/usr/bin/env python3
"""
Etapa 7 (câmera): planeja o enquadramento do vídeo editado e grava a seção "enquadramento".
Roda depois do motion aprovado (A4), porque a câmera acompanha as cenas e os destaques. Não
renderiza nada: o Remotion aplica (Camera em remotion/src/Aula.tsx) e o 08 leva a seção para o
aula.json (chamado no fim).

Uso:
    .venv/bin/python codigos/09_enquadrar.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/09_enquadrar.py videos/01-meu-primeiro-video --troca 1.8 --sem-exportar

Regras (setup/estilo.md §6.1):
    - rastreio do rosto (YuNet) no editado.mp4, --amostras por segundo, suavizado dentro de cada trecho
      (nunca através de uma emenda: em takes diferentes o rosto muda de lugar);
    - três planos: aberto (1.0), médio (1,07) e fechado (1,14); bruto 4K: 1,12 e 1,22 (zoom contido; 2026-11-12);
    - enquadramento travado por plano (mediana do rosto no plano), nunca seguindo o rosto quadro a quadro;
    - escada: aberto -> médio -> fechado a cada ~--troca s (6), sempre na palavra; volta seca ao aberto
      no fim de frase depois de fechar, ou depois de ~1,4× a troca no fechado; nada de pingue-pongue;
    - emenda (corte do 06) com salto visível do rosto (--salto) troca de plano: o salto de escala disfarça
      o corte; emenda sem salto (pausa curta, arrasto no mesmo take) não mexe na câmera;
    - ênfase = fechado: número, pergunta e entrada de destaque fecham na palavra;
    - durante destaque o rosto fica ancorado (não anda na direção do centro), para não encostar no texto;
    - depois de cada cena volta no aberto com desfoque que resolve em ~0,3 s;
    - antes de cada cena, aproximação lenta (+--rampa no último segundo) prepara a transição;
    - durante cenas não há plano: a cena desenha a própria câmera.

Entrada: edicao/editado.mp4, edicao/transcricao.json ("palavras", "erros", "edicao") e a linha do
tempo do Remotion (remotion/scripts/linha.mjs; sem ela, planeja sem cenas nem destaques e avisa).

Saída: seção "enquadramento" do transcricao.json:
    {"cortes", "linha" (assinaturas), "escalas", "amostras", "rosto": [[t, x, y, altura], ...]
     (centro do rosto em fração do quadro), "planos": [{"inicio", "fim", "plano", "escala", "palavra",
     "motivo", "ancorar"?, "rampa"?, "entrada"?}]}
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

import caminhos
import transcricao

AMBIENTE = transcricao.carregar_codigo("verificar_ambiente.py")
EXPORTAR = transcricao.carregar_codigo("08_exportar_para_remotion.py")
FIM_DE_FRASE = (".", "?", "!", "…")


# --------------------------------------------------------------------------------------------
# Linha do tempo do Remotion
# --------------------------------------------------------------------------------------------


def linha_do_remotion(nome: str) -> list[dict]:
    """Cenas e destaques da aula ({id, tipo, inicio, dur}); lista vazia se não houver."""
    script = caminhos.PASTA_REMOTION / "scripts" / "linha.mjs"
    resultado = subprocess.run(["node", str(script), nome], capture_output=True, text=True,
                               cwd=caminhos.PASTA_REMOTION)
    if resultado.returncode != 0:
        print(f"Aviso: não consegui ler a linha do tempo do Remotion ({resultado.stderr.strip()[:200]}); "
              "planejando sem cenas nem destaques.")
        return []
    return json.loads(resultado.stdout or "[]")


# --------------------------------------------------------------------------------------------
# Rastreio do rosto
# --------------------------------------------------------------------------------------------


def rastrear_rosto(video: Path, amostras: float) -> tuple[np.ndarray, tuple[int, int]]:
    """[[t, x, y, altura], ...] (frações do quadro; NaN onde não achou rosto) e (largura, altura)."""
    import cv2

    modelo = AMBIENTE.MODELO_ROSTO
    if not modelo.is_file():
        sys.exit(f"Erro: modelo de rosto não encontrado em {modelo}. Rode: python3 codigos/verificar_ambiente.py")
    captura = cv2.VideoCapture(str(video))
    fps = captura.get(cv2.CAP_PROP_FPS) or 30
    total = int(captura.get(cv2.CAP_PROP_FRAME_COUNT))
    largura, altura = int(captura.get(cv2.CAP_PROP_FRAME_WIDTH)), int(captura.get(cv2.CAP_PROP_FRAME_HEIGHT))
    escala = 640 / largura
    tamanho = (640, round(altura * escala))
    detector = cv2.FaceDetectorYN.create(str(modelo), "", tamanho, 0.7, 0.3, 50)

    passo = max(1, round(fps / amostras))
    pontos, n = [], 0
    while True:
        if n % passo:
            if not captura.grab():
                break
            n += 1
            continue
        ok, quadro = captura.read()
        if not ok:
            break
        _, rostos = detector.detect(cv2.resize(quadro, tamanho))
        t = n / fps
        if rostos is not None and len(rostos):
            x, y, w, h = max(rostos, key=lambda r: r[2] * r[3])[:4]
            pontos.append([t, (x + w / 2) / tamanho[0], (y + h / 2) / tamanho[1], h / tamanho[1]])
        else:
            pontos.append([t, np.nan, np.nan, np.nan])
        if len(pontos) % 500 == 0:
            print(f"\r  rosto: {n / max(total, 1):6.1%}", end="", flush=True)
        n += 1
    captura.release()
    print(f"\r  rosto: {len(pontos)} amostras, rosto achado em "
          f"{np.mean([not np.isnan(p[1]) for p in pontos]):.0%}")
    return np.array(pontos, dtype=float), (largura, altura)


def emendas_visiveis(rosto: np.ndarray, emendas: list[float], salto: float, janela: float = 0.25) -> list[float]:
    """Emendas em que o rosto pula (posição ou tamanho) mais que `salto`: só nelas a troca de plano disfarça o corte."""
    limites = [0.0, *emendas, float("inf")]
    saida = []
    for k, t in enumerate(emendas):
        antes = rosto[(rosto[:, 0] >= max(limites[k], t - janela)) & (rosto[:, 0] < t)]
        depois = rosto[(rosto[:, 0] >= t) & (rosto[:, 0] < min(limites[k + 2], t + janela))]
        antes, depois = antes[~np.isnan(antes[:, 1])], depois[~np.isnan(depois[:, 1])]
        if not len(antes) or not len(depois):
            saida.append(t)  # sem rosto para medir: troca por segurança
            continue
        a, d = np.median(antes[:, 1:4], axis=0), np.median(depois[:, 1:4], axis=0)
        if max(abs(d[0] - a[0]), abs(d[1] - a[1]), abs(d[2] - a[2]) / max(a[2], 1e-3)) >= salto:
            saida.append(t)
    return saida


def suavizar(rosto: np.ndarray, emendas: list[float], janela: float, amostras: float) -> np.ndarray:
    """Preenche falhas e suaviza x, y e altura dentro de cada trecho entre emendas."""
    saida = rosto.copy()
    limites = [0.0, *emendas, float("inf")]
    k = max(1, round(janela * amostras))
    for ini, fim in zip(limites, limites[1:]):
        idx = np.where((rosto[:, 0] >= ini) & (rosto[:, 0] < fim))[0]
        if not len(idx):
            continue
        for col in (1, 2, 3):
            serie = rosto[idx, col]
            validos = ~np.isnan(serie)
            if not validos.any():
                serie = np.full_like(serie, {1: 0.5, 2: 0.4, 3: 0.3}[col])
            else:
                serie = np.interp(np.arange(len(serie)), np.where(validos)[0], serie[validos])
            # mediana (tira pulo de detecção) e média móvel (tira tremor)
            m = np.array([np.median(serie[max(0, i - 2):i + 3]) for i in range(len(serie))])
            borda = np.pad(m, (k, k), mode="edge")
            saida[idx, col] = np.convolve(borda, np.ones(2 * k + 1) / (2 * k + 1), mode="same")[k:-k]
    return saida


# --------------------------------------------------------------------------------------------
# Planos
# --------------------------------------------------------------------------------------------


def eh_enfase(palavra: str, frase: str) -> bool:
    return any(c.isdigit() for c in palavra) or frase.rstrip().endswith("?")


def planejar(palavras: list[dict], emendas: list[float], linha: list[dict], duracao: float,
             escalas: dict, args) -> list[dict]:
    cenas = sorted((i["inicio"], i["inicio"] + i["dur"]) for i in linha if i["tipo"] == "cena")
    destaques = sorted((i["inicio"], i["inicio"] + i["dur"]) for i in linha if i["tipo"] == "destaque")
    inicios_destaque = [d[0] for d in destaques]
    nomes = ["aberto", "medio", "fechado"]

    def em_cena(t: float) -> bool:
        return any(a - 0.05 <= t < b for a, b in cenas)

    def em_destaque(a: float, b: float) -> bool:
        return any(x < b and a < y for x, y in destaques)

    # frase de cada palavra (para saber se é pergunta) e fim de frase
    frases, atual = [], []
    for i, p in enumerate(palavras):
        atual.append(i)
        if p["palavra"].rstrip().endswith(FIM_DE_FRASE) or i == len(palavras) - 1:
            texto = " ".join(palavras[j]["palavra"] for j in atual)
            frases.extend([texto] * len(atual))
            atual = []

    planos: list[dict] = []
    nivel, desde, pos_cena = 0, 0.0, True
    proxima_emenda = 0

    def abrir(i: int, t: float, novo: int, motivo: str, entrada: str | None = None) -> None:
        nonlocal nivel, desde
        if planos and planos[-1]["fim"] is None:  # o plano antes de uma cena já fechou no início dela
            planos[-1]["fim"] = round(t, 3)
        plano = {"inicio": round(t, 3), "fim": None, "plano": nomes[novo], "escala": escalas[nomes[novo]],
                 "palavra": i, "motivo": motivo}
        if entrada:
            plano["entrada"] = entrada
        planos.append(plano)
        nivel, desde = novo, t

    for i, p in enumerate(palavras):
        t = p["inicio"]
        if em_cena(t):
            if planos and planos[-1]["fim"] is None:
                planos[-1]["fim"] = round(max(planos[-1]["inicio"], min(a for a, b in cenas if b > t)), 3)
            pos_cena = True
            continue
        if pos_cena:
            # sem "foco" (desfoque de entrada): na volta de cena parecia defeito (aula 01, 2026-11-12)
            abrir(i, t, 0, "volta de cena" if planos else "início")
            pos_cena = False
            while proxima_emenda < len(emendas) and emendas[proxima_emenda] <= t + 0.05:
                proxima_emenda += 1
            continue

        segurou = t - desde
        alvo = args.troca * (0.8 + 0.4 * ((i * 7) % 5) / 4)  # 0,8–1,2× a troca média, sem padrão fixo
        anterior = palavras[i - 1]["palavra"] if i else ""
        emenda = proxima_emenda < len(emendas) and emendas[proxima_emenda] <= t + 0.05
        while proxima_emenda < len(emendas) and emendas[proxima_emenda] <= t + 0.05:
            proxima_emenda += 1
        destaque_aqui = any(abs(t - d) < 0.35 for d in inicios_destaque)

        if emenda and segurou >= args.intervalo_minimo:
            # corte com salto logo depois de outra troca fica seco (jump cut): trocar sempre dava
            # plano novo a cada 2-3 s, o "zoom em excesso" da aula 01 (2026-11-12)
            abrir(i, t, 0 if nivel == 2 else nivel + 1, "emenda")
        elif destaque_aqui and nivel != 2 and segurou >= 0.5:
            # só destaque fecha o plano; "ênfase" (número, pergunta) saiu: zoom demais (aula 01, 2026-11-12)
            abrir(i, t, 2, "destaque")
        elif nivel == 2 and segurou >= 0.8 and (anterior.rstrip().endswith(FIM_DE_FRASE) or segurou >= alvo * 1.4):
            abrir(i, t, 0, "fim de frase" if anterior.rstrip().endswith(FIM_DE_FRASE) else "escada")
        elif nivel < 2 and segurou >= alvo:
            abrir(i, t, nivel + 1, "escada")

    if planos and planos[-1]["fim"] is None:
        planos[-1]["fim"] = round(duracao, 3)

    # Zoom que vai e volta e reenquadramento pequeno tiram a fluidez (aula 01, 2026-11-13): plano curto que não nasce
    # de um corte (escada, fim de frase, destaque) é absorvido pelo anterior; dois planos seguidos de mesma escala
    # viram um só, a não ser que o segundo comece num corte (aí o reenquadramento disfarça o salto).
    limpos: list[dict] = []
    for p in planos:
        colado = bool(limpos) and abs(limpos[-1]["fim"] - p["inicio"]) < 0.05
        curto = p["fim"] - p["inicio"] < args.plano_minimo and p["motivo"] not in ("emenda", "volta de cena", "início")
        igual = colado and limpos[-1]["plano"] == p["plano"] and p["motivo"] != "emenda"
        if colado and (curto or igual):
            limpos[-1]["fim"] = p["fim"]
            continue
        # plano de corte curto seguido de outro plano: o corte já entra no enquadramento seguinte (um movimento só)
        anterior = limpos[-1] if colado else None
        if (anterior and anterior["motivo"] == "emenda" and p["motivo"] != "emenda"
                and anterior["fim"] - anterior["inicio"] < args.plano_minimo):
            anterior.update({k: p[k] for k in ("plano", "escala") if k in p})
            anterior["fim"] = p["fim"]
            continue
        limpos.append(p)
    planos = limpos

    # detalhes que dependem do plano inteiro
    for plano in planos:
        if em_destaque(plano["inicio"], plano["fim"]):
            plano["ancorar"] = True
        if args.rampa and plano["fim"] - plano["inicio"] >= 1.2 and any(abs(plano["fim"] - a) < 0.1 for a, _ in cenas):
            plano["rampa"] = args.rampa
    return [p for p in planos if p["fim"] - p["inicio"] > 0.02]


def main() -> None:
    parser = argparse.ArgumentParser(description="Planeja zoom e reenquadramento (etapa 7) e grava a seção enquadramento.")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("--amostras", type=float, default=5, help="Amostras de rosto por segundo (padrão: 5)")
    parser.add_argument("--troca", type=float, default=6.0, help="Tempo médio entre trocas de plano sem corte, em s (padrão: 6; 1,5 e 4 ficaram agitados demais na aula 01)")
    parser.add_argument("--rampa", type=float, default=0.0, help="Aproximação lenta antes de cena (padrão: 0 = sem; 0.08 fazia o zoom ir e voltar quando a cena abria, aula 01)")
    parser.add_argument("--plano-minimo", type=float, default=2.5, help="Duração mínima de um plano que não nasce de corte, em s (padrão: 2.5; mais curto é zoom que vai e volta)")
    parser.add_argument("--suavizar", type=float, default=0.6, help="Janela de suavização do rosto, em s (padrão: 0.6)")
    parser.add_argument("--intervalo-minimo", type=float, default=4.0,
                        help="Segundos mínimos entre duas trocas de plano por corte (padrão: 4)")
    parser.add_argument("--salto", type=float, default=0.06,
                        help="Deslocamento do rosto na emenda, em fração do quadro (x/y) ou da altura do rosto, a partir do "
                             "qual a emenda troca de plano para disfarçar o corte; o rosto anda ~0,06 em 0,1 s sem corte nenhum (padrão: 0.06)")
    parser.add_argument("--sem-exportar", action="store_true", help="Não roda o 08 no fim")
    args = parser.parse_args()

    pasta = caminhos.video(args.video)
    caminho = pasta.transcricao
    dados = transcricao.carregar(caminho, exigir=("palavras", "edicao"))
    editada = transcricao.linha_do_tempo(caminho)  # para se os cortes mudaram depois do render
    if not pasta.editado.is_file():
        sys.exit(f"Erro: {pasta.editado} não existe. Rode o 06.")
    emendas = [t["inicio"] for t in editada["trechos"][1:] if t.get("emenda", True)]  # trecho acelerado não é corte
    linha = linha_do_remotion(pasta.nome)
    palavras = [p for p in editada["palavras"] if p["palavra"].strip()]

    print(f"Rastreando o rosto em {pasta.editado.name}...")
    rosto, (largura, altura) = rastrear_rosto(pasta.editado, args.amostras)
    # Emenda que pede troca de plano: só a que dá salto visível do rosto. Desde 2026-11-12 o 06 também tira
    # pausas curtas e arrastos (493 emendas na aula 01, contra 61): trocar em todas dava plano novo a cada 1,7 s.
    visiveis = emendas_visiveis(rosto, emendas, args.salto)
    print(f"Emendas com salto visível do rosto: {len(visiveis)} de {len(emendas)}")
    rosto = suavizar(rosto, emendas, args.suavizar, args.amostras)
    # escalas contidas: zoom grande em bruto 720p amplia o grão e cansa (2026-11-12, aula 01: "zoom com excesso")
    escalas = {"aberto": 1.0, "medio": 1.12, "fechado": 1.22} if altura >= 2000 else \
              {"aberto": 1.0, "medio": 1.07, "fechado": 1.14}

    planos = planejar(palavras, visiveis, linha, editada["duracao"], escalas, args)
    # enquadramento travado por plano: um ponto só (mediana do rosto no plano), sem seguir o rosto quadro a quadro
    # (seguir o rastreio a cada amostra fazia a imagem tremer; 2026-11-12, aula 01)
    tr = np.array(rosto, dtype=float)
    for plano in planos:
        m = (tr[:, 0] >= plano["inicio"]) & (tr[:, 0] < plano["fim"])
        if m.any():
            plano["fx"] = round(float(np.median(tr[m, 1])), 4)
            plano["fy"] = round(float(np.median(tr[m, 2])), 4)
    zoom_06 = dados["edicao"].get("zoom", 1) or 1
    if zoom_06 > 1:
        # render antigo com o zoom alternado do 06 embutido nos trechos ímpares: desconta para não somar
        print(f"Aviso: o editado.mp4 tem o zoom alternado do 06 ({zoom_06}x); compensando nos trechos com zoom. "
              "Para a câmera ficar só com o 09, rode o 06 de novo (o padrão agora é --zoom 1).")
        for plano in planos:
            k = next((n for n, tr in enumerate(editada["trechos"]) if tr["inicio"] <= plano["inicio"] < tr["fim"]), 0)
            if k % 2:
                plano["escala"] = round(max(1.0, plano["escala"] / zoom_06), 3)
    livre = sum(p["fim"] - p["inicio"] for p in planos)
    contagem = {n: sum(p["fim"] - p["inicio"] for p in planos if p["plano"] == n) / max(livre, 1e-9)
                for n in ("aberto", "medio", "fechado")}
    trocas = [b["inicio"] - a["inicio"] for a, b in zip(planos, planos[1:]) if a["fim"] == b["inicio"]]

    transcricao.atualizar(caminho, {"enquadramento": {
        "cortes": transcricao.assinatura_dos_cortes(dados),
        "linha": transcricao.assinatura(linha),
        "escalas": escalas,
        "amostras": args.amostras,
        "rosto": [[round(float(v), 3) for v in r] for r in rosto],
        "planos": planos,
    }})
    print(f"{len(planos)} planos ({len(emendas)} emendas, {sum(i['tipo'] == 'cena' for i in linha)} cenas, "
          f"{sum(i['tipo'] == 'destaque' for i in linha)} destaques); troca média a cada "
          f"{np.mean(trocas) if trocas else 0:.1f} s; tempo em cada plano: "
          + ", ".join(f"{n} {v:.0%}" for n, v in contagem.items()))
    print(f"Atualizado: {caminho.name} (seção \"enquadramento\")")
    if not args.sem_exportar:
        EXPORTAR.exportar(pasta.pasta)


if __name__ == "__main__":
    main()
