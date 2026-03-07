// Service Worker for Push Notifications - L'Ordre des Ombres

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const defaultData = {
    title: "☽ L'Ordre des Ombres",
    body: 'Nouveau message reçu.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'ordre-message',
    data: { url: '/' },
  };

  let data = defaultData;
  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...defaultData, ...payload };
    }
  } catch (e) {
    // fallback to default
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      renotify: true,
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
