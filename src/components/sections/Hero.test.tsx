import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../../content/site'
import { Hero } from './Hero'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('Hero', () => {
  it('renderiza kicker, título, subtítulo e corpo vindos do conteúdo', () => {
    render(<Hero />)

    expect(screen.getByText(site.hero.kicker)).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 1, name: 'LOTUS OTEC' }),
    ).toBeTruthy()
    // D2 do bloco 5.1.1-5.3.2: o subtítulo é tagline, não título de seção.
    expect(screen.getByText(site.hero.subtitle).tagName).toBe('P')
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
    expect(screen.getByText(site.hero.body)).toBeTruthy()
  })

  it('mantém o CTA sem destino, como no original', () => {
    render(<Hero />)
    // `href=""` não expõe o role `link`: a asserção vai no elemento e no
    // atributo, que é justamente o que o original publica.
    const cta = screen.getByText('Learn More')

    expect(cta.tagName).toBe('A')
    expect(cta.getAttribute('href')).toBe('')
  })

  it('reproduz as margens verticais medidas na referência', () => {
    const { container } = render(<Hero />)
    const kicker = container.querySelector('#Intrucción p')
    const corpo =
      container.querySelector('#hero-heading')?.parentElement
        ?.nextElementSibling
    expect(kicker?.className).toContain('mb-[45px]')
    // `hero.titulo` e `hero.subtitulo` medem paddingBottom 10px na referência
    // contra 0 no clone, nas quatro larguras.
    const titulo = container.querySelector('#hero-heading')
    expect(titulo?.className).toContain('pb-2.5')
    expect(titulo?.nextElementSibling?.className).toContain('pb-2.5')
    expect(corpo?.className).toContain('mt-[40px]')
    expect(corpo?.nextElementSibling?.className).toContain('mt-[50px]')
  })
})
