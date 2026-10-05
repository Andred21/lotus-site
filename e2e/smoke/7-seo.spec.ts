import { ALVO, DOMINIO, X_ROBOTS_TAG_PRESENTE, expect, test } from './alvo'
import { pedir } from './rede'

const CANONICAL = `https://${DOMINIO}/`

test('7 · SEO técnico: title, description, canonical, og:*, JSON-LD, robots, sitemap, X-Robots-Tag', async ({
  destino,
}) => {
  const raiz = await pedir(destino, new URL('/', ALVO))
  const html = raiz.corpo.toString('utf8')
  expect(html).toContain('<title>LOTUS | OTEC</title>')
  expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]{20,}"/)
  expect(html).toContain(`<link rel="canonical" href="${CANONICAL}" />`)
  for (const propriedade of [
    'og:type',
    'og:url',
    'og:title',
    'og:description',
    'og:image',
  ]) {
    expect(html, propriedade).toMatch(
      new RegExp(`<meta\\s+property="${propriedade}"\\s+content="[^"]+"`),
    )
  }
  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  )?.[1]
  const dados: { '@type'?: string; url?: string } = JSON.parse(jsonLd ?? '{}')
  expect(dados['@type']).toBe('Organization')
  expect(dados.url).toBe(CANONICAL)

  const robots = (
    await pedir(destino, new URL('/robots.txt', ALVO))
  ).corpo.toString('utf8')
  expect(robots).toContain('Allow: /')
  expect(robots).toContain(`Sitemap: ${CANONICAL}sitemap.xml`)
  const sitemap = (
    await pedir(destino, new URL('/sitemap.xml', ALVO))
  ).corpo.toString('utf8')
  expect(sitemap).toContain(`<loc>${CANONICAL}</loc>`)

  // Presente até B5 (spec §2); B5 troca a constante em alvo.ts.
  if (X_ROBOTS_TAG_PRESENTE)
    expect(raiz.headers['x-robots-tag']).toBe('noindex, nofollow')
  else expect(raiz.headers['x-robots-tag']).toBeUndefined()
})
