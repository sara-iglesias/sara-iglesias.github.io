/* ============================================================
   Componentes de la página Forja
   - Libro de doble página (páginas verticales), como Churba/Cero
   - Trío de lámparas con interruptor día/noche
   ============================================================ */

/* ---------- 1. Libro de doble página ---------- */
(function () {
  const book = document.getElementById('book');
  if (!book) return;

  const leaves = [...book.querySelectorAll('.leaf')];
  const L = leaves.length;
  if (!L) return;

  leaves.forEach((lf, i) => { lf.style.zIndex = String(L - i); });

  let turned = 0;
  const prevBtn = book.querySelector('.b-arrow.prev');
  const nextBtn = book.querySelector('.b-arrow.next');

  function update() {
    if (prevBtn) prevBtn.disabled = turned === 0;
    if (nextBtn) nextBtn.disabled = turned >= L;
  }
  function next() {
    if (turned >= L) return;
    const lf = leaves[turned];
    lf.style.zIndex = String(L + turned + 1);
    lf.classList.add('turned');
    turned++;
    update();
  }
  function prev() {
    if (turned <= 0) return;
    turned--;
    const lf = leaves[turned];
    lf.classList.remove('turned');
    lf.style.zIndex = String(L - turned);
    update();
  }

  nextBtn && nextBtn.addEventListener('click', next);
  prevBtn && prevBtn.addEventListener('click', prev);
  book.querySelector('.zone.next') && book.querySelector('.zone.next').addEventListener('click', next);
  book.querySelector('.zone.prev') && book.querySelector('.zone.prev').addEventListener('click', prev);

  update();
})();

/* ---------- 2. Trío de lámparas: interruptor día/noche ---------- */
(function () {
  const sw = document.getElementById('lampSwitch');
  const grid = document.getElementById('lampGrid');
  if (!sw || !grid) return;
  sw.addEventListener('click', () => {
    const night = grid.classList.toggle('night');
    sw.classList.toggle('on', night);
    sw.setAttribute('aria-pressed', night ? 'true' : 'false');
    // El fondo se pone gris (mismo gris que el hover de Forja en el home)
    document.body.classList.toggle('lamps-night', night);
  });
})();
