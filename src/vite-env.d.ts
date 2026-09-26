/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Site key do Cloudflare Turnstile. Pública por design e por definição do
   * Vite: tudo com prefixo VITE_ entra no bundle. O segredo correspondente
   * vive no SSM e é lido só pela função (spec D7 do bloco B2). Ausente, o
   * envio cai no caminho de D7 do bloco 4.1.1-4.1.10.
   */
  readonly VITE_TURNSTILE_SITE_KEY?: string
}
