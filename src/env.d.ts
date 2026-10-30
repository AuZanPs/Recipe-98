/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEALDB_API_KEY?: string;
  readonly VITE_MEALDB_BASE_URL?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
