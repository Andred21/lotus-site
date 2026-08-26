import { describe, expect, it } from 'vitest'
import { site } from './site'

describe('conteúdo institucional', () => {
  it('mantém os quatro itens de menu com os destinos medidos', () => {
    expect(site.nav.map((item) => [item.label, item.href])).toEqual([
      ['Inicio', '/'],
      ['Quienes Somos', '#Somos'],
      ['Cursos', '#Cursos'],
      ['Contacto', '#Contacto'],
    ])
  })

  it('preserva a inconsistência do original em ALUMNOS', () => {
    const alumnos = site.destaques[1]
    expect(alumnos.label).toBe('ALUMNOS')
    expect(alumnos.body).toContain('888 horas de capacitación')
  })

  it('preserva a caixa inconsistente do título de cursos', () => {
    expect(site.cursos.heading).toBe('NUESTRos cursos')
  })

  it('preserva o ano de copyright publicado', () => {
    expect(site.footer.copyright).toBe(
      'Diseñado por Lotus OTEC | Copyright © 2022. OTEC Lotus.',
    )
  })

  it('lista os três cursos com nome e texto alternativo', () => {
    expect(site.cursos.items).toHaveLength(3)
    for (const curso of site.cursos.items) {
      expect(curso.nombre.length).toBeGreaterThan(0)
      expect(curso.imageAlt.length).toBeGreaterThan(0)
    }
  })

  it('descreve os quatro campos do formulário sem exigir nenhum', () => {
    expect(site.contacto.form.fields).toHaveLength(4)
    expect(site.contacto.form.fields.map((field) => field.name)).toEqual([
      'nombre',
      'email',
      'empresa',
      'mensaje',
    ])
  })
})
