#!/usr/bin/env python3
"""
Conferência automática do motion na aula montada (vídeo editado + câmera do 09 + cenas e destaques).
Roda antes de toda amostra que vai ao autor; com falha, a amostra não vai.

Por que existe (2026-11-13): frase longa, texto parado e texto atravessando o rosto já eram proibidos no
estilo.md e passaram assim mesmo, porque a conferência dependia de alguém lembrar de olhar os quadros. Regra escrita
não bastou; aqui a máquina mede. O que não dá para medir (se o vídeo cumpre a Direção, se a cena é genérica)
continua no revisor.md.

Uso:
    .venv/bin/python codigos/13_conferir_motion.py videos/<slug>
    .venv/bin/python codigos/13_conferir_motion.py videos/<slug> --palavras 8 --parado 3     # limites da Direção
    .venv/bin/python codigos/13_conferir_motion.py videos/<slug> --simular                    # não grava nem chama o 09

Como mede: o remotion/scripts/conferir.mjs grava, para 3 instantes de cada item, um quadro com motion e um sem
(só vídeo + câmera). A diferença entre os dois é onde o motion cai na tela, qualquer que seja o componente. O rosto
vem da seção "enquadramento" (rastreio + plano da câmera naquele instante).

O que confere (regra entre colchetes; é o nome usado para liberar):
    [rosto]           destaque em cima do rosto, em algum plano da câmera (falha)
    [faixa]           destaque na faixa dos controles do player, embaixo, no horizontal (falha)
    [frase-longa]     frase de destaque com mais palavras que o limite (--palavras; a base do estilo é 2–5 e já
                      houve frase aprovada com 6: falha acima de 6) (falha)
    [frase-esticada]  frase que leva mais de 2 s montando ao longo da fala em vez de entrar junta (falha)
    [colisao]         dois destaques ao mesmo tempo, ou destaque em cima de cena (falha)
    [perto]           destaque encostando no rosto (aviso)
    [parado]          destaque sem batida por mais que o limite (--parado; base 2 s) (aviso: parado para ler ou dar
                      peso é intenção; não vale para formato em que cada elemento entra e sai, como ícones)

Limite do que mede: rosto, faixa e perto só nos destaques (camada sobre o vídeo). Cena desenha a própria câmera,
com o vídeo num tempo ligeiramente diferente, e a diferença de quadros acusa mão e boca em movimento; cena continua
conferida no olho (revisor.md, quadros.mjs).

Câmera que se ajusta sozinha: o motion fica fora do zoom da câmera, então um destaque certo no plano aberto pode
atravessar o rosto quando ela fecha. Para cada item com [rosto], o 13 calcula o maior plano em que o rosto fica
livre (o "teto"), grava em "conferencia" e chama o 09 --so-tetos, que abre a câmera só naquele trecho. Só vira falha
o item que cobre o rosto mesmo com a câmera aberta: aí é a cena que precisa mudar.

Liberar de propósito (decisão da Direção do vídeo): na seção "conferencia" do transcricao.json,
    "liberados": [{"id": "d12-frase", "regra": "frase-longa", "motivo": "citação literal do cliente"}]
O item liberado aparece no relatório como liberado, com o motivo, e não bloqueia.

Saída: seção "conferencia" (tetos, liberados, resultado), previas/conferencia.txt e, se houver falha ou aviso de
imagem, previas/conferencia.jpg (os quadros com o rosto e o motion marcados). Sai com código 1 se houver falha.
"""

import argparse
import datetime
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

import caminhos
import transcricao

CENTRALIZAR = 0.5  # igual ao remotion/src/Camera.tsx: quanto o rosto anda para o centro quando a câmera fecha
PRESENCA = 28  # diferença (0–255) a partir da qual há motion no pixel
MEDIA = 45  # elemento de verdade (texto, card, ícone); deixa de fora o degradê suave do pé da imagem
FORTE = 70  # diferença de texto e elemento sólido (ignora sombra e degradê suave)
TELA_CHEIA = 0.5  # item que muda mais que isso do quadro desenha a tela inteira: rosto e faixa não se aplicam
FAIXA_PLAYER = 960 / 1080  # horizontal: abaixo disso ficam os controles do player (setup/plataformas.md §2)
FALHAS = ("rosto", "faixa", "frase-longa", "frase-esticada", "colisao")


# --------------------------------------------------------------------------------------------
# Rosto na tela
# --------------------------------------------------------------------------------------------


