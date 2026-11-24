import { describe, expect, it } from 'vitest'
import { formatarDataCivil, formatarInstante } from './datas'

describe('formatarDataCivil', () => {
  it('formata a data civil sem deslocar o dia', () => {
    expect(formatarDataCivil('2026-08-12')).toBe('12 de agosto de 2026')
    expect(formatarDataCivil('2026-01-01')).toBe('1 de enero de 2026')
  })
})

describe('formatarInstante', () => {
  it('aceita microssegundos', () => {
    expect(formatarInstante('2026-08-05T14:30:00.000000Z')).toBe(
      '5 de agosto de 2026',
    )
  })
  it('usa a data de Santiago', () => {
    expect(formatarInstante('2026-10-05T02:30:00.000000Z')).toBe(
      '4 de octubre de 2026',
    )
    expect(formatarInstante('2026-10-05T02:30:00Z')).toBe(
      '4 de octubre de 2026',
    )
  })
})
