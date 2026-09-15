#!/usr/bin/env python3
"""Construye un catálogo local de ejercicios con imagen desde la API de wger.

La búsqueda `term=` de wger no indexa los nombres traducidos, así que este
script descarga el catálogo completo (paginado), lo guarda en
assets/img/candidates/catalog.json y hace el matching de nombres en local.
Para cada término de la biblioteca de cali descarga la miniatura de la mejor
coincidencia y registra licencia/autor en candidates.json.

Uso:
    python3 scripts/fetch_media_candidates.py                # catálogo + términos por defecto
    python3 scripts/fetch_media_candidates.py squat plank    # términos concretos
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import unicodedata
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "img" / "candidates"
OUT.mkdir(parents=True, exist_ok=True)
CATALOG = OUT / "catalog.json"
META = OUT / "candidates.json"

BASE = "https://wger.de/api/v2/exerciseinfo/?format=json&limit=100&offset="
UA = "cali-media-candidates/0.1 (proyecto personal; contacto: repo cali)"

LANG_ES, LANG_EN = 4, 2
LICENSES = {
    1: "CC-BY-SA 3.0",
    2: "CC-BY-SA 4.0",
    3: "CC0 1.0 (dominio público)",
    4: "CC-BY 4.0",
    5: "ODbL",
}

DEFAULT_TERMS = [
    "sentadilla", "squat", "plank", "plancha", "glute bridge", "puente glúteo",
    "lunge", "zancada", "push-up", "flexión", "bird dog", "crunch",
    "superman", "calf raise", "gemelo", "side plank", "cat", "gato",
    "dead bug", "wall sit", "mountain climber", "step-up", "bridge",
]


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _curl(url: str, dest: Path | None = None) -> bytes:
    """Descarga vía curl: usa el almacén de certificados del sistema (fiable en macOS)."""
    cmd = ["curl", "-fsSL", "-m", "60", "-A", UA]
    if dest is not None:
        cmd += ["-o", str(dest)]
    cmd.append(url)
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(f"curl {proc.returncode}: {proc.stderr.decode(errors='replace').strip()[:120]}")
    return proc.stdout


def fetch_json(url: str):
    return json.loads(_curl(url))


def names_of(exercise: dict) -> tuple[str | None, str | None]:
    """Devuelve (nombre_es, nombre_en) con el primero disponible si falta alguno."""
    es = en = None
    for t in exercise.get("translations", []):
        if not t.get("name"):
            continue
        if t["language"] == LANG_ES and es is None:
            es = t["name"]
        elif t["language"] == LANG_EN and en is None:
            en = t["name"]
    return es, en


def build_catalog() -> list[dict]:
    """Página a página del catálogo; conserva solo ejercicios con imagen."""
    catalog: list[dict] = []
    offset, total = 0, None
    while True:
        data = fetch_json(BASE + str(offset))
        total = total or data.get("count")
        for ex in data.get("results", []):
            if not ex.get("images"):
                continue
            es, en = names_of(ex)
            catalog.append(
                {
                    "id": ex["id"],
                    "name_es": es,
                    "name_en": en,
                    "category": (ex.get("category") or {}).get("name"),
                    "images": [
                        {
                            "url": img.get("image"),
                            "thumb": (img.get("thumbnails") or {}).get("medium"),
                            "license": LICENSES.get(img.get("license"), f"id {img.get('license')}"),
                            "author": img.get("license_author") or ex.get("license_author") or "(sin autor declarado)",
                        }
                        for img in ex["images"]
                    ],
                }
            )
        offset += 100
        if total is None or offset >= total:
            break
    CATALOG.write_text(json.dumps(catalog, indent=1, ensure_ascii=False), encoding="utf-8")
    return catalog


def load_catalog() -> list[dict]:
    if CATALOG.exists():
        return json.loads(CATALOG.read_text(encoding="utf-8"))
    return build_catalog()


def norm(text: str) -> str:
    return slugify(text).replace("-", " ")


def score(term: str, entry: dict) -> int:
    """Palabras del término presentes en el nombre (es o en)."""
    t_words = set(norm(term).split())
    best = 0
    for name in (entry["name_es"], entry["name_en"]):
        if not name:
            continue
        n_words = set(norm(name).split())
        best = max(best, len(t_words & n_words))
    return best


def search(term: str, catalog: list[dict]) -> list[tuple[dict, int]]:
    scored = [(entry, score(term, entry)) for entry in catalog]
    hits = [(e, s) for e, s in scored if s > 0]
    hits.sort(key=lambda pair: (-pair[1], (pair[0]["name_en"] or "").lower()))
    return hits[:5]


def main() -> int:
    terms = sys.argv[1:] or DEFAULT_TERMS
    catalog = load_catalog()
    print(f"catálogo: {len(catalog)} ejercicios con imagen ({CATALOG.relative_to(ROOT)})\n")

    found: list[dict] = []
    print(f"{'término':<16} mejor coincidencia (es/en) [licencia, autor] -> archivo")
    print("-" * 100)
    for term in terms:
        hits = search(term, catalog)
        if not hits:
            print(f"{term:<16} -- sin coincidencia --")
            continue
        top = hits[0][0]
        best_score = hits[0][1]
        fuzzy = best_score < len(set(norm(term).split()))
        img = top["images"][0]
        url = img["thumb"] or img["url"]
        fname = f"{slugify(term)}__{slugify(top['name_en'] or top['name_es'])}.png"
        alternatives = ", ".join(f"{e['name_en'] or e['name_es']} ({s})" for e, s in hits[1:4])
        try:
            _curl(url, dest=OUT / fname)
        except Exception as exc:
            print(f"{term:<16} {top['name_en'] or top['name_es']} ERROR descarga: {exc}")
            continue
        found.append(
            {
                "term": term,
                "exercise_id": top["id"],
                "wger_name_es": top["name_es"],
                "wger_name_en": top["name_en"],
                "category": top["category"],
                "fuzzy": fuzzy,
                "file": fname,
                "url": img["url"],
                "license": img["license"],
                "author": img["author"],
                "alternatives": [e["name_en"] or e["name_es"] for e, _ in hits[1:5]],
            }
        )
        mark = " (aprox)" if fuzzy else ""
        print(f"{term:<16} {top['name_es'] or top['name_en'][:30]} / {top['name_en']} [{img['license']}, {img['author'][:16]}]{mark} -> {fname}")
        if alternatives:
            print(f"{'':<16} otras: {alternatives}")

    META.write_text(json.dumps(found, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n{len(found)} miniaturas en {OUT.relative_to(ROOT)} · metadatos en {META.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
