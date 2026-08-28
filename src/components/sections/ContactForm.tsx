import { useEffect, useRef, useState, type FormEvent } from 'react'
import { site } from '../../content/site'
import { cn } from '../../lib/cn'
import {
  CONTACT_LIMITS,
  CONTACT_REQUIRED_FIELDS,
} from '../../lib/contact-fields'
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

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

const FIELD_CLASS =
  'text-field font-sans text-accent-ink shadow-field h-[51px] w-full bg-transparent p-4'

/* O mesmo limite que o schema aplica, aplicado antes na caixa de texto: o
   browser corta o excesso e o payload excessivo não chega a virar requisição. */
const MAX_LENGTH = {
  nombre: CONTACT_LIMITS.nombre.max,
  email: CONTACT_LIMITS.email.max,
  empresa: CONTACT_LIMITS.empresa.max,
  mensaje: CONTACT_LIMITS.mensaje.max,
} as const

/**
 * Formulário de contato. `noValidate` desliga a validação nativa do browser
 * para que a mensagem exibida seja sempre a do schema, em es-CL; `required`
 * continua no HTML e é o que a tecnologia assistiva anuncia.
 */
export function ContactForm({ onSubmit }: ContactFormProps) {
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const statusRef = useRef<HTMLParagraphElement>(null)

  // Sincroniza foco com o DOM já pintado: o resultado precisa estar escrito
  // no bloco de status antes de o foco chegar nele.
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      statusRef.current?.focus()
    }
  }, [status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    setStatus('submitting')
    setFieldErrors({})

    // Handler que rejeita não pode deixar o formulário preso em
    // `submitting`: botão desabilitado e nenhuma saída além de recarregar.
    let result: ContactSubmitOutcome
    try {
      result = await onSubmit(new FormData(form))
    } catch {
      setStatus('error')
      return
    }

    if (result.status === 'sent') {
      setStatus('success')
      form.reset()
      return
    }

    if (result.status === 'invalid') {
      setFieldErrors(result.fieldErrors)
    }
    setStatus('error')
  }

  // Derivado do estado, nunca guardado: erro de campo e erro geral são a
  // mesma submissão vista de dois ângulos.
  // Só erro de campo renderizado vira "revise los campos marcados": o
  // honeypot não aparece na tela, então falha nele cai na mensagem geral e o
  // bot não descobre qual campo o denunciou.
  const feedback = site.contacto.form.feedback
  const hasFieldErrors = site.contacto.form.fields.some(
    (field) => fieldErrors[field.name],
  )
  const statusMessage =
    status === 'submitting'
      ? feedback.submitting
      : status === 'success'
        ? feedback.success
        : status === 'error'
          ? hasFieldErrors
            ? feedback.invalid
            : feedback.error
          : ''

  return (
    <form className="mx-auto max-w-form" noValidate onSubmit={handleSubmit}>
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={cn(
          'font-display text-body',
          // A região viva fica montada desde o início — `aria-live` só anuncia
          // mudança dentro de nó já existente —, mas vazia não ocupa espaço:
          // a margem entra junto com o texto e o baseline estático não muda.
          statusMessage ? 'mb-4' : undefined,
          status === 'error' ? 'text-danger' : 'text-accent-ink',
        )}
      >
        {statusMessage}
      </p>

      {site.contacto.form.fields.map((field) => {
        const error = fieldErrors[field.name]
        const describedBy = error ? `${field.name}-error` : undefined

        return (
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
                maxLength={MAX_LENGTH[field.name]}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={cn(FIELD_CLASS, 'h-37.5 resize-y')}
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.name === 'email' ? 'email' : 'text'}
                placeholder={field.label}
                required={CONTACT_REQUIRED_FIELDS.includes(field.name)}
                maxLength={MAX_LENGTH[field.name]}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={FIELD_CLASS}
              />
            )}
            {error ? (
              <span
                id={`${field.name}-error`}
                className="mt-1 block font-sans text-field text-danger"
              >
                {error}
              </span>
            ) : null}
          </p>
        )
      })}

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
          disabled={status === 'submitting'}
          className="rounded-pill border-[5px] border-solid border-body-ink px-button-x py-button-y font-display text-button font-bold text-body-ink uppercase disabled:opacity-60"
        >
          {site.contacto.form.submit}
        </button>
      </p>
    </form>
  )
}
