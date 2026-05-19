/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DADOS_BASE_URL?: string;
  readonly VITE_API_CALCULO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
