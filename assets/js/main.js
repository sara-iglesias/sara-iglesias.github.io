/* ============================================================
   Sara Iglesias — Portfolio · Animaciones e interacciones
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Grain natural (todo el sitio, solo compu) ----------
   El ruido es una textura fija (un mosaico de feTurbulence que el navegador
   rasteriza UNA vez y luego tilea, ver .grain-layer en style.css). El
   movimiento lo hace el CSS desplazando la capa a saltos, que es trabajo de
   GPU y no cuesta nada. La capa se sigue inyectando siempre; en mobile queda
   oculta por CSS (más liviano que hacerlo acá). */
(function () {
  if (document.querySelector('.grain-layer')) return;
  const layer = document.createElement('div');
  layer.className = 'grain-layer';
  layer.setAttribute('aria-hidden', 'true');
  (document.body || document.documentElement).appendChild(layer);
})();

/* ---------- 3D: girar sólo mientras se ve en pantalla ----------
   Un <model-viewer> con auto-rotate repinta en cada cuadro aunque esté fuera
   de vista. Lo frenamos cuando no se ve. */
(function () {
  const views = [...document.querySelectorAll('model-viewer[auto-rotate]')];
  if (!views.length || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.setAttribute('auto-rotate', '');
      else e.target.removeAttribute('auto-rotate');
    });
  }, { rootMargin: '150px' });
  views.forEach((v) => obs.observe(v));
})();

/* ---------- 1. Intro + typewriter del hero (solo home) ----------
   En blanco → se escribe "Hi!" → se borra → "I'm Sara." → "I design " →
   al arrancar "identities" aparece el resto de la página. */
