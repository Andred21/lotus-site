import { expect, test, type Page } from '@playwright/test'

// 1440: o menu desktop só existe acima de --breakpoint-desktop (1000px) e o
// botão do menu mobile é `desktop:hidden` — fora da ordem de tabulação.
test.use({ viewport: { width: 1440, height: 900 } })

const ENDPOINT = 'https://api.web3forms.com/**'
const SUCCESS =
  'Gracias. Recibimos su mensaje y le contactaremos a la brevedad.'

type Stop = { key: string; outlineStyle: string; outlineWidth: string }

/** Identidade e anel de foco do elemento ativo, lidos no browser. */
function activeStop(page: Page): Promise<Stop> {
  return page.evaluate(() => {
    const element = document.activeElement
    if (!element || element === document.body) {
      return { key: 'body', outlineStyle: '', outlineWidth: '' }
    }
    const style = getComputedStyle(element)
    const label =
      element.id ||
      element.querySelector('img')?.getAttribute('alt') ||
      element.textContent?.trim() ||
      ''
    return {
      key: `${element.tagName.toLowerCase()}:${label}`,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    }
  })
}

// Ordem do DOM: logo, menu, dois CTAs, mailto, quatro campos, botão. O bloco
// de status (`tabIndex={-1}`) e o honeypot (`hidden`, `tabIndex={-1}`) não
// param o Tab.
const EXPECTED_ORDER = [
  'a:LOTUS',
  'a:Inicio',
  'a:Quienes Somos',
  'a:Cursos',
  'a:Contacto',
  'a:Learn More',
  'a:See More',
  'a:contacto@lotusotec.cl',
  'input:nombre',
  'input:email',
  'input:empresa',
  'textarea:mensaje',
  'button:Enviar',
]

test('Tab percorre a home inteira na ordem do DOM, com foco visível em cada parada', async ({
  page,
}) => {
  await page.goto('/')

  const stops: Stop[] = []
  for (let index = 0; index < EXPECTED_ORDER.length; index += 1) {
    await page.keyboard.press('Tab')
    stops.push(await activeStop(page))
  }

  expect(stops.map((stop) => stop.key)).toEqual(EXPECTED_ORDER)

  // O `:focus-visible` do user agent permanece: nenhuma regra do projeto
  // remove outline. Foco por teclado tem anel em toda parada.
  const semAnel = stops.filter(
    (stop) => stop.outlineStyle === 'none' || stop.outlineWidth === '0px',
  )
  expect(semAnel).toEqual([])

  // Depois da última parada, o foco sai do documento (ou volta ao body).
  await page.keyboard.press('Tab')
  expect((await activeStop(page)).key).toBe('body')
})

test('o formulário é enviado sem mouse e o foco vai ao bloco de status', async ({
  page,
}) => {
  await page.route(ENDPOINT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Email sent' }),
    })
  })

  await page.goto('/')
  await page.getByLabel('Nombre Completo').focus()
  await page.keyboard.type('Ana Pérez')
  await page.keyboard.press('Tab')
  await page.keyboard.type('ana@lotusotec.cl')
  await page.keyboard.press('Tab')
  await page.keyboard.type('Lotus')
  await page.keyboard.press('Tab')
  await page.keyboard.type(
    'Necesito información sobre el curso de alta tensión.',
  )
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeFocused()
  await page.keyboard.press('Enter')

  const status = page.getByRole('status')
  await expect(status).toHaveText(SUCCESS)
  await expect(status).toBeFocused()
})

test('prefers-reduced-motion desliga o scroll suave', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth')
})
