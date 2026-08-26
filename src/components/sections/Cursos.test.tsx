import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../../content/site'
import { Cursos } from './Cursos'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('Cursos', () => {
  it('renderiza o título com a caixa do original', () => {
    render(<Cursos />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'NUESTRos cursos' }),
    ).toBeTruthy()
  })

  it('renderiza os três cursos com nome e imagem descrita', () => {
    render(<Cursos />)

    for (const curso of site.cursos.items) {
      expect(screen.getByText(curso.nombre)).toBeTruthy()
      expect(screen.getByAltText(curso.imageAlt)).toBeTruthy()
    }
  })

  it('mantém o CTA apontando para # como no original', () => {
    render(<Cursos />)
    expect(
      screen.getByRole('link', { name: 'See More' }).getAttribute('href'),
    ).toBe('#')
  })
})
