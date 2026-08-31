import { site } from '../../content/site'
import { Row } from './Row'

/**
 * Rodapé. O ano `2022` é o publicado no site e fica como está: gerar o ano
 * pelo relógio seria conteúdo novo, e o aceite da EAP condiciona isso a
 * aprovação que não foi dada.
 */
export function Footer() {
  return (
    <footer className="bg-footer pt-[15px] pb-1.25">
      {/*
        docs/qa/paridade/2026-08-30/espacamento.md: `rodape.copyright` tem
        paddingBottom 10px na referência contra 0 no clone. 5px em cima e
        embaixo soma o mesmo total, valor simétrico do plano.
      */}
      <Row className="py-1.25">
        <p className="font-sans text-caption font-medium text-brand">
          {site.footer.copyright}
        </p>
      </Row>
    </footer>
  )
}
