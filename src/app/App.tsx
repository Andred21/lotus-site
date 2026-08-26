import { Header } from '../components/layout/Header'
import { Hero } from '../components/sections/Hero'
import { QuienesSomos } from '../components/sections/QuienesSomos'

export function App() {
  return (
    <>
      <Header />
      <main className="pt-header-offset desktop:pt-header-desktop">
        <Hero />
        <section id="Somos" className="bg-surface pt-[110px] pb-4">
          <QuienesSomos />
        </section>
      </main>
    </>
  )
}
