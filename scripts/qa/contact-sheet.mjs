import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { RUN_DIR, contactSheetHtml } from './lib/paridade.mjs'

/** @param {string} target */
const manifest = (target) =>
  JSON.parse(readFileSync(join(RUN_DIR, target, 'manifest.json'), 'utf8'))

const html = contactSheetHtml(manifest('referencia'), manifest('clone'))
const out = join(RUN_DIR, 'contact-sheet.html')
writeFileSync(out, html)
console.log(out)
