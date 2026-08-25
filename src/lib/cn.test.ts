import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('junta classes e descarta os valores falsy', () => {
    expect(cn('a', undefined, null, false, 'c')).toBe('a c')
  })

  it('resolve conflito de utilitário Tailwind pela última classe', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
