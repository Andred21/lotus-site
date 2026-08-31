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

  it('usa a tipografia medida na referência para o corpo do destaque (Montserrat 16px/28.8px)', () => {
    // Rodada de paridade 2026-08-29 (`docs/qa/paridade/2026-08-29/classificacao.md`):
    // a referência renderiza este parágrafo em `font-display`/`text-body`, não em
    // `font-sans`/`text-lead` (que é a tipografia do parágrafo institucional acima).
    render(<Destaques />)
    for (const destaque of site.destaques) {
      const paragraph = screen.getByText(destaque.body)
      expect(paragraph.className).toContain('font-display')
      expect(paragraph.className).toContain('text-body')
      expect(paragraph.className).not.toContain('font-sans')
      expect(paragraph.className).not.toContain('text-lead')
    }
  })

  it('reproduz o padding do card e do título medidos na referência', () => {
    const { container } = render(<Destaques />)
    // `render(<Destaques />)` monta só a `Row`, então `div.text-center` casa
    // exatamente com os três cards.
    const cards = container.querySelectorAll('div.text-center')
    expect(cards).toHaveLength(3)
    const primeiro = cards[0]
    expect(primeiro?.className).toContain('p-[30px]')
    expect(primeiro?.querySelector('h2')?.className).toContain('pb-[10px]')
  })
})
