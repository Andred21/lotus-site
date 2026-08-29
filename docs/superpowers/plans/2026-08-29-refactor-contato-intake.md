# Refactor do intake do contato — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Neste repositório o plano é auxiliar.** O bloco é `bounded`: `docs/superpowers/state.md` mantém
> `active_plan: null` e o artefato governante é
> `docs/superpowers/bounded-designs/refactor-contato-intake.md`. A execução entra por
> `/executar-site refactor-contato-intake`, não por dispatch livre de subagente.

**Goal:** Consolidar o intake do contato num módulo deep e fazer o contrato do resultado existir uma vez só, sem mudar nenhum comportamento observável.

**Architecture:** Hoje uma submissão atravessa `submit.ts` → `service.ts` → `sender.ts` → `web3forms.ts`, e a união do resultado está declarada duas vezes — em `service.ts` e restatada em `ContactForm.tsx`, porque o lint proíbe componente de importar integração. O refactor move a união para `src/lib/contact-schema.ts`, onde `ContactFieldErrors` já mora, e funde os três primeiros módulos em `src/integrations/contact/intake.ts`. Sobram dois módulos e um seam: o intake e o adapter do provedor.

**Tech Stack:** Vite 8, React 19, TypeScript 6 (`strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`), Zod 4, Vitest 4 + Testing Library, Playwright 1.62, ESLint 10 flat config, pnpm 11 sobre Node 24.19.0.

## Global Constraints

- Runtime: Node **24.19.0**. O shell padrão da máquina está em v22.23.1 e é recusado por `engineStrict` com `ERR_PNPM_UNSUPPORTED_ENGINE`. Todo comando `pnpm` deste plano roda depois de `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.19.0`.
- Branch: `refactor/contato-intake`. Commit direto em `main` é violação.
- Conventional Commits com escopo por assunto: `refactor(contato): …`. Não existe EAP no Notion para este trabalho.
- **Zero mudança de comportamento observável.** Payload enviado ao Web3Forms, textos em es-CL, estados acessíveis do formulário e pixels ficam idênticos.
- Zero dependência nova: `package.json` e `pnpm-lock.yaml` não podem aparecer no diff.
- `verbatimModuleSyntax` está ligado: todo import somente-tipo precisa da palavra `type`.
- `noUnusedLocals` e `noUnusedParameters` estão ligados: import órfão quebra `pnpm build`.
- `paths_autorizados` do bloco, gravados em `state.md`: `src/integrations/contact/**`, `src/lib/contact-schema.ts`, `src/components/sections/ContactForm.tsx`, `src/components/sections/ContactForm.test.tsx`, `src/app/App.tsx`, `eslint.config.js`, `CONTEXT.md`, `docs/adr/ADR-SITE-003.md`, `docs/superpowers/bounded-designs/refactor-contato-intake.md`. Arquivo fora disso não é tocado.
- `src/components/sections/Contacto.tsx` e `Contacto.test.tsx` **não** são tocados: importam `ContactSubmitHandler` de `./ContactForm`, que continua existindo com o mesmo nome.

## File Structure

