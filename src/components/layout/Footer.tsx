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
        paddingTop 0 e paddingBottom 10px na referência, contra 0/0 no clone.
        O padding é assimétrico na referência e é reproduzido como está: o
        `py-1.25` simétrico anterior somava a mesma altura total com 5px em
        cima que nenhuma linha de medição sustenta (achado C-1 da review).
      */}
      <Row className="pb-2.5">
        <p className="font-sans text-caption font-medium text-brand">
          {site.footer.copyright}
        </p>
      </Row>
    </footer>
  )
}
