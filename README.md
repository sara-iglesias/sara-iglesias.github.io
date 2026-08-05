# Sara Iglesias — Portfolio

Sitio personal recreado en HTML, CSS y JavaScript puro (sin Framer ni frameworks), listo para GitHub Pages con dominio propio. Bilingüe EN/ES.

## Estructura

```
index.html            Home (inglés)
es/index.html         Home (español)
works.html            Listado de trabajos        (pendiente)
about.html            Sobre mí                   (pendiente)
contact.html          Contacto                   (pendiente)
works/                Páginas de cada proyecto   (pendiente)
assets/css/style.css  Estilos
assets/js/main.js     Typewriter, pill "View", menú, reveals
assets/img|3d|docs    Assets (correr scripts/download-assets.sh)
```

## Elementos recreados

- Logo SVG original en la cabecera
- Typewriter del hero ("I design identities./solutions./systems.") en amarillo #EDED0C
- Grilla de trabajos con zoom sutil y pill "View" que sigue el cursor
- Modelo 3D interactivo con `<model-viewer>` (auto-rotación, misma cámara que el original)
- Tarjetas de servicios (#F5F5F7, radio 10px)
- Selector de idioma EN/ES y menú overlay
- Reveals de entrada y de scroll, `prefers-reduced-motion` respetado

## Desarrollo local

Servir con `python3 -m http.server 8000` y abrir http://localhost:8000

## Independizarse de Framer

Las imágenes, el .glb y los PDFs apuntan a framerusercontent.com por ahora:

```
bash scripts/download-assets.sh
```

y pedir a Claude que actualice las rutas del HTML a los archivos locales.

## Activar el formulario de contacto (2 minutos)

El formulario está conectado a **Web3Forms** (gratis, sin cuenta ni backend). Falta la clave:

1. Entrá a https://web3forms.com
2. Escribí tu email (saraiglesias6@gmail.com) y pedí el access key.
3. Te llega la clave por mail.
4. En `index.html` y `es/index.html`, buscá `TU_ACCESS_KEY_ACA` y reemplazalo por tu clave.

Listo: los mensajes llegan directo a tu casilla. Sin la clave, el formulario avisa que falta configurarla.

## El video grande de (+54)

El embed de YouTube devolvía "Error 153" (el video no permite reproducción
embebida fuera de YouTube), así que la página usa un archivo local:

1. Copiá tu video a `assets/video/54/main.mp4`
2. Listo, se reproduce solo.

Si preferís volver a YouTube, hay que habilitar la reproducción embebida
desde YouTube Studio → Editar video → Más opciones.

## GitHub Pages + dominio propio

1. Subir el repo → Settings → Pages → Deploy from branch (`main` / root).
2. Custom domain: agregar el dominio + archivo `CNAME` + registros DNS en tu proveedor.