const typedEl = document.getElementById('typed');
if (typedEl && window.TYPE_WORDS) {
  const words = window.TYPE_WORDS;
  const docEl = document.documentElement;
  const hero = document.querySelector('.hero');
  const l1 = document.getElementById('heroLine1');
  const l2 = document.getElementById('heroLine2');
  const c1 = document.getElementById('caret1');
  const lines = document.querySelectorAll('.hero .reveal-line');
  const greet = (hero && hero.dataset.greet) || 'Hi!';
  const nameTxt = (hero && hero.dataset.name) || "I'm Sara.";
  const design = (hero && hero.dataset.design) || 'I design ';

  const pickEl = document.getElementById('langPick');
  const skipBtn = document.getElementById('introSkip');
  let skipped = false, wake = null;
  function finishIntro() {
    if (skipped) return;
    skipped = true;
    if (wake) wake();                    // corta la espera actual al instante
    if (skipBtn) skipBtn.classList.remove('show');
  }
  if (skipBtn) skipBtn.addEventListener('click', finishIntro);

  // Al refrescar el home: arrancamos siempre desde arriba (si no, se ve
  // la página en blanco a mitad de scroll hasta que carga).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  let wi = 0, ci = 0, deleting = false;
  const SOL = 2;              // índice de "solutions/soluciones" en TYPE_WORDS
  function step() {
    const word = words[wi];
    // Sólo "solutions" va en color acento (amarillo).
    typedEl.classList.toggle('accent', wi === SOL);
    if (!deleting) {
      ci++;
      typedEl.textContent = word.slice(0, ci);
      if (ci === word.length) { deleting = true; return setTimeout(step, 1600); }
      return setTimeout(step, 95);
    } else {
      ci--;
      typedEl.textContent = word.slice(0, ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; return setTimeout(step, 350); }
      return setTimeout(step, 55);
    }
  }

  function revealAll() {
    clearTimeout(window.__introSafety);
    docEl.classList.add('home-revealed');
    if (skipBtn) skipBtn.classList.remove('show');
  }

  const sleep = (ms) => new Promise((r) => {
    if (skipped) { r(); return; }
    const t = setTimeout(r, ms);
    wake = () => { clearTimeout(t); r(); };
  });
  async function typeStr(el, str, cps) {
    for (let i = 1; i <= str.length; i++) { el.textContent = str.slice(0, i); await sleep(cps); }
  }
  async function eraseAll(el, cps) {
    let t = el.textContent;
    while (t.length) { t = t.slice(0, -1); el.textContent = t; await sleep(cps); }
  }

  /* --- Elección de idioma -------------------------------------------------
     Los dos saludos se tipean a la vez, después aparecen los botones. Al
     elegir, se apaga todo menos el saludo elegido, que se borra tipeado ahí
     mismo. Recién después aparece "I'm Sara." en el lugar de siempre.
     Estas esperas son propias (no las salteables): el botón de saltear todavía
     no está en pantalla y typeStr/eraseAll comparten un único `wake`. */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function typeInto(el, str, cps) {
    for (let i = 1; i <= str.length; i++) { el.textContent = str.slice(0, i); await wait(cps); }
  }
  async function eraseInto(el, cps) {
    let t = el.textContent;
    while (t.length) { t = t.slice(0, -1); el.textContent = t; await wait(cps); }
  }

  const optOf = (lang) => [...pickEl.querySelectorAll('.lang-pick__opt')]
    .find((o) => o.querySelector('.lang-pick__btn').dataset.lang === lang);

  /* El selector se apoya justo sobre la primera línea del hero: medimos dónde
     está esa línea (que sigue en su lugar, invisible) y ahí lo plantamos. Así
     el saludo sale exactamente de donde después sale "I'm Sara.". */
  function placePicker() {
    pickEl.style.top = (lines[0].offsetTop) + 'px';
  }
  function openPicker() {
    docEl.classList.add('picking');
    pickEl.hidden = false;
    placePicker();
    window.addEventListener('resize', placePicker);
  }
  async function closePicker() {
    pickEl.classList.remove('in');
    await wait(320);
    window.removeEventListener('resize', placePicker);
    pickEl.hidden = true;
    docEl.classList.remove('picking');
  }

  /* Devuelve true si la intro sigue en esta página, false si navega a la otra. */
  async function chooseLanguage() {
    clearTimeout(window.__introSafety);     // no revelamos la página mientras decide
    openPicker();
    const opts = [...pickEl.querySelectorAll('.lang-pick__opt')];
    await wait(60);
    pickEl.classList.add('in');
    await wait(420);

    // Los dos saludos se escriben al mismo tiempo
    await Promise.all(opts.map((o) => typeInto(o.querySelector('.g'), o.dataset.text, 115)));
    await wait(260);
    // …y recién ahí asoman los botones
    opts.forEach((o, i) => setTimeout(() => o.querySelector('.lang-pick__btn').classList.add('in'), i * 130));

    const btn = await new Promise((resolve) => {
      // El clic se escucha en TODA la opción (saludo + pastilla): si algo
      // llegara a taparle la pastilla, tocar el saludo también sirve.
      opts.forEach((o) => {
        o.addEventListener('click', function () {
          if (!pickEl.classList.contains('chosen')) resolve(o.querySelector('.lang-pick__btn'));
        });
      });
      // Si nadie elige, después de un rato seguimos con el idioma de esta página
      setTimeout(() => resolve(optOf(docEl.lang).querySelector('.lang-pick__btn')), 45000);
    });

    pickEl.classList.add('chosen');                       // se apagan los botones
    const mine = btn.closest('.lang-pick__opt');
    opts.forEach((o) => { if (o !== mine) o.classList.add('out'); });
    await wait(480);                                      // se va lo no elegido

    if (btn.dataset.lang !== docEl.lang) {
      // Es la otra versión del sitio: anotamos la elección (y desarmamos
      // introSeen) para que allá la intro siga sin volver a preguntar.
      try {
        sessionStorage.setItem('introPick', btn.dataset.lang);
        sessionStorage.removeItem('introSeen');
      } catch (e) {}
      location.href = btn.dataset.href;
      return false;
    }

    // Se queda acá: rearmamos la red de seguridad, borramos el saludo y cerramos
    window.__introSafety = setTimeout(function () {
      docEl.classList.remove('home-intro');
    }, 20000);
    await eraseInto(mine.querySelector('.g'), 60);
    await wait(160);
    await closePicker();
    return true;
  }

  /* Llegó desde la otra versión: el saludo ya está elegido, así que aparece
     escrito en el mismo lugar donde estaba y se borra igual que en el otro
     camino. Las columnas están en el mismo orden en las dos páginas, o sea
     que el salto entre una y otra no se nota. */
  async function replayGreeting() {
    openPicker();
    pickEl.classList.add('chosen');
    const opts = [...pickEl.querySelectorAll('.lang-pick__opt')];
    const mine = optOf(docEl.lang) || opts[0];
    opts.forEach((o) => { if (o !== mine) o.classList.add('out'); });
    const g = mine.querySelector('.g');
    g.textContent = mine.dataset.text;
    await wait(60);
    pickEl.classList.add('in');
    await wait(680);
    await eraseInto(g, 60);
    await wait(160);
    await closePicker();
  }

  // La intro corre sólo si está armada (primera carga del home en la sesión)
  // y no hay reduce-motion. Al navegar dentro del sitio ya no se repite.
  const introActive = docEl.classList.contains('home-intro') && !reduceMotion && l1 && l2;
  try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}

  if (!introActive) {
    // Sin intro: mostramos todo directo.
    if (l1) l1.textContent = nameTxt;
    if (l2) l2.textContent = design;
    typedEl.textContent = words[0];
    if (c1) c1.style.display = 'none';
    lines.forEach((r) => r.classList.add('on'));
    docEl.classList.remove('home-intro');
    clearTimeout(window.__introSafety);
    setTimeout(step, 600);
  } else {
    if (c1) c1.style.display = 'none';           // arranca en blanco, sin cursor
    (async function () {
      // --- Paso 0: elegir idioma ------------------------------------------
      // Si el usuario ya eligió (viene de la otra versión del sitio), el
      // saludo aparece escrito y seguimos.
      let already = null;
      try { already = sessionStorage.getItem('introPick'); } catch (e) {}
      try { sessionStorage.removeItem('introPick'); } catch (e) {}

      if (pickEl && !already) {
        if (!(await chooseLanguage())) return;    // eligió el otro idioma: navega
      } else if (pickEl && already) {
        await replayGreeting();
      } else {
        lines[0].classList.add('on');
        await sleep(500);                         // página en blanco un instante
        if (c1) c1.style.display = '';
        await sleep(150);
        await typeStr(l1, greet, 120);
        await sleep(280);
        await eraseAll(l1, 55);
      }

      // A partir de acá el saludo ya no está: entra la línea 1 del hero
      lines[0].classList.add('on');
      if (c1) c1.style.display = '';
      if (skipBtn) skipBtn.classList.add('show'); // botón para saltear la intro
      await sleep(140);
      await typeStr(l1, nameTxt, 110);           // "I'm Sara."
      await sleep(350);                          // respiro corto antes de "I design"
      if (c1) c1.style.display = 'none';         // el cursor pasa a la 2ª línea
      lines[1].classList.add('on');
      await typeStr(l2, design, 110);            // "I design "

      // --- Secuencia de colores (usa los colores de los trabajos) ---
      // orden pedido: identities → systems → experiences → solutions
      const seq = [
        { w: words[0], c: '#B7CE00', dark: false },  // identities  → verde lima
        { w: words[3], c: '#ACABA5', dark: false },  // systems     → gris
        { w: words[1], c: '#F0C800', dark: false },  // experiences → amarillo
        { w: words[2], c: '#FA0057', dark: true }    // solutions   → magenta
      ];
      document.body.classList.add('intro-bg');
      for (let k = 0; k < seq.length; k++) {
        if (skipped) break;
        document.body.style.backgroundColor = seq[k].c;
        document.body.classList.toggle('on-dark', seq[k].dark);
        // Las primeras (identities, systems, experiences) en blanco sobre su
        // color; "solutions" (última) en amarillo acento sobre el magenta.
        typedEl.classList.toggle('accent', k === seq.length - 1);
        typedEl.classList.toggle('introwhite', k < seq.length - 1);
        await sleep(160);
        await typeStr(typedEl, seq[k].w, 60);
        await sleep(560);
        if (k < seq.length - 1) { await eraseAll(typedEl, 36); await sleep(120); }
      }

      // --- Pausa y luego fondo blanco + aparece toda la web (con calma) ---
      await sleep(650);                          // se queda un momento en "solutions"
      document.body.style.backgroundColor = '#fff';
      document.body.classList.remove('on-dark');
      await sleep(700);                          // el fondo se aclara despacio
      lines[2].classList.add('on');              // párrafo del hero
      revealAll();                               // header, servicios, works, etc.
      await sleep(1100);
      document.body.classList.remove('intro-bg');
      document.body.style.backgroundColor = '';  // vuelve al blanco por CSS
      // El typewriter normal sigue desde "solutions" (borra y cicla)
      typedEl.classList.remove('introwhite');
      typedEl.classList.add('accent');
      typedEl.textContent = words[2];
      wi = 2; ci = words[2].length; deleting = true;
      // Si se salteó la intro, mostramos "solutions" un momento (pausa real, no
      // salteable) para que se llegue a leer antes de que empiece a borrarse.
      await new Promise((r) => setTimeout(r, skipped ? 950 : 0));
      step();
    })().catch(function () {
      if (pickEl) pickEl.hidden = true;
      docEl.classList.remove('picking');
      document.body.classList.remove('intro-bg', 'on-dark');
      document.body.style.backgroundColor = '';
      l1.textContent = nameTxt; l2.textContent = design;
      lines.forEach((r) => r.classList.add('on'));
      docEl.classList.remove('home-intro');
      clearTimeout(window.__introSafety);
      step();
    });
  }
}

