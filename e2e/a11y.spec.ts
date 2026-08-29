import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { A11Y_EXCEPTIONS } from './a11y-exceptions'

const ENDPOINT = 'https://api.web3forms.com/**'
const SUCCESS =
  'Gracias. Recibimos su mensaje y le contactaremos a la brevedad.'
const INVALID = 'Revise los campos marcados y vuelva a enviar.'

const BLOCKING = new Set(['critical', 'serious'])

type Viewport = { width: number; height: number }
type State = {
  name: string
  viewport: Viewport
  prepare?: (page: Page) => Promise<void>
}

type Finding = {
  state: string
  id: string
  impact: string
  target: string
  help: string
}

const DESKTOP: Viewport = { width: 1440, height: 900 }
const MOBILE: Viewport = { width: 375, height: 812 }

async function fillInvalid(page: Page) {
  await page.getByLabel('Nombre Completo').fill('A')
  await page.getByLabel('Correo Electrónico').fill('no-es-un-correo')
  await page.getByLabel('Mensaje').fill('corto')
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByRole('status')).toHaveText(INVALID)
}

async function submitValid(page: Page) {
  await page.route(ENDPOINT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Email sent' }),
    })
  })
  await page.getByLabel('Nombre Completo').fill('Ana Pérez')
  await page.getByLabel('Correo Electrónico').fill('ana@lotusotec.cl')
  await page.getByLabel('Empresa').fill('Lotus')
  await page
    .getByLabel('Mensaje')
    .fill('Necesito información sobre el curso de alta tensión.')
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByRole('status')).toHaveText(SUCCESS)
  await page.unroute(ENDPOINT)
}

// D9: os cinco estados auditados. Cada um parte de uma navegação nova.
const STATES: readonly State[] = [
  { name: 'home-1440', viewport: DESKTOP },
  { name: 'home-375', viewport: MOBILE },
  {
    name: 'menu-aberto-375',
    viewport: MOBILE,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Abrir menú' }).click()
      await expect(
        page.getByRole('navigation', { name: 'Mobile' }),
      ).toBeVisible()
    },
  },
  { name: 'formulario-erros-1440', viewport: DESKTOP, prepare: fillInvalid },
  { name: 'formulario-sucesso-1440', viewport: DESKTOP, prepare: submitValid },
]

async function audit(page: Page, state: State): Promise<Finding[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()

  return results.violations.flatMap((violation) =>
    violation.nodes.map((node) => ({
      state: state.name,
      id: violation.id,
      impact: violation.impact ?? 'unknown',
      target: node.target.flat().join(' '),
      help: violation.help,
    })),
  )
}

function isExcepted(finding: Finding): boolean {
  return A11Y_EXCEPTIONS.some(
    (exception) =>
      exception.id === finding.id && exception.target === finding.target,
  )
}

test('gate axe: nenhuma violação critical/serious sem exceção nominal, e nenhuma exceção órfã', async ({
  page,
}, testInfo) => {
  // Cinco navegações + duas submissões + cinco auditorias.
  test.setTimeout(90_000)

  const unjustified: Finding[] = []
  const matched = new Set<string>()

  for (const state of STATES) {
    await page.setViewportSize(state.viewport)
    await page.goto('/')
    await state.prepare?.(page)

    const findings = await audit(page, state)
    await testInfo.attach(`axe-${state.name}.json`, {
      body: JSON.stringify(findings, null, 2),
      contentType: 'application/json',
    })

    for (const finding of findings) {
      const excepted = isExcepted(finding)
      if (excepted) matched.add(`${finding.id} ${finding.target}`)

      if (!BLOCKING.has(finding.impact)) {
        console.warn(
          `[axe:${state.name}] ${finding.id} (${finding.impact}, não bloqueante): ${finding.target}`,
        )
        continue
      }
      if (!excepted) unjustified.push(finding)
    }
  }

  const orphans = A11Y_EXCEPTIONS.filter(
    (exception) => !matched.has(`${exception.id} ${exception.target}`),
  ).map((exception) => `${exception.id} ${exception.target}`)

  expect(
    unjustified,
    'violações critical/serious sem exceção em e2e/a11y-exceptions.ts',
  ).toEqual([])
  expect(
    orphans,
    'exceções que não casaram nó nenhum — remover de e2e/a11y-exceptions.ts',
  ).toEqual([])
})
