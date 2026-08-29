# Bounded design — `refactor-contato-intake`

- **Origem:** revisão de arquitetura de 2026-08-29 (candidatos A e B), grilling com João na mesma data.
- **Status:** selecionado em 2026-08-29 por `/planejar-site`. `docs/superpowers/state.md` está em
  `ready_for_execution`, branch `refactor/contato-intake`.
- **Não é spec nem plano:** o bloco é `bounded`; este arquivo é o `bounded_design` que
  `/planejar-site` consome.

## Proposição

Uma submissão de contato atravessa hoje seis módulos e cinco arquivos de teste. Três dos módulos de
`src/integrations/contact/` são **shallow** — a interface custa quase o mesmo que a implementação — e
o contrato do resultado está declarado duas vezes, uma em `lib` e outra restatada no componente.

O bloco deixa dois módulos e um seam: o **Contact intake** e o **adapter** do provedor.

## O que não muda

Os aceites do bloco `4.1.1`–`4.1.10` são **propriedades**, não layout de arquivo
(`docs/superpowers/specs/2026-08-27-4.1.1-4.1.10-formulario-integracoes-design.md:160-166`). As três
sobrevivem intactas:

- `4.1.3` — a entrada normaliza e valida antes de qualquer chamada de rede e não conhece o provedor.
- `4.1.4` — o serviço roda inteiro contra uma porta fake.
- `4.1.5` — a feature depende da porta, não do adapter; nenhum tipo do provedor vaza.

Quem nomeia `integrations/contact/sender.ts` é o **plano** do bloco, artefato fechado. Plano fechado
não é catraca. É isso que o `ADR-SITE-003` registra.

Também não muda: comportamento observável, payload enviado ao Web3Forms, textos em es-CL, estados
acessíveis do formulário, `D-17` (envio real segue não provado).

## Desenho

### Commit 1 — `refactor(contato): unificar o contrato do contato em lib`

Corresponde ao candidato **B**.

- A união do resultado passa a existir uma vez, como `ContactSubmitResult`, em
  `src/lib/contact-schema.ts` — ao lado de `ContactFormInput`, `ContactMessage` e
  `ContactFieldErrors`, que já moram lá.
- `ContactSubmitOutcome` some de `src/components/sections/ContactForm.tsx`. O componente importa a
  união de `lib`.
- `ContactSubmitHandler` **fica** em `ContactForm.tsx`, tipado sobre a união importada: é a forma da
  prop do componente, não dado. `lib` não descreve assinatura de UI.
- Regra nova em `eslint.config.js`: `src/components/**` não importa `zod` como valor. A propriedade
  `D3` da spec 4.1.x ("nenhum componente importa Zod") passa a ser catraca em vez de convenção —
  import somente-tipo continua permitido e é apagado no build.

### Commit 2 — `refactor(contato): consolidar o intake do contato num módulo`

Corresponde ao candidato **A**.

- Nasce `src/integrations/contact/intake.ts` com `createContactIntake(send)`, de assinatura
  `(formData: FormData) => Promise<ContactSubmitResult>`.
- Somem `submit.ts`, `service.ts` e `sender.ts`. O módulo absorve leitura do `FormData`,
  normalização, validação pelo schema, delegação à porta e conversão de rejeição em `failed`.
- `ContactSender` e `ContactSendOutcome` passam a ser declarados em `intake.ts`; `web3forms.ts`
  importa a porta de lá. Adapter dependendo da porta que o núcleo declara é a forma canônica de
  ports & adapters.
- `ContactSendOutcome` (`sent | failed`) **não** vai para `lib`: o componente nunca a vê.
- `unavailableContactSender` fica em `intake.ts`, junto do tipo que implementa. É o caminho real de
  um build sem `VITE_WEB3FORMS_ACCESS_KEY`, não código descartável.
- `readContactFormData` vira **privada**. Os três testes que hoje batem nela direto
  (`submit.test.ts:13-50`) são **reescritos** via a interface: `FormData` incompleto ou com valor
  não-textual entra e sai `invalid` com o erro no campo certo. A interface passa a ser a superfície
  de teste.
- `src/app/App.tsx` passa de quatro imports de `integrations/contact/` para dois.
- `CONTEXT.md` nasce aqui, mínimo: **Contact intake**, **porta** (`ContactSender`), **adapter**.
  Só os termos que este bloco usa de verdade.

### `ADR-SITE-003`

Curto, no mesmo commit 2. Registra que os aceites `4.1.3`/`4.1.4`/`4.1.5` são propriedades e não
layout de arquivo, e que a consolidação as preserva. Existe para que a próxima revisão de
arquitetura não leia o plano de `4.1.x`, veja a separação prescrita e proponha re-separar.

## Destino dos testes

| hoje                                          | depois                                                       |
| --------------------------------------------- | ------------------------------------------------------------ |
| `submit.test.ts` — 3 de `readContactFormData` | reescritos em `intake.test.ts`, via a interface              |
| `submit.test.ts` — 1 de delegação             | some: delegação deixa de ser uma aresta                      |
| `service.test.ts` — 7 casos                   | migram para `intake.test.ts` sem mudança de asserção         |
| `sender.test.ts` — 1 caso                     | migra para `intake.test.ts`                                  |
| `web3forms.test.ts` — 6 casos                 | intactos                                                     |
| `ContactForm.test.tsx` — 13 casos             | intactos; só o nome do tipo importado muda                   |
| `App.test.tsx:74-105` — fiação sem chave      | **intacto e não tocado.** É a rede de segurança do refactor. |

## Prova

`pnpm check` **e** `pnpm e2e` completo. O contato é o único fluxo do site com rede, e
`e2e/contacto.spec.ts` intercepta `api.web3forms.com` provando payload, sucesso, inválido e falha —
é a prova mais forte de que o comportamento não mudou.

## Parâmetros do bloco

```yaml
work_item: refactor-contato-intake
work_class: bounded
branch: refactor/contato-intake
active_spec: null
active_plan: null
authorized_paths:
  - src/integrations/contact/**
  - src/lib/contact-schema.ts
  - src/components/sections/ContactForm.tsx
  - src/components/sections/ContactForm.test.tsx
  - src/app/App.tsx
  - eslint.config.js
  - CONTEXT.md
  - docs/adr/ADR-SITE-003.md
  - docs/superpowers/bounded-designs/refactor-contato-intake.md
```

`executor: claude`, `reviewer: codex` — diferentes, como o invariante exige. Ressalva de `D-25`: a
cota da conta Codex esgotou na segunda passada de review do bloco anterior; se repetir, a limitação
vai registrada, não simulada.

Escopo de commit por assunto (`contato`), não por EAP: não existe EAP no Notion para este trabalho,
e reaproveitar `4.1.3-4.1.5` mentiria sobre a origem — aquelas EAP estão fechadas e entregues, e o
refactor não as reabre. Segue o precedente de `chore(harness)` e `docs(harness)` no histórico.

## Fora de escopo

Candidatos C, D e E da revisão de 2026-08-29 — módulo de captura de estados do Playwright,
`rgbToHex` × `cssColor`, e o glossário completo de vocabulário. C foi a recomendação principal do
relatório e continua aberta.
