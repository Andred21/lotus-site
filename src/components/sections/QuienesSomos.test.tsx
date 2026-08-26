import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../../content/site'
import { QuienesSomos } from './QuienesSomos'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('QuienesSomos', () => {
  it('renderiza o corpo institucional verbatim', () => {
    render(<QuienesSomos />)
    expect(screen.getByText(site.institucional.body)).toBeTruthy()
  })

  it('dá texto alternativo real ao logotipo institucional', () => {
    render(<QuienesSomos />)
    expect(screen.getByAltText(site.institucional.logoAlt)).toBeTruthy()
  })
})
