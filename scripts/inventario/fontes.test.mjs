import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIR = 'src/assets/fonts'

/** As cinco faces declaradas em `src/index.css`. */
const FACES = [
  'montserrat-400.woff2',
  'montserrat-500.woff2',
  'montserrat-700.woff2',
  'open-sans-500.woff2',
  'open-sans-600.woff2',
]

/** @param {string} arquivo */
const sha256 = (arquivo) =>
  createHash('sha256')
    .update(readFileSync(join(DIR, arquivo)))
    .digest('hex')

describe('faces self-hosted', () => {
  it('tem em disco exatamente as cinco faces declaradas em src/index.css', () => {
    const emDisco = readdirSync(DIR)
      .filter((nome) => nome.endsWith('.woff2'))
      .sort()
    expect(emDisco).toEqual([...FACES].sort())
  })

  it('dá arquivo próprio a cada peso', () => {
    // D-23: o self-host da EAP 3.1.1 copiou o mesmo arquivo três vezes. Peso
    // declarado sem glifo próprio não é peso — o navegador pinta o desenho do
    // arquivo que está lá e não sintetiza nada.
    const digests = FACES.map(sha256)
    expect(new Set(digests).size).toBe(FACES.length)
  })
})
