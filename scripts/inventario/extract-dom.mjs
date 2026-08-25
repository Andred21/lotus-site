/// <reference lib="dom" />
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUT_DIR, SITE_URL, desktopViewport, openPage } from './lib/site.mjs'

const { browser, page } = await openPage(desktopViewport())

const inventory = await page.evaluate(() => {
  /** @type {(text: string) => string} */
  const clean = (text) => text.replace(/\s+/g, ' ').trim()

  const head = {
    title: document.title,
    description:
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content') ?? null,
    canonical:
      document.querySelector('link[rel="canonical"]')?.getAttribute('href') ??
      null,
    lang: document.documentElement.lang || null,
    openGraph: [...document.querySelectorAll('meta[property^="og:"]')].map(
      (tag) => ({
        property: tag.getAttribute('property'),
        content: tag.getAttribute('content'),
      }),
    ),
    generators: [...document.querySelectorAll('meta[name="generator"]')].map(
      (tag) => tag.getAttribute('content'),
    ),
    icons: [
      ...[...document.querySelectorAll('link[rel*="icon" i]')].map((tag) => ({
        rel: tag.getAttribute('rel'),
        href: tag.getAttribute('href'),
        sizes: tag.getAttribute('sizes'),
      })),
      ...[
        ...document.querySelectorAll('meta[name="msapplication-TileImage"]'),
      ].map((tag) => ({
        rel: 'msapplication-TileImage',
        href: tag.getAttribute('content'),
        sizes: null,
      })),
    ],
  }

  const sections = [...document.querySelectorAll('section, [id]')]
    .filter(
      (element) => element.id && element.getBoundingClientRect().height > 40,
    )
    .map((element) => ({
      id: element.id,
      tag: element.tagName.toLowerCase(),
      headings: [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(
        (heading) => ({
          level: heading.tagName.toLowerCase(),
          text: clean(heading.textContent ?? ''),
        }),
      ),
      texts: [
        ...element.querySelectorAll(
          'p, li, span.elementor-button-text, .et_pb_text_inner, #footer-info',
        ),
      ]
        .map((node) => clean(node.textContent ?? ''))
        .filter((text) => text.length > 0),
      links: [...element.querySelectorAll('a[href]')].map((anchor) => ({
        text: clean(anchor.textContent ?? ''),
        href: anchor.getAttribute('href'),
      })),
      images: [...element.querySelectorAll('img')].map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.getAttribute('alt'),
      })),
    }))

  const forms = [...document.querySelectorAll('form')].map((form) => ({
    action: form.getAttribute('action'),
    method: form.getAttribute('method'),
    fields: [...form.querySelectorAll('input, textarea, select')].map(
      (field) => ({
        name: field.getAttribute('name'),
        type: field.getAttribute('type') ?? field.tagName.toLowerCase(),
        placeholder: field.getAttribute('placeholder'),
        required: field.hasAttribute('required'),
        ariaLabel: field.getAttribute('aria-label'),
      }),
    ),
    submitLabel: clean(
      form.querySelector('button, input[type="submit"]')?.textContent ?? '',
    ),
  }))

  const nav = [...document.querySelectorAll('a[href*="#"]')].map((anchor) => ({
    text: clean(anchor.textContent ?? ''),
    href: anchor.getAttribute('href'),
  }))

  // Catálogo de assets da home. `<img>` cobre só uma parte: o Divi serve o hero
  // e as texturas por `background-image`, o WordPress declara os favicons no
  // `<head>` e o `srcset` publica variantes de tamanho. Cada origem entra aqui
  // para que `fetch-assets.mjs` não dependa de um único seletor.
  /** @type {Map<string, { kinds: Set<string>, usedIn: Set<string>, insecure: boolean }>} */
  const assets = new Map()

  /** @type {(url: string | null | undefined, kind: string, usedIn: string) => void} */
  const addAsset = (url, kind, usedIn) => {
    if (!url) return
    const absolute = new URL(url, document.baseURI)
    if (!/^https?:$/.test(absolute.protocol)) return
    if (!/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(absolute.pathname)) return
    absolute.search = ''
    absolute.hash = ''
    // A logo do header aparece como `http://` no atributo e `https://` em
    // `currentSrc`: mesmo arquivo, dois esquemas. A chave normaliza para https
    // e `insecure` preserva o fato de o markup publicar a versão sem TLS.
    const insecure = absolute.protocol === 'http:'
    absolute.protocol = 'https:'
    const key = absolute.href
    const entry = assets.get(key) ?? {
      kinds: new Set(),
      usedIn: new Set(),
      insecure: false,
    }
    entry.kinds.add(kind)
    entry.usedIn.add(usedIn)
    entry.insecure = entry.insecure || insecure
    assets.set(key, entry)
  }

  /** @type {(element: Element) => string} */
  const ownerSection = (element) => {
    const owner = element.closest('[id]')
    return owner?.id ? owner.id : 'page'
  }

  for (const image of document.querySelectorAll('img')) {
    const where = ownerSection(image)
    // `src` e `currentSrc` divergem nos cards de curso: o atributo aponta para
    // o host de staging e o `srcset` para o domínio principal, então o Chromium
    // resolve `currentSrc` no principal. As duas URLs são hotlink real da home.
    addAsset(image.getAttribute('src'), 'img', where)
    addAsset(image.currentSrc, 'img', where)
    for (const candidate of (image.getAttribute('srcset') ?? '').split(',')) {
      addAsset(candidate.trim().split(/\s+/)[0], 'srcset', where)
    }
  }

  for (const element of document.querySelectorAll('*')) {
    const background = window.getComputedStyle(element).backgroundImage
    if (!background || background === 'none') continue
    for (const match of background.matchAll(/url\(["']?(.*?)["']?\)/g)) {
      addAsset(match[1], 'background-image', ownerSection(element))
    }
  }

  for (const icon of head.icons) addAsset(icon.href, 'icon', 'head')

  // Regras CSS do próprio site (o Divi declara `preloader.gif` em folha, não no
  // DOM). Folha de outro host lança SecurityError ao ler `cssRules`: ignorada.
  for (const sheet of document.styleSheets) {
    /** @type {CSSRuleList | null} */
    let rules = null
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of rules) {
      for (const match of rule.cssText.matchAll(/url\(["']?(.*?)["']?\)/g)) {
        addAsset(match[1], 'css', 'stylesheet')
      }
    }
  }

  const assetList = [...assets.entries()]
    .map(([url, entry]) => ({
      url,
      kinds: [...entry.kinds].sort(),
      usedIn: [...entry.usedIn].sort(),
      insecure: entry.insecure,
    }))
    .sort((a, b) => a.url.localeCompare(b.url))

  return { head, nav, sections, forms, assets: assetList }
})

await browser.close()

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(
  join(OUT_DIR, 'dom.json'),
  `${JSON.stringify({ capturedAt: new Date().toISOString(), url: SITE_URL, ...inventory }, null, 2)}\n`,
)
console.log('dom.json gravado')
