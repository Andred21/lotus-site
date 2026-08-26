import logo from '../../assets/LOTUS_TRANSP_Fondo-Negro-REC2.png'
import { site } from '../../content/site'
import { MobileMenu } from './MobileMenu'
import { Row } from './Row'

/**
 * Cabeçalho fixo. O original é o único elemento que troca de cor de fundo
 * entre viewports — `#ffffff` em 375/768 e `#f8f8f8` em 1440/1920 — e a
 * troca é reproduzida, não resolvida por escolha estética.
 */
export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-header bg-header-mobile shadow-header desktop:h-header-desktop desktop:bg-header">
      <Row className="flex h-full items-center justify-between">
        <a href="/" className="flex items-center">
          <img
            src={logo}
            alt={site.logoAlt}
            width={63}
            height={80}
            className="h-[43px] w-auto desktop:h-[80px]"
          />
        </a>
        <nav aria-label="Principal" className="hidden desktop:block">
          <ul className="flex items-center gap-8">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="font-sans text-menu font-semibold text-brand"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <MobileMenu />
      </Row>
    </header>
  )
}
