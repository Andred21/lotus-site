import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { site } from '../../content/site'
import { ContactForm, type ContactSubmitHandler } from './ContactForm'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
// `fireEvent` em vez de `@testing-library/user-event`: o pacote não está
// instalado e o bloco não adiciona dependência.
afterEach(cleanup)

function handlerOf(outcome: Awaited<ReturnType<ContactSubmitHandler>>) {
  return vi.fn<ContactSubmitHandler>(() => Promise.resolve(outcome))
}

describe('ContactForm', () => {
  it('rotula os quatro campos e marca só os três obrigatórios', () => {
    render(<ContactForm onSubmit={handlerOf({ status: 'failed' })} />)

    for (const field of site.contacto.form.fields) {
      const input = screen.getByLabelText(field.label)
      expect(input.getAttribute('placeholder')).toBe(field.label)
      expect(input.hasAttribute('required')).toBe(field.name !== 'empresa')
    }
    expect(
      screen.getByLabelText('Correo Electrónico').getAttribute('type'),
    ).toBe('email')
  })

  it('esconde o honeypot da árvore de acessibilidade', () => {
    const { container } = render(
      <ContactForm onSubmit={handlerOf({ status: 'failed' })} />,
    )

    const honeypot = container.querySelector('input[name="botcheck"]')
    expect(honeypot?.getAttribute('aria-hidden')).toBe('true')
    expect(honeypot?.getAttribute('tabindex')).toBe('-1')
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
  })

  it('entrega ao callback o FormData do formulário, sem navegar', () => {
    const onSubmit = handlerOf({ status: 'failed' })
    render(<ContactForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Nombre Completo'), {
      target: { value: 'Ana Pérez' },
    })
    fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
      target: { value: 'ana@lotusotec.cl' },
    })
    fireEvent.change(screen.getByLabelText('Mensaje'), {
      target: { value: 'Necesito información sobre el curso.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const formData = onSubmit.mock.calls[0]?.[0]
    expect(formData?.get('nombre')).toBe('Ana Pérez')
    expect(formData?.get('email')).toBe('ana@lotusotec.cl')
    expect(formData?.get('mensaje')).toBe(
      'Necesito información sobre el curso.',
    )
    expect(formData?.get('botcheck')).toBe('')
  })
})
