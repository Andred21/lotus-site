import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('junta classes e descarta as condicionais falsas', () => {
    // eslint-disable-next-line no-constant-binary-expression
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('resolve conflito de utilitário Tailwind pela última classe', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
