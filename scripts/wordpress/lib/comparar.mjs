// Os cinco critérios de aceite do ensaio (spec §4.3), como função pura: o
// script Chromium só coleta as duas páginas e delega o veredito para cá.

/**
 * @typedef {{ status: number, titulo: string, h1: string, texto: string, falhas: string[] }} Pagina
 */

/** @param {string} texto */
export function normalizarTexto(texto) {
  return texto.replace(/\s+/g, ' ').trim()
}

/**
 * @param {string} a
 * @param {string} b
 */
export function primeiraDiferenca(a, b) {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  /** @param {string} s */
  const janela = (s) => JSON.stringify(s.slice(Math.max(0, i - 30), i + 60))
  return `posição ${i}: vivo ${janela(a)} × cópia ${janela(b)}`
}

/**
 * @param {Pagina} vivo o WordPress em produção, por resolução normal
 * @param {Pagina & { login: number }} copia a restauração, forçada para 127.0.0.1
 * @returns {string[]} problemas; vazio quando a cópia passa
 */
export function compararPaginas(vivo, copia) {
  /** @type {string[]} */
  const problemas = []
  if (copia.status !== 200) {
    problemas.push(`home restaurada respondeu ${copia.status}`)
  }
  if (copia.titulo !== vivo.titulo) {
    problemas.push(
      `title: vivo ${JSON.stringify(vivo.titulo)} × cópia ${JSON.stringify(copia.titulo)}`,
    )
  }
  if (copia.h1 !== vivo.h1) {
    problemas.push(
      `h1: vivo ${JSON.stringify(vivo.h1)} × cópia ${JSON.stringify(copia.h1)}`,
    )
  }
  const textoVivo = normalizarTexto(vivo.texto)
  const textoCopia = normalizarTexto(copia.texto)
  if (textoVivo !== textoCopia) {
    problemas.push(
      `texto visível difere na ${primeiraDiferenca(textoVivo, textoCopia)}`,
    )
  }
  for (const falha of copia.falhas) {
    problemas.push(`resposta ≥ 400 na cópia: ${falha}`)
  }
  if (copia.login !== 200) {
    problemas.push(`wp-login.php respondeu ${copia.login}`)
  }
  return problemas
}
