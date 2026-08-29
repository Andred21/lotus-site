import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  RUN_DIR,
  STATES,
  contactSheetHtml,
  sha256File,
  writeManifest,
} from './paridade.mjs'

describe('STATES', () => {
  it('cobre os quatro viewports do inventário mais o menu aberto em 375', () => {
    expect(STATES.map((state) => state.name)).toEqual([
      '375',
      '375-menu',
      '768',
      '1440',
      '1920',
    ])
  })

  it('captura página inteira em todo estado, menos no menu aberto', () => {
    const menu = STATES.find((state) => state.name === '375-menu')
    expect(menu).toMatchObject({
      width: 375,
      height: 812,
      fullPage: false,
      menu: true,
    })
    for (const state of STATES.filter(
      (candidate) => candidate.name !== '375-menu',
    )) {
      expect(state).toMatchObject({ fullPage: true, menu: false })
    }
  })

  it('aponta a rodada para uma pasta datada, não para um temporário', () => {
    expect(RUN_DIR).toBe('docs/qa/paridade/2026-08-29')
  })
})

describe('sha256File', () => {
  it('devolve o digest hexadecimal do conteúdo do arquivo', () => {
    const dir = mkdtempSync(join(tmpdir(), 'paridade-'))
    const file = join(dir, 'a.txt')
    writeFileSync(file, 'lotus')
    // Digest conhecido de 'lotus', conferido com `printf lotus | sha256sum`.
    expect(sha256File(file)).toMatch(/^[0-9a-f]{64}$/)
    expect(sha256File(file)).toBe(sha256File(file))
  })
})

describe('writeManifest', () => {
  it('grava alvo, URL, data e uma entrada por arquivo, ordenada por nome', () => {
    const dir = mkdtempSync(join(tmpdir(), 'paridade-'))
    writeFileSync(join(dir, 'home-768.png'), 'b')
    writeFileSync(join(dir, 'home-375.png'), 'a')

    const manifest = writeManifest({
      dir,
      target: 'referencia',
      url: 'https://lotusotec.cl/',
      files: ['home-768.png', 'home-375.png'],
    })

    expect(manifest.target).toBe('referencia')
    expect(manifest.url).toBe('https://lotusotec.cl/')
    // Sem acesso indexado: `noUncheckedIndexedAccess` está ligado e vale
    // nestes .mjs, porque `tsconfig.node.json` roda com `checkJs`.
    expect(manifest.files.map((entry) => entry.name)).toEqual([
      'home-375.png',
      'home-768.png',
    ])
    expect(manifest.files).toContainEqual(
      expect.objectContaining({ name: 'home-375.png', bytes: 1 }),
    )
    for (const entry of manifest.files) {
      expect(entry.sha256).toMatch(/^[0-9a-f]{64}$/)
    }
    expect(manifest.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('contactSheetHtml', () => {
  const referencia = {
    target: 'referencia',
    url: 'https://lotusotec.cl/',
    capturedAt: '2026-08-29T10:00:00.000Z',
    files: [
      { name: 'home-375.png', bytes: 1, sha256: 'a'.repeat(64) },
      { name: 'home-1440.png', bytes: 2, sha256: 'b'.repeat(64) },
    ],
  }
  const clone = {
    target: 'clone',
    url: 'http://localhost:5184/',
    capturedAt: '2026-08-29T10:05:00.000Z',
    files: [
      { name: 'home-375.png', bytes: 3, sha256: 'c'.repeat(64) },
      { name: 'home-1440.png', bytes: 4, sha256: 'd'.repeat(64) },
    ],
  }

  it('emite um par por estado, referência à esquerda e clone à direita', () => {
    const html = contactSheetHtml(referencia, clone)
    expect(html).toContain('referencia/home-375.png')
    expect(html).toContain('clone/home-375.png')
    expect(html.indexOf('referencia/home-375.png')).toBeLessThan(
      html.indexOf('clone/home-375.png'),
    )
  })

  it('ordena os pares pelo nome do estado e carimba as duas datas', () => {
    const html = contactSheetHtml(referencia, clone)
    expect(html.indexOf('home-1440.png')).toBeLessThan(
      html.indexOf('home-375.png'),
    )
    expect(html).toContain('2026-08-29T10:00:00.000Z')
    expect(html).toContain('2026-08-29T10:05:00.000Z')
  })

  it('reprova estado sem par, em vez de esconder a falta', () => {
    expect(() =>
      contactSheetHtml(referencia, { ...clone, files: clone.files.slice(1) }),
    ).toThrow('sem par no clone: home-375.png')
  })
})