| Arquivo                                   | Responsabilidade depois do refactor                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/lib/contact-schema.ts`               | Contrato de dados do contato: entrada, mensagem, erros por campo e **resultado da submissão**. Único executor do Zod. |
| `src/lib/contact-fields.ts`               | Limites e obrigatoriedade dos campos, sem dependência. **Não muda.**                                                  |
| `src/integrations/contact/intake.ts`      | **Novo.** Lê `FormData`, valida pelo schema, delega à porta. Declara a porta `ContactSender` e a implementação nula.  |
| `src/integrations/contact/web3forms.ts`   | Adapter do provedor. Único `fetch` do repositório. Passa a importar a porta de `./intake`.                            |
| `src/integrations/contact/submit.ts`      | **Apagado.** Absorvido pelo intake.                                                                                   |
| `src/integrations/contact/service.ts`     | **Apagado.** Absorvido pelo intake.                                                                                   |
| `src/integrations/contact/sender.ts`      | **Apagado.** Absorvido pelo intake.                                                                                   |
| `src/components/sections/ContactForm.tsx` | Formulário. Importa a união de `lib` em vez de restatá-la.                                                            |
| `src/app/App.tsx`                         | Única ligação componente × integração. Passa de quatro imports para dois.                                             |
| `eslint.config.js`                        | Catraca de direção de dependências. Ganha a proibição de Zod em componente.                                           |
| `CONTEXT.md`                              | **Novo.** Glossário mínimo: Contact intake, porta, adapter.                                                           |
| `docs/adr/ADR-SITE-003.md`                | **Novo.** Registra que os aceites `4.1.3`/`4.1.4`/`4.1.5` são propriedades, não layout de arquivo.                    |

---

### Task 1: Contrato do contato numa declaração só

Corresponde ao candidato **B** da revisão de arquitetura e ao commit 1 do bounded design.

**Files:**

- Modify: `src/lib/contact-schema.ts` (acrescenta `ContactSubmitResult` depois da linha 29)
- Modify: `src/components/sections/ContactForm.tsx:1-27,79`
- Modify: `src/components/sections/ContactForm.test.tsx:8-15`
- Modify: `src/integrations/contact/service.ts:1-15`
- Modify: `eslint.config.js:63-77`

**Interfaces:**

- Consumes: `ContactFieldErrors` de `src/lib/contact-schema.ts:25`, que já existe.
- Produces: `ContactSubmitResult`, exportado de `src/lib/contact-schema.ts`. A Task 2 depende
  desse nome e desse caminho. Forma exata:
  `{ status: 'sent' } | { status: 'invalid'; fieldErrors: ContactFieldErrors } | { status: 'failed' }`.
  `ContactSubmitHandler` continua exportado de `src/components/sections/ContactForm.tsx` com a
  assinatura `(formData: FormData) => Promise<ContactSubmitResult>`.

- [ ] **Step 1: Escrever o teste que falha — o componente consome a união de `lib`**

Este teste falha hoje porque `ContactSubmitResult` não existe em `lib`. Substitua o bloco de
import de `src/components/sections/ContactForm.test.tsx:8-15` por:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { site } from '../../content/site'
import { CONTACT_LIMITS } from '../../lib/contact-fields'
import type { ContactSubmitResult } from '../../lib/contact-schema'
import { ContactForm, type ContactSubmitHandler } from './ContactForm'
```

A linha 8 é o import do `vitest` e **precisa continuar existindo** — o bloco acima já a inclui.
As linhas 1 a 7, do `@testing-library/react`, não são tocadas.

Depois troque as duas ocorrências do tipo antigo no corpo do arquivo. Em
`ContactForm.test.tsx:189`:

```tsx
const pending: Array<(outcome: ContactSubmitResult) => void> = []
```

E em `ContactForm.test.tsx:192`:

```tsx
new Promise<ContactSubmitResult>((resolve) => {
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.19.0
pnpm exec tsc -b
```

Esperado: FAIL. `tsc` reporta que `contact-schema` não exporta `ContactSubmitResult`:
`error TS2305: Module '"../../lib/contact-schema"' has no exported member 'ContactSubmitResult'.`

- [ ] **Step 3: Declarar a união em `src/lib/contact-schema.ts`**

Insira logo depois de `ContactParseResult` (hoje linha 29), antes do bloco `const MESSAGES`:

```ts
/**
 * Resultado que a UI enxerga. `failed` é genérico de propósito: o motivo da
 * falha do provedor não vira texto de tela (aceite da 4.1.9). Vive aqui, e
 * não em `src/integrations/`, porque componente e integração precisam do
 * mesmo contrato e `eslint.config.js` proíbe o componente de importar
 * integração — inclusive tipo. `ContactFieldErrors`, o payload do caso
 * `invalid`, já morava neste módulo.
 */
export type ContactSubmitResult =
  | { status: 'sent' }
  | { status: 'invalid'; fieldErrors: ContactFieldErrors }
  | { status: 'failed' }
```

- [ ] **Step 4: Apagar a declaração restatada no componente**

Em `src/components/sections/ContactForm.tsx`, substitua o bloco das linhas 1 a 27 por:

