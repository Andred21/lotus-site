import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUT_DIR, assetFileName } from './lib/site.mjs'

/** @type {{ assets: Array<{ url: string, kinds: string[], usedIn: string[], insecure: boolean }> }} */
const dom = JSON.parse(readFileSync(join(OUT_DIR, 'dom.json'), 'utf8'))

const assetsDir = join(OUT_DIR, 'assets')
mkdirSync(assetsDir, { recursive: true })

const assets = []
for (const entry of [...dom.assets].sort((a, b) =>
  a.url.localeCompare(b.url),
)) {
  const response = await fetch(entry.url)
  if (!response.ok)
    throw new Error(`falha ao baixar ${entry.url}: ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const file = assetFileName(entry.url)
  writeFileSync(join(assetsDir, file), bytes)
  assets.push({
    url: entry.url,
    host: new URL(entry.url).hostname,
    file,
    kinds: entry.kinds,
    insecure: entry.insecure,
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    usedIn: entry.usedIn,
  })
  console.log(`${file} ${bytes.byteLength} B`)
}

// `capturedAt` é metadado de execução e muda a cada corrida por definição; o
// determinismo exigido pelo aceite vive em `assets[]`, que é ordenado por URL e
// carrega bytes e sha256 do conteúdo remoto.
writeFileSync(
  join(assetsDir, 'manifest.json'),
  `${JSON.stringify({ capturedAt: new Date().toISOString(), assets }, null, 2)}\n`,
)
console.log(`manifest.json: ${assets.length} assets`)
