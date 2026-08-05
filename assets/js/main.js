/* ============================================================
   Sara Iglesias — Portfolio · Animaciones e interacciones
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Grain natural (todo el sitio) ----------
   feTurbulence con la "semilla" animada: el ruido se regenera en cada
   cuadro (parpadea en el lugar, no se desplaza en bloque). El filtro corre
   sobre un mosaico chico que se tilea → liviano. */
(function () {
  if (document.querySelector('.grain-layer')) return;
  const layer = document.createElement('div');
  layer.className = 'grain-layer';
  layer.setAttribute('aria-hidden', 'true');
  const anim = reduceMotion ? '' :
    '<animate attributeName="seed" values="2;9;4;13;6;11;3;15" dur="0.55s" calcMode="discrete" repeatCount="indefinite"/>';
  layer.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">' +
      '<defs>' +
        '<filter id="grainF" x="0" y="0" width="100%" height="100%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed="2">' + anim + '</feTurbulence>' +
          '<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 -0.5"/>' +
        '</filter>' +
        '<pattern id="grainP" width="160" height="160" patternUnits="userSpaceOnUse">' +
          '<rect width="160" height="160" filter="url(#grainF)"/>' +
        '</pattern>' +
      '</defs>' +
      '<rect width="100%" height="100%" fill="url(#grainP)"/>' +
    '</svg>';
  (document.body || document.documentElement).appendChild(layer);
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
    if (skipBtn) skipBtn.classList.add('show');  // botón para saltear la intro
    (async function () {
      lines[0].classList.add('on');
      await sleep(500);                          // página en blanco un instante
      if (c1) c1.style.display = '';             // aparece el cursor
      await sleep(150);
      await typeStr(l1, greet, 120);             // "Hi!"
      await sleep(280);
      await eraseAll(l1, 55);                    // se borra (más rápido)
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
    '.svc-chip', '.menu-btn', '.intro-skip', '.lang summary',
    '.pal-chip', '.dt-piece', '.fan .card', '.cf-web',
    '.car-btn', '.lt-arrow', '.pj-arrow', '.st-arrow', '.b-arrow', '.zone',
    '.asm-col', '.hotspot', '.lamp-switch', '.ig-actions svg',
    '.big-quote [data-quote]', '.daynight', 'model-viewer'];
  const col = b.getAttribute('data-cursor');
  const st = document.createElement('style');
  if (col) {
    // Dentro de un trabajo: flecha (y manito) rellenas del color del trabajo
    const arrow = mkArrow(col), hand = mkHand(col);
    st.textContent = 'body.case, body.case *{cursor:' + arrow + ' !important;}' +
      HOVER.map(s => 'body.case ' + s).join(',') + '{cursor:' + hand + ' !important;}';
  } else if (!b.classList.contains('case')) {
    // Homepage: flecha y manito negras; sobre las work-cards se mantiene el View
    const arrow = mkArrow('#111'), hand = mkHand('#111');
    st.textContent = 'body, body *{cursor:' + arrow + ' !important;}' +
      HOVER.map(s => 'body ' + s).join(',') + '{cursor:' + hand + ' !important;}' +
      ' .work-card, .work-card *{cursor:none !important;}';
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
  let tx = 0, ty = 0, cx = 0, cy = 0;

  let raf = null, active = 0;
  window.addEventListener('mousemove', (ev) => { tx = ev.clientX; ty = ev.clientY; }, { passive: true });

  function tick() {
    cx += (tx - cx) * 0.18;   // lerp: el pill persigue al mouse con suavidad
    cy += (ty - cy) * 0.18;
    pill.style.left = cx + 'px';
    pill.style.top = cy + 'px';
    // El loop sólo corre mientras el mouse está sobre un trabajo (o terminando de acomodarse)
    if (active > 0 || Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) {
      raf = requestAnimationFrame(tick);
    } else { raf = null; }
  }

  document.querySelectorAll('.work-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
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

/* ---------- Home: el fondo cambia según el trabajo en hover ---------- */
(function () {
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