```tsx
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { site } from '../../content/site'
import { cn } from '../../lib/cn'
import {
  CONTACT_LIMITS,
  isRequiredContactField,
} from '../../lib/contact-fields'
import type { ContactSubmitResult } from '../../lib/contact-schema'

/**
 * A união do resultado vem de `src/lib/`, não de `src/integrations/`:
 * `eslint.config.js:63-77` proíbe o componente de importar integração,
 * inclusive tipo, e `lib` é o módulo que os dois lados podem ver. A ligação
 * entre formulário e intake acontece em `src/app/App.tsx`, o único lugar
 * autorizado a conhecer os dois lados.
 */
export type ContactSubmitHandler = (
  formData: FormData,
) => Promise<ContactSubmitResult>

type ContactFormProps = {
  onSubmit: ContactSubmitHandler
}
```

Em `ContactForm.tsx:79`, dentro de `handleSubmit`, troque o tipo da variável:

```tsx
let result: ContactSubmitResult
```

- [ ] **Step 5: Reexportar do serviço para não quebrar a Task 2 antes da hora**

Em `src/integrations/contact/service.ts`, substitua as linhas 1 a 19 por:

```ts
import {
  parseContactMessage,
  type ContactFormInput,
  type ContactSubmitResult,
} from '../../lib/contact-schema'
import type { ContactSender } from './sender'

export type { ContactSubmitResult }

export type ContactService = (
  input: ContactFormInput,
) => Promise<ContactSubmitResult>
```

Isso apaga a segunda declaração da união sem tocar em `submit.ts`, que importa
`ContactSubmitResult` de `./service`. A Task 2 apaga o arquivo inteiro.

- [ ] **Step 6: Fechar a catraca — componente não importa Zod**

Em `eslint.config.js`, no bloco `files: ['src/components/**/*.{ts,tsx}']`, o array `patterns` da
regra `no-restricted-imports` hoje tem uma entrada só. Acrescente a segunda, mantendo a primeira:

```js
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/integrations/**'],
              message:
                'integração entra por prop/callback a partir da composição.',
            },
            {
              group: ['zod', 'zod/*'],
              message:
                'componente não importa Zod; a validação vive em src/lib/ e o componente vê só o resultado.',
            },
          ],
        },
      ],
```

Atenção: é **a mesma** entrada de regra. Declarar `no-restricted-imports` uma segunda vez no
mesmo objeto de config sobrescreve a primeira e derruba a proibição de `integrations`.

- [ ] **Step 7: Provar que a catraca reprova de verdade**

Teste de mutação com a árvore restaurada depois. Acrescente temporariamente ao topo de
`src/components/sections/ContactForm.tsx`:

```tsx
import { z } from 'zod'
```

Rode:

```bash
pnpm lint
```

Esperado: FAIL, com a mensagem `componente não importa Zod; a validação vive em src/lib/ e o
componente vê só o resultado.` Remova o import e rode de novo:

```bash
pnpm lint
```

Esperado: exit 0, sem saída de erro.

- [ ] **Step 8: Rodar os gates**

```bash
pnpm check
```

Esperado: exit 0. `agent:check` OK, `format:check` limpo, `lint` limpo, `tsc -b` sem erro,
Vitest com todos os testes passando e `vite build` verde. A contagem de testes não muda nesta
task: nenhum teste foi criado nem removido.

- [ ] **Step 9: Commit**

```bash
git add src/lib/contact-schema.ts src/components/sections/ContactForm.tsx \
  src/components/sections/ContactForm.test.tsx \
  src/integrations/contact/service.ts eslint.config.js
git commit -m "refactor(contato): unificar o contrato do contato em lib"
```

---

### Task 2: Um módulo de intake no lugar de três fábricas rasas

Corresponde ao candidato **A** da revisão de arquitetura e ao commit 2 do bounded design.

**Files:**

- Create: `src/integrations/contact/intake.ts`
- Create: `src/integrations/contact/intake.test.ts`
- Create: `CONTEXT.md`
- Create: `docs/adr/ADR-SITE-003.md`
- Delete: `src/integrations/contact/submit.ts`, `submit.test.ts`, `service.ts`, `service.test.ts`, `sender.ts`, `sender.test.ts`
- Modify: `src/integrations/contact/web3forms.ts:3`
- Modify: `src/app/App.tsx:1-22`

**Interfaces:**

- Consumes: `ContactSubmitResult`, `ContactFormInput`, `ContactMessage` e `parseContactMessage` de
  `src/lib/contact-schema.ts`. `ContactSubmitResult` foi produzido pela Task 1.
