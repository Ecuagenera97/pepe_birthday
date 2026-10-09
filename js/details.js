/* Página de detalles: enlaces, cuenta regresiva, calendario, efectos. */
(function () {
  var U = window.UTIL, C = U.C;
  var invitado = U.nombre();
  if (C.tituloPestana) document.title = "Detalles del Evento · " + C.festejado;

  /* ---------- Enlaces de los botones ---------- */
  var enlaces = {
    mapa: C.mapa,
    confirmar: U.whatsapp(C.confirmacion.whatsapp,
      C.confirmacion.mensaje.replace(/\{nombre\}/g, invitado || C.confirmacion.sinNombre || "")),
    hospedaje: U.whatsapp(C.hospedaje.whatsapp, C.hospedaje.mensaje),
    obsequio: C.obsequio
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-accion]"), function (a) {
    var u = enlaces[a.getAttribute("data-accion")];
    if (u) a.href = u;
  });

  /* ---------- Nombre del invitado en la cuenta regresiva ---------- */
  if (invitado) {
    document.getElementById("para-nombre").textContent = invitado;
    document.getElementById("para").hidden = false;
  }

  /* ---------- Cuenta regresiva (hora de Ecuador, sirve desde cualquier país) ---------- */
  var inicio = new Date(C.evento.inicio).getTime();
  var fin = inicio + (C.evento.duracionHoras || 5) * 36e5;
  var nums = {};
  Array.prototype.forEach.call(document.querySelectorAll("#reloj [data-u]"), function (n) { nums[n.getAttribute("data-u")] = n; });
  function dos(n) { return (n < 10 ? "0" : "") + n; }
  var timer;
  function tic() {
    var falta = inicio - Date.now();
    if (isNaN(inicio)) return;
    if (falta <= 0) {
      clearInterval(timer);
      document.getElementById("reloj").innerHTML = '<p class="fin-reloj">¡Llegó el gran día!</p>';
      if (Date.now() > fin) document.getElementById("calendario").style.display = "none";
      return;
    }
    nums.d.textContent = dos(Math.floor(falta / 864e5));
    nums.h.textContent = dos(Math.floor(falta % 864e5 / 36e5));
    nums.m.textContent = dos(Math.floor(falta % 36e5 / 6e4));
    nums.s.textContent = dos(Math.floor(falta % 6e4 / 1e3));
  }
  tic(); timer = setInterval(tic, 1000);

  /* ---------- Agregar al calendario ---------- */
  function utc(t) { return new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  var detalle = "Invitación: " + location.href.split("?")[0].replace(/details\.html$/, "") + "\nMapa: " + C.mapa;
  var g = document.getElementById("cal-google");
  if (!isNaN(inicio)) {
    g.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(C.evento.titulo) +
      "&dates=" + utc(inicio) + "/" + utc(fin) +
      "&details=" + encodeURIComponent(detalle) +
      "&location=" + encodeURIComponent(C.evento.lugar);
  }
  document.getElementById("cal-ics").addEventListener("click", function () {
    function e(s) { return String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }
    var txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invitacion//ES", "BEGIN:VEVENT",
      "UID:" + inicio + "@invitacion", "DTSTAMP:" + utc(Date.now()),
      "DTSTART:" + utc(inicio), "DTEND:" + utc(fin),
      "SUMMARY:" + e(C.evento.titulo), "LOCATION:" + e(C.evento.lugar), "DESCRIPTION:" + e(detalle),
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + e(C.evento.titulo), "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/calendar;charset=utf-8" }));
    a.download = "cumpleanos-pepe-portilla.ics";
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- Aparición suave al desplazarse ---------- */
  var rev = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !U.reducido()) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("visible"); io.unobserve(x.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    Array.prototype.forEach.call(rev, function (r) { io.observe(r); });
  } else {
    Array.prototype.forEach.call(rev, function (r) { r.classList.add("visible"); });
  }

  /* ---------- Precarga: al terminar la primera carga se descargan todas las páginas ---------- */
  window.addEventListener("load", function () {
    Array.prototype.forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (i) { i.loading = "eager"; });
  });

  /* ---------- Música (opcional, desde config.js) ---------- */
  if (C.musica) {
    var audio = document.getElementById("audio"), btn = document.getElementById("musica");
    audio.src = C.musica; btn.hidden = false;
    var ic = document.getElementById("musica-icono");
    var sonido = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
    var mudo = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
    function pintar() { ic.innerHTML = audio.paused ? mudo : sonido; btn.setAttribute("aria-label", audio.paused ? "Reproducir música" : "Pausar música"); }
    audio.addEventListener("play", pintar); audio.addEventListener("pause", pintar); pintar();
    btn.addEventListener("click", function () { audio.paused ? audio.play().catch(function () {}) : audio.pause(); });
    var tipos = ["pointerdown", "keydown"];
    var primero = function () { tipos.forEach(function (t) { removeEventListener(t, primero); }); audio.play().catch(function () {}); };
    audio.play().catch(function () { tipos.forEach(function (t) { addEventListener(t, primero, { passive: true }); }); });
  }
})();
