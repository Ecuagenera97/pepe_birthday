# Invitación · Pepe Portilla, 60 años

Sitio web estático (sin servidor, sin Claude): se publica con GitHub Pages.

- `index.html?nombre=Sr.+Juan+Pérez+y+Sra` → portada del libro con el sello "PP". Al tocarlo, un video abre el libro y deja ver la primera hoja. Las hojas se pasan **una por una** como en una libreta: deslizando el dedo, tocando el borde derecho de la hoja (o el izquierdo para volver), con la flecha pequeña de abajo o con los puntos: portada, cuenta regresiva, fecha y lugar, agenda, vestimenta, confirmación, hospedaje y obsequio.
- `details.html` → solo redirige a `index.html` (por si algún link viejo lo usa).
- `generador.html` → crea el link de cada invitado y lo envía por WhatsApp.

## Estructura del proyecto

| Archivo / carpeta | Qué contiene | ¿Cuándo se edita? |
|---|---|---|
| **`config.js`** | Fecha y hora del evento, link del mapa, teléfonos y mensajes de WhatsApp, link de la fundación, música | Casi siempre aquí |
| `video/apertura.mp4` | Video corto que abre el libro al tocar el sello | Solo si cambia el diseño de la portada |
| `img/00_portada.webp` | Primer cuadro del video (la portada cerrada). Debe verse igual que el inicio del video | Junto con el video |
| `img/03_…09_*.webp` | Las 7 páginas de la invitación en HD (1440×2560, del PDF del diseñador) | Solo si cambia el diseño (fechas, horas, agenda…) |
| `img/anim/`, `js/mallas.js`, `js/animales.js` | Los animales (extraídos del PDF del diseñador) y su animación: cada uno es una figura montada en una malla con "huesos" (cuello, alas, patas) que se dobla suavemente. Las páginas `03_portada` y `07_confirmacion` llevan el fondo sin los animales | No. Si cambia el diseño de esas páginas, avisar: hay que volver a separar las figuras |
| `img/m*.png`, `img/p05_estrella.png` | Máscaras para los botones agrandados y la estrella de la agenda | No. Si se cambia una página, avisar: dependen de la posición de cada elemento |
| `img/01_…, 02_…` | Imágenes de la portada anterior (ya no se usan) | Se pueden borrar |
| `img/compartir.jpg` | Imagen que sale al compartir el link en WhatsApp (1200×630) | Si cambia el diseño |
| `index.html` | Portada + todas las páginas y la posición de los botones (`style="left:…;top:…"`). Líneas "og:" = vista previa de WhatsApp | Solo para mover un botón o cambiar el título/dirección |
| `css/styles.css`, `js/*.js` | Diseño y funcionamiento | No |
| `musica/` | Aquí va un .mp3 si quieren música | Opcional |
| `.nojekyll` | Necesario para GitHub Pages | No tocar |

## Cómo editar un dato desde GitHub (sin instalar nada)

1. Abre el repositorio → clic en el archivo (por ejemplo `config.js`).
2. Clic en el lápiz ✏️ (**Edit this file**).
3. Cambia el texto entre comillas → botón verde **Commit changes** → **Commit changes**.
4. En 1–2 minutos el sitio se actualiza (refresca con Ctrl/Cmd + Shift + R).

### Qué se cambia dónde

- **Teléfono o mensaje de confirmación / hospedaje:** `config.js` → `confirmacion` y `hospedaje`. `{nombre}` es el nombre del invitado.
- **Código de descuento del hotel:** `config.js` → `hospedaje.mensaje` (agregar por ejemplo "…usar el código XXXX…").
- **Link de ubicación:** `config.js` → `mapa`.
- **Link de la fundación:** `config.js` → `obsequio`.
- **Fecha/hora del contador y del calendario:** `config.js` → `evento.inicio` (formato `2027-01-09T16:00:00-05:00`).
- **Textos dentro de las páginas** (agenda, "Hasta el 27 de Diciembre", etc.): están dibujados en las imágenes. Hay que exportar la página nueva desde el diseño como WebP/JPG de 1440×2560, con el mismo nombre, y subirla a `img/` (en GitHub: **Add file → Upload files**, mismo nombre = reemplaza).

## Cambiar la vista previa de WhatsApp

WhatsApp guarda la vista previa de cada link. Si se cambia `img/compartir.jpg` o el título, los links ya enviados pueden tardar en actualizarse; los nuevos se ven bien.
