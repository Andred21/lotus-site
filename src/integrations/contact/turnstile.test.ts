import { afterEach, describe, expect, it, vi } from 'vitest'
import { TURNSTILE_SCRIPT_URL, createTurnstileController } from './turnstile'

type Render = NonNullable<Window['turnstile']>['render']

function apiFalsa() {
  return {
    render: vi.fn<Render>(() => 'widget-1'),
    reset: vi.fn<(widgetId: string) => void>(),
  }
}

function scriptInjetado() {
  return document.head.querySelector<HTMLScriptElement>(
    `script[src^="${TURNSTILE_SCRIPT_URL}"]`,
  )
}

afterEach(() => {
  delete window.turnstile
  document.head.innerHTML = ''
})

describe('createTurnstileController', () => {
  it('injeta o script uma vez, em modo explícito, e renderiza quando ele carrega', async () => {
    const controller = createTurnstileController('1x00000000000000000000AA')
    const container = document.createElement('div')

    const montagem = controller.mount(container)
    const script = scriptInjetado()
    expect(script?.src).toBe(`${TURNSTILE_SCRIPT_URL}?render=explicit`)
    expect(script?.async).toBe(true)

    const api = apiFalsa()
    window.turnstile = api
    script?.dispatchEvent(new Event('load'))
    await montagem

    expect(api.render).toHaveBeenCalledTimes(1)
    expect(api.render).toHaveBeenCalledWith(container, {
      sitekey: '1x00000000000000000000AA',
      appearance: 'interaction-only',
      'response-field-name': 'cf-turnstile-response',
    })
    expect(document.head.querySelectorAll('script')).toHaveLength(1)
  })

  it('segunda montagem não injeta outro script nem renderiza de novo', async () => {
    const controller = createTurnstileController('1x00000000000000000000AA')
    const container = document.createElement('div')
    const api = apiFalsa()

    const primeira = controller.mount(container)
    window.turnstile = api
    scriptInjetado()?.dispatchEvent(new Event('load'))
    await primeira
    await controller.mount(container)

    expect(document.head.querySelectorAll('script')).toHaveLength(1)
    expect(api.render).toHaveBeenCalledTimes(1)
  })

  it('reset antes de montar não faz nada; depois, reseta o widget certo', async () => {
    const controller = createTurnstileController('1x00000000000000000000AA')
    const api = apiFalsa()

    controller.reset()
    expect(api.reset).not.toHaveBeenCalled()

    const montagem = controller.mount(document.createElement('div'))
    window.turnstile = api
    scriptInjetado()?.dispatchEvent(new Event('load'))
    await montagem
    controller.reset()

    expect(api.reset).toHaveBeenCalledWith('widget-1')
  })

  it('script que não carrega rejeita a montagem', async () => {
    const controller = createTurnstileController('1x00000000000000000000AA')

    const montagem = controller.mount(document.createElement('div'))
    scriptInjetado()?.dispatchEvent(new Event('error'))

    await expect(montagem).rejects.toThrow(/Turnstile/)
  })
})
