# Fuentes de imágenes y vídeos de ejercicios sin copyright

Fecha: 2026-09-15 · Proyecto: cali (app de calistenia móvil, GitHub Pages)
Contexto: need de mostrar cada ejercicio en vertical sin problemas de copyright.
Este documento es la referencia de decisión; se verifica con fuentes primarias
(las propias APIs y páginas de licencia), no con resúmenes de terceros.

Criterio legal aceptado: CC0 / dominio público / CC-BY / CC-BY-SA (con
atribución cuando la licencia la exige). Nada "all rights reserved".
Todo asset que entre en `assets/` debe tener entrada en `ATTRIBUTIONS.md`.

## Recomendación corta

Usar **wger como fuente principal** (script ya creado), aceptando que hay que
**normalizar el estilo visual por CSS** (marco + pie de figura uniformes) o
completar los huecos con **Wikimedia Commons** o **SVG propios**. Los vídeos de
wger son CC-BY-SA pero pesan ~34 MB por clip: no empaquetar en v1.

## Opción A — wger.de (verificada hoy, 200 OK)

Base de datos libre del proyecto open-source wger (AGPL). API pública sin clave.

- Catálogo: 865 ejercicios (`/api/v2/exerciseinfo/`), **273 con imagen** (374
  imágenes), 78 vídeos (`/api/v2/video/`).
- Licencias de las imágenes (endpoint `/api/v2/license/`): CC-BY-SA 3.0,
  CC-BY-SA 4.0, CC-BY 4.0, CC0, ODbL. Cada imagen trae `license` +
  `license_author` → atribución automática posible.
- Script creado: `scripts/fetch_media_candidates.py` — descarga el catálogo una
  vez (`assets/img/candidates/catalog.json`, ignorado por git), busca por
  nombre en local y baja miniaturas + metadatos (`candidates.json`).
  El `term=` de la API NO indexa nombres traducidos; por eso se pagina el
  catálogo completo y se filtra localmente.

Hallazgo clave (por esto hay que decidir estilo): **los estilos son
heterogéneos**. Series por autor:

| Autor | Nº imgs | Estilo | Ejemplos |
|---|---|---|---|
| Everkinetic | 83 | Láminas anatómicas (CC-BY-SA 3.0) | Leg Raises Lying, Side Crunch, Quadriped Arm/Leg Raise |
| Franpol | 30 | Dibujo técnico de gimnasio con barra/máquinas | poco útil para peso corporal |
| Davidgj32 | 23 | Foto serie coherente: estiramientos y foam roller | Quad Stretch, Pigeon, Knee to Chest, Hip Flexor |
| Settebello y otros | ~15 | Ilustración cartoon (algunas marcadas IA) | Push-Up, Bird Dog |
| hektkaso / tdprice12 | pocas | Foto gimnasio con etiquetas "Inicio/Movimiento" | Front Plank, Glute Bridge |
| (sin autor declarado) | 14 | Foto sobre fondo limpio | Step-ups, High knees, Kneeling kickbacks, Child's pose |

Riesgos detectados: imágenes rotas o en negro (p. ej. `Crunches` de wger.de se
descargó 400×178 completamente negra — descartada), y estilo visual mezclado
si se cogen de todos los autores.

Cobertura sobre la biblioteca planteada para cali (20 miniaturas ya descargadas
en `assets/img/candidates/`): sentadilla lenta, flexión, plancha frontal,
plancha con toques de hombro, zancadas inversas, puente de glúteos, bird dog,
elevación de talones, crunch, crunch lateral, elevación de piernas, círculos de
cadera y 8 estiramientos (rodilla al pecho, cuádriceps, flexor de cadera,
paloma, cuatro figuras, lateral, gemelo, isquiotibiales).

Huecos sin imagen en wger: superman, gato-camello, dead bug, mountain climbers,
wall sit, plancha lateral, sentadilla con salto. → Cubrir con Opción B o D.

## Opción B — Wikimedia Commons (API verificada hoy, 200 OK)

