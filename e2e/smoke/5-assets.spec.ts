import { ALVO, expect, test } from './alvo'
import { pedir } from './rede'

const IMUTAVEL = 'public, max-age=31536000, immutable'
const FIXOS = ['/index.html', '/robots.txt', '/sitemap.xml']

// O deploy grava `immutable` em tudo que tem nome fixo por hash (e nos
// arquivos de public/, que só mudam com deploy) e `no-cache` nos três de
// nome fixo (.github/workflows/ci.yml, job deploy). Fontes: @font-face de
// src/index.css, provadas carregadas pelo document.fonts do Chromium.
test('5 · assets: todo asset referenciado 200 e immutable; nome fixo no-cache; fontes carregam', async ({
  page,
  destino,
}) => {
  const html = (await pedir(destino, new URL('/', ALVO))).corpo.toString('utf8')
  const referencias = new Set(
    [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)]
      .map((m) => m[1] ?? '')
      .filter((u) => /\.[a-z0-9]+$/i.test(u) && !u.startsWith('//')),
  )
  for (const css of [...referencias].filter((u) => u.endsWith('.css'))) {
    const folha = (await pedir(destino, new URL(css, ALVO))).corpo.toString(
      'utf8',
    )
    for (const m of folha.matchAll(/url\((\/assets\/[^)]+)\)/g))
      referencias.add(m[1] ?? '')
  }
  expect(referencias.size).toBeGreaterThan(5)

  for (const caminho of referencias) {
    const r = await pedir(destino, new URL(caminho, ALVO))
    expect(r.status, caminho).toBe(200)
    expect(r.headers['cache-control'], caminho).toBe(IMUTAVEL)
  }
  for (const caminho of FIXOS) {
    const r = await pedir(destino, new URL(caminho, ALVO))
    expect(r.status, caminho).toBe(200)
    expect(r.headers['cache-control'], caminho).toBe('no-cache')
  }
  console.log(
    `[smoke] ${referencias.size} assets immutable; ${FIXOS.length} de nome fixo no-cache`,
  )

  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const familias = await page.evaluate(() =>
    [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => f.family),
  )
  expect(familias).toContain('Montserrat')
  expect(familias).toContain('Open Sans')
})
