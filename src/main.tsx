import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import { App } from './App';
import { applyRedirectParam, getAssetUrl, getBaseUrl, isAppPath } from './routing';
import './styles/global.css';

applyRedirectParam();

document.documentElement.style.setProperty(
  '--recipe-placeholder',
  `url("${getAssetUrl('recipe-placeholder.svg')}")`,
);

// Remove the pre-2.0 cache-first service worker. It could pin an old app shell
// forever; the app now relies on TanStack Query for data caching instead.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(
        registrations
          .filter((registration) => registration.scope.includes(getBaseUrl()))
          .map((registration) => registration.unregister()),
      ),
    )
    .catch(() => undefined);

  if ('caches' in window) {
    void caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('recipe-discovery'))
            .map((key) => caches.delete(key)),
        ),
      )
      .catch(() => undefined);
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element was not found.');

createRoot(container).render(
  <StrictMode>
    <App initialAppOpen={isAppPath()} />
  </StrictMode>,
);
