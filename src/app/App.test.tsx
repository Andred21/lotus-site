import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../content/site'
import { App } from './App'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('App', () => {
  it('compõe as cinco seções da home, na ordem do original', () => {
    const { container } = render(<App />)
    const ids = [...container.querySelectorAll('section[id]')].map(
      (section) => section.id,
    )

    expect(ids).toEqual(['Intrucción', 'Somos', 'Cursos', 'Contacto'])
  })

  it('expõe o conteúdo de cada seção', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: site.hero.title }),
    ).toBeTruthy()
    expect(screen.getByText(site.institucional.body)).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3)
    for (const curso of site.cursos.items) {
      expect(screen.getByText(curso.nombre)).toBeTruthy()
    }
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
    expect(screen.getByText(site.footer.copyright)).toBeTruthy()
  })

  it('mantém as landmarks de cabeçalho, conteúdo e rodapé', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('contentinfo')).toBeTruthy()
  })
})