- Produces: de `src/integrations/contact/intake.ts` — o tipo
  `ContactSender = (message: ContactMessage) => Promise<ContactSendOutcome>`, o tipo
  `ContactSendOutcome = { status: 'sent' } | { status: 'failed' }`, a constante
  `unavailableContactSender: ContactSender`, o tipo
  `ContactIntake = (formData: FormData) => Promise<ContactSubmitResult>` e a função
  `createContactIntake(send: ContactSender): ContactIntake`.
  `readContactFormData` **não** é exportada.

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/integrations/contact/intake.test.ts` com o conteúdo abaixo. Ele reúne os sete casos de
`service.test.ts`, o caso de `sender.test.ts` e os três de `readContactFormData` reescritos via a
interface — o `FormData` incompleto e o valor não-textual passam a ser provados pelo resultado que
produzem, não pela função interna.

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createContactIntake,
  unavailableContactSender,
  type ContactSender,
} from './intake'

const VALID = {
  nombre: '  Ana Pérez  ',
  email: 'ANA@Lotusotec.CL',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  botcheck: '',
}

function formDataOf(entries: Record<string, string>) {
  const formData = new FormData()
  for (const [name, value] of Object.entries(entries)) {
    formData.append(name, value)
  }
  return formData
}

function fakeSender() {
  return vi.fn<ContactSender>(() => Promise.resolve({ status: 'sent' }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createContactIntake', () => {
  it('entrega à porta a mensagem já normalizada, sem o honeypot', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(formDataOf(VALID))

    expect(result).toEqual({ status: 'sent' })
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0]?.[0]).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: 'Lotus',
      mensaje: 'Necesito información sobre el curso de alta tensión.',
    })
  })

  it('devolve invalid com erro por campo e não chama a porta', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(
      formDataOf({ ...VALID, email: 'no-es-un-correo' }),
    )

    if (result.status !== 'invalid') throw new Error('esperava invalid')
    expect(result.fieldErrors.email).toBe(
      'Ingrese un correo electrónico válido.',
    )
    expect(send).not.toHaveBeenCalled()
  })

  it('repassa a falha da porta como failed genérico', async () => {
    const send = vi.fn<ContactSender>(() =>
      Promise.resolve({ status: 'failed' }),
    )

    expect(await createContactIntake(send)(formDataOf(VALID))).toEqual({
      status: 'failed',
    })
  })

  it('converte exceção da porta em failed, sem vazar o erro', async () => {
    const send = vi.fn<ContactSender>(() =>
      Promise.reject(new Error('web3forms: 503 Service Unavailable')),
    )

    expect(await createContactIntake(send)(formDataOf(VALID))).toEqual({
      status: 'failed',
    })
  })

  it('rejeita o bot antes da rede: a porta não é chamada', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(
      formDataOf({ ...VALID, botcheck: 'http://spam.example' }),
    )

    if (result.status !== 'invalid') throw new Error('esperava invalid')
    expect(result.fieldErrors.botcheck).toBe('No pudimos validar el envío.')
    expect(send).not.toHaveBeenCalled()
  })

  it('rejeita payload excessivo antes da rede: a porta não é chamada', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(
      formDataOf({ ...VALID, mensaje: 'a'.repeat(2001) }),
    )

    expect(result.status).toBe('invalid')
    expect(send).not.toHaveBeenCalled()
  })

  it('não cobra nada do envio normal: um payload válido chama a porta uma vez', async () => {
    const send = fakeSender()

    await createContactIntake(send)(formDataOf(VALID))

    expect(send).toHaveBeenCalledTimes(1)
  })

  it('trata formulário vazio como campo vazio e reprova no schema, sem tocar a porta', async () => {
    const send = fakeSender()
    const intake = createContactIntake(send)

    const result = await intake(new FormData())

    if (result.status !== 'invalid') throw new Error('esperava invalid')
    expect(result.fieldErrors.nombre).toBe('Ingrese su nombre completo.')
    expect(result.fieldErrors.email).toBe(
      'Ingrese un correo electrónico válido.',
    )
    expect(send).not.toHaveBeenCalled()
  })

  it('ignora valor que não é texto: campo vira vazio e reprova no schema', async () => {
    const send = fakeSender()
    const formData = formDataOf(VALID)
    formData.set('nombre', new File(['x'], 'ataque.txt'))

    const result = await createContactIntake(send)(formData)

    if (result.status !== 'invalid') throw new Error('esperava invalid')
    expect(result.fieldErrors.nombre).toBe('Ingrese su nombre completo.')
    expect(send).not.toHaveBeenCalled()
  })
})

describe('unavailableContactSender', () => {
  it('falha sem tocar a rede quando não há provedor configurado', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const outcome = await unavailableContactSender({
      nombre: 'Ana Pérez',
      email: 'ana@lotusotec.cl',
      empresa: '',
      mensaje: 'Necesito información.',
    })

    expect(outcome).toEqual({ status: 'failed' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.19.0
pnpm exec vitest run src/integrations/contact/intake.test.ts
```

