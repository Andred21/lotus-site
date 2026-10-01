import { ALVO, expect, test } from './alvo'
import { cabecalhosDePost, pedir } from './rede'

// Spec D11: o envio real é humano. Aqui: o Turnstile de verdade carrega no
// host real (o iframe vive num shadow root fechado, então a prova é o frame
// do Playwright navegando para o challenge-platform — evidência de B3), e a
// função recusa o que deve recusar: GET 405, corpo vazio 400 (schema), token
// ausente 400 (schema), token falso 403 (siteverify) — códigos de
// lambda/contato/handler.ts. Todo POST aqui é um que o handler rejeita antes
// de enviar e-mail: nenhum envio real sai deste teste.
test('6 · formulário: Turnstile carrega; /api/contacto recusa GET, corpo vazio, token ausente e token falso', async ({
  page,
  destino,
}) => {
  await page.goto('/')
  const frame = page.waitForEvent('framenavigated', {
    predicate: (f) =>
      f.url().includes('challenges.cloudflare.com/cdn-cgi/challenge-platform'),
    timeout: 30_000,
  })
  await page.locator('#Contacto').scrollIntoViewIfNeeded()
  await frame
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveCount(
    1,
  )

  const api = new URL('/api/contacto', ALVO)
  expect((await pedir(destino, api)).status).toBe(405)

  const postar = async (corpo: string) =>
    (
      await pedir(destino, api, {
        method: 'POST',
        headers: cabecalhosDePost(corpo),
        corpo,
      })
    ).status

  expect(await postar('{}')).toBe(400)

  const campos = {
    nombre: 'Smoke Test',
    email: 'smoke@lotusotec.cl',
    empresa: 'Lotus OTEC',
    mensaje:
      'Mensagem do smoke automatizado de 7.2.4; o token é inválido de propósito.',
  }
  expect(await postar(JSON.stringify(campos))).toBe(400)
  expect(
    await postar(
      JSON.stringify({ ...campos, captcha: 'smoke-token-invalido' }),
    ),
  ).toBe(403)
})
