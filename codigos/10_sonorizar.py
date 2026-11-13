#!/usr/bin/env python3
"""
Etapa 8 (som): grava a seção "sfx". Padrão (--modo contexto): só os sons que os itens declaram em `sons`
(som com contexto real na cena). --modo eventos: o comportamento antigo, um som por evento visual.
Roda depois da câmera (09), porque os eventos saem do motion e da câmera. Não mixa nada: o Remotion
toca os arquivos (Sons em remotion/src/Camera.tsx) e o 08 leva a seção para o aula.json (chamado no fim).

Uso:
    .venv/bin/python codigos/10_sonorizar.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/10_sonorizar.py videos/01-meu-primeiro-video --sem-camera --intervalo 0.8

Eventos (setup/estilo.md §9 e elementos.md §2), por prioridade quando dois caem juntos:
    1. entrada de cena (tela de motion)             -> sfx_whoosh / sfx_transicao
    2. saída de cena (volta para a câmera)          -> sfx_fechar / sfx_whoosh-reverso
    3. entrada de destaque, pelo formato do id      -> número: sfx_impacto; balão: sfx_notificacao;
                                                       tópico/capítulo: sfx_tick; riscadas: sfx_revelar;
                                                       demais: sfx_pop
    4. câmera fechando em ênfase (seção "enquadramento", motivo "ênfase"), no máximo um a cada
       --intervalo-camera s (troca de plano da escada não tem som: são centenas)
Regras: nunca o mesmo arquivo duas vezes seguidas; dois SFX a menos de --intervalo s: fica o de
maior prioridade; volume pelo pico de cada arquivo (medido com o FFmpeg), sempre abaixo da voz:
cena -12 dBFS, destaque -15, câmera -20. Só usa o que existe em setup/biblioteca/audio/ (sfx_<tipo>-<nn>).
SFX de dentro de uma cena (clique, notificação, contador) fica no componente da cena.

Entrada: edicao/transcricao.json ("edicao"; "enquadramento" opcional) + linha do tempo do Remotion.
Saída: seção "sfx": {"cortes", "linha", "eventos": [{"t", "evento", "item", "arquivo", "volume"}]}.
"""

import argparse
import re
import subprocess
from pathlib import Path

import caminhos
import transcricao

ENQUADRAR = transcricao.carregar_codigo("09_enquadrar.py")
EXPORTAR = transcricao.carregar_codigo("08_exportar_para_remotion.py")
PASTA_SONS = caminhos.RAIZ_PROJETO / "setup" / "biblioteca" / "audio"

# evento -> (tipos de SFX aceitos, pico alvo em dBFS, prioridade)
EVENTOS = {
    "cena": (["whoosh", "transicao"], -12, 1),
    "saida": (["fechar", "whoosh-reverso"], -14, 2),
    "destaque-numero": (["impacto"], -15, 3),
    "destaque-balao": (["notificacao"], -15, 3),
    "destaque-topico": (["tick"], -15, 3),
    "destaque-riscadas": (["revelar"], -15, 3),
    "destaque": (["pop"], -15, 3),
    "camera": (["whoosh"], -20, 4),
}
# Modo contexto (padrão desde 2026-11-12): só os sons que cada item declara em `sons` na linha do tempo
# (aulas/<aula>.tsx), porque a cena tem um som real (notificação chegando, contador, clique, página virando,
# selo batendo). Nada de som em frase, palavra, riscado, ícone, saída ou câmera. Aula 01: "efeitos sem contexto".
SONS_CONTEXTO = {
    "notificacao": (["notificacao"], -18),
    "contador": (["contador"], -20),
    "clique": (["click"], -20),
    "digitacao": (["digitacao"], -22),
    "impacto": (["impacto"], -18),
    "rolagem": (["rolagem"], -22),
    "revelar": (["revelar"], -20),
    "transicao": (["whoosh", "transicao"], -20),
    "obturador": (["obturador"], -20),
    "virada": (["tick"], -22),  # página de calendário virando
}
for _tipo, (_arquivos, _alvo) in SONS_CONTEXTO.items():
    EVENTOS["som-" + _tipo] = (_arquivos, _alvo, 3)

FORMATO_DESTAQUE = {"numero": "destaque-numero", "balao": "destaque-balao", "topico": "destaque-topico",
                    "capitulo": "destaque-topico", "riscadas": "destaque-riscadas"}


def biblioteca() -> dict[str, list[str]]:
    """{tipo: [arquivos]} a partir de sfx_<tipo>-<nn>.<ext>."""
    tipos: dict[str, list[str]] = {}
    for arquivo in sorted(PASTA_SONS.glob("sfx_*")):
        m = re.match(r"sfx_(.+)-(\d+)\.(wav|mp3|ogg|m4a)$", arquivo.name)
        if m:
            tipos.setdefault(m.group(1), []).append(arquivo.name)
    return tipos


