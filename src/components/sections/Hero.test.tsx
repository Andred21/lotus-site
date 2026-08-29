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
})
