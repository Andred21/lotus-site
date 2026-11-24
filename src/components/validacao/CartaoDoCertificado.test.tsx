import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  POR_VENCER,
  REVOGADO,
  VENCIDO,
  VIGENTE,
} from '../../lib/certificado.fixture'
import { validacao } from '../../content/validacao'
import { CartaoDoCertificado } from './CartaoDoCertificado'
import { Selo } from './Selo'

afterEach(cleanup)

const PDF = <button type="button">DESCARGAR PDF</button>

function pares(container: HTMLElement): string[][] {
  return Array.from(container.querySelectorAll('dt')).map((dt) => [
    dt.textContent ?? '',
    dt.nextElementSibling?.textContent ?? '',
  ])
}

describe('CartaoDoCertificado', () => {
  it('mostra o certificado vigente', () => {
    const { container } = render(
      <CartaoDoCertificado certificado={VIGENTE} pdf={PDF} />,
    )
    expect(screen.getByText('VIGENTE')).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Certificado válido' }),
    ).toBeTruthy()
    expect(pares(container)).toEqual([
      ['N° de registro', 'LOT-2026-144'],
      ['Alumno', 'María Fernanda Rojas'],
      ['Curso', 'Especialistas Líneas Vivas en Media Tensión · 40 h'],
      ['Término', '12 de agosto de 2026'],
      ['Válido hasta', '12 de agosto de 2028'],
    ])
    expect(screen.getByText('DESCARGAR PDF')).toBeTruthy()
    expect(screen.queryByText('Próximo a vencer')).toBeNull()
  })

  it('mostra "Próximo a vencer" no cartão por vencer', () => {
    const { container } = render(
      <CartaoDoCertificado certificado={POR_VENCER} />,
    )
    expect(screen.getByText('Próximo a vencer')).toBeTruthy()
    expect(screen.getByText('VIGENTE')).toBeTruthy()
    expect(pares(container)).toHaveLength(5)
  })

  it('omite Válido hasta e Término quando as datas faltam', () => {
    const { container } = render(
      <CartaoDoCertificado
        certificado={{
          ...VIGENTE,
          valido_ate: null,
          turma: { end_date: null },
        }}
      />,
    )
    expect(pares(container).map(([r]) => r)).toEqual([
      'N° de registro',
      'Alumno',
      'Curso',
    ])
  })

  it('mostra o certificado vencido', () => {
    const { container } = render(
      <CartaoDoCertificado certificado={VENCIDO} pdf={PDF} />,
    )
    expect(screen.getByText('VENCIDO')).toBeTruthy()
    expect(screen.getByText('Certificado vencido')).toBeTruthy()
    expect(pares(container)).toContainEqual(['Venció el', '3 de marzo de 2026'])
    expect(screen.getByText(validacao.vencido.nota)).toBeTruthy()
    expect(screen.getByText('DESCARGAR PDF')).toBeTruthy()
  })

  it('mostra o certificado revogado sem PDF', () => {
    const { container } = render(
      <CartaoDoCertificado certificado={REVOGADO} pdf={PDF} />,
    )
    expect(screen.getByText('REVOCADO')).toBeTruthy()
    expect(screen.getByText('Certificado revocado')).toBeTruthy()
    expect(pares(container)).toEqual([
      ['N° de registro', 'LOT-2026-144'],
      ['Revocado el', '5 de octubre de 2026'],
    ])
    expect(screen.getByText(validacao.revogado.nota)).toBeTruthy()
    expect(screen.queryByText('DESCARGAR PDF')).toBeNull()
  })

  it('omite Revocado el quando revoked_at é nulo', () => {
    const { container } = render(
      <CartaoDoCertificado certificado={{ ...REVOGADO, revoked_at: null }} />,
    )
    expect(pares(container)).toEqual([['N° de registro', 'LOT-2026-144']])
  })

  it('entrega o título ao tituloRef', () => {
    let el: HTMLHeadingElement | null = null
    render(
      <CartaoDoCertificado
        certificado={VIGENTE}
        tituloRef={(n) => {
          el = n
        }}
      />,
    )
    expect(el).toBe(screen.getByRole('heading', { level: 2 }))
    expect((el as unknown as HTMLElement).tabIndex).toBe(-1)
  })
})

describe('Selo', () => {
  it.each([
    ['ok', 'bg-status-ok'],
    ['aviso', 'bg-status-warn'],
    ['perigo', 'bg-danger'],
    ['neutro', 'bg-accent-ink'],
  ] as const)('tom %s usa %s e texto branco', (tom, classe) => {
    render(<Selo tom={tom}>X</Selo>)
    const selo = screen.getByText('X')
    expect(selo.classList.contains(classe)).toBe(true)
    expect(selo.classList.contains('text-white')).toBe(true)
  })
})
