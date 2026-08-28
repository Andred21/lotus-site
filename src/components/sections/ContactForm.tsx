import type { FormEvent } from 'react'
import { site } from '../../content/site'
import { cn } from '../../lib/cn'
import { CONTACT_REQUIRED_FIELDS } from '../../lib/contact-fields'
import type { ContactFieldErrors } from '../../lib/contact-schema'

/**
 * Resultado que o formulário entende. É declarado aqui, e não importado de
 * `src/integrations/`, porque `eslint.config.js:63-77` proíbe o componente de
 * importar integração — inclusive tipo. A ligação é estrutural e acontece em
 * `src/app/App.tsx`, o único lugar autorizado a conhecer os dois lados.
 */
export type ContactSubmitOutcome =
  | { status: 'sent' }
  | { status: 'invalid'; fieldErrors: ContactFieldErrors }
  | { status: 'failed' }

export type ContactSubmitHandler = (
  formData: FormData,
) => Promise<ContactSubmitOutcome>

type ContactFormProps = {
  onSubmit: ContactSubmitHandler
}

const FIELD_CLASS =
  'text-field font-sans text-accent-ink shadow-field h-[51px] w-full bg-transparent p-4'

/**
 * Formulário de contato. `noValidate` desliga a validação nativa do browser
 * para que a mensagem exibida seja sempre a do schema, em es-CL; `required`
 * continua no HTML e é o que a tecnologia assistiva anuncia.
 */
export function ContactForm({ onSubmit }: ContactFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onSubmit(new FormData(event.currentTarget))
  }

  return (
    <form className="mx-auto max-w-form" noValidate onSubmit={handleSubmit}>
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
              required={CONTACT_REQUIRED_FIELDS.includes(field.name)}
              className={cn(FIELD_CLASS, 'h-37.5 resize-y')}
            />
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.name === 'email' ? 'email' : 'text'}
              placeholder={field.label}
              required={CONTACT_REQUIRED_FIELDS.includes(field.name)}
              className={FIELD_CLASS}
            />
          )}
        </p>
      ))}

      {/* Honeypot: humano não vê, bot trivial preenche. Fora da árvore de
          acessibilidade e fora da ordem de tabulação, sem pixel na tela. */}
      <input
        type="text"
        name="botcheck"
        defaultValue=""
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <p className="text-right">
        <button
          type="submit"
          className="rounded-pill border-[5px] border-solid border-body-ink px-button-x py-button-y font-display text-button font-bold text-body-ink uppercase"
        >
          {site.contacto.form.submit}
        </button>
      </p>
    </form>
  )
}
