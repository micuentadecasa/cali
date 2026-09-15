#!/usr/bin/env python3
"""Comprueba, uno a uno, que los vídeos embebidos de cali really reproduzcan.

CUIDADO (2026-09-15): YouTube BLOQUEA la reproducción a clientes automatizados,
con lo que en headless TODOS los embeds acaban en pantalla de error aunque
funcionen en un móvil real. Este chequeo solo sirve para comparaciones gruesas;
la validación definitiva es manual en el dispositivo.
"""

Carga el reproductor embed de cada vídeo en Chrome headless con autoplay+mute
(idéntico a como lo sirve la app) y detecta el error 153 / pantalla de error
(típico cuando el vídeo tiene música con Content ID que bloquea embeds).
Los que fallan se sustituyen por el siguiente candidato de la búsqueda previa.

Uso: python3 scripts/check_embed_playback.py
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"""Solo cuenta si el REPRODUCTOR tiene la clase de error aplicada (no basta que
el texto aparezca en las plantillas JS internas del player, que siempre están)."""
ERRORRES = re.compile(r'class="ytp-error')
BASE = "https://www.youtube-nocookie.com/embed/{vid}?autoplay=1&mute=1&playsinline=1&rel=0"


def carga_embed(vid: str) -> str:
    dom = subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--window-size=400,300",
         "--timeout=9000", "--dump-dom", BASE.format(vid=vid)],
        capture_output=True,
    ).stdout.decode("utf-8", errors="replace")
    return dom


def falla(vid: str) -> bool:
    return bool(ERRORRES.search(carga_embed(vid)))


def ejercicios_y_videos() -> dict[str, str]:
    src = (ROOT / "js" / "exercises.js").read_text(encoding="utf-8")
    return dict(re.findall(r'\{ id: "([^"]+)", video: "([^"]+)"', src))


def main() -> int:
    informe = json.loads((ROOT / "assets/img/candidates/videos.json").read_text())
    mapa = ejercicios_y_videos()
    fallos = []
    for eid, vid in mapa.items():
        roto = falla(vid)
        print(f"{eid:<26} {vid}  {'ERROR 153' if roto else 'ok'}")
        if roto:
            fallos.append((eid, vid))
    if not fallos:
        print("\nTodos los vídeos reproducen sin error ✔")
        return 0

    print("\nBuscando alternativas para los que fallan…")
    src = (ROOT / "js" / "exercises.js").read_text(encoding="utf-8")
    for eid, vid_viejo in fallos:
        sustituido = None
        for cand in informe.get(eid, []):
            cid = cand["id"]
            if cid == vid_viejo or cid in mapa.values():
                continue
            if not falla(cid):
                sustituido = (cid, cand["titulo"])
                break
        if sustituido:
            cid, titulo = sustituido
            src = src.replace(f'{{ id: "{eid}", video: "{vid_viejo}"',
                              f'{{ id: "{eid}", video: "{cid}"', 1)
            print(f"  {eid}: {vid_viejo} → {cid}  «{titulo[:50]}»")
        else:
            print(f"  {eid}: sin alternativa embebible entre los candidatos (revisar a mano)")
    (ROOT / "js" / "exercises.js").write_text(src, encoding="utf-8")
    print("js/exercises.js actualizado.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
