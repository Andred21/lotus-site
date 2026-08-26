import { describe, expect, it } from 'vitest'
import { assetFileName, cssColor, rgbToHex } from './site.mjs'

describe('assetFileName', () => {
  it('mantém o basename de um asset do domínio principal', () => {
    expect(
      assetFileName('https://lotusotec.cl/wp-content/uploads/2022/08/logo.png'),
    ).toBe('logo.png')
  })

  it('prefixa o host de staging para não colidir com o domínio principal', () => {
    expect(
      assetFileName('https://lotusotec-cl.us.stackstaging.com/img/logo.png'),
    ).toBe('staging-logo.png')
  })

  it('decodifica caracteres escapados na URL', () => {
    expect(
      assetFileName('https://lotusotec.cl/wp-content/uploads/Logo%20LOTUS.png'),
    ).toBe('Logo LOTUS.png')
  })
})

describe('assetFileName — fallback', () => {
  it('não devolve nome vazio para URL terminada em barra', () => {
    expect(assetFileName('https://lotusotec.cl/wp-content/uploads/')).toBe(
      'asset',
    )
  })
})

describe('rgbToHex', () => {
  it('converte rgb do getComputedStyle para hex', () => {
    expect(rgbToHex('rgb(15, 23, 42)')).toBe('#0f172a')
  })

  it('preserva o valor original quando não é rgb', () => {
    expect(rgbToHex('transparent')).toBe('transparent')
  })

  it('reporta rgba totalmente transparente como transparent, não como preto', () => {
    expect(rgbToHex('rgba(0, 0, 0, 0)')).toBe('transparent')
  })

  it('converte rgba com alpha > 0 ignorando o canal alpha', () => {
    expect(rgbToHex('rgba(15, 23, 42, 0.5)')).toBe('#0f172a')
  })
})

describe('cssColor', () => {
  it('devolve hex quando a cor é opaca', () => {
    expect(cssColor('rgb(36, 162, 224)')).toBe('#24a2e0')
    expect(cssColor('rgba(0, 0, 0, 1)')).toBe('#000000')
  })

  it('preserva o alpha em vez de fingir opacidade', () => {
    expect(cssColor('rgba(0, 0, 0, 0.03)')).toBe('rgba(0, 0, 0, 0.03)')
    expect(cssColor('rgba(84, 84, 84, 0.32)')).toBe('rgba(84, 84, 84, 0.32)')
  })

  it('trata alpha zero como transparente', () => {
    expect(cssColor('rgba(255, 255, 255, 0)')).toBe('transparent')
  })

  it('devolve o valor original quando não reconhece o formato', () => {
    expect(cssColor('currentColor')).toBe('currentColor')
  })
})