/* ---------- Cursor relleno con el color del trabajo (dentro de cada case) ----------
   Cada página de trabajo declara data-cursor con el color de su hover del home.
   Reemplazamos el cursor por un círculo relleno de ese color. */
(function () {
  const b = document.body;
  if (!b) return;
  const mkArrow = (fill) => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 28 28">' +
      '<path d="M4 2 L4 24 L10 18 L13.6 26.4 L17.1 24.8 L13.5 16.7 L21 16.7 Z" ' +
      'fill="' + fill + '" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '") 7 3, auto';
  };
  // Manito clásica de hover, con el mismo tamaño/estilo/color que la flecha
  const mkHand = (fill) => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 28 28">' +
      '<path d="M10.5 4c0-1.1.9-2 2-2s2 .9 2 2v6h.6V7.4c0-1.1.9-2 2-2s2 .9 2 2V11h.6V9.2' +
      'c0-1.1.9-2 2-2s2 .9 2 2v6.4c0 3.1-2.5 5.6-5.6 5.6h-2.2c-1.7 0-3.3-.8-4.3-2.1l-3.8-5' +
      'c-.7-.9-.5-2.2.5-2.8.6-.4 1.4-.4 2 0l.6.5V4Z" ' +
      'fill="' + fill + '" stroke="#fff" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '") 20 3, pointer';
  };
  // Elementos "hovereables" que muestran la manito
  const HOVER = ['a', 'button', 'summary', 'label[for]', '[role="button"]',
    '.svc-chip', '.menu-btn', '.intro-skip', '.lang summary', '.lang-pick__opt',
    '.pal-chip', '.dt-piece', '.fan .card', '.cf-web',
    '.car-btn', '.lt-arrow', '.pj-arrow', '.st-arrow', '.b-arrow', '.zone',
    '.asm-col', '.hotspot', '.lamp-switch', '.ig-actions svg',
    '.big-quote [data-quote]', '.daynight', 'model-viewer'];
  // Cada selector hovereable se expande a "S, S *": si no, al pasar el mouse
  // por un hijo (el ícono dentro del botón, el span dentro del chip) ganaba la
  // regla general de la flecha y el cursor parpadeaba entre flecha y manito.
  const expand = (prefix) =>
    HOVER.map((s) => prefix + s + ',' + prefix + s + ' *').join(',');

  const col = b.getAttribute('data-cursor');
  const st = document.createElement('style');
  if (col) {
    // Dentro de un trabajo: flecha (y manito) rellenas del color del trabajo
    const arrow = mkArrow(col), hand = mkHand(col);
    st.textContent = 'body.case, body.case *{cursor:' + arrow + ' !important;}' +
      expand('body.case ') + '{cursor:' + hand + ' !important;}';
  } else if (!b.classList.contains('case')) {
    // Homepage: flecha y manito negras; sobre las work-cards se mantiene el View
    const arrow = mkArrow('#111'), hand = mkHand('#111');
    st.textContent = 'body, body *{cursor:' + arrow + ' !important;}' +
      expand('body ') + '{cursor:' + hand + ' !important;}' +
      ' .work-card, .work-card *, .ball, .ball *{cursor:none !important;}';
  }
  document.head.appendChild(st);
})();

