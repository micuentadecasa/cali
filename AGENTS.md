# AGENTS.md — proyecto cali

App web estática (HTML/JS vanilla) de calistenia para móvil, alojada en
GitHub Pages: https://micuentadecasa.github.io/cali/ (repo
`git@github.com:micuentadecasa/cali.git`). Se usa en vertical.

## Regla de medios (contrato de licencias)

- Solo assets libres: CC0/PD/CC-BY/CC-BY-SA, o licencia propia sin atribución
  (Pexels/Pixabay). Nada "all rights reserved".
- Toda imagen en `assets/img/` debe tener entrada en `ATTRIBUTIONS.md`
  (autogenerado desde `assets/img/candidates/candidates.json` con
  `scripts/fetch_media_candidates.py`).
- Decisión 2026-09-15: plan **híbrido por secciones** (estiramientos Davidgj32,
  fuerza fotos gimnasio, huecos → SVG propios o Wikimedia Commons).
- Vídeos: solo **enlaces** a los de wger (CC-BY-SA); nunca empaquetarlos
  (~34 MB por clip).
- Investigación completa y verificada:
  `docs/research/2026-09-15-medios-sin-copyright.md`.

## Restricción médica del usuario

Tendinitis del supraespinoso. La biblioteca de ejercicios NUNCA debe incluir:
press por encima de la cabeza, elevaciones laterales por encima de 90°, dips,
remo al mentón, rotaciones con carga, movimientos tras la nuca. La app muestra
un disclaimer ("consulta a tu fisio") y ejercicios con nota de hombro cuando
aplica. No inventar indicaciones médicas.

## Persistencia (sin backend)

- Preferencias del usuario en `localStorage` (misma origin de GH Pages sobrevive
  a despliegues), clave versionada con campo `schema` y migración hacia delante.
- Los `id` de ejercicio son estables: renombrarlos rompe las preferencias
  guardadas (favoritos/ocultos).
- Export/import JSON en la app como copia de seguridad (cambio de dominio o
  limpieza del navegador).

## Verificación visual

- Para "ver" la app sin abrirla: Chrome headless
  (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --enable-logging=stderr --dump-dom|--screenshot --window-size=... URL`).
  En macOS headless el ancho mínimo de ventana es 500px: los pantallazos a 390px
  se recortan pero NO indican overflow. Errores de la página aparecen como
  `INFO:CONSOLE` en stderr.
- Lección: no pongas listeners de `iniciar()` sobre elementos que solo existen
  en pestañas renderizadas dinámicamente (p. ej. `#importar-archivo`) — un null
  ahí mata todo el render. Engánchalos cuando se crea el elemento.
