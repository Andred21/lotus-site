import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUT_DIR, assetFileName } from './lib/site.mjs'

/** @type {{ sections: Array<{ id: string, images: Array<{ src: string }> }> }} */
const dom = JSON.parse(readFileSync(join(OUT_DIR, 'dom.json'), 'utf8'))

/** @type {Map<string, string[]>} */
const usage = new Map()
for (const section of dom.sections) {
  for (const image of section.images) {
    if (!image.src.startsWith('https://')) continue
    const url = image.src.split('?')[0] ?? image.src
    usage.set(url, [...(usage.get(url) ?? []), section.id])
  }
}

const assetsDir = join(OUT_DIR, 'assets')
mkdirSync(assetsDir, { recursive: true })

const assets = []
for (const [url, usedIn] of [...usage.entries()].sort()) {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`falha ao baixar ${url}: ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const file = assetFileName(url)
  writeFileSync(join(assetsDir, file), bytes)
  assets.push({
    url,
    host: new URL(url).hostname,
    file,
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    usedIn,
  })
  console.log(`${file} ${bytes.byteLength} B`)
}

writeFileSync(
  join(assetsDir, 'manifest.json'),
  `${JSON.stringify({ capturedAt: new Date().toISOString(), assets }, null, 2)}\n`,
)
