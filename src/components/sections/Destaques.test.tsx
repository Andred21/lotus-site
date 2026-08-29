import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../../content/site'
import { Destaques } from './Destaques'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('Destaques', () => {
  it('renderiza os três destaques com rótulo e corpo', () => {
    render(<Destaques />)

    for (const destaque of site.destaques) {
      expect(
        screen.getByRole('heading', { level: 2, name: destaque.label }),
      ).toBeTruthy()
      expect(screen.getByText(destaque.body)).toBeTruthy()
    }
  })

  it('mantém a certificação exatamente como publicada', () => {
    render(<Destaques />)
    expect(screen.getByText(/NCH 2728:2015/)).toBeTruthy()
    expect(screen.getByText(/N° CA-751/)).toBeTruthy()
    expect(screen.getByText(/INN: A-10981/)).toBeTruthy()
  })
})
