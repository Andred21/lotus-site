// Confere que os comandos de publicação (o job `deploy` do ci.yml e a receita
// de rollback da ADR-SITE-004) tratam todo arquivo de nome fixo como tal.
//
// Os padrões do `aws s3 sync` casam com o caminho relativo inteiro:
// `--exclude "index.html"` não pega `validar/index.html`, que então subiria
// com `immutable` e ficaria preso no cache do navegador (spec §5.6 de
// `docs/superpowers/specs/2026-11-24-validacao-certificado-design.md`).

/** Arquivos que mudam sem mudar de nome: `no-cache` e invalidação a cada deploy. */
export const ARQUIVOS_DE_NOME_FIXO = Object.freeze([
  'index.html',
  'validar/index.html',
  'robots.txt',
  'sitemap.xml',
])

/**
 * Junta as continuações `\` de fim de linha e devolve só as linhas de comando.
 * @param {string} texto
 * @returns {string[]}
 */
function linhasDeComando(texto) {
  return texto
    .replace(/\\\r?\n\s*/g, ' ')
    .split(/\r?\n/)
    .map((linha) => linha.trim())
}

/**
 * @param {string} texto YAML ou Markdown cru.
 * @param {{ imutaveis: number, semCache: number, invalidacoes: number }} esperado
 * @returns {string[]} problemas; vazio quando tudo confere.
 */
export function conferirPublicacao(texto, esperado) {
  /** @type {string[]} */
  const problemas = []
  const linhas = linhasDeComando(texto)
  const syncs = linhas.filter((l) => l.startsWith('aws s3 sync '))
  const imutaveis = syncs.filter((l) => /\bimmutable\b/.test(l))
  const semCache = syncs.filter((l) => /\bno-cache\b/.test(l))

  for (const comando of imutaveis) {
    for (const f of ARQUIVOS_DE_NOME_FIXO) {
      if (!comando.includes(`--exclude "${f}"`)) {
        problemas.push(`sync immutable sem --exclude "${f}"`)
      }
    }
  }
  for (const comando of semCache) {
    if (!comando.includes('--exclude "*"')) {
      problemas.push('sync no-cache sem --exclude "*"')
    }
    for (const f of ARQUIVOS_DE_NOME_FIXO) {
      if (!comando.includes(`--include "${f}"`)) {
        problemas.push(`sync no-cache sem --include "${f}"`)
      }
    }
  }

  const invalidacoes = linhas.filter((l) =>
    l.includes('aws cloudfront create-invalidation'),
  )
  const alvo = ARQUIVOS_DE_NOME_FIXO.map((f) => `/${f}`)
  for (const comando of invalidacoes) {
    const m = /--paths\s+((?:\/\S*\s*)+)/.exec(comando)
    const veio = m?.[1]?.trim().split(/\s+/) ?? []
    if (veio.join(' ') !== alvo.join(' ')) {
      problemas.push(
        `invalidação: esperado ${alvo.join(' ')}, veio ${veio.join(' ')}`,
      )
    }
  }

  /** @type {Array<[string, number, number]>} */
  const contagens = [
    ['sync immutable', imutaveis.length, esperado.imutaveis],
    ['sync no-cache', semCache.length, esperado.semCache],
    ['create-invalidation', invalidacoes.length, esperado.invalidacoes],
  ]
  for (const [nome, veio, quer] of contagens) {
    if (veio !== quer)
      problemas.push(`contagem de ${nome}: esperado ${quer}, veio ${veio}`)
  }
  return problemas
}
