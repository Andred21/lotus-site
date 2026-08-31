import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../../content/site'
import { Cursos } from './Cursos'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('Cursos', () => {
  it('renderiza o título com a caixa do original', () => {
    render(<Cursos />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'NUESTRos cursos' }),
    ).toBeTruthy()
  })

  it('renderiza os três cursos com nome e imagem descrita', () => {
    render(<Cursos />)

    for (const curso of site.cursos.items) {
      expect(screen.getByText(curso.nombre)).toBeTruthy()
      expect(screen.getByAltText(curso.imageAlt)).toBeTruthy()
    }
  })

  it('mantém o CTA apontando para # como no original', () => {
    render(<Cursos />)
    expect(
      screen.getByRole('link', { name: 'See More' }).getAttribute('href'),
    ).toBe('#')
  })

  it('usa a tipografia medida na referência para a legenda do curso (Open Sans 14px/23.8px)', () => {
    // Rodada de paridade 2026-08-29: a legenda é Open Sans, não Montserrat —
    // igual ao rodapé, os dois usam o mesmo `text-caption` medido no original.
    render(<Cursos />)
    for (const curso of site.cursos.items) {
      const caption = screen.getByText(curso.nombre)
      expect(caption.className).toContain('font-sans')
      expect(caption.className).toContain('text-caption')
      expect(caption.className).not.toContain('font-display')
      expect(caption.className).not.toContain('text-body')
    }
  })

  it('reproduz a calha da grade de cursos medida na referência (D9): 59.39px no eixo horizontal, 30px no vertical, padding responsivo da linha', () => {
    // docs/qa/paridade/2026-08-30/espacamento.md, seção "Divergência entre
    // medições — calha de cursos (D9) — RESOLVIDA": --spacing-gutter
    // (59.39px) está correto só para o eixo horizontal (desktop, 3 colunas);
    // o gap vertical entre cards empilhados (mobile) é 30px, um eixo
    // diferente que --spacing-gutter nunca deveria ter cobrido sozinho. O
    // padding da linha também é responsivo: 30px em 375/768, 27px (via
    // `py-6.75`) a partir do breakpoint `desktop` (1000px).
    const { container } = render(<Cursos />)
    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('gap-x-gutter')
    expect(grid?.className).toContain('gap-y-7.5')
    expect(grid?.className).toContain('py-7.5')
    expect(grid?.className).toContain('desktop:py-6.75')
  })
})
