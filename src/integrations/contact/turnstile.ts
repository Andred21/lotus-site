import type { CaptchaController } from '../../lib/captcha'

export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js'

/** A superfície do `window.turnstile` que o site usa. */
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      appearance: 'interaction-only'
      'response-field-name': string
    },
  ) => string
  reset: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/**
 * Controlador do Turnstile (spec D6). O script só é injetado na primeira
 * montagem — quem decide quando é o formulário, pelo observer — e em modo
 * explícito, para a Cloudflare não varrer o DOM atrás de `.cf-turnstile`.
 * `appearance: 'interaction-only'`: invisível no caso comum, aparece só se a
 * Cloudflare exigir interação. O widget escreve o token num input oculto
 * `cf-turnstile-response` dentro do container, que fica dentro do `<form>`.
 */
export function createTurnstileController(siteKey: string): CaptchaController {
  let carregamento: Promise<TurnstileApi> | undefined
  let widgetId: string | undefined

  const carregar = (): Promise<TurnstileApi> => {
    carregamento ??= new Promise<TurnstileApi>((resolve, reject) => {
      if (window.turnstile) {
        resolve(window.turnstile)
        return
      }
      const script = document.createElement('script')
      script.src = `${TURNSTILE_SCRIPT_URL}?render=explicit`
      script.async = true
      script.addEventListener('load', () => {
        if (window.turnstile) {
          resolve(window.turnstile)
        } else {
          reject(
            new Error(
              'o script do Turnstile carregou sem expor window.turnstile',
            ),
          )
        }
      })
      script.addEventListener('error', () => {
        // Sem memoizar a falha: a próxima montagem tenta de novo.
        carregamento = undefined
        reject(new Error('o script do Turnstile não carregou'))
      })
      document.head.append(script)
    })
    return carregamento
  }

  return {
    async mount(container) {
      const api = await carregar()
      widgetId ??= api.render(container, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        'response-field-name': 'cf-turnstile-response',
      })
    },
    reset() {
      if (widgetId !== undefined) window.turnstile?.reset(widgetId)
    },
  }
}
