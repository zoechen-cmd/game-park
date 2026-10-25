/* 遊戲樂園 Service Worker — 讓「加到主畫面」後可離線開啟
   策略：網路優先、失敗時回退快取（線上永遠最新，離線也能玩）
   改版時把 CACHE 版本號 +1，舊快取會自動清除。 */
const CACHE = 'game-park-v6';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        // 線上成功 → 順便更新快取
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        // 離線 → 回退快取；找不到就給首頁
        caches.match(req).then((r) => r || caches.match('./index.html'))
      )
  );
});
