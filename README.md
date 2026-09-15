# cali

App web sencilla de calistenia para móvil (HTML/JS vanilla, sin dependencias).
Publicada en GitHub Pages: **https://micuentadecasa.github.io/cali/**

- Sesiones de 15 minutos (ajustable a 10/20) preparadas «como un entrenador»:
  🔥 calentamiento → 💪 circuito rotando grupos corporales (piernas, core, torso,
  cardio) → 🧘 vuelta a la calma.
- Cada día una propuesta distinta (determinista por fecha) y botón
  **🔄 Otra sesión** si la propuesta no te convence.
- ❤️ Favoritos (salen antes) y 🚫 «No me interesa» (desaparece de todas las
  sesiones futuras; restaurable en *Ejercicios → Ocultos*).
- Diseñada para usarse en vertical: tarjetas que se van recorriendo hacia abajo
  con cronómetro y avance automático.

## Salud

Todos los ejercicios están seleccionados para **no contradecir una tendinitis
del supraespinoso**: nada de press sobre la cabeza, elevaciones por encima de
90°, fondos/dips, remo al mentón ni rotaciones con carga. Esto no es consejo
médico: sigue la pauta de tu fisioterapeuta.

## Publicar

El sitio se publica desde la rama `main` (raíz del repo). Tras hacer `git push`,
GitHub Pages sirve la versión nueva en 1–2 minutos. Si aún no está activado:
*Settings → Pages → Source: Deploy from a branch → main / (root)*.

## Persistencia sin backend

GitHub Pages es estático, así que las preferencias (favoritos, ocultos, duración)
viven en el **localStorage del navegador** bajo la clave `cali:prefs:v1`:

- Sobrevive a los despliegues: la origin no cambia al publicar versiones nuevas.
- Esquema versionado con migración hacia delante (`schema`); los `id` de
  ejercicio son estables porque son la clave de las preferencias.
- **Exportar/Importar JSON** en *Ajustes* como copia de seguridad (cambio de
  móvil o de dominio). No hay cookies ni rastreadores.

## Medios (sin copyright)

Imágenes de ejercicios de [wger.de](https://wger.de) bajo CC-BY-SA/CC con
autor y licencia trazados en [ATTRIBUTIONS.md](ATTRIBUTIONS.md). Vídeos: solo
enlaces a los de wger (no se empaquetan: pesan ~34 MB por clip). Investigación
completa y decisión de estilo en
[docs/research/2026-09-15-medios-sin-copyright.md](docs/research/2026-09-15-medios-sin-copyright.md).
Regla del repo: solo assets libres, siempre con entrada en ATTRIBUTIONS.md.

## Estructura

```
index.html          entrada única
css/styles.css      móvil primero, vertical
js/exercises.js     biblioteca (ids estables, grupos corporales)
js/session.js       generador tipo entrenador + cronómetro
js/storage.js       preferencias versionadas en localStorage
js/app.js           UI (Sesión / Ejercicios / Ajustes)
scripts/fetch_media_candidates.py  descarga de imágenes CC desde wger
assets/img/         imágenes versionadas con licencia
```
