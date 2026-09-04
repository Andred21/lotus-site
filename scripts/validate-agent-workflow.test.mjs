import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const VALIDADOR = 'scripts/validate-agent-workflow.mjs'

/** @type {string[]} */
const criadas = []

const arvore = () => {
  const dir = mkdtempSync(join(tmpdir(), 'lotus-espelho-'))
  criadas.push(dir)
  return dir
}

/**
 * @param {string} raiz
 * @param {string} rel
 * @param {string} conteudo
 */
const escrever = (raiz, rel, conteudo) => {
  const alvo = join(raiz, rel)
  mkdirSync(dirname(alvo), { recursive: true })
  writeFileSync(alvo, conteudo)
}

/** @param {string} raiz */
const validar = (raiz) => {
  const saida = spawnSync(process.execPath, [VALIDADOR, '--root', raiz], {
    encoding: 'utf8',
  })
  return { code: saida.status, texto: `${saida.stdout}${saida.stderr}` }
}

afterEach(() => {
  let dir = criadas.pop()
  while (dir !== undefined) {
    rmSync(dir, { recursive: true, force: true })
    dir = criadas.pop()
  }
})

describe('validate-agent-workflow contra uma árvore de espelho', () => {
  it('sai limpo quando .espelho-exclusoes está lá e nenhum artefato do harness atravessou', () => {
    // É a árvore que `scripts/espelhar-corporativo.sh` publica em
    // Gatika-CL/lotus-site. Não há contrato de harness para validar, e
    // reprovar a ausência reprovaria por acerto: `pnpm check` ficaria vermelho
    // no corporativo em toda publicação.
    const raiz = arvore()
    escrever(raiz, '.espelho-exclusoes', 'docs/\n.claude/\n')
    escrever(raiz, 'package.json', '{}\n')

    const { code, texto } = validar(raiz)

    expect(texto).toContain('árvore de espelho')
    expect(code).toBe(0)
  })

  it('reprova a árvore vazia: sem .espelho-exclusoes não há espelho, há harness faltando', () => {
    const raiz = arvore()
    escrever(raiz, 'package.json', '{}\n')

    const { code, texto } = validar(raiz)

    expect(texto).toContain('missing: CLAUDE.md')
    expect(code).toBe(1)
  })

  it('reprova harness pela metade mesmo com .espelho-exclusoes: o pulo exige os quinze ausentes', () => {
    // O caso que dá dente ao gate. Se bastasse `.espelho-exclusoes`, apagar
    // state.md por engano no repositório de desenvolvimento passaria em
    // silêncio -- e é exatamente contra isso que este validador existe.
    const raiz = arvore()
    escrever(raiz, '.espelho-exclusoes', 'docs/\n')
    escrever(
      raiz,
      'CLAUDE.md',
      '# não deveria existir numa árvore de espelho\n',
    )

    const { code, texto } = validar(raiz)

    expect(texto).not.toContain('árvore de espelho')
    expect(texto).toContain('missing: AGENTS.md')
    expect(code).toBe(1)
  })
})