/* ---------- 2. Reveals al scrollear ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.io-reveal').forEach((el) => io.observe(el));

/* ---------- 3. Pill "View" que sigue el cursor ---------- */
const pill = document.getElementById('viewPill');
if (pill && !reduceMotion) {
  // tx/ty = posición real del mouse · cx/cy = posición del pill (persigue con lerp)
  let tx = 0, ty = 0, cx = 0, cy = 0, seen = false;

  let raf = null, active = 0;
  window.addEventListener('mousemove', (ev) => {
    tx = ev.clientX; ty = ev.clientY;
    // Antes del primer movimiento el pill no tiene posición: lo dejamos justo
    // debajo del mouse para que no aparezca volando desde la esquina.
    if (!seen) { seen = true; cx = tx; cy = ty; paint(); }
  }, { passive: true });

  function paint() {
    // transform en vez de left/top: no dispara layout en cada cuadro
    pill.style.setProperty('--x', cx + 'px');
    pill.style.setProperty('--y', cy + 'px');
  }

  function tick() {
    cx += (tx - cx) * 0.24;   // lerp: el pill persigue al mouse con suavidad
    cy += (ty - cy) * 0.24;
    paint();
    // El loop sólo corre mientras el mouse está sobre un trabajo (o terminando de acomodarse)
    if (active > 0 || Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) {
      raf = requestAnimationFrame(tick);
    } else { raf = null; }
  }

  document.querySelectorAll('.work-card').forEach((card) => {
    card.addEventListener('mouseenter', (ev) => {
      // Al entrar, el pill nace exactamente donde está el mouse (sin viaje raro
      // desde la última posición ni desde 0,0) y recién ahí empieza a seguirlo.
      tx = ev.clientX; ty = ev.clientY;
      cx = tx; cy = ty; seen = true;
      paint();
      active++; pill.classList.add('is-on');
      // El pill se rellena con el color del trabajo (con algo de transparencia)
      const bg = card.dataset.bg;
      if (bg) {
        const m = bg.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        pill.style.background = m
          ? 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',0.8)'
          : bg;
        pill.style.color = card.dataset.dark === '1' ? '#fff' : '#111';
      }
      if (!raf) raf = requestAnimationFrame(tick);
    });
    card.addEventListener('mouseleave', () => {
      active = Math.max(0, active - 1);
      if (active === 0) {
        pill.classList.remove('is-on');
        pill.style.background = '';
        pill.style.color = '';
      }
    });
  });
}

