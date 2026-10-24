# Passada retroativa — segunda lente sobre os blocos sem Codex (2026-10)

> Data: 2026-10-24 · Bloco: `harness-debitos` (`B10`) · Base: `main@cb9654a`
> Spec: `docs/superpowers/specs/2026-10-24-harness-debitos-design.md` (D7, D12–D15, §5.2)
> Reviewer: `claude-isolado` — o Codex está indisponível: o teste de `/revisar-site`, rodado na
> execução (Task 4, Step 9), saiu `1` com
> `The 'gpt-5.5' model is not supported when using Codex with a ChatGPT account.` (`model_not_found`).

Registro fechado. A passada não se repete: a classe "segunda lente ausente" passa a ter
`claude-isolado` como segunda lente quando o Codex não responde.

## O que foi revisado

O código de hoje tocado pelos blocos que fecharam sem segunda lente, e não os diffs históricos
(spec D7). Os 39 arquivos saem do cálculo da spec §4.2: arquivos tocados pelos ranges abaixo, ainda
existentes, fora de `docs/` e do ferramental congelado (`scripts/inventario/`, `scripts/qa/`,
`scripts/wordpress/`). A lista recalculada na execução bateu com a da spec, e
`git diff cb9654a HEAD` sobre os 39 sai vazio: o conteúdo revisado é o de `main@cb9654a`.

| Débito | Bloco                     | Range                                | Área em que foi coberto            |
| ------ | ------------------------- | ------------------------------------ | ---------------------------------- |
| `D-27` | `refactor-contato-intake` | `82bc812`, `dc0408d`                 | Contato                            |
| `D-32` | `paridade-header-cursos`  | `b9ac09a`, `68542eb`                 | Observabilidade e CI (como diff)   |
| `D-53` | `7.2.1` (segunda rodada)  | PR #18 (`1535720`)                   | Infra e zona                       |
| `D-65` | `7.2.5`                   | PR #26 (`28542cb`)                   | Infra e zona; Observabilidade e CI |
| `D-70` | `7.2.6`                   | PRs #28 e #29 (`0d2a890`, `92906d2`) | Observabilidade e CI; Infra e zona |
| `D-76` | `7.2.7`                   | PR #31 (`dd5fa31`)                   | Infra e zona                       |
| `D-77` | `revisao-arquitetura`     | PR #32 (`cb9654a`)                   | Infra e zona; Contato              |

`D-32` só tem documentação (uma linha de `docs/inventario/04-tipografia.md` e
`docs/superpowers/backlog.md`) e entrou como diff, `git show b9ac09a 68542eb` (spec D13).

## Como foi feita

- Um agente `claude-isolado` por área, um de cada vez: agente novo da ferramenta de agente do
  Claude Code, `general-purpose`, sem fork e sem troca de modelo. O pedido foi o
  `.agents/skills/site-review-task/SKILL.md` na íntegra mais o bloco de entrada da Task 5 do plano
  (alvo, lista fechada de arquivos, Acceptance e Scope fora), e nada mais.
- `git status --short` fotografado antes da primeira área e comparado depois de cada agente: igual
  nas três (D12). Os agentes rodaram `pnpm check`, Vitest e Playwright, e sondas no scratchpad;
  só saída ignorada (`dist/`, `dist-lambda/`, `node_modules/.tmp`) e arquivos fora do repositório
  foram escritos.
- Cada achado foi conferido no código por Claude antes do destino (D6). Destino pela D14:
  `blocking`/`important` confirmado vira débito ou nota num débito aberto que ele repete;
  `suggestion` confirmada fica só aqui.

## Infra e zona

**Arquivos (17):** `infra/lotus-dns.yaml`, `infra/lotus-site.yaml`,
`scripts/infra/conferir-zona.mjs`, `scripts/infra/medir-propagacao.mjs`,
`scripts/infra/lib/{template,yaml,zona,distribuicao,cabecalhos,politica-de-cabecalhos}.mjs`,
`scripts/infra/{template,yaml,zona,distribuicao,cabecalhos}.test.mjs`, `e2e/cabecalhos.spec.ts`,
`e2e/smoke/alvo.ts`.

**Veredito do agente:** `FINDINGS`, dez `suggestion`, nenhum risco de produção agora. Descartou ele
mesmo dois pontos: a codificação da query no redirect `www`→apex já é provada por
`e2e/smoke/3-redirects.spec.ts`, e o alerta de budget só `FORECASTED` é decisão da `ADR-SITE-004`.

**Limitations do agente, resumidas:** Acceptance e Scope não se aplicam; `conferir-zona` e
`medir-propagacao` não rodaram (pedem credencial AWS e rede, e o primeiro grava evidência em
`docs/infra/`); sem `validate-template` nem conferência de drift contra as stacks; smoke de
produção não rodou; sem UI no alvo.

