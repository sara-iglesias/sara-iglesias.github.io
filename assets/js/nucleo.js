/* ============================================================
   Página Núcleo
   - Armado de la silla: 4 pasos interactivos
     (Structure / Assembly / Union / Final result)
   ============================================================ */
(function () {
  const root = document.getElementById('asmSteps');
  if (!root) return;

  const cols = [...root.querySelectorAll('.asm-col')];
  if (!cols.length) return;
  const DUR = 3000;                 // ms por paso (igual que la transición CSS de la barra)
  let gen = 0, timer = null;

  function clearFills() {
    cols.forEach(c => {
      const b = c.querySelector('.asm-bar');
      if (b) b.classList.remove('filling');
    });
  }

  function activate(i) {
    const my = ++gen;               // token: sólo el último activate avanza
    cols.forEach((c, k) => c.classList.toggle('is-active', k === i));
    clearFills();
    clearTimeout(timer);

    const next = () => { if (my === gen) activate((i + 1) % cols.length); };
    const bar = cols[i].querySelector('.asm-bar');

    if (bar) {
      void bar.offsetWidth;         // reinicia la animación
      bar.classList.add('filling'); // la barra se llena en DUR ms
      const onEnd = e => {
        if (e.propertyName !== 'transform') return;
        bar.removeEventListener('transitionend', onEnd);
        next();                     // cambia justo cuando la barra llega al final
      };
      bar.addEventListener('transitionend', onEnd);
      timer = setTimeout(() => { bar.removeEventListener('transitionend', onEnd); next(); }, DUR + 400);
    } else {
      timer = setTimeout(next, DUR);
    }
  }

  cols.forEach((c, i) => {
    c.addEventListener('click', () => activate(i));
    c.addEventListener('mouseenter', () => activate(i));
    c.addEventListener('focus', () => activate(i));
  });

  // Estado inicial: paso 1 activo, sin contar tiempo todavía
  cols.forEach((c, i) => c.classList.toggle('is-active', i === 0));

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    // El temporizador arranca recién cuando llego a esa parte (paso 1 a la vista),
    // no antes: observamos la fila de pasos y disparamos cuando llega cerca del
    // centro de la pantalla (rootMargin recorta el 42% inferior del viewport).
    if ('IntersectionObserver' in window) {
      let started = false;
      const watch = root.querySelector('.asm-acc') || root;
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !started) { started = true; io.disconnect(); activate(0); }
        });
      }, { threshold: 0, rootMargin: '0px 0px -42% 0px' });
      io.observe(watch);
    } else {
      activate(0);
    }
  }
})();

/* ---------- Scroll animation: armado de la silla ----------
   Secuencia de frames (silla_0001..silla_0210.webp) dibujada en un canvas
   panorámico a pantalla completa, scrubbeada con el scroll. Réplica del
   silla-scroll-demo. */
(function () {
  const scene = document.getElementById('chairScroll');
  if (!scene) return;
  const canvas = document.getElementById('chairCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const loading = document.getElementById('chairLoading');

  const FRAMES = parseInt(scene.dataset.frames, 10) || 210;
  const DIR = scene.dataset.dir || '../assets/nucleo-scroll';
  const url = i => `${DIR}/silla_${String(i).padStart(4, '0')}.webp`;

  const imgs = new Array(FRAMES);
  let loaded = 0, cur = -1;

  for (let i = 1; i <= FRAMES; i++) {
    const im = new Image();
    im.src = url(i);
    im.onload = () => {
      loaded++;
      if (loaded === 1) draw(0);
      if (loaded === FRAMES && loading) loading.remove();
    };
    imgs[i - 1] = im;
  }

  function draw(idx) {
    if (idx === cur) return;
    const im = imgs[idx];
    if (!im || !im.complete || !im.naturalWidth) return;
    cur = idx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
  }

  function onScroll() {
    const rect = scene.getBoundingClientRect();
    const total = scene.offsetHeight - window.innerHeight;
    let p = total > 0 ? (-rect.top) / total : 0;
    p = Math.min(1, Math.max(0, p));
    const f = Math.min(FRAMES - 1, Math.floor(p * (FRAMES - 1)));
    requestAnimationFrame(() => draw(f));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { const c = cur; cur = -1; draw(c < 0 ? 0 : c); });
  onScroll();
})();
