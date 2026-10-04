// Abre https://lotusotec.cl/ duas vezes no Chromium do Playwright: com
// resolução normal (o WordPress vivo) e forçada para 127.0.0.1 aceitando o
// certificado autoassinado (a cópia restaurada pelo ensaio-restauracao.sh),
// e aplica os critérios de §4.3 da spec. A resolução forçada é também a
// garantia de que nada da cópia veio do site vivo (spec D4).
//
// Uso: node scripts/wordpress/verificar-restauracao.mjs   (sai 1 se reprovar)
import { chromium } from '@playwright/test'
import { compararPaginas } from './lib/comparar.mjs'

const HOME = 'https://lotusotec.cl/'
const LOGIN = 'https://lotusotec.cl/wp-login.php'
const NOMES = new Set(['lotusotec.cl', 'www.lotusotec.cl'])
const PARA_LOCAL = 'MAP lotusotec.cl 127.0.0.1, MAP www.lotusotec.cl 127.0.0.1'

/**
 * @param {import('@playwright/test').Browser} navegador
 * @param {boolean} copia aceita o certificado autoassinado do container
 * @returns {Promise<import('./lib/comparar.mjs').Pagina>}
 */
async function lerHome(navegador, copia) {
  const contexto = await navegador.newContext({ ignoreHTTPSErrors: copia })
  const pagina = await contexto.newPage()
  /** @type {string[]} */
  const falhas = []
  pagina.on('response', (resposta) => {
    const host = new URL(resposta.url()).hostname
    if (NOMES.has(host) && resposta.status() >= 400) {
      falhas.push(`${resposta.status()} ${resposta.url()}`)
    }
  })
  // 'networkidle' nunca resolve no WordPress vivo: o api-fetch chama
  // wp-admin/admin-ajax.php?action=rest-nonce, o host responde 400 e não
  // fecha o stream HTTP/2 (a mesma requisição de scripts/inventario/lib/
  // site.mjs). 'load' + 1 s vale igual para os dois lados; sem rolar a
  // página, o contador do Divi fica parado em vez de pego no meio da animação.
  const resposta = await pagina.goto(HOME, {
    waitUntil: 'load',
    timeout: 60_000,
  })
  await pagina.waitForTimeout(1000)
  const titulo = await pagina.title()
  const h1s = await pagina.locator('h1').allInnerTexts()
  const texto = await pagina.evaluate(() => document.body.innerText)
  await contexto.close()
  return {
    status: resposta?.status() ?? 0,
    titulo,
    h1: (h1s[0] ?? '').trim(),
    texto,
    falhas,
  }
}

/** @param {import('@playwright/test').Browser} navegador */
async function statusDoLogin(navegador) {
  const contexto = await navegador.newContext({ ignoreHTTPSErrors: true })
  const pagina = await contexto.newPage()
  const resposta = await pagina.goto(LOGIN)
  const status = resposta?.status() ?? 0
  await contexto.close()
  return status
}

const vivo = await chromium.launch()
const paginaViva = await lerHome(vivo, false)
await vivo.close()

const local = await chromium.launch({
  args: [`--host-resolver-rules=${PARA_LOCAL}`],
})
const paginaCopia = { ...(await lerHome(local, true)), login: 0 }
paginaCopia.login = await statusDoLogin(local)
await local.close()

const problemas = compararPaginas(paginaViva, paginaCopia)
console.log(
  JSON.stringify(
    {
      vivo: {
        status: paginaViva.status,
        titulo: paginaViva.titulo,
        h1: paginaViva.h1,
      },
      copia: {
        status: paginaCopia.status,
        titulo: paginaCopia.titulo,
        h1: paginaCopia.h1,
        login: paginaCopia.login,
        falhas: paginaCopia.falhas,
      },
      problemas,
    },
    null,
    2,
  ),
)
process.exit(problemas.length === 0 ? 0 : 1)
