import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { conferirAlerta } from './lib/ci-alerta.mjs'
import { lerYaml, mapa } from './lib/yaml.mjs'

// Caminho a partir da raiz do repositório, como `zona.test.mjs`: sob o
// Vitest, `import.meta.url` não é URL de esquema `file:`.
const CI = readFileSync('.github/workflows/ci.yml', 'utf8')

// Um job novo entra no fim do arquivo, depois do `alerta`.
const JOB_A_MAIS = `
  smoke:
    runs-on: ubuntu-latest
    steps:
      - run: echo smoke
`

describe('catraca: job alerta do ci.yml ≡ spec §4.2', () => {
  it('passa no ci.yml real', () => {
    expect(conferirAlerta(CI)).toEqual([])
  })

  it('job a mais fora de needs reprova com o nome dele', () => {
    expect(conferirAlerta(`${CI}${JOB_A_MAIS}`)).toContain(
      'jobs.alerta.needs: sem smoke; uma falha dele não chega ao e-mail',
    )
  })

  it.each([
    {
      caso: 'deploy fora de needs',
      de: 'needs: [check, procedencia, deploy]',
      para: 'needs: [check, procedencia]',
      mensagem: 'jobs.alerta.needs: sem deploy',
    },
    {
      caso: 'if só com failure(), sem o tempo estourado',
      de: "      (failure() || contains(needs.*.result, 'cancelled'))\n",
      para: '      failure()\n',
      mensagem:
        "jobs.alerta.if: sem (failure() || contains(needs.*.result, 'cancelled'))",
    },
    {
      caso: 'if sem !cancelled(), que avisaria no cancelamento à mão',
      de: '      !cancelled() &&\n',
      para: '',
      mensagem: 'jobs.alerta.if: sem !cancelled()',
    },
    {
      caso: 'if com always() no lugar de !cancelled()',
      de: '      !cancelled() &&\n',
      para: '      always() &&\n',
      mensagem: 'jobs.alerta.if: parte a mais: always()',
    },
    {
      caso: 'if sem a guarda de push',
      de: "      github.event_name == 'push' &&\n      github.ref == 'refs/heads/main' &&\n      vars.AWS_ALERT_ROLE_ARN",
      para: "      github.ref == 'refs/heads/main' &&\n      vars.AWS_ALERT_ROLE_ARN",
      mensagem: "jobs.alerta.if: sem github.event_name == 'push'",
    },
    {
      caso: 'if sem a guarda de main',
      de: "      github.ref == 'refs/heads/main' &&\n      vars.AWS_ALERT_ROLE_ARN",
      para: '      vars.AWS_ALERT_ROLE_ARN',
      mensagem: "jobs.alerta.if: sem github.ref == 'refs/heads/main'",
    },
    {
      caso: 'if sem a guarda da variável',
      de: "      vars.AWS_ALERT_ROLE_ARN != '' &&\n",
      para: '',
      mensagem: "jobs.alerta.if: sem vars.AWS_ALERT_ROLE_ARN != ''",
    },
    {
      caso: 'guarda anulada por ||',
      de: "      vars.AWS_ALERT_ROLE_ARN != '' &&\n",
      para: "      vars.AWS_ALERT_ROLE_ARN != '' || true &&\n",
      mensagem:
        "jobs.alerta.if: parte a mais: vars.AWS_ALERT_ROLE_ARN != '' || true",
    },
    {
      caso: 'mensagem de commit por env',
      de: '          SHA: ${{ github.sha }}\n          REPO:',
      para: '          SHA: ${{ github.event.head_commit.message }}\n          REPO:',
      mensagem:
        'jobs.alerta: usa github.event.* ou github.head_ref, texto de quem fez o push',
    },
    {
      caso: 'nome de branch por env',
      de: '          REPO: ${{ github.repository }}\n          URL_DO_RUN:',
      para: '          REPO: ${{ github.head_ref }}\n          URL_DO_RUN:',
      mensagem:
        'jobs.alerta: usa github.event.* ou github.head_ref, texto de quem fez o push',
    },
    {
      caso: 'interpolação dentro do run',
      de: '--subject "lotus-site: CI falhou em ${SHA:0:7}"',
      para: '--subject "lotus-site: CI falhou em ${{ github.sha }}"',
      mensagem:
        'jobs.alerta: o run interpola ${{ }}; todo valor entra por env (spec §4.2)',
    },
    {
      caso: 'região fora do tópico',
      de: 'aws-region: us-east-1\n',
      para: 'aws-region: sa-east-1\n',
      mensagem:
        'jobs.alerta: aws-region esperado us-east-1, onde mora o tópico, veio sa-east-1',
    },
    {
      caso: 'role de deploy no lugar da de alerta',
      de: 'role-to-assume: ${{ vars.AWS_ALERT_ROLE_ARN }}',
      para: 'role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}',
      mensagem:
        'jobs.alerta: role-to-assume esperado ${{ vars.AWS_ALERT_ROLE_ARN }}, veio ${{ vars.AWS_DEPLOY_ROLE_ARN }}',
    },
    {
      caso: 'permissão a mais',
      de: '    permissions:\n      id-token: write\n\n    steps:\n      - name: Assumir a role de alerta por OIDC',
      para: '    permissions:\n      id-token: write\n      contents: write\n\n    steps:\n      - name: Assumir a role de alerta por OIDC',
      mensagem: 'jobs.alerta.permissions: esperado só id-token: write',
    },
    {
      caso: 'aviso do deploy sem a role',
      de: "        if: vars.AWS_ALERT_ROLE_ARN == '' || vars.AWS_ALERT_TOPIC_ARN == ''\n",
      para: "        if: vars.AWS_ALERT_TOPIC_ARN == ''\n",
      mensagem:
        'jobs.deploy: sem o passo ::warning:: para AWS_ALERT_ROLE_ARN ou AWS_ALERT_TOPIC_ARN ausente',
    },
    {
      caso: 'aviso do deploy sem o tópico',
      de: "        if: vars.AWS_ALERT_ROLE_ARN == '' || vars.AWS_ALERT_TOPIC_ARN == ''\n",
      para: "        if: vars.AWS_ALERT_ROLE_ARN == ''\n",
      mensagem:
        'jobs.deploy: sem o passo ::warning:: para AWS_ALERT_ROLE_ARN ou AWS_ALERT_TOPIC_ARN ausente',
    },
  ])('$caso reprova com o campo', ({ de, para, mensagem }) => {
    // Uma vez só: o `if` do `deploy` tem as mesmas guardas, e a troca cairia
    // nele.
    expect(CI.split(de)).toHaveLength(2)
    expect(conferirAlerta(CI.replace(de, para)).join('\n')).toContain(mensagem)
  })

  it('ci.yml sem o job alerta reprova', () => {
    // O corte precisa achar o job: sem ele, `slice(0, -1)` levaria o arquivo
    // inteiro, e o teste passaria sem cortar nada.
    expect(CI.split('\n  # Avisa por e-mail')).toHaveLength(2)
    const semAlerta = CI.slice(0, CI.indexOf('\n  # Avisa por e-mail'))
    expect(conferirAlerta(semAlerta)).toEqual(['jobs.alerta: ausente'])
  })
})

