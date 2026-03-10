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
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    tag: 'ordre-notification',
    data: { url: '/' },
    actions: [],
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

  // Build notification actions from payload
  const actions = data.actions || [];

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      renotify: true,
      vibrate: [100, 50, 100],
      data: data.data,
      actions: actions,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action button clicks
  const action = event.action;
  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/';

  if (action === 'reply') {
    targetUrl = notifData.replyUrl || notifData.url || '/messages';
  } else if (action === 'view') {
    targetUrl = notifData.viewUrl || notifData.url || '/';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});