import { CABECALHOS, REMOVIDOS } from '../../scripts/infra/lib/cabecalhos.mjs'
import { ALVO, expect, test } from './alvo'
import { pedir } from './rede'

// A política de B3, conferida contra o módulo canônico em quatro respostas:
// /, um asset, /api/contacto (405) e um 404 — mesmas quatro da evidência de
// 7.2.2. Valor exato, nome sem caixa.
test('8 · cabeçalhos: a política de B3 em /, asset, /api/contacto e 404', async ({
  destino,
}) => {
  const html = (await pedir(destino, new URL('/', ALVO))).corpo.toString('utf8')
  const asset = html.match(/\/assets\/[^"]+\.js/)?.[0] ?? ''
  expect(asset).not.toBe('')
  for (const caminho of [
    '/',
    asset,
    '/api/contacto',
    '/caminho-que-nao-existe-7224',
  ]) {
    const r = await pedir(destino, new URL(caminho, ALVO))
    for (const [nome, valor] of Object.entries(CABECALHOS)) {
      expect(r.headers[nome.toLowerCase()], `${caminho} ${nome}`).toBe(valor)
    }
    // `Server` está em REMOVIDOS porque o do S3 sai, mas o CloudFront repõe o
    // dele (evidência de 7.2.2): a linha de `server` abaixo é a prova, não a
    // ausência.
    for (const nome of REMOVIDOS.filter((n) => n.toLowerCase() !== 'server')) {
      expect(
        r.headers[nome.toLowerCase()],
        `${caminho} ${nome}`,
      ).toBeUndefined()
    }
    expect(r.headers.server, caminho).toBe('CloudFront')
  }
})
