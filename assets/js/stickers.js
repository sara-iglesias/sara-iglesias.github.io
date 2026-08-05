/* ============================================================
   "CLICK ANYWHERE!" — stickers que aparecen al hacer click.
   Replica la interacción de la página (+54) del sitio original.
   ============================================================ */

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const BASE = 'https://framerusercontent.com/images/';

  // Los 19 stickers del set original
  const STICKERS = [
    'jsSeSHw9MzvA3l90QP75qyQKXAc.png',
    'Lxq4NUdOKDUC72DG75chHyviRI.png',
    'vUAhHG3nDC7p8ZRVo9hyJcTJ3Y.png',
    'oUgalHTUBqr5978PU1Amhslsg.png',
    'zF7V5jXPZLXHnKPX4EfzEn8cPm0.png',
    'F21n5QepNjdYAl3Iw15FtJyC7Z8.png',
    'fSGMoJ2FJQnyZXw5D1nYhVlVNo.png',
    'hKTpZXdRxoVjfFfeTI2UeRLm7g.png',
    'LxY8QcmlR5QOGXcHtR1oAymDBOo.png',
    'tdsZT6NGaTsl205ZQAdSiROH9ws.png',
    'LyOkCoHHMug0FYNlS3IOb8AoQuc.png',
    'fYUuXdwc6M34rhpjpNp63lUKC3Y.png',
    'cmwMhgPHJGCwREsj3rAIUBzjA.png',
    'SpvteAKTXm4NgQAxH6v6Md0nWUE.png',
    '9r5k46T9wgUGh77RlPJlyotrENo.png',
    'fta9o3lq2J4mB63VgTtNch7Ero.png',
    'WbV33KSsxq9LvP9ExZC4X667U.png',
    'bHs9mRH5w1vEZ1dpHTGLI8o.png',
    'M1HKoqLstbjXMLvEAW9SmYx3U.png'
  ];

  // Precarga para que aparezcan sin parpadeo
  STICKERS.forEach((f) => { const i = new Image(); i.src = BASE + f; });

  let last = 0;
  let i = Math.floor(Math.random() * STICKERS.length);

  document.addEventListener('click', (e) => {
    // No interferir con links, botones ni campos de formulario
    if (e.target.closest('a, button, input, textarea, select, details')) return;
    // Las postales y los carruseles se arrastran: ahí no queremos stickers
    if (e.target.closest('.fan, .ig-post, .reels')) return;
    // Si venimos de arrastrar algo, tampoco
    if (document.body.dataset.dragging === '1') return;

    // Pequeño límite para que no se dispare en ráfaga
    const now = Date.now();
    if (now - last < 120) return;
    last = now;

    const el = document.createElement('img');
    el.className = 'click-sticker';
    el.src = BASE + STICKERS[i % STICKERS.length];
    i++;

    // Tamaño y rotación variables, como en el original
    const size = 58 + Math.random() * 34;         // 58-92px
    const rot = (Math.random() * 24 - 12).toFixed(1);
    el.style.width = size + 'px';
    // Algunos stickers son muy verticales (la torre): topamos también el alto
    el.style.maxHeight = '110px';
    el.style.width = 'auto';
    el.style.maxWidth = size + 'px';
    el.style.left = (e.pageX) + 'px';
    el.style.top = (e.pageY) + 'px';
    el.style.setProperty('--rot', rot + 'deg');
    el.alt = '';

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  });
})();
