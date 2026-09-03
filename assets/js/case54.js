/* ============================================================
   Componentes de la página (+54)
   - Carrusel del post de Instagram (5 slides)
   - Carrusel de reels (coverflow)
   - Abanico de postales arrastrable
   ============================================================ */

/* ---------- 1. Post de Instagram ---------- */
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

  // Loop infinito: después de la última vuelve a la primera
  const go = (n) => { idx = (n + slides) % slides; render(); };

  prev.addEventListener('click', () => go(idx - 1));
  next.addEventListener('click', () => go(idx + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

  /* Deslizar con el dedo o arrastrando */
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

/* ---------- 2. Historias (reels) ---------- */
(function () {
  const box = document.getElementById('reels');
  if (!box) return;

  const vids = [...box.querySelectorAll('.story-stage video')];
  const bars = document.getElementById('storyBars');

  // Una barra de progreso por historia
  vids.forEach(() => bars.appendChild(document.createElement('i')));
  const segs = [...bars.children];

  let idx = 0;

  function render() {
    vids.forEach((v, i) => {
      v.classList.toggle('on', i === idx);
      if (i === idx) { v.currentTime = 0; v.play().catch(() => {}); }
    });
    segs.forEach((sg, i) => sg.classList.toggle('on', i <= idx));
  }

  const go = (n) => { idx = (n + vids.length) % vids.length; render(); };

  // Tocar la mitad izquierda o derecha, como en Instagram
  const stage = box.querySelector('.story');
  stage.addEventListener('click', (e) => {
    const r = stage.getBoundingClientRect();
    go(idx + (e.clientX - r.left < r.width / 2 ? -1 : 1));
  });

  // Flechas atrás/adelante (igual que en Gráfica en Di Tella)
  const prev = box.querySelector('.st-arrow.prev');
  const next = box.querySelector('.st-arrow.next');
  if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); go(idx - 1); });
  if (next) next.addEventListener('click', (e) => { e.stopPropagation(); go(idx + 1); });

  // El alto de la historia se iguala al del post (queda más angosta)
  const post = document.getElementById('igPost');
  function sizeStory() {
    if (!post) return;
    stage.style.height = post.offsetHeight + 'px';
    stage.style.width = 'auto';   // el aspect-ratio 9/16 calcula el ancho
  }
  sizeStory();
  window.addEventListener('load', sizeStory);
  window.addEventListener('resize', sizeStory);

  render();
})();