/* ---------- 4. Menú overlay (panel lateral) ---------- */
const menuBtn = document.getElementById('menuBtn');
const scrim = document.getElementById('menuScrim');

function closeMenu() { document.body.classList.remove('menu-open'); }

if (menuBtn) {
  menuBtn.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  // Al elegir una sección, cerramos y dejamos que el ancla haga el scroll suave
  document.querySelectorAll('.menu-overlay a').forEach((a) => a.addEventListener('click', closeMenu));
  if (scrim) scrim.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}

/* ---------- 5. Cerrar el selector de idioma al clickear afuera ---------- */
const lang = document.querySelector('.lang');
if (lang) {
  document.addEventListener('click', (e) => {
    if (!lang.contains(e.target)) lang.removeAttribute('open');
  });
}

/* ---------- 6. Envío del formulario de contacto (Web3Forms) ---------- */
/* Envía por AJAX para no salir de la página. Requiere el access_key
   configurado en el HTML (ver README). */
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

if (form && status) {
  const T = document.documentElement.lang === 'es'
    ? { sending: 'Enviando...', ok: '¡Gracias! Tu mensaje fue enviado.',
        err: 'No se pudo enviar. Probá de nuevo o escribime por mail.',
        nokey: 'Falta configurar el access key del formulario.' }
    : { sending: 'Sending...', ok: 'Thanks! Your message was sent.',
        err: "Couldn't send. Please try again or email me directly.",
        nokey: 'The form access key is not configured yet.' };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = form.querySelector('[name=access_key]').value;

    if (!key || key === 'TU_ACCESS_KEY_ACA') {
      status.textContent = T.nokey;
      status.className = 'form-status err';
      return;
    }

    status.textContent = T.sending;
    status.className = 'form-status';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      const data = await res.json();
      if (data.success) {
        status.textContent = T.ok;
        status.className = 'form-status ok';
        form.reset();
      } else {
        throw new Error(data.message || 'error');
      }
    } catch (err) {
      status.textContent = T.err;
      status.className = 'form-status err';
    }
  });
}

/* ---------- 4. Cabecera: se aclara al bajar ---------- */
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const MIN = 0.34;          // opacidad mínima (bien clarito, como el pill de idioma)
  const RANGE = 340;         // px de scroll para llegar al mínimo
  let ticking = false;
  function update() {
    const t = Math.min(window.scrollY / RANGE, 1);
    // La opacidad se aplica a cada control (no a todo el header), así el hover
    // puede devolverlos a 100% aunque el conjunto esté aclarado.
    header.style.setProperty('--hfade', (1 - t * (1 - MIN)).toFixed(3));
    ticking = false;
  }
  update();
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
})();

/* ---------- Home: el fondo cambia según el trabajo en hover (solo con mouse) ----------
   En touch (mobile/tablet) esto no se activa: ahí "hover" es en realidad el
   dedo tocando, y cambiar el fondo de toda la pantalla al tocar un trabajo
   no se ve bien y además queda pisado por el press. */
