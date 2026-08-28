/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Chave do Web3Forms. Pública por design e por definição do Vite: tudo com
   * prefixo VITE_ entra no bundle. Ausente, o envio cai no caminho de D7.
   */
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string
}