Esperado: FAIL no carregamento do arquivo, com
`Failed to load url ./intake` — o módulo ainda não existe.

- [ ] **Step 3: Criar `src/integrations/contact/intake.ts`**

```ts
import {
  parseContactMessage,
  type ContactFormInput,
  type ContactMessage,
  type ContactSubmitResult,
} from '../../lib/contact-schema'

/**
 * Resultado da tentativa de entrega. Nenhum detalhe do provedor cruza esta
 * linha: mensagem de erro, código HTTP e corpo da resposta morrem no adapter.
 */
export type ContactSendOutcome = { status: 'sent' } | { status: 'failed' }

/**
 * Porta de saída do contato. O intake depende deste tipo; o adapter do
 * provedor é detalhe substituível (aceite da 4.1.5). O tipo mora aqui, junto
 * de quem o chama, e o adapter o importa deste módulo — é a direção canônica
 * de ports & adapters.
 */
export type ContactSender = (
  message: ContactMessage,
) => Promise<ContactSendOutcome>

/**
 * Implementação nula: sem chave configurada, o envio falha de forma visível
 * em vez de simular sucesso (D7 da spec do bloco 4.1.1-4.1.10). Não é código
 * descartável — é o caminho real de um build publicado sem
 * `VITE_WEB3FORMS_ACCESS_KEY`.
 */
export const unavailableContactSender: ContactSender = () =>
  Promise.resolve({ status: 'failed' })

export type ContactIntake = (formData: FormData) => Promise<ContactSubmitResult>

/**
 * Lê o payload cru do formulário. Campo ausente ou não-textual vira string
 * vazia: quem decide se isso é erro é o schema, não esta função. Privada de
 * propósito — a interface do intake é a superfície de teste, e é por ela que
 * "campo ausente vira vazio" fica provado.
 */
function readContactFormData(formData: FormData): ContactFormInput {
  const read = (name: string): string => {
    const value = formData.get(name)
    return typeof value === 'string' ? value : ''
  }

  return {
    nombre: read('nombre'),
    email: read('email'),
    empresa: read('empresa'),
    mensaje: read('mensaje'),
    botcheck: read('botcheck'),
  }
}

/**
 * Entrada única de submissão do contato. É o que o SPA tem no lugar da Server
 * Action da EAP (D1 da spec do bloco 4.1.1-4.1.10): tudo passa por aqui antes
 * de qualquer rede. Lê o formulário, normaliza e valida pelo schema de
 * `src/lib/`, e só então delega à porta — não conhece o provedor (aceites da
 * 4.1.3 e da 4.1.4). É o único executor do schema no repositório.
 */
export function createContactIntake(send: ContactSender): ContactIntake {
  return async (formData) => {
    const parsed = parseContactMessage(readContactFormData(formData))

    if (!parsed.ok) {
      return { status: 'invalid', fieldErrors: parsed.fieldErrors }
    }

    try {
      return await send(parsed.value)
    } catch {
      return { status: 'failed' }
    }
  }
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
pnpm exec vitest run src/integrations/contact/intake.test.ts
```

Esperado: PASS, 10 testes (`createContactIntake` com 9, `unavailableContactSender` com 1).

- [ ] **Step 5: Apontar o adapter para a porta no novo módulo**

Em `src/integrations/contact/web3forms.ts`, linha 3, troque o caminho do import:

```ts
import type { ContactSender } from './intake'
```

As linhas 1 e 2 (`import { z } from 'zod'` e
`import type { ContactMessage } from '../../lib/contact-schema'`) ficam como estão.

- [ ] **Step 6: Refazer a fiação em `src/app/App.tsx`**

Substitua as linhas 1 a 22 por:

