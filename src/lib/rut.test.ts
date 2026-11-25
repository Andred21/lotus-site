import { describe, expect, it } from 'vitest'
import { rutValido } from './rut'

describe('rutValido', () => {
  it.each([
    '12.345.678-5',
    '12345678-5',
    '123456785',
    ' 12.345.678-5 ',
    '6-k',
    '6-K',
  ])('aceita %j', (r) => expect(rutValido(r)).toBe(true))
  it.each([
    '12.345.678-4',
    '',
    '-',
    'K',
    '12.3K5.678-5',
    '.'.repeat(9) + '12.345.678-5',
  ])('recusa %j', (r) => expect(rutValido(r)).toBe(false))
})
