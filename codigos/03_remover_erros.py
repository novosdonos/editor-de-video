#!/usr/bin/env python3
"""
Confere a análise dos erros de fala (repetições, falsos começos, regravações, "mm-mm",
palavra trocada) e as correções do vocabulário contra a transcrição, e mostra o relatório
para revisão. Não grava nada: o 06 aplica a mesma análise (função aplicar_erros) e corta
silêncios e erros juntos, numa única renderização a partir do original.

Uso:
    .venv/bin/python codigos/03_remover_erros.py videos/01-meu-primeiro-video

Lê a seção "erros" (escrita pelo Claude) e "palavras" (do 02) de edicao/transcricao.json
(seções e quem grava cada uma: ver transcricao.py).

Formato da seção "erros" (índices de "palavras", "ate" inclusivo):
    "erros": {
      "cortes": [
        {"de": 0, "ate": 86, "tipo": "regravação", "texto": "Teste. Três. Dois. ..."}
      ],
      "correcoes": [
        {"de": 1730, "ate": 1731, "texto": "que quizá", "para": "quiçá"}
      ]
    }
    "texto" é conferido contra a transcrição: se não bater, o script para sem alterar nada.
    Corte editorial (conteúdo que sai mesmo bem falado: tangente, ideia repetida, bastidor):
        {"de": 900, "ate": 1012, "tipo": "editorial", "motivo": "tangente sobre ...", "incerto": true}
    Depois que o autor aprova um corte editorial ou incerto: "aprovado": true (sai da revisão).
    Avisos que o autor decidiu manter (repetição intencional, emenda que ele ouviu e aprovou):
        "decididos": [{"palavra": 3774, "decisao": "fica", "motivo": "...", "data": "2026-11-11"}]
    "palavra" é o índice do aviso (o #n do relatório) ou o "de" do corte da emenda.
    Hesitação arrastada dentro de uma palavra mantida ("a...", "éééé"; o Parakeet não separa o "é"):
        "aparar": [{"palavra": 1321, "manter": 0.16}]  (segundos que ficam, contados do início acústico
        da palavra, medido pelo 06). Só para arrasto que se ouve: "pandemia..." não tinha arrasto e o
        "aparar" comeu o "a" final (aula 01, 2026-11-12). Medir no áudio antes de marcar.
    "incerto": true marca qualquer corte que o autor precisa confirmar; ele aparece como dúvida
    no relatório e na revisão de cortes (07_revisar_cortes.py). Corte editorial sempre leva "motivo".
    "correcoes" é opcional e serve para os casos do vocabulário que dependem de contexto
    (os marcados com "atenção"); os demais são aplicados automaticamente.

Checklist da análise (aprendizados da aula 01):
    - regravação: manter sempre a ÚLTIMA versão completa da frase; "corta essa parte" dito
      no vídeo = cortar o bloco inteiro até a regravação;
    - falso começo: frase interrompida ("Porque...", "Mas o que mudou...") antes da versão boa;
    - autocorreção de uma palavra ou expressão, fácil de deixar passar: "avalia. Analisa",
      "Precisar necessitar", "o cliente fica esperando. O cliente fica sem resposta",
      "ter mais clareza, ter mais. Estar mais perto";
    - fim de frase repetido logo depois ("...entender melhor o seu caso. Para entender melhor...");
    - regravação que começa com palavras DIFERENTES e repete só o fim da frase: "...do que ficar
      repetindo a mesma explicação sem testar nada. [regravações] Até
      porque o resultado vem da prática. E não de você ficar repetindo a mesma
      explicação sem testar nada." Comparar só o início das frases
      não pega esse caso: depois de marcar os cortes, ler o TEXTO MANTIDO em volta de cada corte
      e conferir a lista "trechos repetidos" do relatório (o vídeo final não pode dizer a mesma
      ideia duas vezes seguidas; na dúvida, perguntar ao autor qual versão fica);
    - gagueira: palavra curta, de baixa confiança e isolada por pausas (ex.: "E" antes de
      "elaborar"). A transcrição registra só um pedaço do som; o script lista essas palavras
      como suspeitas para revisão;
    - ruídos de fala transcritos ("Mm-mm.", "Hmm.") e contagem de gravação ("Três, dois, um").

Saída:
    só no terminal: cortes, correções, palavras suspeitas de gagueira e trechos repetidos no
    texto mantido. Rodar o 03 antes do 06 serve para pegar erro na análise sem esperar a
    renderização.
"""

