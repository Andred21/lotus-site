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

  it('usa a tipografia e cor medidas na referência (Open Sans 14px/23.8px, text-brand)', () => {
    // Medição direta em `https://lotusotec.cl/` (375, 2026-08-29, review do
    // bloco): `#footer-info` tem `font-size: 14px`, `line-height: 23.8px` e
    // `color: rgb(36, 162, 224)` — o tamanho corrigido nesta rodada é o
    // medido, a cor continua sendo `--color-brand`. A troca para
    // `text-neutral-ink` foi revertida: contradizia a própria referência.
    render(<Footer />)
    const paragraph = screen.getByText(
      'Diseñado por Lotus OTEC | Copyright © 2022. OTEC Lotus.',
    )
    expect(paragraph.className).toContain('text-caption')
    expect(paragraph.className).toContain('text-brand')
    expect(paragraph.className).not.toContain('text-body')
    expect(paragraph.className).not.toContain('text-neutral-ink')
  })

  it('reproduz o padding assimétrico do container do copyright medido na referência (0 em cima, 10px embaixo)', () => {
    // docs/qa/paridade/2026-08-30/espacamento.md: `rodape.copyright` tem
    // paddingTop 0 e paddingBottom 10px na referência, contra 0/0 no clone.
    const classes = render(<Footer />).container.querySelector(
      'footer > div',
    )?.className
    expect(classes).toContain('pb-2.5')
    expect(classes).not.toContain('py-1.25')
  })
})
