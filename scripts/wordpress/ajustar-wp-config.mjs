// Uso: node scripts/wordpress/ajustar-wp-config.mjs <wp-config.php da cópia>
// Reescreve NO LUGAR — por isso só aceita caminho fora do repositório (spec
// D3: nada do backup entra aqui, nem por acidente).
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CREDENCIAIS_DO_ENSAIO, ajustarWpConfig } from './lib/wp-config.mjs'

const alvo = process.argv[2]
if (!alvo) {
  throw new Error(
    'uso: node scripts/wordpress/ajustar-wp-config.mjs <wp-config.php da cópia>',
  )
}
const caminho = resolve(alvo)
const repo = resolve(import.meta.dirname, '../..')
if (caminho.startsWith(`${repo}/`)) {
  throw new Error(`recusado: ${caminho} está dentro do repositório ${repo}`)
}
writeFileSync(
  caminho,
  ajustarWpConfig(readFileSync(caminho, 'utf8'), CREDENCIAIS_DO_ENSAIO),
)
console.log(`wp-config ajustado: ${caminho}`)
