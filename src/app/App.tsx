import { Header } from '../components/layout/Header'

export function App() {
  return (
    <>
      <Header />
      <main className="pt-header-offset desktop:pt-header-desktop" />
    </>
  )
}
