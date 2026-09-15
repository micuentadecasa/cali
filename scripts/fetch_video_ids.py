#!/usr/bin/env python3
"""Busca vídeos de YouTube para cada ejercicio de cali (solo lectura de la
página de resultados; sin API key). Descarta Shorts y listas los mejores
candidatos para curación manual: el videoId elegido se fija a mano en
js/exercises.js (campo `video`).

Uso: python3 scripts/fetch_video_ids.py
"""
from __future__ import annotations

import json
import re
import subprocess
import time
import urllib.parse
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "assets" / "img" / "candidates" / "videos.json"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
COOKIE = "CONSENT=YES+cb.20210328-17-p0.en+FX+419; SOCS=CAI"

CONSULTAS = {
    "marcha-suave": "marcha en el sitio ejercicio",
    "circulos-hombros": "círculos de hombros calentamiento",
    "gato-camello": "gato camello yoga ejercicio",
    "circulos-cadera": "círculos de cadera movilidad",
    "sentadilla-lenta": "sentadilla técnica lenta",
    "zancadas-inversas": "zancada inversa técnica",
    "puente-gluteos": "puente de glúteos técnica",
    "elevacion-talones": "elevación de talones gemelo",
    "wall-sit": "sentadilla isométrica pared wall sit",
    "step-ups": "step up escalón ejercicio",
    "kneeling-kickbacks": "patada de glúteo cuatro patas",
    "plancha-frontal": "plancha frontal abdominal técnica",
    "plancha-toques-hombro": "plank shoulder taps plancha toques",
    "plancha-lateral": "plancha lateral técnica",
    "flexion": "flexiones técnica principiantes",
    "bird-dog": "bird dog ejercicio core",
    "dead-bug": "dead bug ejercicio core",
    "superman": "superman ejercicio espalda baja",
    "crunch-lateral": "crunch lateral abdominal",
    "crunch": "crunch abdominal técnica",
    "elevacion-piernas-suelo": "elevación de piernas tumbado",
    "mountain-climbers": "mountain climbers técnica",
    "high-knees": "rodillas altas ejercicio cardio",
    "est-rodilla-al-pecho": "estiramiento rodilla al pecho",
    "est-cuadriceps": "estiramiento cuádriceps de pie",
    "est-flexor-cadera": "estiramiento flexor de cadera",
    "est-paloma": "postura de la paloma yoga",
    "est-cuatro-figuras": "estiramiento piriforme tumbado",
    "est-lateral": "estiramiento lateral tronco de pie",
    "est-gemelo": "estiramiento gemelo escalón",
    "est-isquiotibiales": "estiramiento isquiotibiales tumbado banda",
}


def resultados(query: str) -> list[dict]:
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    html = subprocess.run(
        ["curl", "-s", "-L", "-m", "25", "-A", UA, "-H", f"Cookie: {COOKIE}", url],
        capture_output=True,
    ).stdout.decode("utf-8", errors="replace")
    marcador = "var ytInitialData = "
    idx = html.find(marcador)
    if idx < 0:
        return []
    try:
        datos, _ = json.JSONDecoder().raw_decode(html[idx + len(marcador):])
    except json.JSONDecodeError:
        return []
    encontrados: list[dict] = []

    def walk(nodo):
        if isinstance(nodo, dict):
            if "videoRenderer" in nodo:
                v = nodo["videoRenderer"]
                titulo = "".join(r.get("text", "") for r in v.get("title", {}).get("runs", []))
                dur = (v.get("lengthText") or {}).get("simpleText", "")
                canal = "".join(r.get("text", "") for r in v.get("ownerText", {}).get("runs", []))
                if v.get("videoId") and titulo:
                    encontrados.append({"id": v["videoId"], "titulo": titulo, "duracion": dur, "canal": canal})
            for hijo in nodo.values():
                walk(hijo)
        elif isinstance(nodo, list):
            for hijo in nodo:
                walk(hijo)

    walk(datos)
    return encontrados


def main() -> int:
    informe = {}
    for eid, query in CONSULTAS.items():
        try:
            rs = [r for r in resultados(query) if r["duracion"].count(":") < 2][:5]  # descarta >1 h
        except Exception as exc:
            print(f"{eid}: ERROR {exc}")
            rs = []
        informe[eid] = rs
        print(f"\n## {eid}  («{query}»)")
        for r in rs:
            print(f"   {r['id']}  [{r['duracion']:>6}] {r['titulo'][:64]}  · {r['canal'][:26]}")
        time.sleep(1.5)
    OUT.write_text(json.dumps(informe, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"\ninforme en {OUT.relative_to(OUT.parents[3])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
