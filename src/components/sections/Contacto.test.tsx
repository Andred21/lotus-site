import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { site } from '../../content/site'
import { Contacto } from './Contacto'
import type { ContactSubmitHandler } from './ContactForm'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

function handler() {
  return vi.fn<ContactSubmitHandler>(() =>
    Promise.resolve({ status: 'failed' }),
  )
}

describe('Contacto', () => {
  it('renderiza título, corpo e o email como mailto', () => {
    render(<Contacto onSubmit={handler()} />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'CONTÁCTENOS' }),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: site.contacto.email })
        .getAttribute('href'),
    ).toBe(`mailto:${site.contacto.email}`)
  })

  it('mantém os quatro campos rotulados sem mudar o rótulo visível', () => {
    render(<Contacto onSubmit={handler()} />)

    for (const field of site.contacto.form.fields) {
      const input = screen.getByLabelText(field.label)
      expect(input.getAttribute('placeholder')).toBe(field.label)
    }
  })

  it('repassa o envio ao callback recebido, sem conhecer a integração', () => {
    const onSubmit = handler()
    render(<Contacto onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('reproduz o padding responsivo da linha de título medido na referência (30px em 375/768, 27px a partir de desktop)', () => {
    // docs/qa/paridade/2026-08-30/espacamento.md: `contacto.linha` tem
    // paddingTop/paddingBottom 30px em 375 e 768, e a classe canônica
    // `py-6.75` (27px) já bate a partir do breakpoint `desktop` (1000px).
    const { container } = render(<Contacto onSubmit={handler()} />)
    const linha = container.querySelector('.text-center')
    expect(linha?.className).toContain('py-7.5')
    expect(linha?.className).toContain('desktop:py-6.75')
  })

  it('produz os 9px abaixo da linha de título como marginBottom, a propriedade medida na referência', () => {
    // docs/qa/paridade/2026-08-30/espacamento.md: `contacto.linha` mede
    // `marginBottom: 9px` na referência nas quatro larguras. O clone tinha a
    // mesma altura por um `<div className="h-2.25" />` separador — altura
    // certa pela propriedade errada (achado C-2 da review).
    const { container } = render(<Contacto onSubmit={handler()} />)
    const linha = container.querySelector('#Contacto > div:first-of-type')
    expect(linha?.className).toContain('mb-2.25')
    expect(container.querySelector('.h-2\\.25')).toBeNull()
  })
})
