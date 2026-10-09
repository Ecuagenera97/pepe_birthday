/* Portada: nombre del invitado + apertura del sello. */
(function () {
  var U = window.UTIL, C = U.C;
  if (C.tituloPestana) document.title = C.tituloPestana;

  /* --- Nombre del invitado ---
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

  /* --- Abrir el sello y pasar a los detalles (conserva ?nombre=) --- */
  var libro = document.getElementById("libro");
  var destino = "details.html" + location.search;
  var yendo = false;
  function abrir() {
    if (yendo) { location.href = destino; return; }   // segundo toque: entra de inmediato
    yendo = true;
    libro.classList.add("abriendo");
    setTimeout(function () { location.href = destino; }, U.reducido() ? 40 : 650);
  }
  document.getElementById("sello").addEventListener("click", abrir);

  /* --- Precarga de lo que sigue, para que el cambio sea instantáneo --- */
  window.addEventListener("load", function () {
    ["img/03_portada.webp", "img/04_fecha_lugar.webp"].forEach(function (s) {
      var i = new Image(); i.decoding = "async"; i.src = s;
    });
  });
})();
