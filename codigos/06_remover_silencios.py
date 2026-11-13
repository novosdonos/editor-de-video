#!/usr/bin/env python3
"""
Monta o vídeo editado numa única codificação, a partir do original: remove silêncios e erros de
fala (seção "erros"), usa o áudio tratado (04), aplica a cor (seção "cor", do 05) e acelera.
Grava a seção "edicao" com o mapa original -> editado, de onde 07, 08, 09, 10 e 11 tiram os tempos.

Uso:
    .venv/bin/python codigos/06_remover_silencios.py videos/01-meu-primeiro-video
    .venv/bin/python codigos/06_remover_silencios.py videos/01-meu-primeiro-video --zoom 1 --sem-normalizar

Entrada (na pasta do vídeo):
    brutos/original.<ext>
    edicao/transcricao.json: "palavras" (02) com "erros" aplicada pela função do 03 (sem "erros",
        corta só os silêncios) e "cor" (05; sem ela, avisa e renderiza sem cor; --sem-cor ignora)
    edicao/audio_tratado.wav (04); sem ele, usa o áudio do próprio vídeo (mas, se o render
        anterior usou o tratado, para e pede o 04 de novo ou --audio-original)

Saída (depois que o vídeo é renderizado):
    edicao/editado.mp4        ->  único intermediário: cortes + áudio + cor, alta qualidade (o
                                  encode final é do Remotion). Re-rodar o 06 refaz tudo a partir do
                                  original; nada é aplicado em cima de render anterior
    edicao/transcricao.json   ->  seção "edicao": {"duracao", "trechos" ([início, fim] do original
                                  mantidos), "velocidade", "audio" ("tratado"/"video"), "zoom",
                                  "cortes" e "cor" (assinaturas do que o render usou)}
    edicao/transcricao.txt    ->  texto final, um trecho mantido por linha
    previas/revisao-cortes.*  ->  revisão das emendas e dúvidas para a A2-cortes (07_revisar_cortes.py;
                                  --sem-revisao pula)
Nada é apagado: o audio_tratado.wav fica para os próximos renders (correções depois das aprovações).

Regras de corte:
    - os tempos de palavra do Parakeet erram até ~0,25 s (início marcado tarde, fim colado na
      palavra seguinte): toda borda é decidida no áudio do original, em janelas de 10 ms, com duas
      medidas (volume total e agudos acima de 3 kHz, para "s"/"f" contarem como fala);
    - borda de erro (03) vai para a emenda real: o maior silêncio entre as duas palavras ou, com
      palavras coladas, o último vale nítido antes da palavra mantida; "aparar" conta do início
      acústico da palavra;
    - pausa = como se ouve: volume --queda-pausa (13) dB abaixo do nível típico da fala, sem
      consoante (agudos acima do piso e com quase toda a energia; a respiração tem agudos 9+ dB
      abaixo do total); a cauda da voz depois da frase conta como pausa e sai com fade; pausa
      dentro da frase a partir de --pausa-minima perde o meio; nas bordas de cada trecho sai
      qualquer sobra; fica --margem (fim de frase) ou --margem-frase depois da fala e
      --margem-ataque antes; som curto, fraco e isolado (a borda do trecho conta como silêncio)
      é respiração ou estalo de boca;
    - arrasto (vogal sustentada, espectro parado por mais de --arrasto-minimo): fica
      --arrasto-manter e o miolo sai numa emenda dentro da vogal (sem fade);
    - última sílaba esticada antes de cada pausa ("importantesss", "pandemiaaa"): "s"/"f" final
      fica com --final-consoante e o trecho termina ali com fade; vogal final sustentada perde o
      miolo (emenda dentro da vogal) até ficar com --final-vogal, mantendo o pico e o decaimento
      natural (terminar a vogal antes, com fade, soou seco);
    - erro marcado pelo 03 sempre vira corte, e o respiro nunca invade as palavras removidas;
    - trecho menor que --trecho-minimo é juntado ao vizinho mais próximo (pausa até
      --pausa-maxima), para a imagem não "piscar" entre dois cortes seguidos;
    - cortes alinhados à grade de frames (--fps), arredondados para fora (nunca come fala);
    - o WAV do 04 sai ~30 ms atrasado em relação ao original: o atraso é medido por correlação
      e compensado (sem isso todo corte comia o fim da palavra);
    - --amostra INI-FIM[,...] renderiza só esses intervalos em previas/amostra-cortes.mp4 (sobrescrita a
      cada rodada), para o autor ouvir antes; não toca no editado.mp4 nem na seção "edicao".

Acabamento:
    - cor em três camadas (ver o 05): entrada da câmera e ajuste adaptativo no original, antes
      dos cortes (cada ajuste ligado só no intervalo do seu trecho de cor), look depois da emenda;
    - crossfade de --fade segundos entre trechos (sem estalo e sem o ruído de fundo sumir na emenda);
      emenda dentro de som forte leva fade de --fade-som antes do crossfade;
    - zoom alternado (--zoom) a cada corte: desligado por padrão desde 2026-11-11, porque a câmera
      (zoom, rastreio de rosto, disfarce das emendas) é a etapa 7, feita pelo 09 no Remotion; usar
      só em vídeo que não vai passar pelo 09;
    - velocidade (--velocidade, padrão 1.1x): imagem e voz aceleradas, tom da voz mantido;
      acima de ~1.15x a fala começa a soar acelerada;
    - volume padronizado em --lufs (loudnorm em duas passadas).
"""

import argparse
import bisect
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

import caminhos
import transcricao

FIM_DE_FRASE = re.compile(r"[.?!…]\W*$")


ERROS = transcricao.carregar_codigo("03_remover_erros.py")
REVISAO = transcricao.carregar_codigo("07_revisar_cortes.py")
COR = transcricao.carregar_codigo("05_tratar_imagem.py")


def inspecionar_duracao(arquivo: Path) -> float:
    comando = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(arquivo)]
    resultado = subprocess.run(comando, capture_output=True, text=True)
    if resultado.returncode != 0:
        sys.exit(f"Erro: ffprobe falhou: {resultado.stderr}")
    return float(resultado.stdout.strip())


def ler_audio(arquivo: Path, taxa: int, inicio: float | None = None, duracao: float | None = None) -> np.ndarray:
    """Áudio mono em float32. No .mov o tempo 0 é o do áudio (o desvio do vídeo não entra)."""
    trecho = ["-ss", f"{inicio:.3f}", "-t", f"{duracao:.3f}"] if inicio is not None else []
    comando = ["ffmpeg", "-v", "error", *trecho, "-i", str(arquivo), "-map", "0:a:0", "-ac", "1",
               "-ar", str(taxa), "-f", "f32le", "-"]
    resultado = subprocess.run(comando, capture_output=True)
    if resultado.returncode != 0:
        sys.exit(f"Erro: não foi possível ler o áudio de {arquivo.name}: {resultado.stderr.decode(errors='ignore')}")
    return np.frombuffer(resultado.stdout, dtype=np.float32)


def medir_atraso(original: Path, tratado: Path, desvio: float, duracao: float) -> float:
    """
    Quanto o áudio tratado (04) está atrasado em relação ao áudio do original, em segundos.
    A cadeia do 04 (afftdn, adeclick, compressor, limitador) atrasa a voz ~30 ms; sem compensar,
    todo corte decidido no original come o fim de cada palavra mantida ("se dar mel-", aula 01,
    2026-11-12). Mede por correlação em três janelas de 20 s e usa a mediana.
    """
    taxa, janela, atrasos = 16_000, 20.0, []
    for centro in (0.25, 0.5, 0.75):
        t = max(0.0, duracao * centro - janela / 2)
        # no .mov o -ss é no tempo do contêiner: o áudio começa `desvio` depois
        o = ler_audio(original, taxa, t + desvio, janela)
        w = ler_audio(tratado, taxa, t, janela)
        n = min(len(o), len(w))
        if n < taxa:
            continue
        o, w = o[:n] - o[:n].mean(), w[:n] - w[:n].mean()
        c = np.fft.irfft(np.fft.rfft(w, 2 * n) * np.conj(np.fft.rfft(o, 2 * n)))
        k = int(np.argmax(np.abs(c)))
        atrasos.append((k if k < n else k - 2 * n) / taxa)
    return float(np.median(atrasos)) if atrasos else 0.0


