import { describe, expect, it } from 'vitest'
import {
  compararPaginas,
  normalizarTexto,
  primeiraDiferenca,
} from './lib/comparar.mjs'

const VIVO = {
  status: 200,
  titulo: 'LOTUS | OTEC',
  h1: 'LOTUS OTEC',
  texto: 'Inicio Quienes Somos\n  Cursos   Contacto',
  falhas: [],
}
const COPIA = { ...VIVO, login: 200 }

describe('compararPaginas (spec §4.3)', () => {
  it('cópia idêntica passa sem problemas', () => {
    expect(compararPaginas(VIVO, COPIA)).toEqual([])
  })

  it('espaço em branco diferente não é diferença', () => {
    expect(
      compararPaginas(VIVO, {
        ...COPIA,
        texto: 'Inicio Quienes Somos Cursos Contacto',
      }),
    ).toEqual([])
  })

  it('status, title e h1 diferentes aparecem, cada um com os dois lados', () => {
    const problemas = compararPaginas(VIVO, {
      ...COPIA,
      status: 500,
      titulo: 'Error',
      h1: '',
    })
    expect(problemas).toHaveLength(3)
    expect(problemas[0]).toBe('home restaurada respondeu 500')
    expect(problemas[1]).toContain('"LOTUS | OTEC"')
    expect(problemas[1]).toContain('"Error"')
    expect(problemas[2]).toContain('h1')
  })

  it('texto visível diferente aponta a primeira posição', () => {
    const [problema] = compararPaginas(VIVO, {
      ...COPIA,
      texto: 'Inicio Quienes Somos Cursos Kontacto',
    })
    expect(problema).toContain('texto visível difere')
    expect(problema).toContain('posição 28')
  })

  it('resposta ≥ 400 na cópia e wp-login fora de 200 reprovam', () => {
    const problemas = compararPaginas(VIVO, {
      ...COPIA,
      falhas: ['404 https://lotusotec.cl/wp-content/uploads/x.png'],
      login: 500,
    })
    expect(problemas).toEqual([
      'resposta ≥ 400 na cópia: 404 https://lotusotec.cl/wp-content/uploads/x.png',
      'wp-login.php respondeu 500',
    ])
  })

  it('normalizarTexto e primeiraDiferenca', () => {
    expect(normalizarTexto('  a \n\n b\t')).toBe('a b')
    expect(primeiraDiferenca('abcd', 'abXd')).toContain('posição 2')
  })
})
