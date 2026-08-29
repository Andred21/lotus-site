import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Footer } from './Footer'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('Footer', () => {
  it('renderiza o copyright verbatim, com o ano publicado', () => {
    render(<Footer />)
    expect(
      screen.getByText(
        'Diseñado por Lotus OTEC | Copyright © 2022. OTEC Lotus.',
      ),
    ).toBeTruthy()
  })

  it('usa a landmark de rodapé', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeTruthy()
  })

  it('usa a tipografia e cor medidas na referência (Open Sans 14px/23.8px, neutral-ink)', () => {
    // Rodada de paridade 2026-08-29: a referência é 14px/23.8px em
    // rgb(102, 102, 102) (`--color-neutral-ink`), não `text-body`/`text-brand`.
    render(<Footer />)
    const paragraph = screen.getByText(
      'Diseñado por Lotus OTEC | Copyright © 2022. OTEC Lotus.',
    )
    expect(paragraph.className).toContain('text-caption')
    expect(paragraph.className).toContain('text-neutral-ink')
    expect(paragraph.className).not.toContain('text-body')
    expect(paragraph.className).not.toContain('text-brand')
  })
})
