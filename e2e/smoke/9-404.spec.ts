import { ALVO, expect, test } from './alvo'
import { pedir } from './rede'

// ADR-SITE-004: caminho inexistente é 404, não index.html com 200. Do
// prefixo `/validar` só `/validar`, `/validar/` e `/validar/<uuid>` servem a
// página (spec §5.1, ADR-SITE-007).
for (const caminho of [
  '/caminho-que-nao-existe-7224',
  '/validar/abc',
  '/validar/0f8fad5b-d9cb-469f-a165-70867728950e/x',
]) {
  test(`9 · 404: ${caminho} devolve 404`, async ({ destino }) => {
    const r = await pedir(destino, new URL(caminho, ALVO))
    expect(r.status).toBe(404)
  })
}
