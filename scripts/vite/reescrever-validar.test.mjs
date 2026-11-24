import { describe, expect, it, vi } from 'vitest'
import {
  CASOS_DA_VALIDACAO,
  DESTINO_DA_VALIDACAO,
  UUID_DE_EXEMPLO,
} from '../infra/lib/validar.mjs'
import { reescreverCaminho, reescreverValidar } from './reescrever-validar.mjs'

describe('reescreverCaminho', () => {
  it.each(CASOS_DA_VALIDACAO)('$nome', ({ uri, vira }) => {
    expect(reescreverCaminho(uri)).toBe(vira)
  })

  it('preserva a query', () => {
    expect(reescreverCaminho(`/validar/${UUID_DE_EXEMPLO}?utm=qr`)).toBe(
      '/validar/index.html?utm=qr',
    )
  })
})

describe('reescreverValidar', () => {
  it('registra o middleware no dev e no preview', () => {
    const plugin = /** @type {Record<string, (s: unknown) => void>} */ (
      /** @type {unknown} */ (reescreverValidar())
    )
    for (const gancho of ['configureServer', 'configurePreviewServer']) {
      /** @type {((req: { url: string }, res: object, next: () => void) => void)[]} */
      const usados = []
      plugin[gancho]?.({
        middlewares: { use: (/** @type {any} */ fn) => usados.push(fn) },
      })
      const req = { url: '/validar' }
      const next = vi.fn()
      usados[0]?.(req, {}, next)
      expect(req.url).toBe(DESTINO_DA_VALIDACAO)
      expect(next).toHaveBeenCalledOnce()
    }
  })
})
