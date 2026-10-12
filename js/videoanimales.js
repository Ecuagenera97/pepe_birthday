/* =====================================================================
   OSO Y JAGUAR QUE CAMINAN
   Cuadros de animación (sacados de un video, con fondo transparente)
   guardados en hojas de 10 cuadros en img/anim/mov/. Se dibujan en un
   lienzo sobre la portada: el oso sale caminando por la izquierda y se
   echa; el jaguar entra por la derecha y se recuesta. Después quedan
   respirando suavemente. Ajustes en js/movimiento.js.
   ===================================================================== */
(function () {
  var CFG = window.MOVIMIENTO || {};
  var reducido = window.UTIL && window.UTIL.reducido();
  var PW = 1440, PH = 2560;                     /* tamaño de la página en el diseño */
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var ORDEN = ["oso", "jaguar"];

  function ease(t) { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3); }

  /* ---------- carga de las hojas de cuadros ---------- */
  var hojas = {}, listos = 0, total = 0, alListo = [];
  function cargar() {
    ORDEN.forEach(function (k) {
      var c = CFG[k]; if (!c) return;
      hojas[k] = c.sheets.map(function (f) {
        total++;
        var im = new Image(); im.decoding = "async";
        im.onload = im.onerror = function () { listos++; if (listos === total) alListo.splice(0).forEach(function (f) { f(); }); };
        im.src = "img/anim/mov/" + f;
        return im;
      });
    });
  }
  function cuandoListo(f) { if (total && listos === total) f(); else alListo.push(f); }

  /* ---------- un animal ---------- */
  function posicion(k, i) {
    /* dónde va (en px de página) la caja del cuadro i, incluido el desplazamiento de entrada */
    var c = CFG[k], s = c.esc;
    var x = c.pagina[0] + (c.caja[0] - c.ancla[0]) * s;
    var y = c.pagina[1] + (c.caja[1] - c.ancla[1]) * s;
    var u = ease(i / c.entrada.hasta);
    x += c.entrada.dx * (1 - u);
    return { x: x, y: y, w: (c.caja[2] - c.caja[0]) * s, h: (c.caja[3] - c.caja[1]) * s };
  }

  function Escena(canvas) {
    this.c = canvas; this.ctx = canvas.getContext("2d"); this.t0 = 0; this.activa = false; this.raf = 0;
  }
  Escena.prototype.ajustar = function () {
    var r = this.c.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width * DPR)), h = Math.max(1, Math.round(r.height * DPR));
    if (this.c.width !== w || this.c.height !== h) { this.c.width = w; this.c.height = h; }
    this.k = w / PW;                            /* px de lienzo por px de página */
  };
  Escena.prototype.dibujar = function (ahora) {
    var ctx = this.ctx, t = (ahora - this.t0) / 1000, k = this.k;
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    for (var n = 0; n < ORDEN.length; n++) {
      var nombre = ORDEN[n], c = CFG[nombre]; if (!c || !hojas[nombre]) continue;
      var tt = t - c.retardo; if (tt < 0 && !reducido) continue;
      var i = reducido ? c.n - 1 : Math.min(c.n - 1, Math.floor(tt * c.fps));
      var hoja = hojas[nombre][Math.floor(i / c.per)], j = i % c.per;
      if (!hoja || !hoja.complete || !hoja.naturalWidth) continue;
      var p = posicion(nombre, i);
      /* al terminar de caminar, respira (el pecho sube y baja apenas) */
      var fin = (tt * c.fps) - (c.n - 1), resp = fin > 0 ? 1 + 0.008 * Math.sin(fin / c.fps * 2 * Math.PI / 3.2) * Math.min(1, fin / c.fps) : 1;
      var h = p.h * resp;
      ctx.drawImage(hoja, 0, j * c.h, c.w, c.h, p.x * k, (p.y + p.h - h) * k, p.w * k, h * k);
    }
  };
  Escena.prototype.bucle = function () {
    var self = this;
    function f(ahora) { if (!self.activa) return; self.dibujar(ahora); self.raf = requestAnimationFrame(f); }
    this.raf = requestAnimationFrame(f);
  };
  Escena.prototype.empezar = function () {
    var self = this;
    this.ajustar(); this.activa = true;
    cuandoListo(function () { if (!self.activa) return; self.t0 = performance.now(); cancelAnimationFrame(self.raf); self.bucle(); });
  };
  Escena.prototype.parar = function () {
    this.activa = false; cancelAnimationFrame(this.raf);
  };

  var escenas = [];
  Array.prototype.forEach.call(document.querySelectorAll("canvas.caminan"), function (c) {
    var e = new Escena(c); c._mov = e; escenas.push(e);
  });
  window.addEventListener("resize", function () { escenas.forEach(function (e) { e.ajustar(); }); });
  cargar();

  window.CAMINAN = {
    entrar: function (hoja) { var c = hoja.querySelector("canvas.caminan"); if (c && c._mov) c._mov.empezar(); },
    salir: function (hoja) { var c = hoja.querySelector("canvas.caminan"); if (c && c._mov) setTimeout(function () { c._mov.parar(); }, 650); }
  };
})();
