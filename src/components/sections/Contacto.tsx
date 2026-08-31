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
      {/*
        docs/qa/paridade/2026-08-30/espacamento.md: `contacto.linha` tem
        paddingTop/paddingBottom 30px em 375/768, e a classe canônica
        `py-6.75` (27px) já bate a partir do breakpoint `desktop` (1000px).
        Os 9px abaixo dela são `marginBottom` na referência, nas quatro
        larguras; o clone os produzia com um `<div className="h-2.25" />`
        separador — mesma altura, propriedade diferente da medida (achado C-2
        da review).
      */}
      <Row className="mb-2.25 bg-surface px-6 py-7.5 text-center desktop:py-6.75">
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

      <Row className="bg-surface px-6 py-6.75">
        <ContactForm onSubmit={onSubmit} />
      </Row>
    </section>
  )
}
