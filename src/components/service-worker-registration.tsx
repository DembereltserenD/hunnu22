'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);

            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute

            // Listen for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    if (confirm('New version available! Reload to update?')) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_PENDING_DATA') {
            // Trigger sync in the app
            window.dispatchEvent(new CustomEvent('sw-sync-request'));
          }
        });

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      });

      // Register background sync if supported when online
      window.addEventListener('online', () => {
        navigator.serviceWorker.ready.then((registration) => {
          if ('sync' in registration) {
            return registration.sync.register('sync-pending-data');
          }
        });
      });
    }
  }, []);

  return null;
}