import argparse
import re
import sys
import unicodedata
from pathlib import Path

import caminhos
import transcricao

VOCABULARIO = caminhos.VOCABULARIO

# --------------------------------------------------------------------------------------------
# Análise de erros
# --------------------------------------------------------------------------------------------


def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto.lower())
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return " ".join(re.sub(r"[^\w\s]", " ", texto).split())


def validar(itens: list[dict], palavras: list[dict], rotulo: str) -> list[dict]:
    itens = sorted((dict(c) for c in itens), key=lambda c: c["de"])  # cópias: não altera o arquivo
    for n, c in enumerate(itens):
        de, ate = c["de"], c["ate"]
        if not (0 <= de <= ate < len(palavras)):
            sys.exit(f"Erro: {rotulo} {de}-{ate} fora do intervalo de palavras (0-{len(palavras) - 1}).")
        if n and de <= itens[n - 1]["ate"]:
            sys.exit(f"Erro: {rotulo} {de}-{ate} se sobrepõe a {itens[n - 1]['de']}-{itens[n - 1]['ate']}.")
        real = " ".join(p["palavra"] for p in palavras[de:ate + 1])
        if "texto" in c and normalizar(c["texto"]) != normalizar(real):
            sys.exit(f"Erro: o texto de {rotulo} {de}-{ate} não bate com a transcrição.\n"
                     f"  Análise:     {c['texto']}\n  Transcrição: {real}")
        c["texto"] = real
    return itens


def substituir(palavras: list[dict], de: int, ate: int, novo: str) -> dict:
    """Junta as palavras de..ate numa só, com o texto novo e a pontuação final da última."""
    pontuacao = re.search(r"[^\w]*$", palavras[ate]["palavra"]).group()
    return {
        **palavras[de],
        "palavra": novo.rstrip(".,;:!?…") + pontuacao,
        "fim": palavras[ate]["fim"],
        "confianca": min(p["confianca"] for p in palavras[de:ate + 1]),
    }


def palavras_suspeitas(palavras: list[dict], removidas: set[int]) -> list[int]:
    """Palavra curta, de baixa confiança e cercada de pausas: costuma ser gagueira."""
    suspeitas = []
    for i, p in enumerate(palavras):
        if i in removidas or p["confianca"] >= 0.6 or p["fim"] - p["inicio"] > 0.25:
            continue
        pausa_antes = p["inicio"] - palavras[i - 1]["fim"] if i else 1.0
        pausa_depois = palavras[i + 1]["inicio"] - p["fim"] if i + 1 < len(palavras) else 1.0
        if pausa_antes >= 0.5 and pausa_depois >= 0.5:
            suspeitas.append(i)
    return suspeitas


def trechos_repetidos(palavras: list[dict], removidas: set[int], tamanho: int = 5,
                      janela: float = 60.0) -> list[tuple[int, int]]:
    """
    Sequências de `tamanho` palavras que aparecem duas vezes no texto mantido com menos de
    `janela` segundos entre si: costuma ser regravação que sobrou. Paralelismo retórico também
    aparece aqui; a lista é só para revisão. Devolve pares (índice da 1ª, índice da 2ª).
    """
    mantidas = [i for i in range(len(palavras)) if i not in removidas]
    texto = [normalizar(palavras[i]["palavra"]) for i in mantidas]
    vistas: dict[tuple[str, ...], int] = {}
    pares, ultima = [], -tamanho
    for k in range(len(mantidas) - tamanho + 1):
        chave = tuple(texto[k:k + tamanho])
        anterior = vistas.get(chave)
        vistas[chave] = k
        if anterior is None or k - anterior < tamanho:
            continue
        if palavras[mantidas[k]]["inicio"] - palavras[mantidas[anterior]]["inicio"] > janela:
            continue
        if k > ultima + tamanho:  # uma ocorrência por trecho repetido, não uma por palavra
            pares.append((mantidas[anterior], mantidas[k]))
        ultima = k
    return pares


def carregar_vocabulario() -> list[tuple[list[str], str]]:
    """Regras '- **Certo** — "errado", "errado 2"'. Itens com 'atenção' ficam para a análise."""
    if not VOCABULARIO.is_file():
        return []
    regras = []
    for linha in VOCABULARIO.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*-\s*\*\*(.+?)\*\*\s*[—-]\s*(.+)$", linha)
        if not m or "atenção" in m.group(2).lower():
            continue
        certo, erradas = m.group(1).strip(), m.group(2).split("(")[0]
        for errada in re.findall(r'"([^"]+)"', erradas):
            regras.append((normalizar(errada).split(), certo))
    return sorted(regras, key=lambda r: -len(r[0]))


