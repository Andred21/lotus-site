import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Header } from './Header'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('Header', () => {
  it('expõe o logo com o texto alternativo medido', () => {
    render(<Header />)
    expect(screen.getByAltText('LOTUS')).toBeTruthy()
  })

  it('pinta o fundo desktop com o token do preto medido', () => {
    const { container } = render(<Header />)
    const cabecalho = container.querySelector('header')

    // A troca de cor entre viewports é o que a referência faz; a classe
    // mobile sozinha, ou a desktop sozinha, deixaria de reproduzi-la.
    expect(cabecalho?.className).toContain('bg-header-mobile')
    expect(cabecalho?.className).toContain('desktop:bg-header')
  })

  it('publica os quatro itens de navegação com os destinos medidos', () => {
    render(<Header />)
    const nav = screen.getByRole('navigation', { name: 'Principal' })

    expect(
      screen.getByRole('link', { name: 'Quienes Somos' }).getAttribute('href'),
    ).toBe('#Somos')
    expect(nav.querySelectorAll('a')).toHaveLength(4)
  })
})
