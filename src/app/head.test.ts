import { describe, expect, it } from 'vitest'
import html from '../../index.html?raw'
import { site } from '../content/site'

/**
 * O `<head>` é estático em `index.html` (D10 do bloco 5.1.1-5.3.2). Este
 * arquivo é a catraca: o conteúdo continua com uma fonte só, `site.ts`, e
 * qualquer deriva entre os dois reprova aqui, dentro de `pnpm check`.
 */
const CANONICAL = 'https://lotusotec.cl/'
const TITLE = 'LOTUS | OTEC'

const doc = new DOMParser().parseFromString(html, 'text/html')

/** Exatamente um nó para o seletor — duplicata é erro tanto quanto ausência. */
function only(selector: string): Element {
  const nodes = doc.querySelectorAll(selector)
  expect(nodes, selector).toHaveLength(1)
  const node = nodes[0]
  if (!node) throw new Error(`${selector} ausente em index.html`)
  return node
}

function content(selector: string): string {
  return only(selector).getAttribute('content') ?? ''
}

describe('index.html — metadata básica (5.1.1)', () => {
  it('declara o idioma es-CL', () => {
    expect(doc.documentElement.lang).toBe(site.locale)
  })

  it('publica o title do original', () => {
    expect(only('title').textContent).toBe(TITLE)
  })

  it('publica a canonical de produção', () => {
    expect(only('link[rel="canonical"]').getAttribute('href')).toBe(CANONICAL)
  })

  it('publica a description como o corpo do hero, verbatim (D3)', () => {
    expect(content('meta[name="description"]')).toBe(site.hero.body)
  })

  it('não publica meta robots: produção é indexável (D6)', () => {
    expect(doc.querySelector('meta[name="robots"]')).toBeNull()
  })
})
