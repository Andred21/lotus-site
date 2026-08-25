import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const OUT = 'docs/inventario'

/** @returns {Array<{url: string, host: string, file: string, kinds: string[], bytes: number, sha256: string, usedIn: string[]}>} */
const manifest = () =>
  JSON.parse(readFileSync(join(OUT, 'assets', 'manifest.json'), 'utf8')).assets

/** @returns {Array<{url: string}>} */
const domAssets = () =>
  JSON.parse(readFileSync(join(OUT, 'dom.json'), 'utf8')).assets

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

  it('cobre todo asset da home catalogado no DOM', () => {
    const registered = new Set(manifest().map((asset) => asset.url))
    for (const asset of domAssets()) {
      expect(registered.has(asset.url)).toBe(true)
    }
  })

  it('não deixa arquivo local fora do manifesto', () => {
    const declared = new Set(manifest().map((asset) => asset.file))
    const local = readdirSync(join(OUT, 'assets')).filter(
      (file) => file !== 'manifest.json',
    )
    for (const file of local) {
      expect(declared.has(file)).toBe(true)
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

  it('só cita sha256 que pertence a uma evidência versionada', () => {
    // Hash carimbado antes do `pnpm format` (ou antes da última corrida do
    // script) identifica bytes que não estão versionados: a proveniência do
    // documento vira ficção. Aqui todo prefixo citado precisa bater com o
    // sha256 real de alguma evidência.
    const evidence = [
      join(OUT, 'dom.json'),
      join(OUT, 'styles.json'),
      join(OUT, 'assets', 'manifest.json'),
      ...readdirSync(join(OUT, 'baseline')).map((file) =>
        join(OUT, 'baseline', file),
      ),
    ]
    const hashes = evidence.map((file) =>
      createHash('sha256').update(readFileSync(file)).digest('hex'),
    )
    for (const doc of docs) {
      const text = readFileSync(join(OUT, doc), 'utf8')
      for (const match of text.matchAll(/`([0-9a-f]{16,64})…?`/g)) {
        const cited = match[1]
        if (!cited) continue
        expect(
          hashes.some((hash) => hash.startsWith(cited)),
          `${doc} cita ${cited}, que não é sha256 de nenhuma evidência`,
        ).toBe(true)
      }
    }
  })

  it('cobre na matriz toda seção mapeada no DOM', () => {
    const dom = JSON.parse(readFileSync(join(OUT, 'dom.json'), 'utf8'))
    const matrix = readFileSync(join(OUT, 'README.md'), 'utf8')
    // Ancorado em crases: `toContain` cru é satisfeito por prosa do README
    // ("logo do header") e não prova que o id entrou na tabela de paridade.
    for (const section of dom.sections) {
      expect(matrix).toMatch(new RegExp(`\`${section.id}\``))
    }
  })
})