class Energia:
    """
    Volume do áudio em janelas de 10 ms, para achar onde o som de fato começa e termina.
    Duas medidas: o volume total (vogais) e o da banda acima de 3 kHz (consoantes como "s", "f",
    "x", que têm pouco volume total e eram confundidas com pausa no fim de "vendas", "mais").
    """
    JANELA = 0.01
    TAXA = 16_000

    def __init__(self, video: Path, acima_do_ruido: float, queda_pausa: float):
        from scipy.signal import butter, sosfilt
        audio = ler_audio(video, self.TAXA)
        agudos = sosfilt(butter(4, 3000, "hp", fs=self.TAXA, output="sos"), audio)
        amostras = int(self.TAXA * self.JANELA)
        n = len(audio) // amostras
        db = lambda x: 20 * np.log10(np.sqrt((x[:n * amostras].reshape(n, amostras) ** 2).mean(axis=1)) + 1e-9)
        self.db, self.db_agudos = db(audio), db(agudos)
        self.limiar = np.percentile(self.db, 10) + acima_do_ruido  # piso de ruído + folga
        # Pausa = volume `queda_pausa` dB abaixo do nível típico da fala (p90) E agudos perto do piso.
        # Relativo à fala, não ao ruído: a cauda da voz na sala (-35 a -50 dB) ficava acima do limiar
        # antigo e as pausas de 0,3-0,4 s entre palavras não eram cortadas (aula 01, 2026-11-12).
        fala = self.db[self.db > self.limiar]
        self.nivel_fala = float(np.percentile(fala, 90)) if len(fala) else self.limiar + 20
        # Pausa como se OUVE (2026-11-12, 2ª amostra): a voz caindo 13 dB abaixo da fala já soa como
        # pausa; a cauda até -22 dB (~0,2 s depois de cada frase) era mantida e soava como hesitação.
        self.limiar_pausa = self.nivel_fala - queda_pausa
        self.limiar_som = self.nivel_fala - 22  # abaixo disto não há fala nenhuma (respiração, sala)
        self.limiar_agudos = float(np.percentile(self.db_agudos, 10)) + 25
        # Estabilidade do espectro (bandas mel, 10 ms): vogal arrastada tem espectro parado
        import librosa
        mel = librosa.power_to_db(librosa.feature.melspectrogram(
            y=audio, sr=self.TAXA, n_fft=512, hop_length=amostras, n_mels=40, fmax=5000) + 1e-10)
        fluxo = np.r_[0.0, np.abs(np.diff(mel, axis=1)).mean(axis=0)]
        self.fluxo = np.convolve(fluxo, np.ones(3) / 3, mode="same")[:n]
        # vogal aberta x consoante nasal: energia de 400-3000 Hz sobre 80-400 Hz. "a", "é", "-tar" ficam
        # +8 a +13 dB; "num me-" fica -9 dB e era tomado por arrasto ("menino" perdeu sílaba, aula 01)
        espectro = np.abs(librosa.stft(audio, n_fft=512, hop_length=amostras)) ** 2
        freq = librosa.fft_frequencies(sr=self.TAXA, n_fft=512)
        grave = espectro[(freq >= 80) & (freq < 400)].sum(axis=0)
        medio = espectro[(freq >= 400) & (freq < 3000)].sum(axis=0)
        self.vogal_aberta = (10 * np.log10((medio + 1e-12) / (grave + 1e-12)) > 0)[:n]

    def final_arrastado(self, inicio: float, fim: float, consoante_max: float, vogal_max: float,
                        fluxo_max: float) -> tuple | None:
        """
        Ajuste da fala que termina arrastada antes de uma pausa: ("fim", t) ou ("emenda", ini, fim), ou None. A última sílaba antes
        da pausa é a que mais se estica ("importantesss": "s" de 0,23 s; "pandemiaaa": "-mia" de 0,26 s,
        aula 01) e soa como espera, com o rosto ainda "segurando" a frase. "s"/"f" final fica com
        `consoante_max` s; vogal final sustentada (espectro quase parado) fica com `vogal_max` s.
        """
        a, b = max(int(inicio / self.JANELA), 0), min(int(fim / self.JANELA), len(self.db), len(self.fluxo))
        fraco = self.fraco(a, b)
        t = b - 1
        while t > a and fraco[t - a]:
            t -= 1
        if t <= a:
            return None
        e = (self.db_agudos > self.limiar_agudos) & (self.db_agudos > self.db - 6)
        if e[t]:  # termina em consoante chiada
            k = t
            while k > a and e[k - 1]:
                k -= 1
            if (t + 1 - k) * self.JANELA > consoante_max + 0.02:
                return ("fim", (k * self.JANELA) + consoante_max)
            return None
        k = t
        while k > a and self.db[k - 1] > self.limiar_pausa and self.fluxo[k - 1] < fluxo_max and self.vogal_aberta[k - 1]:
            k -= 1
        if (t + 1 - k) * self.JANELA > vogal_max + 0.02:
            # Vogal: terminar antes cortava o decaimento natural e a fala ficava seca ("pandemia",
            # amostra 4). Sai o miolo sustentado, numa emenda dentro da vogal; o pico final e o
            # decaimento ficam inteiros.
            pico = k + int(np.argmax(self.db[k:t + 1]))
            ini, fim = k * self.JANELA + 0.05, pico * self.JANELA - 0.01
            excesso = (t + 1 - k) * self.JANELA - vogal_max
            fim = min(fim, ini + excesso)
            return ("emenda", ini, fim) if fim - ini >= 0.06 else None
        return None

    def arrastos(self, inicio: float, fim: float, fluxo_max: float, minimo: float) -> list[tuple[float, float]]:
        """
        Vogal ou nasal sustentada entre `inicio` e `fim`: voz forte (acima do limiar de pausa) com o
        espectro parado (fluxo médio < `fluxo_max` dB por janela) por pelo menos `minimo` s.
        É o arrasto de hesitação ("passaram a…", "vender… é", "necessitaaar"): fala corrida muda de
        som a cada 50-80 ms, então trecho parado mais longo que ~0,14 s soa como pausa.
        """
        a, b = max(int(inicio / self.JANELA), 0), min(int(fim / self.JANELA), len(self.db), len(self.fluxo))
        parado = (self.db[a:b] > self.limiar_pausa) & (self.fluxo[a:b] < fluxo_max) & self.vogal_aberta[a:b]
        saida, i, n = [], 0, b - a
        while i < n:
            if not parado[i]:
                i += 1
                continue
            j = i
            while j < n and parado[j]:
                j += 1
            if (j - i) * self.JANELA >= minimo:
                saida.append(((a + i) * self.JANELA, (a + j) * self.JANELA))
            i = j
        return saida

    def fraco(self, a: int, b: int) -> np.ndarray:
        """Janelas [a, b) sem fala: volume abaixo do limiar de pausa e agudos perto do piso."""
        # consoante ("s", "f", "x") = agudos acima do piso E quase toda a energia nos agudos; respiração
        # também tem agudos, mas 9+ dB abaixo do volume total (aula 01: "oferece | é" ficava com 0,36 s)
        consoante = (self.db_agudos[a:b] > self.limiar_agudos) & (self.db_agudos[a:b] > self.db[a:b] - 6)
        return (self.db[a:b] < self.limiar_pausa) & ~consoante

    def fronteira(self, t_esq: float, t_dir: float, lado: str, margem: float) -> float:
        """
        Onde fica de fato a emenda entre duas palavras, procurando entre `t_esq` e `t_dir`.
        Os tempos do Parakeet erram até ~0,25 s ("necessitar" marcado 0,25 s depois do som, aula 01):
        cortar neles come sílaba. Se há silêncio no intervalo, usa o maior trecho fraco e deixa
        `margem` de respiro do lado que fica ("fim": a palavra da esquerda fica; "inicio": a da
        direita fica); sem silêncio (palavras coladas), usa o vale de volume.
        """
        a, b = max(int(t_esq / self.JANELA), 0), min(int(t_dir / self.JANELA), len(self.db))
        if b - a < 2:
            return (t_esq + t_dir) / 2
        fraco = self.fraco(a, b)
        fraco = fraco.copy()
        for k in range(1, len(fraco) - 1):  # junta quedas separadas por até 20 ms de ruído
            if not fraco[k] and fraco[k - 1] and (fraco[k + 1] or (k + 2 < len(fraco) and fraco[k + 2])):
                fraco[k] = True
        corridas, i = [], 0
        while i < len(fraco):
            if fraco[i]:
                j = i
                while j < len(fraco) and fraco[j]:
                    j += 1
                if (j - i) * self.JANELA >= 0.03:
                    corridas.append((i, j))
                i = j
            else:
                i += 1
        # Pausa de verdade (>= 0,1 s): a maior. Só quedas curtas: a mais próxima da palavra que fica
        # (a última antes dela, ou a primeira depois dela); a queda entre sílabas ("por|que") não é emenda.
        longas = [c for c in corridas if (c[1] - c[0]) * self.JANELA >= 0.1]
        if longas:
            melhor = max(longas, key=lambda c: c[1] - c[0])
        elif corridas:
            melhor = corridas[-1] if lado == "inicio" else corridas[0]
        else:
            melhor = None
        if melhor and (melhor[1] - melhor[0]) * self.JANELA >= 0.03:
            ini, fim = (a + melhor[0]) * self.JANELA, (a + melhor[1]) * self.JANELA
            folga = min(margem, (fim - ini) / 2)
            return ini + folga if lado == "fim" else fim - folga
        # Palavras coladas: o ÚLTIMO vale nítido (6 dB abaixo dos dois lados, em 80 ms) antes de `t_dir`.
        # O início que o Parakeet dá costuma estar certo ou atrasado, quase nunca adiantado; o vale
        # mais fundo podia cair dentro da palavra cortada ("por|que": sobrava o "que", aula 01).
        suave = np.convolve(self.db[a:b], np.ones(3) / 3, mode="valid")  # suave[k] centrado em a+k+1
        for k in range(len(suave) - 2, 0, -1):
            if suave[k] <= suave[k - 1] and suave[k] <= suave[k + 1] \
                    and suave[max(0, k - 8):k].max() - suave[k] >= 6 and suave[k + 1:k + 9].max() - suave[k] >= 6:
                return (a + k + 1) * self.JANELA
        return (a + int(np.argmin(suave)) + 1) * self.JANELA if len(suave) else (t_esq + t_dir) / 2

    def ataque(self, t: float, recuo: float = 0.15, avanco: float = 0.2) -> float:
        """Início acústico da palavra que o Parakeet marca em `t` (ele erra para os dois lados)."""
        i = int(t / self.JANELA)
        a, b = max(int((t - recuo) / self.JANELA), 0), min(int((t + avanco) / self.JANELA), len(self.db))
        if i < len(self.db) and not self.fraco(i, i + 1)[0]:
            # dentro de som: a palavra anterior pode estar colada; o início é o vale entre as duas
            c = min(i + 5, len(self.db))
            suave = np.convolve(self.db[a:c], np.ones(3) / 3, mode="same")
            return (a + int(np.argmin(suave[1:-1])) + 1) * self.JANELA if c - a > 3 else i * self.JANELA
        while i < b and self.fraco(i, i + 1)[0]:
            i += 1
        return i * self.JANELA

    def fim_do_som(self, t: float, limite: float, maximo: float = 0.6) -> float:
        i, fim = int(t / self.JANELA), min(int(min(limite, t + maximo) / self.JANELA), len(self.db))
        while i < fim and self.db[i] > self.limiar:
            i += 1
        return max(t, i * self.JANELA)

    def inicio_do_som(self, t: float, limite: float, maximo: float = 0.6) -> float:
        i, inicio = int(t / self.JANELA) - 1, max(int(max(limite, t - maximo) / self.JANELA), 0)
        while i >= inicio and self.db[i] > self.limiar:
            i -= 1
        return min(t, (i + 1) * self.JANELA)

    def pausas(self, inicio: float, fim: float, minimo: float, respiro_db: float,
               respiro_max: float) -> list[tuple[float, float]]:
        """
        Pausas sem fala entre `inicio` e `fim` com pelo menos `minimo` segundos, pelo volume.
        O Parakeet estica a palavra por cima da pausa seguinte (o intervalo entre palavras quase
        sempre é 0), então só o áudio mostra onde ela está. Pausa = janelas fracas (ver `fraco`):
        a cauda da voz e a respiração antes da frase contam como pausa. Som curto (até
        `respiro_max`), fraco (até `respiro_db` acima do limiar de pausa) e isolado por pausa dos
        dois lados também é respiração ou estalo de boca; colado na fala é consoante ("vendas").
        """
        a, b = max(int(inicio / self.JANELA), 0), min(int(fim / self.JANELA), len(self.db))
        trecho = self.db[a:b]
        fala = ~self.fraco(a, b)
        # respiração vem longe da fala; "s" final vem logo depois dela ("vendas.": 0,14 s de queda e o "s")
        isolado_antes, isolado = round(0.2 / self.JANELA), round(0.08 / self.JANELA)
        n, i = len(trecho), 0
        while i < n:
            if not fala[i]:
                i += 1
                continue
            j = i
            while j < n and fala[j]:
                j += 1
            # a borda do trecho conta como silêncio (estalo de boca antes da 1ª palavra, aula 01)
            antes = not fala[max(0, i - isolado_antes):i].any()
            depois = not fala[j:j + isolado].any()
            if (antes and depois and (j - i) * self.JANELA <= respiro_max
                    and trecho[i:j].max() <= self.limiar_som + respiro_db):
                fala[i:j] = False
            i = j
        pausas, i = [], 0
        while i < n:
            if fala[i]:
                i += 1
                continue
            j = i
            while j < n and not fala[j]:
                j += 1
            if (j - i) * self.JANELA >= minimo:
                pausas.append(((a + i) * self.JANELA, (a + j) * self.JANELA))
            i = j
        return pausas


