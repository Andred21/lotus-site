import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { site } from '../../content/site'
import { CONTACT_LIMITS } from '../../lib/contact-fields'
import type { ContactSubmitResult } from '../../lib/contact-schema'
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

  it('declara o propósito de cada campo para o preenchimento automático', () => {
    render(<ContactForm onSubmit={handlerOf({ status: 'failed' })} />)

    const proposito = {
      'Nombre Completo': 'name',
      'Correo Electrónico': 'email',
      Empresa: 'organization',
      Mensaje: 'off',
    }
    for (const [label, valor] of Object.entries(proposito)) {
      expect(screen.getByLabelText(label).getAttribute('autocomplete')).toBe(
        valor,
      )
    }
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

describe('ContactForm — estados de envio', () => {
  it('anuncia sucesso, limpa os campos e leva o foco ao status', async () => {
    const onSubmit = handlerOf({ status: 'sent' })
    render(<ContactForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Nombre Completo'), {
      target: { value: 'Ana Pérez' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(
      await screen.findByText(site.contacto.form.feedback.success),
    ).toBeTruthy()
    expect(screen.getByLabelText('Nombre Completo')).toHaveProperty('value', '')
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('status')),
    )
  })

  it('mostra o erro do campo, liga aria-invalid e preserva o que foi digitado', async () => {
    const onSubmit = handlerOf({
      status: 'invalid',
      fieldErrors: { email: 'Ingrese un correo electrónico válido.' },
    })
    render(<ContactForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
      target: { value: 'no-es-un-correo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(
      await screen.findByText('Ingrese un correo electrónico válido.'),
    ).toBeTruthy()
    const input = screen.getByLabelText('Correo Electrónico')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('email-error')
    expect(input).toHaveProperty('value', 'no-es-un-correo')
    expect(screen.getByRole('status').textContent).toBe(
      site.contacto.form.feedback.invalid,
    )
  })

  it('mostra erro genérico na falha do provedor e preserva os dados', async () => {
    const onSubmit = handlerOf({ status: 'failed' })
    render(<ContactForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Mensaje'), {
      target: { value: 'Necesito información sobre el curso.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(
      await screen.findByText(site.contacto.form.feedback.error),
    ).toBeTruthy()
    expect(screen.getByLabelText('Mensaje')).toHaveProperty(
      'value',
      'Necesito información sobre el curso.',
    )
    expect(screen.queryByText(/web3forms/i)).toBeNull()
  })

  it('não reserva espaço antes da primeira interação', async () => {
    render(<ContactForm onSubmit={handlerOf({ status: 'failed' })} />)

    // R-1 da review: o bloco vazio empurrava o primeiro campo 16px para
    // baixo em todos os viewports, antes de qualquer envio.
    const status = screen.getByRole('status')
    expect(status.className).not.toContain('mb-4')

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(status.className).toContain('mb-4'))
  })

  it('mostra erro genérico quando o handler rejeita e libera o botão', async () => {
    const onSubmit = vi.fn<ContactSubmitHandler>(() =>
      Promise.reject(new Error('boom')),
    )
    render(<ContactForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(
      await screen.findByText(site.contacto.form.feedback.error),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('desabilita o botão enquanto o envio está em curso', async () => {
    // Fila de resolvers em vez de `let resolve = ...`: parâmetro não usado
    // quebra o lint e variável atribuída dentro de callback quebra a análise
    // de atribuição definida do TypeScript.
    const pending: Array<(outcome: ContactSubmitResult) => void> = []
    const onSubmit = vi.fn<ContactSubmitHandler>(
      () =>
        new Promise<ContactSubmitResult>((resolve) => {
          pending.push(resolve)
        }),
    )
    render(<ContactForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    const button = screen.getByRole('button', { name: 'Enviar' })
    await waitFor(() => expect(button).toHaveProperty('disabled', true))
    expect(screen.getByRole('status').textContent).toBe(
      site.contacto.form.feedback.submitting,
    )

    pending[0]?.({ status: 'failed' })
    await waitFor(() => expect(button).toHaveProperty('disabled', false))
  })
})

describe('ContactForm — anti-spam', () => {
  it('não fala em campos marcados quando só o honeypot falha', async () => {
    const onSubmit = handlerOf({
      status: 'invalid',
      fieldErrors: { botcheck: 'No pudimos validar el envío.' },
    })
    render(<ContactForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    // O campo da armadilha não é renderizado: apontar "campos marcados" sem
    // marcar nenhum campo confunde humano e ensina o bot.
    expect(
      await screen.findByText(site.contacto.form.feedback.error),
    ).toBeTruthy()
    expect(screen.queryByText('No pudimos validar el envío.')).toBeNull()
  })

  it('trava o tamanho de cada campo no limite do schema', () => {
    render(<ContactForm onSubmit={handlerOf({ status: 'failed' })} />)

    expect(
      screen.getByLabelText('Nombre Completo').getAttribute('maxlength'),
    ).toBe(String(CONTACT_LIMITS.nombre.max))
    expect(
      screen.getByLabelText('Correo Electrónico').getAttribute('maxlength'),
    ).toBe(String(CONTACT_LIMITS.email.max))
    expect(screen.getByLabelText('Empresa').getAttribute('maxlength')).toBe(
      String(CONTACT_LIMITS.empresa.max),
    )
    expect(screen.getByLabelText('Mensaje').getAttribute('maxlength')).toBe(
      String(CONTACT_LIMITS.mensaje.max),
    )
  })
})