def pico(arquivo: str) -> float:
    """Pico do arquivo em dBFS (volumedetect)."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(PASTA_SONS / arquivo), "-af", "volumedetect",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"max_volume: (-?[\d.]+) dB", r.stderr)
    return float(m.group(1)) if m else 0.0


def main() -> None:
    parser = argparse.ArgumentParser(description="Escolhe os SFX por evento visual (etapa 8) e grava a seção sfx.")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("--intervalo", type=float, default=0.5, help="Distância mínima entre dois SFX, em s (padrão: 0.5)")
    parser.add_argument("--intervalo-camera", type=float, default=4.0,
                        help="Distância mínima de um SFX de câmera para qualquer outro, em s (padrão: 4)")
    parser.add_argument("--modo", choices=["contexto", "eventos"], default="contexto",
                        help="contexto (padrão): só os sons declarados pelos itens; eventos: um som por evento visual (antigo)")
    parser.add_argument("--sem-camera", action="store_true", help="Sem som nos fechamentos de câmera")
    parser.add_argument("--sem-exportar", action="store_true", help="Não roda o 08 no fim")
    args = parser.parse_args()

    pasta = caminhos.video(args.video)
    caminho = pasta.transcricao
    transcricao.linha_do_tempo(caminho)  # para se os cortes mudaram depois do render
    dados = transcricao.carregar(caminho, exigir=("palavras", "edicao"))
    linha = ENQUADRAR.linha_do_remotion(pasta.nome)
    duracao = dados["edicao"]["duracao"]

    candidatos = []  # (t, evento, item)
    inicios = {round(i["inicio"], 2) for i in linha}
    for item in linha:
        for som in item.get("sons") or []:
            if som.get("tipo") in SONS_CONTEXTO:
                candidatos.append((item["inicio"] + som["t"], "som-" + som["tipo"], item["id"]))
        if args.modo == "contexto":
            continue
        if item["tipo"] == "cena":
            # som na entrada visual de fato (campo "entrada" do item), não no início da janela da cena
            candidatos.append((item["inicio"] + item.get("entrada", 0), "cena", item["id"]))
            fim = item["inicio"] + item["dur"]
            if round(fim, 2) not in inicios and fim < duracao - 0.5:
                candidatos.append((fim, "saida", item["id"]))
        else:
            partes = item["id"].split("-")
            formato = partes[1] if len(partes) > 1 else ""
            candidatos.append((item["inicio"] + item.get("entrada", 0), FORMATO_DESTAQUE.get(formato, "destaque"), item["id"]))
    enquadramento = dados.get("enquadramento")
    if enquadramento and not args.sem_camera and args.modo == "eventos":
        if enquadramento.get("cortes") != transcricao.assinatura_dos_cortes(dados):
            print("Aviso: a seção \"enquadramento\" é de outros cortes; sem sons de câmera (rode o 09).")
        else:
            candidatos += [(p["inicio"], "camera", f"plano {p['palavra']}") for p in enquadramento["planos"]
                           if p["motivo"] == "ênfase"]

    # prioridade quando dois caem perto
    escolhidos: list[tuple] = []
    for c in sorted(candidatos, key=lambda c: (EVENTOS[c[1]][2], c[0])):
        distancia = args.intervalo_camera if c[1] == "camera" else args.intervalo
        if all(abs(c[0] - e[0]) >= (args.intervalo_camera if "camera" in (c[1], e[1]) else distancia)
               for e in escolhidos):
            escolhidos.append(c)
    escolhidos.sort()

    sons = biblioteca()
    picos: dict[str, float] = {}
    giro: dict[str, int] = {}
    eventos, ultimo, faltando = [], None, set()
    for t, evento, item in escolhidos:
        tipos, alvo, _ = EVENTOS[evento]
        opcoes = [a for tipo in tipos for a in sons.get(tipo, [])]
        if not opcoes:
            faltando.add(evento)
            continue
        n = giro.get(evento, 0)
        arquivo = opcoes[n % len(opcoes)]
        if arquivo == ultimo and len(opcoes) > 1:
            n += 1
            arquivo = opcoes[n % len(opcoes)]
        giro[evento] = n + 1
        if arquivo not in picos:
            picos[arquivo] = pico(arquivo)
        volume = min(1.0, 10 ** ((alvo - picos[arquivo]) / 20))
        eventos.append({"t": round(t, 3), "evento": evento, "item": item, "arquivo": arquivo, "volume": round(volume, 3)})
        ultimo = arquivo

    transcricao.atualizar(caminho, {"sfx": {
        "cortes": transcricao.assinatura_dos_cortes(dados),
        "linha": transcricao.assinatura(linha),
        "eventos": eventos,
    }})
    por_evento: dict[str, int] = {}
    for e in eventos:
        por_evento[e["evento"]] = por_evento.get(e["evento"], 0) + 1
    print(f"{len(eventos)} SFX ({', '.join(f'{k} {v}' for k, v in sorted(por_evento.items()))}); "
          f"{len(candidatos) - len(escolhidos)} descartados por estarem perto demais de outro.")
    if faltando:
        print(f"Faltam na biblioteca SFX para: {', '.join(sorted(faltando))} (setup/biblioteca/audio/sfx_<tipo>-<nn>).")
    print(f"Atualizado: {caminho.name} (seção \"sfx\")")
    if not args.sem_exportar:
        EXPORTAR.exportar(pasta.pasta)


if __name__ == "__main__":
    main()