def calcular_trechos(palavras: list[dict], cortes: list[dict], duracao: float, args,
                     energia: Energia | None) -> list[tuple[float, float]]:
    """Intervalos do vídeo original a manter, alinhados à grade de frames."""
    if not palavras:
        sys.exit("Erro: a transcrição não tem palavras.")
    fps = args.fps

    # 0. Leva as bordas de cada erro para a emenda real entre as palavras, medida no áudio.
    #    Antes o corte era estendido enquanto houvesse som acima do ruído, até o início que o
    #    Parakeet dá para a palavra mantida seguinte; esse início sai até 0,25 s atrasado, e o
    #    corte comia a sílaba ("necessitar" virou "cessitar", aula 01, 2026-11-12).
    fins_palavras = [p["fim"] for p in palavras]
    inicios_palavras = [p["inicio"] for p in palavras]
    ajustados = []
    for c in cortes:
        inicio, fim = c["inicio"], c["fim"]
        if energia:
            if c.get("tipo") == "aparar":  # "manter" conta do início acústico da palavra
                inicio = energia.ataque(c["palavra_inicio"]) + c["manter"]
            else:
                # janela: da metade da palavra mantida anterior até logo depois do início do erro
                k = bisect.bisect_right(fins_palavras, inicio + 0.001)
                esq = palavras[k - 1] if k else None
                t_esq = max((esq["inicio"] + esq["fim"]) / 2, inicio - 0.3) if esq else max(0.0, inicio - 0.3)
                inicio = energia.fronteira(t_esq, inicio + 0.05, "fim", args.margem_frase)
            # janela: da metade da última palavra do erro até logo depois do início da palavra mantida
            k = bisect.bisect_left(inicios_palavras, fim - 0.001)
            ref = palavras[k]["inicio"] if k < len(palavras) else duracao
            ultima = c.get("ultima_inicio", fim - 0.2)
            t_esq = max((ultima + c["fim"]) / 2, ref - 0.3, inicio)
            fim = energia.fronteira(t_esq, min(ref + 0.05, duracao), "inicio", args.margem_ataque)
        ajustados.append({**c, "inicio": inicio, "fim": max(fim, inicio)})
    cortes = sorted(ajustados, key=lambda c: c["inicio"])
    inicios_cortes = [c["inicio"] for c in cortes]
    fins_cortes = [c["fim"] for c in cortes]

    # 1. Agrupa palavras separadas por pausas curtas; erro removido sempre separa blocos
    blocos = []
    for i, p in enumerate(palavras):
        if blocos and not p.get("apos_corte") and p["inicio"] - blocos[-1]["fim"] <= args.silencio_minimo:
            blocos[-1]["fim"] = max(blocos[-1]["fim"], p["fim"])
            blocos[-1]["ultima"] = i
        else:
            blocos.append({"inicio": p["inicio"], "fim": p["fim"], "primeira": i, "ultima": i,
                           "apos_corte": bool(p.get("apos_corte"))})

    # 2. Respiro em volta da fala, sem invadir palavras vizinhas nem erros removidos
    total_frames = math.floor(duracao * fps)
    trechos: list[list] = []  # [frame_inicio, frame_fim, começa_depois_de_erro]
    for b in blocos:
        primeira, ultima = b["primeira"], b["ultima"]
        # Erro vizinho achado pelo INÍCIO do bloco (um erro nunca fica dentro de um bloco). Antes a busca
        # usava o fim do bloco: o passo 0 arredonda o início do erro para a janela de 10 ms e o põe alguns ms
        # antes do fim da palavra mantida; a busca pulava esse erro e o fim do som avançava até 0,6 s
        # dentro dele (aula 01: "fica" e "o Brasil tá" repetidos, 2026-11-11).
        # Desde 2026-11-12 o passo 0 pode pôr o fim do erro depois do início que o Parakeet dá
        # para a palavra mantida (ele marca tarde); por isso o erro anterior é o último que
        # COMEÇA antes do bloco, não o último que termina antes dele.
        limite_ini = palavras[primeira - 1]["fim"] if primeira else 0.0
        k = bisect.bisect_right(inicios_cortes, b["inicio"])
        if k:
            limite_ini = max(limite_ini, fins_cortes[k - 1])
        limite_fim = palavras[ultima + 1]["inicio"] if ultima + 1 < len(palavras) else duracao
        if k < len(inicios_cortes):
            limite_fim = min(limite_fim, inicios_cortes[k])

        inicio_fala, fim_fala = b["inicio"], b["fim"]
        if energia:
            inicio_fala = energia.inicio_do_som(inicio_fala, limite_ini)
            fim_fala = energia.fim_do_som(fim_fala, limite_fim)

        frase_continua_antes = primeira and not FIM_DE_FRASE.search(palavras[primeira - 1]["palavra"])
        frase_continua_depois = not FIM_DE_FRASE.search(palavras[ultima]["palavra"])
        margem_ini = args.margem_frase if frase_continua_antes else args.margem
        margem_fim = args.margem_frase if frase_continua_depois else args.margem

        # arredonda para fora: o trecho mantido nunca perde fala por causa da grade de frames
        f_ini = max(0, math.floor(max(inicio_fala - margem_ini, limite_ini) * fps + 1e-6))
        f_fim = min(total_frames, math.ceil(min(fim_fala + margem_fim, limite_fim) * fps - 1e-6))
        if f_fim <= f_ini:
            continue
        if trechos and not b["apos_corte"] and f_ini <= trechos[-1][1]:
            trechos[-1][1] = max(trechos[-1][1], f_fim)
        else:
            trechos.append([f_ini, f_fim, b["apos_corte"]])

    # 2b. Pausas e respiros dentro dos trechos (o tempo das palavras cobre as pausas; só o
    #     volume mostra onde estão). Pausa a partir de --corte-minimo e sobra nas bordas do trecho
    #     viram corte, deixando o respiro (--margem ou --margem-frase depois da fala, --margem-ataque
    #     antes). Pausa mais curta NÃO é cortada: vira trecho acelerado (passo 4), porque cada corte
    #     é um salto na imagem (aula 01, 2026-11-12: 493 cortes deixaram o vídeo "travando").
    aceleracoes: list[tuple[float, float, float]] = []  # (início, fim, fator desejado), em s
    if energia:
        divididos = []
        for f_ini, f_fim, apos_corte in trechos:
            ini, fim = f_ini / fps, f_fim / fps
            atual = [f_ini, f_fim, apos_corte]
            for s, e in energia.pausas(ini, fim, 0.05, args.respiro_db, args.respiro_maximo):
                tol = energia.JANELA + 0.001  # as janelas de 10 ms não caem na grade de frames
                no_inicio, no_fim = s <= ini + tol, e >= fim - tol
                borda = no_inicio or no_fim
                if not borda and e - s < args.pausa_minima:
                    continue
                k1 = bisect.bisect_left(inicios_palavras, s)
                k2 = bisect.bisect_right(fins_palavras, e)
                if any(s <= palavras[k]["inicio"] and palavras[k]["fim"] <= e for k in range(k1, min(k2, len(palavras)))):
                    continue  # palavra inteira dentro da "pausa": fala fraca, não respiro
                k = bisect.bisect_right(inicios_palavras, s) - 1
                continua = k >= 0 and not FIM_DE_FRASE.search(palavras[k]["palavra"])
                margem = args.margem_frase if continua else args.margem
                if not borda and e - s < args.corte_minimo:
                    aceleracoes.append((s + margem, e - args.margem_ataque, args.fator_pausa))
                    continue
                corte_ini = atual[0] if no_inicio else math.ceil((s + margem) * fps - 1e-6)
                corte_fim = f_fim if no_fim else math.floor((e - args.margem_ataque) * fps + 1e-6)
                if corte_fim - corte_ini < 2:  # ganho menor que 2 frames: não vale a emenda
                    continue
                if corte_ini > atual[0]:
                    divididos.append([atual[0], corte_ini, atual[2]])
                    atual = [corte_fim, f_fim, False]
                else:
                    atual = [corte_fim, f_fim, atual[2]]
            if atual[1] > atual[0]:
                divididos.append(atual)
        trechos = divididos

    # 3. Trecho curto demais vira "piscada" de imagem: junta ao vizinho mais próximo
    minimo, pausa_maxima = round(args.trecho_minimo * fps), round(args.pausa_maxima * fps)
    i = 0
    while i < len(trechos):
        ini, fim, apos_corte = trechos[i]
        if fim - ini >= minimo:
            i += 1
            continue
        opcoes = []
        if i and not apos_corte:
            opcoes.append((ini - trechos[i - 1][1], -1))
        if i + 1 < len(trechos) and not trechos[i + 1][2]:
            opcoes.append((trechos[i + 1][0] - fim, 1))
        opcoes = [o for o in opcoes if o[0] <= pausa_maxima]
        if not opcoes:
            i += 1
            continue
        if min(opcoes)[1] == -1:
            trechos[i - 1][1] = fim
        else:
            trechos[i + 1][0], trechos[i + 1][2] = ini, apos_corte
        del trechos[i]

    # 4. Última sílaba antes da pausa: "s"/"f" esticado termina antes (no fim do trecho, que já é
    #    corte: nenhum salto novo); vogal arrastada ("passaram a…", "pandemiaaa") e vogal final
    #    sustentada viram trecho acelerado, como as pausas curtas.
    removido: list[tuple[float, float]] = []  # áudio que sai de propósito (aviso de palavra cortada)
    if energia:
        for t in trechos:
            ajuste = energia.final_arrastado(t[0] / fps, t[1] / fps, args.final_consoante, args.final_vogal, 3.0)
            if ajuste and ajuste[0] == "fim":
                f_novo = math.ceil(ajuste[1] * fps - 1e-6)
                if t[1] - f_novo >= 2 and f_novo - t[0] >= round(0.2 * fps):
                    removido.append((f_novo / fps, t[1] / fps))
                    t[1] = f_novo
            elif ajuste:
                aceleracoes.append((ajuste[1], ajuste[2], args.fator_arrasto))
            if args.arrasto_minimo > 0:
                for s, e in energia.arrastos(t[0] / fps, t[1] / fps, args.arrasto_fluxo, args.arrasto_minimo):
                    # fica o começo e o fim do som parado; o miolo acelera até sobrar --arrasto-manter
                    miolo = (e - s) - 0.06
                    alvo = max(args.arrasto_manter - 0.06, 0.02)
                    aceleracoes.append((s + 0.03, e - 0.03, min(args.fator_arrasto, miolo / alvo)))

    # 5. Acelerações: o trecho de pausa curta ou arrasto toca mais rápido NA IMAGEM (sem salto) e o
    #    áudio usa só o começo dele (silêncio ou vogal parada: a emenda de áudio não se ouve).
    #    O fator é ajustado para o trecho acelerado ter um número inteiro de frames (sincronia exata).
    segmentos = aplicar_aceleracoes([t[:2] for t in trechos], aceleracoes, fps)
    for a, b, fator in segmentos:
        if fator > 1:
            removido.append((a + (b - a) / fator, b))

    resultado = [(a / fps, b / fps, fator) for a, b, fator in segmentos]
    conferir_cortes([(a, b) for a, b, _ in resultado], cortes, fps)
    args.cortes_ajustados = cortes + [{"inicio": a, "fim": b} for a, b in removido]  # aviso de palavra cortada
    return resultado


