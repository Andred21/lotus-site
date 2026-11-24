import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  BaixarPdf,
  ConsultaPorCodigo,
  ConsultaPorUuid,
  ResultadoDaConsulta,
  ResultadoDoPdf,
} from '../../lib/certificado'
import { REVOGADO, UUID, VIGENTE } from '../../lib/certificado.fixture'
import type { ModoDaValidacao } from '../../lib/modo-da-validacao'
import { ValidacaoCertificado } from './ValidacaoCertificado'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const VIGENTE_200: ResultadoDaConsulta = {
  tipo: 'certificado',
  certificado: VIGENTE,
  uuid: UUID,
}

function montar({
  modo = { tipo: 'formulario' },
  porCodigo = () => Promise.resolve(VIGENTE_200),
  porUuid = () => Promise.resolve(VIGENTE_200),
  pdf = () => new Promise<ResultadoDoPdf>(() => undefined),
}: {
  modo?: ModoDaValidacao
  porCodigo?: ConsultaPorCodigo
  porUuid?: ConsultaPorUuid
  pdf?: BaixarPdf
} = {}) {
  const consultarPorCodigo = vi.fn<ConsultaPorCodigo>(porCodigo)
  const consultarPorUuid = vi.fn<ConsultaPorUuid>(porUuid)
  const baixarPdf = vi.fn<BaixarPdf>(pdf)
  const resultado = render(
    <ValidacaoCertificado
      modo={modo}
      consultarPorCodigo={consultarPorCodigo}
      consultarPorUuid={consultarPorUuid}
      baixarPdf={baixarPdf}
    />,
  )
  return { consultarPorCodigo, consultarPorUuid, baixarPdf, ...resultado }
}

function enviar(codigo = 'LOT-2026-144', rut = '12.345.678-5') {
  fireEvent.change(screen.getByLabelText('N° de registro'), {
    target: { value: codigo },
  })
  fireEvent.change(screen.getByLabelText('RUT del alumno'), {
    target: { value: rut },
  })
  fireEvent.click(screen.getByRole('button', { name: 'VALIDAR' }))
}

function validar() {
  return screen.getByRole('button', {
    name: /^(VALIDAR|Validando…)$/,
  }) as HTMLButtonElement
}

function regiao(container: HTMLElement) {
  return container.querySelector('[aria-live="polite"]') as HTMLElement
}

/** Promessa resolvida por fora, para o teste ver o estado intermediário. */
function adiada<T>() {
  let resolver!: (valor: T) => void
  const promessa = new Promise<T>((r) => {
    resolver = r
  })
  return { promessa, resolver }
}

