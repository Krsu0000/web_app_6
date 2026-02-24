// Service Worker for 블럭 식스 플래너 (6Block)
const CACHE_NAME = '6block-v15';

// 캐시할 파일 목록 (앱 셸)
const APP_SHELL = [
  '/web_app_6/',
  '/web_app_6/index.html',
  '/web_app_6/planner.html',
  '/web_app_6/week.html',
  '/web_app_6/manifest.json',
  '/web_app_6/css/main.css',
  '/web_app_6/css/planner.css',
  '/web_app_6/css/week.css',
  '/web_app_6/css/mobile.css',
  '/web_app_6/assets/favicon.ico',
  '/web_app_6/assets/icon-192.png',
  '/web_app_6/assets/icon-512.png',
];

// Firebase CDN (네트워크 우선, 실패 시 캐시)
const FIREBASE_URLS = [
  'https://www.gstatic.com/firebasejs/',
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 아이콘 등 일부 파일이 없어도 설치가 중단되지 않도록 개별 처리
      return Promise.allSettled(
        APP_SHELL.map(url =>
          cache.add(url).catch(() => {
            console.warn('[SW] 캐시 실패 (무시):', url);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] 구버전 캐시 삭제:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase 요청: 네트워크 우선 → 캐시 폴백
  if (FIREBASE_URLS.some(f => url.includes(f)) || url.includes('firebaseapp.com') || url.includes('googleapis.com')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // chrome-extension / non-http 요청 무시
  if (!url.startsWith('http')) return;

  // 앱 셸 및 정적 파일: 캐시 우선 → 네트워크 폴백
  event.respondWith(cacheFirst(event.request));
});

// ─── 전략 함수 ────────────────────────────────────────────────────────────────

// 캐시 우선 (정적 자산)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 오프라인 + 캐시 없음 → index.html로 폴백
    const fallback = await caches.match('/web_app_6/index.html');
    return fallback || new Response('오프라인 상태입니다.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// 네트워크 우선 (Firebase 등 동적 요청)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('네트워크 오류', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
