import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../content/site'
import { App } from './App'

// vitest.config.ts não registra setup global e o bloco não pode tocá-lo.
afterEach(cleanup)

function images() {
  const { container } = render(<App />)
  return {
    container,
    imgs: [...container.querySelectorAll('img')],
  }
}

describe('imagens da home', () => {
  it('renderiza cinco img, todas com alt descritivo e dimensões numéricas', () => {
    const { imgs } = images()

    expect(imgs).toHaveLength(5)
    for (const img of imgs) {
      expect(img.getAttribute('alt'), img.getAttribute('src') ?? '').toMatch(
        /\S/,
      )
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0)
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0)
    }
  })

  it('carrega o logo do cabeçalho de imediato e as demais em lazy/async', () => {
    // D1 do bloco 5.1.1-5.3.2: sem otimizador de imagem, a dobra é a
    // política — só o logo do cabeçalho está acima dela.
    const { imgs } = images()

    const header = imgs.filter(
      (img) => img.getAttribute('alt') === site.logoAlt,
    )
    const belowFold = imgs.filter(
      (img) => img.getAttribute('alt') !== site.logoAlt,
    )

    expect(header).toHaveLength(1)
    expect(header[0]?.getAttribute('loading')).toBeNull()
    expect(belowFold).toHaveLength(4)
    for (const img of belowFold) {
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(img.getAttribute('decoding')).toBe('async')
    }
  })

  it('mantém todo svg fora da árvore de acessibilidade', () => {
    // Ícones dos destaques e do menu mobile são decorativos: o texto ao lado
    // já diz o que são.
    const { container } = images()
    const svgs = [...container.querySelectorAll('svg')]

    expect(svgs.length).toBeGreaterThan(0)
    for (const svg of svgs) {
      expect(svg.getAttribute('aria-hidden')).toBe('true')
    }
  })
})
