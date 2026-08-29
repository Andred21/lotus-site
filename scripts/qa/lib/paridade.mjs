// Ferramenta de QA: roda em Node, nunca entra no bundle da aplicação.
import { createHash } from 'node:crypto'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Pasta datada da rodada. Regerar cria pasta nova, não sobrescreve esta. */
export const RUN_DIR = 'docs/qa/paridade/2026-08-29'

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
