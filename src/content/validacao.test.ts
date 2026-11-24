import { describe, expect, it } from 'vitest'
import { emMinutos, emSegundos } from './validacao'

describe('contagens de espera', () => {
  it('põe segundos no singular e no plural', () => {
    expect(emSegundos(1)).toBe('Intente de nuevo en 1 segundo.')
    expect(emSegundos(45)).toBe('Intente de nuevo en 45 segundos.')
  })

  it('põe minutos no singular e no plural', () => {
    expect(emMinutos(1)).toBe('Podrá intentar de nuevo en 1 minuto.')
    expect(emMinutos(52)).toBe('Podrá intentar de nuevo en 52 minutos.')
  })
})
