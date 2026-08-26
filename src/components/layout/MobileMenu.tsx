import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { site } from '../../content/site'

/**
 * Menu mobile. Único componente com estado no bloco: só aberto/fechado.
 * O painel não prende o scroll da página — o original também não prende, e
 * travar `overflow` seria comportamento novo, não paridade.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <div
      className="desktop:hidden"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) close()
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center text-accent-ink"
      >
        {open ? <X aria-hidden size={28} /> : <Menu aria-hidden size={28} />}
      </button>

      {open && (
        <nav
          id="menu-mobile"
          aria-label="Mobile"
          className="absolute inset-x-0 top-header mx-auto w-4/5 border-t-[3px] border-brand bg-header-mobile"
        >
          <ul>
            {site.nav.map((item) => (
              <li key={item.href} className="border-b border-divider">
                <a
                  href={item.href}
                  onClick={close}
                  className="block px-6 py-3 font-sans text-body text-neutral-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
