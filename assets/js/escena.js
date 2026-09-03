/* ============================================================
   escena.js — visor 3D del living de Sara
   Autocontenido: si algo falla, falla solo. No toca el resto de la web.
   ============================================================ */

// Three.js va empaquetado en el sitio, no por CDN: sin dependencia de terceros,
// sin importmap, y no se rompe si el CDN se cae.
import { THREE, GLTFLoader, DRACOLoader, RoomEnvironment } from './vendor/three-bundle.js';
import { FICHAS } from './contenido.js';

/* ---- perillas: todo lo ajustable vive acá ---- */
const CONFIG = {
  // Rutas resueltas contra la ubicación de este archivo: así funcionan igual
  // desde /index.html y desde /es/index.html.
  modelo: new URL('../models/escritorio.glb', import.meta.url).href,
  draco: new URL('./vendor/draco/', import.meta.url).href,

  giroSegundos: 90,       // cuánto tarda una vuelta completa
  anguloVertical: 26,     // grados sobre el horizonte. Más alto = más desde arriba.

  aire: 0.94,             // 1 = la escena toca los bordes. Menos = más margen.
  encuadreX: 0.00,        // corre la escena a la DERECHA (fracción del ancho)
  encuadreY: 0.02,        // corre la escena hacia ARRIBA (fracción del alto)

  duracionVista: 1.15,    // segundos del movimiento hasta la vista de frente

  // La escena es bastante más ancha en una diagonal que en la otra. Con distancia fija
  // para toda la vuelta manda el peor ángulo, y en los demás sobra blanco. En false la
  // distancia acompaña al ángulo y la escena queda hasta un 20% más grande; el cambio es
  // gradualísimo (una vuelta dura 90 s) y ya no pega tirones. Poné true si preferís que
  // el tamaño no se mueva nunca.
  distanciaConstante: false,

  realce: 0.22,           // cuánto sube el brillo del objeto bajo el mouse
  brillo: 0.14,           // emisión suave que se le suma, del color del objeto

  exposicion: 1.00,       // brillo general
  sombra: 0.14,           // opacidad de la sombra en el piso
};

