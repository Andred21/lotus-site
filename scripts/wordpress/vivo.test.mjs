import { describe, expect, it, vi } from 'vitest'
import { PARA_VIVO, WORDPRESS_IP, exigirVivo, forcar } from './lib/vivo.mjs'

describe('WORDPRESS_IP e PARA_VIVO (spec D9)', () => {
  it('mandam o domínio e o www para o IP do WordPress', () => {
    expect(WORDPRESS_IP).toBe('185.146.167.195')
    expect(PARA_VIVO).toBe(
      'MAP lotusotec.cl 185.146.167.195, MAP www.lotusotec.cl 185.146.167.195',
    )
  })
})

describe('forcar', () => {
  it('responde o IP pedido na forma simples', () => {
    const callback = vi.fn()
    forcar('185.146.167.195')('lotusotec.cl', {}, callback)
    expect(callback).toHaveBeenCalledWith(null, '185.146.167.195', 4)
  })

  it('responde a lista quando o Node pede todos os endereços', () => {
    const callback = vi.fn()
    forcar('185.146.167.195')('lotusotec.cl', { all: true }, callback)
    expect(callback).toHaveBeenCalledWith(null, [
      { address: '185.146.167.195', family: 4 },
    ])
  })
})

describe('exigirVivo', () => {
  it('aceita 200 do Apache do WordPress', () => {
    expect(() => exigirVivo(200, { server: 'Apache' })).not.toThrow()
  })

  it('reprova a CloudFront mesmo com 200: é o clone, não o vivo', () => {
    expect(() => exigirVivo(200, { server: 'CloudFront' })).toThrow(
      'a referência não é o WordPress',
    )
  })

  it('reprova o host esvaziado com a mensagem de B7', () => {
    expect(() => exigirVivo(403, { server: 'Apache' })).toThrow(
      'o WordPress vivo respondeu 403 em 185.146.167.195: depois de B7 (7.2.7) não há vivo para comparar',
    )
  })
})
