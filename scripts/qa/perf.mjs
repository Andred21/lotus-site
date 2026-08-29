// Roda o Lighthouse contra o build de produção já servido por `vite preview`.
// O Chromium vem do Playwright, com porta de depuração aberta: assim o
// bloco não ganha `chrome-launcher` como segunda dependência.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import { resumoMarkdown } from './lib/perf.mjs'

const URL_ALVO = process.env.CLONE_URL ?? 'http://localhost:5184/'
const OUT_DIR = 'docs/qa/performance/2026-08-29'
const DEBUG_PORT = 9222

mkdirSync(OUT_DIR, { recursive: true })

const browser = await chromium.launch({
  args: [`--remote-debugging-port=${DEBUG_PORT}`],
})

try {
  const resultado = await lighthouse(URL_ALVO, {
    port: DEBUG_PORT,
    output: 'json',
    logLevel: 'error',
  })
  if (!resultado) throw new Error('lighthouse não devolveu resultado')

  writeFileSync(
    join(OUT_DIR, 'lighthouse.json'),
    `${JSON.stringify(resultado.lhr, null, 2)}\n`,
  )
  writeFileSync(join(OUT_DIR, 'resumo.md'), resumoMarkdown(resultado.lhr))
  console.log(join(OUT_DIR, 'resumo.md'))
} finally {
  await browser.close()
}
