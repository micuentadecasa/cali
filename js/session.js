/* Generador de sesiones tipo entrenador + cronómetro.
 * Estructura: calentamiento (~20 %) → circuito rotando grupos corporales
 * (piernas → core → torso → cardio, en orden aleatorio por ronda, ~60 %) →
 * estiramientos (~20 %). La sesión es distinta cada día (semilla = fecha) y el
 * usuario puede pedir "otra sesión" (nueva salta). Favoritos ponderan ×3;
 * ocultos jamás aparecen. */
const Sesion = (() => {
  let lista = [];       // ejercicios propuestos (referencias a EJERCICIOS)
  let salt = 0;         // variación manual ("otra sesión")
  let idx = 0;
  let restante = 0;     // segundos del ejercicio en curso
  let corriendo = false;
  let temporizador = null;

  function mulberry32(semilla) {
    return function () {
      semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0;
      let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashClave(texto) {
    let h = 0;
    for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
    return h;
  }

  function barajarConPeso(arr, rnd) {
    // Peso por ejercicio: favoritos ×3 (salen antes); los de la última sesión
    // ×0,15 y de la penúltima ×0,4 → "otra sesión" se nota de verdad.
    const peso = (e) => {
      let f = App.prefs.favoritos[e.id] ? 3 : 1;
      const ultimas = App.prefs.ultimasSesiones || [];
      if (ultimas[0] && ultimas[0].includes(e.id)) f *= 0.15;
      else if (ultimas[1] && ultimas[1].includes(e.id)) f *= 0.4;
      return f;
    };
    return arr
      .map((e) => ({ e, k: rnd() / peso(e) }))
      .sort((a, b) => a.k - b.k)
      .map(({ e }) => e);
  }

  function rellenarBloque(candidatos, presupuesto, usados, rnd) {
    // Dos pasadas: primero los que NO salieron en la última sesión; los
    // repetidos solo entran si tras agotar los frescos queda presupuesto.
    const enUltima = (App.prefs.ultimasSesiones || [])[0] || [];
    const frescos = [], repetidos = [];
    for (const e of barajarConPeso(candidatos, rnd)) {
      if (usados.has(e.id)) continue;
      (enUltima.includes(e.id) ? repetidos : frescos).push(e);
    }
    const elegidos = [];
    let acum = 0;
    for (const e of [...frescos, ...repetidos]) {
      if (usados.has(e.id) || acum >= presupuesto) break;
      if (acum + e.segundos > presupuesto && acum >= presupuesto * 0.66) break;
      elegidos.push(e);
      usados.add(e.id);
      acum += e.segundos;
    }
    return elegidos;
  }

  function generar(nuevoSalt) {
    if (typeof nuevoSalt === "number") salt = nuevoSalt;
    const prefs = App.prefs;
    const hoy = new Date();
    const clave = `${hoy.getFullYear()}-${hoy.getMonth() + 1}-${hoy.getDate()}-${prefs.ajustes.minutos}-${salt}`;
    const rnd = mulberry32(hashClave(clave));

    const total = prefs.ajustes.minutos * 60;
    const disponibles = EJERCICIOS.filter((e) => !prefs.ocultos[e.id]);
    const usados = new Set();
    lista = [];

    // 1) Calentamiento
    rellenarBloque(
      disponibles.filter((e) => e.categoria === "calentamiento"),
      total * 0.2, usados, rnd
    ).forEach((e) => lista.push(e));

    // 2) Circuito principal rotando grupos corporales, como un entrenador:
    //    cada ronda toma un ejercicio de cada grupo en orden aleatorio.
    const ordenGrupos = ["piernas", "core", "torso", "cardio"];
    for (let i = ordenGrupos.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [ordenGrupos[i], ordenGrupos[j]] = [ordenGrupos[j], ordenGrupos[i]];
    }
    const presupuesto = total * 0.6;
    const enUltima = (App.prefs.ultimasSesiones || [])[0] || [];
    let acum = 0;
    let ronda = 0;
    while (acum < presupuesto) {
      let colocado = false;
      for (let i = 0; i < ordenGrupos.length && acum < presupuesto; i++) {
        const grupo = ordenGrupos[(i + ronda) % ordenGrupos.length];
        const candidatos = barajarConPeso(
          disponibles.filter((e) => e.grupo === grupo && !usados.has(e.id)),
          rnd
        );
        // prioriza los que no estuvieron en la última sesión
        const e = candidatos.find((x) => !enUltima.includes(x.id)) || candidatos[0];
        if (e) {
          lista.push(e);
          usados.add(e.id);
          acum += e.segundos;
          colocado = true;
        }
      }
      if (!colocado) break;
      ronda += 1;
    }

    // 3) Vuelta a la calma
    rellenarBloque(
      disponibles.filter((e) => e.categoria === "estiramiento"),
      total * 0.2, usados, rnd
    ).forEach((e) => lista.push(e));

    idx = 0;
    restante = lista[0] ? lista[0].segundos : 0;
    corriendo = false;
    return lista;
  }

  function ejercicios() { return lista; }
  function actual() { return lista[idx] || null; }
  function resumen() {
    return { total: lista.length, segundos: lista.reduce((s, e) => s + e.segundos, 0) };
  }
  function progreso() {
    return { idx, total: lista.length, restante, corriendo, terminada: lista.length > 0 && idx >= lista.length };
  }

  // Cabecera de bloque para el índice i (cambia de fase o de grupo corporal).
  function cabeceraPara(i) {
    const e = lista[i];
    if (!e) return null;
    const prev = lista[i - 1];
    if (e.categoria === "calentamiento" && (!prev || prev.categoria !== "calentamiento")) {
      return { icono: "🔥", texto: "Calentamiento" };
    }
    const enCircuito = e.categoria === "fuerza" || e.categoria === "cardio";
    const prevEnCircuito = prev && (prev.categoria === "fuerza" || prev.categoria === "cardio");
    if (enCircuito && !(prevEnCircuito && prev.grupo === e.grupo)) {
      return { icono: "💪", texto: GRUPOS[e.grupo] || "Circuito" };
    }
    if (e.categoria === "estiramiento" && (!prev || prev.categoria !== "estiramiento")) {
      return { icono: "🧘", texto: "Vuelta a la calma" };
    }
    return null;
  }

  function alternar() {
    corriendo = !corriendo;
    if (corriendo) temporizador = setInterval(tick, 1000);
    else clearInterval(temporizador);
    return corriendo;
  }

  function tick() {
    restante -= 1;
    if (restante <= 0) siguiente();
    else App.actualizarConteo(); // repintado ligero: solo el cronómetro
  }

  function siguiente() {
    if (idx < lista.length) idx += 1;
    corriendo = idx < lista.length;
    if (!corriendo) clearInterval(temporizador);
    restante = lista[idx] ? lista[idx].segundos : 0;
    App.cerrarVideo(); // al avanzar, el vídeo se cierra: nada sonando de fondo
    App.renderSesion(true); // avanza la tarjeta resaltada
    App.desplazarAActual();
  }

  function parar() {
    corriendo = false;
    clearInterval(temporizador);
  }

  function formatear(seg) {
    const s = Math.max(0, seg);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  return { generar, ejercicios, actual, resumen, progreso, cabeceraPara, alternar, siguiente, parar, formatear };
})();
