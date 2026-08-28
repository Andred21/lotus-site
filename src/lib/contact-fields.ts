/**
 * Contrato de campo do formulário de contato, sem dependência nenhuma.
 * Existe separado do schema porque tem dois consumidores: o Zod de
 * `contact-schema.ts`, que valida, e `ContactForm`, que só precisa dos
 * atributos `required` e `maxLength` — e não importa Zod (D3 da spec).
 */
export const CONTACT_LIMITS = {
  nombre: { min: 2, max: 80 },
  email: { max: 254 },
  empresa: { max: 80 },
  mensaje: { min: 10, max: 2000 },
} as const

/**
 * Obrigatórios do clone. O formulário Divi original não marcava nenhum campo
 * como `required`; a divergência é decisão de João em 2026-08-27 (D4 da spec)
 * e está na matriz de paridade.
 */
export const CONTACT_REQUIRED_FIELDS: readonly string[] = [
  'nombre',
  'email',
  'mensaje',
]
