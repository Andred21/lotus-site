import { expect, test } from '@playwright/test'

// Projeto `producao`: o preview serve o build e reproduz a reescrita da borda
// (D11, ADR-SITE-007). A4: `/validar*` serve a página, o resto é 404.
const UUID = '0f8fad5b-d9cb-469f-a165-70867728950e'

for (const caminho of ['/validar', '/validar/', `/validar/${UUID}`]) {
  test(`${caminho} serve a página de validação`, async ({ request }) => {
    const r = await request.get(caminho)
    expect(r.status()).toBe(200)
    expect(await r.text()).toContain(
      '<title>Validar certificado | LOTUS OTEC</title>',
    )
  })
}

for (const caminho of [
  '/validar/abc',
  `/validar/${UUID}/x`,
  '/VALIDAR',
  '/inventado',
]) {
  test(`${caminho} responde 404`, async ({ request }) => {
    expect((await request.get(caminho)).status()).toBe(404)
  })
}

test('/ continua servindo a home', async ({ request }) => {
  expect(await (await request.get('/')).text()).toContain(
    '<title>LOTUS | OTEC</title>',
  )
})