def plano_em(planos: list[dict], t: float) -> dict | None:
    return next((p for p in planos if p["inicio"] <= t < p["fim"]), None)


def rosto_na_tela(camera: dict, t: float, proporcao: float, escala: float | None = None,
                  ancorar: bool | None = None) -> tuple[float, float, float, float] | None:
    """Caixa do rosto (x0, y0, x1, y1) em fração da tela no instante t, já com a transformação da câmera.
    `escala`/`ancorar` simulam outro plano no mesmo instante (para calcular o teto)."""
    rosto = np.array(camera["rosto"], dtype=float)
    if not len(rosto):
        return None
    x, y, h = (float(np.interp(t, rosto[:, 0], rosto[:, c])) for c in (1, 2, 3))
    plano = plano_em(camera["planos"], t)
    s = escala if escala is not None else (plano["escala"] if plano else 1.0)
    k = 0.0 if (ancorar if ancorar is not None else bool(plano and plano.get("ancorar"))) else CENTRALIZAR
    fx, fy = (plano.get("fx", x), plano.get("fy", y)) if plano else (x, y)

    def desloc(f: float) -> float:
        return min(0.0, max(1 - s, f + k * (0.5 - f) - s * f))

    cx, cy, alt = s * x + desloc(fx), s * y + desloc(fy), s * h
    larg = alt * 0.8 / proporcao  # a altura é fração da altura do quadro; a largura, da largura
    # a caixa do detector vai da testa ao queixo: sobe um pouco para o cabelo
    return cx - larg / 2, cy - alt * 0.62, cx + larg / 2, cy + alt * 0.55


def cobertura(mascara: np.ndarray, caixa: tuple[float, float, float, float], folga: float = 0.0) -> float:
    """Fração da caixa (ampliada em `folga` × a própria altura) coberta por motion."""
    alt, larg = mascara.shape
    x0, y0, x1, y1 = caixa
    fy, fx = (y1 - y0) * folga, (x1 - x0) * folga
    a, b = max(0, round((y0 - fy) * alt)), min(alt, round((y1 + fy) * alt))
    c, d = max(0, round((x0 - fx) * larg)), min(larg, round((x1 + fx) * larg))
    if b <= a or d <= c:
        return 0.0
    return float(mascara[a:b, c:d].mean())


# --------------------------------------------------------------------------------------------
# Quadros
# --------------------------------------------------------------------------------------------


def medir(pasta_quadros: Path, itens: list[dict]) -> None:
    """Acrescenta a cada quadro: mascara (onde há motion), forte (texto/elemento sólido) e área."""
    import cv2

    nucleo = np.ones((3, 3), np.uint8)
    for item in itens:
        for q in item["quadros"]:
            com = cv2.imread(str(pasta_quadros / f"{item['id']}_{q['k']}_com.png"))
            sem = cv2.imread(str(pasta_quadros / f"{item['id']}_{q['k']}_sem.png"))
            # diferença de luminância, não de cor: efeito na imagem inteira (preto e branco na voz do outro, tinta de
            # cor) muda a cor da pele sem pôr nada em cima do rosto; texto e card mudam o brilho
            dif = cv2.absdiff(cv2.cvtColor(com, cv2.COLOR_BGR2GRAY), cv2.cvtColor(sem, cv2.COLOR_BGR2GRAY))
            q["mascara"] = cv2.morphologyEx((dif > PRESENCA).astype(np.uint8), cv2.MORPH_OPEN, nucleo).astype(bool)
            q["media"] = cv2.morphologyEx((dif > MEDIA).astype(np.uint8), cv2.MORPH_OPEN, nucleo).astype(bool)
            q["forte"] = cv2.morphologyEx((dif > FORTE).astype(np.uint8), cv2.MORPH_OPEN, nucleo).astype(bool)
            q["area"] = float(q["mascara"].mean())
            q["imagem"] = com


