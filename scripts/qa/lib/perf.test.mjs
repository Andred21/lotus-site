import { describe, expect, it } from 'vitest'
import { resumoMarkdown } from './perf.mjs'

const lhr = {
  finalDisplayedUrl: 'http://localhost:5184/',
  fetchTime: '2026-08-29T12:00:00.000Z',
  categories: {
    performance: { title: 'Performance', score: 0.91 },
    accessibility: { title: 'Accessibility', score: 1 },
    'best-practices': { title: 'Best Practices', score: 0.96 },
    seo: { title: 'SEO', score: 1 },
  },
  audits: {
    'largest-contentful-paint': {
      title: 'LCP',
      displayValue: '1,2 s',
      numericValue: 1200,
    },
    'cumulative-layout-shift': {
      title: 'CLS',
      displayValue: '0',
      numericValue: 0,
    },
    'largest-contentful-paint-element': {
      title: 'Elemento do LCP',
      details: {
        items: [{ items: [{ node: { snippet: '<h1 id="hero-heading">' } }] }],
      },
    },
  },
}

describe('resumoMarkdown', () => {
  it('registra as quatro categorias com o score medido', () => {
    const md = resumoMarkdown(lhr)
    expect(md).toContain('| Performance | 91 |')
    expect(md).toContain('| Accessibility | 100 |')
    expect(md).toContain('| Best Practices | 96 |')
    expect(md).toContain('| SEO | 100 |')
  })

  it('registra LCP, CLS e o elemento do LCP', () => {
    const md = resumoMarkdown(lhr)
    expect(md).toContain('1,2 s')
    expect(md).toContain('<h1 id="hero-heading">')
  })

  it('diz o que a medição não prova, para o score não virar meta', () => {
    expect(resumoMarkdown(lhr)).toContain('laboratório')
  })

  it('não inventa elemento de LCP quando o audit não traz um', () => {
    const semElemento = {
      ...lhr,
      audits: { ...lhr.audits, 'largest-contentful-paint-element': undefined },
    }
    expect(resumoMarkdown(semElemento)).toContain(
      'elemento do LCP: não reportado',
    )
  })
})
