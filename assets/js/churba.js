/* ============================================================
   Componentes de la página Churba en el Moderno
   - Libro realista de doble página (hojas que se dan vuelta)
   - Abanico de posters arrastrable (mismo formato que +54)
   - Cita gigante con efecto por letra
   ============================================================ */

/* ---------- 1. Libro de doble página ---------- */
(function () {
  const book = document.getElementById('book');
  if (!book) return;

  const leaves = [...book.querySelectorAll('.leaf')];
  const L = leaves.length;
  if (!L) return;

  // La hoja 1 arriba; las siguientes, debajo en orden.
  leaves.forEach((lf, i) => { lf.style.zIndex = String(L - i); });

  let turned = 0;                    // hojas ya dadas vuelta
  const countEl = book.querySelector('#bCount');
  const prevBtn = book.querySelector('.b-arrow.prev');
  const nextBtn = book.querySelector('.b-arrow.next');
  const N = L * 2;                   // páginas totales

  function label() {
    if (turned === 0) return 'Cover';
    const l = 2 * turned, r = 2 * turned + 1;   // páginas (1-based) del pliego abierto
    return r <= N ? l + '–' + r : String(l);
  }
  function update() {
    if (countEl) countEl.textContent = label();
    if (prevBtn) prevBtn.disabled = turned === 0;
    if (nextBtn) nextBtn.disabled = turned >= L;
  }

  function next() {
    if (turned >= L) return;
    const lf = leaves[turned];
    lf.style.zIndex = String(L + turned + 1);   // la hoja que gira queda arriba
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

/* ---------- 2. Abanico de posters arrastrable (formato +54) ---------- */
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

  // En pantallas angostas el abanico se abre menos: si no, las postales de
  // las puntas quedan afuera de la pantalla (el spread estaba pensado en
  // píxeles fijos, para el ancho de un desktop).
  function escala() {
    return fan.clientWidth < 480 ? 0.45 : fan.clientWidth < 700 ? 0.7 : 1;
  }

  const state = cards.map((_, i) => {
    const t = i - (n - 1) / 2;
    return { x: t * 46 * escala(), y: Math.abs(t) * 12, rot: t * 9 };
  });

  function paint(i) {
    const s = state[i];
    cards[i].style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg)`;
  }
  cards.forEach((c, i) => { c.style.zIndex = i + 1; paint(i); });

  fan.addEventListener('mouseenter', () => {
    const e = escala();
    state.forEach((s, i) => {
      const t = i - (n - 1) / 2;
      s.x = t * 78 * e; s.rot = t * 13;
      paint(i);
    });
  });
  fan.addEventListener('mouseleave', () => {
    if (fan.dataset.moved === '1') return;
    const e = escala();
    state.forEach((s, i) => {
      const t = i - (n - 1) / 2;
      s.x = t * 46 * e; s.rot = t * 9;
      paint(i);
    });
  });
  // Al rotar el celular o cambiar de tamaño la ventana, se recalcula el
  // abanico — salvo que el usuario ya haya arrastrado alguna postal.
  window.addEventListener('resize', () => {
    if (fan.dataset.moved === '1') return;
    const e = escala();
    state.forEach((s, i) => {
      const t = i - (n - 1) / 2;
      s.x = t * 46 * e; s.rot = t * 9;
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

/* ---------- 3. Cita gigante: "spotlight" gradual alrededor del mouse ----------
   La letra bajo el cursor crece un poco; las de alrededor, gradualmente
   menos. "Diseñar" ya está en verde. (Antes, además, tocar una letra
   pintaba toda la página de verde — se sacó: cambiaba el color de la
   pantalla entera, cosa que no queremos en ningún lado del sitio.) */
(function () {
  const p = document.querySelector('.big-quote [data-quote]');
  if (!p) return;

  // Los renglones se toman del propio HTML (sirve para inglés y español)
  const lines = p.innerHTML
    .split(/<br\s*\/?>/i)
    .map((s) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (!lines.length) lines.push(p.textContent.trim());

  p.textContent = '';
  const chars = [];
  const mkChar = (parent, c, green) => {
    const s = document.createElement('span');
    s.className = green ? 'ch green' : 'ch';
    s.textContent = c;
    if (green) s._green = true;
    parent.appendChild(s);
    chars.push(s);
    return s;
  };

  lines.forEach((line, li) => {
    const words = line.split(/\s+/);
    words.forEach((w, wi) => {
      const word = document.createElement('span');
      word.className = 'word';
      const isDise = (li === 0 && wi === 0);         // la palabra "Diseñar"
      if (isDise) { word.classList.add('diseniar'); mkChar(word, '“', false); }
      for (const c of w) mkChar(word, c, isDise);
      if (li === lines.length - 1 && wi === words.length - 1) mkChar(word, '”', false);
      p.appendChild(word);
      if (wi < words.length - 1) p.appendChild(document.createTextNode(' '));
    });
    if (li < lines.length - 1) p.appendChild(document.createElement('br'));
  });

  // Spotlight
  const R = 155;            // radio de influencia (px)
  let mx = 0, my = 0, active = false, raf = null;

  function frame() {
    raf = null;
    for (const s of chars) {
      const r = s.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(mx - cx, my - cy);
      let t = active ? Math.max(0, 1 - d / R) : 0;
      t = t * t * (3 - 2 * t);            // smoothstep
      // Sólo un leve agrandado al pasar el mouse; sin cambio de color.
      s.style.transform = `translateY(${(-t * 3).toFixed(2)}px) scale(${(1 + t * 0.26).toFixed(3)})`;
    }
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
  p.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; active = true; request(); });
  p.addEventListener('pointerleave', () => { active = false; request(); });

})();

/* ---------- Video de intro: click para pausar / reanudar ---------- */
(function () {
  const v = document.querySelector('.case-media.media-full video');
  if (!v) return;
  v.style.cursor = 'pointer';
  v.addEventListener('click', () => {
    if (v.paused) v.play().catch(() => {}); else v.pause();
  });
})();
