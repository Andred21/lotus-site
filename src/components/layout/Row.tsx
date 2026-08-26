import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type RowProps = {
  children: ReactNode
  className?: string
}

/**
 * Linha do layout. Reproduz a regra medida em `05-layout.md`: 80% da largura
 * do viewport enquanto isso couber em 1080px, margem lateral automática e
 * calha lateral zero — a calha vem da própria linha, não de padding.
 * O hero é exceção e não usa `Row`.
 */
export function Row({ children, className }: RowProps) {
  return (
    <div className={cn('mx-auto w-4/5 max-w-row', className)}>{children}</div>
  )
}
