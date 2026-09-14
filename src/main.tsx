import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA Offline Mode
if ('serviceWorker' in navigator && (import.meta as any).env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('[Rakshika PWA] Service Worker registered with scope:', registration.scope);
      },
      (err) => {
        console.error('[Rakshika PWA] ServiceWorker registration failed:', err);
      }
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
