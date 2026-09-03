/* ============================================================
   Gráfica en Di Tella
   - Post de Instagram (carrusel)
   - Historia (carrusel con barras)
   - Abanico de folletos arrastrable
   - Laptop con banners (carrusel)
   - Presentación proyectada (carrusel)
   ============================================================ */

/* Carrusel genérico por translate del track */
function dtCarousel(root, trackSel, prevSel, nextSel, opts) {
  opts = opts || {};
  const track = root.querySelector(trackSel);
  if (!track) return;
  const n = track.children.length;
  if (!n) return;
  const dots = opts.dots ? [...root.querySelectorAll(opts.dots)] : [];
  const bars = opts.bars ? [...root.querySelectorAll(opts.bars + ' i')] : [];
  let idx = 0;
  const kids = [...track.children];
  function render() {
    if (opts.fade) {
      kids.forEach((c, i) => c.classList.toggle('on', i === idx));
    } else {
      track.style.transform = `translateX(${-idx * 100}%)`;
    }
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    bars.forEach((b, i) => b.classList.toggle('on', i <= idx));
  }
  const go = (m) => { idx = (m + n) % n; render(); };
  const prev = root.querySelector(prevSel);
  const next = root.querySelector(nextSel);
  prev && prev.addEventListener('click', () => go(idx - 1));
  next && next.addEventListener('click', () => go(idx + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  // swipe / tap
  let x0 = null;
  const surf = opts.surface ? root.querySelector(opts.surface) : track.parentElement;
  surf.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  surf.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    else if (opts.tap) {           // tap izquierda/derecha (historias)
      const r = surf.getBoundingClientRect();
      go(idx + (e.clientX - r.left < r.width / 2 ? -1 : 1));
    }
    x0 = null;
  });
  render();
}

/* Barras de progreso de la historia (una por slide) */
(function () {
  const bars = document.getElementById('dtStoryBars');
  const stage = document.querySelector('#dtStory .dt-stage');
  if (bars && stage) {
    [...stage.children].forEach(() => bars.appendChild(document.createElement('i')));
  }
})();

/* Instancias */
(function () {
  const post = document.getElementById('dtPost');
  if (post) dtCarousel(post, '.ig-track', '.car-btn.prev', '.car-btn.next', { dots: '.ig-dots i', surface: '.ig-frame' });

  const story = document.getElementById('dtStory');
  if (story) dtCarousel(story, '.dt-stage', '.st-arrow.prev', '.st-arrow.next', { bars: '.story-bars', surface: '.dt-stage', tap: true });

  const laptop = document.getElementById('bannerLaptop');
  if (laptop) dtCarousel(laptop, '.lt-track', '.lt-arrow.prev', '.lt-arrow.next', { surface: '.lt-screen', fade: true });

  const proj = document.getElementById('projector');
  if (proj) dtCarousel(proj, '.pj-track', '.pj-arrow.prev', '.pj-arrow.next', { surface: '.pj-screen', fade: true });
})();

/* La paleta tiñe todo el fondo al hacer hover sobre cada color */
(function () {
  const chips = [...document.querySelectorAll('.pal-grid .pal-chip')];
  if (!chips.length) return;
  const body = document.body;
  chips.forEach((chip) => {
    const col = chip.style.background || getComputedStyle(chip).backgroundColor;
    chip.addEventListener('pointerenter', () => { body.style.backgroundColor = col; });
    chip.addEventListener('pointerleave', () => { body.style.backgroundColor = ''; });
  });
})();

/* Cartel web superpuesto: arrastrable (mantiene su leve inclinación) */
(function () {
  const el = document.getElementById('cartelWeb');
  if (!el) return;
  const ROT = -8;                 // inclinación base en grados
  let x = 0, y = 0, sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
  const paint = () => { el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + ROT + 'deg)'; };
  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    document.body.dataset.dragging = '1';
    sx = e.clientX; sy = e.clientY; ox = x; oy = y;
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    x = ox + (e.clientX - sx);
    y = oy + (e.clientY - sy);
    paint();
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    try { el.releasePointerCapture(e.pointerId); } catch (_) {}
    setTimeout(() => { document.body.dataset.dragging = '0'; }, 0);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
})();

/* Abecedario: engrosamiento por ÁREAS (spotlight difuminado alrededor del mouse,
   igual criterio que la frase de Churba: afecta la letra tocada y las de alrededor). */
(function () {
  const alpha = document.querySelector('.dt-alpha');
  if (!alpha) return;
  const spans = [...alpha.querySelectorAll('.row span')];
  if (!spans.length) return;
  const R = 150;               // radio de influencia (px)
  const MIN = 300, MAX = 900;  // rango de peso variable
  let mx = 0, my = 0, active = false, raf = null;
  // Cada letra se queda con el mayor peso que alcanzó: no sólo la que se tocó de lleno,
  // también las de alrededor, aunque hayan quedado a medio engrosar. Un segundo pase
  // directo sobre una de ellas la puede seguir llevando hasta MAX.
  const maxAlcanzado = new Map();
  function frame() {
    raf = null;
    for (const s of spans) {
      const r = s.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(mx - cx, my - cy);
      let t = active ? Math.max(0, 1 - d / R) : 0;
      t = t * t * (3 - 2 * t);            // smoothstep → transición suave
      const w = Math.round(MIN + t * (MAX - MIN));
      const previo = maxAlcanzado.get(s) || MIN;
      const final = Math.max(w, previo);
      if (final !== previo) maxAlcanzado.set(s, final);
      s.style.fontVariationSettings = '"wght" ' + final;
    }
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
  alpha.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; active = true; request(); });
  alpha.addEventListener('pointerleave', () => { active = false; request(); });
})();

