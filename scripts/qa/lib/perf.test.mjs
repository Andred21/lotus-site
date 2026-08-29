import { describe, expect, it } from 'vitest'
import { elementoLcp, resumoMarkdown } from './perf.mjs'

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

// Formato real do Lighthouse 13.4.1: o audit clássico vem `null` e o nó do
// LCP mora no audit `*-insight`.
const lhr13 = {
  ...lhr,
  audits: {
    ...lhr.audits,
    'largest-contentful-paint-element': null,
    'lcp-breakdown-insight': {
      id: 'lcp-breakdown-insight',
      details: {
        type: 'list',
        items: [
          { type: 'table', items: [{ subpart: 'timeToFirstByte' }] },
          {
            type: 'node',
            snippet: '<h1 id="hero-heading" class="font-display">',
            nodeLabel: 'LOTUS OTEC',
          },
        ],
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

  it('aponta o relatório cru da própria execução', () => {
    expect(resumoMarkdown(lhr)).toContain('`lighthouse.json`')
    expect(resumoMarkdown(lhr13, 'lighthouse-pos-otimizacao.json')).toContain(
      '`lighthouse-pos-otimizacao.json`',
    )
  })
})

describe('elementoLcp', () => {
  it('lê o audit clássico quando o Lighthouse ainda o popula', () => {
    expect(elementoLcp(lhr)).toBe('<h1 id="hero-heading">')
  })

  it('lê o nó do `lcp-breakdown-insight` no formato do Lighthouse 13', () => {
    expect(elementoLcp(lhr13)).toBe(
      '<h1 id="hero-heading" class="font-display"> — "LOTUS OTEC"',
    )
    expect(resumoMarkdown(lhr13)).toContain('elemento do LCP: <h1')
  })

  it('não inventa elemento quando nenhum dos dois audits traz um', () => {
    const semNada = {
      ...lhr,
      audits: {
        ...lhr.audits,
        'largest-contentful-paint-element': undefined,
      },
    }
    expect(elementoLcp(semNada)).toBe('não reportado')
    expect(resumoMarkdown(semNada)).toContain('elemento do LCP: não reportado')
  })
})
