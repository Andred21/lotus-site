import { ALVO, expect, test } from './alvo'
import { pedir } from './rede'

const IMUTAVEL = 'public, max-age=31536000, immutable'
const FIXOS = ['/index.html', '/robots.txt', '/sitemap.xml']
// Imagens e fontes que o bundle JS importa (`import x from './a.png'` vira a
// string `/assets/a-<hash>.png`): o HTML e o CSS não as citam.
const ESTATICOS =
  /["'`](\/assets\/[A-Za-z0-9_.-]+\.(?:jpe?g|png|webp|avif|svg|gif|ico|woff2?))["'`]/g

// O deploy grava `immutable` em tudo que tem nome fixo por hash (e nos
// arquivos de public/, que só mudam com deploy) e `no-cache` nos três de
// nome fixo (.github/workflows/ci.yml, job deploy). Referências, de três
// origens: o HTML, o `url()` do CSS e as importações do JS. Fontes: @font-face
// de src/index.css, provadas carregadas pelo document.fonts do Chromium.
test('5 · assets: todo asset referenciado 200 e immutable; nome fixo no-cache; fontes carregam', async ({
  page,
  destino,
}) => {
  const texto = async (caminho: string) =>
    (await pedir(destino, new URL(caminho, ALVO))).corpo.toString('utf8')

  const doHtml = new Set(
    [...(await texto('/')).matchAll(/(?:src|href)="(\/[^"]+)"/g)]
      .map((m) => m[1] ?? '')
      .filter((u) => /\.[a-z0-9]+$/i.test(u) && !u.startsWith('//')),
  )
  const doCss = new Set<string>()
  for (const css of [...doHtml].filter((u) => u.endsWith('.css'))) {
    for (const m of (await texto(css)).matchAll(/url\((\/assets\/[^)]+)\)/g))
      doCss.add(m[1] ?? '')
  }
  const doJs = new Set<string>()
  for (const js of [...doHtml].filter((u) => u.endsWith('.js'))) {
    for (const m of (await texto(js)).matchAll(ESTATICOS)) doJs.add(m[1] ?? '')
  }
  // Cada origem precisa render ao menos uma referência: sem isto um regex
  // quebrado esvazia a origem e o item passa sem checar nada dela.
  expect(doHtml.size, 'referências do HTML').toBeGreaterThan(0)
  expect(doCss.size, 'url() do CSS').toBeGreaterThan(0)
  expect(doJs.size, 'imagens importadas pelo JS').toBeGreaterThan(0)
  const referencias = new Set([...doHtml, ...doCss, ...doJs])
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
    `[smoke] ${referencias.size} assets immutable (HTML ${doHtml.size}, CSS ${doCss.size}, JS ${doJs.size}); ${FIXOS.length} de nome fixo no-cache`,
  )
  console.log(`[smoke] importados pelo JS: ${[...doJs].join(', ')}`)

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
