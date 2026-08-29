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
  // Menu desktop: #24a2e0 sobre #f8f8f8, 2.7:1 (só existe em 1440).
  contrast('.text-menu.font-semibold[href="/"]'),
  contrast('a[href$="#Somos"]'),
  contrast('a[href$="#Cursos"]'),
  contrast('a[href$="#Contacto"]'),
  // Corpo dos três destaques: #747d88 sobre #f0f0f0, 3.66:1. Seletor
  // atualizado na rodada de QA 2026-08-29: a classe de tamanho corrigiu de
  // `text-lead` (19px, errada) para `text-body` (16px, valor medido) —
  // mesma cor, mesmo nó, mesma razão de contraste; só o nome da classe mudou.
  contrast('.text-center:nth-child(1) > .text-muted-ink.text-body.font-medium'),
  contrast('.text-center:nth-child(2) > .text-muted-ink.text-body.font-medium'),
  contrast('.text-center:nth-child(3) > .text-muted-ink.text-body.font-medium'),
  // mailto da seção de contato: #2ea3f2 sobre #f0f0f0, 2.41:1.
  contrast('.text-link'),
  // Rodapé: #666666 sobre #323232, 2.23:1. Corrigido na rodada de QA
  // 2026-08-29: o rodapé usava `text-brand` (#24a2e0 azul, 4.46:1), mas essa
  // cor nunca foi a medida do original — é bug do Sprint 1 que esta exceção
  // acabou cristalizando. `docs/inventario/04-tipografia.md` já catalogava
  // `#666666` como "texto de corpo default" desde 2026-08-25; a medição
  // direta contra `https://lotusotec.cl/` em 2026-08-29 confirma
  // `getComputedStyle(...).color` = `rgb(102, 102, 102)` no nó do copyright.
  // Pior contraste que antes, mas mais fiel — ver
  // `docs/qa/paridade/2026-08-29/classificacao.md`.
  contrast('.text-neutral-ink'),
  // Mesmo nó do rodapé, segundo seletor: com o menu mobile aberto o axe
  // reordena as classes (a heurística escolhe a classe mais rara primeiro e o
  // DOM aberto muda essa contagem). Continua sendo um nó só, nomeado exato.
  contrast('.text-caption.text-neutral-ink.font-medium'),
]
