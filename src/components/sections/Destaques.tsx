import { Medal, ShieldUser, Zap } from 'lucide-react'
import { site } from '../../content/site'
import { Row } from '../layout/Row'

/**
 * Segunda linha de `#Somos`: três destaques em colunas de 320px.
 * Os ícones do original são glifos da fonte ETmodules do tema Divi, que não
 * acompanham o clone; entram os equivalentes de `lucide-react`, já
 * dependência do projeto. Divergência intencional registrada na matriz.
 */
const ICONS = [Zap, ShieldUser, Medal]

export function Destaques() {
  return (
    <Row className="grid gap-gutter py-[25px] desktop:grid-cols-3">
      {site.destaques.map((destaque, index) => {
        const Icon = ICONS[index] ?? Zap
        return (
          <div key={destaque.label} className="text-center">
            <Icon aria-hidden size={48} className="mx-auto text-brand" />
            <h4 className="mt-4 font-display text-highlight font-bold text-accent-ink">
              {destaque.label}
            </h4>
            <p className="font-sans text-lead font-medium text-muted-ink">
              {destaque.body}
            </p>
          </div>
        )
      })}
    </Row>
  )
}
