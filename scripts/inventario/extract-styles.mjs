/// <reference lib="dom" />
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUT_DIR, VIEWPORTS, openPage, rgbToHex } from './lib/site.mjs'

/** @type {{ sections: Array<{ id: string }> }} */
const dom = JSON.parse(readFileSync(join(OUT_DIR, 'dom.json'), 'utf8'))
const sectionIds = dom.sections.map((section) => section.id)

/** @type {Record<string, unknown[]>} */
const byViewport = {}

for (const viewport of VIEWPORTS) {
  const { browser, page } = await openPage(viewport)
  const measurements = await page.evaluate((/** @type {string[]} */ ids) => {
    /**
     * @param {Element} element
     * @param {string} sectionId
     * @param {string} selector
     */
    const read = (element, sectionId, selector) => {
      const style = window.getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return {
        sectionId,
        selector,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        width: Math.round(box.width),
        height: Math.round(box.height),
        maxWidth: style.maxWidth,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        marginBottom: style.marginBottom,
        marginLeft: style.marginLeft,
        marginRight: style.marginRight,
        gap: style.gap,
        borderWidth: style.borderWidth,
        borderColor: style.borderColor,
        borderStyle: style.borderStyle,
      }
    }

    const out = []
    for (const id of ids) {
      const section = document.getElementById(id)
      if (!section) continue
      out.push(read(section, id, `#${id}`))
      for (const selector of [
        'h1',
        'h2',
        'h3',
        'h4',
        'p',
        'a',
        'button',
        'img',
      ]) {
        const child = section.querySelector(selector)
        if (child) out.push(read(child, id, `#${id} ${selector}`))
      }
      // Linhas e colunas do Divi são medidas uma a uma: a seção institucional
      // tem mais de uma `.et_pb_row`, e a largura de coluna só existe medida —
      // o Divi a declara em percentual, não em pixel.
      for (const selector of ['.et_pb_row', '.et_pb_column']) {
        const nodes = [...section.querySelectorAll(selector)]
        nodes.forEach((node, index) => {
          out.push(read(node, id, `#${id} ${selector}[${index}]`))
        })
      }
    }
    return out
  }, sectionIds)
  await browser.close()

  byViewport[viewport.name] = measurements.map((measurement) => ({
    ...measurement,
    color: rgbToHex(measurement.color),
    backgroundColor: rgbToHex(measurement.backgroundColor),
  }))
  console.log(`${viewport.name}px: ${measurements.length} medições`)
}

writeFileSync(
  join(OUT_DIR, 'styles.json'),
  `${JSON.stringify({ capturedAt: new Date().toISOString(), viewports: byViewport }, null, 2)}\n`,
)
