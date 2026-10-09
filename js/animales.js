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
     MOVIMIENTOS. Los animales se quedan en su sitio del diseño y se mueven
     como lo haría un animal posado o echado: miran, respiran, acomodan un
     ala. Al abrir la hoja hacen un "saludo" (giran a mirar al invitado).
     Cada función recibe (animal, t segundos, fase) y devuelve la pose.
     ===================================================================== */
  var G = Math.PI / 180;

  /* saludo inicial: gira la cabeza hacia el invitado, se queda y vuelve */
  function saludo(t, retardo, dur, amp) {
    var u = clamp((t - retardo) / dur, 0, 1);
    if (u <= 0) return 0;
    if (u < .3) return amp * ease(u / .3);
    if (u < .7) return amp;
    return amp * (1 - ease((u - .7) / .3));
  }
  function parpadeo(t, periodo, s) {            /* 0..1 breve, para "acomodos" ocasionales */
    var f = ((t + s) % periodo) / periodo, k = .06;
    return f > 1 - k ? Math.sin((f - (1 - k)) / k * Math.PI) : 0;
  }

  /* --- guacamayo posado --- */
  function guacamayo(cfg) {
    return function (a, t, fase) {
      var s = cfg.semilla, cab, ala = 0, cola, resp;
      if (fase === "entra") {
        if (t > cfg.retardo + 2.6) { a.fase = "reposo"; a.tFase += t; return a.d.mover(a, 0, "reposo"); }
        cab = saludo(t, cfg.retardo, 2.4, -9 * G);                  /* gira a mirar hacia el centro */
        ala = -14 * G * Math.sin(clamp((t - cfg.retardo - .3) / .9, 0, 1) * Math.PI); /* estira el ala una vez */
      } else {
        cab = mirada(t, 7 + s, 8 * G, s) + 1.2 * G * ruido(t * .6, s);
        ala = -12 * G * parpadeo(t, 11 + s, s * 2);
      }
      cola = 1.6 * G * Math.sin(t * .9 + s) + 0.6 * G * ruido(t * .4, s + 1);
      resp = 1 + 0.006 * Math.sin(t * 2.0 + s);
      return { escy: resp, escx: 1 + 0.003 * Math.sin(t * 2.0 + s), oy: .45, ang: { cabeza: cab, ala: ala, cola: cola } };
    };
  }
  /* --- tucán posado (ambos) --- */
  function tucanPosado(cfg) {
    return function (a, t, fase) {
      var s = cfg.semilla, cab, ala = 0;
      if (fase === "entra") {
        if (t > cfg.retardo + 2.6) { a.fase = "reposo"; a.tFase += t; return a.d.mover(a, 0, "reposo"); }
        cab = saludo(t, cfg.retardo, 2.4, cfg.dir * 8 * G);
      } else {
        cab = mirada(t, 7.5 + s, cfg.dir * 7 * G, s) + 1.0 * G * ruido(t * .6, s);
        if (a.huesos.ala) ala = cfg.dir * 9 * G * parpadeo(t, 13 + s, s);
      }
      /* pequeño balanceo del cuerpo, como un ave que acomoda el peso */
      var bal = 0.4 * G * Math.sin(t * .7 + s);
      return { rot: bal, oy: .95, escy: 1 + 0.005 * Math.sin(t * 1.9 + s), ang: { cabeza: cab, ala: ala } };
    };
  }
  /* --- oso asomado entre las matas --- */
  function oso(a, t, fase) {
    var cab, lev = 0;
    if (fase === "entra") {
      if (t > 3.4) { a.fase = "reposo"; a.tFase += t; return oso(a, 0, "reposo"); }
      var u = clamp((t - .4) / 1.6, 0, 1);
      cab = -9 * G * ease(u) * (t < 2.4 ? 1 : 1 - ease((t - 2.4) / 1.0));       /* levanta la cabeza hacia el invitado */
      lev = -0.012 * Math.sin(u * Math.PI);
    } else {
      cab = mirada(t, 8.5, -8 * G, 1.3) + 1.0 * G * ruido(t * .5, 1.3);
      lev = -0.006 * Math.max(0, -cab) / (8 * G);
    }
    var resp = 1 + 0.012 * Math.sin(t * 1.5);
    return { escy: resp, escx: 1 + 0.004 * Math.sin(t * 1.5), oy: 1, ang: { cabeza: cab }, mov: { cabeza: [0, lev] } };
  }
  /* --- jaguar echado --- */
  function jaguar(a, t, fase) {
    var cab, pata = 0;
    if (fase === "entra") {
      if (t > 3.6) { a.fase = "reposo"; a.tFase += t; return jaguar(a, 0, "reposo"); }
      cab = saludo(t, .6, 2.6, -8 * G);                                           /* gira a mirar al centro */
    } else {
      cab = mirada(t, 9.5, -7 * G, 2.2) + 0.8 * G * ruido(t * .5, 2.2);
      pata = 3 * G * parpadeo(t, 12, 4);                                           /* acomoda la pata de vez en cuando */
    }
    var resp = 1 + 0.009 * Math.sin(t * 1.3 + 2);
    return { escy: resp, oy: 1, ang: { cabeza: cab, pataa: pata }, mov: { cabeza: [-0.006 * Math.max(0, -cab) / (7 * G), 0] } };
  }
  /* --- colibrí posado: mira, y de vez en cuando vibra las alas un instante --- */
  function colibri(a, t, fase) {
    var cab, z = 0;
    if (fase === "entra") {
      if (t > 3.2) { a.fase = "reposo"; a.tFase += t; return colibri(a, 0, "reposo"); }
      cab = saludo(t, .3, 2.4, 6 * G);
      z = t > .9 && t < 1.5 ? 1 : 0;
    } else {
      cab = mirada(t, 5.5, 6 * G, 3.1) + 1.2 * G * ruido(t * .9, 3.1);
      var f = ((t + 2) % 8) / 8; z = f > .84 && f < .92 ? 1 : 0;
    }
    var flap = Math.sin(t * 16 * 2 * Math.PI);
    return { escy: 1 + 0.008 * Math.sin(t * 2.6), oy: 1, ang: { cabeza: cab, ala: (-10 * G + 9 * G * flap) * z } };
  }

  var DEF = {
    selva: [
      { malla: "guac1", mover: guacamayo({ retardo: .2, semilla: 0.4 }) },
      { malla: "guac2", mover: guacamayo({ retardo: .7, semilla: 1.9 }) },
      { malla: "tucan", mover: tucanPosado({ retardo: .5, semilla: 2.7, dir: 1 }) },
      { malla: "oso", mover: oso },
      { malla: "jaguar", mover: jaguar }
    ],
    aves: [
      { malla: "colibri", mover: colibri },
      { malla: "tucan7", mover: tucanPosado({ retardo: .6, semilla: 4.2, dir: 1 }) }
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
      var e = c._escena;
      setTimeout(function () { e.activa = false; e.animales.forEach(function (a) { a.fase = "fuera"; }); }, 700);
    },
    apagar: function (hoja) {
      var c = hoja.querySelector("canvas.selva"); if (!c || !c._escena) return;
      c._escena.activa = false; c._escena.animales.forEach(function (a) { a.fase = "fuera"; });
    }
  };
  preparar();   // los lienzos ya existen: este script va al final de la página
})();
