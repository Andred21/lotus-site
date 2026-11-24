import { describe, expect, it } from 'vitest'
import { codigoValido, normalizarCodigo } from './codigo-de-registro'

describe('codigo de registro', () => {
  it('normaliza aparando e pondo em maiusculas', () => {
    expect(normalizarCodigo(' lot-2026-123 ')).toBe('LOT-2026-123')
  })
  it.each([
    'LOT-2026-123',
    'lot-2026-123',
    ' LOT-2026-9001 ',
    'LOT-2026-123456789',
  ])('aceita %j', (c) => expect(codigoValido(c)).toBe(true))
  it.each([
    'LOT-26-1',
    'LOT-2026-',
    'LOT-2026-1234567890',
    'LOTE-2026-1',
    'LOT-2026-12a',
    '',
  ])('recusa %j', (c) => expect(codigoValido(c)).toBe(false))
})
