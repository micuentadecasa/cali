/* Biblioteca de ejercicios de cali — SOLO aptos para tendinitis del supraespinoso.
 * Prohibido: press sobre la cabeza, elevaciones laterales >90°, dips, remo al mentón,
 * rotaciones con carga, movimientos tras la nuca.
 * Convenciones:
 *  - `id` estable: es la clave de las preferencias guardadas (favoritos/ocultos).
 *  - `grupo`: bloque corporal para el circuito tipo entrenador (piernas | core | torso | cardio).
 *  - `img: null → marcador emoji hasta tener SVG/foto (plan de medios híbrido).
 *  - `wger`: id en wger.de para enlazar ficha/vídeo (CC-BY-SA). */
const EJERCICIOS = [
  // ── Calentamiento / movilidad ──────────────────────────────────────────
  { id: "marcha-suave", nombre: "Marcha en el sitio", categoria: "calentamiento", segundos: 60, emoji: "🚶",
    claves: ["Pasos suaves, sin saltar", "Brazos relajados a la altura de la cintura", "Respira por la nariz"] },
  { id: "circulos-hombros", nombre: "Círculos de hombro suaves", categoria: "calentamiento", segundos: 40, emoji: "🔄",
    notaHombro: "Rango corto y sin dolor; para si notas pinchazo",
    claves: ["Hombros arriba, atrás y abajo", "Círculos pequeños, 20 s por sentido"] },
  { id: "gato-camello", nombre: "Gato–camello", categoria: "calentamiento", segundos: 40, emoji: "🐈",
    claves: ["A cuatro patas, manos bajo hombros", "Arquea y redondea la espalda despacio", "Exhala al redondear"] },
  { id: "circulos-cadera", nombre: "Círculos de cadera", categoria: "calentamiento", segundos: 40,
    img: "assets/img/circulos-cadera.png", wger: 1862,
    claves: ["Manos en la cintura", "Círculos amplios y controlados", "20 s por sentido"] },

  // ── Grupo: piernas y glúteos ───────────────────────────────────────────
  { id: "sentadilla-lenta", nombre: "Sentadilla lenta", categoria: "fuerza", grupo: "piernas", segundos: 45,
    img: "assets/img/sentadilla-lenta.png", wger: 1963,
    claves: ["Pies al ancho de hombros", "Baja en 3 tiempos, sube en 2", "Talones siempre apoyados"] },
  { id: "zancadas-inversas", nombre: "Zancadas inversas", categoria: "fuerza", grupo: "piernas", segundos: 45,
    img: "assets/img/zancadas-inversas.png", wger: 999,
    claves: ["Paso atrás largo", "Rodilla de atrás baja sin tocar el suelo", "Torso erguido"] },
  { id: "puente-gluteos", nombre: "Puente de glúteos", categoria: "fuerza", grupo: "piernas", segundos: 45,
    img: "assets/img/puente-gluteos.png", wger: 265,
    claves: ["Tumbado, pies cerca del glúteo", "Empuja con los talones", "Aprieta el glúteo 2 s arriba"] },
  { id: "elevacion-talones", nombre: "Elevación de talones", categoria: "fuerza", grupo: "piernas", segundos: 40,
    img: "assets/img/elevacion-talones.png", wger: 1243,
    claves: ["Sube los talones despacio", "Baja controlando", "Apóyate en la pared si hace falta"] },
  { id: "wall-sit", nombre: "Sentadilla isométrica en pared", categoria: "fuerza", grupo: "piernas", segundos: 40, emoji: "🧱",
    claves: ["Espalda pegada a la pared", "Muslos paralelos al suelo", "Peso en los talones"] },

  // ── Grupo: core ────────────────────────────────────────────────────────
  { id: "plancha-frontal", nombre: "Plancha frontal", categoria: "fuerza", grupo: "core", segundos: 40,
    img: "assets/img/plancha-frontal.png", wger: 1307,
    claves: ["Codos bajo los hombros", "Cuerpo en línea recta", "Abdomen y glúteo apretados"] },
  { id: "plancha-toques-hombro", nombre: "Plancha con toques de hombro", categoria: "fuerza", grupo: "core", segundos: 40,
    img: "assets/img/plancha-toques-hombro.png", wger: 1091,
    notaHombro: "Si molesta el hombro, plancha de codos normal",
    claves: ["Plancha alta, pies anchos", "Toca el hombro contrario sin mover la cadera"] },
  { id: "bird-dog", nombre: "Bird dog", categoria: "fuerza", grupo: "core", segundos: 40,
    img: "assets/img/bird-dog.png", wger: 1572,
    claves: ["A cuatro patas", "Estira brazo y pierna contrarios", "Cadera estable, sin arquear la lumbar"] },
  { id: "dead-bug", nombre: "Dead bug", categoria: "fuerza", grupo: "core", segundos: 40, emoji: "🐞",
    claves: ["Tumbado, brazos al cielo", "Baja brazo y pierna contrarios despacio", "Lumbar pegada al suelo"] },
  { id: "superman", nombre: "Superman", categoria: "fuerza", grupo: "core", segundos: 40, emoji: "🦸",
    claves: ["Boca abajo, brazos delante", "Eleva suave brazos y pecho", "Cuello neutro, mirada al suelo"] },
  { id: "crunch-lateral", nombre: "Crunch lateral", categoria: "fuerza", grupo: "core", segundos: 40,
    img: "assets/img/crunch-lateral.png", wger: 576,
    claves: ["Manos a los lados de la cabeza", "Lleva codo hacia rodilla contraria", "Sin tirar del cuello"] },
  { id: "elevacion-piernas-suelo", nombre: "Elevación de piernas tumbado", categoria: "fuerza", grupo: "core", segundos: 40,
    img: "assets/img/elevacion-piernas-suelo.png", wger: 377,
    claves: ["Tumbado, manos bajo el glúteo", "Sube las piernas rectas despacio", "Baja sin tocar el suelo"] },

  // ── Grupo: torso (empuje amable con el hombro) ─────────────────────────
  { id: "flexion", nombre: "Flexiones (versión amable)", categoria: "fuerza", grupo: "torso", segundos: 45,
    img: "assets/img/flexion.png", wger: 1551,
    notaHombro: "Manos en pared o banco si hace falta; codos cerca del cuerpo y baja solo hasta donde no duela",
    claves: ["Codos a 45°, no abiertos", "Cuerpo en línea", "Baja controlando"] },

  // ── Grupo: cardio de bajo impacto ──────────────────────────────────────
  { id: "mountain-climbers", nombre: "Mountain climbers", categoria: "cardio", grupo: "cardio", segundos: 40, emoji: "⛰️",
    claves: ["Plancha alta", "Rodilla al pecho alternando", "Ritmo controlado, sin rebote"] },

  // ── Estiramientos (vuelta a la calma) ──────────────────────────────────
  { id: "est-rodilla-al-pecho", nombre: "Rodilla al pecho", categoria: "estiramiento", segundos: 50,
    img: "assets/img/est-rodilla-al-pecho.png", wger: 1452,
    claves: ["Tumbado, lleva una rodilla al pecho", "30 s por lado", "Respira profundo"] },
  { id: "est-cuadriceps", nombre: "Estiramiento de cuádriceps", categoria: "estiramiento", segundos: 50,
    img: "assets/img/est-cuadriceps.png", wger: 1873,
    claves: ["De pie, talón hacia el glúteo", "Apóyate en la pared si hace falta", "30 s por lado"] },
  { id: "est-flexor-cadera", nombre: "Estiramiento de flexor de cadera", categoria: "estiramiento", segundos: 50,
    img: "assets/img/est-flexor-cadera.png", wger: 1867,
    claves: ["Rodilla atrás, empuja la cadera adelante", "Costillas abajo", "30 s por lado"] },
  { id: "est-paloma", nombre: "Postura de la paloma", categoria: "estiramiento", segundos: 50,
    img: "assets/img/est-paloma.png", wger: 1872,
    claves: ["Tobillo delante, pierna de atrás estirada", "Baja el torso despacio", "30 s por lado"] },
  { id: "est-cuatro-figuras", nombre: "Cuatro figuras tumbado", categoria: "estiramiento", segundos: 50,
    img: "assets/img/est-cuatro-figuras.png", wger: 1869,
    claves: ["Tobillo sobre la rodilla contraria", "Tira del muslo hacia el pecho", "30 s por lado"] },
  { id: "est-lateral", nombre: "Estiramiento lateral de tronco", categoria: "estiramiento", segundos: 50,
    img: "assets/img/est-lateral.png", wger: 1861,
    claves: ["Brazo arriba, inclina a un lado", "Sin rotar el torso", "30 s por lado"] },
  { id: "est-gemelo", nombre: "Estiramiento de gemelo", categoria: "estiramiento", segundos: 50,
    img: "assets/img/est-gemelo.png", wger: 1239,
    claves: ["Antepié en el borde de un escalón", "Baja el talón despacio", "Rodilla recta"] },
  { id: "est-isquiotibiales", nombre: "Estiramiento de isquiotibiales", categoria: "estiramiento", segundos: 50,
    img: "assets/img/est-isquiotibiales.png", wger: 1870,
    claves: ["Tumbado, banda o toalla en el pie", "Sube la pierna recta", "30 s por lado"] },
];

const CATEGORIAS = {
  calentamiento: { nombre: "Calentamiento", emoji: "🔥" },
  fuerza: { nombre: "Fuerza", emoji: "💪" },
  cardio: { nombre: "Cardio", emoji: "⚡" },
  estiramiento: { nombre: "Estiramiento", emoji: "🧘" },
};

const GRUPOS = {
  piernas: "Piernas y glúteos",
  core: "Core",
  torso: "Torso (empuje amable)",
  cardio: "Cardio",
};
