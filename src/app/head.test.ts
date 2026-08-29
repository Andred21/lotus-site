import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import html from '../../index.html?raw'
import { site } from '../content/site'

/**
 * O `<head>` é estático em `index.html` (D10 do bloco 5.1.1-5.3.2). Este
 * arquivo é a catraca: o conteúdo continua com uma fonte só, `site.ts`, e
 * qualquer deriva entre os dois reprova aqui, dentro de `pnpm check`.
 */
const CANONICAL = 'https://lotusotec.cl/'
const TITLE = 'LOTUS | OTEC'
const SOCIAL_IMAGE = `${CANONICAL}LOTUS-G2_TRANSP_Fondo-Blanco.png`

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

describe('index.html — Open Graph e Twitter (5.1.3)', () => {
  it('publica og:* com título, descrição, URL e locale aprovados (D3)', () => {
    expect(content('meta[property="og:type"]')).toBe('website')
    expect(content('meta[property="og:url"]')).toBe(CANONICAL)
    expect(content('meta[property="og:site_name"]')).toBe(site.hero.title)
    expect(content('meta[property="og:title"]')).toBe(TITLE)
    expect(content('meta[property="og:description"]')).toBe(site.hero.body)
    expect(content('meta[property="og:locale"]')).toBe('es_CL')
  })

  it('publica o logo institucional como imagem social, em URL absoluta (D4)', () => {
    expect(content('meta[property="og:image"]')).toBe(SOCIAL_IMAGE)
    expect(content('meta[property="og:image:width"]')).toBe('500')
    expect(content('meta[property="og:image:height"]')).toBe('500')
    expect(SOCIAL_IMAGE.startsWith('https://')).toBe(true)
  })

  it('publica twitter:* espelhando og:*, com card summary (D4)', () => {
    expect(content('meta[name="twitter:card"]')).toBe('summary')
    expect(content('meta[name="twitter:title"]')).toBe(TITLE)
    expect(content('meta[name="twitter:description"]')).toBe(site.hero.body)
    expect(content('meta[name="twitter:image"]')).toBe(SOCIAL_IMAGE)
  })
})

/**
 * D5: só propriedades comprovadas. `strictObject` reprova chave extra —
 * certificação, horas e cursos continuam pendentes com João e não entram.
 */
const organization = z.strictObject({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('Organization'),
  name: z.literal(site.hero.title),
  url: z.literal(CANONICAL),
  logo: z.literal(SOCIAL_IMAGE),
  email: z.literal(site.contacto.email),
})

function jsonLd(): Record<string, unknown> {
  const raw = only('script[type="application/ld+json"]').textContent ?? ''
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('JSON-LD não é um objeto')
  }
  return parsed as Record<string, unknown>
}

describe('index.html — JSON-LD (5.1.4)', () => {
  it('publica uma Organization com name, url, logo e email, e nada mais', () => {
    const result = organization.safeParse(jsonLd())
    expect(result.error?.issues ?? []).toEqual([])
    expect(result.success).toBe(true)
  })

  it('reprovaria uma propriedade não aprovada', () => {
    const extra = { ...jsonLd(), telephone: '+56' }
    expect(organization.safeParse(extra).success).toBe(false)
  })
})
