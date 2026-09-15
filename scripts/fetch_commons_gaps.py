#!/usr/bin/env python3
"""Busca imágenes de ejercicios en Wikimedia Commons para los huecos sin foto.

Devuelve candidatas (miniaturas) con su licencia y autor, para revisión visual
antes de moverlas a assets/img/. Solo se consideran licencias libres.

Uso: python3 scripts/fetch_commons_gaps.py
"""
from __future__ import annotations

import json
import re
import subprocess
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "img" / "candidates" / "commons"
OUT.mkdir(parents=True, exist_ok=True)

API = "https://commons.wikimedia.org/w/api.php"
UA = "cali-media-gaps/0.1 (proyecto personal; contacto: repo cali)"

BUSQUEDAS = {
    "gato-camello": ["cat cow stretch", "cat stretch yoga", "marjaryasana"],
    "superman": ["superman exercise", "superman pilates"],
    "dead-bug": ["dead bug exercise"],
    "mountain-climbers": ["mountain climber exercise fitness"],
    "wall-sit": ["wall sit exercise"],
    "plancha-lateral": ["side plank yoga", "vasisthasana"],
    "crunch": ["crunch exercise abdominal", "abdominal crunch"],
}

LIBRES = re.compile(r"(cc0|public domain|cc by(-sa)? [1-4]|pd)", re.I)


def _curl(url: str, dest: Path | None = None) -> bytes:
    cmd = ["curl", "-fsSL", "-m", "60", "-A", UA]
    if dest is not None:
        cmd += ["-o", str(dest)]
    cmd.append(url)
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(f"curl {proc.returncode}: {proc.stderr.decode(errors='replace').strip()[:120]}")
    return proc.stdout


def limpiar_html(texto: str) -> str:
    return re.sub(r"<[^>]+>", "", texto or "").strip()


def buscar(termino: str, limite: int = 8) -> list[dict]:
    qs = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": termino, "gsrnamespace": 6, "gsrlimit": limite,
        "prop": "imageinfo", "iiprop": "url|extmetadata|mime", "iiurlwidth": 400,
    })
    datos = json.loads(_curl(f"{API}?{qs}"))
    paginas = (datos.get("query") or {}).get("pages") or {}
    resultados = []
    for pagina in paginas.values():
        info = (pagina.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        licencia = limpiar_html((meta.get("LicenseShortName") or {}).get("value", ""))
        autor = limpiar_html((meta.get("Artist") or {}).get("value", "")) or "(desconocido)"
        mime = info.get("mime", "")
        if mime not in ("image/jpeg", "image/png"):
            continue
        if not LIBRES.search(licencia):
            continue
        resultados.append({
            "titulo": pagina.get("title", ""),
            "thumb": (info.get("thumburl") or info.get("url")),
            "url": info.get("url"),
            "licencia": licencia,
            "autor": autor[:60],
        })
    return resultados


def main() -> int:
    informe = {}
    for hueco, terminos in BUSQUEDAS.items():
        vistos: set[str] = set()
        candidatas: list[dict] = []
        for termino in terminos:
            try:
                for r in buscar(termino):
                    if r["titulo"] in vistos:
                        continue
                    vistos.add(r["titulo"])
                    candidatas.append(r)
            except Exception as exc:
                print(f"{hueco}: ERROR en «{termino}»: {exc}")
        candidatas = candidatas[:3]
        informe[hueco] = candidatas
        for i, r in enumerate(candidatas, 1):
            slug = re.sub(r"[^a-z0-9]+", "-", (hueco + "--" + r["titulo"]).lower()).strip("-")[:70]
            dest = OUT / f"{slug}.jpg"
            try:
                _curl(r["thumb"], dest=dest)
                r["archivo"] = dest.name
                print(f"{hueco} #{i}: {r['titulo']}  [{r['licencia']} · {r['autor']}] -> {dest.name}")
            except Exception as exc:
                print(f"{hueco} #{i}: fallo descarga: {exc}")
        if not candidatas:
            print(f"{hueco}: sin candidatas libres")
        print()
    (OUT / "informe.json").write_text(json.dumps(informe, indent=1, ensure_ascii=False), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
