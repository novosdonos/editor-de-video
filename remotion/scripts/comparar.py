#!/usr/bin/env python3
"""
Compara stills de scripts/stills.mjs pelo nome: diferença máxima por pixel (0-255).
Uso: ../.venv/bin/python scripts/comparar.py <antes> <depois> [id,id,...]
Tolerância 8 (compressão); o render é determinístico, então o esperado é max=0.
"""
import sys, cv2, numpy as np
from pathlib import Path
a, d = Path(sys.argv[1]), Path(sys.argv[2])
pref = sys.argv[3].split(",") if len(sys.argv) > 3 else None
ruins = 0
for f in sorted(a.glob("*.png")):
    if pref and not any(f.name.startswith(p + "_") for p in pref): continue
    g = d / f.name
    if not g.exists(): print("FALTA", f.name); ruins += 1; continue
    x, y = cv2.imread(str(f)).astype(int), cv2.imread(str(g)).astype(int)
    if x.shape != y.shape: print("TAMANHO", f.name); ruins += 1; continue
    dif = np.abs(x - y); m = dif.max(); pct = (dif.max(axis=2) > 8).mean() * 100
    if m > 8: ruins += 1
    print(f"{'OK ' if m <= 8 else 'DIF'} {f.name}  max={m}  pixels>8={pct:.2f}%")
print("RESULTADO:", "idêntico" if not ruins else f"{ruins} diferente(s)")
