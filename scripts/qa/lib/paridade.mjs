// Ferramenta de QA: roda em Node, nunca entra no bundle da aplicação.
import { createHash } from 'node:crypto'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Pasta datada da rodada. Regerar cria pasta nova, não sobrescreve esta. */
export const RUN_DIR = 'docs/qa/paridade/2026-08-30'

/** @typedef {{ name: string, width: number, height: number, fullPage: boolean, menu: boolean }} State */

/**
 * Os quatro viewports do inventário mais o estado de menu aberto em 375, que
 * só existe por clique e nunca apareceria numa captura de página inteira.
 * @type {State[]}
 */
export const STATES = [
  { name: '375', width: 375, height: 812, fullPage: true, menu: false },
  { name: '375-menu', width: 375, height: 812, fullPage: false, menu: true },
  { name: '768', width: 768, height: 1024, fullPage: true, menu: false },
  { name: '1440', width: 1440, height: 900, fullPage: true, menu: false },
  { name: '1920', width: 1920, height: 1080, fullPage: true, menu: false },
]

/**
 * @param {string} path
 * @returns {string}
 */
export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/**
 * @param {{ dir: string, target: string, url: string, files: string[] }} input
 * @returns {{ target: string, url: string, capturedAt: string, files: { name: string, bytes: number, sha256: string }[] }}
 */
export function writeManifest({ dir, target, url, files }) {
  const manifest = {
    target,
    url,
    capturedAt: new Date().toISOString(),
    files: [...files]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        bytes: statSync(join(dir, name)).size,
        sha256: sha256File(join(dir, name)),
      })),
  }
  writeFileSync(
    join(dir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )
  return manifest
}

/**
 * Página estática com os pares lado a lado. Não decide paridade: só põe as
 * duas capturas do mesmo estado uma ao lado da outra, com peso e digest.
 * @param {{ target: string, url: string, capturedAt: string, files: { name: string, bytes: number, sha256: string }[] }} referencia
 * @param {{ target: string, url: string, capturedAt: string, files: { name: string, bytes: number, sha256: string }[] }} clone
 * @returns {string}
 */
export function contactSheetHtml(referencia, clone) {
  const pares = [...referencia.files]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((esquerda) => {
      const direita = clone.files.find((file) => file.name === esquerda.name)
      if (!direita) throw new Error(`sem par no clone: ${esquerda.name}`)
      return { esquerda, direita }
    })

  const linhas = pares
    .map(
      ({ esquerda, direita }) => `    <section id="${esquerda.name}">
      <h2>${esquerda.name}</h2>
      <div class="par">
        <figure>
          <img src="referencia/${esquerda.name}" alt="Referência ${esquerda.name}" loading="lazy" />
          <figcaption>referência · ${esquerda.bytes} B · ${esquerda.sha256.slice(0, 16)}…</figcaption>
        </figure>
        <figure>
          <img src="clone/${direita.name}" alt="Clone ${direita.name}" loading="lazy" />
          <figcaption>clone · ${direita.bytes} B · ${direita.sha256.slice(0, 16)}…</figcaption>
        </figure>
      </div>
    </section>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Paridade — referência × clone</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; }
      .par { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
      img { width: 100%; border: 1px solid #ccc; }
      figcaption { font-size: 0.8rem; color: #555; }
    </style>
  </head>
  <body>
    <h1>Paridade — referência × clone</h1>
    <p>referência: ${referencia.url} · ${referencia.capturedAt}</p>
    <p>clone: ${clone.url} · ${clone.capturedAt}</p>
${linhas}
  </body>
</html>
`
}
