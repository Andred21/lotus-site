import { describe, expect, it } from 'vitest'
import { NOS, linhasMarkdown } from './espacamento.mjs'

describe('NOS', () => {
  it('dá nome único a cada nó medido', () => {
    const nomes = NOS.map((no) => no.nome)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('dá seletor de referência e de clone a todo nó', () => {
    for (const no of NOS) {
      expect(no.referencia, no.nome).toBeTruthy()
      expect(no.clone, no.nome).toBeTruthy()
    }
  })
})

describe('linhasMarkdown', () => {
  it('põe referência, clone e delta na mesma linha', () => {
    const markdown = linhasMarkdown([
      {
        nome: 'hero.corpo',
        largura: 375,
        referencia: { height: 173, marginTop: 45 },
        clone: { height: 115, marginTop: 32 },
      },
    ])
    expect(markdown).toContain('hero.corpo')
    expect(markdown).toContain('173')
    expect(markdown).toContain('115')
    expect(markdown).toContain('-58')
  })

  it('marca ausência sem inventar zero', () => {
    const markdown = linhasMarkdown([
      { nome: 'x', largura: 375, referencia: null, clone: { height: 10 } },
    ])
    expect(markdown).toContain('ausente')
    expect(markdown).not.toContain('-10')
  })
})
