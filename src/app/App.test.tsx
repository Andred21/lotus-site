import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { site } from '../content/site'
import { App } from './App'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

describe('App', () => {
  it('compõe as cinco seções da home, na ordem do original', () => {
    const { container } = render(<App />)
    const ids = [...container.querySelectorAll('section[id]')].map(
      (section) => section.id,
    )

    expect(ids).toEqual(['Intrucción', 'Somos', 'Cursos', 'Contacto'])
  })

  it('expõe o conteúdo de cada seção', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: site.hero.title }),
    ).toBeTruthy()
    expect(screen.getByText(site.institucional.body)).toBeTruthy()
    for (const curso of site.cursos.items) {
      expect(screen.getByText(curso.nombre)).toBeTruthy()
    }
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
    expect(screen.getByText(site.footer.copyright)).toBeTruthy()
  })

  it('publica um h1 seguido de cinco h2, na ordem do documento', () => {
    // D2 do bloco 5.1.1-5.3.2: o subtítulo do hero deixa de ser h3 e os
    // destaques sobem de h4 para h2. Nenhum texto novo entra.
    render(<App />)

    const headings = screen
      .getAllByRole('heading')
      .map((heading) => [heading.tagName, heading.textContent])

    expect(headings).toEqual([
      ['H1', site.hero.title],
      ['H2', 'ENERGIZADAS'],
      ['H2', 'ALUMNOS'],
      ['H2', 'CERTIFICACIÓN'],
      ['H2', site.cursos.heading],
      ['H2', site.contacto.heading],
    ])
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5)
  })

  it('mantém as landmarks e nomeia as seções que têm heading', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('contentinfo')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeTruthy()

    // `section` só vira `region` quando tem nome acessível. `#Somos` fica
    // sem nome de propósito: não tem heading de seção e D2 veda texto novo.
    expect(screen.getByRole('region', { name: site.hero.title })).toBeTruthy()
    expect(
      screen.getByRole('region', { name: site.cursos.heading }),
    ).toBeTruthy()
    expect(
      screen.getByRole('region', { name: site.contacto.heading }),
    ).toBeTruthy()
    expect(screen.getAllByRole('region')).toHaveLength(3)
  })
})

describe('App — fiação do contato', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sem site key configurada, o envio falha e nenhuma requisição sai', async () => {
    // D7 da spec: build sem `VITE_TURNSTILE_SITE_KEY` recebe
    // `unavailableContactSender`. O ambiente de teste não define a chave, e a
    // asserção abaixo trava isso: chave presente faz o teste falhar alto em
    // vez de exercitar silenciosamente o outro caminho.
    expect(import.meta.env.VITE_TURNSTILE_SITE_KEY).toBeFalsy()

    const fetchSpy = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchSpy)
    render(<App />)

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

    // Sem site key não há widget, então o input oculto do token nunca existe
    // no FormData: o schema recusa por falta de captcha antes mesmo de
    // `unavailableContactSender` entrar em jogo — D7 falha ainda mais cedo,
    // no cliente. Como o captcha conta como erro de campo (precisão 2 do
    // Passo 5 do brief da Task 6), o status é "invalid", não o genérico.
    expect(await screen.findByText('Confirme que no es un robot.')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe(
      site.contacto.form.feedback.invalid,
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