def aplicar_aceleracoes(trechos: list[list[int]], regioes: list[tuple[float, float, float]],
                        fps: int, minimo: int = 4) -> list[tuple[int, int, float]]:
    """
    Divide os trechos (em frames) nas regiões aceleradas: (início, fim, fator). Cada região vira
    M = round(N / fator) frames (fator real = N / M); regiões menores que `minimo` frames, sem
    ganho de 1 frame ou sobrepostas a outra ficam em velocidade normal.
    """
    regioes = sorted(regioes)
    saida, k = [], 0
    for a, b in trechos:
        atual = a
        while k < len(regioes) and regioes[k][1] * fps <= a:
            k += 1
        j = k
        while j < len(regioes) and regioes[j][0] * fps < b:
            ra = max(math.ceil(regioes[j][0] * fps - 1e-6), atual)
            rb = min(math.floor(regioes[j][1] * fps + 1e-6), b)
            n = rb - ra
            m = max(1, round(n / regioes[j][2])) if n > 0 else 0
            if n >= minimo and m < n:
                if ra > atual:
                    saida.append((atual, ra, 1.0))
                saida.append((ra, rb, n / m))
                atual = rb
            j += 1
        if b > atual:
            saida.append((atual, b, 1.0))
    return saida


def palavras_cortadas(palavras: list[dict], trechos: list[tuple[float, float]], folga: float = 0.03,
                      energia: Energia | None = None, cortes: list[dict] | None = None) -> list[dict]:
    """Palavras mantidas que perderam pedaço no corte de pausas (início ou fim fora de qualquer trecho).
    O corte por volume confunde a cauda da palavra com pausa em áudio já comprimido/editado (bruto que já é
    vídeo publicado): 02a/02b de 2026-11-12 perderam o fim de "marqueteiros", "chance", "chegava"...
    Com `energia`, só conta o pedaço removido que tem som de fala (pelo menos `folga` s fora das pausas
    e dos erros): os tempos do Parakeet cobrem as pausas e davam ~140 alarmes falsos por aula."""
    inicios = [a for a, _ in trechos]

    def dentro(t: float) -> bool:
        k = bisect.bisect_right(inicios, t) - 1
        return k >= 0 and trechos[k][0] - 0.001 <= t <= trechos[k][1] + 0.001

    if energia is None:
        return [p for p in palavras if p["fim"] - p["inicio"] > 2 * folga
                and not (dentro(p["inicio"] + folga) and dentro(p["fim"] - folga))]
    passo, erros = energia.JANELA, [(c["inicio"], c["fim"]) for c in cortes or []]
    resultado = []
    for p in palavras:
        perdido = 0
        for i in range(int(p["inicio"] / passo), int(p["fim"] / passo)):
            t = (i + 0.5) * passo
            # fala de verdade: acima do limiar de pausa, ou consoante clara nos agudos (a cauda da voz e
            # o miolo dos arrastos saem de propósito)
            fala = not energia.fraco(i, i + 1)[0]
            if fala and not dentro(t) and not any(a <= t <= b for a, b in erros):
                perdido += 1
        if perdido * passo >= folga:
            resultado.append(p)
    return resultado


