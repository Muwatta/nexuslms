/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // add more env vars here if you use them
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}