import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../../content/site'
import { Contacto } from './Contacto'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
// `fireEvent` em vez de `@testing-library/user-event`: o pacote não está
// instalado e o bloco não adiciona dependência.
afterEach(cleanup)

describe('Contacto', () => {
  it('renderiza título, corpo e o email como mailto', () => {
    render(<Contacto />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'CONTÁCTENOS' }),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: site.contacto.email })
        .getAttribute('href'),
    ).toBe(`mailto:${site.contacto.email}`)
  })

  it('rotula os quatro campos sem mudar o rótulo visível', () => {
    render(<Contacto />)

    for (const field of site.contacto.form.fields) {
      const input = screen.getByLabelText(field.label)
      expect(input.getAttribute('placeholder')).toBe(field.label)
      expect(input.hasAttribute('required')).toBe(false)
    }
  })

  it('não anuncia envio nenhum ao submeter', () => {
    render(<Contacto />)

    fireEvent.change(screen.getByLabelText('Nombre Completo'), {
      target: { value: 'Ana' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByLabelText('Nombre Completo')).toHaveProperty(
      'value',
      'Ana',
    )
  })
})
