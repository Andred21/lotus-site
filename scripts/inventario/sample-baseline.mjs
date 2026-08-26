// Ferramenta de inventário: roda em Node, nunca entra no bundle da aplicação.
/// <reference lib="dom" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { OUT_DIR } from './lib/site.mjs'

/**
 * `bg` é a cor de fundo da região: a cor do texto é o pixel mais distante
 * dela. Coordenadas em pixel do PNG, que é 1:1 com o viewport capturado.
 * @typedef {{ name: string, x: number, y: number, w: number, h: number, bg: string }} Region
 */

/** @type {Array<{ file: string, regions: Region[] }>} */
const TARGETS = [
  {
    file: 'home-1440.png',
    regions: [
      { name: 'header-fundo', x: 300, y: 10, w: 700, h: 70, bg: '#ffffff' },
      { name: 'menu-link', x: 850, y: 36, w: 400, h: 20, bg: '#f8f8f8' },
      { name: 'hero-fundo', x: 120, y: 690, w: 400, h: 110, bg: '#ffffff' },
      { name: 'hero-kicker', x: 110, y: 230, w: 400, h: 50, bg: '#000000' },
      { name: 'hero-h1', x: 110, y: 344, w: 260, h: 52, bg: '#000000' },
      { name: 'hero-h3', x: 110, y: 490, w: 420, h: 60, bg: '#000000' },
      { name: 'hero-corpo', x: 110, y: 585, w: 380, h: 90, bg: '#000000' },
      { name: 'somos-fundo', x: 60, y: 1000, w: 200, h: 60, bg: '#000000' },
      { name: 'somos-corpo', x: 600, y: 1165, w: 640, h: 120, bg: '#f0f0f0' },
      { name: 'destaque-icone', x: 300, y: 1440, w: 90, h: 80, bg: '#f0f0f0' },
      {
        name: 'destaque-rotulo',
        x: 250,
        y: 1540,
        w: 200,
        h: 32,
        bg: '#f0f0f0',
      },
      {
        name: 'destaque-corpo',
        x: 225,
        y: 1580,
        w: 250,
        h: 110,
        bg: '#f0f0f0',
      },
      { name: 'cursos-fundo', x: 60, y: 1820, w: 200, h: 60, bg: '#ffffff' },
      { name: 'cursos-h2', x: 500, y: 1846, w: 440, h: 50, bg: '#000000' },
      { name: 'cursos-intro', x: 380, y: 1930, w: 680, h: 65, bg: '#000000' },
      { name: 'card-legenda', x: 180, y: 2315, w: 340, h: 50, bg: '#000000' },
      {
        name: 'contacto-painel',
        x: 200,
        y: 2580,
        w: 200,
        h: 40,
        bg: '#000000',
      },
      { name: 'contacto-h2', x: 560, y: 2606, w: 320, h: 48, bg: '#f0f0f0' },
      { name: 'contacto-corpo', x: 400, y: 2690, w: 660, h: 70, bg: '#f0f0f0' },
      { name: 'campo-texto', x: 330, y: 2830, w: 240, h: 34, bg: '#f0f0f0' },
      { name: 'enviar-borda', x: 980, y: 3240, w: 120, h: 50, bg: '#f0f0f0' },
      { name: 'rodape-faixa', x: 100, y: 3400, w: 700, h: 41, bg: '#ffffff' },
      { name: 'rodape-texto', x: 175, y: 3400, w: 400, h: 41, bg: '#323232' },
    ],
  },
  {
    file: 'home-375.png',
    regions: [
      {
        name: 'header-fundo-mobile',
        x: 120,
        y: 20,
        w: 180,
        h: 40,
        bg: '#000000',
      },
      {
        name: 'hero-fundo-mobile',
        x: 30,
        y: 640,
        w: 300,
        h: 60,
        bg: '#ffffff',
      },
      {
        name: 'rodape-faixa-mobile',
        x: 20,
        y: 5400,
        w: 300,
        h: 40,
        bg: '#ffffff',
      },
    ],
  },
  {
    file: 'home-375-menu.png',
    regions: [
      { name: 'menu-painel', x: 100, y: 90, w: 150, h: 40, bg: '#000000' },
      { name: 'menu-borda-topo', x: 150, y: 80, w: 200, h: 3, bg: '#ffffff' },
      { name: 'menu-separador', x: 100, y: 141, w: 150, h: 1, bg: '#000000' },
    ],
  },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 400, height: 300 } })

for (const target of TARGETS) {
  const base64 = readFileSync(join(OUT_DIR, 'baseline', target.file)).toString(
    'base64',
  )
  // data: URI em vez de file://: canvas com imagem file:// fica "tainted" e
  // getImageData lança SecurityError.
  await page.setContent(
    `<style>*{margin:0;padding:0}</style><img id="i" src="data:image/png;base64,${base64}">`,
  )
  await page.waitForFunction(() => {
    const img = /** @type {HTMLImageElement | null} */ (
      document.querySelector('img')
    )
    return Boolean(img && img.complete && img.naturalWidth > 0)
  })

  const rows = await page.evaluate((regions) => {
    const img = /** @type {HTMLImageElement | null} */ (
      document.querySelector('img')
    )
    if (!img) throw new Error('imagem ausente na página de amostragem')
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d indisponível')
    ctx.drawImage(img, 0, 0)

    /** @param {number} r @param {number} g @param {number} b */
    const hex = (r, g, b) =>
      `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`

    return regions.map((region) => {
      const br = Number.parseInt(region.bg.slice(1, 3), 16)
      const bg = Number.parseInt(region.bg.slice(3, 5), 16)
      const bb = Number.parseInt(region.bg.slice(5, 7), 16)
      const data = ctx.getImageData(region.x, region.y, region.w, region.h).data
      /** @type {Map<string, number>} */
      const counts = new Map()
      let farthest = 0
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] ?? 0
        const g = data[i + 1] ?? 0
        const b = data[i + 2] ?? 0
        const key = hex(r, g, b)
        counts.set(key, (counts.get(key) ?? 0) + 1)
        const distance = (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2
        if (distance > farthest) farthest = distance
      }
      const entries = [...counts.entries()]
      const dominant = entries.sort((a, b) => b[1] - a[1])[0]
      const core = entries
        .filter(([key]) => {
          const r = Number.parseInt(key.slice(1, 3), 16)
          const g = Number.parseInt(key.slice(3, 5), 16)
          const b = Number.parseInt(key.slice(5, 7), 16)
          return (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2 > farthest * 0.75
        })
        .sort((a, b) => b[1] - a[1])[0]
      const total = region.w * region.h
      const share = dominant ? ((dominant[1] / total) * 100).toFixed(1) : '0.0'
      return `${region.name.padEnd(22)} dominante=${dominant?.[0] ?? '—'} (${share}%)  núcleo=${core?.[0] ?? '—'}`
    })
  }, target.regions)

  console.log(`--- ${target.file} ---`)
  console.log(rows.join('\n'))
}

await browser.close()