| Achado | `path:line`                                      | Severidade   | Conferência | Motivo                                                                                                                                                   | Destino                    |
| ------ | ------------------------------------------------ | ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| R-1    | `e2e/cabecalhos.spec.ts:129-135`                 | `suggestion` | confirmado  | a espera `violacoesDeCsp.length > 0` já é satisfeita pela violação da sonda `eval` do zod na carga (`D-63`), antes do `<script>` injetado                | relatório                  |
| R-2    | `e2e/cabecalhos.spec.ts:8-21`                    | `suggestion` | confirmado  | o comentário diz que `tsconfig.e2e.json` não tem `allowJs`, mas `:15` tem `"allowJs": true` e `e2e/smoke/8-cabecalhos.spec.ts:1` já importa `CABECALHOS` | relatório                  |
| R-3    | `scripts/infra/lib/yaml.mjs:70`                  | `suggestion` | confirmado  | `/\s#/` não casa escalar que começa em `#`; o cabeçalho do módulo (`:14-17`) promete erro                                                                | relatório                  |
| R-4    | `scripts/infra/lib/template.mjs:136-138`         | `suggestion` | confirmado  | `/\$\{(\w+)\}/` deixa `${AWS::Region}`, `${Recurso.Atributo}` e `${!Literal}` literais; a primeira forma já está em `D-79`                               | relatório (estende `D-79`) |
| R-5    | `scripts/infra/lib/distribuicao.mjs:170-179`     | `suggestion` | confirmado  | `@returns {any}`; handler que devolve `undefined` cai em `JSON.parse(JSON.stringify(undefined))` e lança `SyntaxError`                                   | relatório                  |
| R-6    | `scripts/infra/lib/zona.mjs:245-251`             | `suggestion` | confirmado  | `lerPoliticasDaZona` só é chamada por `zona.test.mjs`, ao contrário do comentário; `eDoCorte` (`:125`) não tem import externo                            | relatório                  |
| R-7    | `scripts/infra/conferir-zona.mjs:115-123`        | `suggestion` | confirmado  | todo erro fora de `FALHAS_DE_REDE`, inclusive sem `code`, vira `[]`; o comentário só aceita NXDOMAIN, NODATA e REFUSED/SERVFAIL                          | relatório                  |
| R-8    | `infra/lotus-site.yaml:8-10`, `:229-233`, `:486` | `suggestion` | confirmado  | `Description`, comentário e `Output` descrevem apex e `www` no WordPress, estado de antes do corte                                                       | relatório                  |
| R-9    | `e2e/smoke/alvo.ts:14-16`                        | `suggestion` | confirmado  | `X_ROBOTS_TAG_PRESENTE = false` com um consumidor de ramo morto (`7-seo.spec.ts:43`); o comentário `:5-10` ainda cita o WordPress                        | relatório                  |
| R-10   | `scripts/infra/lib/zona.mjs:253-262`             | `suggestion` | confirmado  | `normalizar` aplica `toLowerCase()` a todo valor, TXT incluído, e `linhaConfere` compara TXT por ela                                                     | relatório                  |

## Contato

**Arquivos (13):** `lambda/contato/{handler,handler.test,contrato.test}.ts`,
`src/integrations/contact/{intake,intake.test}.ts`,
`src/lib/{contact-fields,contact-schema,contact-schema.test}.ts`,
`src/components/sections/{ContactForm,ContactForm.test}.tsx`, `src/app/App.tsx`, `CONTEXT.md`,
`eslint.config.js`.

**Veredito do agente:** `PASS`, oito `suggestion`. Os problemas materiais que ele viu nesses
arquivos já são débito aberto e não foram reabertos: `D-54`, `D-57`, `D-58`, `D-60`, `D-61`,
`D-63`, `D-78` e `D-80`. Descartou ele mesmo a hipótese de `FormData` trocar quebra de linha por
CRLF (medido em Chromium e Firefox: sem CRLF).

**Limitations do agente, resumidas:** Acceptance e Scope não se aplicam; `pnpm e2e` não rodou, a UI
do formulário foi lida no código e nos testes jsdom; arquivos fora do alvo lidos só como contexto.
Apontou referências de linha que andaram: `D-60` cita `ContactForm.tsx:82-95` e `:118` (hoje
`:83-96` e `:119`), e `D-61` cita `contact-schema.ts:62-69` para o schema.

