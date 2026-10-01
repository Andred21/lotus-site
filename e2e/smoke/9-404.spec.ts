import { ALVO, expect, test } from './alvo'
import { pedir } from './rede'

// ADR-SITE-004: caminho inexistente é 404, não index.html com 200.
test('9 · 404: caminho inexistente devolve 404', async ({ destino }) => {
  const r = await pedir(destino, new URL('/caminho-que-nao-existe-7224', ALVO))
  expect(r.status).toBe(404)
})
