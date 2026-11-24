import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'

export function ValidarApp() {
  return (
    <>
      <Header atual="/validar" />
      <main className="pt-header-offset desktop:pt-header-desktop">
        <h1>VALIDAR CERTIFICADO</h1>
      </main>
      <Footer />
    </>
  )
}