/* ---------- 3. Abanico de postales arrastrable ---------- */
(function () {
  const fan = document.getElementById('fan');
  if (!fan) return;

  const cards = [...fan.querySelectorAll('.card')];
  const n = cards.length;
  let top = n; // z-index incremental para traer al frente

  // Cartel "Drag the postcards" pegado al mouse, hasta el primer arrastre
  const hint = fan.querySelector('.hint');
  if (hint) {
    fan.addEventListener('pointerenter', () => {
      if (fan.dataset.moved !== '1') fan.classList.add('hovering');
    });
    fan.addEventListener('pointerleave', () => fan.classList.remove('hovering'));
  }

  // Estado de cada postal: posición y rotación
  // En pantallas angostas el abanico se abre menos: si no, las postales de
  // las puntas quedan afuera de la pantalla (el spread estaba pensado en
  // píxeles fijos, para el ancho de un desktop).
  function escala() {
    return fan.clientWidth < 480 ? 0.45 : fan.clientWidth < 700 ? 0.7 : 1;
  }

  const state = cards.map((_, i) => {
    const t = i - (n - 1) / 2;          // -2.5 .. 2.5
    return { x: t * 46 * escala(), y: Math.abs(t) * 12, rot: t * 9 };
  });

  function paint(i) {
    const s = state[i];
    cards[i].style.transform =
      `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg)`;
  }
  cards.forEach((c, i) => { c.style.zIndex = i + 1; paint(i); });

  // Al pasar el mouse, el abanico se abre un poco más
  fan.addEventListener('mouseenter', () => {
    const e = escala();
    state.forEach((s, i) => {
      const t = i - (n - 1) / 2;
      s.x = t * 78 * e; s.rot = t * 13;
      paint(i);
    });
  });
  fan.addEventListener('mouseleave', () => {
    if (fan.dataset.moved === '1') return;   // si ya las movió, respetamos
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

  // Arrastre
  cards.forEach((card, i) => {
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;

    card.addEventListener('pointerdown', (e) => {
      dragging = true;
      card.setPointerCapture(e.pointerId);
      card.classList.add('dragging');
      card.style.zIndex = ++top;          // traer al frente
      fan.classList.add('touched');
      fan.dataset.moved = '1';
      document.body.dataset.dragging = '1';
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
      // Se libera en el siguiente tick, después del click que sigue al soltar
      setTimeout(() => { document.body.dataset.dragging = '0'; }, 0);
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  });
})();

/* ---------- 4. Espécimen tipográfico con gravedad ----------
   Al hacer hover sobre un caracter (letras y números), cae con gravedad y se
   inclina hasta apoyarse en el PRÓXIMO elemento (el borde superior del bloque
   que sigue al espécimen), sin ninguna zona vacía reservada. No colisiona con
   los demás: pueden superponerse, todos apoyan en ese mismo borde. */
(function () {
  const spec = document.querySelector('.type-specimen');
  if (!spec) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const G = 4600;              // gravedad (px/s²): caída realista
  const MARGIN = 44;           // aire entre la letra y el contenido sobre el que apoya
  const falling = [];
  let raf = null, prev = 0, contentRects = null;

  // Cajas del CONTENIDO real debajo del espécimen, ajustadas a lo que se ve:
  // para textos, el rango tipográfico (no todo el ancho de la sección);
  // para imágenes/videos, su caja. Así las letras sólo se apoyan donde hay algo.
  function buildContent() {
    contentRects = [];
    const specBottom = spec.getBoundingClientRect().bottom + window.scrollY;
    let sib = spec.nextElementSibling;
    while (sib) {
      const els = /^(IMG|VIDEO|MODEL-VIEWER)$/.test(sib.tagName)
        ? [sib]
        : [...sib.querySelectorAll('h1,h2,h3,h4,p,img,video,model-viewer')];
      els.forEach((el) => {
        let r;
        if (/^(IMG|VIDEO|MODEL-VIEWER)$/.test(el.tagName)) {
          r = el.getBoundingClientRect();
        } else {
          const range = document.createRange();   // límites reales del texto
          range.selectNodeContents(el);
          r = range.getBoundingClientRect();
        }
        if (r.width < 4 || r.height < 4) return;
        const topPage = r.top + window.scrollY;
        if (topPage < specBottom - 1) return;      // sólo lo que está debajo
        contentRects.push({ top: topPage, left: r.left, right: r.right });
      });
      sib = sib.nextElementSibling;
    }
  }

  // Piso de una letra según su columna: el contenido más cercano (más arriba)
  // que la cubra en horizontal; si no hay ninguno, el fondo de la página.
  function floorForX(lx) {
    let top = Infinity;
    for (const c of contentRects) {
      if (lx >= c.left && lx <= c.right && c.top < top) top = c.top;
    }
    if (top === Infinity) top = document.documentElement.scrollHeight;
    return top;
  }

  // Medio alto de la caja envolvente de un caracter inclinado
  function halfH(w, h, deg) {
    const a = Math.abs(deg * Math.PI / 180);
    return (h * Math.cos(a) + w * Math.sin(a)) / 2;
  }

  function drop(sp) {
    if (sp.dataset.fell) return;
    sp.dataset.fell = '1';
    if (!contentRects) buildContent();

    const sr = spec.getBoundingClientRect();
    const r = sp.getBoundingClientRect();
    const w = r.width, h = r.height;
    const cx = r.left - sr.left + w / 2;
    const cy = r.top - sr.top + h / 2;
    // Piso propio de esta letra (según su columna)
    const specTopPage = sr.top + window.scrollY;
    const floor = floorForX(r.left + w / 2) - specTopPage - MARGIN;

    // Placeholder invisible: mantiene la fila quieta al sacar el caracter del flujo
    const ph = document.createElement('span');
    ph.textContent = sp.textContent;
    ph.style.visibility = 'hidden';
    sp.parentNode.insertBefore(ph, sp);

    sp.classList.add('fell');
    sp.style.width = w + 'px';
    sp.style.transformOrigin = '50% 50%';

    // Inclinación de reposo aleatoria (realismo)
    const rotTo = (Math.random() - 0.5) * 44;
    const o = { el: sp, w, h, cx, cy, vy: 0, rot: 0, rotTo, floor, landed: false };
    o.el.style.transform = `translate(${cx - w / 2}px, ${cy - h / 2}px) rotate(0deg)`;
    falling.push(o);

    if (!raf) { prev = 0; raf = requestAnimationFrame(tick); }
  }

  function tick(t) {
    if (!prev) prev = t;
    const dt = Math.min((t - prev) / 1000, 0.033);
    prev = t;

    falling.forEach((o) => {
      if (o.landed) return;
      o.vy += G * dt;
      o.cy += o.vy * dt;
      o.rot += (o.rotTo - o.rot) * 0.12;   // se va inclinando al caer

      const rest = o.floor - halfH(o.w, o.h, o.rotTo);   // apoya sobre su propio piso
      if (o.cy >= rest) {
        o.cy = rest;
        o.rot = o.rotTo;
        o.landed = true;
      }
      o.el.style.transform =
        `translate(${o.cx - o.w / 2}px, ${o.cy - o.h / 2}px) rotate(${o.rot.toFixed(2)}deg)`;
    });

    if (falling.some((o) => !o.landed)) raf = requestAnimationFrame(tick);
    else { raf = null; prev = 0; }
  }

  // Todas las filas caen (incluye la de números)
  spec.querySelectorAll('.row span').forEach((sp) => {
    sp.addEventListener('pointerenter', () => drop(sp));
  });

  window.addEventListener('resize', () => { contentRects = null; });
})();
