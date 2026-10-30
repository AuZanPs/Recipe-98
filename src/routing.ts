const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** Absolute URL for a file in `public/`, respecting the Pages base path. */
export function getAssetUrl(path: string): string {
  return `${BASE_PATH}${path.replace(/^\/+/, '')}`;
}

/** Deployment base, always with a trailing slash. */
export function getBaseUrl(): string {
  return BASE_PATH;
}

/** Absolute URL for the recipe finder. */
export function getAppUrl(): string {
  return `${BASE_PATH}app`;
}

/** Path relative to the deployment base, normalized to start with a slash. */
export function resolveClientPath(pathname: string = window.location.pathname): string {
  const relative = pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length)
    : pathname;
  const normalized = relative.replace(/^\/+|\/+$/g, '');
  return `/${normalized}`;
}

export function isAppPath(pathname?: string): boolean {
  return resolveClientPath(pathname) === '/app';
}

/**
 * GitHub Pages serves public/404.html for unknown paths. That page rewrites the
 * URL to `?redirect=<path>`; translate it back into a real client path here.
 */
export function applyRedirectParam(search: string = window.location.search): void {
  const params = new URLSearchParams(search);
  if (!params.has('redirect')) return;

  const target = (params.get('redirect') ?? '').replace(/^\/+|\/+$/g, '');
  const destination = target === 'app' ? getAppUrl() : BASE_PATH;

  try {
    window.history.replaceState(null, '', destination);
  } catch {
    window.location.replace(destination);
  }
}
