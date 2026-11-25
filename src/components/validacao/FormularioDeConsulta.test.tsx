import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormularioDeConsulta } from './FormularioDeConsulta'

// vitest.config.ts não registra setup global; `fireEvent` porque
// `@testing-library/user-event` não está instalado (Lei 7).
afterEach(cleanup)

type Props = Parameters<typeof FormularioDeConsulta>[0]

function montar(props: Partial<Props> = {}) {
  const aoEnviar = vi.fn<Props['aoEnviar']>()
  const resultado = render(
    <FormularioDeConsulta
      estado="livre"
      errosDoServidor={[]}
      aoEnviar={aoEnviar}
      {...props}
    />,
  )
  return { aoEnviar, ...resultado }
}

function preencher(codigo: string, rut: string) {
  fireEvent.change(screen.getByLabelText('N° de registro'), {
    target: { value: codigo },
  })
  fireEvent.change(screen.getByLabelText('RUT del alumno'), {
    target: { value: rut },
  })
}

function descritoPor(el: HTMLElement): string[] {
  return (el.getAttribute('aria-describedby') ?? '').split(/\s+/)
}

describe('FormularioDeConsulta', () => {
  it('formato errado não envia e marca o campo', () => {
    const { aoEnviar } = montar()
    preencher('LOT-26-1', '12.345.678-5')
    fireEvent.click(screen.getByRole('button', { name: 'VALIDAR' }))

    const erro = screen.getByText('Formato: LOT-2026-123')
    const codigo = screen.getByLabelText('N° de registro')
    expect(codigo.getAttribute('aria-invalid')).toBe('true')
    expect(descritoPor(codigo)).toContain(erro.id)
    expect(screen.queryByText('RUT inválido')).toBeNull()
    expect(aoEnviar).not.toHaveBeenCalled()

    preencher('LOT-2026-123', '12.345.678-4')
    fireEvent.click(screen.getByRole('button', { name: 'VALIDAR' }))
    expect(screen.getByText('RUT inválido')).toBeTruthy()
    expect(screen.queryByText('Formato: LOT-2026-123')).toBeNull()
    expect(
      screen.getByLabelText('RUT del alumno').getAttribute('aria-invalid'),
    ).toBe('true')
    expect(aoEnviar).not.toHaveBeenCalled()
  })

  it('envia os valores aparados', () => {
    const { aoEnviar } = montar()
    preencher(' lot-2026-123 ', ' 12.345.678-5 ')
    fireEvent.click(screen.getByRole('button', { name: 'VALIDAR' }))
    expect(aoEnviar).toHaveBeenCalledExactlyOnceWith(
      'lot-2026-123',
      '12.345.678-5',
    )
    expect(screen.queryByText('Formato: LOT-2026-123')).toBeNull()
    expect(screen.queryByText('RUT inválido')).toBeNull()
  })

  it('errosDoServidor marca os campos vindos da API', () => {
    montar({ errosDoServidor: ['rut'] })
    expect(screen.getByText('RUT inválido')).toBeTruthy()
    expect(screen.queryByText('Formato: LOT-2026-123')).toBeNull()
    expect(
      screen.getByLabelText('RUT del alumno').getAttribute('aria-invalid'),
    ).toBe('true')
    expect(
      screen.getByLabelText('N° de registro').getAttribute('aria-invalid'),
    ).toBeNull()
  })

  it('botão por estado', () => {
    const { rerender, aoEnviar } = montar()
    const botao = () => screen.getByRole('button') as HTMLButtonElement

    expect(botao().textContent).toBe('VALIDAR')
    expect(botao().disabled).toBe(false)

    rerender(
      <FormularioDeConsulta
        estado="validando"
        errosDoServidor={[]}
        aoEnviar={aoEnviar}
      />,
    )
    expect(botao().textContent).toBe('Validando…')
    expect(botao().disabled).toBe(true)

    rerender(
      <FormularioDeConsulta
        estado="esperando"
        errosDoServidor={[]}
        aoEnviar={aoEnviar}
      />,
    )
    expect(botao().textContent).toBe('VALIDAR')
    expect(botao().disabled).toBe(true)
  })

  it('Enter não envia fora de livre', () => {
    const { aoEnviar, container } = montar({ estado: 'validando' })
    preencher('LOT-2026-123', '12.345.678-5')
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    expect(aoEnviar).not.toHaveBeenCalled()
  })

  it('rótulos acessíveis e exemplos na descrição de cada campo', () => {
    montar()
    const codigo = screen.getByLabelText('N° de registro')
    const rut = screen.getByLabelText('RUT del alumno')

    expect(descritoPor(codigo)).toContain(
      screen.getByText('Ej.: LOT-2026-123').id,
    )
    expect(descritoPor(rut)).toContain(screen.getByText('Ej.: 12.345.678-5').id)
    expect(codigo.getAttribute('autocomplete')).toBe('off')
    expect(codigo.getAttribute('autocapitalize')).toBe('characters')
    expect(codigo.getAttribute('spellcheck')).toBe('false')
    expect(rut.getAttribute('autocomplete')).toBe('off')
    expect(codigo.getAttribute('placeholder')).toBe('N° de registro')
    expect(rut.getAttribute('placeholder')).toBe('RUT del alumno')
  })
})