```tsx
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Hero } from '../components/sections/Hero'
import { Contacto } from '../components/sections/Contacto'
import { Cursos } from '../components/sections/Cursos'
import { Destaques } from '../components/sections/Destaques'
import { QuienesSomos } from '../components/sections/QuienesSomos'
import {
  createContactIntake,
  unavailableContactSender,
} from '../integrations/contact/intake'
import { createWeb3FormsSender } from '../integrations/contact/web3forms'

// Única ligação entre componente e integração no repositório. Sem chave
// configurada o envio falha de forma visível, sem simular sucesso (D7 da
// spec); a seção já publica contacto@lotusotec.cl como saída alternativa.
const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY
const contactSender = accessKey
  ? createWeb3FormsSender(accessKey)
  : unavailableContactSender
const submitContact = createContactIntake(contactSender)
```

O corpo do componente `App` (hoje linhas 24 a 40) não muda.

- [ ] **Step 7: Apagar os três módulos absorvidos e seus testes**

```bash
git rm src/integrations/contact/submit.ts src/integrations/contact/submit.test.ts \
  src/integrations/contact/service.ts src/integrations/contact/service.test.ts \
  src/integrations/contact/sender.ts src/integrations/contact/sender.test.ts
```

- [ ] **Step 8: Rodar typecheck e a suíte inteira**

```bash
pnpm exec tsc -b && pnpm exec vitest run
```

Esperado: `tsc` sem erro e Vitest verde. A contagem total de testes cai em **2**: saíram 12 casos
(3 de `readContactFormData`, 1 de `createContactFormSubmit`, 7 de `createContactService`, 1 de
`unavailableContactSender`) e entraram 10 em `intake.test.ts`. Os dois que somem:

1. a delegação pura de `createContactFormSubmit` — delegação deixou de ser uma aresta;
2. `readContactFormData` "lê os cinco campos" — passou a ser provado pelo caso de normalização,
   que já verifica os quatro campos entregues à porta e o honeypot descartado.

Os outros dois casos de `readContactFormData` sobrevivem reescritos: formulário vazio e valor
não-textual.

- [ ] **Step 9: Criar `CONTEXT.md`**

```markdown
# CONTEXT.md — vocabulário do lotus-site

Glossário de domínio. Termo entra aqui quando o código passa a usá-lo como conceito próprio, não
antes.

## Contact intake

O módulo `src/integrations/contact/intake.ts`. Recebe a submissão crua do formulário como
`FormData`, normaliza, valida pelo schema de `src/lib/contact-schema.ts` e entrega à porta.
Devolve `sent`, `invalid` com erro por campo, ou `failed` genérico. É o único executor do schema
no repositório e não conhece o provedor.

## Porta

O tipo `ContactSender`, declarado pelo Contact intake. Descreve o que o intake precisa de um
serviço de entrega — receber uma `ContactMessage` e responder `sent` ou `failed` — sem dizer quem
entrega. A feature depende da porta, nunca do adapter.

## Adapter

A implementação concreta de uma porta contra um provedor externo.
`createWeb3FormsSender` em `src/integrations/contact/web3forms.ts` é o único do repositório, e o
único lugar com `fetch`. Detalhe do provedor — código HTTP, corpo da resposta, mensagem de erro —
morre dentro dele: quem chama recebe `sent` ou `failed`, nada mais.
```

- [ ] **Step 10: Criar `docs/adr/ADR-SITE-003.md`**

