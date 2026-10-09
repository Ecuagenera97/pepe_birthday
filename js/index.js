/* Portada con video de apertura + páginas con "Siguiente". */
(function () {
  var U = window.UTIL, C = U.C;
  if (C.tituloPestana) document.title = C.tituloPestana;

  /* ---------- Nombre del invitado ----------
     "Sr. Juan Pérez y Sra"  ->  línea 1: "Sr. Juan Pérez"  /  línea 2: "y Sra" */
  var nombre = U.nombre();
  var el = document.getElementById("nombre");
  if (!nombre) {
    el.textContent = C.sinNombre || "Te esperamos";
    document.getElementById("etiqueta").textContent = "";
  } else {
    var partes = nombre.split(/\s+y\s+/i);
    el.textContent = "";
    var l1 = document.createElement("span");
    l1.textContent = partes[0];
    el.appendChild(l1);
    if (partes.length > 1) {
      var l2 = document.createElement("span");
      l2.className = "linea2";
      l2.textContent = "y " + partes.slice(1).join(" y ");
      el.appendChild(l2);
    }
  }

  /* ---------- Páginas ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll("#slides > .slide"));
  var total = slides.length, cur = 0;
  var puntos = document.getElementById("puntos");
  var btnSig = document.getElementById("siguiente");
  var btnAtras = document.getElementById("atras");
  var txtSig = document.getElementById("sig-texto");
  var reducido = U.reducido();

  slides.forEach(function (s, i) {
    var d = document.createElement("i");
    d.addEventListener("click", function () { ir(i); });
    puntos.appendChild(d);
  });
  puntos.style.pointerEvents = "auto";

  function pintar() {
    Array.prototype.forEach.call(puntos.children, function (d, i) { d.className = i === cur ? "on" : ""; });
    btnAtras.hidden = cur === 0;
    txtSig.textContent = cur === total - 1 ? "Volver al inicio" : "Siguiente";
    btnSig.setAttribute("aria-label", cur === total - 1 ? "Volver a la primera página" : "Página siguiente");
  }

  function ir(n) {
    if (n === cur || n < 0 || n >= total) return;
    var dir = n > cur ? 1 : -1;
    var viene = slides[n], sale = slides[cur];
    if (!reducido) {
      viene.style.transition = "none";
      viene.style.setProperty("--x", (dir * 9) + "%");
      void viene.offsetWidth;                     // fija la posición inicial
      viene.style.transition = "";
      sale.style.setProperty("--x", (-dir * 9) + "%");
    }
    sale.classList.remove("activo");
    viene.classList.add("activo");
    cur = n;
    pintar();
    precargar(n + 1);
  }
  function sig() { cur === total - 1 ? ir(0) : ir(cur + 1); }
  function atras() { ir(cur - 1); }
  btnSig.addEventListener("click", sig);
  btnAtras.addEventListener("click", atras);

  /* Deslizar con el dedo / flechas del teclado */
  var stage = document.getElementById("stage");
  var x0 = null, y0 = 0, t0 = 0;
  stage.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - t0 < 700) { dx < 0 ? sig() : atras(); }
  }, { passive: true });
  document.addEventListener("keydown", function (e) {
    if (document.getElementById("libro").className.indexOf("fuera") < 0) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); if (cur < total - 1) sig(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); atras(); }
  });

  /* Precarga de las páginas siguientes para que el cambio sea inmediato */
  function precargar(i) {
    var s = slides[i]; if (!s) return;
    var im = s.querySelector("img"); if (im && im.decode) im.decode().catch(function () {});
  }
  slides[0].classList.add("activo");
  pintar();
  window.addEventListener("load", function () { for (var i = 1; i < total; i++) precargar(i); });

  /* ---------- Portada: tocar el sello -> el video abre el libro ---------- */
  var libro = document.getElementById("libro");
  var video = document.getElementById("apertura");
  var abierto = false, terminado = false;

  function entrar() {
    if (terminado) return;
    terminado = true;
    libro.classList.add("fuera");                 // desvanece sobre la primera página
    setTimeout(function () { libro.style.display = "none"; }, 800);
  }
  function abrir() {
    if (abierto) { entrar(); return; }            // segundo toque: entra de inmediato
    abierto = true;
    libro.classList.add("abriendo");
    if (reducido || !video || !video.play) { entrar(); return; }
    var respaldo = setTimeout(entrar, 3500);      // si el video no arranca, no se queda pegado
    video.addEventListener("playing", function () { libro.classList.add("reproduce"); }, { once: true });
    video.addEventListener("ended", function () { clearTimeout(respaldo); entrar(); }, { once: true });
    video.addEventListener("error", function () { clearTimeout(respaldo); entrar(); }, { once: true });
    var p = video.play();
    if (p && p.catch) p.catch(function () { clearTimeout(respaldo); entrar(); });
  }
  document.getElementById("sello").addEventListener("click", abrir);
  if (video) video.load();

  /* Enlace antiguo (details.html?nombre=...) o #pagina: salta directo */
  if (/[#&]pagina=\d/.test(location.hash)) {
    var n = parseInt(location.hash.replace(/\D+/g, ""), 10) - 1;
    if (n >= 0 && n < total) { abierto = true; libro.style.display = "none"; terminado = true; slides[0].classList.remove("activo"); cur = n; slides[n].classList.add("activo"); pintar(); }
  }
})();