(function () {
  if (!window.matchMedia('(hover: hover)').matches) return;
  const cards = [...document.querySelectorAll('.work-card[data-bg]')];
  if (!cards.length) return;
  const reset = () => {
    document.body.style.backgroundColor = '';
    document.body.classList.remove('works-dark', 'works-bright');
  };
  cards.forEach((c) => {
    c.addEventListener('pointerenter', () => {
      document.body.style.backgroundColor = c.dataset.bg;
      document.body.classList.toggle('works-dark', c.dataset.dark === '1');
      document.body.classList.toggle('works-bright', c.dataset.bright === '1');
    });
    c.addEventListener('pointerleave', reset);
  });
})();

/* ---------- Servicios que filtran los trabajos (AND) ---------- */
(function () {
  const wrap = document.getElementById('serviceFilters');
  const works = document.querySelector('.works');
  if (!wrap || !works) return;

  const chips = [...wrap.querySelectorAll('.svc-chip[data-service]')];
  const cards = [...works.querySelectorAll('.work-card[data-services]')];
  const active = new Set();

  const empty = document.createElement('p');
  empty.className = 'works-empty';
  empty.hidden = true;
  empty.textContent = works.closest('[lang="es"]') || document.documentElement.lang === 'es'
    ? 'No hay trabajos que combinen esos servicios.'
    : 'No work matches that combination of services.';
  works.appendChild(empty);

  function apply() {
    let visible = 0;
    cards.forEach((c) => {
      const svs = (c.dataset.services || '').split(/\s+/);
      const show = [...active].every((a) => svs.includes(a));
      c.classList.toggle('filtered-out', !show);
      if (show) visible++;
    });
    empty.hidden = visible !== 0;
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const s = chip.dataset.service;
      if (active.has(s)) active.delete(s); else active.add(s);
      chip.classList.toggle('active', active.has(s));
      apply();
    });
  });
})();

/* ---------- Volver arriba ----------
   Aparece en cuanto se scrollea un poco, en cualquier página, para poder subir
   desde cualquier punto sin tener que cruzar los elementos interactivos de arriba. */
