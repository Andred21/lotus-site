import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidarApp } from './ValidarApp'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
// `fetch` stubado: nenhum teste sai para a rede, nem por engano.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => undefined)),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ValidarApp', () => {
  it('compõe header, página de validação e rodapé', () => {
    render(<ValidarApp />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'VALIDAR CERTIFICADO' }),
    ).toBeTruthy()
    const atuais = screen
      .getAllByRole('link', { name: 'Validar Certificado', hidden: true })
      .filter((link) => link.getAttribute('aria-current') === 'page')
    expect(atuais.length).toBeGreaterThan(0)
    expect(screen.getByRole('contentinfo')).toBeTruthy()
    expect(screen.getByLabelText('N° de registro')).toBeTruthy()
    expect(document.querySelector('main h1')).not.toBeNull()
  })
})