| Achado | `path:line`                                       | Severidade   | Conferência | Motivo                                                                                                                                                                  | Destino   |
| ------ | ------------------------------------------------- | ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| R-1    | `lambda/contato/handler.test.ts:97-98`            | `suggestion` | confirmado  | o comentário diz "seis nomes"; `readInput` (`handler.ts:85-100`) lê cinco desde `B9`                                                                                    | relatório |
| R-2    | `src/lib/contact-schema.ts:13-27`                 | `suggestion` | confirmado  | `ContactFormInput` e `ContactMessage` têm os mesmos cinco campos `string`. O agente citou `:55-69`, linha errada: o arquivo tem 128 linhas e os tipos estão em `:13-27` | relatório |
| R-3    | `src/lib/contact-schema.ts:91-99`, `:123`         | `suggestion` | confirmado  | `isFieldName` compara com cinco literais, sem ligação ao schema. O agente citou `:133-141` e `:163-166`, linhas inexistentes                                            | relatório |
| R-4    | `src/components/sections/ContactForm.tsx:22-24`   | `suggestion` | confirmado  | `ContactSubmitHandler` repete `ContactIntake` (`src/integrations/contact/intake.ts:28`)                                                                                 | relatório |
| R-5    | `eslint.config.js:42-62`                          | `suggestion` | confirmado  | o bloco de `src/lib/**` só restringe import; JSX pelo runtime automático não é import                                                                                   | relatório |
| R-6    | `src/components/sections/ContactForm.tsx:235-242` | `suggestion` | confirmado  | `captcha-error` não é referenciado por `aria-describedby`; só os campos de texto (`:188-202`) são associados                                                            | relatório |
| R-7    | `src/components/sections/ContactForm.tsx:66-67`   | `suggestion` | confirmado  | `status` e `fieldErrors` são dois `useState` independentes                                                                                                              | relatório |
| R-8    | `src/lib/contact-fields.ts:22-27`                 | `suggestion` | confirmado  | o JSDoc dos obrigatórios está acima de `ContactFieldName`, não de `CONTACT_REQUIRED_FIELDS`                                                                             | relatório |

## Observabilidade e CI

**Arquivos (9) e diff:** `infra/lotus-observabilidade.yaml`, `.github/workflows/ci.yml`,
`scripts/infra/medir-latencia.mjs`, `scripts/infra/lib/{observabilidade,ci-alerta,latencia}.mjs`,
`scripts/infra/{observabilidade,ci-alerta,latencia}.test.mjs`; e o diff de `D-32`,
`git show b9ac09a 68542eb`.

**Veredito do agente:** `FINDINGS`, um `important` e seis `suggestion`, nenhum risco de produção
agora. Sobre `b9ac09a`, a correção (preto em `1440`/`1920`, branco em `375`/`768`) bate com
`docs/qa/paridade/2026-09-02/header-cursos.md` e com o bounded design de `paridade-header-cursos`.
Problemas já em débito aberto, não reabertos: `D-42`, `D-43` e `D-69`.

**Limitations do agente, resumidas:** Acceptance e Scope não se aplicam; nenhuma chamada à AWS ou à
API do GitHub (sem conferência de drift, de consulta do Logs Insights nem de semântica de
plataforma); sem UI no alvo.

| Achado | `path:line`                                        | Severidade   | Conferência | Motivo                                                                                                                                                                                                         | Destino   |
| ------ | -------------------------------------------------- | ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| R-1    | `scripts/infra/lib/observabilidade.mjs:392-435`    | `important`  | confirmado  | reproduzido por Claude fora do repositório: um `AWS::IAM::RolePolicy` com `RoleName: !Ref PapelDeAlerta`, `Action: '*'` e `Resource: '*'` acrescentado ao template faz `conferirObservabilidade` devolver `[]` | `D-81`    |
| R-2    | `scripts/infra/lib/ci-alerta.mjs:29`, `:88`        | `suggestion` | confirmado  | `/github\.event\.\|github\.head_ref/` exige ponto depois de `event` e só olha o job, não o `env` do workflow                                                                                                   | relatório |
| R-3    | `.github/workflows/ci.yml:235-256`                 | `suggestion` | confirmado  | `pnpm build:lambda` (`:250`) roda depois de assumir a role (`:235-239`); `pnpm build` (`:233`) roda antes                                                                                                      | relatório |
| R-4    | `.github/workflows/ci.yml:114-117`                 | `suggestion` | confirmado  | `while IFS= read -r` pula a última linha sem `\n`; hoje `.espelho-exclusoes` termina em `\n`                                                                                                                   | relatório |
| R-5    | `.github/workflows/ci.yml:18-23`                   | `suggestion` | confirmado  | pela documentação de concorrência do GitHub, run pendente do mesmo grupo é cancelado pelo seguinte; nem o agente nem Claude rodaram três pushes para observar                                                  | relatório |
| R-6    | `scripts/infra/medir-latencia.mjs:13-14`, `:75-92` | `suggestion` | confirmado  | `LIMITE_MS` só é conferido depois de cada `fetch` voltar, e o `fetch` não tem `signal`                                                                                                                         | relatório |
| R-7    | commit `68542eb` (`docs/superpowers/backlog.md`)   | `suggestion` | confirmado  | a mensagem diz que a seção `paridade-header-cursos` saiu; a única linha removida é "Deploy e go-live — Sprint 6 (12)."                                                                                         | relatório |

## Fechamento

- **25 achados:** 1 `important`, 24 `suggestion`; 25 confirmados, nenhum descartado. Nenhum com
  risco de produção agora (D14): o `important` é lacuna de catraca contra regressão, e o template
  real passa nela sem o recurso que ela deixa de ver.
- **Débito novo:** `D-81` (R-1 de Observabilidade e CI).
- **Notas em débito aberto:** nenhuma. R-4 de Infra e zona estende `D-79`, mas é `suggestion` e
  fica só aqui.
- **Débitos fechados:** `D-27`, `D-32`, `D-53`, `D-65`, `D-70`, `D-76` e `D-77`.
