import { site } from '../../content/site'
import { cn } from '../../lib/cn'
import { Row } from '../layout/Row'

const FIELD_CLASS =
  'text-field font-sans text-accent-ink shadow-field h-[51px] w-full bg-transparent p-4'

/**
 * Apresentação do contato. A EAP 3.2.7 constrói só a apresentação: o
 * formulário não tem `action`, não posta e não exibe mensagem alguma —
 * sucesso, erro ou carregamento. O backend é escopo da Sprint 3, com o
 * contrato aberto em `docs/inventario/07-formulario.md`.
 */
export function Contacto() {
  return (
    <section id="Contacto" className="bg-ink pt-14.25 pb-14.5">
      <Row className="bg-surface px-6 py-6.75 text-center">
        <h2 className="font-display text-section font-bold text-title-light uppercase">
          {site.contacto.heading}
        </h2>
        <p className="mx-auto max-w-lead font-display text-body font-medium text-accent-ink">
          {site.contacto.body}
          <a href={`mailto:${site.contacto.email}`} className="text-link">
            {site.contacto.email}
          </a>
        </p>
      </Row>

      <div className="h-2.25" />

      <Row className="bg-surface px-6 py-6.75">
        <form
          className="mx-auto max-w-form"
          onSubmit={(event) => event.preventDefault()}
        >
          {site.contacto.form.fields.map((field) => (
            <p key={field.name} className="mb-4">
              <label htmlFor={field.name} className="sr-only">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.label}
                  className={cn(FIELD_CLASS, 'h-37.5 resize-y')}
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  placeholder={field.label}
                  className={FIELD_CLASS}
                />
              )}
            </p>
          ))}
          <p className="text-right">
            <button
              type="submit"
              className="rounded-pill border-[5px] border-solid border-body-ink px-button-x py-button-y font-display text-button font-bold text-body-ink uppercase"
            >
              {site.contacto.form.submit}
            </button>
          </p>
        </form>
      </Row>
    </section>
  )
}
