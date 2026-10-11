// Ferramenta de inventário: roda em Node, nunca entra no bundle da aplicação.
//
// Uso: `node scripts/inventario/comparar-png.mjs <a.png> <b.png>`. Imprime as
// faixas de linha em que os dois PNG divergem, com pixels diferentes e
// extensão horizontal de cada faixa. Lê só os dois arquivos: continua
// reproduzível depois que o WordPress sair do ar.
/// <reference lib="dom" />
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const [caminhoA, caminhoB] = process.argv.slice(2)
if (!caminhoA || !caminhoB) {
  throw new Error(
    'uso: node scripts/inventario/comparar-png.mjs <a.png> <b.png>',
  )
}

/** @typedef {{ y0: number, y1: number, px: number, x0: number, x1: number }} Faixa */

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const resultado = await page.evaluate(
    async ({ a, b }) => {
      /** @param {string} base64 */
      const decodificar = async (base64) => {
        const imagem = new Image()
        imagem.src = `data:image/png;base64,${base64}`
        await imagem.decode()
        const canvas = document.createElement('canvas')
        canvas.width = imagem.naturalWidth
        canvas.height = imagem.naturalHeight
        const contexto = canvas.getContext('2d')
        if (!contexto) throw new Error('canvas 2d indisponível')
        contexto.drawImage(imagem, 0, 0)
        return {
          w: canvas.width,
          h: canvas.height,
          d: contexto.getImageData(0, 0, canvas.width, canvas.height).data,
        }
      }
      const A = await decodificar(a)
      const B = await decodificar(b)
      const w = Math.min(A.w, B.w)
      const h = Math.min(A.h, B.h)
      /** @type {Faixa[]} */
      const faixas = []
      /** @type {Faixa | null} */
      let atual = null
      let total = 0
      for (let y = 0; y < h; y++) {
        let px = 0
        let x0 = -1
        let x1 = -1
        for (let x = 0; x < w; x++) {
          const i = (y * A.w + x) * 4
          const j = (y * B.w + x) * 4
          if (
            A.d[i] !== B.d[j] ||
            A.d[i + 1] !== B.d[j + 1] ||
            A.d[i + 2] !== B.d[j + 2] ||
            A.d[i + 3] !== B.d[j + 3]
          ) {
            px++
            if (x0 < 0) x0 = x
            x1 = x
          }
        }
        if (px === 0) continue
        total += px
        if (atual && atual.y1 === y - 1) {
          atual.y1 = y
          atual.px += px
          atual.x0 = Math.min(atual.x0, x0)
          atual.x1 = Math.max(atual.x1, x1)
        } else {
          atual = { y0: y, y1: y, px, x0, x1 }
          faixas.push(atual)
        }
      }
      return { a: [A.w, A.h], b: [B.w, B.h], total, faixas }
    },
    {
      a: readFileSync(caminhoA).toString('base64'),
      b: readFileSync(caminhoB).toString('base64'),
    },
  )

  const [wa, ha] = resultado.a
  const [wb, hb] = resultado.b
  console.log(`a: ${caminhoA} ${wa}×${ha}`)
  console.log(`b: ${caminhoB} ${wb}×${hb}`)
  if (wa !== wb || ha !== hb) {
    console.log('dimensões diferentes: comparada só a área comum')
  }
  if (resultado.faixas.length === 0) {
    console.log('0 px diferentes')
  } else {
    console.log(
      `${resultado.total} px diferentes em ${resultado.faixas.length} faixa(s)`,
    )
    for (const faixa of resultado.faixas) {
      console.log(
        `linhas ${faixa.y0}–${faixa.y1}: ${faixa.px} px, x ${faixa.x0}–${faixa.x1}`,
      )
    }
  }
} finally {
  await browser.close()
}
