import { expect, test } from '@playwright/test'

const CANONICAL = 'https://lotusotec.cl/'

// O dev server devolve index.html (200) para qualquer path desconhecido, então
// status sozinho não prova nada: o corpo é o que se compara.
test('robots.txt é servido, indexável e aponta para o sitemap (D6)', async ({
  request,
}) => {
  const response = await request.get('/robots.txt')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/plain')

  const body = await response.text()
  expect(body).toContain('User-agent: *')
  expect(body).toContain('Allow: /')
  expect(body).toContain(`Sitemap: ${CANONICAL}sitemap.xml`)
  expect(body).not.toContain('Disallow')
})

test('sitemap.xml é servido com a home como única URL (D7)', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/xml/)

  const body = await response.text()
  expect(body).toContain(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  )
  const locs = [...body.matchAll(/<loc>([^<]*)<\/loc>/g)].map(
    (match) => match[1],
  )
  expect(locs).toEqual([CANONICAL])
  expect(body).not.toContain('http-18-230-15-185')
  expect(body).not.toContain('<lastmod>')
})
