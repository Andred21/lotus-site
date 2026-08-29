// Captura o clone nas mesmas condições da referência: mesmos viewports, mesmo
// scroll de página inteira, mesmo estado de menu aberto em 375.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { RUN_DIR, STATES, writeManifest } from './lib/paridade.mjs'

const CLONE_URL = process.env.CLONE_URL ?? 'http://localhost:5184/'
const dir = join(RUN_DIR, 'clone')
mkdirSync(dir, { recursive: true })

const written = []

for (const state of STATES) {
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: state.width, height: state.height },
  })
  await page.goto(CLONE_URL, { waitUntil: 'load', timeout: 60_000 })
  // Mesmo passo de scroll da referência: o clone não tem lazy-load do Divi,
  // mas rolar e voltar mantém as duas capturas sob o mesmo estado de página.
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(1000)

  if (state.menu) {
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    await page.waitForTimeout(300)
  }

  const name = `home-${state.name}.png`
  await page.screenshot({ path: join(dir, name), fullPage: state.fullPage })
  written.push(name)
  console.log(name)

  await browser.close()
}

const manifest = writeManifest({
  dir,
  target: 'clone',
  url: CLONE_URL,
  files: written,
})
console.log(`clone: ${manifest.files.length} arquivos em ${dir}`)
