import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Row } from './Row'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo:
// sem este cleanup o segundo render acumula no mesmo document.body.
afterEach(cleanup)

describe('Row', () => {
  it('reproduz a calha medida: 80% travado em 1080px e centrado', () => {
    render(<Row>conteúdo</Row>)
    const row = screen.getByText('conteúdo')

    expect(row.className).toContain('w-4/5')
    expect(row.className).toContain('max-w-row')
    expect(row.className).toContain('mx-auto')
  })

  it('aceita classe extra sem perder a calha', () => {
    render(<Row className="py-8">conteúdo</Row>)
    const row = screen.getByText('conteúdo')

    expect(row.className).toContain('py-8')
    expect(row.className).toContain('max-w-row')
  })
})
