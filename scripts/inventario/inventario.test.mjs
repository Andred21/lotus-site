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

describe('inventário como artefato', () => {
  const docs = [
    '01-estrutura.md',
    '02-conteudo.md',
    '03-assets.md',
    '04-tipografia.md',
    '05-layout.md',
    '06-baseline.md',
    '07-formulario.md',
    '08-seo.md',
    '09-dados.md',
    'README.md',
  ]

  it('não deixa placeholder em nenhum documento', () => {
    // TBD/TODO sem /i: case-insensitive colide com "todo/toda" (palavra comum
    // em português), não com o marcador de placeholder.
    for (const doc of docs) {
      const text = readFileSync(join(OUT, doc), 'utf8')
      expect(text).not.toMatch(/\bTBD\b|\bTODO\b/)
      expect(text).not.toMatch(/\bpreencher\b/i)
    }
  })

  it('cobre na matriz toda seção mapeada no DOM', () => {
    const dom = JSON.parse(readFileSync(join(OUT, 'dom.json'), 'utf8'))
    const matrix = readFileSync(join(OUT, 'README.md'), 'utf8')
    for (const section of dom.sections) {
      expect(matrix).toContain(section.id)
    }
  })
})