describe('ValidacaoCertificado, modo formulário', () => {
  it('mostra o cabeçalho, a abertura, o formulário e a linha do QR', () => {
    montar()
    expect(
      screen.getByRole('heading', { level: 1, name: 'VALIDAR CERTIFICADO' }),
    ).toBeTruthy()
    expect(screen.getByText('CERTIFICADOS LOTUS OTEC')).toBeTruthy()
    expect(
      screen.getByText(
        'Ingrese el N° de registro y el RUT del alumno, tal como aparecen en el certificado.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        '¿Tiene el certificado a mano? Escanee el código QR: abre la validación directamente.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Validar otro certificado')).toBeNull()
  })

  it('200 mostra o cartão abaixo do formulário e foca o título', async () => {
    const { promessa, resolver } = adiada<ResultadoDaConsulta>()
    const { container, consultarPorCodigo } = montar({
      porCodigo: () => promessa,
    })

    enviar()
    expect(validar().textContent).toBe('Validando…')
    expect(validar().disabled).toBe(true)
    expect(consultarPorCodigo).toHaveBeenCalledExactlyOnceWith(
      'LOT-2026-144',
      '12.345.678-5',
    )

    await act(async () => resolver(VIGENTE_200))

    const titulo = screen.getByRole('heading', {
      level: 2,
      name: 'Certificado válido',
    })
    expect(regiao(container).contains(titulo)).toBe(true)
    expect(screen.getByLabelText('N° de registro')).toBeTruthy()
    expect(validar().textContent).toBe('VALIDAR')
    expect(document.activeElement).toBe(titulo)
  })

  it('segundo envio durante Validando… não pede de novo', () => {
    const { container, consultarPorCodigo } = montar({
      porCodigo: () => new Promise(() => undefined),
    })
    fireEvent.change(screen.getByLabelText('N° de registro'), {
      target: { value: 'LOT-2026-144' },
    })
    fireEvent.change(screen.getByLabelText('RUT del alumno'), {
      target: { value: '12.345.678-5' },
    })
    const form = container.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(consultarPorCodigo).toHaveBeenCalledTimes(1)
  })

  it('não encontrado', async () => {
    montar({ porCodigo: () => Promise.resolve({ tipo: 'nao-encontrado' }) })
    enviar()
    expect(
      await screen.findByText('No encontramos un certificado con esos datos'),
    ).toBeTruthy()
    expect(screen.getByText('SIN RESULTADO')).toBeTruthy()
    expect(
      screen.getByText(
        'Revise el N° de registro y el RUT del alumno tal como aparecen en el certificado.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByText('También puede escanear el código QR del certificado.'),
    ).toBeTruthy()
  })

  it('formato-invalido da API marca o campo', async () => {
    montar({
      porCodigo: () =>
        Promise.resolve({ tipo: 'formato-invalido', campos: ['codigo'] }),
    })
    enviar()
    expect(await screen.findByText('Formato: LOT-2026-123')).toBeTruthy()
    expect(screen.queryByText('RUT inválido')).toBeNull()
    expect(
      screen.getByLabelText('N° de registro').getAttribute('aria-invalid'),
    ).toBe('true')
  })

  it('espera ≤ 60 conta, desativa VALIDAR e libera no fim', async () => {
    vi.useFakeTimers()
    const { container } = montar({
      porCodigo: () => Promise.resolve({ tipo: 'espera', segundos: 3 }),
    })
    enviar()
    await act(async () => {})

    const numero = screen.getByText('Intente de nuevo en 3 segundos.')
    expect(numero.closest('[aria-live="off"]')).not.toBeNull()
    expect(regiao(container).contains(numero)).toBe(true)
    expect(screen.getByText('ESPERE')).toBeTruthy()
    expect(validar().disabled).toBe(true)
    expect(document.activeElement).toBe(
      screen.getByRole('heading', {
        level: 2,
        name: 'Demasiadas consultas seguidas',
      }),
    )

    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('Intente de nuevo en 2 segundos.')).toBeTruthy()

    act(() => vi.advanceTimersByTime(2000))
    expect(screen.queryByText('Demasiadas consultas seguidas')).toBeNull()
    expect(validar().disabled).toBe(false)
  })

  it('envio durante a espera não pede de novo', async () => {
    vi.useFakeTimers()
    const { container, consultarPorCodigo } = montar({
      porCodigo: () => Promise.resolve({ tipo: 'espera', segundos: 3 }),
    })
    enviar()
    await act(async () => {})
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    expect(consultarPorCodigo).toHaveBeenCalledTimes(1)
  })

  it('espera sem número libera VALIDAR em 60 s', async () => {
    vi.useFakeTimers()
    montar({
      porCodigo: () => Promise.resolve({ tipo: 'espera', segundos: null }),
    })
    enviar()
    await act(async () => {})

    expect(screen.getByText('Intente de nuevo en unos momentos.')).toBeTruthy()
    act(() => vi.advanceTimersByTime(59_000))
    expect(validar().disabled).toBe(true)
    act(() => vi.advanceTimersByTime(1000))
    expect(validar().disabled).toBe(false)
    expect(screen.queryByText('Demasiadas consultas seguidas')).toBeNull()
  })

  it('bloqueio mostra os minutos e deixa VALIDAR habilitado', async () => {
    const respostas: ResultadoDaConsulta[] = [
      { tipo: 'bloqueio', segundos: 3120 },
      { tipo: 'bloqueio', segundos: 61 },
      { tipo: 'nao-encontrado' },
    ]
    const { consultarPorCodigo } = montar({
      porCodigo: () => Promise.resolve(respostas.shift() ?? { tipo: 'falha' }),
    })

    enviar()
    expect(
      await screen.findByText('Podrá intentar de nuevo en 52 minutos.'),
    ).toBeTruthy()
    expect(screen.getByText('BLOQUEADO')).toBeTruthy()
    expect(
      screen.getByText('La consulta por N° de registro y RUT está bloqueada'),
    ).toBeTruthy()
    expect(
      screen.getByText('Mientras tanto, escanee el código QR del certificado:'),
    ).toBeTruthy()
    expect(validar().disabled).toBe(false)

    enviar()
    expect(
      await screen.findByText('Podrá intentar de nuevo en 2 minutos.'),
    ).toBeTruthy()

    enviar()
    expect(
      await screen.findByText('No encontramos un certificado con esos datos'),
    ).toBeTruthy()
    expect(screen.queryByText(/Podrá intentar/)).toBeNull()
    expect(consultarPorCodigo).toHaveBeenCalledTimes(3)
  })

  it('falha', async () => {
    montar({ porCodigo: () => Promise.resolve({ tipo: 'falha' }) })
    enviar()
    expect(
      await screen.findByText(
        'No pudimos validar el certificado ahora. Intente más tarde.',
      ),
    ).toBeTruthy()
  })
})

describe('ValidacaoCertificado, modo QR', () => {
  const QR: ModoDaValidacao = { tipo: 'qr', uuid: UUID }

  it('abre consultando o uuid', async () => {
    const { promessa, resolver } = adiada<ResultadoDaConsulta>()
    const { consultarPorUuid } = montar({ modo: QR, porUuid: () => promessa })

    expect(screen.getByText('Validando…')).toBeTruthy()
    expect(consultarPorUuid).toHaveBeenCalledWith(UUID)

    await act(async () => resolver(VIGENTE_200))

    const titulo = screen.getByRole('heading', {
      level: 2,
      name: 'Certificado válido',
    })
    expect(screen.queryByText('Validando…')).toBeNull()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(
      screen
        .getByRole('link', { name: 'Validar otro certificado' })
        .getAttribute('href'),
    ).toBe('/validar')
    expect(document.activeElement).not.toBe(titulo)
    expect(
      screen.getByRole('heading', { level: 1, name: 'VALIDAR CERTIFICADO' }),
    ).toBeTruthy()
    expect(screen.queryByText(/Escanee el código QR: abre/)).toBeNull()
    expect(screen.queryByText(/tal como aparecen en el certificado\.$/)).toBe(
      null,
    )
  })

  it('não encontrado pelo QR não fala de RUT', async () => {
    const { container } = montar({
      modo: QR,
      porUuid: () => Promise.resolve({ tipo: 'nao-encontrado' }),
    })
    expect(
      await screen.findByText('No encontramos este certificado'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Revise que el código QR escaneado sea el del certificado.',
      ),
    ).toBeTruthy()
    expect(regiao(container).textContent).not.toContain('RUT')
  })

  it('espera pelo QR tenta de novo ao chegar a zero', async () => {
    vi.useFakeTimers()
    const respostas: ResultadoDaConsulta[] = [
      { tipo: 'espera', segundos: 2 },
      VIGENTE_200,
    ]
    const { consultarPorUuid } = montar({
      modo: QR,
      porUuid: () => Promise.resolve(respostas.shift() ?? { tipo: 'falha' }),
    })
    await act(async () => {})
    expect(screen.getByText('Intente de nuevo en 2 segundos.')).toBeTruthy()
    expect(consultarPorUuid).toHaveBeenCalledTimes(1)

    await act(async () => vi.advanceTimersByTime(2000))

    expect(consultarPorUuid).toHaveBeenCalledTimes(2)
    expect(consultarPorUuid).toHaveBeenLastCalledWith(UUID)
    expect(screen.getByText('Certificado válido')).toBeTruthy()
  })
})

describe('ValidacaoCertificado, PDF', () => {
  it('botão do PDF chama baixarPdf com uuid e código', async () => {
    const { baixarPdf } = montar()
    enviar()
    fireEvent.click(
      await screen.findByRole('button', { name: 'DESCARGAR PDF' }),
    )
    expect(baixarPdf).toHaveBeenCalledExactlyOnceWith(UUID, 'LOT-2026-144')
  })

  it('410 vira o cartão revogado sem data e foca o título', async () => {
    const { container } = montar({
      pdf: () => Promise.resolve({ tipo: 'revogado' }),
    })
    enviar()
    const pdf = await screen.findByRole('button', { name: 'DESCARGAR PDF' })
    // O foco do envio já está no título do válido; tirá-lo prova que o 410
    // move o foco de novo.
    pdf.focus()
    fireEvent.click(pdf)

    const titulo = await screen.findByRole('heading', {
      level: 2,
      name: 'Certificado revocado',
    })
    expect(screen.queryByRole('button', { name: 'DESCARGAR PDF' })).toBeNull()
    expect(regiao(container).textContent).not.toContain('Revocado el')
    await waitFor(() => expect(document.activeElement).toBe(titulo))
  })

  it('revogado não tem botão de PDF', async () => {
    montar({
      porCodigo: () =>
        Promise.resolve({
          tipo: 'certificado',
          certificado: REVOGADO,
          uuid: UUID,
        }),
    })
    enviar()
    expect(await screen.findByText('Certificado revocado')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'DESCARGAR PDF' })).toBeNull()
  })
})
