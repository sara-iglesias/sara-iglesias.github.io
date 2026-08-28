/* ============================================================
   contenido.js — lo que dice cada objeto de la escena 3D.
   Editá SOLO este archivo para cambiar los textos.
   Las claves tienen que coincidir con los obj_click_* del .glb.

   Cada objeto puede tener:
     titulo / texto     { es, en }. El texto acepta <a href="…">enlaces</a> adentro de la
                        oración, y <em> / <strong>.
     textoDespues       { es, en } — va DEBAJO del reproductor de Spotify.
     vista              grados a los que gira la cámara al clickear. Sin `vista`, se
                        calcula sola: se mira desde el lado del objeto.
     alturaVista        desde qué altura se lo mira. Sirve para esquivar lo que lo tape.
     zoom               1 = la escena entera siempre entra. Menos de 1 se acerca más y
                        acepta que se recorte a los costados.
     spotify            reproductor de Spotify dentro de la ficha
     paginas            lista de imágenes para hojear
   ============================================================ */

const IDIOMA = (document.documentElement.lang || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
const t = (par) => (par && typeof par === 'object' ? par[IDIOMA] ?? par.es : par);

/* Las rutas de la web cambian según el idioma: la versión en español vive en /es/ */
const RAIZ = IDIOMA === 'en' ? '' : '../';
const OBRA = (archivo) => (IDIOMA === 'en' ? 'works/' : 'works/') + archivo;

const DATOS = {
  sara: {
    vista: 208,          // 180° exactos la tapa el tele: se esquiva de costado
    alturaVista: 18,
    zoom: 0.58,
    titulo: { es: 'Yo', en: 'Me' },
    texto: {
      es: 'Esta soy yo, en mi pose default para trabajar. Tengo jornadas de más de 24 horas seguidas, así que a esta altura ya no sé cómo sentarme.',
      en: "That's me, in my default working pose. I pull sessions longer than 24 hours straight, so by now I've run out of ways to sit.",
    },
  },

  computadora: {
    // De frente la tapa Sara: la pantalla mira justo hacia ella. Se mira por encima del
    // hombro, que además es como se ve una compu de verdad.
    vista: 44,
    alturaVista: 38,
    zoom: 0.42,
    titulo: { es: 'La compu', en: 'The computer' },
    texto: {
      es: 'En el trabajo y en el tiempo libre, la compu es mi mejor amiga: es lo que uso el 90% del tiempo. Desde jugar al Minecraft y a los Sims hasta laburar en un mismo proyecto con Blender, Rhino, Illustrator, código, Figma y Claude abiertos todos a la vez.',
      en: "At work and off the clock, my computer is my best friend — it's what I use 90% of the time. From playing Minecraft and The Sims to working on a single project with Blender, Rhino, Illustrator, code, Figma and Claude all open at once.",
    },
  },

  cuaderno: {
    alturaVista: 42,
    zoom: 0.40,
    titulo: { es: 'El cuaderno', en: 'The notebook' },
    texto: {
      es: 'Acompaña casi todos mis procesos. Siempre es útil tener algo donde bocetar, garabatear o hacer listas. Y además me encanta dibujar.',
      en: 'It goes along with almost every process. Having somewhere to sketch, doodle or make lists always helps. And I love to draw.',
    },
    // Se hojean dentro de la ficha, con las flechas o con el teclado
    paginas: [1, 2, 3, 4, 5, 6].map((n) => `${RAIZ}assets/img/cuaderno/${n}.webp`),
  },

  mesa: {
    titulo: { es: 'La mesa ratona', en: 'The coffee table' },
    texto: {
      es: 'Soy obsesiva con la decoración de interiores, la mía y la de mis amigos. Muchas veces no encuentro lo que quiero, así que me armo mis propios muebles: esta salió de <a href="PLANO" target="_blank" rel="noopener">este plano</a>.',
      en: "I'm obsessive about interiors — mine and my friends'. Often I can't find what I'm after, so I build my own furniture: this one came out of <a href=\"PLANO\" target=\"_blank\" rel=\"noopener\">this drawing</a>.",
    },
    // Se ve directo en la ficha. El enlace del texto sigue estando, para verlo en grande.
    paginas: [`${RAIZ}assets/img/mesa-plano.webp`],
  },

  sillon: {
    // De frente a 180° lo tapa el televisor. De tres cuartos se esquiva y además se ve
    // mucho mejor la forma del sillón.
    vista: 146,
    alturaVista: 26,
    zoom: 0.78,
    titulo: { es: 'El sillón', en: 'The couch' },
    texto: {
      es: 'Mi lugar de trabajo, de relax y de sueño.',
      en: 'Where I work, where I unwind and where I sleep.',
    },
  },

  guitarra: {
    vista: 6,
    alturaVista: 18,
    titulo: { es: 'La guitarra', en: 'The guitar' },
    texto: {
      es: 'Desde siempre tengo una relación cercana con la música. Pasé por varios instrumentos: guitarra, piano y batería, mi favorita. Hoy no toco ninguno, pero canto en una banda: <a href="https://open.spotify.com/artist/0N8ap4bOsF6r9tuh8TyGXY" target="_blank" rel="noopener">Data en Viaje</a>.',
      en: "I've always had a close relationship with music. I went through several instruments: guitar, piano and drums, my favourite. I don't play any of them now, but I sing in a band: <a href=\"https://open.spotify.com/artist/0N8ap4bOsF6r9tuh8TyGXY\" target=\"_blank\" rel=\"noopener\">Data en Viaje</a>.",
    },
  },

  planta: {
    titulo: { es: 'La planta', en: 'The plant' },
    texto: {
      es: 'Tengo la casa infestada de plantas.',
      en: 'My place is infested with plants.',
    },
  },

  rack: {
    // A 0° lo tapa el sillón: se lo mira de tres cuartos y desde más arriba.
    vista: 318,
    alturaVista: 34,
    zoom: 0.82,
    titulo: { es: 'El rack', en: 'The TV unit' },
    texto: {
      es: 'Soy la mejor encontrando proveedores en cualquier punto del país que hagan exactamente lo que quiero al mejor precio. Este rack me lo mandé a hacer: hermoso, funcional y una ganga.',
      en: 'I am the best at finding makers anywhere in the country who can build exactly what I want at the best price. I had this unit made to order: beautiful, functional and a steal.',
    },
  },

  televisor: {
    vista: 0,
    alturaVista: 20,
    titulo: { es: 'El televisor', en: 'The TV' },
    texto: {
      es: 'Siempre música de fondo. Tengo playlists hechas con mucho, mucho esmero.',
      en: 'Always music in the background. I make my playlists with a great deal of care.',
    },
    // El reproductor real de Spotify. Aparece sólo al abrir esta ficha: hasta ese momento
    // la web no le pide nada a Spotify. Y sigue sonando aunque cierres la ficha.
    spotify: 'playlist/2GuIb6PHaMSF6Sf45KUNhI',
    textoDespues: {
      es: 'Si no estoy escuchando música, probablemente esté mirando Friends.',
      en: "If I'm not listening to music, I'm probably watching Friends.",
    },
  },

  maqueta: {
    alturaVista: 26,
    zoom: 0.45,
    titulo: { es: 'La maqueta y la lámpara', en: 'The model and the lamp' },
    texto: {
      es: 'Varios de mis proyectos terminan materializados, y me gusta tenerlos en casa y usarlos: la lámpara es de <a href="FORJA">Forja</a> y la maqueta es de <a href="CERO">Cero al Infinito</a>.',
      en: 'Several of my projects end up built, and I like keeping them at home and using them: the lamp is from <a href="FORJA">Forja</a> and the model is from <a href="CERO">Cero al Infinito</a>.',
    },
  },
};

/* Se resuelven idioma y rutas una sola vez, así el visor no tiene que saber nada de esto */
const RUTAS = {
  PLANO: `${RAIZ}assets/img/mesa-plano.webp`,
  FORJA: OBRA('forja.html'),
  CERO: OBRA('cero-al-infinito.html'),
};
const resolver = (html) => String(html).replace(/href="(PLANO|FORJA|CERO)"/g, (_, k) => `href="${RUTAS[k]}"`);

export const FICHAS = Object.fromEntries(
  Object.entries(DATOS).map(([clave, d]) => [clave, {
    ...d,
    titulo: t(d.titulo),
    texto: resolver(t(d.texto)),
    textoDespues: d.textoDespues ? resolver(t(d.textoDespues)) : null,
  }])
);
