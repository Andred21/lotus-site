import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResultadoDoPdf } from '../../lib/certificado'
import { BotaoDoPdf } from './BotaoDoPdf'

const URL_DO_OBJETO = 'blob:http://localhost/0f8fad5b'

let createObjectURL: ReturnType<typeof vi.fn<(arquivo: Blob) => string>>
let revokeObjectURL: ReturnType<typeof vi.fn<(url: string) => void>>

beforeEach(() => {
  createObjectURL = vi.fn<(arquivo: Blob) => string>(() => URL_DO_OBJETO)
  revokeObjectURL = vi.fn<(url: string) => void>()
  // jsdom não implementa as URLs de objeto; o resto de `URL` continua real.
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }),
  )
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/**
 * A frase da espera é um parágrafo só, mas o número mora num `<span
 * aria-live="off">` (P9): o texto se confere pelo `textContent` do `<p>`.
 */
function frase(texto: string) {
  return screen.queryByText(
    (_, el) => el?.tagName === 'P' && el.textContent === texto,
  )
}

function botao() {
  return screen.getByRole('button', {
    name: 'DESCARGAR PDF',
  }) as HTMLButtonElement
}

describe('BotaoDoPdf', () => {
  it('200 baixa com o nome do Content-Disposition', async () => {
    // jsdom não navega: sem o mock, o clique no <a> loga "Not implemented".
    const clique = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const arquivo = new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    const baixar = vi.fn(() =>
      Promise.resolve<ResultadoDoPdf>({
        tipo: 'pdf',
        arquivo,
        nome: 'certificado-LOT-2026-144.pdf',
      }),
    )
    render(<BotaoDoPdf baixar={baixar} aoRevogar={vi.fn()} />)

    fireEvent.click(botao())

    await waitFor(() => expect(clique).toHaveBeenCalledTimes(1))
    expect(createObjectURL).toHaveBeenCalledExactlyOnceWith(arquivo)
    const ancora = clique.mock.contexts[0] as HTMLAnchorElement
    expect(ancora.download).toBe('certificado-LOT-2026-144.pdf')
    expect(ancora.getAttribute('href')).toBe(URL_DO_OBJETO)
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith(URL_DO_OBJETO),
    )
    expect(ancora.isConnected).toBe(false)
    expect(botao().disabled).toBe(false)
  })

  it('desativado enquanto baixa', async () => {
    const baixar = vi.fn(() => new Promise<ResultadoDoPdf>(() => undefined))
    render(<BotaoDoPdf baixar={baixar} aoRevogar={vi.fn()} />)

    fireEvent.click(botao())
    expect(botao().disabled).toBe(true)
    fireEvent.click(botao())
    expect(baixar).toHaveBeenCalledTimes(1)
  })

  it('410 chama aoRevogar', async () => {
    const aoRevogar = vi.fn()
    render(
      <BotaoDoPdf
        baixar={() => Promise.resolve({ tipo: 'revogado' })}
        aoRevogar={aoRevogar}
      />,
    )
    fireEvent.click(botao())
    await waitFor(() => expect(aoRevogar).toHaveBeenCalledTimes(1))
  })

  it('espera conta e libera', async () => {
    vi.useFakeTimers()
    render(
      <BotaoDoPdf
        baixar={() => Promise.resolve({ tipo: 'espera', segundos: 2 })}
        aoRevogar={vi.fn()}
      />,
    )
    fireEvent.click(botao())
    await act(async () => {})

    const mensagem =
      'Demasiadas consultas seguidas. Intente de nuevo en 2 segundos.'
    const paragrafo = frase(mensagem)
    expect(paragrafo).not.toBeNull()
    expect(paragrafo?.querySelector('[aria-live="off"]')?.textContent).toBe(
      'Intente de nuevo en 2 segundos.',
    )
    expect(botao().disabled).toBe(true)

    act(() => vi.advanceTimersByTime(1000))
    expect(
      frase('Demasiadas consultas seguidas. Intente de nuevo en 1 segundo.'),
    ).not.toBeNull()

    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByText(/Demasiadas consultas/)).toBeNull()
    expect(botao().disabled).toBe(false)
  })

  it('espera sem número libera em 60 s', async () => {
    vi.useFakeTimers()
    render(
      <BotaoDoPdf
        baixar={() => Promise.resolve({ tipo: 'espera', segundos: null })}
        aoRevogar={vi.fn()}
      />,
    )
    fireEvent.click(botao())
    await act(async () => {})

    expect(
      frase(
        'Demasiadas consultas seguidas. Intente de nuevo en unos momentos.',
      ),
    ).not.toBeNull()
    act(() => vi.advanceTimersByTime(59_000))
    expect(botao().disabled).toBe(true)
    act(() => vi.advanceTimersByTime(1000))
    expect(botao().disabled).toBe(false)
  })

  it('falha mostra a frase do PDF', async () => {
    render(
      <BotaoDoPdf
        baixar={() => Promise.resolve({ tipo: 'falha' })}
        aoRevogar={vi.fn()}
      />,
    )
    fireEvent.click(botao())
    expect(
      await screen.findByText(
        'No pudimos descargar el PDF ahora. Intente más tarde.',
      ),
    ).toBeTruthy()
    expect(botao().disabled).toBe(false)
  })
})
