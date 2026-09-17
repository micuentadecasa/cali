/* Persistencia de preferencias en localStorage, versionada.
 * GitHub Pages es estático: no hay backend. La origin
 * https://micuentadecasa.github.io conserva este storage entre despliegues;
 * export/import JSON sirve de copia de seguridad (cambio de dominio, limpieza).
 * Esquema v1 — migraciones siempre hacia delante, nunca se destruyen datos. */
const Storage = (() => {
  const CLAVE = "cali:prefs:v1";
  const ESQUEMA = 1;

  function porDefecto() {
    return {
      schema: ESQUEMA,
      favoritos: {},      // { [idEjercicio]: true }
      ocultos: {},        // { [idEjercicio]: { desde: ISO } }
      ajustes: { minutos: 20, usuarioFijo: false },
      ultimasSesiones: [], // últimos 2 entrenamientos: la rotación los penaliza
      appVersion: "1.0.0",
    };
  }

  function cargar() {
    try {
      const bruto = localStorage.getItem(CLAVE);
      if (!bruto) return porDefecto();
      const datos = JSON.parse(bruto);
      return migrar(datos);
    } catch {
      return porDefecto();
    }
  }

  function migrar(datos) {
    const base = porDefecto();
    // Futuras versiones: if (datos.schema === 1) { ...; datos.schema = 2; }
    if (!datos || typeof datos !== "object" || datos.schema > ESQUEMA) return base;
    const pref = { ...base, ...datos, ajustes: { ...base.ajustes, ...(datos.ajustes || {}) } };
    // v1→v1.1: sesiones más completas (20 min) salvo que el usuario las fijara
    if (pref.schema === 1 && pref.ajustes.minutos === 15 && !pref.ajustes.usuarioFijo) {
      pref.ajustes.minutos = 20;
    }
    return pref;
  }

  function guardar(prefs) {
    localStorage.setItem(CLAVE, JSON.stringify(prefs));
  }

  function alternarFavorito(id) {
    const p = cargar();
    if (p.favoritos[id]) delete p.favoritos[id];
    else p.favoritos[id] = true;
    guardar(p);
    return !!p.favoritos[id];
  }

  function ocultar(id) {
    const p = cargar();
    p.ocultos[id] = { desde: new Date().toISOString() };
    delete p.favoritos[id];
    guardar(p);
  }

  function restaurar(id) {
    const p = cargar();
    delete p.ocultos[id];
    guardar(p);
  }

  function cambiarMinutos(minutos) {
    const p = cargar();
    p.ajustes.minutos = minutos;
    p.ajustes.usuarioFijo = true;
    guardar(p);
  }

  // guarda los ids de la sesión recién generada (máximo 2 en memoria)
  function registrarSesion(ids) {
    const p = cargar();
    p.ultimasSesiones = [[...ids], ...(p.ultimasSesiones || []).slice(0, 1)];
    guardar(p);
    return p;
  }

  function exportar() {
    return JSON.stringify(cargar(), null, 2);
  }

  function importar(texto) {
    const datos = JSON.parse(texto); // lanza si no es JSON válido
    if (!datos || typeof datos.schema !== "number" || datos.schema > ESQUEMA) {
      throw new Error("Esquema no compatible");
    }
    guardar(migrar(datos));
    return cargar();
  }

  function reiniciar() {
    localStorage.removeItem(CLAVE);
    return cargar();
  }

  return { cargar, alternarFavorito, ocultar, restaurar, cambiarMinutos, registrarSesion, exportar, importar, reiniciar, CLAVE };
})();
