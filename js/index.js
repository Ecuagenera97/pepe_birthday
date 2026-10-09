/* Portada con video de apertura + libreta de hojas. */
(function () {
  var U = window.UTIL, C = U.C;
  if (C.tituloPestana) document.title = C.tituloPestana;
  var reducido = U.reducido();

  /* ---------- Hojas ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll("#slides > .slide"));
  var total = slides.length, cur = 0, ocupado = false;
  var puntos = document.getElementById("puntos");
  var pista = document.getElementById("pista");
  var pistaAtras = document.getElementById("pista-atras");

  slides.forEach(function (s, i) {
    var d = document.createElement("i");
    d.setAttribute("role", "tab");
    d.addEventListener("click", function () { ir(i); });
    puntos.appendChild(d);
  });

  function pintar() {
    Array.prototype.forEach.call(puntos.children, function (d, i) { d.className = i === cur ? "on" : ""; });
    pistaAtras.hidden = cur === 0;
    pista.hidden = cur === total - 1;
  }

  function limpiar(s) { s.classList.remove("saliendo", "volviendo", "preparada", "quieto"); s.style.transition = ""; }

  function ir(n) {
    if (ocupado || n === cur || n < 0 || n >= total) return;
    var viene = slides[n], sale = slides[cur];
    var adelante = n > cur;
    ocupado = true;
    limpiar(viene);
    sale.classList.remove("quieto");

    if (reducido) {
      sale.classList.remove("activo"); viene.classList.add("activo");
      cur = n; pintar(); ocupado = false; asentar(viene); precargar(n + 1); return;
    }

    if (adelante) {
      /* la hoja actual se levanta y gira; la nueva aparece debajo */
      sale.classList.add("saliendo");
      sale.classList.remove("activo");
      viene.classList.add("activo");
    } else {
      /* la hoja anterior vuelve girando sobre la actual, que se desvanece */
      viene.classList.add("preparada", "volviendo");
      void viene.offsetWidth;
      viene.classList.remove("preparada");
      viene.classList.add("activo");
      sale.classList.remove("activo");
    }
    cur = n; pintar();
    setTimeout(function () {
      limpiar(sale); viene.classList.remove("volviendo");
      ocupado = false; asentar(viene);
    }, 620);
    precargar(n + 1); precargar(n - 1);
  }
  /* cuando terminan las animaciones de entrada, la hoja queda "quieta" (sin máscaras) */
  function asentar(s) {
    if (!s.hasAttribute("data-anim")) return;
    clearTimeout(s._q);
    s._q = setTimeout(function () { if (s.classList.contains("activo")) s.classList.add("quieto"); }, 1700);
  }
  function sig() { ir(cur + 1); }
  function atras() { ir(cur - 1); }
  pista.addEventListener("click", sig);
  pistaAtras.addEventListener("click", atras);

  /* Deslizar con el dedo, tocar los bordes de la hoja o usar las flechas del teclado */
  var stage = document.getElementById("stage");
  var x0 = null, y0 = 0, t0 = 0, movio = false;
  stage.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); movio = false;
  }, { passive: true });
  stage.addEventListener("touchmove", function (e) {
    if (x0 !== null && Math.abs(e.touches[0].clientX - x0) > 8) movio = true;
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - t0 < 700) { dx < 0 ? sig() : atras(); }
  }, { passive: true });
  /* toque en el tercio derecho = siguiente, en el cuarto izquierdo = anterior (los botones de la hoja tienen prioridad) */
  stage.addEventListener("click", function (e) {
    if (movio || e.target.closest("a, button, .cuenta")) return;
    var r = document.getElementById("slides").getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    if (x > 0.66) sig(); else if (x < 0.25) atras();
  });
  document.addEventListener("keydown", function (e) {
    if (!document.getElementById("libro").classList.contains("fuera")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); sig(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); atras(); }
  });

  /* Precarga de las hojas para que el cambio sea inmediato */
  function precargar(i) {
    var s = slides[i]; if (!s) return;
    var im = s.querySelector("img.base"); if (im && im.decode) im.decode().catch(function () {});
  }
  slides[0].classList.add("activo", "espera");   // los animales se levantan cuando se abre el libro
  pintar();
  window.addEventListener("load", function () { for (var i = 1; i < total; i++) precargar(i); });

  /* ---------- Portada: tocar el sello -> el video abre el libro y deja ver la primera hoja ---------- */
  var libro = document.getElementById("libro");
  var video = document.getElementById("apertura");
  var abierto = false, terminado = false;

  function entrar() {
    if (terminado) return;
    terminado = true;
    slides[0].classList.remove("espera");
    libro.classList.add("abriendo");
    video.classList.add("fin");
    setTimeout(function () { libro.classList.add("fuera"); video.classList.add("fuera"); asentar(slides[0]); }, 400);
  }
  function abrir() {
    if (abierto) { entrar(); return; }            // segundo toque: entra de inmediato
    abierto = true;
    if (reducido || !video.play) { entrar(); return; }
    var respaldo = setTimeout(entrar, 3500);      // si el video no arranca, no se queda pegado
    video.addEventListener("playing", function () {
      video.classList.add("reproduce");
      libro.classList.add("abriendo");            // la portada fija se retira; queda el video fundido con la hoja
      setTimeout(function () { slides[0].classList.remove("espera"); }, 1100);
    }, { once: true });
    video.addEventListener("ended", function () { clearTimeout(respaldo); entrar(); }, { once: true });
    video.addEventListener("error", function () { clearTimeout(respaldo); entrar(); }, { once: true });
    var p = video.play();
    if (p && p.catch) p.catch(function () { clearTimeout(respaldo); entrar(); });
  }
  document.getElementById("sello").addEventListener("click", abrir);
  video.load();

  /* #pagina=N abre directo en esa hoja (uso interno / pruebas) */
  if (/pagina=\d/.test(location.hash)) {
    var n = parseInt(location.hash.replace(/\D+/g, ""), 10) - 1;
    if (n >= 0 && n < total) {
      abierto = terminado = true; libro.classList.add("fuera"); video.classList.add("fuera");
      slides[0].classList.remove("activo", "espera"); cur = n; slides[n].classList.add("activo"); pintar(); asentar(slides[n]);
    }
  }
})();
