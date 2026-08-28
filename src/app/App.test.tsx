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
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3)
    for (const curso of site.cursos.items) {
      expect(screen.getByText(curso.nombre)).toBeTruthy()
    }
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
    expect(screen.getByText(site.footer.copyright)).toBeTruthy()
  })

  it('mantém as landmarks de cabeçalho, conteúdo e rodapé', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('contentinfo')).toBeTruthy()
  })
})

describe('App — fiação do contato', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sem chave configurada, o envio falha e nenhuma requisição sai', async () => {
    // D7 da spec: build sem `VITE_WEB3FORMS_ACCESS_KEY` recebe
    // `unavailableContactSender`. O ambiente de teste não define a chave, e a
    // asserção abaixo trava isso: chave presente faz o teste falhar alto em
    // vez de exercitar silenciosamente o outro caminho.
    expect(import.meta.env.VITE_WEB3FORMS_ACCESS_KEY).toBeFalsy()

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

    expect(
      await screen.findByText(site.contacto.form.feedback.error),
    ).toBeTruthy()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
