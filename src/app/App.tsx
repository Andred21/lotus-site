import { useEffect } from 'react'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Hero } from '../components/sections/Hero'
import { Contacto } from '../components/sections/Contacto'
import { Cursos } from '../components/sections/Cursos'
import { Destaques } from '../components/sections/Destaques'
import { QuienesSomos } from '../components/sections/QuienesSomos'
import {
  createContactIntake,
  unavailableContactIntake,
} from '../integrations/contact/intake'
import { createApiContactoSender } from '../integrations/contact/api-contacto'
import { createTurnstileController } from '../integrations/contact/turnstile'

// Ligação entre a home e a integração de contato; a página de validação faz
// a sua em `ValidarApp`. O adapter só existe com as duas coisas de que
// precisa: a site key pública do Turnstile (spec D6) e `crypto.subtle`, que
// calcula o hash exigido pelo OAC (spec D1) e só existe em contexto seguro —
// HTTPS ou localhost. Sem uma delas o envio falha de forma visível, sem
// simular sucesso (D7 do bloco 4.1.1-4.1.10); a seção já publica
// contacto@lotusotec.cl como saída alternativa.
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
const captcha =
  siteKey && globalThis.crypto?.subtle
    ? createTurnstileController(siteKey)
    : undefined
const submitContact = captcha
  ? createContactIntake(createApiContactoSender())
  : unavailableContactIntake

// Quem chega de /validar por `/#Cursos` carrega a página já com o fragmento:
// o navegador tenta rolar antes de o React montar as seções e fica no topo.
// Sincroniza com o DOM depois da montagem (D7).
function rolarAteFragmento() {
  const bruto = location.hash.slice(1)
  let id = bruto
  try {
    id = decodeURIComponent(bruto)
  } catch {
    // Fragmento malformado (`#%`): usa o texto cru, que não casa com id algum.
  }
  if (id) document.getElementById(id)?.scrollIntoView()
}

export function App() {
  useEffect(rolarAteFragmento, [])

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
