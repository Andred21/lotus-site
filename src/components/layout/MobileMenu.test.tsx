import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MobileMenu } from './MobileMenu'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
// `fireEvent` em vez de `@testing-library/user-event`: o pacote não está
// instalado e o bloco não adiciona dependência (Global Constraints do plano).
afterEach(cleanup)

describe('MobileMenu', () => {
  it('começa fechado e anuncia o estado', () => {
    render(<MobileMenu />)
    const toggle = screen.getByRole('button', { name: 'Abrir menú' })

    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).toBeNull()
  })

  it('abre por clique e mostra os quatro itens', () => {
    render(<MobileMenu />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))

    const nav = screen.getByRole('navigation', { name: 'Mobile' })
    expect(nav.querySelectorAll('a')).toHaveLength(4)
    expect(
      screen
        .getByRole('button', { name: 'Cerrar menú' })
        .getAttribute('aria-expanded'),
    ).toBe('true')
  })

  it('fecha com Escape e devolve o foco ao botão', () => {
    render(<MobileMenu />)
    const toggle = screen.getByRole('button', { name: 'Abrir menú' })

    fireEvent.click(toggle)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Cerrar menú' }), {
      key: 'Escape',
    })

    expect(screen.queryByRole('navigation', { name: 'Mobile' })).toBeNull()
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Abrir menú' }),
    )
  })

  it('fecha ao escolher um item', () => {
    render(<MobileMenu />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    fireEvent.click(screen.getByRole('link', { name: 'Cursos' }))

    expect(screen.queryByRole('navigation', { name: 'Mobile' })).toBeNull()
  })
})
