import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const OUT = 'docs/inventario'

/** @returns {Array<{url: string, host: string, file: string, bytes: number, sha256: string, usedIn: string[]}>} */
const manifest = () =>
  JSON.parse(readFileSync(join(OUT, 'assets', 'manifest.json'), 'utf8')).assets

describe('manifesto de assets', () => {
  it('tem entrada para todo asset com arquivo local presente', () => {
    for (const asset of manifest()) {
      expect(existsSync(join(OUT, 'assets', asset.file))).toBe(true)
    }
  })

  it('registra bytes e sha256 conferentes com o arquivo em disco', () => {
    for (const asset of manifest()) {
      const bytes = readFileSync(join(OUT, 'assets', asset.file))
      expect(bytes.byteLength).toBe(asset.bytes)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        asset.sha256,
      )
    }
  })

  it('não deixa asset sem origem declarada', () => {
    for (const asset of manifest()) {
      expect(asset.url).toMatch(/^https:\/\//)
      expect(asset.host.length).toBeGreaterThan(0)
    }
  })
})
