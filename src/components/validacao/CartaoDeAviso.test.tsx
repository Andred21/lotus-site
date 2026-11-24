import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CartaoDeAviso } from './CartaoDeAviso'

afterEach(cleanup)

describe('CartaoDeAviso', () => {
  it('mostra o selo neutro quando há selo', () => {
    render(
      <CartaoDeAviso selo="SIN RESULTADO" titulo="T">
        corpo
      </CartaoDeAviso>,
    )
    const selo = screen.getByText('SIN RESULTADO')
    expect(selo.classList.contains('bg-accent-ink')).toBe(true)
    expect(screen.getByText('corpo')).toBeTruthy()
  })

  it('não mostra selo quando não há', () => {
    const { container } = render(
      <CartaoDeAviso titulo="T">corpo</CartaoDeAviso>,
    )
    expect(container.querySelector('.bg-accent-ink')).toBeNull()
  })

  it('tem título nível 2 focável que recebe o tituloRef', () => {
    let el: HTMLHeadingElement | null = null
    render(
      <CartaoDeAviso
        titulo="Meu título"
        tituloRef={(n) => {
          el = n
        }}
      >
        corpo
      </CartaoDeAviso>,
    )
    const h2 = screen.getByRole('heading', { level: 2, name: 'Meu título' })
    expect(el).toBe(h2)
    expect(h2.tabIndex).toBe(-1)
  })
})
