import { ALVO, SHA, expect, test } from './alvo'
import { pedir, sha256 } from './rede'

// Spec D10: o release é identificado pela própria distribuição, sem
// credencial AWS — a raiz precisa ser byte a byte o index.html de
// releases/<SHA>/. O relatório nomeia o SHA no título.
test(`1 · artefato: index.html servido ≡ releases/${SHA}/index.html`, async ({
  destino,
}) => {
  const raiz = await pedir(destino, new URL('/', ALVO))
  const release = await pedir(
    destino,
    new URL(`/releases/${SHA}/index.html`, ALVO),
  )
  expect(raiz.status).toBe(200)
  expect(release.status, `releases/${SHA}/ não existe na distribuição`).toBe(
    200,
  )
  expect(sha256(raiz.corpo)).toBe(sha256(release.corpo))
  console.log(`[smoke] SHA no ar: ${SHA} (index.html ${sha256(raiz.corpo)})`)
})
