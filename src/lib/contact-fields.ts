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
export type ContactFieldName = keyof typeof CONTACT_LIMITS

export const CONTACT_REQUIRED_FIELDS = [
  'nombre',
  'email',
  'mensaje',
] as const satisfies readonly ContactFieldName[]

/**
 * `includes` de tupla `as const` recusa qualquer nome fora dela e obrigaria a
 * um cast; `some` compara uniões que se sobrepõem e mantém o tipo estreito.
 * Com `readonly string[]` a checagem não existia: qualquer string passava.
 */
export function isRequiredContactField(name: ContactFieldName): boolean {
  return CONTACT_REQUIRED_FIELDS.some((required) => required === name)
}
