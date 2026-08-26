// Ferramenta de inventário: roda em Node, nunca entra no bundle da aplicação.
/// <reference lib="dom" />
import { BREAKPOINT_WIDTHS, openPage } from './lib/site.mjs'

/** @type {Array<{ width: number, menuVisible: boolean, rowWidth: number }>} */
const rows = []

for (const width of BREAKPOINT_WIDTHS) {
  const { browser, page } = await openPage({
    name: String(width),
    width,
    height: 900,
  })
  const measured = await page.evaluate(() => {
    const menu = document.getElementById('top-menu')
    const row = document.querySelector('#Somos .et_pb_row')
    return {
      menuWidth: menu ? menu.getBoundingClientRect().width : 0,
      rowWidth: row ? Math.round(row.getBoundingClientRect().width) : 0,
    }
  })
  await browser.close()

  const menuVisible = measured.menuWidth > 0
  rows.push({ width, menuVisible, rowWidth: measured.rowWidth })
  console.log(
    `${String(width).padStart(4)}px  menu=${menuVisible ? 'desktop' : 'mobile '}  row=${measured.rowWidth}px`,
  )
}

const firstDesktop = rows.findIndex((row) => row.menuVisible)
const firstCapped = rows.findIndex((row) => row.rowWidth >= 1080)

/**
 * @param {number} index
 * @returns {string}
 */
const between = (index) => {
  if (index < 0) return 'acima de 1400px — nenhuma largura medida virou'
  const turned = rows[index]
  const previous = rows[index - 1]
  if (!turned) return 'indeterminado'
  return previous
    ? `entre ${previous.width}px e ${turned.width}px`
    : `em ${turned.width}px ou abaixo (768px é o piso conhecido)`
}

console.log('')
console.log(`menu vira desktop ${between(firstDesktop)}`)
console.log(`container trava em 1080px ${between(firstCapped)}`)
