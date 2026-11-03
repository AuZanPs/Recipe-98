const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** Absolute URL for a file in `public/`, respecting the deployment base. */
export function getAssetUrl(path: string): string {
  return `${BASE_PATH}${path.replace(/^\/+/, '')}`;
}

/** Deployment base, always with a trailing slash. */
export function getBaseUrl(): string {
  return BASE_PATH;
}

/** Absolute URL for the recipe finder route. */
export function getAppUrl(): string {
  return `${BASE_PATH}app/`;
}
