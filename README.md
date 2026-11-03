# Invitación · Pepe Portilla, 60 años

Sitio web estático publicado con GitHub Pages. Funciona como un libro de la selva:

1. **Tapa** de cuero que se abre de derecha a izquierda al tocar el sello.
2. **Logo** dorado que aparece con un destello, y el nombre del invitado.
3. **Selva** con los animales en movimiento (video).
4. **Cuenta regresiva** dentro del recuadro "Faltan".
5. a 11. **Hojas** que se pasan como un libro (deslizando, con las flechas o con los puntos).

Link por invitado: `index.html?nombre=Sr.+Juan+Pérez+y+Sra` (lo crea `generador.html`).

## Qué se edita y dónde

| Archivo / carpeta | Qué contiene | ¿Cuándo se edita? |
|---|---|---|
| **`config.js`** | Fecha y hora, link del mapa, teléfonos y mensajes de WhatsApp (código PP60), link de la fundación, música | Casi siempre aquí |
| `img/p01…p11_*.webp` | Las 11 pantallas del diseño en HD (1440×2560) | Solo si cambia el diseño |
| `img/p02_cuero.webp`, `p02_logo_capa.webp`, `p02_logo_brillo.png` | Pantalla del logo separada en fondo + logo + brillo | Si cambia el logo |
| `musica/con_te_partiro.mp3` | Música de fondo (Con te partirò, instrumental, 5 min). Empieza al tocar el sello; el botón de arriba a la derecha la pausa | Para cambiar la canción: reemplaza el archivo con el mismo nombre |
| `video/` | Videos con movimiento de cada pantalla (por ahora `p03_selva.mp4`) | Para agregar movimiento a otra pantalla |
| `js/vivo.js` | Lista de qué pantalla usa qué video | Al agregar un video nuevo |
| `index.html` | Las pantallas y la posición de los botones (`left/top/width/height` en %) | Solo para mover un botón |
| `css/`, `js/app.js` | Diseño y funcionamiento | No |

## Editar desde GitHub

Abre el archivo → lápiz ✏️ → cambia el texto entre comillas → **Commit changes**. En 1–2 minutos se actualiza el sitio (si no se ve el cambio, abre el link en una ventana privada).

## Agregar movimiento a otra pantalla

1. Copia el video vertical (9:16) a `video/`, por ejemplo `video/p08_confirmacion.mp4`.
2. En `js/vivo.js` añade una línea dentro de `window.VIVO`, por ejemplo:
   `confirmacion: { video: "video/p08_confirmacion.mp4" },`

`unaVez: true` en `js/vivo.js` hace que el video se reproduzca una sola vez y quede en el último cuadro (se usa para las flores que se abren).
