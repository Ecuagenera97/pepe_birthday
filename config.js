/* =====================================================================
   DATOS DE LA INVITACIÓN  ·  Pepe Portilla, 60 años
   ---------------------------------------------------------------------
   Aquí se cambia todo lo "editable": fecha, enlaces, teléfonos y mensajes.
   - Teléfonos de WhatsApp: con código de país, sin "+" ni espacios.
   - En los mensajes, {nombre} se reemplaza por el nombre del invitado
     que viene en el link (?nombre=...).
   - Si cambias el texto que aparece DENTRO de las imágenes (fechas, horas,
     agenda), hay que reemplazar la imagen de la carpeta img/.
   ===================================================================== */

window.INVITACION = {

  festejado: "Pepe Portilla",
  tituloPestana: "Pepe Portilla · 60 años – ¡Te esperamos!",

  /* Fecha y hora EXACTAS (zona horaria de Ecuador, -05:00).
     Formato: AAAA-MM-DDTHH:MM:SS-05:00  ->  9 de enero de 2027, 4:00 pm */
  evento: {
    inicio: "2027-01-09T16:00:00-05:00",
    duracionHoras: 6,
    titulo: "Cumpleaños 60 de Pepe Portilla",
    lugar: "Uzhupud Garden, Paute - Ecuador"
  },

  /* Botón "Ubicación" (página de fecha y lugar) */
  mapa: "https://maps.app.goo.gl/GHNQRRa73KQDbo7X6",

  /* Botón "Asistencia" (confirmación) */
  confirmacion: {
    whatsapp: "17602141952",
    mensaje: "Hola, muchas gracias por la invitación ✨ confirmo la asistencia de {nombre}",
    sinNombre: "(Nombres)"            // si el link no trae ?nombre=
  },

  /* Botón "Reserva" (hospedaje con tarifa especial) */
  hospedaje: {
    whatsapp: "593997034680",
    mensaje: "Hola, soy invitado de Pepe Portilla y deseo usar el código PP60 para mi reserva. ¿Podrían confirmar disponibilidad?"
  },

  /* Botón de la fundación (obsequio) */
  obsequio: "https://sites.google.com/view/santamariadelaesperanza/inicio?authuser=1",

  /* Texto de la portada cuando el link no trae nombre */
  sinNombre: "Te esperamos",

  /* Música de fondo (opcional): copia un .mp3 a la carpeta "musica" y escribe
     por ejemplo "musica/cancion.mp3". Déjalo vacío "" para no usar música. */
  musica: ""
};
