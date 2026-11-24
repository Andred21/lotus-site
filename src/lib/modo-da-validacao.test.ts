import { describe, expect, it } from 'vitest'
import { lerModo } from './modo-da-validacao'

const UUID = '0f8fad5b-d9cb-469f-a165-70867728950e'

describe('lerModo', () => {
  it.each(['/validar', '/validar/', '/validar/index.html', '/validar/abc'])(
    '%j e formulario',
    (p) => expect(lerModo(p)).toEqual({ tipo: 'formulario' }),
  )
  it('le o uuid do QR', () => {
    expect(lerModo(`/validar/${UUID}`)).toEqual({ tipo: 'qr', uuid: UUID })
  })
  it('mantem o uuid como veio', () => {
    const up = UUID.toUpperCase()
    expect(lerModo(`/validar/${up}`)).toEqual({ tipo: 'qr', uuid: up })
  })
})