def aplicar_vocabulario(palavras: list[dict], regras: list[tuple[list[str], str]]) -> int:
    trocas, i = 0, 0
    while i < len(palavras):
        for errada, certo in regras:
            k = len(errada)
            if [normalizar(p["palavra"]) for p in palavras[i:i + k]] != errada:
                continue
            original = palavras[i]["palavra"]
            nome_proprio = sum(w[0].isupper() for w in certo.split()) > 1
            if not nome_proprio:
                certo = (certo[0].upper() if original[:1].isupper() else certo[0].lower()) + certo[1:]
            nova = substituir(palavras, i, i + k - 1, certo)
            if nova["palavra"] != " ".join(p["palavra"] for p in palavras[i:i + k]):
                trocas += 1
            palavras[i:i + k] = [nova]
            break
        i += 1
    return trocas


def aplicar_erros(dados: dict, relatorio: bool = True) -> dict:
    """
    Transcrição com a seção "erros" e o vocabulário aplicados, em memória: {"arquivo", "modelo",
    "duracao", "palavras" (sem as erradas, tempos ainda do vídeo original), "cortes"}.
    Sem a seção "erros", aplica só o vocabulário.
    """
    palavras = dados["palavras"]
    erros = dados.get("erros", {})
    cortes = validar(erros.get("cortes", []), palavras, "corte")
    correcoes = validar(erros.get("correcoes", []), palavras, "correção")
    removidas = {i for c in cortes for i in range(c["de"], c["ate"] + 1)}
    if any(i in removidas for c in correcoes for i in range(c["de"], c["ate"] + 1)):
        sys.exit("Erro: há correção dentro de um trecho cortado.")

    # Correções da análise (índices do 02), depois remoção dos erros
    inicio_correcao = {c["de"]: c for c in correcoes}
    # "aparar": hesitação arrastada dentro da palavra ("pandemia...", "a..."): mantém só o começo dela
    aparar = {a["palavra"]: float(a["manter"]) for a in erros.get("aparar", [])}
    mantidas, pular_ate, depois_de_corte = [], -1, False
    for i, p in enumerate(palavras):
        if i <= pular_ate:
            continue
        if i in removidas:
            depois_de_corte = True
            continue
        if i in inicio_correcao:
            c = inicio_correcao[i]
            p, pular_ate = substituir(palavras, c["de"], c["ate"], c["para"]), c["ate"]
        p = {k: v for k, v in p.items() if k != "apos_corte"}
        if depois_de_corte:
            p["apos_corte"] = True  # o 06 sempre corta aqui, mesmo sem pausa
        depois_de_corte = False
        if i in aparar:
            p["fim"] = round(min(p["fim"], p["inicio"] + aparar[i]), 3)
            depois_de_corte = True  # a cauda aparada vira emenda antes da próxima palavra
        mantidas.append(p)
    trocas = aplicar_vocabulario(mantidas, carregar_vocabulario())

    for c in cortes:
        c["inicio"], c["fim"] = palavras[c["de"]]["inicio"], palavras[c["ate"]]["fim"]
        c["ultima_inicio"] = palavras[c["ate"]]["inicio"]  # o 06 procura a emenda depois do meio dela
    for i, manter in aparar.items():
        p = palavras[i]
        if p["inicio"] + manter < p["fim"]:
            # o 06 mede "manter" a partir do início acústico da palavra (o do Parakeet erra até 0,25 s)
            cortes.append({"de": i, "ate": i, "tipo": "aparar", "inicio": round(p["inicio"] + manter, 3),
                           "fim": p["fim"], "motivo": "hesitação arrastada",
                           "palavra_inicio": p["inicio"], "manter": manter,
                           "texto": f"(cauda de «{p['palavra']}», {p['fim'] - p['inicio'] - manter:.2f} s)"})
    cortes.sort(key=lambda c: c["inicio"])

    resultado = {"arquivo": dados.get("arquivo"), "modelo": dados.get("modelo"),
                 "duracao": dados.get("duracao"), "palavras": mantidas, "cortes": cortes}
    if not relatorio:
        return resultado

    removido = sum(c["fim"] - c["inicio"] for c in cortes)
    editoriais = [c for c in cortes if c.get("tipo") == "editorial"]
    print(f"{len(cortes) - len(editoriais)} cortes de erros de fala, {len(editoriais)} cortes editoriais:")
    for c in cortes:
        m, s = divmod(c["inicio"], 60)
        duvida = "[?] " if c.get("incerto") else ""
        motivo = f" ({c['motivo']})" if c.get("motivo") else ""
        print(f"  {duvida}[{int(m):02d}:{s:04.1f} original | -{c['fim'] - c['inicio']:4.1f}s] "
              f"{c.get('tipo', '-')}{motivo}: {c['texto']}")
    sem_motivo = [c for c in editoriais if not c.get("motivo")]
    if sem_motivo:
        sys.exit(f"Erro: corte editorial sem \"motivo\" em {', '.join(str(c['de']) for c in sem_motivo)}.")
    print(f"{len(correcoes)} correções da análise, {trocas} correções do vocabulário.")
    print(f"Fala removida: {removido / 60:.1f} min (o 06 remove também as pausas em volta).")
    decididos = {d["palavra"] for d in erros.get("decididos", [])}
    suspeitas = [i for i in palavras_suspeitas(palavras, removidas) if i not in decididos]
    if suspeitas:
        print(f"\nRevisar: {len(suspeitas)} palavras com cara de gagueira (curtas, baixa confiança, isoladas):")
        for i in suspeitas:
            contexto = " ".join(p["palavra"] for p in palavras[max(0, i - 4):i])
            seguinte = " ".join(p["palavra"] for p in palavras[i + 1:i + 5])
            m, s = divmod(palavras[i]["inicio"], 60)
            print(f"  #{i} [{int(m):02d}:{s:04.1f} original] ...{contexto} >>{palavras[i]['palavra']}<< {seguinte}...")
    repetidos = [(a, b) for a, b in trechos_repetidos(palavras, removidas) if not {a, b} <= decididos]
    if repetidos:
        print(f"\nRevisar: {len(repetidos)} trechos repetidos no texto mantido (regravação que sobrou "
              "ou repetição intencional):")
        for a, b in repetidos:
            for i in (a, b):
                inicio = max(0, i - 6)
                trecho = " ".join(p["palavra"] for k, p in enumerate(palavras[inicio:i + 12], inicio)
                                  if k not in removidas)
                m, s = divmod(palavras[i]["inicio"], 60)
                print(f"  {'1ª' if i == a else '2ª'} #{i} [{int(m):02d}:{s:04.1f} original] ...{trecho}...")
    longe = [(a, b) for a, b in ideias_repetidas(palavras, removidas) if not {a, b} <= decididos]
    if longe:
        print(f"\nRevisar: {len(longe)} frases repetidas longe uma da outra (ideia dita duas vezes no vídeo; "
              "candidato a corte editorial):")
        for a, b in longe:
            for i in (a, b):
                trecho = " ".join(p["palavra"] for k, p in enumerate(palavras[i:i + 14], i) if k not in removidas)
                m, s = divmod(palavras[i]["inicio"], 60)
                print(f"  {'1ª' if i == a else '2ª'} #{i} [{int(m):02d}:{s:04.1f} original] {trecho}...")
    return resultado


def ideias_repetidas(palavras: list[dict], removidas: set[int]) -> list[tuple[int, int]]:
    """Frases de 8 palavras iguais a mais de 60 s uma da outra (as próximas já saem em trechos_repetidos)."""
    return [(a, b) for a, b in trechos_repetidos(palavras, removidas, tamanho=8, janela=float("inf"))
            if palavras[b]["inicio"] - palavras[a]["inicio"] > 60]


def main() -> None:
    parser = argparse.ArgumentParser(description="Confere a análise de erros de fala e mostra o relatório.")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("-t", "--transcricao", type=Path, help="Arquivo de decisões (padrão: edicao/transcricao.json)")
    args = parser.parse_args()

    caminho = (args.transcricao or caminhos.video(args.video).transcricao).expanduser().resolve()
    dados = transcricao.carregar(caminho, exigir=("palavras", "erros"))
    aplicar_erros(dados)
    if dados.get("edicao") and dados["edicao"].get("cortes") != transcricao.assinatura_dos_cortes(dados):
        print("\nAtenção: os cortes mudaram desde o último render; rode o 06 de novo.")
    print("\nAnálise conferida. O 06 aplica estes cortes no render.")


if __name__ == "__main__":
    main()
