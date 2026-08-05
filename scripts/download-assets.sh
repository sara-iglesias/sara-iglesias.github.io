#!/bin/bash
# ============================================================
# Descarga los assets del sitio actual en Framer y los guarda
# localmente para que el sitio sea 100% independiente.
# Correr desde la raíz del proyecto:  bash scripts/download-assets.sh
# ============================================================
set -e
mkdir -p assets/img assets/docs assets/3d

# Thumbnails de proyectos (home)
curl -L -o assets/img/work-54.jpg      "https://framerusercontent.com/images/Vf9PunfYOCjhPooeXJTyuXSfieA.jpg"
curl -L -o assets/img/work-churba.png  "https://framerusercontent.com/images/eY4LY37EdcB2z1JdPeJqIEVQcTU.png"
curl -L -o assets/img/work-cero.png    "https://framerusercontent.com/images/MOZyp31Uoop8peq6VnGWcWrOClw.png"
curl -L -o assets/img/work-forja.jpg   "https://framerusercontent.com/images/9kbESLGNbMliWoL4KhLMQIWA1M.jpg"
curl -L -o assets/img/work-nucleo.png  "https://framerusercontent.com/images/zgIqb4Jg9HsqwlU9TlkvPMhrs4.png"

# Modelo 3D (model-viewer)
curl -L -o assets/3d/model.glb         "https://framerusercontent.com/assets/hO8yQbpUSpw1TQ5v68keBMgbg.glb"

# Currículum (EN y ES)
curl -L -o assets/docs/resume.pdf      "https://framerusercontent.com/assets/9lAX9rhnTbJPKL17W3Dc5QlGYE.pdf"
curl -L -o assets/docs/resume-es.pdf   "https://framerusercontent.com/assets/m7YPfiWsqWxkBpSpSu2Xl5WE90.pdf"

echo ""
echo "Listo. Assets en assets/img, assets/3d y assets/docs."
echo "Avisale a Claude para actualizar las rutas del HTML a los archivos locales."

# ---- Assets de la página de proyecto (+54) ----
mkdir -p assets/img/54 assets/video/54

for f in JpUCU4AvkNqlDc8TPaeYsccXa8s.png \
         FN3FZjg6CHwBySV4F5vEPRiX5c.jpg My8Hoawdr4pTWddAt7fcFmisZas.jpg \
         nZzo85cJpLYlj8Fu8YHyqPcespk.png 9THzqp5BXZAsXnSZ9SwJLpPf9ck.png \
         MFfrPMnMr5w7OxcKvVJbkNrCU0.png NWDOMzH5jF4qoxydpJymvwpHN4.png \
         ngRrDjfrdnU40YaA4NZX601SdQ.png sLoIaQNM5JrDWtaoeJXYP0fJ7E.png \
         tqBnlPFjg4wdzwOT9X25izqk8.png \
         fx5pMZGK8ZyZNleNyDRbwdymNM.png HD9d2PGCVGfDnVnXvwsFN8KEBiU.png \
         S9AZy1YQdHoNlzQhzsIT4qcbTPw.png k3lsnDDwZhbwViOrzOeuVCoXQp4.png \
         iF1tdRKhTke2tnoDDNYXNjdvfw.png b1g06Pz1BhOx6fyLkY2L2JThhI.jpg jTv9z5LwPA26rfyK85ee4sPVYQ.jpg \
         EiGD4TdURM43f67wZNKRHab9iQ4.gif \
         kzVbLj9UAm3IOYApp2721Wjw5UM.jpg gllnsp8VPoerbK3bYnaIGirgwko.jpg \
         xPGcXC4JfHbcgh1KRVQTTkqTYE.jpg HtcRqG7Sgb8S6B325lsPTppCkdM.jpg \
         bR25mljM94PiNd78PetyBXDnYU.jpg DRuaHxwgxHF7jxMQNvudRms6bg.jpg \
         74kkrUstnawiIxltRlALHavrwE.jpg LJI0CnFZXtts8BmlPEEcaQhB8yY.jpg \
         9n4cNiNALmTR5TF7Y8vvolx6xw.jpg; do
  curl -sL -o "assets/img/54/$f" "https://framerusercontent.com/images/$f"
done

# Stickers del "click anywhere"
for f in jsSeSHw9MzvA3l90QP75qyQKXAc.png Lxq4NUdOKDUC72DG75chHyviRI.png \
         vUAhHG3nDC7p8ZRVo9hyJcTJ3Y.png oUgalHTUBqr5978PU1Amhslsg.png \
         zF7V5jXPZLXHnKPX4EfzEn8cPm0.png F21n5QepNjdYAl3Iw15FtJyC7Z8.png \
         fSGMoJ2FJQnyZXw5D1nYhVlVNo.png hKTpZXdRxoVjfFfeTI2UeRLm7g.png \
         LxY8QcmlR5QOGXcHtR1oAymDBOo.png tdsZT6NGaTsl205ZQAdSiROH9ws.png \
         LyOkCoHHMug0FYNlS3IOb8AoQuc.png fYUuXdwc6M34rhpjpNp63lUKC3Y.png \
         cmwMhgPHJGCwREsj3rAIUBzjA.png SpvteAKTXm4NgQAxH6v6Md0nWUE.png \
         9r5k46T9wgUGh77RlPJlyotrENo.png fta9o3lq2J4mB63VgTtNch7Ero.png \
         WbV33KSsxq9LvP9ExZC4X667U.png bHs9mRH5w1vEZ1dpHTGLI8o.png \
         M1HKoqLstbjXMLvEAW9SmYx3U.png; do
  curl -sL -o "assets/img/54/$f" "https://framerusercontent.com/images/$f"
done

# Videos
for f in I3ExbmR84nrkW7LnwKZqPRwNBY.mp4 jIg4FV8WpsFKjj7AwgyO3NZ8.mp4 \
         XZXG4FZmhzGQ6nMu3iw0CeKrzg.mp4 2uqZ435OvUOgMF4JQGNjN0L1aqQ.mp4 \
         l7RArU9MUTrVjyDdCo21ejMDVFw.mp4 SruTtfCA5TZySVZ7uogjJczu3E.mp4 \
         YWTHRoa688izAoN8g6YZcL5ug.mp4 lVYqGENVGX4OMfmnrasFU3moCs.mp4; do
  curl -sL -o "assets/video/54/$f" "https://framerusercontent.com/assets/$f"
done

echo "Assets de (+54) descargados."
