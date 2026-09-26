/**
 * O captcha visto pelo formulário. Mora em `src/lib/` porque
 * `src/components/**` não importa `src/integrations/**` (catraca de
 * `eslint.config.js`) e o componente precisa do tipo para receber o
 * controlador por prop — a mesma razão de `ContactSubmitResult` viver em
 * `contact-schema.ts`. Quem o implementa é `src/integrations/contact/turnstile.ts`.
 */
export type CaptchaController = {
  /** Carrega o script (uma vez) e renderiza o widget dentro do container. */
  mount: (container: HTMLElement) => Promise<void>
  /** Descarta o token atual: token do Turnstile é de uso único. */
  reset: () => void
}
