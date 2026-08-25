import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Junta classes condicionais e resolve conflito entre utilitários Tailwind,
 * mantendo a última classe vencedora.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
