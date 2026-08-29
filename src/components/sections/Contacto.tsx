import { site } from '../../content/site'
import { Row } from '../layout/Row'
import { ContactForm, type ContactSubmitHandler } from './ContactForm'

type ContactoProps = {
  onSubmit: ContactSubmitHandler
}

/**
 * Seção de contato. Continua sendo apresentação: recebe o callback de envio e
 * repassa ao formulário, sem conhecer serviço, provedor ou rede — a fronteira
 * é catraca de `pnpm lint`.
 */
export function Contacto({ onSubmit }: ContactoProps) {
  return (
    <section
      id="Contacto"
      aria-labelledby="contacto-heading"
      className="bg-ink pt-14.25 pb-14.5"
    >
      <Row className="bg-surface px-6 py-6.75 text-center">
        <h2
          id="contacto-heading"
          className="font-display text-section font-bold text-title-light uppercase"
        >
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
        <ContactForm onSubmit={onSubmit} />
      </Row>
    </section>
  )
}
