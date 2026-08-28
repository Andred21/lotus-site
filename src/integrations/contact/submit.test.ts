import { describe, expect, it, vi } from 'vitest'
import type { ContactService } from './service'
import { createContactFormSubmit, readContactFormData } from './submit'

function formDataOf(entries: Record<string, string>) {
  const formData = new FormData()
  for (const [name, value] of Object.entries(entries)) {
    formData.append(name, value)
  }
  return formData
}

describe('readContactFormData', () => {
  it('lê os cinco campos do formulário', () => {
    const input = readContactFormData(
      formDataOf({
        nombre: 'Ana Pérez',
        email: 'ana@lotusotec.cl',
        empresa: 'Lotus',
        mensaje: 'Necesito información.',
        botcheck: '',
      }),
    )

    expect(input).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: 'Lotus',
      mensaje: 'Necesito información.',
      botcheck: '',
    })
  })

  it('trata campo ausente como vazio, sem decidir se isso é erro', () => {
    expect(readContactFormData(new FormData())).toEqual({
      nombre: '',
      email: '',
      empresa: '',
      mensaje: '',
      botcheck: '',
    })
  })

  it('ignora valor que não é texto', () => {
    const formData = new FormData()
    formData.append('nombre', new File(['x'], 'ataque.txt'))

    expect(readContactFormData(formData).nombre).toBe('')
  })
})

describe('createContactFormSubmit', () => {
  it('delega ao serviço e devolve o resultado dele', async () => {
    const service = vi.fn<ContactService>(() =>
      Promise.resolve({ status: 'sent' }),
    )
    const submit = createContactFormSubmit(service)

    const result = await submit(formDataOf({ nombre: 'Ana Pérez' }))

    expect(result).toEqual({ status: 'sent' })
    expect(service.mock.calls[0]?.[0]).toEqual({
      nombre: 'Ana Pérez',
      email: '',
      empresa: '',
      mensaje: '',
      botcheck: '',
    })
  })
})
