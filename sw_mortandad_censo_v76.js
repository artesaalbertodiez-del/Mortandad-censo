// ── Service Worker — Cuaderno de Campo ENGIE (v76: mortandad + censos + georreferenciación) ──
// HTML: red primero (siempre la versión más reciente si hay conexión)
// Ortofotos (.jpg): caché primero (se descargan una vez y funcionan sin cobertura)

const CACHE = 'engie-campo-2';
const ORTO_CACHE = 'engie-ortofotos';   // la usa también el botón "Descargar ortofotos" de Ajustes
const ORTOFOTOS = ['./ortofoto_guijo.jpg'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(['./', './index.html']).catch(() => {});
    // Las ortofotos se intentan una a una: si falta alguna no rompe la instalación
    const o = await caches.open(ORTO_CACHE);
    for (const url of ORTOFOTOS) {
      if (!(await o.match(url))) await o.add(url).catch(() => {});
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== ORTO_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  const esImagen = /\.(jpe?g|png)(\?|$)/i.test(e.request.url);

  if (esImagen) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(ORTO_CACHE).then(c => c.put(e.request, copia)); }
        return res;
      }))
    );
    return;
  }

  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
