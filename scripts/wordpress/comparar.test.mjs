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
const IMAGEM = 'https://lotusotec.cl/wp-content/uploads/x.png'
const USERS_ME =
  'https://lotusotec.cl/wp-json/wp/v2/users/me?context=edit&_locale=user'
const AJAX = 'https://lotusotec.cl/wp-admin/admin-ajax.php'

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
      falhas: [{ status: 404, metodo: 'GET', url: IMAGEM }],
      login: 500,
    })
    expect(problemas).toEqual([
      'resposta ≥ 400 na cópia: 404 GET https://lotusotec.cl/wp-content/uploads/x.png',
      'wp-login.php respondeu 500',
    ])
  })

  describe('falha que o vivo repete na mesma URL (emenda E1)', () => {
    it('o vivo com o mesmo status perdoa a falha', () => {
      const copia = {
        ...COPIA,
        falhas: [{ status: 401, metodo: 'GET', url: USERS_ME }],
      }
      expect(compararPaginas(VIVO, copia, { [USERS_ME]: 401 })).toEqual([])
    })

    it('o vivo com outro status reprova, com os dois lados', () => {
      const copia = {
        ...COPIA,
        falhas: [{ status: 404, metodo: 'GET', url: IMAGEM }],
      }
      expect(compararPaginas(VIVO, copia, { [IMAGEM]: 200 })).toEqual([
        'resposta ≥ 400 na cópia: 404 GET https://lotusotec.cl/wp-content/uploads/x.png (vivo: 200)',
      ])
    })

    it('pedido que não é GET reprova mesmo com o vivo igual na URL', () => {
      const copia = {
        ...COPIA,
        falhas: [{ status: 400, metodo: 'POST', url: AJAX }],
      }
      expect(compararPaginas(VIVO, copia, { [AJAX]: 400 })).toEqual([
        'resposta ≥ 400 na cópia: 400 POST https://lotusotec.cl/wp-admin/admin-ajax.php',
      ])
    })
  })

  it('normalizarTexto e primeiraDiferenca', () => {
    expect(normalizarTexto('  a \n\n b\t')).toBe('a b')
    expect(primeiraDiferenca('abcd', 'abXd')).toContain('posição 2')
  })
})