- `commons.wikimedia.org/w/api.php` pública; licencia **por fichero** (mayoría
  CC-BY-SA; también CC0 y PD). Para uso serio: `prop=imageinfo&iiprop=…|extmetadata`
  devuelve licencia + autor por imagen.
- Ventaja: cubre huecos (hay material de gato-camello, superman, dead bug…).
  Inconveniente: curación manual y estilo aún más variado que wger.

## Opción C — Pexels / Pixabay (licencia propia, sin atribución)

- Pexels License y Pixabay Content License: uso gratuito incluso comercial,
  modificaciones permitidas, **sin atribución obligatoria**; no se puede
  redistribuir el contenido "como stock" ni con marcas identificables.
- Verificación: `pexels.com/license/` y `pixabay.com/service/license-summary/`
  responden 403 a clientes automatizados (curl) — confirmar en navegador; son
  las páginas de referencia de ambas licencias.
- Hay abundante foto y vídeo vertical de fitness de calidad uniforme. Coste:
  curación 100 % manual y descargar al repo (no hotlink). Ojo: esta licencia no
  es CC; para este proyecto personal es equivalente a efectos prácticos.
- Alternativas de vídeo del mismo estilo: Coverr, Mixkit (leer su licencia al
  descargar).

## Opción D — Pictogramas/SVG propios

- Cero carga legal, estilo 100 % coherente, peso mínimo (~1–3 KB por figura),
  ideales para móvil. Coste: dibujarlos o generarlos y revisarlos a mano.
- Combinable con A: SVG propios solo para los huecos.

## Descartadas explícitamente

- **ExerciseDB** y otras APIs comerciales de ejercicios: los GIFs/ imágenes son
  "all rights reserved" o con licencias que restringen redistribución.
- **MuscleWiki, apps comerciales, fotogramas de YouTube**: copyright ajeno.
- **Freepik/Flaticon plan gratis**: atribución obligatoria + restricciones de
  uso; no encaja para un asset central de la app.
- **Openverse** (metabuscador CC): la API expiró hoy desde esta red
  (timeout); útil como apoyo puntual, no como fuente primaria.

## Fuentes citadas (acceso 2026-09-15)

- wger API: https://wger.de/api/v2/exerciseinfo/ · /api/v2/exerciseimage/ ·
  /api/v2/video/ · /api/v2/license/ (todas 200 OK vía curl)
- Licencias CC: https://creativecommons.org/licenses/by-sa/4.0/ ,
  https://creativecommons.org/licenses/by-sa/3.0/ ,
  https://creativecommons.org/publicdomain/zero/1.0/
- Commons API: https://commons.wikimedia.org/w/api.php (200 OK)
- Pexels: https://www.pexels.com/license/ (403 a bots; verificar en navegador)
- Pixabay: https://pixabay.com/service/license-summary/ (ídem)

## Decisión (2026-09-15, vía Lavish Editor)

- **Plan elegido: 1 · Híbrido por secciones.** Estiramientos con la serie de
  fotos de Davidgj32, fuerza con fotos de gimnasio estilo "Inicio/Movimiento",
  y «para el resto usaremos lo que podamos» (prioridad de relleno: otra serie
  de wger coherente → Wikimedia Commons → SVG propios para los 7 huecos).
- **Vídeos: enlaces a wger** donde existan; nunca empaquetarlos en el repo.
- **Descartado explícitamente** (feedback del revisor): pictogramas SVG como
  dirección principal — solo como remiendo puntual para huecos sin foto.
- Implementación: las 20 imágenes curadas ya viven en `assets/img/` con su
  `ATTRIBUTIONS.md` autogenerado desde `candidates.json`.

## Estado y siguiente paso

- Candidatos en `assets/img/candidates/` (ignorado por git); las imágenes del
  plan elegido están versionadas en `assets/img/` + `ATTRIBUTIONS.md`.
- Decisión tomada (ver sección anterior); siguiente paso: construir la app
  (sesiones de 15 min, favoritos/ocultos, persistencia localStorage) y publicar
  en GitHub Pages.
