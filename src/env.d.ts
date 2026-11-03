/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly VITE_MEALDB_API_KEY?: string;
  readonly VITE_MEALDB_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
