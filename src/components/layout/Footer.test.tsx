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
})
