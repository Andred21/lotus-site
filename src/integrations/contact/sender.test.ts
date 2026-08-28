import { afterEach, describe, expect, it, vi } from 'vitest'
import { unavailableContactSender } from './sender'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('unavailableContactSender', () => {
  it('falha sem tocar a rede quando não há provedor configurado', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const outcome = await unavailableContactSender({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: '',
      mensaje: 'Necesito información.',
    })

    expect(outcome).toEqual({ status: 'failed' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