def folha(itens_marcados: list[tuple[dict, dict, tuple | None, str]], destino: Path) -> None:
    """Quadros com problema lado a lado: rosto em vermelho, motion contornado em amarelo."""
    import cv2

    celulas = []
    for item, q, caixa, rotulo in itens_marcados[:12]:
        img = q["imagem"].copy()
        alt, larg = img.shape[:2]
        contornos, _ = cv2.findContours(q["media"].astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(img, contornos, -1, (0, 220, 255), 2)
        if caixa:
            cv2.rectangle(img, (round(caixa[0] * larg), round(caixa[1] * alt)),
                          (round(caixa[2] * larg), round(caixa[3] * alt)), (0, 0, 255), 3)
        cv2.rectangle(img, (0, 0), (larg, 44), (0, 0, 0), -1)
        cv2.putText(img, f"{item['id']} {q['t']:.1f}s {rotulo}"[:70], (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                    (255, 255, 255), 2)
        celulas.append(cv2.resize(img, (640, 360)))
    if not celulas:
        return
    while len(celulas) % 3:
        celulas.append(np.zeros_like(celulas[0]))
    linhas = [np.hstack(celulas[i:i + 3]) for i in range(0, len(celulas), 3)]
    destino.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(destino), np.vstack(linhas), [cv2.IMWRITE_JPEG_QUALITY, 82])


# --------------------------------------------------------------------------------------------
# Texto e tempo (pelas props do item, sem renderizar)
# --------------------------------------------------------------------------------------------


def achar(valor, chave: str):
    """Primeiro valor de `chave` em qualquer profundidade."""
    if isinstance(valor, dict):
        if chave in valor:
            return valor[chave]
        for v in valor.values():
            r = achar(v, chave)
            if r is not None:
                return r
    elif isinstance(valor, list):
        for v in valor:
            r = achar(v, chave)
            if r is not None:
                return r
    return None


def batidas(valor) -> list[float]:
    """Todos os instantes em que algo acontece no item (campos t, risco, rotuloT...), em s desde o início."""
    saida: list[float] = []
    if isinstance(valor, dict):
        for k, v in valor.items():
            if isinstance(v, (int, float)) and not isinstance(v, bool) and (k == "t" or k.endswith("T") or k == "risco"):
                saida.append(float(v))
            else:
                saida.extend(batidas(v))
    elif isinstance(valor, list):
        for v in valor:
            saida.extend(batidas(v))
    return saida


def conferir_texto(item: dict, limite_palavras: int, limite_parado: float) -> list[tuple[str, str]]:
    achados: list[tuple[str, str]] = []
    props = item.get("props") or {}
    formato = achar(props, "formato") or item.get("componente") or ""
    if formato == "Frase":
        palavras = achar(props, "palavras") or []
        n = sum(len(str(p.get("texto", "")).split()) for p in palavras)
        if n > limite_palavras:
            texto = " ".join(str(p.get("texto", "")) for p in palavras)
            achados.append(("frase-longa", f"{n} palavras (limite {limite_palavras}): \"{texto}\""))
        tempos = [p["t"] for p in palavras if isinstance(p.get("t"), (int, float))]
        if len(tempos) > 1 and max(tempos) - min(tempos) > 2.0:
            achados.append(("frase-esticada", f"monta em {max(tempos) - min(tempos):.1f} s; a síntese entra junta na palavra-chave"))
    if item["tipo"] == "destaque" and achar(props, "segura") is None:
        marcos = sorted({0.0, *[b for b in batidas(props) if 0 <= b <= item["dur"]], item["dur"]})
        vao = max((b - a for a, b in zip(marcos, marcos[1:])), default=0.0)
        if vao > limite_parado:
            achados.append(("parado", f"{vao:.1f} s sem batida (limite {limite_parado:g} s)"))
    return achados


def colisoes(itens: list[dict]) -> list[tuple[str, str, str]]:
    saida = []
    ordenados = sorted(itens, key=lambda i: i["inicio"])
    for n, a in enumerate(ordenados):
        for b in ordenados[n + 1:]:
            if b["inicio"] >= a["inicio"] + a["dur"] - 0.05:
                break
            if "destaque" in (a["tipo"], b["tipo"]):
                junto = min(a["inicio"] + a["dur"], b["inicio"] + b["dur"]) - b["inicio"]
                saida.append((b["id"] if b["tipo"] == "destaque" else a["id"], "colisao",
                              f"{a['id']} ({a['tipo']}) × {b['id']} ({b['tipo']}) juntos por {junto:.1f} s"))
    return saida


# --------------------------------------------------------------------------------------------
# Imagem: rosto, faixa e teto da câmera
# --------------------------------------------------------------------------------------------


def conferir_imagem(itens: list[dict], camera: dict | None, largura: int, altura: int):
    """(achados, tetos, marcados). Teto = maior escala em que o rosto fica livre durante o item."""
    proporcao = largura / altura
    achados: list[tuple[str, str, str]] = []
    marcados: list[tuple[dict, dict, tuple | None, str]] = []
    tetos: dict[str, float] = {}
    escalas = sorted(set((camera or {}).get("escalas", {"aberto": 1.0}).values()))
    for item in itens:
        if item["tipo"] != "destaque":
            continue  # cena desenha a própria câmera: a diferença de quadros não separa motion de movimento do vídeo
        sobrepoe = [q for q in item["quadros"] if 0.0005 < q["area"] <= TELA_CHEIA]
        if not sobrepoe:
            continue
        if largura > altura:
            for q in sobrepoe:
                corte = round(FAIXA_PLAYER * q["forte"].shape[0])
                if q["forte"][corte:].mean() > 0.004:
                    achados.append((item["id"], "faixa", f"elemento na faixa dos controles do player em {q['t']:.1f} s"))
                    marcados.append((item, q, None, "faixa do player"))
                    break
        if not camera:
            continue
        pior, perto = None, None
        for q in sobrepoe:
            caixa = rosto_na_tela(camera, q["t"], proporcao)
            if caixa is None:
                continue
            dentro = cobertura(q["media"], caixa)
            if dentro > 0.03 and (pior is None or dentro > pior[0]):
                pior = (dentro, q, caixa)
            elif cobertura(q["media"], caixa, folga=0.2) > 0.03 and perto is None:
                perto = (q, caixa)
        if pior:
            # maior plano em que o rosto fica livre em todos os instantes medidos
            livre = [s for s in escalas
                     if all(cobertura(q["media"], rosto_na_tela(camera, q["t"], proporcao, s, True)) <= 0.03 for q in sobrepoe)]
            atual = max((plano_em(camera["planos"], q["t"]) or {}).get("escala", 1.0) for q in sobrepoe)
            if livre and max(livre) < atual:
                tetos[item["id"]] = max(livre)
                achados.append((item["id"], "rosto", f"cobre {pior[0]:.0%} do rosto com a câmera em {atual:g}×; "
                                                      f"livre até {max(livre):g}× (o 09 abre a câmera neste trecho)"))
            else:
                achados.append((item["id"], "rosto", f"cobre {pior[0]:.0%} do rosto em {pior[1]['t']:.1f} s, mesmo com a "
                                                      "câmera aberta: a cena precisa mudar de lugar ou de forma"))
            marcados.append((item, pior[1], pior[2], "sobre o rosto"))
        elif perto:
            achados.append((item["id"], "perto", f"encosta no rosto em {perto[0]['t']:.1f} s"))
            marcados.append((item, perto[0], perto[1], "perto do rosto"))
    return achados, tetos, marcados


def main() -> None:
    parser = argparse.ArgumentParser(description="Confere o motion na aula montada antes de mandar amostra ao autor.")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("--palavras", type=int, default=None, help="Máximo de palavras numa frase de destaque (padrão: 6; a Direção pode mudar)")
    parser.add_argument("--parado", type=float, default=None, help="Segundos sem batida a partir dos quais avisa (base: 2)")
    parser.add_argument("--itens", nargs="*", default=[], help="Só estes ids (padrão: todos)")
    parser.add_argument("--simular", action="store_true", help="Não grava a seção nem chama o 09; só mostra o relatório")
    parser.add_argument("--sem-corrigir", action="store_true", help="Grava os tetos mas não chama o 09")
    parser.add_argument("--quadros", type=Path, default=None, help="Reaproveita uma pasta de quadros já gerada pelo conferir.mjs")
    args = parser.parse_args()

    pasta = caminhos.video(args.video)
    dados = transcricao.carregar(pasta.transcricao, exigir=("palavras",))
    anterior = dados.get("conferencia", {})
    limites = anterior.get("limites", {})
    limite_palavras = args.palavras if args.palavras is not None else limites.get("palavras", 6)
    limite_parado = args.parado if args.parado is not None else limites.get("parado", 2.0)
    liberados = {(l["id"], l["regra"]): l.get("motivo", "") for l in anterior.get("liberados", [])}
    camera = dados.get("enquadramento")
    if not camera:
        print("Aviso: sem a seção \"enquadramento\" (o 09 ainda não rodou): confiro texto, tempo e faixa; rosto fica para depois da câmera.")

    temporaria = None
    if args.quadros:
        quadros = args.quadros
    else:
        temporaria = tempfile.mkdtemp(prefix="conferir-")
        quadros = Path(temporaria)
        print("Gerando os quadros com e sem motion (alguns minutos)...")
        r = subprocess.run(["node", "scripts/conferir.mjs", pasta.nome, str(quadros), *args.itens], cwd=caminhos.PASTA_REMOTION)
        if r.returncode != 0:
            sys.exit("Erro: o remotion/scripts/conferir.mjs falhou (rode o 08 antes; confira public/<slug>/aula.json).")
    try:
        registro = json.loads((quadros / "itens.json").read_text(encoding="utf-8"))
        itens = registro["itens"]
        medir(quadros, itens)

        achados = [(i["id"], regra, texto) for i in itens for regra, texto in conferir_texto(i, limite_palavras, limite_parado)]
        achados += colisoes(itens)
        de_imagem, tetos, marcados = conferir_imagem(itens, camera, registro["largura"], registro["altura"])

        # câmera que se ajusta: grava os tetos e pede ao 09 para abrir só nos trechos que precisam
        if tetos and not args.simular:
            transcricao.atualizar(pasta.transcricao, {"conferencia": {**anterior, "tetos": {**anterior.get("tetos", {}), **tetos}}})
            if not args.sem_corrigir:
                print(f"Abrindo a câmera em {len(tetos)} trecho(s) (09 --so-tetos)...")
                subprocess.run([sys.executable, str(caminhos.PASTA_CODIGOS / "09_enquadrar.py"), str(pasta.pasta), "--so-tetos"], check=True)
                dados = transcricao.carregar(pasta.transcricao)
                anterior, camera = dados.get("conferencia", {}), dados.get("enquadramento")
                # o motion não mudou (fica fora da câmera): basta refazer a conta com os planos novos
                de_imagem, tetos, marcados = conferir_imagem(itens, camera, registro["largura"], registro["altura"])
        achados += de_imagem

        falhas = [a for a in achados if a[1] in FALHAS and (a[0], a[1]) not in liberados]
        soltos = [a for a in achados if a[1] in FALHAS and (a[0], a[1]) in liberados]
        avisos = [a for a in achados if a[1] not in FALHAS and (a[0], a[1]) not in liberados]
        linhas = [f"Conferência do motion: {pasta.nome} ({datetime.date.today().isoformat()})",
                  f"{len(itens)} itens conferidos; limites: frase até {limite_palavras} palavras, parado até {limite_parado:g} s",
                  "", f"FALHAS ({len(falhas)}): bloqueiam a amostra"]
        linhas += [f"  [{regra}] {ident}: {texto}" for ident, regra, texto in falhas] or ["  nenhuma"]
        linhas += ["", f"AVISOS ({len(avisos)}): olhar; parado para ler ou dar peso é intenção"]
        linhas += [f"  [{regra}] {ident}: {texto}" for ident, regra, texto in avisos] or ["  nenhum"]
        if soltos:
            linhas += ["", f"LIBERADOS pela Direção ({len(soltos)})"]
            linhas += [f"  [{regra}] {ident}: {liberados[(ident, regra)]}" for ident, regra, _ in soltos]
        if camera and camera.get("tetos"):
            linhas += ["", "Câmera aberta pelo 09 por causa do motion: " + ", ".join(f"{k} (até {v:g}×)" for k, v in camera["tetos"].items())]
        relatorio = "\n".join(linhas)
        print("\n" + relatorio)

        if not args.simular:
            pasta.pasta_previas.mkdir(parents=True, exist_ok=True)
            (pasta.pasta_previas / "conferencia.txt").write_text(relatorio + "\n", encoding="utf-8")
            imagem = pasta.pasta_previas / "conferencia.jpg"
            imagem.unlink(missing_ok=True)
            folha(marcados, imagem)
            transcricao.atualizar(pasta.transcricao, {"conferencia": {
                **anterior,
                "limites": {"palavras": limite_palavras, "parado": limite_parado},
                "resultado": {"data": datetime.date.today().isoformat(), "itens": len(itens), "falhas": len(falhas),
                              "avisos": len(avisos), "linha": transcricao.assinatura([[i["id"], i["inicio"], i["dur"]] for i in itens]),
                              "cortes": transcricao.assinatura_dos_cortes(dados) if "erros" in dados else None},
            }})
        elif marcados:
            folha(marcados, quadros / "conferencia.jpg")
            print(f"Quadros marcados: {quadros / 'conferencia.jpg'}")
    finally:
        if temporaria and not args.simular:
            shutil.rmtree(temporaria, ignore_errors=True)
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
