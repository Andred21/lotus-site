// Congela a referência visual do WordPress imediatamente antes da comparação.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { SITE_URL, openPage } from '../inventario/lib/site.mjs'
import { RUN_DIR, STATES, writeManifest } from './lib/paridade.mjs'

const dir = join(RUN_DIR, 'referencia')
mkdirSync(dir, { recursive: true })

const written = []

for (const state of STATES) {
  // `openPage` abre SITE_URL, espera `load` e rola a página inteira: é o
  // mesmo pré-processo do baseline da Sprint 1, então as duas rodadas são
  // comparáveis entre si.
  const { browser, page } = await openPage(state)

  if (state.menu) {
    const toggle = page
      .locator('.mobile_menu_bar, .elementor-menu-toggle')
      .first()
    if (!(await toggle.count())) {
      await browser.close()
      throw new Error('toggle do menu mobile não encontrado na referência')
    }
    await toggle.click()
    await page.waitForTimeout(800)
  }

  const name = `home-${state.name}.png`
  await page.screenshot({ path: join(dir, name), fullPage: state.fullPage })
  written.push(name)
  console.log(name)

  await browser.close()
}

const manifest = writeManifest({
  dir,
  target: 'referencia',
  url: SITE_URL,
  files: written,
})
console.log(`referencia: ${manifest.files.length} arquivos em ${dir}`)
