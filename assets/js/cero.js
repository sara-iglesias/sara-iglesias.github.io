/* ============================================================
   Componentes de la página Cero al Infinito
   - Libro de doble página (cuadrado), hojas que giran (como Churba)
   - Post de Instagram (carrusel)
   - Abanico de muestras arrastrable (centrado)
   ============================================================ */

/* ---------- 1. Libro de doble página (hojas que giran desde el lomo) ---------- */
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

/* ---------- 2. Post de Instagram (carrusel) ---------- */
(function () {
  const post = document.getElementById('igPost');
  if (!post) return;

  const track = post.querySelector('.ig-track');
  const slides = track.children.length;
  const dots = [...post.querySelectorAll('.ig-dots i')];
  const prev = post.querySelector('.car-btn.prev');
  const next = post.querySelector('.car-btn.next');

  let idx = 0;
  function render() {
    track.style.transform = `translateX(${-idx * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
  }
  const go = (n) => { idx = (n + slides) % slides; render(); };

  prev && prev.addEventListener('click', () => go(idx - 1));
  next && next.addEventListener('click', () => go(idx + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

  let x0 = null;
  const frame = post.querySelector('.ig-frame');
  frame.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  frame.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  render();
})();

/* ---------- 3. Abanico de muestras arrastrable (centrado) ---------- */
(function () {
  const fan = document.getElementById('fan');
  if (!fan) return;

  const cards = [...fan.querySelectorAll('.card')];
  const n = cards.length;
  let top = n;

  const hint = fan.querySelector('.hint');
  if (hint) {
    fan.addEventListener('pointerenter', () => {
      if (fan.dataset.moved !== '1') fan.classList.add('hovering');
    });
    fan.addEventListener('pointerleave', () => fan.classList.remove('hovering'));
  }

  const state = cards.map((_, i) => {
    const t = i - (n - 1) / 2;
    return { x: t * 46, y: Math.abs(t) * 12, rot: t * 9 };
  });

  // El centrado va en el propio transform (calc -50%), así funciona con
  // cualquier tamaño/formato de tarjeta (postales verticales de Cero).
  function paint(i) {
    const s = state[i];
    cards[i].style.transform =
      `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) rotate(${s.rot}deg)`;
  }
  cards.forEach((c, i) => { c.style.zIndex = i + 1; paint(i); });

  fan.addEventListener('mouseenter', () => {
    state.forEach((s, i) => {
      const t = i - (n - 1) / 2;
      s.x = t * 78; s.rot = t * 13;
      paint(i);
    });
  });
  fan.addEventListener('mouseleave', () => {
    if (fan.dataset.moved === '1') return;
    state.forEach((s, i) => {
      const t = i - (n - 1) / 2;
      s.x = t * 46; s.rot = t * 9;
      paint(i);
    });
  });

  cards.forEach((card, i) => {
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
    card.addEventListener('pointerdown', (e) => {
      dragging = true;
      card.setPointerCapture(e.pointerId);
      card.classList.add('dragging');
      card.style.zIndex = ++top;
      fan.classList.add('touched');
      fan.dataset.moved = '1';
      sx = e.clientX; sy = e.clientY;
      ox = state[i].x; oy = state[i].y;
    });
    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      state[i].x = ox + (e.clientX - sx);
      state[i].y = oy + (e.clientY - sy);
      paint(i);
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('dragging');
      try { card.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  });
})();