def conferir_cortes(trechos: list[tuple[float, float]], cortes: list[dict], fps: int) -> None:
    """Trava: nenhum trecho mantido pode conter fala de um erro removido (tolerância de 1 frame + 20 ms)."""
    folga = 1 / fps + 0.02
    invasoes = [(a, b, c) for a, b in trechos for c in cortes
                if a < c["fim"] - folga and b > c["inicio"] + folga]
    if invasoes:
        linhas = [f"  {a:.2f}–{b:.2f} s invade o corte {c['de']}–{c['ate']} ({c['inicio']:.2f}–{c['fim']:.2f} s): {c.get('texto', '')[:60]}"
                  for a, b, c in invasoes]
        sys.exit("Erro: trechos mantidos com fala de erro removido (o vídeo repetiria a frase):\n" + "\n".join(linhas))


def filtros_de_cor(cor: dict | None, desvio: float) -> tuple[str | None, str | None]:
    """
    (filtro aplicado no original antes dos cortes, look aplicado depois da emenda).
    Antes dos cortes: entrada da câmera + ajuste de cada trecho de cor, ligado só no intervalo dele
    (tempo do vídeo = tempo da transcrição + desvio), então a correção muda no instante exato.
    """
    if not cor:
        return None, None
    partes = [COR.filtro_da_camada(cor.get("entrada"))]
    faixas = cor.get("trechos") or []
    for n, faixa in enumerate(faixas):
        ajuste = COR.filtro_do_ajuste(faixa["ajuste"])
        if not ajuste:
            continue
        if len(faixas) > 1:
            inicio = faixa["inicio"] + desvio if n else 0.0
            fim = faixa["fim"] + desvio if n < len(faixas) - 1 else 1e9
            ajuste += f":enable='gte(t,{inicio:.3f})*lt(t,{fim:.3f})'"
        partes.append(ajuste)
    return ",".join(f for f in partes if f) or None, COR.filtro_da_camada(cor.get("look"))


