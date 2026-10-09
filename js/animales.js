/* =====================================================================
   ANIMALES ANIMADOS ("títeres")
   Cada animal es UNA sola imagen montada sobre una malla. La malla se
   deforma con "huesos" (cuello, ala, patas, cola) con pesos suaves, así
   la cabeza gira o el ala sube sin que se vea ningún corte. Se dibuja
   con WebGL en un lienzo que cubre la hoja.
   ===================================================================== */
(function () {
  var M = window.MALLAS || {};
  var reducido = window.UTIL && window.UTIL.reducido();
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- utilidades de movimiento ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(t) { t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { t = clamp(t, 0, 1); return t * t * t; }
  function back(t) { t = clamp(t, 0, 1); var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  /* ruido suave y determinista (para que las miradas no sean mecánicas) */
  function ruido(t, semilla) {
    return (Math.sin(t * 1.7 + semilla) * .5 + Math.sin(t * .83 + semilla * 2.1) * .3 + Math.sin(t * 2.9 + semilla * .7) * .2);
  }
  /* "mirada": cada cierto tiempo gira la cabeza, se queda, y vuelve */
  function mirada(t, periodo, amp, semilla) {
    var f = ((t + semilla * 3.3) % periodo) / periodo;       // 0..1 dentro del ciclo
    var k = ruido(Math.floor((t + semilla * 3.3) / periodo) * 7.1, semilla); // destino distinto cada ciclo
    var a = amp * (0.55 + 0.45 * k);
    if (f < .12) return a * ease(f / .12);
    if (f < .40) return a + amp * .08 * Math.sin(f * 40);
    if (f < .52) return a * (1 - ease((f - .40) / .12));
    if (f < .62) return -a * .35 * ease((f - .52) / .10);
    if (f < .80) return -a * .35;
    if (f < .90) return -a * .35 * (1 - ease((f - .80) / .10));
    return 0;
  }

  /* ---------- WebGL ---------- */
  var VS = "attribute vec2 p;attribute vec2 t;uniform vec2 esc;uniform vec2 des;varying vec2 v;" +
    "void main(){v=t;vec2 q=(p+des)*esc;gl_Position=vec4(q.x*2.0-1.0,1.0-q.y*2.0,0.0,1.0);}";
  var FS = "precision mediump float;uniform sampler2D img;uniform float op;varying vec2 v;" +
    "void main(){vec4 c=texture2D(img,v);gl_FragColor=vec4(c.rgb*c.a*op,c.a*op);}";

  function Escena(canvas, lista) {
    this.canvas = canvas; this.lista = lista; this.animales = []; this.activa = false; this.t0 = 0;
    this.gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: false }) ||
              canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: true });
    if (!this.gl) return;
    var gl = this.gl;
    function sh(tipo, src) { var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    gl.useProgram(prog); this.prog = prog;
    this.aP = gl.getAttribLocation(prog, "p"); this.aT = gl.getAttribLocation(prog, "t");
    this.uEsc = gl.getUniformLocation(prog, "esc"); this.uDes = gl.getUniformLocation(prog, "des"); this.uOp = gl.getUniformLocation(prog, "op");
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    var self = this;
    lista.forEach(function (d) { self.animales.push(new Animal(self, d)); });
    this.ajustar();
  }
  Escena.prototype.ajustar = function () {
    var r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, Math.round(r.width * DPR)); this.h = Math.max(1, Math.round(r.height * DPR));
    if (this.canvas.width !== this.w || this.canvas.height !== this.h) { this.canvas.width = this.w; this.canvas.height = this.h; }
    if (this.gl) this.gl.viewport(0, 0, this.w, this.h);
  };
  Escena.prototype.dibujar = function (ahora) {
    var gl = this.gl; if (!gl) return;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.uEsc, 1 / this.w, 1 / this.h);
    var t = (ahora - this.t0) / 1000;
    for (var i = 0; i < this.animales.length; i++) this.animales[i].dibujar(t);
  };

  /* ---------- un animal ---------- */
  function Animal(escena, d) {
    this.e = escena; this.d = d; this.m = M[d.malla]; this.listo = false; this.fase = "fuera"; this.tFase = 0;
    var gl = escena.gl, m = this.m;
    this.n = m.cols + 1; this.rows = m.rows + 1;
    this.base = new Float32Array(this.n * this.rows * 2);        // posiciones de reposo (0..1 del sprite)
    this.pos = new Float32Array(this.n * this.rows * 2);
    this.uv = new Float32Array(this.n * this.rows * 2);
    var k = 0;
    for (var r = 0; r < this.rows; r++) for (var c = 0; c < this.n; c++) {
      this.base[k] = this.uv[k] = c / m.cols; this.base[k + 1] = this.uv[k + 1] = r / m.rows; k += 2;
    }
    var idx = [];
    for (r = 0; r < m.rows; r++) for (c = 0; c < m.cols; c++) {
      var i = r * this.n + c; idx.push(i, i + 1, i + this.n, i + 1, i + this.n + 1, i + this.n);
    }
    this.idx = new Uint16Array(idx);
    this.bPos = gl.createBuffer(); this.bUv = gl.createBuffer(); this.bIdx = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bUv); gl.bufferData(gl.ARRAY_BUFFER, this.uv, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.idx, gl.STATIC_DRAW);
    this.tex = gl.createTexture();
    var img = new Image(), self = this;
    img.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, self.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);   // sin mipmaps: WebGL1 no los permite en tamaños no potencia de 2 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      self.listo = true;
    };
    img.src = "img/anim/" + d.malla + ".webp";
    this.huesos = {}; m.bones.forEach(function (b) { self.huesos[b.n] = b; });
    this.ang = {}; this.mov = {};
  }
  /* aplica huesos: p' = p + sum w_b * (R_b(p - piv) + piv + tras - p) */
  Animal.prototype.deformar = function () {
    var m = this.m, W = m.px[0], H = m.px[1], n = this.base.length / 2;
    for (var i = 0; i < this.base.length; i++) this.pos[i] = this.base[i];
    for (var bi = 0; bi < m.bones.length; bi++) {
      var b = m.bones[bi], a = this.ang[b.n] || 0, tr = this.mov[b.n] || [0, 0];
      if (!a && !tr[0] && !tr[1]) continue;
      var cs = Math.cos(a), sn = Math.sin(a), px = b.p[0], py = b.p[1];
      for (var v = 0; v < n; v++) {
        var w = b.w[v]; if (w < .002) continue;
        var x = this.base[v * 2], y = this.base[v * 2 + 1];
        /* rotar en píxeles para respetar la proporción del sprite */
        var dx = (x - px) * W, dy = (y - py) * H;
        var rx = (dx * cs - dy * sn) / W + px + tr[0], ry = (dx * sn + dy * cs) / H + py + tr[1];
        this.pos[v * 2] += w * (rx - x); this.pos[v * 2 + 1] += w * (ry - y);
      }
    }
  };
  Animal.prototype.dibujar = function (t) {
    if (!this.listo || this.fase === "fuera") return;
    var e = this.e, gl = e.gl, d = this.d, box = this.m.box;
    var st = d.mover(this, t - this.tFase, this.fase);    // {x,y (en % del alto/ancho de la caja), rot, esc, op, ang:{...}}
    if (!st) { this.fase = "fuera"; return; }
    this.ang = st.ang || {}; this.mov = st.mov || {};
    this.deformar();
    /* caja del animal en píxeles del lienzo */
    var bx = box.left / 100 * e.w, by = box.top / 100 * e.h, bw = box.width / 100 * e.w, bh = box.height / 100 * e.h;
    var cx = bw * (st.ox === undefined ? .5 : st.ox), cy = bh * (st.oy === undefined ? .5 : st.oy);
    var rot = st.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot), sx = (st.escx || st.esc || 1), sy = (st.escy || st.esc || 1);
    var out = this.out || (this.out = new Float32Array(this.pos.length));
    for (var i = 0; i < this.pos.length; i += 2) {
      var x = this.pos[i] * bw - cx, y = this.pos[i + 1] * bh - cy;
      x *= sx; y *= sy;
      out[i] = bx + cx + x * cs - y * sn + (st.x || 0) * bw;
      out[i + 1] = by + cy + x * sn + y * cs + (st.y || 0) * bh;
    }
    if (st.clip) { gl.enable(gl.SCISSOR_TEST); gl.scissor(Math.round(bx + st.clip[0] * bw), Math.round(e.h - (by + st.clip[3] * bh)), Math.round((st.clip[2] - st.clip[0]) * bw), Math.round((st.clip[3] - st.clip[1]) * bh)); }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bPos); gl.bufferData(gl.ARRAY_BUFFER, out, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(e.aP); gl.vertexAttribPointer(e.aP, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bUv); gl.enableVertexAttribArray(e.aT); gl.vertexAttribPointer(e.aT, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bIdx);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform2f(e.uDes, 0, 0); gl.uniform1f(e.uOp, st.op === undefined ? 1 : clamp(st.op, 0, 1));
    gl.drawElements(gl.TRIANGLES, this.idx.length, gl.UNSIGNED_SHORT, 0);
    if (st.clip) gl.disable(gl.SCISSOR_TEST);
  };

  /* =====================================================================
     MOVIMIENTOS. Cada función recibe (animal, t segundos en la fase, fase)
     y devuelve la pose. Fases: "entra" -> "reposo" -> "sale".
     Ángulos en radianes; x,y en fracción de la caja del animal.
     ===================================================================== */
  var G = Math.PI / 180;

  /* --- vuelo con aleteo: trayectoria desde (x0,y0) hasta (0,0) --- */
  function vuelo(a, t, fase, cfg) {
    var dur = cfg.dur, s = cfg.semilla;
    if (fase === "entra") {
      var u = clamp((t - cfg.retardo) / dur, 0, 1);
      if (t < cfg.retardo) return { op: 0 };
      var e1 = easeOut(u);
      /* arco: sube un poco y baja al posarse */
      var x = lerp(cfg.x0, 0, e1), y = lerp(cfg.y0, 0, e1) - Math.sin(u * Math.PI) * cfg.arco;
      var aleteo = u < .9 ? 1 : (1 - (u - .9) / .1);                  // deja de aletear al posarse
      var flap = Math.sin(t * cfg.hz * 2 * Math.PI);
      var ala = cfg.alaDir * (cfg.alaAmp * .6 + cfg.alaAmp * .4 * flap) * aleteo;
      var cuerpo = cfg.rot0 * (1 - e1) + 1.2 * G * flap * aleteo;
      var ang = { ala: ala, cabeza: cfg.cabDir * 10 * G * (1 - e1) };
      if (a.huesos.cola) ang.cola = -cfg.alaDir * 6 * G * flap * aleteo;
      var y2 = y + 0.012 * flap * aleteo;                              // el cuerpo sube y baja con cada aleteo
      if (u >= 1) { a.fase = "reposo"; a.tFase += t; return vuelo(a, 0, "reposo", cfg); }
      return { x: x, y: y2, rot: cuerpo, op: clamp(u * 6, 0, 1), ang: ang, oy: .4 };
    }
    if (fase === "reposo") {
      var ang2 = { cabeza: mirada(t, cfg.periodo, cfg.cabAmp * G, s) };
      /* de vez en cuando acomoda el ala */
      var f = ((t + s) % 9) / 9; var acomoda = f > .85 && f < .95 ? Math.sin((f - .85) / .1 * Math.PI) : 0;
      ang2.ala = cfg.alaDir * 10 * G * acomoda;
      if (a.huesos.cola) ang2.cola = 1.5 * G * Math.sin(t * 1.1 + s);
      var resp = 1 + 0.008 * Math.sin(t * 2.1 + s);
      return { escy: resp, escx: 1 + 0.004 * Math.sin(t * 2.1 + s), oy: 1, ang: ang2 };
    }
    /* sale volando */
    var u2 = clamp(t / .6, 0, 1), flap2 = Math.sin(t * cfg.hz * 2 * Math.PI);
    return { x: cfg.x0 * easeIn(u2) * .8, y: -1.2 * easeIn(u2), rot: cfg.rot0 * u2, op: 1 - u2 * u2,
             ang: { ala: cfg.alaDir * (cfg.alaAmp * .5 + cfg.alaAmp * .5 * flap2) } };
  }

  /* --- el oso asoma de entre las matas y mira al invitado --- */
  function oso(a, t, fase) {
    var clip = [-.2, -.6, 1.2, 1.0];                               // no se dibuja por debajo de su sitio (queda tras las matas)
    if (fase === "entra") {
      if (t < .5) return { y: .95, clip: clip };
      var u = clamp((t - .5) / 2.0, 0, 1);
      if (u >= 1) { a.fase = "reposo"; a.tFase += t; return oso(a, 0, "reposo"); }
      var y = .95 * (1 - back(u)) ;
      return { y: y, clip: clip, ang: { cabeza: -6 * G * Math.sin(u * Math.PI) }, oy: 1 };
    }
    if (fase === "reposo") {
      var resp = 1 + 0.012 * Math.sin(t * 1.6);
      /* mira al invitado: levanta la cabeza y la ladea */
      var cab = mirada(t, 7.5, -8 * G, 1.3);
      return { escy: resp, escx: 1 + 0.005 * Math.sin(t * 1.6), oy: 1, clip: clip, ang: { cabeza: cab }, mov: { cabeza: [0, -0.01 * Math.sin(t * 1.6)] } };
    }
    var u2 = easeIn(clamp(t / .55, 0, 1));
    return { y: .95 * u2, clip: clip, oy: 1 };
  }

  /* --- el jaguar llega caminando desde la derecha y se recuesta --- */
  function jaguar(a, t, fase) {
    if (fase === "entra") {
      var R = .7, D = 2.4;
      if (t < R) return { x: 1.3, op: 0 };
      var u = clamp((t - R) / D, 0, 1);
      if (u >= 1) { a.fase = "reposo"; a.tFase += t; return jaguar(a, 0, "reposo"); }
      var x = 1.3 * (1 - easeOut(u));
      var paso = (t - R) * 2.6 * Math.PI;                             // ritmo del paso
      var marcha = u < .8 ? 1 : (1 - (u - .8) / .2);                  // al final deja de caminar
      var bob = Math.abs(Math.sin(paso)) * 0.025 * marcha;
      var recuesta = u > .8 ? Math.sin((u - .8) / .2 * Math.PI) : 0; // pequeño "acomodo" al echarse
      return { x: x, y: -bob + 0.02 * recuesta, rot: -1.2 * G * Math.sin(paso) * marcha, oy: 1, escy: 1 + 0.03 * recuesta,
               ang: { pataa: 9 * G * Math.sin(paso) * marcha, patab: -9 * G * Math.sin(paso) * marcha, cabeza: -3 * G * Math.sin(paso * 2) * marcha - 4 * G * marcha } };
    }
    if (fase === "reposo") {
      var resp = 1 + 0.01 * Math.sin(t * 1.4 + 2);
      var cab = mirada(t, 9, -7 * G, 2.2);
      /* de vez en cuando mueve una pata */
      var f = ((t + 4) % 11) / 11, p = f > .8 && f < .9 ? Math.sin((f - .8) / .1 * Math.PI) : 0;
      return { escy: resp, oy: 1, ang: { cabeza: cab, pataa: 4 * G * p }, mov: { cabeza: [-0.01 * Math.abs(cab) / (7 * G), 0] } };
    }
    var u2 = easeIn(clamp(t / .6, 0, 1)), paso2 = t * 2.6 * Math.PI;
    return { x: 1.3 * u2, y: -Math.abs(Math.sin(paso2)) * .02, oy: 1, ang: { pataa: 9 * G * Math.sin(paso2), patab: -9 * G * Math.sin(paso2) } };
  }

  /* --- colibrí: llega zumbando, queda suspendido un instante y se posa --- */
  function colibri(a, t, fase) {
    var hz = 14, flap = Math.sin(t * hz * 2 * Math.PI);
    if (fase === "entra") {
      if (t < .2) return { op: 0 };
      var u = clamp((t - .2) / 2.3, 0, 1);
      if (u >= 1) { a.fase = "reposo"; a.tFase += t; return colibri(a, 0, "reposo"); }
      /* trayectoria: entra desde abajo a la izquierda, se detiene en el aire (suspendido) y baja a la rama */
      var e1 = easeOut(clamp(u / .55, 0, 1)), e2 = ease(clamp((u - .7) / .3, 0, 1));
      var x = lerp(-.9, -.18, e1) + lerp(0, .18, e2), y = lerp(.8, -.22, e1) + lerp(0, .22, e2);
      var susp = u > .5 && u < .72 ? 1 : 0;
      y += 0.015 * Math.sin(t * 9) * (1 - e2);
      var aleteo = 1 - e2;
      return { x: x, y: y, rot: -6 * G * (1 - e1) + 2 * G * Math.sin(t * 9) * aleteo, op: clamp(u * 8, 0, 1), oy: .5,
               ang: { ala: (-28 * G + 22 * G * flap) * aleteo, cabeza: 5 * G * (1 - e1) } };
    }
    if (fase === "reposo") {
      var cab = mirada(t, 5.5, 6 * G, 3.1);
      var f = ((t + 2) % 7) / 7, z = f > .82 && f < .92 ? 1 : 0;        // zumbido corto de vez en cuando
      return { escy: 1 + 0.01 * Math.sin(t * 2.4), oy: 1, y: -0.006 * Math.sin(t * 2.4), ang: { cabeza: cab, ala: (-12 * G + 10 * G * flap) * z } };
    }
    var u2 = easeIn(clamp(t / .6, 0, 1));
    return { x: -0.8 * u2, y: -0.9 * u2, op: 1 - u2 * u2, ang: { ala: -28 * G + 22 * G * flap } };
  }

  /* ---------- definiciones por hoja ---------- */
  var DEF = {
    selva: [
      { malla: "guac1", mover: function (a, t, f) { return vuelo(a, t, f, { retardo: .15, dur: 1.9, x0: -.9, y0: -.7, arco: .12, hz: 5.2, alaAmp: 38 * G, alaDir: -1, rot0: -12 * G, cabDir: 1, periodo: 6.5, cabAmp: 9, semilla: 0.4 }); } },
      { malla: "guac2", mover: function (a, t, f) { return vuelo(a, t, f, { retardo: .55, dur: 1.9, x0: -.9, y0: -.9, arco: .12, hz: 5.0, alaAmp: 38 * G, alaDir: -1, rot0: -12 * G, cabDir: 1, periodo: 7.5, cabAmp: 9, semilla: 1.9 }); } },
      { malla: "tucan", mover: function (a, t, f) { return vuelo(a, t, f, { retardo: .9, dur: 1.7, x0: .9, y0: -1.2, arco: .15, hz: 4.6, alaAmp: 30 * G, alaDir: 1, rot0: 10 * G, cabDir: -1, periodo: 7, cabAmp: 8, semilla: 2.7 }); } },
      { malla: "oso", mover: oso },
      { malla: "jaguar", mover: jaguar }
    ],
    aves: [
      { malla: "colibri", mover: colibri },
      { malla: "tucan7", mover: function (a, t, f) { return vuelo(a, t, f, { retardo: .7, dur: 1.8, x0: .9, y0: -1.3, arco: .18, hz: 4.4, alaAmp: 0, alaDir: 1, rot0: 10 * G, cabDir: -1, periodo: 7.5, cabAmp: 7, semilla: 4.2 }); } }
    ]
  };

  /* ---------- gestión: una escena por lienzo ---------- */
  var escenas = [], corriendo = false;
  function bucle(ahora) {
    var alguna = false;
    escenas.forEach(function (e) { if (e.activa) { alguna = true; e.dibujar(ahora); } });
    corriendo = alguna; if (alguna) requestAnimationFrame(bucle);
  }
  function arrancar() { if (!corriendo) { corriendo = true; requestAnimationFrame(bucle); } }

  function preparar() {
    Array.prototype.forEach.call(document.querySelectorAll("canvas.selva"), function (c) {
      var def = DEF[c.getAttribute("data-escena")]; if (!def) return;
      var e = new Escena(c, def); c._escena = e;
      if (!e.gl) { c.classList.add("sin-webgl"); dibujarEstatico(c, def); }
      escenas.push(e);
    });
    window.addEventListener("resize", function () { escenas.forEach(function (e) { e.ajustar(); }); });
  }
  /* sin WebGL (muy raro): se muestran los animales quietos con imágenes normales */
  function dibujarEstatico(c, def) {
    def.forEach(function (d) {
      var m = M[d.malla], im = document.createElement("img"); im.src = "img/anim/" + d.malla + ".webp"; im.alt = "";
      im.style.cssText = "position:absolute;left:" + m.box.left + "%;top:" + m.box.top + "%;width:" + m.box.width + "%;height:" + m.box.height + "%;pointer-events:none";
      c.parentNode.insertBefore(im, c);
    });
  }

  /* API usada por index.js */
  window.ANIMALES = {
    entrar: function (hoja) {
      var c = hoja.querySelector("canvas.selva"); if (!c || !c._escena || !c._escena.gl) return;
      var e = c._escena; e.ajustar(); e.activa = true; e.t0 = performance.now();
      e.animales.forEach(function (a) { a.fase = reducido ? "reposo" : "entra"; a.tFase = 0; });
      arrancar();
    },
    salir: function (hoja) {
      var c = hoja.querySelector("canvas.selva"); if (!c || !c._escena || !c._escena.gl) return;
      var e = c._escena, t = (performance.now() - e.t0) / 1000;
      e.animales.forEach(function (a) { if (a.fase !== "fuera") { a.fase = "sale"; a.tFase = t; } });
      setTimeout(function () { e.activa = false; e.animales.forEach(function (a) { a.fase = "fuera"; }); }, 700);
    },
    apagar: function (hoja) {
      var c = hoja.querySelector("canvas.selva"); if (!c || !c._escena) return;
      c._escena.activa = false; c._escena.animales.forEach(function (a) { a.fase = "fuera"; });
    }
  };
  preparar();   // los lienzos ya existen: este script va al final de la página
})();
