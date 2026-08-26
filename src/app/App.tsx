import { Header } from '../components/layout/Header'
import { Hero } from '../components/sections/Hero'

export function App() {
  return (
    <>
      <Header />
      <main className="pt-header-offset desktop:pt-header-desktop">
        <Hero />
      </main>
    </>
  )
}
