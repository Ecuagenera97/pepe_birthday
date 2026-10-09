# Invitación · Pepe Portilla, 60 años

Sitio web estático (sin servidor, sin Claude): se publica con GitHub Pages.

- `index.html?nombre=Sr.+Juan+Pérez+y+Sra` → portada con sello. Al tocarlo pasa a `details.html` conservando el nombre.
- `details.html` → cuenta regresiva, fecha y lugar, agenda, vestimenta, confirmación, hospedaje y obsequio.
- `generador.html` → crea el link de cada invitado y lo envía por WhatsApp.

## Estructura del proyecto

| Archivo / carpeta | Qué contiene | ¿Cuándo se edita? |
|---|---|---|
| **`config.js`** | Fecha y hora del evento, link del mapa, teléfonos y mensajes de WhatsApp, link de la fundación, música | Casi siempre aquí |
| `img/01_…09_*.webp` | Las 9 páginas de la invitación (arte del diseñador) | Solo si cambia el diseño (fechas, horas, agenda…) |
| `img/compartir.jpg` | Imagen que sale al compartir el link en WhatsApp (1200×630) | Si cambia el diseño |
| `index.html` | Portada. Líneas "og:" = vista previa de WhatsApp | Solo si cambia el título o la dirección del sitio |
| `details.html` | Páginas y posición de los botones (`style="left:…;top:…"`) | Solo para mover un botón |
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
- **Textos dentro de las páginas** (agenda, "Hasta el 27 de Diciembre", etc.): están dibujados en las imágenes. Hay que exportar la página nueva desde el diseño como WebP/JPG de 1080×1920, con el mismo nombre, y subirla a `img/` (en GitHub: **Add file → Upload files**, mismo nombre = reemplaza).

## Cambiar la vista previa de WhatsApp

WhatsApp guarda la vista previa de cada link. Si se cambia `img/compartir.jpg` o el título, los links ya enviados pueden tardar en actualizarse; los nuevos se ven bien.
