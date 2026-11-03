/* =====================================================================
   Invitación Pepe Portilla — funcionamiento del libro
   1) Tapa que se abre de derecha a izquierda
   2) Hojas que se pasan como un libro (giro 3D de cada hoja)
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

  /* ---------- Libro de hojas: cada hoja gira sobre su lomo (izquierda) ----------
     Solo se mueve una capa por vez con transform 3D (lo hace la tarjeta gráfica),
     así el paso de hoja es fluido también en celulares. */
  var actual = 0, girando = false;
  var DUR = reducido ? 1 : 950;
  paginas.forEach(function (p, i) {
    var s = document.createElement("span"); s.className = "giro-luz"; p.appendChild(s);   /* luz/sombra de la hoja al girar */
    var d = document.createElement("i");
    d.addEventListener("click", function () { if (abierto) irA(i); });
    puntos.appendChild(d);
  });
  var sombraBajo = document.createElement("div"); sombraBajo.className = "giro-sombra"; flipEl.appendChild(sombraBajo);

  function pintar() {
    Array.prototype.forEach.call(puntos.children, function (d, i) { d.className = i === actual ? "on" : ""; });
    btnAtras.disabled = actual === 0;
    btnSig.disabled = actual === paginas.length - 1;
  }
  function mostrar(lista) {
    paginas.forEach(function (p, i) { p.classList.toggle("vista", lista.indexOf(i) >= 0); });
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
  function poner(p, ang, luz) {
    p.style.transform = ang ? "rotateY(" + ang + "deg)" : "";
    var l = p.querySelector(".giro-luz"); if (l) l.style.opacity = luz;
  }
  function suave(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  /* anima una hoja de un ángulo a otro; desde = 0 (plana) ... -180 (pasada) */
  function animar(hoja, desde, hasta, alFin) {
    var t0 = performance.now(), dur = DUR * Math.max(.35, Math.abs(hasta - desde) / 180);
    function paso(ahora) {
      var u = Math.min(1, (ahora - t0) / dur), e = suave(u), a = desde + (hasta - desde) * e;
      poner(hoja, a, Math.sin(-a * Math.PI / 180) * .55);
      sombraBajo.style.opacity = Math.max(0, Math.cos(-a * Math.PI / 180)) * .45;
      if (u < 1) requestAnimationFrame(paso); else alFin();
    }
    requestAnimationFrame(paso);
  }
  function siguiente(desdeAng) {
    if (girando || actual >= paginas.length - 1) return;
    girando = true;
    var hoja = paginas[actual], i = actual + 1;
    mostrar([actual, i]); hoja.classList.add("arriba"); sombraBajo.classList.add("ver");
    animar(hoja, desdeAng || 0, -180, function () {
      hoja.classList.remove("arriba"); poner(hoja, 0, 0); sombraBajo.classList.remove("ver");
      mostrar([i]); activar(i); girando = false;
    });
  }
  function anterior(desdeAng) {
    if (girando || actual <= 0) return;
    girando = true;
    var i = actual - 1, hoja = paginas[i];
    poner(hoja, desdeAng === undefined ? -180 : desdeAng, .55);
    mostrar([actual, i]); hoja.classList.add("arriba"); sombraBajo.classList.add("ver");
    animar(hoja, desdeAng === undefined ? -180 : desdeAng, 0, function () {
      hoja.classList.remove("arriba"); poner(hoja, 0, 0); sombraBajo.classList.remove("ver");
      mostrar([i]); activar(i); girando = false;
    });
  }
  function irA(i) {
    if (i === actual || girando) return;
    if (i === actual + 1) return siguiente();
    if (i === actual - 1) return anterior();
    /* salto largo: la hoja cambia con un fundido corto */
    var nueva = paginas[i]; mostrar([actual, i]); nueva.classList.add("arriba", "fundido");
    setTimeout(function () { nueva.classList.remove("arriba", "fundido"); mostrar([i]); activar(i); }, 450);
  }
  mostrar([0]);
  btnSig.addEventListener("click", function () { siguiente(); });
  btnAtras.addEventListener("click", function () { anterior(); });
  document.addEventListener("keydown", function (e) {
    if (!abierto) { if (e.key === "Enter" || e.key === " ") abrir(); return; }
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); siguiente(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); anterior(); }
  });

  /* Deslizar con el dedo: la hoja sigue al dedo y al soltar termina de pasar (o vuelve) */
  var tx = null, ty = 0, arrastre = null;
  flipEl.addEventListener("touchstart", function (e) {
    if (!abierto || girando || e.touches.length !== 1) { tx = null; return; }
    tx = e.touches[0].clientX; ty = e.touches[0].clientY; arrastre = null;
  }, { passive: true });
  flipEl.addEventListener("touchmove", function (e) {
    if (tx === null) return;
    var dx = e.touches[0].clientX - tx, dy = e.touches[0].clientY - ty, w = flipEl.clientWidth;
    if (!arrastre) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0 && actual < paginas.length - 1) {
        arrastre = { dir: 1, hoja: paginas[actual] }; mostrar([actual, actual + 1]);
      } else if (dx > 0 && actual > 0) {
        arrastre = { dir: -1, hoja: paginas[actual - 1] }; mostrar([actual, actual - 1]);
      } else { tx = null; return; }
      arrastre.hoja.classList.add("arriba"); sombraBajo.classList.add("ver");
    }
    var f = Math.max(0, Math.min(1, Math.abs(dx) / (w * .9)));
    var ang = arrastre.dir === 1 ? -180 * f : -180 * (1 - f);
    arrastre.ang = ang;
    poner(arrastre.hoja, ang, Math.sin(-ang * Math.PI / 180) * .55);
    sombraBajo.style.opacity = Math.max(0, Math.cos(-ang * Math.PI / 180)) * .45;
  }, { passive: true });
  flipEl.addEventListener("touchend", function () {
    if (!arrastre) { tx = null; return; }
    var a = arrastre, ang = a.ang || 0; tx = null; arrastre = null;
    var pasa = a.dir === 1 ? ang < -50 : ang > -130;
    if (a.dir === 1) {
      if (pasa) siguiente(ang);
      else { girando = true; animar(a.hoja, ang, 0, function () { a.hoja.classList.remove("arriba"); sombraBajo.classList.remove("ver"); mostrar([actual]); girando = false; }); }
    } else {
      if (pasa) anterior(ang);
      else { girando = true; animar(a.hoja, ang, -180, function () { a.hoja.classList.remove("arriba"); poner(a.hoja, 0, 0); sombraBajo.classList.remove("ver"); mostrar([actual]); girando = false; }); }
    }
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
    if (n > 0 && n < paginas.length) { mostrar([n]); activar(n); }
  }
})();