/* La historia toma el mismo alto que el post (se ajusta al cargar y al resize) */
(function () {
  const post = document.getElementById('dtPost');
  const story = document.getElementById('dtStory');
  if (!post || !story) return;
  const sync = () => {
    if (window.innerWidth <= 900) { story.style.height = ''; story.style.width = ''; return; }
    const h = post.offsetHeight;
    if (!h) return;
    story.style.height = h + 'px';
    story.style.width = Math.round(h * 9 / 16) + 'px';
  };
  window.addEventListener('load', sync);
  window.addEventListener('resize', sync);
  const imgs = post.querySelectorAll('img');
  imgs.forEach((im) => { if (!im.complete) im.addEventListener('load', sync); });
  sync();
})();

/* Saltos a las piezas de la portada ---------------------------------------
   El ancla nativa caía torcida por dos motivos: cada destino arranca con un
   padding grande (el ancla apuntaba al borde de la caja, no a lo que se ve) y
   las imágenes de más abajo todavía no habían cargado, así que el largo de la
   página cambiaba en pleno viaje. Acá calculamos el destino a mano, forzamos
   la carga previa y corregimos al final del scroll. */
(function () {
  const links = [...document.querySelectorAll('.dt-piece[href^="#"]')];
  if (!links.length) return;

  const GAP = 110;   // aire entre el borde de arriba y la pieza (tapa la cabecera)

  function targetTop(el) {
    const pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
    const y = window.scrollY + el.getBoundingClientRect().top + pad - GAP;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(y, max));
  }

  // Nada de sorpresas de altura a mitad del scroll: revelamos todo y cargamos
  // las imágenes diferidas antes de movernos.
  let settled = false;
  function settle() {
    if (settled) return;
    settled = true;
    document.querySelectorAll('.io-reveal').forEach((n) => n.classList.add('is-in'));
    document.querySelectorAll('img[loading="lazy"]').forEach((im) => { im.loading = 'eager'; });
  }

  function goTo(el) {
    settle();
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetTop(el), behavior: 'smooth' });
      // Cuando el scroll se frena, si quedó corrido (porque terminó de cargar
      // una imagen en el camino) lo acomodamos sin animación.
      let t = null;
      const onScroll = () => {
        clearTimeout(t);
        t = setTimeout(() => {
          window.removeEventListener('scroll', onScroll);
          const d = targetTop(el) - window.scrollY;
          if (Math.abs(d) > 6) window.scrollTo({ top: targetTop(el) });
        }, 160);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    });
  }

  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      goTo(el);
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });
})();

/* Abanico de folletos arrastrable (misma mecánica que +54) */
(function () {
  const fan = document.getElementById('folletoFan');
  if (!fan) return;
  const cards = [...fan.querySelectorAll('.card')];
  const n = cards.length;
  let top = n;
  // Hint "Drag": aparece al pasar el mouse (mientras no se haya arrastrado aún)
  fan.addEventListener('pointerenter', () => {
    if (fan.dataset.moved !== '1') fan.classList.add('hovering');
  });
  fan.addEventListener('pointerleave', () => fan.classList.remove('hovering'));
  // En pantallas angostas el abanico se abre menos: si no, los folletos de
  // las puntas quedan afuera de la pantalla (el spread estaba pensado en
  // píxeles fijos, para el ancho de un desktop).
  function escala() {
    return fan.clientWidth < 480 ? 0.45 : fan.clientWidth < 700 ? 0.7 : 1;
  }
  const state = cards.map((_, i) => {
    const t = i - (n - 1) / 2;
    return { x: t * 52 * escala(), y: Math.abs(t) * 14, rot: t * 9 };
  });
  const paint = (i) => {
    const s = state[i];
    cards[i].style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg)`;
  };
  cards.forEach((c, i) => { c.style.zIndex = i + 1; paint(i); });
  fan.addEventListener('mouseenter', () => {
    const e = escala();
    state.forEach((s, i) => { const t = i - (n - 1) / 2; s.x = t * 88 * e; s.rot = t * 13; paint(i); });
  });
  fan.addEventListener('mouseleave', () => {
    if (fan.dataset.moved === '1') return;
    const e = escala();
    state.forEach((s, i) => { const t = i - (n - 1) / 2; s.x = t * 52 * e; s.rot = t * 9; paint(i); });
  });
  // Al rotar el celular o cambiar de tamaño la ventana, se recalcula el
  // abanico — salvo que el usuario ya haya arrastrado un folleto.
  window.addEventListener('resize', () => {
    if (fan.dataset.moved === '1') return;
    const e = escala();
    state.forEach((s, i) => { const t = i - (n - 1) / 2; s.x = t * 52 * e; s.rot = t * 9; paint(i); });
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
      document.body.dataset.dragging = '1';
      sx = e.clientX; sy = e.clientY; ox = state[i].x; oy = state[i].y;
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
      setTimeout(() => { document.body.dataset.dragging = '0'; }, 0);
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  });
})();
