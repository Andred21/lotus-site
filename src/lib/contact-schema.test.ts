import { describe, expect, it } from 'vitest'
import { CONTACT_REQUIRED_FIELDS } from './contact-fields'
import {
  normalizeContactInput,
  parseContactMessage,
  type ContactFormInput,
} from './contact-schema'

const VALID: ContactFormInput = {
  nombre: 'Ana Pérez',
  email: 'ANA@Lotusotec.CL',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  botcheck: '',
}

describe('normalizeContactInput', () => {
  it('apara os campos e baixa a caixa do correo', () => {
    expect(
      normalizeContactInput({ ...VALID, nombre: '  Ana Pérez  ' }),
    ).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: 'Lotus',
      mensaje: 'Necesito información sobre el curso de alta tensión.',
      botcheck: '',
    })
  })
})

describe('parseContactMessage', () => {
  it('aceita entrada válida e devolve o valor normalizado, sem o honeypot', () => {
    const result = parseContactMessage({
      ...VALID,
      mensaje: '  Hola, quiero información.  ',
    })

    if (!result.ok) throw new Error('esperava entrada válida')
    expect(result.value).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: 'Lotus',
      mensaje: 'Hola, quiero información.',
    })
    expect('botcheck' in result.value).toBe(false)
  })

  it('exige nombre, email e mensaje; empresa fica opcional', () => {
    expect(parseContactMessage({ ...VALID, nombre: '' }).ok).toBe(false)
    expect(parseContactMessage({ ...VALID, email: '' }).ok).toBe(false)
    expect(parseContactMessage({ ...VALID, mensaje: '' }).ok).toBe(false)
    expect(parseContactMessage({ ...VALID, empresa: '' }).ok).toBe(true)
  })

  it('declara os mesmos obrigatórios que o formulário marca', () => {
    expect(CONTACT_REQUIRED_FIELDS).toEqual(['nombre', 'email', 'mensaje'])
  })

  it('devolve erro estruturado por campo, em es-CL', () => {
    const result = parseContactMessage({
      ...VALID,
      nombre: 'A',
      email: 'no-es-un-correo',
      mensaje: 'corto',
    })

    if (result.ok) throw new Error('esperava entrada inválida')
    expect(result.fieldErrors.nombre).toBe('Ingrese su nombre completo.')
    expect(result.fieldErrors.email).toBe(
      'Ingrese un correo electrónico válido.',
    )
    expect(result.fieldErrors.mensaje).toBe(
      'Escriba su mensaje con al menos 10 caracteres.',
    )
    expect(result.fieldErrors.empresa).toBe(undefined)
  })

  it('não deixa espaço em branco satisfazer o mínimo', () => {
    const result = parseContactMessage({ ...VALID, mensaje: '            ' })

    if (result.ok) throw new Error('esperava entrada inválida')
    expect(result.fieldErrors.mensaje).toBe(
      'Escriba su mensaje con al menos 10 caracteres.',
    )
  })

  it('rejeita o que passa dos limites e aceita o limite exato', () => {
    expect(parseContactMessage({ ...VALID, nombre: 'a'.repeat(81) }).ok).toBe(
      false,
    )
    expect(parseContactMessage({ ...VALID, empresa: 'a'.repeat(81) }).ok).toBe(
      false,
    )
    expect(
      parseContactMessage({ ...VALID, mensaje: 'a'.repeat(2001) }).ok,
    ).toBe(false)
    expect(
      parseContactMessage({ ...VALID, mensaje: 'a'.repeat(2000) }).ok,
    ).toBe(true)
  })

  it('rejeita quando o honeypot vem preenchido', () => {
    const result = parseContactMessage({
      ...VALID,
      botcheck: 'http://spam.example',
    })

    if (result.ok) throw new Error('esperava rejeição do honeypot')
    expect(result.fieldErrors.botcheck).toBe('No pudimos validar el envío.')
  })
})
