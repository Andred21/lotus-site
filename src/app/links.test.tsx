import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../content/site'
import { App } from './App'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

/**
 * D8 do bloco 5.1.1-5.3.2: os dois CTAs do original não têm destino e ficam
 * assim (decisão de João em 2026-08-25, mantida em 2026-08-28). Qualquer
 * outro `href` vazio ou `#` reprova.
 */
const CTA_EXCEPTIONS = [
  {
    label: 'Learn More',
    href: '',
    reason: 'CTA do hero reproduzido como no original',
    decided: '2026-08-25',
  },
  {
    label: 'See More',
    href: '#',
    reason: 'CTA de cursos reproduzido como no original',
    decided: '2026-08-25',
  },
] as const

/** `href="/"` é admitido no logo (nome pelo `alt`) e em `Inicio`. */
const HOME_LINKS = [site.logoAlt, 'Inicio'] as const

function accessibleName(anchor: HTMLAnchorElement): string {
  return (
    anchor.textContent?.trim() ||
    anchor.querySelector('img')?.getAttribute('alt') ||
    ''
  )
}

function anchors() {
  render(<App />)
  return [...document.querySelectorAll('a[href]')].filter(
    (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement,
  )
}

describe('links da home (5.3.1)', () => {
  it('toda âncora #id resolve para um elemento renderizado', () => {
    const internal = anchors()
      .map((anchor) => anchor.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('#') && href.length > 1)

    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(document.getElementById(href.slice(1)), href).toBeTruthy()
    }
  })

  it('href vazio ou "#" só nos dois CTAs declarados (D8)', () => {
    const dead = anchors()
      .filter((anchor) => ['', '#'].includes(anchor.getAttribute('href') ?? ''))
      .map((anchor) => ({
        label: accessibleName(anchor),
        href: anchor.getAttribute('href') ?? '',
      }))

    expect(dead).toEqual(
      CTA_EXCEPTIONS.map(({ label, href }) => ({ label, href })),
    )
  })

  it('nenhum link sai para host externo, WordPress ou staging', () => {
    // `anchors()` renderiza: chamar uma vez por teste, senão os nós duplicam.
    const hrefs = anchors().map((anchor) => anchor.getAttribute('href') ?? '')

    expect(hrefs.filter((href) => /^https?:\/\//.test(href))).toEqual([])
    for (const href of hrefs) {
      expect(href).not.toContain('lotusotec.cl/')
      expect(href).not.toContain('stackstaging')
    }
  })

  it('o único mailto é o email institucional (D5)', () => {
    const mailto = anchors()
      .map((anchor) => anchor.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('mailto:'))

    expect(mailto).toEqual([`mailto:${site.contacto.email}`])
  })

  it('href="/" só no logo e em Inicio', () => {
    const home = anchors()
      .filter((anchor) => anchor.getAttribute('href') === '/')
      .map(accessibleName)

    expect(home).toEqual([...HOME_LINKS])
  })
})
