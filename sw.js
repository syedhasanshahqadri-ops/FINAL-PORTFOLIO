/* Service worker for the SHS portfolio.
   - Everything below is saved on the first visit, so the whole site opens offline.
   - Bump VERSION whenever you change any file, so visitors get the new copy. */
const VERSION = "shs-portfolio-v1";
const CACHE = VERSION;

const PRECACHE = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "pwa.js",
  "manifest.webmanifest",
  "web-development/",
  "web-development/index.html",
  "web-development/style.css",
  "web-development/script.js",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "images/ai-hub-web.jpg",
  "images/clothing-web.jpg",
  "images/ecommerce-web.jpg",
  "images/food-web.jpg",
  "images/graphic-work.jpg",
  "images/gym-web.jpg",
  "images/hotel-web.jpg",
  "images/it-company-web.jpg",
  "images/markly-web.jpg",
  "images/history-of-islam-web.jpg",
  "images/og-cover.jpg",
  "images/pizza-web.png",
  "images/quiz-web.jpg",
  "images/video-work.jpg",
  "images/weather-web.jpg",
  "images/web-work.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // one by one, so a single missing file never blocks the install
    await Promise.all(PRECACHE.map(path => cache.add(new Request(path, { cache: "reload" })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    const all = await self.clients.matchAll({ includeUncontrolled: true });
    all.forEach(c => c.postMessage({ type: "offline-ready" }));
  })());
});

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const cacheable = sameOrigin || FONT_HOSTS.includes(url.hostname) || req.destination === "image";
  if (!cacheable) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: sameOrigin });

    // saved copy first (fast and works offline), refreshed quietly in the background
    const refresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (cached) { event.waitUntil(refresh); return cached; }

    const fresh = await refresh;
    if (fresh) return fresh;

    // offline and not saved: send page requests to the saved home page
    if (req.mode === "navigate") {
      const page = url.pathname.includes("/web-development/") ? "web-development/index.html" : "index.html";
      return (await cache.match(page)) || (await cache.match("index.html"));
    }
    return new Response("", { status: 504, statusText: "Offline" });
  })());
});
