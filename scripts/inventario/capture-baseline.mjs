import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { OUT_DIR, VIEWPORTS, openPage } from './lib/site.mjs'

const baselineDir = join(OUT_DIR, 'baseline')
mkdirSync(baselineDir, { recursive: true })

for (const viewport of VIEWPORTS) {
  const { browser, page } = await openPage(viewport)
  await page.screenshot({
    path: join(baselineDir, `home-${viewport.name}.png`),
    fullPage: true,
  })
  console.log(`home-${viewport.name}.png`)

  if (viewport.name === '375') {
    const toggle = page
      .locator('.mobile_menu_bar, .elementor-menu-toggle')
      .first()
    if (await toggle.count()) {
      await toggle.click()
      await page.waitForTimeout(800)
      await page.screenshot({
        path: join(baselineDir, 'home-375-menu.png'),
        fullPage: false,
      })
      console.log('home-375-menu.png')
    }
  }

  await browser.close()
}
