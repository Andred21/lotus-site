import { describe, expect, it } from 'vitest'
import { CREDENCIAIS_DO_ENSAIO, ajustarWpConfig } from './lib/wp-config.mjs'

// Forma que o WordPress escreve; a senha traz espaço e parêntese de
// propósito, porque o valor vai até a aspa que o abriu, não até o `)`.
const MODELO = `<?php
define( 'DB_NAME', 'lotusote_wp123' );
define( 'DB_USER', 'lotusote_usr' );
define( 'DB_PASSWORD', 'S3nh@ com espaço e )parêntese' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
$table_prefix = 'wp_';
`

describe('ajustarWpConfig', () => {
  it('troca só as quatro constantes de conexão e preserva o resto', () => {
    const saida = ajustarWpConfig(MODELO, CREDENCIAIS_DO_ENSAIO)
    expect(saida).toContain("define( 'DB_NAME', 'wordpress' )")
    expect(saida).toContain("define( 'DB_USER', 'wordpress' )")
    expect(saida).toContain("define( 'DB_PASSWORD', 'wordpress' )")
    expect(saida).toContain("define( 'DB_HOST', 'db' )")
    expect(saida).toContain("define( 'DB_CHARSET', 'utf8mb4' )")
    expect(saida).toContain("$table_prefix = 'wp_'")
    expect(saida).not.toContain('lotusote_')
    expect(saida).not.toContain('S3nh@')
  })

  it('aceita aspas duplas e espaçamento solto', () => {
    const solto = MODELO.replace(
      "define( 'DB_HOST', 'localhost' );",
      'define("DB_HOST","127.0.0.1:3306");',
    ).replace(
      "define( 'DB_USER', 'lotusote_usr' );",
      "define ( 'DB_USER' , 'x' ) ;",
    )
    const saida = ajustarWpConfig(solto, CREDENCIAIS_DO_ENSAIO)
    expect(saida).toContain("define( 'DB_HOST', 'db' )")
    expect(saida).toContain("define( 'DB_USER', 'wordpress' )")
  })

  it('reprova wp-config sem uma das constantes, com o nome dela', () => {
    const semHost = MODELO.replace(/define\( 'DB_HOST'.*\n/, '')
    expect(() => ajustarWpConfig(semHost, CREDENCIAIS_DO_ENSAIO)).toThrow(
      "wp-config.php sem define('DB_HOST'",
    )
  })
})
