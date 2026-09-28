import { expect, test, type Page } from '@playwright/test'
import {
  fingirApiContacto,
  fingirTurnstile,
  preencherContato,
} from './contato-falso'

// Prova de `7.2.2` sobre o build de produção servido pelo preview, que emite
// a mesma política da borda via `preview.headers` (vite.config.ts). Os nomes
// esperados moram duplicados aqui de propósito: `tsconfig.e2e.json` não tem
// `allowJs`, então este arquivo não importa o módulo canônico. A igualdade
// template ≡ módulo é da catraca (`scripts/infra/cabecalhos.test.mjs`); aqui
// a prova é que o preview EMITE a política e que ela não quebra o site.
const NOMES_ESPERADOS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'x-robots-tag',
] as const

const SUCCESS =
  'Gracias. Recibimos su mensaje y le contactaremos a la brevedad.'

// A sonda `allowsEval` do zod é um getter cacheado (`node_modules/.pnpm/
// zod@4.4.3/node_modules/zod/v4/core/util.js:145-163`), lido uma única vez
// no construtor de `$ZodObjectJIT` (`schemas.js:971-972`) quando
// `contactSchema = z.object({...})` é montado em `src/lib/contact-schema.ts`
// — ou seja, na carga do bundle, não no envio do formulário. Por ser
// cacheado, dispara exatamente uma vez por carregamento de página. A CSP a
// recusa: o zod cai no caminho sem eval, sem erro de console, e o envio
// (quando ocorre) chega ao sucesso. A jornada abaixo faz um único
// `page.goto`, então a lista de violações tem que ser exatamente esta sonda,
// uma vez — nem zero (a sonda sumiu, ou parou de rodar) nem mais de uma
// (outro eval entrou, ou a jornada passou a recarregar a página); qualquer
// uma dessas mudanças precisa revisitar esta tolerância. Tirar a sonda
// (`z.config({ jitless: true })` em `src/`) é o `D-62`.
const SONDA_DO_ZOD = 'script-src: eval'

type JanelaVigiada = { violacoesDeCsp: string[]; furoDeCsp?: boolean }

// Registrado antes de qualquer script da página: cada violação de CSP vira
// uma linha em `window.violacoesDeCsp`, que o teste lê no fim.
async function vigiarViolacoes(page: Page) {
  await page.addInitScript(() => {
    const janela = window as unknown as JanelaVigiada
    janela.violacoesDeCsp = []
    document.addEventListener('securitypolicyviolation', (evento) => {
      janela.violacoesDeCsp.push(
        `${evento.violatedDirective}: ${evento.blockedURI}`,
      )
    })
  })
}

function violacoes(page: Page) {
  return page.evaluate(
    () => (window as unknown as JanelaVigiada).violacoesDeCsp,
  )
}

test('a resposta de / traz cada cabeçalho da política', async ({ page }) => {
  const resposta = await page.request.get('/')
  const cabecalhos = resposta.headers()
  for (const nome of NOMES_ESPERADOS) {
    expect(cabecalhos[nome], `cabeçalho ${nome}`).toBeTruthy()
  }
  // Sem isto, "zero violação" nos outros testes poderia ser um preview sem
  // CSP nenhuma.
  expect(cabecalhos['content-security-policy']).toMatch(/^default-src 'none'/)
})

test('a jornada completa e o envio do formulário passam sob a CSP', async ({
  page,
}) => {
  const errosDeConsole: string[] = []
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') errosDeConsole.push(mensagem.text())
  })
  page.on('pageerror', (erro) => errosDeConsole.push(erro.message))

  await vigiarViolacoes(page)
  // `page.route` intercepta DEPOIS da checagem de CSP do navegador, então
  // `script-src` e `connect-src` são exercitados mesmo com a rede falsa.
  await fingirTurnstile(page)
  await fingirApiContacto(page, { status: 200, ok: true })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'LOTUS OTEC' }),
  ).toBeVisible()

  // Rola até o fim: imagens e fontes carregam sob a CSP.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForLoadState('networkidle')

  await preencherContato(page)
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByRole('status')).toHaveText(SUCCESS)

  // Só a sonda do zod, exatamente uma vez — nunca zero (some, precisa
  // revisitar), nunca mais de uma (outro eval, ou mais de uma carga de
  // página nesta jornada).
  expect(await violacoes(page)).toEqual([SONDA_DO_ZOD])
  expect(errosDeConsole).toEqual([])
})

test('script inline injetado não executa e gera violação de script-src-elem', async ({
  page,
}) => {
  await vigiarViolacoes(page)
  await fingirTurnstile(page)
  await page.goto('/')

  // Controle negativo: prova que a CSP bloqueia e que o coletor escuta —
  // sem ele, "zero violação" poderia ser coletor morto. `page.evaluate`
  // roda pelo protocolo do navegador e não passa pela CSP; o `<script>`
  // que ele injeta no documento passa.
  await page.evaluate(() => {
    const script = document.createElement('script')
    script.textContent = 'window.furoDeCsp = true'
    document.body.append(script)
  })

  // O evento securitypolicyviolation é assíncrono.
  await page.waitForFunction(
    () => (window as unknown as JanelaVigiada).violacoesDeCsp.length > 0,
  )

  const lista = await violacoes(page)
  expect(lista.some((linha) => linha.startsWith('script-src-elem'))).toBe(true)
  const furo = await page.evaluate(
    () => (window as unknown as JanelaVigiada).furoDeCsp,
  )
  expect(furo).toBeUndefined()
})
