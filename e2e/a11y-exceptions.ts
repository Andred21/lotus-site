/**
 * Exceções nominais do gate axe (D9 do bloco 5.1.1-5.3.2, débito D-21).
 * Cada entrada aceita UM nó, por regra e seletor exatos reportados pelo axe.
 * Exceção que não casa nó nenhum reprova o gate: a lista não apodrece.
 */
export type A11yException = {
  /** Regra do axe, ex. 'color-contrast'. */
  id: string
  /** Seletor exato reportado pelo axe (`node.target` unido por espaço). */
  target: string
  /** Por que o nó é aceito assim. */
  reason: string
  /** Decisão ou medição que sustenta a exceção. */
  source: string
  /** O que reabre a exceção. */
  trigger: string
}

const PARIDADE = {
  reason:
    'cor medida do site original; corrigir viola a Lei 1 (clone antes de redesign) e muda pixel',
  source:
    'docs/inventario/04-tipografia.md (cores medidas) + decisão `fiel` na matriz de docs/inventario/README.md',
  trigger: 'redesign — quando a paleta deixar de ser paridade',
} as const

const contrast = (target: string): A11yException => ({
  id: 'color-contrast',
  target,
  ...PARIDADE,
})

export const A11Y_EXCEPTIONS: readonly A11yException[] = [
  // O menu desktop saiu daqui em 2026-09-02: com o fundo do cabeçalho na cor
  // medida (`#000000`, não o `#f8f8f8` de artefato de rasterização), `#24a2e0`
  // dá 7,31:1 e o axe deixa de reportar os quatro nós. Fecha quatro dos nove
  // nós de `D-21` sem tocar em cor nenhuma.

  // Corpo dos três destaques: #747d88 sobre #f0f0f0, 3.66:1. Seletor
  // atualizado de novo no bloco `paridade-espacamento-fontes` (2026-08-30,
  // Task 8): o card ganhou `p-[30px]` (padding medido contra a referência),
  // e o axe passou a incluir essa classe no `target` do mesmo nó — mesma
  // cor, mesmo nó, mesma razão de contraste, só o prefixo de classe mudou.
  contrast(
    '.p-\\[30px\\].text-center:nth-child(1) > .text-muted-ink.text-body.font-medium',
  ),
  contrast(
    '.p-\\[30px\\].text-center:nth-child(2) > .text-muted-ink.text-body.font-medium',
  ),
  contrast(
    '.p-\\[30px\\].text-center:nth-child(3) > .text-muted-ink.text-body.font-medium',
  ),
  // mailto da seção de contato: #2ea3f2 sobre #f0f0f0, 2.41:1.
  contrast('.text-link'),
  // Rodapé: #24a2e0 sobre #323232, 4.46:1. Só o nome da classe de tamanho
  // mudou na rodada de QA 2026-08-29 (`text-body` 16px -> `text-caption` 14px,
  // valor medido); a cor continua a medida do original —
  // `getComputedStyle(document.querySelector('#footer-info')).color` em
  // `https://lotusotec.cl/` devolve `rgb(36, 162, 224)` (review do bloco,
  // 2026-08-29). Ver `docs/qa/paridade/2026-08-29/classificacao.md`.
  // Entrada única: com `text-caption` no lugar de `text-body`, o axe passa a
  // reportar o mesmo nó por um seletor de classes só, igual nos cinco estados
  // — as duas entradas anteriores descreviam esse mesmo nó sob as duas ordens
  // de classe que a heurística do axe escolhia antes.
  contrast('.text-caption.text-brand.font-medium'),
]
