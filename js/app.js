/* UI de cali: pestañas Sesión / Ejercicios / Ajustes.
 * Sesión: tarjetas verticales con bloques tipo entrenador, favoritos ❤️,
 * ocultar 🚫 (desaparece de todas las sesiones futuras) y marca de hecho.
 * Ajustes: duración, export/import de preferencias y reinicio. */
const App = (() => {
  let prefs;
  let pestana = "sesion";
  let filtroBiblioteca = "todos";
  const hechos = new Set(); // marcas locales de la sesión en curso
  let videoActivo = null;   // id del ejercicio cuyo vídeo está embebido

  const $ = (sel) => document.querySelector(sel);
  const esc = (t) =>
    String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function iniciar() {
    prefs = Storage.cargar();
    Sesion.generar();
    document.querySelectorAll("[data-tab]").forEach((b) => {
      b.addEventListener("click", () => {
        pestana = b.dataset.tab;
        document.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("activa", x === b));
        pintar();
      });
    });
    $("#vista").addEventListener("click", alClick);
    $("#sesion-barra").addEventListener("click", alClickBarra);
    pintar();
    Sesion.alternar(); // la sesión arranca sola al abrir, sin pulsar nada
  }

  function pintar() {
    $("#sesion-barra").hidden = pestana !== "sesion" || Sesion.resumen().total === 0;
    if (pestana === "sesion") renderSesion(true);
    else if (pestana === "ejercicios") renderBiblioteca();
    else renderAjustes();
  }

  // ── Tarjetas ────────────────────────────────────────────────────────────
  function tarjetaEjercicio(e, { conHecho = false, actual = false } = {}) {
    const fav = !!prefs.favoritos[e.id];
    const oculto = !!prefs.ocultos[e.id];
    const hecho = hechos.has(e.id);
    const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(e.nombre + " ejercicio")}`;
    const embedAbierto = videoActivo === e.id && e.video;
    const etiqueta = esc(e.grupo ? (GRUPOS[e.grupo] || e.grupo) : (CATEGORIAS[e.categoria] ? CATEGORIAS[e.categoria].nombre : e.categoria || ""));
    const interior = e.img
      ? `<img src="${e.img}" alt="${esc(e.nombre)}" loading="lazy"><div class="media-velo"></div>`
      : "";
    const clicable = e.video
      ? `<button class="media-con-video" data-accion="video" aria-label="Ver vídeo de ${esc(e.nombre)}">${interior}</button>`
      : `<div class="media-con-video">${interior}</div>`;
    // el vídeo ocupa EL MISMO hueco que la imagen: nada se desplaza
    const mediaInterno = embedAbierto
      ? `<iframe class="video-frame" src="https://www.youtube-nocookie.com/embed/${e.video}?autoplay=1&playsinline=1&rel=0"
          title="Vídeo de ${esc(e.nombre)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        <button class="cerrar-video" data-accion="video" aria-label="Cerrar vídeo">✕</button>`
      : `${clicable}
        <span class="grupo-tag">${etiqueta}</span>
        <h3 class="tarjeta-titulo">${esc(e.nombre)}<b class="duracion">${e.segundos}s</b></h3>
        ${e.video ? `<span class="btn-play-mini">▶</span>` : ""}`;
    const media = `<div class="tarjeta-media">${mediaInterno}</div>`;
    return `
      <article class="tarjeta ${actual ? "actual" : ""} ${hecho ? "hecha" : ""}" data-id="${e.id}">
        ${media}
        <div class="tarjeta-cuerpo">
          ${e.notaHombro ? `<p class="nota-hombro">⚠️ ${esc(e.notaHombro)}</p>` : ""}
          <ul class="claves">${e.claves.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
          <div class="enlaces">
            ${e.video
              ? `<button class="enlace-video" data-accion="video">▶ Ver vídeo</button>`
              : `<a class="enlace-video" href="${videoUrl}" target="_blank" rel="noopener">▶ Ver vídeo</a>`}${e.wger
              ? ` <a class="enlace-wger" href="https://wger.de/es/exercise/${e.wger}/view" target="_blank" rel="noopener">Ficha en wger ↗</a>`
              : ""}
          </div>
        </div>
        <div class="tarjeta-acciones">
          <button data-accion="fav" class="btn-icono ${fav ? "activo" : ""}" aria-label="Favorito">${fav ? "❤️" : "🤍"}</button>
          ${oculto
            ? `<button data-accion="restaurar" class="btn-icono" aria-label="Restaurar">♻️</button>`
            : `<button data-accion="ocultar" class="btn-icono" aria-label="No me interesa">🚫</button>`}
          ${conHecho
            ? `<button data-accion="hecho" class="btn-hecho ${hecho ? "activo" : ""}">${hecho ? "✓ Hecho" : "Marcar hecho"}</button>`
            : ""}
        </div>
      </article>`;
  }

  // ── Sesión ──────────────────────────────────────────────────────────────
  function renderSesion(full = false) {
    if (!full) { actualizarConteo(); return; }
    // solo cierra el vídeo si su ejercicio ya no está en la sesión actual
    if (videoActivo && !Sesion.ejercicios().some((e) => e.id === videoActivo)) videoActivo = null;
    const ejercicios = Sesion.ejercicios();
    const resumen = Sesion.resumen();
    const p = Sesion.progreso();

    if (!resumen.total) {
      $("#vista").innerHTML = `
        <section class="sesion">
          <div class="aviso">No hay ejercicios disponibles: has ocultado toda la biblioteca.
          Restáuralos desde la pestaña <strong>Ejercicios</strong>.</div>
        </section>`;
      $("#sesion-barra").hidden = true;
      return;
    }

    const hechosHtml = hechos.size
      ? `<p class="sesion-hechos">✓ ${hechos.size} de ${resumen.total} completados</p>`
      : "";
    const listaHtml = ejercicios
      .map((e, i) => {
        const cab = Sesion.cabeceraPara(i);
        return `${cab ? `<h2 class="bloque">${cab.icono} ${esc(cab.texto)}</h2>` : ""}${tarjetaEjercicio(e, {
          conHecho: true,
          actual: i === p.idx && !p.terminada,
        })}`;
      })
      .join("");

    $("#vista").innerHTML = `
      <section class="sesion">
        <div class="sesion-cabecera">
          <div>
            <h2>Sesión de ${prefs.ajustes.minutos} min</h2>
            <p class="sesion-sub">${resumen.total} ejercicios · ${Math.round(resumen.segundos / 60)} min · preparada para hoy</p>
          </div>
          <button class="btn btn-secundario" data-accion="barajar">🔄 Otra<br>sesión</button>
        </div>
        <div class="progreso"><div class="progreso-barra" id="progreso-barra"></div></div>
        ${p.terminada ? `<div class="aviso exito">🎉 Sesión completada. Pide otra cuando quieras.</div>` : hechosHtml}
        ${listaHtml}
        <p class="descargo">Con tendinitis del supraespinoso: nada de dolor, y si un ejercicio
        molesta, márcalo como 🚫 y desaparecerá. Este plan no sustituye la pauta de tu fisioterapeuta.</p>
      </section>`;
    actualizarConteo();
  }

  function actualizarConteo() {
    const p = Sesion.progreso();
    const e = Sesion.actual();
    const cuenta = $("#cuenta");
    if (cuenta) cuenta.textContent = Sesion.formatear(p.restante);
    const nombre = $("#barra-nombre");
    if (nombre) nombre.textContent = p.terminada ? "Sesión completada 🎉" : e ? e.nombre : "—";
    const btn = $("#btn-play");
    if (btn) { btn.textContent = p.corriendo ? "⏸" : "▶"; }
    const barra = $("#progreso-barra");
    if (barra) barra.style.width = `${p.total ? Math.round((p.idx / p.total) * 100) : 0}%`;
    document.querySelectorAll("#vista .tarjeta").forEach((nodo) => {
      nodo.classList.toggle("actual", nodo.dataset.id === (e && e.id) && !p.terminada);
    });
  }

  function desplazarAActual() {
    if (!Sesion.progreso().corriendo) return;
    const nodo = document.querySelector("#vista .tarjeta.actual");
    if (nodo) nodo.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ── Biblioteca ──────────────────────────────────────────────────────────
  function renderBiblioteca() {
    const chips = ["todos", "favoritos", "ocultos"]
      .map((f) => `<button class="chip ${filtroBiblioteca === f ? "activa" : ""}" data-filtro="${f}">${
        { todos: "Todos", favoritos: "❤️ Favoritos", ocultos: "🚫 Ocultos" }[f]
      }</button>`)
      .join("");
    let lista = EJERCICIOS.filter((e) => {
      if (filtroBiblioteca === "favoritos") return prefs.favoritos[e.id];
      if (filtroBiblioteca === "ocultos") return prefs.ocultos[e.id];
      return !prefs.ocultos[e.id];
    });
    if (!lista.length) lista = [];
    $("#vista").innerHTML = `
      <section class="biblioteca">
        <h2>Ejercicios</h2>
        <div class="chips">${chips}</div>
        ${lista.length ? lista.map((e) => tarjetaEjercicio(e)).join("") : `<p class="aviso">Nada por aquí.</p>`}
      </section>`;
  }

  // ── Ajustes ─────────────────────────────────────────────────────────────
  function renderAjustes() {
    $("#vista").innerHTML = `
      <section class="ajustes">
        <h2>Ajustes</h2>

        <div class="panel">
          <h3>Duración de la sesión</h3>
          <select id="minutos" class="selector">
            ${[10, 15, 20].map((m) => `<option value="${m}" ${prefs.ajustes.minutos === m ? "selected" : ""}>${m} minutos</option>`).join("")}
          </select>
        </div>

        <div class="panel">
          <h3>Tus datos</h3>
          <p class="ayuda">Tus favoritos y ejercicios ocultos se guardan en este navegador
          (localStorage) y sobreviven a las actualizaciones de la app. Exporta una copia
          para cambiar de móvil o de dominio.</p>
          <div class="fila-botones">
            <button class="btn" data-accion="exportar">⬇️ Exportar</button>
            <button class="btn" data-accion="importar">⬆️ Importar</button>
            <button class="btn btn-peligro" data-accion="reiniciar">🗑️ Reiniciar</button>
          </div>
          <input type="file" id="importar-archivo" accept="application/json" hidden>
        </div>

        <div class="panel">
          <h3>Sobre esta app</h3>
          <p class="ayuda">Imágenes de ejercicios de <a href="https://wger.de" target="_blank" rel="noopener">wger.de</a>
          bajo licencias Creative Commons — ver <a href="https://github.com/micuentadecasa/cali/blob/main/ATTRIBUTIONS.md" target="_blank" rel="noopener">ATTRIBUTIONS.md</a>.
          Ejercicios seleccionados para respetar una tendinitis del supraespinoso; esto no es
          consejo médico: sigue la pauta de tu fisioterapeuta.</p>
          <p class="ayuda">Esquema de preferencias: v${prefs.schema} · clave «${Storage.CLAVE}»</p>
        </div>
      </section>`;

    $("#minutos").addEventListener("change", (ev) => {
      Storage.cambiarMinutos(Number(ev.target.value));
      prefs = Storage.cargar();
      hechos.clear();
      Sesion.generar();
      pintar();
    });
    $("#importar-archivo").addEventListener("change", alImportar); // el input solo existe en esta pestaña
  }

  // ── Eventos ─────────────────────────────────────────────────────────────
  function alClick(ev) {
    const chip = ev.target.closest("[data-filtro]");
    if (chip) { filtroBiblioteca = chip.dataset.filtro; renderBiblioteca(); return; }

    const boton = ev.target.closest("[data-accion]");
    if (!boton) return;
    const accion = boton.dataset.accion;
    const tarjeta = boton.closest(".tarjeta");
    const id = tarjeta && tarjeta.dataset.id;

    if (accion === "barajar") {
      hechos.clear();
      Sesion.generar(Date.now() % 1000000);
      renderSesion(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (accion === "fav" && id) {
      Storage.alternarFavorito(id);
      prefs = Storage.cargar();
      pestana === "ejercicios" ? renderBiblioteca() : renderSesion(true);
    } else if (accion === "ocultar" && id) {
      const e = EJERCICIOS.find((x) => x.id === id);
      if (confirm(`¿Ocultar «${e.nombre}»? No volverá a aparecer en ninguna sesión (puedes restaurarlo en Ejercicios → Ocultos).`)) {
        Storage.ocultar(id);
        prefs = Storage.cargar();
        hechos.clear();
        Sesion.generar();
        pestana === "ejercicios" ? renderBiblioteca() : renderSesion(true);
      }
    } else if (accion === "restaurar" && id) {
      Storage.restaurar(id);
      prefs = Storage.cargar();
      renderBiblioteca();
    } else if (accion === "hecho" && id) {
      if (hechos.has(id)) {
        hechos.delete(id);
        renderSesion(true);
      } else {
        hechos.add(id);
        if (Sesion.actual() && Sesion.actual().id === id) Sesion.siguiente();
        else renderSesion(true);
      }
    } else if (accion === "video" && id) {
      const e = EJERCICIOS.find((x) => x.id === id);
      if (e && e.video) {
        videoActivo = videoActivo === id ? null : id;
        pestana === "ejercicios" ? renderBiblioteca() : renderSesion(true);
      }
    } else if (accion === "exportar") {
      descargarExport();
    } else if (accion === "importar") {
      $("#importar-archivo").click();
    } else if (accion === "reiniciar") {
      if (confirm("¿Borrar favoritos, ocultos y ajustes de este navegador?")) {
        prefs = Storage.reiniciar();
        hechos.clear();
        Sesion.generar();
        pintar();
      }
    }
  }

  function alClickBarra(ev) {
    const boton = ev.target.closest("[data-accion-barra]");
    if (!boton) return;
    if (boton.dataset.accionBarra === "play") {
      if (Sesion.progreso().terminada) return;
      Sesion.alternar();
      actualizarConteo();
    } else if (boton.dataset.accionBarra === "siguiente") {
      Sesion.siguiente();
    }
  }

  function alImportar(ev) {
    const archivo = ev.target.files[0];
    if (!archivo) return;
    archivo
      .text()
      .then((texto) => {
        prefs = Storage.importar(texto);
        hechos.clear();
        Sesion.generar();
        alert("Preferencias importadas ✓");
        pintar();
      })
      .catch((err) => alert(`No se pudo importar: ${err.message}`))
      .finally(() => { ev.target.value = ""; });
  }

  function descargarExport() {
    const blob = new Blob([Storage.exportar()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cali-preferencias.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.addEventListener("DOMContentLoaded", iniciar);

  // getter: prefs se lee en vivo, no se captura al cargar el módulo
  return { get prefs() { return prefs; }, renderSesion, actualizarConteo, desplazarAActual };
})();
