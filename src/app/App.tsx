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

// Fiação provisória até a Task 6: sem site key não há widget nem token, e o
// envio cai no caminho de D7.
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
const contactSender = siteKey
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
        <Contacto onSubmit={submitContact} />
      </main>
      <Footer />
    </>
  )
}
