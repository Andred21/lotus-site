import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { conferirPublicacao } from './lib/publicacao.mjs'

const CI = readFileSync('.github/workflows/ci.yml', 'utf8')
const ADR = 'docs/adr/ADR-SITE-004.md'
const DEPLOY = { imutaveis: 2, semCache: 2, invalidacoes: 1 }

describe('publicação de arquivos de nome fixo', () => {
  it('o deploy do ci.yml trata os quatro arquivos como de nome fixo', () => {
    expect(conferirPublicacao(CI, DEPLOY)).toEqual([])
  })

  // `docs/` não atravessa para o espelho corporativo.
  it.skipIf(!existsSync(ADR))('o rollback da ADR-SITE-004 faz o mesmo', () => {
    expect(
      conferirPublicacao(readFileSync(ADR, 'utf8'), {
        imutaveis: 1,
        semCache: 1,
        invalidacoes: 1,
      }),
    ).toEqual([])
  })

  it('sync immutable sem validar/index.html reprova com o arquivo', () => {
    const sem = CI.replace(' --exclude "validar/index.html"', '')
    expect(conferirPublicacao(sem, DEPLOY)).toContain(
      'sync immutable sem --exclude "validar/index.html"',
    )
  })

  it('sync no-cache sem validar/index.html reprova com o arquivo', () => {
    const sem = CI.replace(' --include "validar/index.html"', '')
    expect(conferirPublicacao(sem, DEPLOY)).toContain(
      'sync no-cache sem --include "validar/index.html"',
    )
  })

  it('invalidação sem /validar/index.html reprova', () => {
    const sem = CI.replace(' /validar/index.html', '')
    expect(
      conferirPublicacao(sem, DEPLOY).some((p) => p.startsWith('invalidação:')),
    ).toBe(true)
  })

  it('padrão de nome solto não passa por arquivo de nome fixo', () => {
    const solto = CI.replaceAll('--exclude "index.html"', '--exclude "*.html"')
    expect(conferirPublicacao(solto, DEPLOY)).toContain(
      'sync immutable sem --exclude "index.html"',
    )
  })

  it('contagem divergente reprova', () => {
    expect(conferirPublicacao(CI, { ...DEPLOY, imutaveis: 3 })).toContain(
      'contagem de sync immutable: esperado 3, veio 2',
    )
  })
})
