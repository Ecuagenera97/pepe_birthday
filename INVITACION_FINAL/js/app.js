/* =====================================================================
   Invitación Pepe Portilla — funcionamiento del libro
   1) Tapa que se abre de derecha a izquierda
   2) Hojas que se pasan como un libro (StPageFlip, js/page-flip.js)
   3) Cuenta regresiva, calendario, enlaces de WhatsApp y mapa
   ===================================================================== */
(function () {
  var U = window.UTIL, C = U.C;
  var reducido = U.reducido();
  var invitado = U.nombre();
  if (C.tituloPestana) document.title = C.tituloPestana;

  var libro = document.getElementById("libro");
  var flipEl = document.getElementById("flip");
  var paginas = Array.prototype.slice.call(document.querySelectorAll("#flip > .pagina"));
  var mando = document.getElementById("mando");
  var puntos = document.getElementById("puntos");
  var btnSig = document.getElementById("siguiente"), btnAtras = document.getElementById("atras");

  /* ---------- Tamaño del libro: hoja 9:16 que cabe en la pantalla ---------- */
  function medir() {
    var barra = 56, vw = window.innerWidth, vh = window.innerHeight;
    var h = Math.min(vh - barra - 12, (vw - 0) * 16 / 9);
    if (vw >= 600) h = Math.min(h, vh - barra - 28);
    var w = Math.round(h * 9 / 16); h = Math.round(w * 16 / 9);
    libro.style.setProperty("--lw", w + "px"); libro.style.setProperty("--lh", h + "px");
    document.documentElement.style.setProperty("--lw", w + "px");
  }
  medir();
  window.addEventListener("resize", medir);

  /* ---------- Botones que laten: copian el trozo de su hoja ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".late[data-img]"), function (s) {
    s.style.backgroundImage = "url(img/" + s.getAttribute("data-img") + ".webp)";
  });

  /* ---------- Libro de hojas ---------- */
  var pf = new St.PageFlip(flipEl, {
    width: 900, height: 1600, size: "stretch",
    minWidth: 5000, maxWidth: 4000, minHeight: 0, maxHeight: 8000,   // minWidth alto = siempre una hoja (vertical)
    usePortrait: true, showCover: false, autoSize: true,
    drawShadow: true, maxShadowOpacity: .55, flippingTime: reducido ? 300 : 2800,
    mobileScrollSupport: false, swipeDistance: 25, clickEventForward: true,
    useMouseEvents: true, showPageCorners: true, disableFlipByClick: true, startZIndex: 1
  });
  pf.loadFromHTML(paginas);
  flipEl.style.minWidth = "0"; flipEl.style.minHeight = "0";

  var actual = 0;
  paginas.forEach(function (p, i) {
    var d = document.createElement("i");
    d.addEventListener("click", function () { if (abierto) pf.flip(i); });
    puntos.appendChild(d);
  });
  function pintar() {
    Array.prototype.forEach.call(puntos.children, function (d, i) { d.className = i === actual ? "on" : ""; });
    btnAtras.disabled = actual === 0;
    btnSig.disabled = actual === paginas.length - 1;
  }
  function activar(i) {
    var antes = paginas[actual];
    if (antes && antes !== paginas[i]) { antes.classList.remove("activa"); window.VIVO_CTRL && VIVO_CTRL.salir(antes); }
    actual = i;
    paginas[i].classList.add("activa");
    window.VIVO_CTRL && VIVO_CTRL.entrar(paginas[i]);
    if (paginas[i + 1] && window.VIVO_CTRL) VIVO_CTRL.precargar(paginas[i + 1]);
    pintar();
  }
  pf.on("flip", function (e) { activar(e.data); });
  btnSig.addEventListener("click", function () { pf.flipNext("top"); });
  function atras() {                      /* hoja anterior, con la misma animación de libro */
    if (actual <= 0) return;
    var st = pf.getSettings(); st.disableFlipByClick = false;
    pf.flipPrev("top"); st.disableFlipByClick = true;
  }
  btnAtras.addEventListener("click", atras);
  document.addEventListener("keydown", function (e) {
    if (!abierto) { if (e.key === "Enter" || e.key === " ") abrir(); return; }
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); pf.flipNext("top"); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); atras(); }
  });

  /* ---------- 1. Abrir la tapa ---------- */
  var abierto = false;
  function abrir() {
    if (abierto) return;
    abierto = true;
    libro.classList.add("abriendo");
    activar(0);                                   // el logo empieza a aparecer mientras gira la tapa
    mando.hidden = false; requestAnimationFrame(function () { mando.classList.add("ver"); });
    setTimeout(function () { libro.classList.add("abierto"); }, reducido ? 50 : 1650);
  }
  document.getElementById("sello").addEventListener("click", abrir);
  document.getElementById("tapa").addEventListener("click", function (e) { if (e.target.id !== "sello") abrir(); });

  /* precarga de las hojas siguientes */
  window.addEventListener("load", function () {
    paginas.forEach(function (p) { var im = p.querySelector(".base"); if (im && im.decode) im.decode().catch(function () {}); });
  });

  /* ---------- Nombre del invitado (hoja del logo) ---------- */
  if (invitado) {
    document.getElementById("para-nombre").textContent = invitado;
    document.getElementById("para").hidden = false;
  }

  /* ---------- Enlaces ---------- */
  var enlaces = {
    mapa: C.mapa,
    confirmar: U.whatsapp(C.confirmacion.whatsapp,
      C.confirmacion.mensaje.replace(/\{nombre\}/g, invitado || C.confirmacion.sinNombre || "")),
    hospedaje: U.whatsapp(C.hospedaje.whatsapp, C.hospedaje.mensaje),
    obsequio: C.obsequio
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-accion]"), function (a) {
    var u = enlaces[a.getAttribute("data-accion")]; if (u) a.href = u;
  });

  /* ---------- Cuenta regresiva ---------- */
  var inicio = new Date(C.evento.inicio).getTime();
  var fin = inicio + (C.evento.duracionHoras || 5) * 36e5;
  var nums = {};
  Array.prototype.forEach.call(document.querySelectorAll("#reloj [data-u]"), function (n) { nums[n.getAttribute("data-u")] = n; });
  function dos(n) { return (n < 10 ? "0" : "") + n; }
  var timer;
  function tic() {
    if (isNaN(inicio)) return;
    var falta = inicio - Date.now();
    if (falta <= 0) {
      clearInterval(timer);
      document.getElementById("reloj").innerHTML = '<p class="fin">¡Llegó el gran día!</p>';
      return;
    }
    nums.d.textContent = dos(Math.floor(falta / 864e5));
    nums.h.textContent = dos(Math.floor(falta % 864e5 / 36e5));
    nums.m.textContent = dos(Math.floor(falta % 36e5 / 6e4));
    nums.s.textContent = dos(Math.floor(falta % 6e4 / 1e3));
  }
  tic(); timer = setInterval(tic, 1000);

  /* ---------- Agujas del reloj: al llegar a la hoja giran hasta la hora de Ecuador y siguen andando ---------- */
  var agH = document.getElementById("ag-hora"), agM = document.getElementById("ag-min"), agS = document.getElementById("ag-seg");
  var hojaCuenta = document.querySelector('.pagina[data-pag="cuenta"]');
  var giroDesde = 0;
  function horaEcuador() {
    var d = new Date(Date.now() - 5 * 36e5);                  /* UTC-5 */
    return d.getUTCHours() % 12 * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds() + d.getUTCMilliseconds() / 1000;
  }
  function ponerAgujas(seg) {
    agH.setAttribute("transform", "rotate(" + (seg / 120) + ")");          /* 360° cada 12 h */
    agM.setAttribute("transform", "rotate(" + (seg / 10 % 360) + ")");     /* 360° cada hora */
    agS.setAttribute("transform", "rotate(" + (Math.floor(seg % 60) * 6) + ")");
  }
  function relojBucle(ahora) {
    var real = horaEcuador();
    if (giroDesde) {
      var u = Math.min(1, (ahora - giroDesde) / 2600), e = 1 - Math.pow(1 - u, 3);
      /* da dos vueltas del minutero antes de quedarse en la hora real */
      ponerAgujas(real - (1 - e) * 7200);
      if (u >= 1) giroDesde = 0;
    } else ponerAgujas(real);
    if (hojaCuenta.classList.contains("activa")) requestAnimationFrame(relojBucle); else relojCorre = false;
  }
  var relojCorre = false;
  ponerAgujas(horaEcuador());
  new MutationObserver(function () {
    if (hojaCuenta.classList.contains("activa") && !relojCorre) {
      relojCorre = true; giroDesde = reducido ? 0 : performance.now(); requestAnimationFrame(relojBucle);
    }
  }).observe(hojaCuenta, { attributes: true, attributeFilter: ["class"] });

  /* ---------- Agregar al calendario ---------- */
  function utc(t) { return new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  var detalle = "Invitación: " + location.href.split(/[?#]/)[0] + "\nMapa: " + C.mapa;
  if (!isNaN(inicio)) {
    document.getElementById("cal-google").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(C.evento.titulo) + "&dates=" + utc(inicio) + "/" + utc(fin) +
      "&details=" + encodeURIComponent(detalle) + "&location=" + encodeURIComponent(C.evento.lugar);
  }
  document.getElementById("cal-ics").addEventListener("click", function (ev) {
    ev.preventDefault();
    function e(s) { return String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }
    var txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invitacion//ES", "BEGIN:VEVENT",
      "UID:" + inicio + "@invitacion", "DTSTAMP:" + utc(Date.now()), "DTSTART:" + utc(inicio), "DTEND:" + utc(fin),
      "SUMMARY:" + e(C.evento.titulo), "LOCATION:" + e(C.evento.lugar), "DESCRIPTION:" + e(detalle),
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + e(C.evento.titulo), "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/calendar;charset=utf-8" }));
    a.download = "cumpleanos-pepe-portilla.ics";
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- Música (opcional, desde config.js) ---------- */
  if (C.musica) {
    var audio = document.getElementById("audio"), btn = document.getElementById("musica");
    audio.src = C.musica; btn.hidden = false;
    btn.addEventListener("click", function () { audio.paused ? audio.play().catch(function () {}) : audio.pause(); });
    document.getElementById("sello").addEventListener("click", function () { audio.play().catch(function () {}); });
  }

  /* #pagina=N abre directo en esa hoja (pruebas) */
  if (/pagina=\d/.test(location.hash)) {
    var n = parseInt(location.hash.replace(/\D+/g, ""), 10) - 2;   // N = número de pantalla (2..11)
    abrir(); libro.classList.add("abierto");
    if (n > 0 && n < paginas.length) { pf.turnToPage(n); activar(n); }
  }
})();
