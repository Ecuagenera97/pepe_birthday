/* =====================================================================
   HOJAS "VIVAS": videos con movimiento sutil (animales, aves, plantas)
   Cada hoja puede tener un video en la carpeta video/ con el mismo
   encuadre que la imagen. Encima se deja la imagen nítida SOLO en las
   zonas de texto y botones (archivo img/pXX_fija.webp), así los textos
   nunca se deforman. Si el video no existe, la hoja se ve igual que antes.
   Para agregar uno: copia el .mp4 a video/ y añade una línea aquí.
   ===================================================================== */
window.VIVO = {
  /* pagina (data-pag): { video, fija (opcional) } */
  selva: { video: "video/p03_selva.mp4", fija: "img/p03_fija.webp" },
  confirmacion: { video: "video/p08_confirmacion.mp4", fija: "img/p08_fija.webp" },
};

(function () {
  var reducido = window.UTIL && window.UTIL.reducido();
  var hojas = {};

  function preparar() {
    Object.keys(window.VIVO).forEach(function (k) {
      var cfg = window.VIVO[k], hoja = document.querySelector('.pagina[data-pag="' + k + '"]');
      if (!hoja || !cfg.video || reducido) return;
      var v = document.createElement("video");
      v.className = "vivo"; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
      v.preload = "none"; v.src = cfg.video;
      v.addEventListener("playing", function () { v.classList.add("listo"); });
      var base = hoja.querySelector(".base");
      base.insertAdjacentElement("afterend", v);
      if (cfg.fija) {
        var f = document.createElement("img");
        f.className = "fija"; f.src = cfg.fija; f.alt = ""; f.decoding = "async";
        v.insertAdjacentElement("afterend", f);
      }
      hojas[k] = v;
    });
  }
  preparar();

  window.VIVO_CTRL = {
    entrar: function (hoja) {
      var v = hojas[hoja && hoja.getAttribute("data-pag")]; if (!v) return;
      if (v.preload === "none") { v.preload = "auto"; v.load(); }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    },
    salir: function (hoja) {
      var v = hojas[hoja && hoja.getAttribute("data-pag")]; if (!v) return;
      setTimeout(function () { v.pause(); }, 900);
    },
    precargar: function (hoja) {
      var v = hojas[hoja && hoja.getAttribute("data-pag")]; if (!v || v.preload !== "none") return;
      v.preload = "auto"; v.load();
    }
  };
})();
