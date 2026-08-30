import { describe, expect, it } from 'vitest'
import { preloadCritical, preloadTags } from './preload-critical.mjs'

const bundle = {
  'assets/index-a1b2c3.css': {
    type: 'asset',
    fileName: 'assets/index-a1b2c3.css',
  },
  'assets/montserrat-700-d4e5f6.woff2': {
    type: 'asset',
    fileName: 'assets/montserrat-700-d4e5f6.woff2',
  },
  'assets/open-sans-500-070809.woff2': {
    type: 'asset',
    fileName: 'assets/open-sans-500-070809.woff2',
  },
  'assets/shutterstock_1444636373-1-scaled-0a1b2c.jpg': {
    type: 'asset',
    fileName: 'assets/shutterstock_1444636373-1-scaled-0a1b2c.jpg',
  },
}

/** @param {{ bundle?: Record<string, { fileName?: string }> }} ctx */
const injetar = (ctx) => preloadTags(ctx)

describe('preloadTags', () => {
  it('preloada as duas faces acima da dobra, com crossorigin', () => {
    const fontes = injetar({ bundle }).filter((tag) => tag.attrs.as === 'font')
    expect(fontes.map((tag) => tag.attrs.href)).toEqual([
      '/assets/montserrat-700-d4e5f6.woff2',
      '/assets/open-sans-500-070809.woff2',
    ])
    for (const fonte of fontes) {
      expect(fonte.attrs.crossorigin).toBe('anonymous')
      expect(fonte.attrs.type).toBe('font/woff2')
    }
  })

  it('não preloada a foto do hero: não é o elemento do LCP medido', () => {
    // D10 da spec só conserva mudança dirigida pelo gargalo medido. O LCP
    // medido é o `<h1 id="hero-heading">` (`lcp-breakdown-insight` de
    // `docs/qa/performance/2026-08-29/`), não a foto — preloadar a imagem
    // disputaria banda sem delta próprio.
    expect(
      injetar({ bundle }).filter((tag) => tag.attrs.as === 'image'),
    ).toEqual([])
  })

  it('injeta as tags no head', () => {
    for (const tag of injetar({ bundle })) {
      expect(tag.injectTo).toBe('head-prepend')
      expect(tag.tag).toBe('link')
      expect(tag.attrs.rel).toBe('preload')
    }
  })

  it('não injeta nada no dev server, onde não há bundle', () => {
    expect(injetar({ bundle: undefined })).toEqual([])
  })

  it('não inventa tag para alvo ausente do bundle', () => {
    expect(
      injetar({
        bundle: {
          'assets/index-a1b2c3.css': bundle['assets/index-a1b2c3.css'],
        },
      }),
    ).toEqual([])
  })
})

describe('preloadCritical', () => {
  it('expõe o handler como plugin de build do Vite', () => {
    const plugin = preloadCritical()
    expect(plugin.name).toBe('lotus-preload-critical')
    expect(plugin.transformIndexHtml.order).toBe('post')
  })
})