(function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const UMBRAL = 400;
  const onScroll = () => { btn.classList.toggle('show', window.scrollY > UMBRAL); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ---------- Pileta de bolitas del footer ----------
   Una bolita por trabajo, con el color de ese trabajo. Gravedad simple, chocan
   entre sí y contra los bordes de la pileta, y cada scroll les da un empujón —
   como si el movimiento de la página las sacudiera. Al pasar el mouse por una:
   aparece "View"/"Ver" en la bolita y la portada del trabajo lo sigue de cerca. */
(function () {
  try {
  const pit = document.getElementById('ballPit');
  const balls = pit ? [...pit.querySelectorAll('.ball')] : [];
  if (!pit || !balls.length) return;
  const preview = document.getElementById('ballPreview');
  const previewImg = preview ? preview.querySelector('img') : null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const R = 26, G = 0.22, REBOTE = 0.3, FRICCION = 0.85;
  // el tope de subida es más chico que el de caída: pesan, pero el scroll
  // igual las hace moverse un poco (no quedan como pegadas/congeladas)
  const VMAX_ABAJO = 8, VMAX_ARRIBA = 3, VMAX_X = 4;
  let W = 0, H = 0;
  function medir() {
    const r = pit.getBoundingClientRect();
    W = r.width; H = r.height;
  }
  medir();
  // El primer cuadro, con hojas de estilo todavía asentándose, puede medir 0.
  // Un reintento en el siguiente cuadro evita que la pileta arranque colapsada.
  if (!W || !H) requestAnimationFrame(medir);
  window.addEventListener('resize', medir);
  pit.classList.add('is-physics');

  // arrancan agrupadas del lado derecho de la pileta, no repartidas por todo
  // el ancho — se apilan entre sí al caer, como pide el diseño.
  const xDerecha = Math.min(Math.max((W || 300) * 0.82, R), (W || 300) - R);
  const cuerpos = balls.map((el, i) => ({
    el,
    x: Math.min(Math.max(xDerecha - (i % 3) * (R * 0.7), R), (W || 300) - R),
    y: -30 - i * 38,               // arrancan arriba de la pileta: caen al cargar
    vx: (Math.random() - 0.5) * 1.2,
    vy: 0,
    entro: false,                  // true recién cuando toca el piso por primera vez
    dragging: false,               // true mientras el mouse/dedo la sostiene
  }));

  // ---- arrastre: cada bolita se puede tomar y mover con el mouse/dedo ----
  balls.forEach((el, idx) => {
    const c = cuerpos[idx];
    let moved = false, startX = 0, startY = 0, lastX = 0, lastY = 0, lastT = 0;
    // por ser un <a href>, el navegador intenta arrancar SU propio drag del
    // link (para arrastrarlo a otra pestaña, etc.) y eso pisa el arrastre
    // nuestro: lo frenamos acá además del draggable="false" en el HTML.
    el.addEventListener('dragstart', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      c.dragging = true;
      c.vx = 0; c.vy = 0;
      moved = false;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      lastT = performance.now();
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* no-op */ }
    });
    el.addEventListener('pointermove', (e) => {
      if (!c.dragging) return;
      const rPit = pit.getBoundingClientRect();
      const limiteW = W || rPit.width, limiteH = H || rPit.height;
      let nx = e.clientX - rPit.left;
      let ny = e.clientY - rPit.top;
      nx = Math.min(Math.max(nx, R), limiteW - R);
      ny = Math.min(Math.max(ny, R), limiteH - R);
      c.x = nx; c.y = ny;
      c.el.style.transform = 'translate3d(' + Math.round(c.x - R) + 'px,' + Math.round(c.y - R) + 'px,0)';
      if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) moved = true;
      const ahora = performance.now();
      const dt = Math.max(1, ahora - lastT);
      // velocidad aprox. en "px por cuadro" (~16ms): al soltarla sigue con
      // algo del impulso, como si la hubieras tirado.
      c.vx = (e.clientX - lastX) / dt * 16;
      c.vy = (e.clientY - lastY) / dt * 16;
      lastX = e.clientX; lastY = e.clientY; lastT = ahora;
    });
    function soltar(e) {
      if (!c.dragging) return;
      c.dragging = false;
      c.entro = true; // ya "aterrizó" una vez: respeta el techo de la pileta
      try { el.releasePointerCapture(e.pointerId); } catch (_) { /* no-op */ }
    }
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    // si hubo arrastre, ese gesto no debe además navegar al trabajo
    el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } });
  });

  function paso() {
    for (const c of cuerpos) {
      if (c.dragging) continue;   // la mueve el puntero, no la física
      c.vy += G;
      // tope de velocidad asimétrico: caen con ganas, casi no suben
      if (c.vy > VMAX_ABAJO) c.vy = VMAX_ABAJO; else if (c.vy < -VMAX_ARRIBA) c.vy = -VMAX_ARRIBA;
      if (c.vx > VMAX_X) c.vx = VMAX_X; else if (c.vx < -VMAX_X) c.vx = -VMAX_X;
      c.x += c.vx;
      c.y += c.vy;
      if (c.x - R < 0) { c.x = R; c.vx *= -REBOTE; }
      if (c.x + R > W) { c.x = W - R; c.vx *= -REBOTE; }
      if (c.y + R > H) {
        c.y = H - R;
        c.vy *= -REBOTE;
        c.vx *= FRICCION;
        if (Math.abs(c.vy) < 0.4) c.vy = 0;
        c.entro = true;
      }
      // techo de la pileta: una vez asentada, no puede volver a salirse por
      // arriba y superponerse con lo que hay más arriba (ej: la caja de
      // contacto) — choca contra ese borde en lugar de pasarle por encima.
      if (c.entro && c.y - R < 0) {
        c.y = R;
        c.vy *= -REBOTE;
      }
    }
    // colisiones entre bolitas: separar por superposición y repartir la velocidad
    for (let pasada = 0; pasada < 2; pasada++) {
      for (let i = 0; i < cuerpos.length; i++) {
        for (let j = i + 1; j < cuerpos.length; j++) {
          const a = cuerpos[i], b = cuerpos[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const min = R * 2;
          if (dist < min) {
            const superpos = (min - dist) / 2;
            const nx = dx / dist, ny = dy / dist;
            if (a.dragging && !b.dragging) {
              // la que se arrastra no se mueve por el choque: empuja a la otra
              b.x += nx * superpos * 2; b.y += ny * superpos * 2;
              b.vx += nx * 1.2; b.vy += ny * 1.2;
            } else if (b.dragging && !a.dragging) {
              a.x -= nx * superpos * 2; a.y -= ny * superpos * 2;
              a.vx -= nx * 1.2; a.vy -= ny * 1.2;
            } else if (!a.dragging && !b.dragging) {
              a.x -= nx * superpos; a.y -= ny * superpos;
              b.x += nx * superpos; b.y += ny * superpos;
              const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (rel < 0) {
                const imp = -rel * 0.5;
                a.vx -= imp * nx; a.vy -= imp * ny;
                b.vx += imp * nx; b.vy += imp * ny;
              }
            }
          }
        }
      }
    }
    for (const c of cuerpos) {
      if (c.dragging) continue; // ya se pinta en vivo en pointermove
      c.el.style.transform = 'translate3d(' + Math.round(c.x - R) + 'px,' + Math.round(c.y - R) + 'px,0)';
    }
  }

  if (reduceMotion) {
    // sin movimiento: quedan asentadas prolijas sobre la línea, sin caer ni temblar
    // mismo criterio que en reposo: agrupadas hacia la derecha, no repartidas
    cuerpos.forEach((c, i) => {
      c.x = Math.min(Math.max(xDerecha - (i % 3) * (R * 0.7), R), W - R);
      c.y = H - R;
      c.el.style.transform = 'translate3d(' + Math.round(c.x - R) + 'px,' + Math.round(c.y - R) + 'px,0)';
    });
  } else {
    // Se frena mientras la pileta no está a la vista (la mayor parte del
    // scroll, ya que vive en el footer): antes corría la física a 60fps todo
    // el tiempo, aunque estuviera lejísimos, compitiendo por el mismo hilo
    // principal que el resto de la página.
    let visiblePit = true;
    if ('IntersectionObserver' in window) {
      const ioPit = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => { visiblePit = e.isIntersecting; });
      }, { rootMargin: '200px 0px' });
      ioPit.observe(pit);
    }
    (function tick() { if (visiblePit) paso(); requestAnimationFrame(tick); })();
    let ultimoScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const delta = window.scrollY - ultimoScrollY;
      ultimoScrollY = window.scrollY;
      if (!delta) return;
      // empujón mucho más sutil: apenas una cosquilla, no un golpe
      // empujón moderado: se notan al scrollear, sin dispararse arriba del todo
      const empuje = Math.max(-2.2, Math.min(2.2, delta * 0.03));
      cuerpos.forEach((c) => {
        c.vy -= empuje * (0.35 + Math.random() * 0.25);
        c.vx += (Math.random() - 0.5) * Math.abs(empuje) * 0.35;
      });
    }, { passive: true });
  }

  // ---- hover: "View"/"Ver" en la bolita + portada siguiendo al mouse ----
  if (preview && previewImg) {
    let tx = 0, ty = 0, px = 0, py = 0, seguido = false, rafPrev = null;
    // tamaño de la miniatura (ver .ball-preview / img en el CSS) — para saber
    // si entra a la derecha/abajo del cursor o hay que abrirla al otro lado
    const ANCHO_PREVIEW = 150, ALTO_PREVIEW = 96, MARGEN = 18, AIRE = 10;
    function pintarPreview() {
      preview.style.setProperty('--x', px + 'px');
      preview.style.setProperty('--y', py + 'px');
      preview.classList.toggle('flip-x', px + MARGEN + ANCHO_PREVIEW + AIRE > window.innerWidth);
      preview.classList.toggle('flip-y', py + MARGEN + ALTO_PREVIEW + AIRE > window.innerHeight);
    }
    function tickPreview() {
      px += (tx - px) * 0.3;
      py += (ty - py) * 0.3;
      pintarPreview();
      if (Math.abs(tx - px) > 0.4 || Math.abs(ty - py) > 0.4) {
        rafPrev = requestAnimationFrame(tickPreview);
      } else { rafPrev = null; }
    }
    window.addEventListener('mousemove', (ev) => {
      tx = ev.clientX; ty = ev.clientY;
      if (!seguido) { seguido = true; px = tx; py = ty; pintarPreview(); }
      if (!rafPrev) rafPrev = requestAnimationFrame(tickPreview);
    }, { passive: true });

    balls.forEach((b) => {
      b.addEventListener('mouseenter', () => {
        previewImg.src = b.dataset.cover;
        previewImg.alt = b.dataset.title || '';
        preview.classList.add('is-on');
      });
      b.addEventListener('mouseleave', () => {
        preview.classList.remove('is-on');
      });
    });
  }
  } catch (err) {
    // Si algo de la física falla, la pileta se queda en la fila prolija que ya
    // pone el CSS por defecto (ver .ball-pit sin .is-physics): se sigue viendo.
    console.warn('[bolitas] no se pudo iniciar la física', err);
  }
})();
