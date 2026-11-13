#!/usr/bin/env python3
"""
Mantém o motion aprovado no lugar quando o editado.mp4 muda depois da A4 (ritmo, corte, velocidade).

O motion (remotion/src/aulas/<aula>.tsx, cenas, destaques) é escrito nos tempos do editado em que foi
aprovado. Em vez de reescrever tempos à mão, a base de tempo do motion fica congelada na seção "remapa"
e o Remotion reposiciona tudo pelo remotion/public/<slug>/remapa.json ([tempo velho, tempo novo] por
palavra; lido por src/Aula.tsx, src/Reels.tsx e scripts/linha.mjs). Sem remapa.json nada muda.

Uso:
    .venv/bin/python codigos/12_remapar_motion.py videos/<slug> --congelar   # na A4-motion aprovada
    .venv/bin/python codigos/12_remapar_motion.py videos/<slug>              # depois de cada 06 novo

    --congelar   grava a seção "remapa" com as palavras e tempos do editado atual (a base do motion);
                 não sobrescreve uma base existente sem --forcar (o motion continua escrito nela)
    sem opção    alinha por texto a base com o editado atual (difflib, palavras normalizadas) e grava
                 os pares estritamente crescentes em remotion/public/<slug>/remapa.json; se o editado
                 for o mesmo da base, não há o que remapear

Seção "remapa": {"cortes": assinatura do editado da base, "data", "palavras": [[palavra, início, fim], ...]}.
Origem: aula 01 (2026-11-12), ritmo refeito depois do motion aprovado; a base ficou num arquivo solto em
previas/ e o script no scratchpad, e quase se perderam na limpeza.
"""

import argparse
import difflib
import json
import sys
from datetime import date
from pathlib import Path

import caminhos
import transcricao

ERROS = transcricao.carregar_codigo("03_remover_erros.py")


def congelar(caminho: Path, forcar: bool) -> None:
    dados = transcricao.carregar(caminho, exigir=("palavras", "edicao"))
    if "remapa" in dados and not forcar:
        sys.exit("Erro: a base do motion já está congelada (seção \"remapa\", editado "
                 f"{dados['remapa'].get('cortes')}). O motion está escrito nela; use --forcar só se o "
                 "motion foi reescrito nos tempos do editado atual.")
    linha = transcricao.linha_do_tempo(caminho)
    base = [[p["palavra"], p["inicio"], p["fim"]] for p in linha["palavras"]]
    transcricao.atualizar(caminho, {"remapa": {"cortes": dados["edicao"].get("cortes"),
                                               "data": date.today().isoformat(), "palavras": base}})
    print(f"Base do motion congelada: {len(base)} palavras, editado {dados['edicao'].get('cortes')}.")


def remapear(caminho: Path, saida: Path) -> None:
    dados = transcricao.carregar(caminho, exigir=("palavras", "edicao"))
    if "remapa" not in dados:
        sys.exit("Erro: sem base do motion (seção \"remapa\"). Rode com --congelar na aprovação da A4.")
    base = dados["remapa"]["palavras"]
    if dados["remapa"].get("cortes") == dados["edicao"].get("cortes"):
        print("O editado é o mesmo da base do motion: nada a remapear.")
        if saida.is_file():
            print(f"Aviso: {saida} existe e não deveria; o motion está sendo deslocado sem motivo.")
        return
    nova = transcricao.linha_do_tempo(caminho)["palavras"]
    a = [ERROS.normalizar(p[0]) for p in base]
    b = [ERROS.normalizar(p["palavra"]) for p in nova]
    pares = sorted([round(base[bl.a + k][1], 3), round(nova[bl.b + k]["inicio"], 3)]
                   for bl in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks()
                   for k in range(bl.size))
    crescentes = []
    for par in pares:  # estritamente crescente nos dois tempos (a interpolação do Remotion exige)
        if not crescentes or (par[0] > crescentes[-1][0] and par[1] > crescentes[-1][1]):
            crescentes.append(par)
    cobertura = len(crescentes) / max(1, len(a))
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(crescentes), encoding="utf-8")
    print(f"Palavras: base {len(a)}, atual {len(b)}, pares {len(crescentes)} (cobertura {cobertura:.0%}).")
    print(f"Fim: base {base[-1][2]:.1f} s -> atual {nova[-1]['fim']:.1f} s. Salvo em {saida}")
    if cobertura < 0.8:
        print("Aviso: cobertura abaixo de 80%: cenas em trechos cortados ou reescritos podem cair fora "
              "do lugar. Conferir num render curto dessas cenas.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Remapeia o motion aprovado para o editado atual.")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("--congelar", action="store_true", help="Grava a base do motion (na A4 aprovada)")
    parser.add_argument("--forcar", action="store_true", help="Com --congelar: substitui a base existente")
    args = parser.parse_args()
    pasta = caminhos.video(args.video)
    if args.congelar:
        congelar(pasta.transcricao, args.forcar)
    else:
        remapear(pasta.transcricao, pasta.pasta_remotion / "remapa.json")


if __name__ == "__main__":
    main()
