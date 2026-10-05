import { execFileSync } from 'node:child_process'
import { resolve4 } from 'node:dns/promises'
import { test as base } from '@playwright/test'

// O alvo do smoke (`7.2.4`, spec §4.5). SMOKE_URL é obrigatório. SMOKE_VIA,
// opcional, é o domínio da distribuição: o IPv4 dele passa a receber toda
// conexão — no Chromium por `--host-resolver-rules`, no lado Node pelo
// `lookup` de `rede.ts` — enquanto o DNS de lotusotec.cl ainda aponta para o
// WordPress. SMOKE_SHA, opcional, é o release que o item 1 confere; sem ele,
// o último `CI` verde do corporativo, por `gh`.
export const DOMINIO = 'lotusotec.cl'
export const WWW = `www.${DOMINIO}`

// Falso desde o corte (7.2.5, spec D5): a borda deixou de mandar o
// X-Robots-Tag, e o item 7 confere que ele está ausente.
export const X_ROBOTS_TAG_PRESENTE = false

function exigir(nome: string): string {
  const valor = process.env[nome]
  if (!valor)
    throw new Error(`defina ${nome} (ex.: ${nome}=https://lotusotec.cl)`)
  return valor
}

export const ALVO = new URL(exigir('SMOKE_URL'))
// SMOKE_VIA vazio vale como ausente: `VIA ?? ...` e `VIA ? ...` abaixo leem o
// mesmo valor, sem um deles tratar '' como definido.
export const VIA = process.env.SMOKE_VIA || undefined

function shaDoUltimoCiVerde(): string {
  return execFileSync(
    'gh',
    [
      'run',
      'list',
      '--repo',
      'Gatika-CL/lotus-site',
      '--workflow',
      'CI',
      '--branch',
      'main',
      '--status',
      'success',
      '--limit',
      '1',
      '--json',
      'headSha',
      '--jq',
      '.[0].headSha',
    ],
    { encoding: 'utf8' },
  ).trim()
}

export const SHA = process.env.SMOKE_SHA ?? shaDoUltimoCiVerde()
if (!/^[0-9a-f]{40}$/.test(SHA)) {
  throw new Error(
    `SHA inválido: ${JSON.stringify(SHA)} — defina SMOKE_SHA ou autentique o gh`,
  )
}

export const test = base.extend<object, { destino: string }>({
  // IPv4 que recebe TODA conexão do lado Node (rede.ts): o de SMOKE_VIA
  // quando existe, senão o do próprio host de SMOKE_URL.
  destino: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const nome = VIA ?? ALVO.hostname
      const [ip] = await resolve4(nome)
      if (!ip) throw new Error(`${nome} não resolve para IPv4`)
      await use(ip)
    },
    { scope: 'worker' },
  ],
  // Com SMOKE_VIA, o Chromium resolve apex e www para a distribuição; sem
  // ele, resolução normal (o modo de B5 depois do corte).
  launchOptions: [
    async ({ destino }, use) => {
      await use(
        VIA
          ? {
              args: [
                `--host-resolver-rules=MAP ${DOMINIO} ${destino}, MAP ${WWW} ${destino}`,
              ],
            }
          : {},
      )
    },
    { scope: 'worker' },
  ],
})

export { expect } from '@playwright/test'
