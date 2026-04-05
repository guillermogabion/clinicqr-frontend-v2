import { useEffect } from 'react';
import { notificationService } from '../services';

/**
 * Registers the service worker and subscribes to web push.
 * Call this inside a component that's only mounted when logged in.
 */
export function usePushNotifications() {
  useEffect(() => {
    const register = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Push] SW registered');

        // Get VAPID public key from backend
        const res = await fetch('/api/push/vapid-public-key');
        const { publicKey } = await res.json();
        if (!publicKey) return;

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await notificationService.savePushToken(existing.toJSON());
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await notificationService.savePushToken(subscription.toJSON());
        console.log('[Push] Subscribed to push notifications');
      } catch (err) {
        console.warn('[Push] Registration failed:', err);
      }
    };

    register();
  }, []);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
