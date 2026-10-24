import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
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

// Os arquivos do harness não atravessam para o espelho: lá não há o que
// copiar, e o próprio validador já pula a checagem de estado. Os testes de
// espelho acima continuam rodando nas duas árvores.
describe.skipIf(!existsSync('CLAUDE.md'))(
  'validate-agent-workflow: nomes de executor e reviewer',
  () => {
    const HARNESS = [
      'CLAUDE.md',
      'AGENTS.md',
      '.claude',
      '.agents',
      'docs/superpowers/state.md',
      'docs/superpowers/backlog.md',
      'docs/superpowers/historico/progress.md',
    ]

    /** @type {Record<string, string>} */
    const BASE = {
      workflow_state: 'ready_for_execution',
      work_class: 'architectural',
      active_work_item: 'teste',
      active_branch: 'chore/teste',
      bounded_design: 'null',
      authorized_paths: 'null',
      active_spec: 'docs/superpowers/specs/teste.md',
      active_plan: 'docs/superpowers/plans/teste.md',
      executor: 'claude',
      reviewer: 'claude-isolado',
      reviewer_exception: 'null',
      resume_state: 'null',
      blocker: 'null',
    }

    /**
     * Cópia do harness real com o frontmatter do `state.md` reescrito.
     * @param {Record<string, string>} campos
     * @returns {string}
     */
    const harnessCom = (campos) => {
      const raiz = arvore()
      for (const rel of HARNESS) {
        cpSync(rel, join(raiz, rel), { recursive: true })
      }
      const estado = join(raiz, 'docs/superpowers/state.md')
      let texto = readFileSync(estado, 'utf8')
      for (const [chave, valor] of Object.entries({ ...BASE, ...campos })) {
        texto = texto.replace(
          new RegExp(`^${chave}: .*$`, 'm'),
          `${chave}: ${valor}`,
        )
      }
      writeFileSync(estado, texto)
      return raiz
    }

    it('aceita claude executando e claude-isolado revisando', () => {
      const { code, texto } = validar(harnessCom({}))

      expect(texto).toContain('Agent workflow contract OK')
      expect(code).toBe(0)
    })

    it('reprova claude-isolado como executor', () => {
      const { code, texto } = validar(
        harnessCom({ executor: 'claude-isolado', reviewer: 'codex' }),
      )

      expect(texto).toContain('claude-isolado só revisa')
      expect(code).toBe(1)
    })

    it('reprova nome fora do conjunto', () => {
      const { code, texto } = validar(harnessCom({ reviewer: 'gemini' }))

      expect(texto).toContain('reviewer desconhecido: gemini')
      expect(code).toBe(1)
    })

    it('aceita o mesmo agente nos dois papéis com reviewer_exception', () => {
      const { code } = validar(
        harnessCom({
          reviewer: 'claude',
          reviewer_exception: "'teste 2026-10-24'",
        }),
      )

      expect(code).toBe(0)
    })

    it('reprova reviewer_exception com claude-isolado revisando', () => {
      const { code, texto } = validar(
        harnessCom({ reviewer_exception: "'teste 2026-10-24'" }),
      )

      expect(texto).toContain(
        'reviewer_exception só vale com executor e reviewer iguais',
      )
      expect(code).toBe(1)
    })

    it("compara sem aspas: 'claude' contra claude reprova", () => {
      // `parseFrontmatter` não tira aspas: sem normalizar, o nome entre aspas
      // passaria como agente diferente do executor.
      const { code, texto } = validar(harnessCom({ reviewer: "'claude'" }))

      expect(texto).toContain('executor e reviewer devem ser diferentes')
      expect(code).toBe(1)
    })

    it('aceita reviewer entre aspas', () => {
      const { code } = validar(harnessCom({ reviewer: "'claude-isolado'" }))

      expect(code).toBe(0)
    })

    it('não confere nome nulo antes da execução', () => {
      const { code } = validar(
        harnessCom({
          workflow_state: 'planning',
          work_class: 'null',
          executor: 'null',
          reviewer: 'null',
        }),
      )

      expect(code).toBe(0)
    })
  },
)
