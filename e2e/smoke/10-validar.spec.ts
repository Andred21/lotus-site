import { ALVO, expect, test } from './alvo'
import { pedir } from './rede'

// A página de validação na borda (spec §5.1, §5.3): HTML de nome fixo,
// revalidado a cada pedido (nunca `immutable`) e fora do índice. A CSP exata
// já é do item 8.
for (const caminho of [
  '/validar',
  '/validar/00000000-0000-4000-8000-000000000000',
]) {
  test(`10 · validar: ${caminho} serve a página com no-cache e noindex`, async ({
    destino,
  }) => {
    const r = await pedir(destino, new URL(caminho, ALVO))
    expect(r.status).toBe(200)
    expect(r.headers['content-type']).toContain('text/html')
    expect(r.headers['cache-control']).toBe('no-cache')
    expect(r.corpo.toString('utf8')).toContain('noindex')
  })
}
