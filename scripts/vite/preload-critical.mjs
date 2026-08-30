// Plugin de build: injeta `<link rel="preload">` para os assets acima da
// dobra. O Vite fingerprinta o nome dos arquivos, então o href só existe
// depois do bundle — daí `transformIndexHtml` com acesso a `ctx.bundle`.

/**
 * Padrão do arquivo no bundle e atributos do link gerado.
 * @type {{ padrao: RegExp, attrs: Record<string, string> }[]}
 */
const ALVOS = [
  {
    // O elemento do LCP é o `<h1 id="hero-heading">` (`lcp-breakdown-insight`
    // de `docs/qa/performance/`), pintado em `font-bold` = peso 700. Até
    // 2026-08-30 o alvo aqui era `montserrat-400`, porque os três arquivos de
    // Montserrat eram bytes idênticos e o Vite dedupava para o nome do
    // primeiro `@font-face`. Com os pesos reais (`D-23` fechado) o dedupe
    // acabou e o arquivo que o `h1` carrega é o do peso 700.
    padrao: /montserrat-700-[^/]*\.woff2$/,
    attrs: { as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  },
  {
    padrao: /open-sans-500-[^/]*\.woff2$/,
    attrs: { as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  },
  // A foto do hero (`shutterstock_1444636373-1-scaled`) tinha preload aqui e
  // saiu na review de 2026-08-29: o LCP medido é o `<h1 id="hero-heading">`,
  // não a foto, e D10 da spec só conserva mudança dirigida pelo gargalo
  // medido, com delta próprio. Volta se alguma medição apontar a foto.
]

/**
 * O handler mora fora do plugin para o teste poder chamá-lo sem depender do
 * tipo `Plugin` do Vite, que é uma união e derruba o `checkJs` do repositório.
 * @param {{ bundle?: Record<string, { fileName?: string }> }} ctx
 * @returns {{ tag: string, injectTo: string, attrs: Record<string, string> }[]}
 */
export function preloadTags(ctx) {
  if (!ctx.bundle) return []
  const arquivos = Object.values(ctx.bundle)
    .map((saida) => saida.fileName)
    .filter((fileName) => typeof fileName === 'string')

  return ALVOS.flatMap((alvo) => {
    const encontrado = arquivos.find((fileName) => alvo.padrao.test(fileName))
    if (!encontrado) return []
    return [
      {
        tag: 'link',
        injectTo: 'head-prepend',
        attrs: { rel: 'preload', href: `/${encontrado}`, ...alvo.attrs },
      },
    ]
  })
}

export function preloadCritical() {
  return {
    name: 'lotus-preload-critical',
    transformIndexHtml: {
      order: /** @type {const} */ ('post'),
      /**
       * @param {string} _html
       * @param {{ bundle?: Record<string, { fileName?: string }> }} ctx
       */
      handler: (_html, ctx) => preloadTags(ctx),
    },
  }
}
