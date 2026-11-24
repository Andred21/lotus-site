import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { ValidacaoCertificado } from '../components/validacao/ValidacaoCertificado'
import {
  createCertificadosApi,
  URL_PADRAO_DA_API,
} from '../integrations/certificados/api-certificados'
import { lerModo } from '../lib/modo-da-validacao'

// Ligação entre a página e a integração, no nível do módulo como o `App`
// faz com o Turnstile. Produção não define a variável (D10). O caminho é lido
// uma vez: sem router nem `history.pushState` (D6, D8).
const api = createCertificadosApi(
  import.meta.env.VITE_CERTIFICADOS_API_URL || URL_PADRAO_DA_API,
)
const modo = lerModo(window.location.pathname)

export function ValidarApp() {
  return (
    // A página é curta: sem a coluna flexível, sobra faixa branca abaixo do
    // rodapé em telas altas. A faixa preta cresce até ele.
    <div className="flex min-h-dvh flex-col">
      <Header atual="/validar" />
      <main className="flex grow flex-col pt-header-offset desktop:pt-header-desktop">
        <ValidacaoCertificado
          modo={modo}
          consultarPorUuid={api.porUuid}
          consultarPorCodigo={api.porCodigo}
          baixarPdf={api.pdf}
        />
      </main>
      <Footer />
    </div>
  )
}
