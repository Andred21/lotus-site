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
  // Corpo dos três destaques: #747d88 sobre #f0f0f0, 3.66:1.
  contrast('.text-center:nth-child(1) > .text-muted-ink.text-lead.font-medium'),
  contrast('.text-center:nth-child(2) > .text-muted-ink.text-lead.font-medium'),
  contrast('.text-center:nth-child(3) > .text-muted-ink.text-lead.font-medium'),
  // mailto da seção de contato: #2ea3f2 sobre #f0f0f0, 2.41:1.
  contrast('.text-link'),
  // Rodapé: #24a2e0 sobre #323232, 4.46:1.
  contrast('.w-4\\/5.max-w-row.mx-auto > .text-body.text-brand.font-medium'),
  // Mesmo nó do rodapé, segundo seletor: com o menu mobile aberto o axe
  // reordena as classes (a heurística escolhe a classe mais rara primeiro e o
  // DOM aberto muda essa contagem). Continua sendo um nó só, nomeado exato.
  contrast('.max-w-row.w-4\\/5.mx-auto > .text-body.text-brand.font-medium'),
]
