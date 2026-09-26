import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Hero } from '../components/sections/Hero'
import { Contacto } from '../components/sections/Contacto'
import { Cursos } from '../components/sections/Cursos'
import { Destaques } from '../components/sections/Destaques'
import { QuienesSomos } from '../components/sections/QuienesSomos'
import {
  createContactIntake,
  unavailableContactSender,
} from '../integrations/contact/intake'
import { createApiContactoSender } from '../integrations/contact/api-contacto'
import { createTurnstileController } from '../integrations/contact/turnstile'

// Única ligação entre componente e integração no repositório. O adapter só
// existe com as duas coisas de que precisa: a site key pública do Turnstile
// (spec D6) e `crypto.subtle`, que calcula o hash exigido pelo OAC (spec D1)
// e só existe em contexto seguro — HTTPS ou localhost. Sem uma delas o envio
// falha de forma visível, sem simular sucesso (D7 do bloco 4.1.1-4.1.10); a
// seção já publica contacto@lotusotec.cl como saída alternativa.
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
const captcha =
  siteKey && globalThis.crypto?.subtle
    ? createTurnstileController(siteKey)
    : undefined
const contactSender = captcha
  ? createApiContactoSender()
  : unavailableContactSender
const submitContact = createContactIntake(contactSender)

export function App() {
  return (
    <>
      <Header />
      <main className="pt-header-offset desktop:pt-header-desktop">
        <Hero />
        <section id="Somos" className="bg-surface pt-27.5 pb-4">
          <QuienesSomos />
          <Destaques />
        </section>
        <Cursos />
        <Contacto onSubmit={submitContact} captcha={captcha} />
      </main>
      <Footer />
    </>
  )
}
