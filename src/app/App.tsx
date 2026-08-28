import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Hero } from '../components/sections/Hero'
import { Contacto } from '../components/sections/Contacto'
import { Cursos } from '../components/sections/Cursos'
import { Destaques } from '../components/sections/Destaques'
import { QuienesSomos } from '../components/sections/QuienesSomos'
import { unavailableContactSender } from '../integrations/contact/sender'
import { createContactService } from '../integrations/contact/service'
import { createContactFormSubmit } from '../integrations/contact/submit'

// Única ligação entre componente e integração no repositório. O sender real
// entra na 4.1.7; até lá — e em qualquer build sem chave configurada — o envio
// falha de forma visível, sem simular sucesso (D7 da spec).
const submitContact = createContactFormSubmit(
  createContactService(unavailableContactSender),
)

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