```markdown
# ADR-SITE-003 · O intake do contato é um módulo, não quatro

- **Status:** aceito
- **Data:** 2026-08-29
- **Escopo:** bloco `refactor-contato-intake`

## Contexto

O bloco `4.1.1`–`4.1.10` entregou o envio do formulário em quatro módulos:
`submit.ts`, `service.ts`, `sender.ts` e `web3forms.ts`. Três eram shallow — a interface custava
quase o mesmo que a implementação. `sender.ts` tinha 23 linhas: dois tipos e um
`Promise.resolve`. A revisão de arquitetura de 2026-08-29 mediu isso e o
`deletion test` respondeu "concentra" para os três.

O plano daquele bloco
(`docs/superpowers/plans/2026-08-27-4.1.1-4.1.10-formulario-integracoes.md:363-771`) prescreve
essa separação arquivo a arquivo. Plano é artefato fechado de bloco fechado, não catraca.

## Decisão

Os aceites das EAP `4.1.3`, `4.1.4` e `4.1.5` são **propriedades**, não layout de arquivo. O texto
está em `docs/superpowers/specs/2026-08-27-4.1.1-4.1.10-formulario-integracoes-design.md:160-166`:

- `4.1.3` — a entrada normaliza e valida antes de qualquer chamada de rede e não conhece o provedor.
- `4.1.4` — o serviço roda inteiro contra uma porta fake.
- `4.1.5` — a feature depende da porta, não do adapter; nenhum tipo do provedor vaza.

`src/integrations/contact/intake.ts` preserva as três: valida antes de qualquer rede, roda inteiro
contra um `ContactSender` falso em `intake.test.ts`, e depende do tipo da porta que ele mesmo
declara — nunca de `createWeb3FormsSender`. O adapter importa a porta do núcleo, que é a direção
canônica de ports & adapters.

## Consequências

Uma submissão passa a atravessar dois módulos em vez de quatro, e o contrato do resultado
(`ContactSubmitResult`) existe uma vez, em `src/lib/contact-schema.ts`, onde componente e
integração podem vê-lo sem violar a catraca de direção de dependências.

`readContactFormData` deixou de ser exportada: a interface do intake é a superfície de teste.
"Campo ausente vira string vazia" continua provado — agora pelo resultado que produz.

**Este ADR existe para que a próxima revisão de arquitetura não leia o plano de `4.1.x`, veja a
separação prescrita e proponha re-separar.** Trocar de provedor continua sendo trabalho de um
arquivo só: escrever outro adapter e mudar a linha de composição em `src/app/App.tsx`.
```

- [ ] **Step 11: Rodar os gates completos**

```bash
pnpm check
```

Esperado: exit 0.

```bash
pnpm e2e
```

Esperado: exit 0. `e2e/contacto.spec.ts` intercepta `https://api.web3forms.com/**` e prova que o
payload enviado ao provedor — `access_key`, `name`, `message` — não mudou, além dos caminhos de
sucesso, inválido e falha. É a prova mais forte de que o comportamento é o mesmo.

Se o Playwright reclamar de browser ausente, instale antes:
`pnpm exec playwright install --with-deps chromium firefox webkit`.

- [ ] **Step 12: Confirmar que nenhuma dependência entrou**

```bash
git diff --name-only main..HEAD -- package.json pnpm-lock.yaml
```

Esperado: saída vazia.

- [ ] **Step 13: Commit**

```bash
git add src/integrations/contact/intake.ts src/integrations/contact/intake.test.ts \
  src/integrations/contact/web3forms.ts src/app/App.tsx \
  CONTEXT.md docs/adr/ADR-SITE-003.md
git commit -m "refactor(contato): consolidar o intake do contato num módulo"
```

Os seis arquivos apagados já estão no índice pelo `git rm` do Step 7 e entram neste commit.

---

## Verificação de aceite do bloco

Antes de `/revisar-site`, prove cada linha com saída real:

| Critério                                  | Prova                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| Contrato do contato declarado uma vez     | `grep -rn "status: 'invalid'" src/` acha só `contact-schema.ts` e `intake.ts`           |
| `readContactFormData` privada             | `grep -rn "export function readContactFormData" src/` devolve vazio                     |
| Componente não importa integração nem Zod | `pnpm lint` exit 0, mais o teste de mutação do Step 7 da Task 1                         |
| Comportamento inalterado                  | `pnpm e2e` exit 0, com `contacto.spec.ts` verde nos cinco projetos                      |
| Zero dependência nova                     | `git diff --name-only main..HEAD -- package.json pnpm-lock.yaml` vazio                  |
| Zero pixel                                | `src/index.css` fora do diff; `e2e/regressao-visual.spec.ts` verde dentro de `pnpm e2e` |
| Gates                                     | `pnpm check` exit 0                                                                     |

## Fora de escopo

Candidatos C, D e E da revisão de arquitetura de 2026-08-29 — o módulo de captura de estados do
Playwright (`scripts/qa/`), a coexistência de `rgbToHex` e `cssColor` em
`scripts/inventario/lib/site.mjs`, e o glossário completo de vocabulário. C foi a recomendação
principal do relatório e continua aberta.
