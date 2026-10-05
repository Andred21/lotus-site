// Reescreve as quatro constantes de conexão de uma CÓPIA do wp-config.php
// para o MariaDB do ensaio (7.2.3, spec §4.3). Só isto muda no restaurado: o
// banco importado é byte a byte o do dump e nenhum search-replace toca em URL
// (spec D4) — a cópia é servida como https://lotusotec.cl, não reescrita.

/**
 * @typedef {{ DB_NAME: string, DB_USER: string, DB_PASSWORD: string, DB_HOST: string }} Credenciais
 */

/**
 * Batem com `scripts/wordpress/compose.yaml`: serviço `db`, banco, usuário e
 * senha `wordpress`. Senha trivial de propósito: é um container local que
 * morre no fim do ensaio.
 * @type {Readonly<Credenciais>}
 */
export const CREDENCIAIS_DO_ENSAIO = Object.freeze({
  DB_NAME: 'wordpress',
  DB_USER: 'wordpress',
  DB_PASSWORD: 'wordpress',
  DB_HOST: 'db',
})

/** @type {readonly (keyof Credenciais)[]} */
const CHAVES = Object.freeze(['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'])

/**
 * @param {string} texto conteúdo do wp-config.php
 * @param {Credenciais} credenciais
 * @returns {string} o mesmo texto com as quatro constantes trocadas
 */
export function ajustarWpConfig(texto, credenciais) {
  let saida = texto
  for (const chave of CHAVES) {
    // define( 'CHAVE', 'valor' ) com aspas simples ou duplas e espaço livre.
    // O valor vai até a aspa que o abriu: `)` dentro da senha não corta.
    const padrao = new RegExp(
      `define\\s*\\(\\s*(['"])${chave}\\1\\s*,\\s*(['"])(?:(?!\\2).)*\\2\\s*\\)`,
    )
    if (!padrao.test(saida)) {
      throw new Error(`wp-config.php sem define('${chave}', ...)`)
    }
    saida = saida.replace(
      padrao,
      `define( '${chave}', '${credenciais[chave]}' )`,
    )
  }
  return saida
}