export function iniciarEscena(lienzo, ficha) {
  if (!lienzo) return null;

  /* ---- ¿este visitante puede? Si no, se queda el estado sin 3D ---- */
  const test = document.createElement('canvas');
  const hayWebGL = !!(window.WebGLRenderingContext && (test.getContext('webgl2') || test.getContext('webgl')));
  const pocaMemoria = navigator.deviceMemory && navigator.deviceMemory < 4;
  const ahorroDatos = navigator.connection && navigator.connection.saveData;
  if (!hayWebGL || pocaMemoria || ahorroDatos) { lienzo.classList.add('escena-sin-3d'); return null; }

  let menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const escena = new THREE.Scene();
  escena.background = null;                     // el blanco lo pone el CSS
  const camara = new THREE.PerspectiveCamera(34, 1, 0.05, 100);

  const render = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  render.setClearColor(0x000000, 0);            // canvas transparente: el fondo lo pone la página
  render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  render.outputColorSpace = THREE.SRGBColorSpace;
  render.toneMapping = THREE.ACESFilmicToneMapping;
  render.toneMappingExposure = CONFIG.exposicion;
  render.shadowMap.enabled = true;
  render.shadowMap.type = THREE.PCFSoftShadowMap;
  render.domElement.classList.add('escena-canvas');
  lienzo.appendChild(render.domElement);

  /* ---- luz ----
     Con luces directas nada más quedaba mucho más contrastado que en Blender: ahí el
     "World" ilumina desde todas las direcciones y acá eso no existía. La solución es un
     entorno que haga de cielo, y bajarle bastante a la luz dura. */
  const pmrem = new THREE.PMREMGenerator(render);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.72;

  escena.add(new THREE.HemisphereLight(0xffffff, 0xe6eaee, 0.75));
  const sol = new THREE.DirectionalLight(0xfff6ea, 1.4);
  // Sol casi cenital a propósito. La sombra cuenta para el encuadre, y con un sol bajo se
  // estira hacia adelante: en los ángulos donde apunta a la cámara obligaba a alejarse un
  // 38%. Casi desde arriba, la sombra queda compacta bajo los muebles.
  sol.position.set(2, 17, 1.6);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.bias = -0.0005;
  sol.shadow.normalBias = 0.02;
  escena.add(sol);

  /* ---- NO hay piso: sólo la sombra. Así no existe borde con el fondo blanco ---- */
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ opacity: CONFIG.sombra })
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.receiveShadow = true;
  escena.add(sombra);

  let mezclador = null, listo = false;
  let clickeables = [], hover = null, elegido = null;
  let angulo = 0;
  let mov = null;                                 // movimiento en curso hacia una vista
  let esquinas = [];                              // las 8 puntas de la escena, en mundo
  let mira = new THREE.Vector3(), miraDestino = new THREE.Vector3();
  let ejeGiro = new THREE.Vector3();              // centro alrededor del cual orbita la cámara
  let dist = 6, distDestino = 6, alturaMira = 1, distFija = 6, distObjetivo = 6;
  let elev = CONFIG.anguloVertical;
  let recorteOk = false;          // true sólo mientras hay un objeto con `zoom` propio
  const reloj = new THREE.Clock();

  /* ---- carga ---- */
  const draco = new DRACOLoader().setDecoderPath(CONFIG.draco);
  const cargador = new GLTFLoader().setDRACOLoader(draco);

  cargador.load(CONFIG.modelo, (gltf) => {
    const raiz = gltf.scene;

    raiz.traverse((n) => {
      if (!n.isMesh) return;
      n.castShadow = true;
      n.receiveShadow = true;
      // Material propio por malla: sin esto, resaltar el sillón resalta todo lo que
      // comparta material con él.
      n.material = Array.isArray(n.material) ? n.material.map((m) => m.clone()) : n.material.clone();
    });

    // Los 24 clips salen de Blender con la misma duración exacta, por eso no se desfasan.
    mezclador = new THREE.AnimationMixer(raiz);
    gltf.animations.forEach((c) => mezclador.clipAction(c).setLoop(THREE.LoopRepeat, Infinity).play());

    // Centrar sobre el eje de giro y apoyar en el piso
    const caja = new THREE.Box3().setFromObject(raiz);
    const centro = caja.getCenter(new THREE.Vector3());
    const tam = caja.getSize(new THREE.Vector3());
    raiz.position.set(-centro.x, -caja.min.y, -centro.z);
    escena.add(raiz);

    // El encuadre se calcula proyectando la SILUETA REAL de la escena, no su caja
    // envolvente. La caja reserva las cuatro esquinas del piso, que están vacías: con la
    // cámara mirando desde arriba esas esquinas se comen buena parte del cuadro y la
    // escena terminaba ocupando un tercio del ancho.
    // OJO: hay que refrescar las matrices después de mover la raíz, si no las cajas de
    // cada malla vienen en las coordenadas viejas y la silueta sale corrida.
    raiz.updateMatrixWorld(true);
    const pts = [];
    raiz.traverse((n) => {
      if (!n.isMesh) return;
      const b = new THREE.Box3().setFromObject(n);
      if (!isFinite(b.min.x)) return;
      for (const x of [b.min.x, b.max.x])
        for (const z of [b.min.z, b.max.z])
          pts.push([x, z, b.max.y]);
    });
    // Silueta: para 48 direcciones se busca el punto de la planta más lejano en esa
    // dirección. El resultado son vértices reales de la envolvente, sin implementar un
    // casco convexo (lo intenté y me salió asimétrico, que es peor que la caja).
    const N = 48, extremos = new Set();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
      let mejor = -Infinity, cual = null;
      for (const p of pts) {
        const v = p[0] * dx + p[1] * dz;
        if (v > mejor) { mejor = v; cual = p; }
      }
      if (cual) extremos.add(cual);
    }
    const casco = [...extremos];
    const techo = tam.y;
    const desvX = -sol.position.x / sol.position.y, desvZ = -sol.position.z / sol.position.y;
    esquinas = [];
    for (const [x, z] of casco) {
      esquinas.push(new THREE.Vector3(x, 0, z));
      esquinas.push(new THREE.Vector3(x, techo, z));
      // la sombra también es parte de la imagen
      esquinas.push(new THREE.Vector3(x + desvX * techo, 0, z + desvZ * techo));
    }
    console.log('[escena] silueta:', casco.length, 'puntos ->', esquinas.length, 'para el encuadre');

    alturaMira = tam.y * 0.45;
    mira.set(0, alturaMira, 0);
    miraDestino.copy(mira);
    dist = distDestino = Math.hypot(tam.x, tam.z);

    const r = Math.hypot(tam.x, tam.z) / 2;
    sol.shadow.camera.left = -r * 1.6; sol.shadow.camera.right = r * 1.6;
    sol.shadow.camera.top = r * 1.6;   sol.shadow.camera.bottom = -r * 1.6;
    sol.shadow.camera.far = r * 12;
    sol.shadow.camera.updateProjectionMatrix();

    Object.keys(FICHAS).forEach((clave) => {
      const nodo = raiz.getObjectByName('obj_click_' + clave);
      if (!nodo) { console.warn('[escena] falta obj_click_' + clave); return; }
      const mats = [];
      nodo.traverse((n) => {
        if (!n.isMesh) return;
        (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => mats.push({
          mat: m,
          color: m.color ? m.color.clone() : null,
          emisivo: m.emissive ? m.emissive.clone() : null,
        }));
      });
      // Vista por defecto: se mira desde el lado donde está el objeto. Así queda de
      // frente a la cámara y sin nada delante. Los que tienen `vista` en contenido.js
      // pisan este valor.
      const c = new THREE.Box3().setFromObject(nodo).getCenter(new THREE.Vector3());
      const vistaAuto = THREE.MathUtils.radToDeg(Math.atan2(c.x, c.z));
      clickeables.push({ nodo, clave, mats, vistaAuto });
    });

    prepararPantallaTV(raiz);

    listo = true;
    lienzo.classList.add('escena-lista');
    medir();
    buscarEjeGiro();
    mira.set(ejeGiro.x, alturaMira, ejeGiro.z);
    miraDestino.copy(mira);
    ajustarAlto();
    dist = distDestino = distObjetivo = distFija;
  }, undefined, (err) => {
    console.warn('[escena] no se pudo cargar el modelo', err);
    lienzo.classList.add('escena-sin-3d');
  });

  /* ---- encuadre ---- */
  function medirBasico() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    if (!w || !h) return;
    render.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  function medir() {
    medirBasico();
    if (listo) { buscarEjeGiro(); ajustarAlto(); }   // el encuadre depende de la forma del cuadro
  }

  function fovs() {
    const fv = THREE.MathUtils.degToRad(camara.fov);
    return { fv, fh: 2 * Math.atan(Math.tan(fv / 2) * camara.aspect) };
  }

  // Coloca la cámara a distancia d, con el giro y el ángulo cenital.
  function colocar(d) {
    const a = THREE.MathUtils.degToRad(elev);
    camara.position.set(
      mira.x + Math.sin(angulo) * d * Math.cos(a),
      mira.y + Math.sin(a) * d,
      mira.z + Math.cos(angulo) * d * Math.cos(a)
    );
    camara.lookAt(mira);
    const { fv, fh } = fovs();
    // El encuadre mueve la CÁMARA sin girarla, así la escena se desplaza en cuadro sin
    // deformar la perspectiva. La ficha ya NO mueve nada: va por encima.
    camara.translateX(-CONFIG.encuadreX * 2 * d * Math.tan(fh / 2));
    camara.translateY(-CONFIG.encuadreY * 2 * d * Math.tan(fv / 2));
    camara.updateMatrixWorld(true);
  }

  // Cuánto se sale la escena del cuadro. 1 = justo en el borde, >1 = cortada.
  function exceso(soloAlto) {
    let m = 0;
    const v = new THREE.Vector3();
    for (const p of esquinas) {
      v.copy(p).project(camara);
      m = soloAlto ? Math.max(m, Math.abs(v.y)) : Math.max(m, Math.abs(v.x), Math.abs(v.y));
    }
    return m;
  }

  // Una sola distancia para TODA la vuelta: la del peor ángulo. Antes se recalculaba en
  // cada cuadro y la escena se acercaba y alejaba sola mientras giraba.
  // El eje de giro por defecto es el centro de la caja, pero la escena no es simétrica:
  // con ese eje, el ángulo peor exigía mucha más distancia que el mejor, y como la
  // distancia es fija para toda la vuelta, ese peor caso encogía la escena todo el tiempo.
  // Se busca el eje que minimiza el peor ángulo.
  function buscarEjeGiro() {
    if (!esquinas.length) return;
    const gEje = ejeGiro.clone();
    let mejor = { x: 0, z: 0, d: Infinity };
    let paso = 0.45;
    for (let ronda = 0; ronda < 3; ronda++) {
      const cx = mejor.x, cz = mejor.z;
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          ejeGiro.set(cx + i * paso / 2, 0, cz + j * paso / 2);
          const d = peorDistancia(18);
          if (d < mejor.d) mejor = { x: ejeGiro.x, z: ejeGiro.z, d };
        }
      }
      paso /= 2.5;
    }
    ejeGiro.set(mejor.x, 0, mejor.z);
    if (!isFinite(mejor.d)) ejeGiro.copy(gEje);
  }

  function peorDistancia(muestras) {
    const gAng = angulo, gElev = elev, gMira = mira.clone();
    mira.set(ejeGiro.x, alturaMira, ejeGiro.z); elev = CONFIG.anguloVertical;
    let maximo = 0;
    for (let i = 0; i < muestras; i++) {
      angulo = (i / muestras) * Math.PI * 2;
      let d = dist || 6;
      for (let k = 0; k < 4; k++) { colocar(d); d *= exceso() / CONFIG.aire; }
      maximo = Math.max(maximo, d);
    }
    angulo = gAng; elev = gElev; mira.copy(gMira);
    return maximo;
  }

  // Cuánto del alto del cuadro llega a ocupar la escena en el peor ángulo. Sirve para
  // recortar el alto de la sección y que no sobre una banda blanca arriba y abajo.
  function ocupacionVertical() {
    const gAng = angulo, gElev = elev, gMira = mira.clone();
    mira.set(ejeGiro.x, alturaMira, ejeGiro.z); elev = CONFIG.anguloVertical;
    let m = 0;
    const v = new THREE.Vector3();
    for (let i = 0; i < 24; i++) {
      angulo = (i / 24) * Math.PI * 2;
      colocar(distFija);
      for (const p of esquinas) { v.copy(p).project(camara); m = Math.max(m, Math.abs(v.y)); }
    }
    angulo = gAng; elev = gElev; mira.copy(gMira);
    return m;
  }

  // Ajusta el alto de la sección al de la escena. Si no, el encuadre entra por el ancho y
  // queda una franja blanca arriba y abajo que no se puede llenar con nada.
  let ajustando = false;
  function ajustarAlto() {
    if (ajustando || !esquinas.length) return;
    const seccion = lienzo.closest('.escena-seccion');
    if (!seccion) return;
    ajustando = true;
    seccion.style.height = '';                    // partir del alto del CSS
    medirBasico();
    calcularDistanciaFija();
    const oc = ocupacionVertical();
    if (isFinite(oc) && oc > 0.2) {
      const alto = lienzo.clientHeight * (oc / CONFIG.aire);
      const tope = window.innerHeight * 0.92, piso = window.innerHeight * 0.42;
      seccion.style.height = Math.round(Math.min(tope, Math.max(piso, alto))) + 'px';
      medirBasico();
      calcularDistanciaFija();
    }
    ajustando = false;
  }

  function calcularDistanciaFija() {
    if (!esquinas.length) return;
    const gAng = angulo, gElev = elev, gMira = mira.clone();
    mira.set(ejeGiro.x, alturaMira, ejeGiro.z); elev = CONFIG.anguloVertical;
    let maximo = 0;
    for (let a = 0; a < 360; a += 5) {
      angulo = THREE.MathUtils.degToRad(a);
      let d = dist || 6;
      for (let i = 0; i < 4; i++) { colocar(d); d *= exceso() / CONFIG.aire; }
      maximo = Math.max(maximo, d);
    }
    distFija = maximo;
    if (!elegido) distObjetivo = maximo;
    angulo = gAng; elev = gElev; mira.copy(gMira);
  }

  // El mayor zoom posible sobre un objeto SIN que la escena se corte. La cámara no puede
  // acercarse más allá de lo que permite el encuadre, pero sí puede correr el punto de
  // mira hacia el objeto: eso lo centra y lo agranda, a costa de algo de distancia. Se
  // prueban varias mezclas y se elige la que deja el objeto más grande.
  function mejorEncuadre(nodo, angFin, elevFin) {
    const gAng = angulo, gElev = elev, gMira = mira.clone();
    angulo = angFin; elev = elevFin;
    const centroEscena = new THREE.Vector3(ejeGiro.x, alturaMira, ejeGiro.z);
    const bb = new THREE.Box3().setFromObject(nodo);
    const centroObj = bb.getCenter(new THREE.Vector3());
    const puntos = [];
    for (const x of [bb.min.x, bb.max.x])
      for (const y of [bb.min.y, bb.max.y])
        for (const z of [bb.min.z, bb.max.z])
          puntos.push(new THREE.Vector3(x, y, z));

    let mejor = { mira: centroEscena.clone(), dist: distFija, tam: -1 };
    const v = new THREE.Vector3();
    for (const f of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      mira.lerpVectors(centroEscena, centroObj, f);
      let d = distFija;
      for (let i = 0; i < 5; i++) { colocar(d); d *= exceso() / CONFIG.aire; }
      colocar(d);
      // tamaño del objeto en pantalla con ese encuadre
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (const p of puntos) {
        v.copy(p).project(camara);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x);
        y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      const tam = Math.min(x1 - x0, y1 - y0);
      if (tam > mejor.tam) mejor = { mira: mira.clone(), dist: d, tam };
    }
    angulo = gAng; elev = gElev; mira.copy(gMira);
    return mejor;
  }

  /* ---- interacción ---- */
  const rayo = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  let hayPuntero = false;

  function moverPuntero(ev) {
    const r = lienzo.getBoundingClientRect();
    puntero.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    puntero.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    hayPuntero = true;
  }

  function bajoCursor() {
    if (!listo || !hayPuntero) return null;
    rayo.setFromCamera(puntero, camara);
    const g = rayo.intersectObjects(clickeables.map((c) => c.nodo), true);
    if (!g.length) return null;
    let n = g[0].object;
    while (n && !(n.name || '').startsWith('obj_click_')) n = n.parent;
    return clickeables.find((c) => c.nodo === n) || null;
  }

  function resaltar(item, activo) {
    // Mezclar con blanco desaturaba: sobre el verde oscuro del sillón, un 15% hacia el
    // blanco multiplica el canal rojo por ocho y lo deja gris. Se sube el brillo de forma
    // proporcional y se le suma una emisión del propio color.
    item.mats.forEach(({ mat, color, emisivo }) => {
      if (color && mat.color) {
        if (activo) mat.color.copy(color).multiplyScalar(1 + CONFIG.realce);
        else mat.color.copy(color);
      }
      if (emisivo && mat.emissive) {
        if (activo && color) mat.emissive.copy(emisivo).add(color.clone().multiplyScalar(CONFIG.brillo));
        else mat.emissive.copy(emisivo);
      }
    });
  }

  function elegir(item) {
    if (elegido && elegido !== item) resaltar(elegido, false);
    elegido = item || null;

    if (elegido) {
      resaltar(elegido, true);
      const f = FICHAS[elegido.clave];
      // TODOS los objetos tienen vista: la de contenido.js si la definiste, si no la
      // automática. Antes, los que no tenían quedaban quietos y parecía que se colgaba.
      const grados = f.vista ?? elegido.vistaAuto;
      const objetivo = THREE.MathUtils.degToRad(grados);
      // por el camino más corto, sin dar la vuelta larga
      const angFin = angulo + (((objetivo - angulo) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      const elevFin = f.alturaVista ?? CONFIG.anguloVertical;
      const enc = mejorEncuadre(elegido.nodo, angFin, elevFin);
      miraDestino.copy(enc.mira);
      // `zoom` en contenido.js acerca más de lo que permitiría el "no cortar nunca".
      // Es una excepción explícita por objeto, no el comportamiento general.
      recorteOk = f.zoom !== undefined;
      distObjetivo = enc.dist * (f.zoom ?? 1);
      if (recorteOk) miraDestino.lerp(new THREE.Box3().setFromObject(elegido.nodo).getCenter(new THREE.Vector3()), 0.95);
      arrancarMovimiento(angFin, elevFin, miraDestino);
      mostrarFicha(elegido.clave);
    } else {
      miraDestino.set(ejeGiro.x, alturaMira, ejeGiro.z);
      distObjetivo = distFija;
      recorteOk = false;
      arrancarMovimiento(angulo, CONFIG.anguloVertical, miraDestino);
      ocultarFicha();
    }
  }

  // El movimiento hacia una vista arranca y termina despacio, y va parejo en giro, altura
  // y punto de mira, para que se lea como un solo gesto.
  function arrancarMovimiento(angFin, elevFin, miraFin) {
    mov = {
      t: 0, dur: menosMovimiento ? 0.001 : CONFIG.duracionVista,
      ang0: angulo, ang1: angFin,
      elev0: elev, elev1: elevFin,
      mira0: mira.clone(), mira1: miraFin.clone(),
      // el zoom viaja con el mismo gesto que el giro: si no, se sentía un salto brusco al
      // alejarse (por ejemplo al cerrar la ficha del cuaderno).
      dist0: dist, dist1: distObjetivo,
    };
  }
  const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  /* ============================================================
     LA PANTALLA DEL TELEVISOR
     Muestra lo que está sonando. El sonido sale del reproductor de Spotify que vive en la
     ficha; acá sólo se DIBUJA. El puente entre los dos es la iFrame API de Spotify, que
     avisa qué se está tocando y en qué segundo va.
     ============================================================ */
  const TV = {
    lienzo: null, ctx: null, textura: null, material: null,
    estado: { uri: null, titulo: null, artista: null, tapa: null, pausa: true, pos: 0, dur: 0 },
    playlist: null,                 // portada y nombre de la playlist, para el estado inicial
    proximoDibujo: 0,
  };

  function prepararPantallaTV(raiz) {
    const malla = raiz.getObjectByName('obj_tv_pantalla');
    if (!malla) { console.warn('[escena] no encontré obj_tv_pantalla'); return; }
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 576;
    TV.lienzo = c; TV.ctx = c.getContext('2d');
    TV.textura = new THREE.CanvasTexture(c);
    TV.textura.colorSpace = THREE.SRGBColorSpace;
    TV.textura.flipY = false;                       // glTF trae las UV al revés que el canvas
    const mat = Array.isArray(malla.material) ? malla.material[0] : malla.material;
    TV.material = mat;
    mat.map = TV.textura;
    mat.emissiveMap = TV.textura;
    mat.emissive = new THREE.Color(0xffffff);
    mat.emissiveIntensity = 1.0;
    mat.needsUpdate = true;
    dibujarTV();

    // La pantalla arranca mostrando la playlist, no un cartel que diga "tocá el tele".
    const ruta = (FICHAS.televisor && FICHAS.televisor.spotify) || null;
    if (ruta) {
      datosDelTema('spotify:' + ruta.replace('/', ':')).then((info) => {
        TV.playlist = info;
        dibujarTV();
      });
    }
  }

  function dibujarTV() {
    const ctx = TV.ctx; if (!ctx) return;
    const W = 1024, H = 576, e = TV.estado;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, W, H);

    const M = 64, TAPA = 300;
    const sonando = !!e.uri;
    const tapa = e.tapa || (!sonando && TV.playlist ? TV.playlist.tapa : null);
    // tapa del disco
    if (tapa) { try { ctx.drawImage(tapa, M, (H - TAPA) / 2, TAPA, TAPA); } catch (_) {} }
    else {
      ctx.fillStyle = '#1f2124'; ctx.fillRect(M, (H - TAPA) / 2, TAPA, TAPA);
      ctx.fillStyle = '#2b2e33';
      ctx.beginPath(); ctx.arc(M + TAPA / 2, H / 2, 62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111214';
      ctx.beginPath(); ctx.arc(M + TAPA / 2, H / 2, 18, 0, Math.PI * 2); ctx.fill();
    }

    const X = M + TAPA + 56, ANCHO = W - X - M;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#8b9096';
    ctx.font = '500 26px Inter, system-ui, sans-serif';
    ctx.fillText(sonando ? (e.pausa ? 'EN PAUSA' : 'SONANDO AHORA') : 'PLAYLIST', X, 190);

    ctx.fillStyle = '#f2f3f5';
    ctx.font = '600 46px Inter, system-ui, sans-serif';
    const tituloPrincipal = e.titulo || (TV.playlist && TV.playlist.titulo) || 'Ela y Sara';
    recortarTexto(ctx, tituloPrincipal, X, 258, ANCHO);
    ctx.fillStyle = '#a9aeb4';
    ctx.font = '400 30px Inter, system-ui, sans-serif';
    recortarTexto(ctx, sonando ? (e.artista || '') : 'Sara Iglesias', X, 306, ANCHO);

    // barra de progreso
    const BY = 378, BH = 8;
    ctx.fillStyle = '#2a2d31';
    redondeado(ctx, X, BY, ANCHO, BH, BH / 2); ctx.fill();
    const p = e.dur > 0 ? Math.min(1, e.pos / e.dur) : 0;
    if (p > 0) { ctx.fillStyle = '#1db954'; redondeado(ctx, X, BY, Math.max(BH, ANCHO * p), BH, BH / 2); ctx.fill(); }
    ctx.fillStyle = '#8b9096';
    ctx.font = '400 22px Inter, system-ui, sans-serif';
    ctx.fillText(reloj_mmss(e.pos), X, BY + 44);
    const fin = reloj_mmss(e.dur);
    ctx.fillText(fin, X + ANCHO - ctx.measureText(fin).width, BY + 44);

    // logo de Spotify (obligatorio atribuir)
    ctx.fillStyle = '#1db954';
    ctx.beginPath(); ctx.arc(W - M - 22, H - M - 6, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111214'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const r = 8 + i * 5, y = H - M - 14 + i * 7;
      ctx.beginPath(); ctx.arc(W - M - 22, y + 6, r, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
    if (TV.textura) TV.textura.needsUpdate = true;
  }

  const reloj_mmss = (s) => {
    if (!isFinite(s) || s <= 0) return '0:00';
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  };
  function redondeado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function recortarTexto(ctx, txt, x, y, max) {
    let t = String(txt);
    while (t.length > 4 && ctx.measureText(t).width > max) t = t.slice(0, -2);
    if (t !== String(txt)) t = t.slice(0, -1) + '…';
    ctx.fillText(t, x, y);
  }

  // Datos del tema: la iFrame API avisa QUÉ suena, pero no el título ni la tapa. Eso se
  // pide al oEmbed público de Spotify, que no necesita clave.
  const cacheTemas = new Map();
  async function datosDelTema(uri) {
    if (cacheTemas.has(uri)) return cacheTemas.get(uri);
    const partes = String(uri).split(':');            // spotify:track:ID
    const url = 'https://open.spotify.com/' + partes[1] + '/' + partes[2];
    const d = { titulo: null, artista: null, tapa: null };
    try {
      // con límite de tiempo: si Spotify no contesta, no queremos dejar el pedido colgado
      const corte = new AbortController();
      const reloj = setTimeout(() => corte.abort(), 8000);
      const r = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url), { signal: corte.signal });
      clearTimeout(reloj);
      const j = await r.json();
      d.titulo = j.title || null;
      if (j.thumbnail_url) {
        d.tapa = await new Promise((ok) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';             // sin esto el canvas queda "sucio" y WebGL lo rechaza
          img.onload = () => ok(img);
          img.onerror = () => ok(null);
          img.src = j.thumbnail_url;
        });
      }
    } catch (err) {
      console.warn('[escena] no pude traer los datos del tema', err);
    }
    cacheTemas.set(uri, d);
    return d;
  }

  /* ---- la ficha ---- */
  function mostrarFicha(clave) {
    if (!ficha) return;
    const d = FICHAS[clave];
    ficha.querySelector('.escena-ficha__titulo').textContent = d.titulo;
    // innerHTML a propósito: los textos llevan enlaces adentro de la oración y salen de
    // contenido.js, que escribimos nosotras. No hay nada de afuera acá.
    ficha.querySelector('.escena-ficha__texto').innerHTML = d.texto;
    ponerSpotify(d.spotify);
    ponerDespues(d.textoDespues);
    ponerHojas(d.paginas);
    ficha.hidden = false;
    requestAnimationFrame(() => ficha.classList.add('abierta'));
  }
  function ocultarFicha() {
    if (!ficha) return;
    ficha.classList.remove('abierta');
    setTimeout(() => { if (!elegido) ficha.hidden = true; }, 320);
  }

  function ponerDespues(html) {
    let n = ficha.querySelector('.escena-ficha__despues');
    if (!html) { if (n) n.hidden = true; return; }
    if (!n) {
      n = document.createElement('p');
      n.className = 'escena-ficha__despues';
      ficha.appendChild(n);
    }
    n.innerHTML = html;
    n.hidden = false;
  }

  /* ---- el cuaderno se hojea ---- */
  let hojas = null;
  function ponerHojas(paginas) {
    if (!paginas || !paginas.length) { if (hojas) hojas.caja.hidden = true; return; }
    if (!hojas) {
      const caja = document.createElement('div');
      caja.className = 'escena-ficha__hojas';
      caja.innerHTML =
        '<div class="escena-hojas__vista"><img alt=""></div>' +
        '<div class="escena-hojas__pie">' +
          '<button type="button" class="escena-hojas__ir" data-paso="-1" aria-label="Anterior">‹</button>' +
          '<span class="escena-hojas__num"></span>' +
          '<button type="button" class="escena-hojas__ir" data-paso="1" aria-label="Siguiente">›</button>' +
        '</div>';
      ficha.appendChild(caja);
      hojas = { caja, img: caja.querySelector('img'), num: caja.querySelector('.escena-hojas__num'), i: 0, lista: [] };
      caja.querySelectorAll('.escena-hojas__ir').forEach((b) => {
        b.addEventListener('click', (ev) => { ev.stopPropagation(); pasarHoja(+b.dataset.paso); });
      });
    }
    hojas.caja.hidden = false;
    hojas.lista = paginas;
    hojas.i = 0;
    // con una sola imagen no hay nada que hojear: no van ni flechas ni contador
    hojas.caja.querySelector('.escena-hojas__pie').hidden = paginas.length < 2;
    // las siguientes se van precargando, así el paso es instantáneo
    paginas.slice(1).forEach((u) => { const im = new Image(); im.src = u; });
    dibujarHoja();
  }
  function pasarHoja(paso) {
    if (!hojas || !hojas.lista.length) return;
    hojas.i = (hojas.i + paso + hojas.lista.length) % hojas.lista.length;
    dibujarHoja();
  }
  function dibujarHoja() {
    hojas.img.src = hojas.lista[hojas.i];
    hojas.num.textContent = (hojas.i + 1) + ' / ' + hojas.lista.length;
  }

  function ponerSpotify(ruta) {
    if (!ficha) return;
    let caja = ficha.querySelector('.escena-ficha__spotify');
    // Nunca se destruye el reproductor: se esconde. Si se borrara del DOM, la música se
    // cortaría al cerrar la ficha, y lo que se quiere es que siga sonando hasta que el
    // visitante ponga pausa.
    if (!ruta) { if (caja) caja.hidden = true; return; }
    if (caja) { caja.hidden = false; return; }

    caja = document.createElement('div');
    caja.className = 'escena-ficha__spotify';
    const hueco = document.createElement('div');
    caja.appendChild(hueco);
    ficha.appendChild(caja);

    // Si en unos segundos no cargó, casi siempre es un bloqueador de publicidad tumbando
    // el iframe. Mejor decirlo que dejar un hueco en blanco.
    setTimeout(() => {
      if (!ctrlSpotify && caja.isConnected) {
        caja.classList.add('fallo');
        console.warn('[escena] el reproductor de Spotify no cargó. Suele ser un bloqueador de publicidad.');
      }
    }, 7000);

    cargarApiSpotify().then((API) => {
      API.createController(hueco, { uri: 'spotify:' + ruta.replace('/', ':'), width: '100%', height: 152 }, (ctrl) => {
        ctrlSpotify = ctrl;
        caja.classList.add('cargado');
        ctrl.addListener('playback_update', (ev) => {
          const d = ev && ev.data; if (!d) return;
          TV.estado.pausa = !!d.isPaused;
          TV.estado.pos = (d.position || 0) / 1000;
          TV.estado.dur = (d.duration || 0) / 1000;
          if (d.playingURI && d.playingURI !== TV.estado.uri) {
            TV.estado.uri = d.playingURI;
            TV.estado.titulo = null; TV.estado.tapa = null;
            datosDelTema(d.playingURI).then((info) => {
              if (TV.estado.uri !== d.playingURI) return;   // ya cambió de tema
              TV.estado.titulo = info.titulo; TV.estado.tapa = info.tapa;
              dibujarTV();
            });
          }
          TV.proximoDibujo = 0;                              // que se redibuje ya
        });
      });
    }).catch((err) => {
      caja.classList.add('fallo');
      console.warn('[escena] no pude cargar la API de Spotify', err);
    });
  }

  let ctrlSpotify = null, promesaApi = null;
  function cargarApiSpotify() {
    if (promesaApi) return promesaApi;
    promesaApi = new Promise((ok, mal) => {
      if (window.SpotifyIframeApi) return ok(window.SpotifyIframeApi);
      window.onSpotifyIframeApiReady = (API) => { window.SpotifyIframeApi = API; ok(API); };
      const sc = document.createElement('script');
      sc.src = 'https://open.spotify.com/embed/iframe-api/v1';
      sc.async = true;
      sc.onerror = mal;
      document.head.appendChild(sc);
      setTimeout(() => mal(new Error('tardó demasiado')), 12000);
    });
    return promesaApi;
  }

  lienzo.addEventListener('pointermove', moverPuntero);
  lienzo.addEventListener('pointerleave', () => { hayPuntero = false; });
  lienzo.addEventListener('click', (ev) => {
    moverPuntero(ev);
    const item = bajoCursor();
    elegir(item && item !== elegido ? item : null);
  });
  if (ficha) ficha.querySelector('.escena-ficha__cerrar').addEventListener('click', () => elegir(null));
  window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && elegido) elegir(null); });
  window.addEventListener('resize', medir);

  // Mientras la escena está fuera de pantalla (el usuario scrolleó para abajo,
  // a los trabajos o al footer) se deja de renderizar: antes seguía dibujando
  // el cuadro entero a 60fps para siempre, compitiendo por GPU con el resto de
  // la página y poniendo pesado el scroll en el resto del sitio.
  let visible = true;
  if ('IntersectionObserver' in window) {
    const ioVis = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { visible = e.isIntersecting; });
    }, { rootMargin: '200px 0px' });
    ioVis.observe(lienzo);
  }

  /* ---- bucle ---- */
  function cuadro() {
    requestAnimationFrame(cuadro);
    if (!visible) return;
    const dt = Math.min(reloj.getDelta(), 0.1);
    if (mezclador) mezclador.update(dt);

    // la pantalla del tele se redibuja 4 veces por segundo, alcanza para la barra
    if (TV.ctx) {
      TV.proximoDibujo -= dt;
      if (TV.proximoDibujo <= 0) {
        if (!TV.estado.pausa && TV.estado.dur > 0) TV.estado.pos = Math.min(TV.estado.dur, TV.estado.pos + 0.25);
        TV.proximoDibujo = 0.25;
        dibujarTV();
      }
    }

    if (listo) {
      // giro
      let distAnimado = false;
      if (mov) {
        mov.t = Math.min(1, mov.t + dt / mov.dur);
        const e = suave(mov.t);
        angulo = mov.ang0 + (mov.ang1 - mov.ang0) * e;
        elev = mov.elev0 + (mov.elev1 - mov.elev0) * e;
        mira.lerpVectors(mov.mira0, mov.mira1, e);
        dist = mov.dist0 + (mov.dist1 - mov.dist0) * e;
        distAnimado = true;
        if (mov.t >= 1) mov = null;
      } else if (!elegido && !menosMovimiento) {
        angulo += (Math.PI * 2 * dt) / CONFIG.giroSegundos;
      }

      const k = 1 - Math.pow(0.004, dt);       // suavizado independiente del framerate
      colocar(dist);

      // La escena NUNCA se corta: ni arriba, ni abajo, ni a los costados, ni las sombras.
      // Se mide cuánto se sale del cuadro y se corrige la distancia. Fuera de un movimiento
      // con destino (abrir/cerrar ficha), alejarse es inmediato (si no habría un instante
      // cortado) y acercarse es suave. Durante el movimiento el zoom ya viaja parejo con el
      // giro (arriba); acá sólo se lo empuja si aun así llegara a cortar.
      const ex = exceso();
      const necesaria = isFinite(ex) && ex > 0 ? dist * (ex / CONFIG.aire) : dist;
      if (recorteOk) {
        distDestino = distObjetivo;                  // este objeto pidió acercarse de más
      } else {
        const base = elegido || CONFIG.distanciaConstante ? distObjetivo : necesaria;
        distDestino = Math.max(base, necesaria);
      }
      if (distAnimado) {
        // los objetos con `zoom` propio (recorteOk) tienen permiso explícito de cortar la
        // escena general: por eso el resguardo NO se les aplica, ni acá ni en reposo. Si no,
        // a mitad de camino el "no cortar nunca" ganaba y la cámara se alejaba de golpe.
        if (!recorteOk && dist < necesaria) dist = necesaria;
      } else if (distDestino > dist) {
        dist = distDestino;
      } else {
        dist += (distDestino - dist) * k;
      }

      const item = bajoCursor();
      if (item !== hover) {
        if (hover && hover !== elegido) resaltar(hover, false);
        if (item && item !== elegido) resaltar(item, true);
        hover = item;
        lienzo.style.cursor = item ? 'pointer' : '';
      }
    }
    render.render(escena, camara);
  }
  cuadro();
  medir();

  const api = {
    cerrar: () => elegir(null),
    config: CONFIG,
    // Para elegir encuadres desde la consola del navegador:
    verAngulo: (grados) => { angulo = THREE.MathUtils.degToRad(grados); mov = null; },
    elegirClave: (clave) => elegir(clickeables.find((c) => c.clave === clave) || null),
    eje: () => [+ejeGiro.x.toFixed(2), +ejeGiro.z.toFixed(2)],
    estado: () => ({ angulo: +(THREE.MathUtils.radToDeg(angulo) % 360).toFixed(1), dist: +dist.toFixed(2),
                     distFija: +distFija.toFixed(2), exceso: +exceso().toFixed(3), elegido: elegido && elegido.clave }),
    perAngulo: () => { const g=angulo, o=[]; for (let a=0;a<360;a+=15){ angulo=THREE.MathUtils.degToRad(a);
                       let d=distFija; for(let i=0;i<5;i++){colocar(d); d*=exceso()/CONFIG.aire;} o.push([a,+d.toFixed(2)]); }
                       angulo=g; return o; },
    congelar: () => { menosMovimiento = true; },
  };
  window.__escena = api;
  return api;
}

/* ---- arranque ---- */
const lienzo = document.getElementById('escenaLienzo');
const ficha = document.getElementById('escenaFicha');
if (lienzo) {
  // Una sola vez, pase lo que pase. El respaldo de los 12 segundos arrancaba una SEGUNDA
  // escena encima de la primera: dos canvas superpuestos, la imagen duplicada, y los
  // cambios nuevos tapados por el render viejo.
  let arrancada = false;
  const arrancar = () => {
    if (arrancada) return;
    arrancada = true;
    iniciarEscena(lienzo, ficha);
  };
  const raiz = document.documentElement;
  if (raiz.classList.contains('home-intro')) {
    // Si hay intro, se espera a que termine para no competirle la GPU al typewriter.
    const obs = new MutationObserver(() => {
      if (raiz.classList.contains('home-revealed') || !raiz.classList.contains('home-intro')) {
        obs.disconnect();
        clearTimeout(respaldo);
        arrancar();
      }
    });
    obs.observe(raiz, { attributes: true, attributeFilter: ['class'] });
    const respaldo = setTimeout(() => { obs.disconnect(); arrancar(); }, 12000);
  } else {
    arrancar();
  }
}
