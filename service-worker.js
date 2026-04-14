// A basic service worker just to satisfy Chrome's PWA requirements
self.addEventListener('install', (event) => {
  console.log('Service worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated.');
});

// We aren't caching files offline, so just pass network requests through normally
self.addEventListener('fetch', (event) => {
  return; 
});
