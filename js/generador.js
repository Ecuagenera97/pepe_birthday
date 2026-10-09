/* Generador de links personalizados (index.html?nombre=...) */
(function () {
  var C = window.UTIL.C;
  var $ = function (id) { return document.getElementById(id); };
  var festejado = C.festejado || "";

  var base = $("base");
  var esLocal = location.protocol === "file:" || /^(localhost|127\.)/.test(location.hostname);
  var guardada = "";
  try { guardada = localStorage.getItem("inv-base") || ""; } catch (e) {}
  base.value = guardada || (esLocal ? "" : location.href.replace(/[?#].*$/, "").replace(/[^/]*$/, ""));
  if (esLocal && !guardada) $("aviso-local").hidden = false;
  base.addEventListener("change", function () {
    try { localStorage.setItem("inv-base", base.value.trim()); } catch (e) {}
    actualizar();
  });

  $("mensaje").value = "Hola {nombre} ✨\nCon mucho cariño te compartimos la invitación al cumpleaños de " + festejado + ". Ábrela aquí:\n{link}";

  function limpiarBase() {
    var b = base.value.trim() || "https://ecuagenera97.github.io/pepe_birthday/";
    b = b.replace(/[?#].*$/, "").replace(/(index|details|generador)\.html$/, "");
    return b.endsWith("/") ? b : b + "/";
  }
  function link(nombre) {
    var n = String(nombre || "").trim();
    return limpiarBase() + (n ? "index.html?nombre=" + encodeURIComponent(n).replace(/%20/g, "+") : "");
  }
  function mensaje(nombre, l) {
    return $("mensaje").value.replace(/\{nombre\}/g, String(nombre || "").trim()).replace(/\{link\}/g, l);
  }
  function wa(tel, texto) {
    return "https://wa.me/" + String(tel || "").replace(/\D/g, "") + "?text=" + encodeURIComponent(texto);
  }
  function aviso(t) {
    var el = $("toast"); el.textContent = t; el.classList.add("ver");
    clearTimeout(aviso.t); aviso.t = setTimeout(function () { el.classList.remove("ver"); }, 1800);
  }
  function copiar(t) {
    var fin = function () { aviso("Copiado ✓"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(fin, function () { viejo(t); fin(); });
    } else { viejo(t); fin(); }
  }
  function viejo(t) {
    var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta);
    ta.select(); document.execCommand("copy"); ta.remove();
  }

  /* --- Un invitado --- */
  function actualizar() {
    var n = $("nombre").value, l = link(n), tel = $("telefono").value;
    $("res-uno").textContent = l;
    $("abrir-uno").href = l;
    $("wa-uno").href = wa(tel, mensaje(n, l));
    $("wa-uno").textContent = tel.replace(/\D/g, "") ? "Enviar por WhatsApp" : "Elegir contacto en WhatsApp";
  }
  ["nombre", "telefono", "mensaje"].forEach(function (id) { $(id).addEventListener("input", actualizar); });
  $("copiar-uno").addEventListener("click", function () { copiar($("res-uno").textContent); });
  actualizar();

  /* --- Lista --- */
  var filas = [];
  function generar() {
    filas = $("lista").value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
      var m = s.match(/^(.*?)[,;\t]\s*([+\d][\d\s()+-]{6,})\s*$/);
      var nombre = (m ? m[1] : s).trim(), tel = m ? m[2] : "";
      return { nombre: nombre, tel: tel, link: link(nombre) };
    });
    var tb = document.querySelector("#tabla tbody"); tb.innerHTML = "";
    filas.forEach(function (f) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td"); td1.textContent = f.nombre;
      var td2 = document.createElement("td"); td2.className = "link"; td2.textContent = f.link;
      var td3 = document.createElement("td"); td3.className = "acc";
      var b = document.createElement("button"); b.className = "btn sec"; b.type = "button"; b.textContent = "Copiar";
      b.onclick = function () { copiar(f.link); };
      var a = document.createElement("a"); a.className = "btn"; a.target = "_blank"; a.rel = "noopener";
      a.href = wa(f.tel, mensaje(f.nombre, f.link)); a.textContent = "WhatsApp";
      td3.appendChild(b); td3.appendChild(document.createTextNode(" ")); td3.appendChild(a);
      tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tb.appendChild(tr);
    });
    $("tabla").hidden = !filas.length;
    if (filas.length) aviso(filas.length + " links generados");
  }
  $("generar").addEventListener("click", generar);
  $("copiar-todos").addEventListener("click", function () {
    if (!filas.length) generar();
    copiar(filas.map(function (f) { return f.nombre + ": " + f.link; }).join("\n"));
  });
  $("csv").addEventListener("click", function () {
    if (!filas.length) generar();
    if (!filas.length) return;
    var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
    var csv = "﻿" + ["Invitado;Telefono;Link;Mensaje WhatsApp"].concat(
      filas.map(function (f) { return [f.nombre, f.tel, f.link, wa(f.tel, mensaje(f.nombre, f.link))].map(q).join(";"); })
    ).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "links-invitados.csv"; document.body.appendChild(a); a.click(); a.remove();
  });
})();
