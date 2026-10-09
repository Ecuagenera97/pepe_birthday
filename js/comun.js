/* Utilidades compartidas. No es necesario editar. */
(function () {
  var C = window.INVITACION || {};

  /* Nombre del invitado desde el link: ?nombre=Sr.+Juan+Pérez+y+Sra */
  function nombre() {
    try {
      var p = new URLSearchParams(location.search);
      return (p.get("nombre") || p.get("n") || "").replace(/\s+/g, " ").trim().slice(0, 120);
    } catch (e) { return ""; }
  }

  function whatsapp(numero, mensaje) {
    return "https://wa.me/" + String(numero || "").replace(/\D/g, "") +
      "?text=" + encodeURIComponent(mensaje || "");
  }

  function reducido() {
    return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  window.UTIL = { C: C, nombre: nombre, whatsapp: whatsapp, reducido: reducido };
})();
