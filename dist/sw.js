// ClinicQR Service Worker v3 — Push + Sound + Speech signalling

self.addEventListener('install', () => {
  console.log('[SW] v3 installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] v3 activated');
  event.waitUntil(clients.claim());
});

function getSoundType(notifType) {
  if (notifType === 'RESULT_READY') return 'result';
  if (notifType === 'PRESCRIPTION_CREATED') return 'prescription';
  return 'default';
}

// Send message to all open tabs so they play the sound + speak
async function signalTabs(soundType, speechText) {
  const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of allClients) {
    client.postMessage({ type: 'PLAY_SOUND', soundType, speechText });
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'ClinicQR', body: event.data.text(), notifType: 'default' };
  }

  const soundType = getSoundType(payload.notifType || 'default');
  // Use the body as-is for speech — backend already wrote it in plain English
  const speechText = payload.body || '';

  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    data: { ...(payload.data || {}), soundType, speechText },
    actions: [
      { action: 'view',    title: 'View'    },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: false,
    tag: payload.data?.resultId || payload.data?.prescriptionId || 'clinicqr',
    silent: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || 'ClinicQR', options),
      signalTabs(soundType, speechText),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  let url = '/notifications';
  if (data.resultId)       url = `/results/${data.resultId}`;
  else if (data.prescriptionId) url = `/prescriptions/${data.prescriptionId}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
