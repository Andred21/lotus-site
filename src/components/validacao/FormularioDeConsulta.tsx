import { useState, type FormEvent } from 'react'
import { validacao } from '../../content/validacao'
import type { CampoDaConsulta } from '../../lib/certificado'
import { codigoValido } from '../../lib/codigo-de-registro'
import { rutValido } from '../../lib/rut'

export type EstadoDoFormulario = 'livre' | 'validando' | 'esperando'

// Classes copiadas do `FIELD_CLASS` e do botão "Enviar" do `ContactForm`
// (D3, P15): o mesmo desenho de linha inferior, sem tocar no formulário da
// home para ela não mudar.
const CLASSE_DO_CAMPO =
  'text-field font-sans text-accent-ink shadow-field h-[51px] w-full bg-transparent p-4'
const CLASSE_DO_BOTAO =
  'rounded-pill border-[5px] border-solid border-body-ink px-button-x py-button-y font-display text-button font-bold text-body-ink uppercase disabled:opacity-60'

const CAMPOS: readonly CampoDaConsulta[] = ['codigo', 'rut']

function texto(dados: FormData, campo: CampoDaConsulta): string {
  const valor = dados.get(campo)
  return typeof valor === 'string' ? valor.trim() : ''
}

/**
 * Formulário de N° de registro + RUT. Confere o formato antes de enviar e
 * entrega os valores só aparados: a normalização do código é da integração.
 * `noValidate`: a mensagem de erro é sempre a da página, em espanhol.
 */
export function FormularioDeConsulta({
  estado,
  errosDoServidor,
  aoEnviar,
}: {
  estado: EstadoDoFormulario
  errosDoServidor: CampoDaConsulta[]
  aoEnviar: (codigo: string, rut: string) => void
}) {
  const [errosLocais, setErrosLocais] = useState<CampoDaConsulta[]>([])

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Enter num campo também submete: o estado é conferido aqui, não só
    // pelo botão desativado.
    if (estado !== 'livre') return
    const dados = new FormData(event.currentTarget)
    const codigo = texto(dados, 'codigo')
    const rut = texto(dados, 'rut')
    const erros = CAMPOS.filter((campo) =>
      campo === 'codigo' ? !codigoValido(codigo) : !rutValido(rut),
    )
    setErrosLocais(erros)
    if (erros.length === 0) aoEnviar(codigo, rut)
  }

  return (
    <form noValidate onSubmit={enviar}>
      {CAMPOS.map((campo) => {
        const { rotulo, exemplo, erro } = validacao.campos[campo]
        const comErro =
          errosLocais.includes(campo) || errosDoServidor.includes(campo)
        const idExemplo = `${campo}-exemplo`
        const idErro = `${campo}-erro`
        return (
          <p key={campo} className="mb-4">
            <label htmlFor={campo} className="sr-only">
              {rotulo}
            </label>
            <input
              id={campo}
              name={campo}
              type="text"
              placeholder={rotulo}
              autoComplete="off"
              {...(campo === 'codigo'
                ? { autoCapitalize: 'characters', spellCheck: false }
                : {})}
              aria-invalid={comErro ? true : undefined}
              aria-describedby={comErro ? `${idExemplo} ${idErro}` : idExemplo}
              className={CLASSE_DO_CAMPO}
            />
            <span
              id={idExemplo}
              className="mt-1 block px-4 font-sans text-caption text-body-ink"
            >
              {exemplo}
            </span>
            {comErro ? (
              <span
                id={idErro}
                className="mt-1 block px-4 font-sans text-field text-danger"
              >
                {erro}
              </span>
            ) : null}
          </p>
        )
      })}

      <p className="text-right">
        <button
          type="submit"
          disabled={estado !== 'livre'}
          className={CLASSE_DO_BOTAO}
        >
          {estado === 'validando' ? validacao.validando : validacao.botao}
        </button>
      </p>
    </form>
  )
}
