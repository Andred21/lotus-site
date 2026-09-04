import { describe, expect, it } from 'vitest'
import {
  CABECALHO,
  CARDS,
  divergencias,
  linhasCabecalho,
  linhasCards,
} from './header-cursos.mjs'

describe('CARDS', () => {
  it('dá nome único a cada card medido', () => {
    const nomes = CARDS.map((card) => card.nome)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('dá container, imagem e legenda nos dois lados', () => {
    for (const card of CARDS) {
      for (const lado of /** @type {const} */ (['referencia', 'clone'])) {
        expect(card[lado].container, `${card.nome}.${lado}`).toBeTruthy()
        expect(card[lado].imagem, `${card.nome}.${lado}`).toBeTruthy()
        expect(card[lado].legenda, `${card.nome}.${lado}`).toBeTruthy()
      }
    }
  })

  it('escopa todo seletor em #Cursos', () => {
    for (const card of CARDS) {
      for (const lado of /** @type {const} */ (['referencia', 'clone'])) {
        for (const seletor of Object.values(card[lado])) {
          expect(seletor, card.nome).toContain('#Cursos')
        }
      }
    }
  })
})

describe('CABECALHO', () => {
  it('tem seletor dos dois lados', () => {
    expect(CABECALHO.referencia).toBeTruthy()
    expect(CABECALHO.clone).toBeTruthy()
  })
})

describe('linhasCabecalho', () => {
  it('põe referência e clone na mesma linha e marca o que não bate', () => {
    const markdown = linhasCabecalho([
      {
        nome: 'cabecalho',
        largura: 1440,
        referencia: {
          backgroundColor: 'rgb(0, 0, 0)',
          height: 80,
          boxShadow: 'none',
        },
        clone: {
          backgroundColor: 'rgb(248, 248, 248)',
          height: 80,
          boxShadow: 'none',
        },
      },
    ])
    expect(markdown).toContain('rgb(0, 0, 0)')
    expect(markdown).toContain('rgb(248, 248, 248)')
    expect(markdown).toContain('**não**')
    expect(markdown).toContain(
      '| `cabecalho` | 1440 | height | 80 | 80 | sim |',
    )
  })

  it('marca ausência sem inventar valor', () => {
    const markdown = linhasCabecalho([
      {
        nome: 'cabecalho',
        largura: 375,
        referencia: null,
        clone: {
          backgroundColor: 'rgb(255, 255, 255)',
          height: 80,
          boxShadow: 'none',
        },
      },
    ])
    expect(markdown).toContain('ausente na referência')
    expect(markdown).not.toContain('rgb(255, 255, 255)')
  })
})

describe('linhasCards', () => {
  it('reporta tamanho intrínseco e renderizado do card', () => {
    const markdown = linhasCards([
      {
        nome: 'curso.2.alta-tension',
        largura: 1440,
        referencia: {
          larguraColuna: 320.39,
          larguraIntrinseca: 250,
          alturaIntrinseca: 250,
          larguraRenderizada: 250,
          alturaRenderizada: 250,
          offsetEsquerdo: 35.2,
          offsetDireito: 35.2,
          ateLegenda: 29.69,
        },
        clone: {
          larguraColuna: 320.39,
          larguraIntrinseca: 250,
          alturaIntrinseca: 250,
          larguraRenderizada: 320.39,
          alturaRenderizada: 240.29,
          offsetEsquerdo: 0,
          offsetDireito: 0,
          ateLegenda: 24,
        },
      },
    ])
    expect(markdown).toContain('curso.2.alta-tension')
    expect(markdown).toContain('larguraRenderizada')
    expect(markdown).toContain('320.39')
    expect(markdown).toContain('**não**')
  })
})

describe('divergencias', () => {
  it('lista uma linha por propriedade fora', () => {
    const fora = divergencias([
      {
        nome: 'cabecalho',
        largura: 1440,
        referencia: { backgroundColor: 'rgb(0, 0, 0)', height: 80 },
        clone: { backgroundColor: 'rgb(248, 248, 248)', height: 94 },
      },
    ])
    expect(fora).toHaveLength(2)
    expect(fora[0]).toBe(
      'cabecalho @ 1440: backgroundColor rgb(0, 0, 0) != rgb(248, 248, 248)',
    )
    expect(fora[1]).toBe('cabecalho @ 1440: height 80 != 94')
  })

  it('absolve delta de subpixel e reprova delta real', () => {
    expect(
      divergencias([
        {
          nome: 'curso.1.media-tension',
          largura: 1440,
          referencia: { larguraRenderizada: 320.39, ateLegenda: 29.69 },
          clone: { larguraRenderizada: 320.41, ateLegenda: 30 },
        },
      ]),
    ).toEqual([])
    expect(
      divergencias([
        {
          nome: 'curso.1.media-tension',
          largura: 1440,
          referencia: { ateLegenda: 29.69 },
          clone: { ateLegenda: 24 },
        },
      ]),
    ).toHaveLength(1)
  })

  it('ignora as camadas transparentes que o Tailwind empilha na sombra', () => {
    expect(
      divergencias([
        {
          nome: 'cabecalho',
          largura: 1440,
          referencia: { boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 0px 0px' },
          clone: {
            boxShadow:
              'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 0px 0px',
          },
        },
      ]),
    ).toEqual([])
  })

  it('não reprova tamanho intrínseco: o srcset da referência é diagnóstico', () => {
    expect(
      divergencias([
        {
          nome: 'curso.1.media-tension',
          largura: 375,
          referencia: { larguraIntrinseca: 374, alturaIntrinseca: 281 },
          clone: { larguraIntrinseca: 400, alturaIntrinseca: 300 },
        },
      ]),
    ).toEqual([])
    const markdown = linhasCards([
      {
        nome: 'curso.1.media-tension',
        largura: 375,
        referencia: {
          larguraColuna: 300,
          larguraIntrinseca: 374,
          alturaIntrinseca: 281,
          larguraRenderizada: 300,
          alturaRenderizada: 225,
          offsetEsquerdo: 0,
          offsetDireito: 0,
          ateLegenda: 30,
        },
        clone: {
          larguraColuna: 300,
          larguraIntrinseca: 400,
          alturaIntrinseca: 300,
          larguraRenderizada: 300,
          alturaRenderizada: 225,
          offsetEsquerdo: 0,
          offsetDireito: 0,
          ateLegenda: 30,
        },
      },
    ])
    expect(markdown).toContain(
      '| larguraIntrinseca | 374 | 400 | diagnóstico |',
    )
    expect(markdown).not.toContain('**não**')
  })

  it('devolve lista vazia quando tudo bate — é o aceite do bloco', () => {
    expect(
      divergencias([
        {
          nome: 'cabecalho',
          largura: 1440,
          referencia: { backgroundColor: 'rgb(0, 0, 0)' },
          clone: { backgroundColor: 'rgb(0, 0, 0)' },
        },
      ]),
    ).toEqual([])
  })

  it('trata lado ausente como divergência, não como igualdade', () => {
    const fora = divergencias([
      {
        nome: 'curso.1.media-tension',
        largura: 768,
        referencia: null,
        clone: null,
      },
    ])
    expect(fora).toEqual([
      'curso.1.media-tension @ 768: ausente em um dos lados',
    ])
  })
})