def montar_filtro(trechos: list[tuple[float, ...]], args, tamanho: tuple[int, int] | None,
                  cor: dict | None = None) -> str:
    """
    trim/atrim por trecho; vídeo emendado com concat e áudio com crossfade.
    Sem `tamanho`, monta só o áudio (medição de volume).

    Crossfade em vez de fade-out/fade-in: com fades, o ruído de fundo ia a zero em
    toda emenda (buraco de ~30 ms, 30-40 dB abaixo do ambiente) e soava como áudio
    picotando entre as frases. Cada trecho de áudio é estendido meio crossfade para
    cada lado, então a duração total continua igual à do vídeo (sincronia exata).
    Trecho acelerado (início, fim, fator): a imagem toca `fator` vezes mais rápido, num número
    inteiro de frames, e o áudio usa só o começo do trecho com a mesma duração (pausa ou vogal
    parada: a emenda de áudio não se ouve e a voz não muda).
    """
    n = len(trechos)
    fonte_audio = "1:a" if args.audio else "0:a"  # 1 = WAV tratado do 04
    linhas = [f"[{fonte_audio}]asplit={n}" + "".join(f"[a{i}]" for i in range(n)) + ";"]
    antes, look = filtros_de_cor(cor, args.desvio)
    if tamanho:
        fonte = f"[0:v]fps={args.fps}" + (f",{antes}" if antes else "")
        linhas.insert(0, fonte + f",split={n}" + "".join(f"[v{i}]" for i in range(n)) + ";")
    meio = args.fade / 2 if n > 1 else 0.0
    for i, trecho in enumerate(trechos):
        inicio, fim = trecho[0], trecho[1]
        fator = trecho[2] if len(trecho) > 2 else 1.0
        if tamanho:
            # trechos estão no tempo do áudio; o vídeo é cortado no tempo dele (+ desvio)
            video = (f"[v{i}]trim=start={inicio + args.desvio:.6f}:end={fim + args.desvio:.6f},"
                     "setpts=PTS-STARTPTS")
            if fator > 1:
                quadros = round((fim - inicio) * args.fps / fator)
                video += (f",setpts=PTS/{fator:.6f},fps={args.fps},tpad=stop_mode=clone:stop_duration=0.2,"
                          f"trim=end_frame={quadros},setpts=PTS-STARTPTS")
            if args.zoom > 1 and i % 2:
                video += f",crop=w=iw/{args.zoom}:h=ih/{args.zoom},scale={tamanho[0]}:{tamanho[1]}:flags=lanczos"
            linhas.append(video + f",setsar=1[vt{i}];")
        fim_som = inicio + (fim - inicio) / fator  # trecho acelerado: só o começo do áudio
        ini_audio = inicio - meio if i > 0 else inicio
        fim_audio = fim_som + meio if i < n - 1 else fim_som
        if not args.audio:  # áudio do próprio vídeo: timestamps já incluem o desvio; o WAV do 04 começa em 0
            ini_audio, fim_audio = ini_audio + args.desvio, fim_audio + args.desvio
        else:  # o WAV do 04 sai atrasado (~30 ms, medido em medir_atraso)
            ini_audio, fim_audio = ini_audio + args.atraso, fim_audio + args.atraso
        fades = ""
        # Emenda no meio de som forte ("aparar", palavra colada cortada): o crossfade estende o trecho
        # 10 ms para dentro do som cortado e soava como estalo ("passaram a | necessitar", aula 01).
        # Fade curto que termina na borda do trecho: a extensão já entra em silêncio.
        duracao_audio = fim_audio - ini_audio
        if i < n - 1 and i in getattr(args, "fades_saida", ()):
            fades += f",afade=t=out:st={max(0.0, duracao_audio - meio - args.fade_som):.6f}:d={args.fade_som:.3f}"
        if i > 0 and i in getattr(args, "fades_entrada", ()):
            fades += f",afade=t=in:st={meio:.6f}:d={args.fade_som:.3f}"
        linhas.append(f"[a{i}]atrim=start={ini_audio:.6f}:end={fim_audio:.6f},asetpts=PTS-STARTPTS{fades}[at{i}];")

    if n == 1 or args.fade <= 0:
        linhas.append("".join(f"[at{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[aj];")
    else:
        anterior = "at0"
        for i in range(1, n):
            saida = "aj" if i == n - 1 else f"ax{i}"
            # qsin = potência constante: o ruído de fundo não afunda no meio da emenda
            linhas.append(f"[{anterior}][at{i}]acrossfade=d={args.fade:.3f}:c1=qsin:c2=qsin[{saida}];")
            anterior = saida
    # Velocidade: atempo acelera sem mudar o tom da voz; setpts acelera a imagem igual
    linhas.append(f"[aj]atempo={args.velocidade:g}[a]" if args.velocidade != 1 else "[aj]anull[a]")
    if tamanho:
        linhas[-1] += ";"
        linhas.append("".join(f"[vt{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[vj];")
        final = [f"setpts=PTS/{args.velocidade:g}"] if args.velocidade != 1 else []
        if look:
            final.append(look)
        linhas.append(f"[vj]{','.join(final) or 'null'}[v]")
    return "\n".join(linhas)


def rodar_ffmpeg(video: Path, filtro: str, saida_args: list[str], capturar: bool = False,
                 audio: Path | None = None):
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as arq:
        arq.write(filtro)
        caminho_filtro = arq.name
    entradas = ["-i", str(video)] + (["-i", str(audio)] if audio else [])
    comando = ["ffmpeg", "-hide_banner", "-y", *entradas, "-/filter_complex", caminho_filtro, *saida_args]
    try:
        # cwd na raiz: as LUTs da cor são caminhos relativos a ela (sem escapar caminho no filtro)
        if capturar:
            return subprocess.run(comando, capture_output=True, text=True, cwd=caminhos.RAIZ_PROJETO)
        return subprocess.run(comando[:2] + ["-loglevel", "error", "-stats"] + comando[2:], cwd=caminhos.RAIZ_PROJETO)
    finally:
        Path(caminho_filtro).unlink(missing_ok=True)


def medir_volume(video: Path, trechos: list[tuple[float, float]], args) -> str:
    """1ª passada do loudnorm: mede o áudio já cortado e devolve o filtro da 2ª passada."""
    alvo = f"I={args.lufs}:TP=-1.5:LRA=11"
    filtro = montar_filtro(trechos, args, None) + f";\n[a]loudnorm={alvo}:print_format=json[an]"
    resultado = rodar_ffmpeg(video, filtro, ["-map", "[an]", "-f", "null", "-"], capturar=True, audio=args.audio)
    medida = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", resultado.stderr)
    if resultado.returncode != 0 or not medida:
        sys.exit(f"Erro: medição de volume falhou:\n{resultado.stderr[-2000:]}")
    m = json.loads(medida.group())
    print(f"Volume medido: {float(m['input_i']):.1f} LUFS -> {args.lufs} LUFS")
    return (f"loudnorm={alvo}:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
            f":offset={m['target_offset']}:linear=true,aresample=48000")


def bitrate_do_intermediario(tamanho: tuple[int, int], fps: int) -> str:
    """Intermediário de alta qualidade: ~0,25 bit por pixel (1080p30 ~16M, 4K30 ~62M), mínimo 10M."""
    return f"{max(10, round(tamanho[0] * tamanho[1] * fps * 0.25 / 1e6))}M"


def renderizar(video: Path, saida: Path, trechos: list[tuple[float, float]], args,
               tamanho: tuple[int, int], filtro_volume: str | None, cor: dict | None) -> None:
    encoders = subprocess.run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
    bitrate = bitrate_do_intermediario(tamanho, args.fps) if args.bitrate == "auto" else args.bitrate
    if "h264_videotoolbox" in encoders:  # encoder de hardware do Mac: bem mais rápido
        codec_video = ["-c:v", "h264_videotoolbox", "-b:v", bitrate]
    else:
        codec_video = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "16"]
    print(f"Encode: {codec_video[1]}" + (f" {bitrate}" if "videotoolbox" in codec_video[1] else " crf 16"))

    filtro = montar_filtro(trechos, args, tamanho, cor)
    rotulo_audio = "[a]"
    if filtro_volume:
        filtro += f";\n[a]{filtro_volume}[an]"
        rotulo_audio = "[an]"

    saida.parent.mkdir(parents=True, exist_ok=True)
    resultado = rodar_ffmpeg(video, filtro, [
        "-map", "[v]", "-map", rotulo_audio,
        *codec_video, "-pix_fmt", "yuv420p", "-r", str(args.fps),
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(saida),
    ], audio=args.audio)
    if resultado.returncode != 0:
        sys.exit(f"Erro: FFmpeg falhou (código {resultado.returncode}).")


def texto_final(ajustada: dict) -> list[str]:
    """Texto do vídeo editado, um trecho mantido por linha."""
    linhas: dict[int, list[str]] = {}
    for p in ajustada["palavras"]:
        linhas.setdefault(p["_trecho"], []).append(p["palavra"])
    return [" ".join(ps) for _, ps in sorted(linhas.items())]


def main() -> None:
    parser = argparse.ArgumentParser(description="Remove silêncios e erros de fala e renderiza o vídeo final.")
    parser.add_argument("video", type=Path, help="Pasta do vídeo (ou um arquivo de dentro dela)")
    parser.add_argument("-t", "--transcricao", type=Path,
                        help="Arquivo de decisões (padrão: edicao/transcricao.json)")
    parser.add_argument("-a", "--audio", type=Path,
                        help="Áudio a usar no vídeo final (padrão: edicao/audio_tratado.wav do 04, se existir)")
    parser.add_argument("--audio-original", action="store_true",
                        help="Ignora o áudio tratado e usa o áudio do próprio vídeo")
    parser.add_argument("--sem-revisao", action="store_true",
                        help="Não gera a revisão de cortes (previas/revisao-cortes.*)")
    parser.add_argument("--sem-cor", action="store_true", help="Ignora a seção \"cor\" (renderiza sem cor)")
    parser.add_argument("--amostra", metavar="INI-FIM[,INI-FIM]",
                        help="Renderiza só estes intervalos do original (segundos), com os mesmos cortes, em "
                             "previas/amostra-cortes.mp4, para o autor ouvir antes do render completo; não grava a "
                             "seção \"edicao\"")
    # Padrões apertados em 2026-11-10 (aula 01 ficou lenta, com pausas de 0,3-0,7 s entre frases)
    parser.add_argument("-s", "--silencio-minimo", type=float, default=0.3,
                        help="Pausa mínima, em segundos, para ser cortada (padrão: 0.3)")
    parser.add_argument("-m", "--margem", type=float, default=0.08,
                        help="Respiro em volta da fala, entre frases (padrão: 0.08)")
    parser.add_argument("--margem-frase", type=float, default=0.05,
                        help="Respiro quando o corte cai no meio de uma frase (padrão: 0.05)")
    parser.add_argument("--margem-ataque", type=float, default=0.05,
                        help="Respiro antes da fala recomeçar depois de uma pausa cortada (padrão: 0.05)")
    # Pausas pelo áudio (2026-11-12, aula 01: o limiar antigo, relativo ao ruído, deixava passar
    # pausas de 0,3-0,4 s entre palavras, com a cauda da voz na sala acima dele)
    parser.add_argument("--queda-pausa", type=float, default=13,
                        help="Pausa = volume estes dB abaixo do nível típico da fala (p90) e sem agudos "
                             "(consoante \"s\"/\"f\" conta como fala); a cauda da voz abaixo disso soa como pausa "
                             "(padrão: 13; maior = só pausas mais silenciosas)")
    parser.add_argument("--arrasto-minimo", type=float, default=0.14,
                        help="Vogal sustentada (espectro parado) a partir destes segundos é encurtada; 0 desliga (padrão: 0.14)")
    parser.add_argument("--arrasto-manter", type=float, default=0.10,
                        help="Quanto da vogal sustentada fica, em segundos (padrão: 0.10)")
    parser.add_argument("--final-consoante", type=float, default=0.08,
                        help="\"s\"/\"f\" no fim da fala antes de pausa fica com até estes segundos (padrão: 0.08)")
    parser.add_argument("--final-vogal", type=float, default=0.14,
                        help="Vogal sustentada no fim da fala antes de pausa fica com até estes segundos (padrão: 0.14)")
    parser.add_argument("--arrasto-fluxo", type=float, default=2.6,
                        help="Fluxo espectral máximo (dB por 10 ms) para contar como som parado (padrão: 2.6)")
    parser.add_argument("--pausa-minima", type=float, default=0.15,
                        help="Pausa dentro da fala, em segundos, a partir da qual o meio dela é cortado (padrão: 0.15)")
    parser.add_argument("--corte-minimo", type=float, default=0.35,
                        help="Pausa dentro da frase a partir destes segundos vira corte (salto na imagem); mais curta "
                             "vira trecho acelerado, sem salto (padrão: 0.35)")
    parser.add_argument("--fator-pausa", type=float, default=2.5,
                        help="Aceleração da imagem nas pausas curtas (padrão: 2.5)")
    parser.add_argument("--fator-arrasto", type=float, default=2.0,
                        help="Aceleração máxima da imagem nas vogais arrastadas (padrão: 2.0)")
    parser.add_argument("--respiro-db", type=float, default=5,
                        help="Som até estes dB acima do limiar de pausa, curto e isolado, conta como respiração "
                             "dentro da pausa (padrão: 5)")
    parser.add_argument("--respiro-maximo", type=float, default=0.35,
                        help="Duração máxima, em segundos, de um som tratado como respiração (padrão: 0.35)")
    parser.add_argument("--trecho-minimo", type=float, default=0.4,
                        help="Trechos menores que isso são juntados ao vizinho (padrão: 0.4)")
    parser.add_argument("--pausa-maxima", type=float, default=0.3,
                        help="Maior pausa que pode voltar ao juntar um trecho curto (padrão: 0.3)")
    parser.add_argument("-v", "--velocidade", type=float, default=1.1,
                        help="Acelera o vídeo final sem mudar o tom da voz; 1 desliga (padrão: 1.1)")
    parser.add_argument("--limiar-fala", type=float, default=15,
                        help="dB acima do ruído de fundo para considerar som de fala; 0 desliga o ajuste (padrão: 15)")
    parser.add_argument("--fade", type=float, default=0.02,
                        help="Crossfade de áudio em cada emenda, em segundos; 0 desliga (padrão: 0.02)")
    parser.add_argument("--fade-som", type=float, default=0.03,
                        help="Fade, em segundos, nas emendas que caem dentro de som forte (padrão: 0.03)")
    parser.add_argument("--zoom", type=float, default=1.0,
                        help="Zoom em trechos alternados, só para vídeo sem a etapa de câmera (09) (padrão: 1, desligado)")
    parser.add_argument("--lufs", type=float, default=-16, help="Volume final em LUFS (padrão: -16)")
    parser.add_argument("--sem-normalizar", action="store_true", help="Não padroniza o volume")
    parser.add_argument("--fps", type=int, default=30, help="Frames por segundo do vídeo final (padrão: 30)")
    parser.add_argument("-b", "--bitrate", default="auto",
                        help="Bitrate do intermediário (padrão: auto, ~0,25 bit/pixel, mínimo 10M)")
    args = parser.parse_args()

    for programa in ("ffmpeg", "ffprobe"):
        if shutil.which(programa) is None:
            sys.exit("Erro: FFmpeg não encontrado. Instale com: brew install ffmpeg")

    pasta = caminhos.video(args.video)
    original = pasta.original
    caminho = (args.transcricao or pasta.transcricao).expanduser().resolve()
    dados = transcricao.carregar(caminho, exigir=("palavras",))
    if "erros" not in dados:
        print("Aviso: sem a seção \"erros\"; cortando só os silêncios.")
    falas = ERROS.aplicar_erros(dados, relatorio=False)

    cor = None if args.sem_cor else dados.get("cor")
    if cor and cor.get("origem") != original.name:
        sys.exit(f"Erro: a seção \"cor\" foi medida em {cor.get('origem')}, não em {original.name}. Rode o 05 de novo.")
    if not cor and not args.sem_cor:
        print("Aviso: sem a seção \"cor\" (rode o 05); renderizando sem cor. Use --sem-cor para assumir isso.")

    if args.audio_original:
        args.audio = None
    elif args.audio is None:
        tratado = pasta.audio_tratado
        args.audio = tratado if tratado.is_file() else None
        if args.audio is None:
            if dados.get("edicao", {}).get("audio") == "tratado":
                sys.exit(f"Erro: o render anterior usou o áudio tratado e {tratado.name} não existe mais. "
                         "Rode o 04 de novo ou use --audio-original.")
            print("Aviso: áudio tratado do 04 não encontrado; usando o áudio do vídeo.")
    if args.audio:
        args.audio = args.audio.expanduser().resolve()
        if not args.audio.is_file():
            sys.exit(f"Erro: áudio não encontrado: {args.audio}")
    # Saída de nome fixo, sempre sobrescrita: o render completo só grava o editado.mp4 e a amostra só
    # previas/amostra-cortes.mp4 (nada de amostra-2, amostra-3 nem segundo vídeo inteiro; aula 01, 2026-11-13)
    saida_video = (pasta.pasta_previas / "amostra-cortes.mp4" if args.amostra else pasta.editado).resolve()

    info = caminhos.sondar(original)
    if not info["audio"]:
        sys.exit(f"Erro: {original.name} não tem trilha de áudio.")
    largura, altura = info["largura"], info["altura"]
    args.desvio, duracao_audio_video = info["audio"]["desvio"], info["audio"]["duracao"]
    # Trechos no tempo do áudio, limitados ao que existe de áudio e de imagem
    duracao = min(duracao_audio_video, info["duracao"] - args.desvio)
    if abs(args.desvio) > 0.001:
        print(f"Desvio de sincronia do original: o áudio começa {args.desvio * 1000:.0f} ms depois do vídeo (compensado).")
    if args.audio:
        duracao_audio = inspecionar_duracao(args.audio)
        if abs(duracao_audio - duracao_audio_video) > 0.1:  # o 04 preserva a duração do áudio do original
            sys.exit(f"Erro: o áudio tratado tem {duracao_audio:.2f}s e o áudio do vídeo "
                     f"{duracao_audio_video:.2f}s; gere de novo com o 04 a partir deste vídeo.")
    if not 0.5 <= args.velocidade <= 2:
        sys.exit("Erro: --velocidade precisa ficar entre 0.5 e 2.")
    args.atraso = 0.0
    if args.audio:
        args.atraso = medir_atraso(original, args.audio, args.desvio, duracao)
        if abs(args.atraso) > 0.002:
            print(f"Áudio tratado {args.atraso * 1000:+.0f} ms em relação ao original (compensado).")
    energia = Energia(original, args.limiar_fala, args.queda_pausa) if args.limiar_fala > 0 else None
    trechos = calcular_trechos(falas["palavras"], falas.get("cortes", []), duracao, args, energia)
    cortadas = palavras_cortadas(falas["palavras"], [t[:2] for t in trechos], energia=energia, cortes=args.cortes_ajustados)
    if cortadas:
        print(f"Aviso: {len(cortadas)} palavra(s) mantida(s) com pedaço cortado pelo corte de pausas: "
              + ", ".join(p["palavra"] for p in cortadas[:12]) + ("…" if len(cortadas) > 12 else "")
              + ". Conferir no áudio (respiração e estalo de boca também aparecem aqui); se for palavra: "
              "--queda-pausa maior, ou --limiar-fala 0 (corta só pelos tempos das palavras); bruto que já é "
              "vídeo editado: também -v 1.")
    if args.amostra:
        janelas = []
        for parte in args.amostra.split(","):
            a, b = (float(x) for x in parte.split("-"))
            janelas.append((a, b))
        # trecho acelerado cortado pela janela fica em velocidade normal (o fator vale para o trecho inteiro)
        trechos = [(max(a, ja), min(b, jb), f if (a >= ja and b <= jb) else 1.0) for ja, jb in janelas
                   for a, b, f in trechos if min(b, jb) - max(a, ja) > 1 / args.fps]
        print(f"Amostra: {len(janelas)} janela(s) do original, {len(trechos)} trechos.")
    if energia:  # emendas que caem dentro de som forte levam fade curto (ver montar_filtro)
        no_som = lambda t: energia.db[min(max(int(t / energia.JANELA), 0), len(energia.db) - 1)] > energia.limiar_pausa
        # só nos cortes de verdade: entre trechos contíguos (aceleração) a emenda cai em silêncio ou vogal parada
        corte_depois = lambda i: i + 1 < len(trechos) and abs(trechos[i + 1][0] - trechos[i][1]) > 1e-4
        args.fades_saida = {i for i, (a, b, f) in enumerate(trechos)
                            if corte_depois(i) and no_som(a + (b - a) / f - 0.005)}
        args.fades_entrada = {i for i, (ini, _, _) in enumerate(trechos) if i and corte_depois(i - 1) and no_som(ini + 0.005)}
    duracao_final = sum((fim - inicio) / f for inicio, fim, f in trechos) / args.velocidade
    print(f"Cortes de imagem: {sum(abs(trechos[i + 1][0] - trechos[i][1]) > 1e-4 for i in range(len(trechos) - 1))}; "
          f"trechos acelerados: {sum(f > 1 for _, _, f in trechos)}")

    print(f"Vídeo: {original.name} ({largura}x{altura})")
    print(f"Erros: {len(falas['cortes'])} cortes | Áudio: {args.audio.name if args.audio else 'do próprio vídeo'} | "
          f"Cor: {len(cor['trechos']) if cor else 0} trecho(s)" + (" + look" if cor and cor.get("look") else ""))
    print(f"{len(trechos)} trechos mantidos, {len(trechos) - 1} cortes internos.")
    print(f"Duração: {duracao / 60:.1f} min -> {duracao_final / 60:.1f} min "
          f"({(duracao - duracao_final) / 60:.1f} min removidos)")

    filtro_volume = None if args.sem_normalizar else medir_volume(original, trechos, args)
    print("Renderizando vídeo...")
    renderizar(original, saida_video, trechos, args, (largura, altura), filtro_volume, cor)
    print(f"\nVídeo salvo em: {saida_video}")
    if args.amostra:
        print("Amostra: a seção \"edicao\" e a revisão de cortes não foram alteradas.")
        return

    # Só depois do vídeo pronto: a seção "edicao" sempre descreve o vídeo que existe
    ajustada = transcricao.ajustar_transcricao(falas, trechos, args.velocidade)
    transcricao.atualizar(caminho, {"edicao": {
        "duracao": ajustada["duracao"],
        "trechos": [[round(inicio, 6), round(fim, 6)] + ([round(f, 4)] if f > 1 else []) for inicio, fim, f in trechos],
        "velocidade": args.velocidade,
        "audio": "tratado" if args.audio else "video",
        "zoom": args.zoom,
        "cortes": transcricao.assinatura_dos_cortes(dados),
        "cor": transcricao.assinatura_da_cor({"cor": cor}) if cor else None,
    }})
    caminho_texto = transcricao.salvar_texto(caminho, texto_final(ajustada))
    print(f"Atualizado: {caminho.name} (seção \"edicao\") e {caminho_texto.name} (texto final)")
    print(f"Assinatura dos cortes: {transcricao.assinatura_dos_cortes(dados)} (registrar na A2-cortes do video.md)")
    if not args.sem_revisao:
        REVISAO.gerar(pasta, caminho, editado=saida_video)


if __name__ == "__main__":
    main()
