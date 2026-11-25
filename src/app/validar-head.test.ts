import { describe, expect, it } from 'vitest'
import html from '../../validar/index.html?raw'
import home from '../../index.html?raw'
import { site } from '../content/site'

/**
 * `validar/index.html` é a segunda página do site (ADR-SITE-007). Catraca do
 * `<head>`: a página mostra o nome do aluno, então não é indexável (D9), e
 * não herda canonical, social nem JSON-LD da home.
 */
const doc = new DOMParser().parseFromString(html, 'text/html')
const docHome = new DOMParser().parseFromString(home, 'text/html')

const ICONES = 'link[rel~="icon"], link[rel="apple-touch-icon"]'

function hrefs(d: Document): string[] {
  return [...d.querySelectorAll(ICONES)]
    .map((n) => n.getAttribute('href') ?? '')
    .sort()
}

describe('validar/index.html — head', () => {
  it('declara o idioma do site', () => {
    expect(doc.documentElement.lang).toBe(site.locale)
  })

  it('publica o title da página', () => {
    expect(doc.querySelector('title')?.textContent).toBe(
      'Validar certificado | LOTUS OTEC',
    )
  })

  it('publica um meta robots noindex (D9)', () => {
    const robots = doc.querySelectorAll('meta[name="robots"]')
    expect(robots).toHaveLength(1)
    expect(robots[0]?.getAttribute('content')).toBe('noindex')
  })

  it('não herda canonical, og, twitter nem JSON-LD da home', () => {
    expect(doc.querySelector('link[rel="canonical"]')).toBeNull()
    expect(doc.querySelector('meta[property^="og:"]')).toBeNull()
    expect(doc.querySelector('meta[name^="twitter:"]')).toBeNull()
    expect(doc.querySelector('script[type="application/ld+json"]')).toBeNull()
  })

  it('só carrega script externo, o módulo da página (CSP script-src self)', () => {
    const scripts = [...doc.querySelectorAll('script')]
    expect(scripts.every((s) => s.hasAttribute('src'))).toBe(true)
    expect(scripts).toHaveLength(1)
    expect(scripts[0]?.getAttribute('type')).toBe('module')
    expect(scripts[0]?.getAttribute('src')).toBe('/src/validar.tsx')
  })

  it('usa os mesmos ícones da home', () => {
    expect(hrefs(doc)).not.toHaveLength(0)
    expect(hrefs(doc)).toEqual(hrefs(docHome))
  })
})