// O roteiro do passo de publicação roda de verdade: `bash -e`, como o runner
// roda `run` sem `shell`, com um `aws` falso que guarda os argumentos. O `jq`
// é o do sistema, como no ubuntu-latest.
describe('o roteiro do alerta, executado', () => {
  /** @type {string[]} */
  const criadas = []

  afterEach(() => {
    let dir = criadas.pop()
    while (dir !== undefined) {
      rmSync(dir, { recursive: true, force: true })
      dir = criadas.pop()
    }
  })

  const roteiro = () => {
    const alerta = mapa(mapa(lerYaml(CI).jobs, 'jobs').alerta, 'jobs.alerta')
    const passos = Array.isArray(alerta.steps) ? alerta.steps : []
    const publicar = passos
      .map((passo, i) => mapa(passo, `jobs.alerta.steps[${i}]`))
      .find((passo) => String(passo.run ?? '').includes('aws sns publish'))
    if (!publicar) throw new Error('jobs.alerta sem o passo de aws sns publish')
    return String(publicar.run)
  }

  /** @param {Record<string, string>} ambiente */
  const rodar = (ambiente) => {
    const dir = mkdtempSync(join(tmpdir(), 'lotus-alerta-'))
    criadas.push(dir)
    const argumentos = join(dir, 'argumentos')
    writeFileSync(
      join(dir, 'aws'),
      `#!/usr/bin/env bash\nprintf '%s\\0' "$@" > '${argumentos}'\necho id-falso\n`,
    )
    chmodSync(join(dir, 'aws'), 0o755)
    writeFileSync(join(dir, 'roteiro.sh'), roteiro())
    const saida = spawnSync('bash', ['-e', join(dir, 'roteiro.sh')], {
      encoding: 'utf8',
      env: { PATH: `${dir}:${process.env.PATH ?? ''}`, ...ambiente },
    })
    const chamada = existsSync(argumentos)
      ? readFileSync(argumentos, 'utf8').split('\0').slice(0, -1)
      : null
    return {
      codigo: saida.status,
      texto: `${saida.stdout}${saida.stderr}`,
      chamada,
    }
  }

  // O que `toJSON(needs)` entrega quando o `check` reprova: o `deploy` fica
  // pulado por dependência.
  const AMBIENTE = {
    TOPICO: 'arn:aws:sns:us-east-1:760144413534:lotus-site-alertas',
    RESULTADOS: JSON.stringify({
      check: { result: 'failure', outputs: {} },
      procedencia: { result: 'success', outputs: {} },
      deploy: { result: 'skipped', outputs: {} },
    }),
    SHA: '0123456789abcdef0123456789abcdef01234567',
    REPO: 'Gatika-CL/lotus-site',
    URL_DO_RUN: 'https://github.com/Gatika-CL/lotus-site/actions/runs/1',
  }

  it('publica no tópico com assunto curto e uma linha por job', () => {
    const { codigo, texto, chamada } = rodar(AMBIENTE)
    expect(texto).toContain('id-falso')
    expect(codigo).toBe(0)
    const argumentos = chamada ?? []
    expect(argumentos.slice(0, 6)).toEqual([
      'sns',
      'publish',
      '--topic-arn',
      AMBIENTE.TOPICO,
      '--subject',
      'lotus-site: CI falhou em 0123456',
    ])
    // A API Publish recusa assunto com quebra de linha ou caractere de
    // controle, ou com 100 caracteres ou mais.
    expect(argumentos[5]).toMatch(/^\P{Cc}{1,99}$/u)
    const corpo = argumentos[argumentos.indexOf('--message') + 1] ?? ''
    expect(corpo).toContain(
      'check: failure\nprocedencia: success\ndeploy: skipped',
    )
    expect(corpo).toContain(`commit: ${AMBIENTE.SHA}`)
    expect(corpo).toContain(`run: ${AMBIENTE.URL_DO_RUN}`)
  })

  // Job que estoura `timeout-minutes` chega como `cancelled`: o corpo diz o
  // que isso quer dizer.
  it('deploy com tempo estourado aparece como tal no corpo', () => {
    const { codigo, chamada } = rodar({
      ...AMBIENTE,
      RESULTADOS: JSON.stringify({
        check: { result: 'success', outputs: {} },
        procedencia: { result: 'success', outputs: {} },
        deploy: { result: 'cancelled', outputs: {} },
      }),
    })
    expect(codigo).toBe(0)
    const argumentos = chamada ?? []
    const corpo = argumentos[argumentos.indexOf('--message') + 1] ?? ''
    expect(corpo).toContain(
      'check: success\nprocedencia: success\ndeploy: cancelled (tempo estourado)',
    )
  })

  it('sem o tópico, reprova com ::error:: e não chama a AWS', () => {
    const { codigo, texto, chamada } = rodar({ ...AMBIENTE, TOPICO: '' })
    expect(codigo).toBe(1)
    expect(texto).toContain('::error::AWS_ALERT_TOPIC_ARN')
    expect(chamada).toBeNull()
  })
})
