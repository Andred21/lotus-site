// Resumo legível do relatório do Lighthouse. Registra o que foi medido; não
// transforma score isolado em meta (aceite da EAP 6.2.1).

/**
 * Elemento do LCP como o Lighthouse instalado o reporta.
 *
 * O audit clássico `largest-contentful-paint-element` não existe mais no
 * Lighthouse 13 (o relatório traz `null`): a atribuição de causa migrou para
 * os audits `*-insight`, onde o nó aparece como item `type: 'node'` dentro de
 * `details.items`. Ler só o audit clássico publicava `não reportado` com a
 * causa disponível no mesmo arquivo — achado da review de 2026-08-29.
 * @param {any} lhr
 * @returns {string}
 */
export function elementoLcp(lhr) {
  const audits = lhr.audits ?? {}
  const legado =
    audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]
      ?.node
  const itens = audits['lcp-breakdown-insight']?.details?.items
  const insight = Array.isArray(itens)
    ? itens.find((item) => item?.type === 'node')
    : undefined
  const no = legado ?? insight
  if (!no?.snippet) return 'não reportado'
  return no.nodeLabel ? `${no.snippet} — "${no.nodeLabel}"` : no.snippet
}

/**
 * @param {any} lhr
 * @param {string} relatorio Nome do JSON cru desta mesma execução.
 * @returns {string}
 */
export function resumoMarkdown(lhr, relatorio = 'lighthouse.json') {
  const categorias = Object.values(lhr.categories)
    .map(
      (categoria) =>
        `| ${categoria.title} | ${Math.round(categoria.score * 100)} |`,
    )
    .join('\n')

  const lcp = lhr.audits['largest-contentful-paint']
  const cls = lhr.audits['cumulative-layout-shift']

  return `# Lighthouse — build de produção

> URL medida: ${lhr.finalDisplayedUrl} · execução: ${lhr.fetchTime}
> Relatório cru: \`${relatorio}\` nesta pasta.

## Categorias

| categoria | score |
| --------- | ----- |
${categorias}

## Core Web Vitals

- LCP: ${lcp.displayValue} (${Math.round(lcp.numericValue)} ms)
- CLS: ${cls.displayValue}
- elemento do LCP: ${elementoLcp(lhr)}

## Ressalva

Medição de **laboratório**, numa máquina só, contra \`vite preview\` local. Não é dado de campo e
não descreve o que um visitante real experimenta. Nenhum score aqui é meta: o que orienta a EAP
\`6.2.2\` é a causa apontada, não o número.
`
}
