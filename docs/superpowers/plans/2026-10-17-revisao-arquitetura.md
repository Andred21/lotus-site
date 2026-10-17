# Revisão de arquitetura (`B9`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar os candidatos 01, 02, 03 e 04 da revisão de arquitetura de 2026-10-11 — um leitor
só para os templates de `infra/`, a zona DNS declarada só no template, o honeypot fora da
interface do Contact intake e um teste de contrato entre adapter e função — sem mudar um pixel.

**Architecture:** `scripts/infra/lib/template.mjs` passa a ser o único leitor de template,
construído sobre `lerYaml`; os leitores por coluna de `zona.mjs`, `distribuicao.mjs` e
`cabecalhos.mjs` são reescritos sobre ele com os mesmos nomes e retornos. Depois, o INVENTARIO sai e
o `conferir-zona` fica com um modo só. No contato, o intake checa a armadilha antes do schema, e um
teste em `lambda/` liga o adapter real ao handler real.

**Tech Stack:** Node 24.19.0, pnpm 11, Vitest, Playwright (Chromium), Zod 4, AWS CLI (leitura).

**Spec:** `docs/superpowers/specs/2026-10-17-revisao-arquitetura-design.md`

## Global Constraints

- Branch `refactor/revisao-arquitetura`; nenhum commit em `main`; sem push (`/executar-site`).
- Um commit por candidato: `<tipo>(revisao-arquitetura): <descrição>`, terminando com
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. As quatro mensagens estão na spec §7.
- Todo comando de Node antes de rodar: `source ~/.nvm/nvm.sh >/dev/null && nvm use >/dev/null`
  (`engineStrict` recusa o Node padrão da máquina).
- Nenhuma dependência nova de pacote (Lei 7).
- Nada visual: snapshots de `e2e/regressao-visual.spec.ts-snapshots/` não são regravados.
- `scripts/inventario/`, `scripts/qa/` e `scripts/wordpress/` não são tocados (spec D3).
- `infra/*.yaml` não muda em valor nenhum; nenhum deploy de stack.
- As chaves do JSON de `ContactMessage` não mudam (spec §2).
- `WORDPRESS`, `eDoCorte`, `NOMES_INVENTADOS` e `conferirAliasesDoCorte` ficam (spec D7, D9).
- `yaml.mjs` não muda: os dois exports (`lerYaml`, `mapa`) e os testes de hoje (spec D6).
- Não escrever no Notion, Drive nem Figma (Lei 6). Backlog só no fechamento (spec §10).
- Arquivo `.md` ou `.mjs` tocado passa por `pnpm exec prettier --write <arquivo>` antes do commit.
- `SP=/tmp/claude-1000/-home-jvbat-projetos-lotus-site/0ee5e060-572d-49e8-a48b-5645620e1d98/scratchpad`
  — diretório de trabalho fora do repositório (fotografia dos leitores, árvore espelhada). Numa
  sessão nova, usar o scratchpad dela.

## Precisões sobre a spec

Três pontos que a leitura do código fixou no planejamento. Nenhum muda escopo; todos vão no
relatório da execução.

1. **`normalizar` continua tirando aspas.** Ela trata a resposta DNS (`"v=spf1 …"` chega com aspas
   pelo DoH), não o template. O critério "nenhuma cópia de `semAspas`" da spec §8 vale para a
   leitura de template: `normalizar` faz a remoção inline, sem helper com esse nome.
2. **A leitura da política de cabeçalhos sai inteira de `cabecalhos.mjs`.** A spec §5.1 deixava
   `renderizarGrupo` e os conjuntos fechados em `cabecalhos.mjs`. Eles só existem para ler o
   template, então vão junto de `lerPoliticaDoTemplate` para `politica-de-cabecalhos.mjs`, e
   `cabecalhos.mjs` fica só com as constantes canônicas que o build importa. Mesmo efeito que a
   spec queria: `vite.config.ts` não puxa leitor nenhum.
3. **`lerParametros` e `resolver` saem de `zona.mjs`.** Os `Default` passam a vir de
   `lerTemplate(texto).defaults`, e `resolver` mora em `template.mjs`.

## Review Focus

1. **Leitor novo aceitando o que o antigo recusava** — campo desconhecido num `RecordSet`, num
   `AliasTarget`, num item de `FunctionAssociations` ou na política de cabeçalhos; esperado: erro
   com o nome do campo, como hoje (Task 1, testes de `conferirChaves` e os testes de "campo
   desconhecido" que ficam em cada consumidor).
2. **`!Sub` com escape YAML** (`'it''s ${X}'`, `"a\"b"`) — esperado: o mesmo valor que o `lerYaml`
   daria ao escalar (Task 1, teste de `resolver`).
3. **Template real lido diferente depois da troca** — 19 RecordSets, 7 `Default`, os
   `AllowedPattern`, a CSP, o `Comment` e o `FunctionCode`; esperado: saída idêntica à dos
   leitores antigos (Task 1, Steps 1 e 9, comparação por `diff`).
4. **Honeypot só com espaço, ou honeypot junto de campo inválido** — esperado: só espaço segue
   como vazio (a porta é chamada); armadilha preenchida com outro campo inválido devolve `failed`,
   nunca `invalid` com o erro do campo (Task 3, testes do intake).
5. **Chave renomeada de um lado só do contrato** — esperado: o teste de contrato falha (Task 4,
   Step 5, mutação manual revertida).

---

## File structure

| Arquivo                                                   | Task | Responsabilidade depois do bloco                                           |
| --------------------------------------------------------- | ---- | -------------------------------------------------------------------------- |
| `scripts/infra/lib/template.mjs` (novo)                   | 1    | ler template: `Default`, recursos, saídas, `!Ref`/`!Sub`, conjunto fechado |
| `scripts/infra/template.test.mjs` (novo)                  | 1    | testes de `template.mjs`                                                   |
| `scripts/infra/lib/politica-de-cabecalhos.mjs` (novo)     | 1    | ler e renderizar a `PoliticaDeCabecalhos` do template                      |
| `scripts/infra/lib/cabecalhos.mjs`                        | 1    | só `CABECALHOS`, `REMOVIDOS` e a lista da CSP                              |
| `scripts/infra/lib/zona.mjs`                              | 1, 2 | registros e políticas sobre `template.mjs`; regras da zona; vereditos      |
| `scripts/infra/lib/distribuicao.mjs`                      | 1    | distribuição, função e certificado sobre `template.mjs`                    |
| `scripts/infra/zona.test.mjs`                             | 1, 2 | catraca da zona sobre o template                                           |
| `scripts/infra/distribuicao.test.mjs`                     | 1    | catraca da distribuição                                                    |
| `scripts/infra/cabecalhos.test.mjs`                       | 1    | catraca template ≡ módulo                                                  |
| `scripts/infra/conferir-zona.mjs`                         | 2    | confere o template contra a zona no ar, modo único                         |
| `docs/infra/runbook-aws.md`, `zona-dns-lotusotec.md`      | 2    | comando único e edição única                                               |
| `docs/infra/conferencia-zona-<data>.md` (novo)            | 2    | relatório ao vivo (spec D13)                                               |
| `src/lib/contact-fields.ts`                               | 3    | ganha `CONTACT_HONEYPOT_FIELD`                                             |
| `src/lib/contact-schema.ts` (+ `.test.ts`)                | 3    | sem `botcheck`                                                             |
| `src/integrations/contact/intake.ts` (+ `.test.ts`)       | 3, 4 | armadilha antes do schema; `read` tipado                                   |
| `src/components/sections/ContactForm.tsx` (+ `.test.tsx`) | 3    | input pela constante; sem o teste do honeypot em `fieldErrors`             |
| `lambda/contato/handler.ts` (+ `.test.ts`)                | 3, 4 | não lê `botcheck`; `read` tipado                                           |
| `lambda/contato/contrato.test.ts` (novo)                  | 4    | adapter real → handler real                                                |
| `docs/adr/ADR-SITE-005.md`                                | 3    | Emenda E2                                                                  |

---

### Task 1: Um leitor de template (candidato 01, spec D6 e §5.1)

**Files:**

- Create: `scripts/infra/lib/template.mjs`, `scripts/infra/template.test.mjs`,
  `scripts/infra/lib/politica-de-cabecalhos.mjs`
- Modify: `scripts/infra/lib/zona.mjs:226-430`, `scripts/infra/lib/distribuicao.mjs:1-305`,
  `scripts/infra/lib/cabecalhos.mjs:1-15,64-311`
- Test: `scripts/infra/zona.test.mjs`, `scripts/infra/distribuicao.test.mjs`,
  `scripts/infra/cabecalhos.test.mjs`

**Interfaces:**

- Consumes: `lerYaml(texto: string): Mapa` e `mapa(valor, caminho): Mapa` de `yaml.mjs`; tipos
  `Valor`, `Lista`, `Mapa` do JSDoc de `yaml.mjs`.
- Produces, em `template.mjs`:
  - `@typedef {{ defaults: Map<string, string>, parametros: Mapa, recursos: Mapa, saidas: Mapa }} Template`
  - `lerTemplate(texto: string): Template` — `defaults` só com parâmetros cujo `Default` é
    escalar; `Parameters` e `Outputs` ausentes ou vazios viram mapa vazio; `Resources` ausente lança
    `template sem Resources`.
  - `recurso(template: Template, nome: string): Mapa` — ausente lança
    `template sem o recurso ${nome}` (mesma mensagem de hoje).
  - `escalar(valor: Valor | undefined, caminho: string): string` — lança
    `${caminho}: esperava um escalar`.
  - `lista(valor: Valor | undefined, caminho: string): Lista` — lança
    `${caminho}: esperava uma lista`.
  - `conferirChaves(objeto: Mapa, permitidas: readonly string[], onde: string): void` — chave fora
    de `permitidas` lança `${onde} com campo desconhecido: ${chave}`.
  - `resolver(valor: Valor | undefined, defaults: Map<string, string>, caminho: string): string`
    — `!Ref X` devolve o `Default` de `X`; `!Sub <payload>` decodifica o payload com
    `escalar(lerYaml(\`v: ${payload}\`).v, caminho)` (as regras de aspas e escape são as do leitor
    de YAML) e troca cada `${X}`; texto sem tag volta igual; parâmetro sem `Default`lança`template usa o parâmetro ${X}, que não tem Default declarado` (mensagem de hoje); outra tag
    (`!GetAtt`, `!Join`…) ou valor não escalar lança `${caminho}: sem resolução: ${valor}`.
- Produces, mesmos nomes e retornos de hoje: `lerRegistros(texto): RegistroLido[]`,
  `lerPoliticasDoRecurso(texto, recurso)`, `lerPoliticasDaZona(texto)` (`zona.mjs`);
  `lerDistribuicao(texto)`, `lerFuncao(texto, nome)`, `nomesDoCertificado(textoDns)`,
  `lerPadraoDoParametro(texto, nome)` (`distribuicao.mjs`);
  `lerPoliticaDoTemplate(texto)` (agora em `politica-de-cabecalhos.mjs`).

- [ ] **Step 1: Fotografar a saída dos leitores antigos**

Criar `/tmp/claude-1000/-home-jvbat-projetos-lotus-site/0ee5e060-572d-49e8-a48b-5645620e1d98/scratchpad/leitores.mjs`
(fora do repositório):

```js
// node <este arquivo> <saida.json>, rodado da raiz do repositório
import { readFileSync, writeFileSync } from 'node:fs'
const lib = (nome) => import(`${process.cwd()}/scripts/infra/lib/${nome}.mjs`)
const dns = readFileSync('infra/lotus-dns.yaml', 'utf8')
const site = readFileSync('infra/lotus-site.yaml', 'utf8')
const zona = await lib('zona')
const dist = await lib('distribuicao')
const template = await lib('template').catch(() => null)
const politica = await lib('politica-de-cabecalhos').catch(() => null)
const cab = await lib('cabecalhos')
const defaults = template
  ? template.lerTemplate(dns).defaults
  : zona.lerParametros(dns)
const funcao = dist.lerFuncao(site, 'RedirecionarWww')
writeFileSync(
  process.argv[2],
  JSON.stringify(
    {
      registros: zona.lerRegistros(dns),
      defaults: Object.fromEntries(defaults),
      politicasZona: zona.lerPoliticasDoRecurso(dns, 'Zona'),
      politicasRegistros: zona.lerPoliticasDoRecurso(dns, 'Registros'),
      distribuicao: dist.lerDistribuicao(site),
      funcao: { ...funcao, codigo: funcao.codigo.trimEnd() },
      certificado: dist.nomesDoCertificado(dns),
      padrao: dist.lerPadraoDoParametro(site, 'ArnDoCertificadoDoDominio'),
      politica: (politica ?? cab).lerPoliticaDoTemplate(site),
    },
    null,
    2,
  ),
)
```

Run: `node "$SP/leitores.mjs" "$SP/antes.json"` com `SP` igual ao diretório acima.
Expected: `antes.json` com 19 registros e `defaults` com 7 chaves.

- [ ] **Step 2: Escrever `scripts/infra/template.test.mjs`**

Fixture pequena em string. Casos e asserções:

```js
it('lê os Default escalares e ignora parâmetro sem Default', () => {
  // Parameters: NomeDaZona (Default exemplo.cl), Ttl (Default 3600), SemPadrao (só Type)
  expect(Object.fromEntries(lerTemplate(FIXTURE).defaults)).toEqual({
    NomeDaZona: 'exemplo.cl',
    Ttl: '3600',
  })
})
it('Resources ausente lança', () => {
  expect(() => lerTemplate('Parameters:\n  A:\n    Default: x\n')).toThrow(
    'template sem Resources',
  )
})
it('recurso ausente lança com o nome', () => {
  expect(() => recurso(lerTemplate(FIXTURE), 'NaoExiste')).toThrow(
    'template sem o recurso NaoExiste',
  )
})
it('resolve !Ref e !Sub contra os Default', () => {
  const { defaults } = lerTemplate(FIXTURE)
  expect(resolver('!Ref NomeDaZona', defaults, 'x')).toBe('exemplo.cl')
  expect(resolver("!Sub 'www.${NomeDaZona}.'", defaults, 'x')).toBe(
    'www.exemplo.cl.',
  )
  expect(resolver('1 ASPMX.L.GOOGLE.COM.', defaults, 'x')).toBe(
    '1 ASPMX.L.GOOGLE.COM.',
  )
})
it('decodifica o payload do !Sub pelas regras do YAML', () => {
  const { defaults } = lerTemplate(FIXTURE)
  expect(resolver("!Sub 'it''s ${NomeDaZona}'", defaults, 'x')).toBe(
    "it's exemplo.cl",
  )
  expect(resolver('!Sub "a\\"${NomeDaZona}"', defaults, 'x')).toBe(
    'a"exemplo.cl',
  )
})
it('parâmetro sem Default lança em vez de resolver para vazio', () => {
  expect(() =>
    resolver('!Ref SemPadrao', lerTemplate(FIXTURE).defaults, 'x'),
  ).toThrow(/SemPadrao/)
})
it('tag sem resolução e valor não escalar lançam com o caminho', () => {
  const { defaults } = lerTemplate(FIXTURE)
  expect(() => resolver('!GetAtt A.B', defaults, 'Registros.0.Name')).toThrow(
    'Registros.0.Name: sem resolução',
  )
  expect(() => resolver({ '!Join': [] }, defaults, 'y')).toThrow(
    'y: sem resolução',
  )
})
it('conferirChaves lança com o nome do campo fora do conjunto', () => {
  expect(() =>
    conferirChaves({ Name: 'a', Weight: '10' }, ['Name'], 'RecordSet a'),
  ).toThrow('RecordSet a com campo desconhecido: Weight')
})
it('escalar e lista lançam com o caminho', () => {
  expect(() => escalar(['a'], 'p')).toThrow('p: esperava um escalar')
  expect(() => lista('a', 'q')).toThrow('q: esperava uma lista')
})
it('lê os cinco templates reais', () => {
  for (const nome of [
    'dns',
    'site',
    'observabilidade',
    'contato',
    'oidc-github',
  ]) {
    expect(() =>
      lerTemplate(readFileSync(`infra/lotus-${nome}.yaml`, 'utf8')),
    ).not.toThrow()
  }
})
it('resolve todo Name dos RecordSets do lotus-dns', () => {
  const t = lerTemplate(readFileSync('infra/lotus-dns.yaml', 'utf8'))
  const itens = lista(
    mapa(recurso(t, 'Registros').Properties, 'Registros.Properties').RecordSets,
    'RecordSets',
  )
  expect(itens).toHaveLength(19)
  for (const [i, item] of itens.entries()) {
    expect(
      resolver(
        mapa(item, `RecordSets.${i}`).Name,
        t.defaults,
        `RecordSets.${i}.Name`,
      ),
    ).toMatch(/(^|\.)lotusotec\.cl\.$/)
  }
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run scripts/infra/template.test.mjs`
Expected: FAIL, módulo `./lib/template.mjs` inexistente.

- [ ] **Step 4: Implementar `scripts/infra/lib/template.mjs`**

Interface do bloco acima. Cabeçalho do arquivo diz que este é o leitor único de template, e que
a sintaxe YAML fica em `yaml.mjs`. Nenhum regex de recuo.

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm exec vitest run scripts/infra/template.test.mjs` — Expected: PASS.

- [ ] **Step 6: `zona.mjs` sobre `template.mjs`**

- `lerRegistros(texto)`: `recurso(t, 'Registros').Properties.RecordSets` (sem conferir `Type`,
  como hoje); por item, `Name` resolvido primeiro; `conferirChaves(item, ['Name', 'Type', 'TTL',
'ResourceRecords', 'AliasTarget'], \`RecordSet ${nome}\`)`; `AliasTarget` conferido contra
  `['DNSName', 'HostedZoneId', 'EvaluateTargetHealth']` com `onde` = `AliasTarget de ${nome}`;
`ttl`=`Number(resolver(TTL))`ou`0`sem`TTL`; `valores`=`ResourceRecords`resolvidos, ou`[resolver(DNSName)]` no alias.
- `lerPoliticasDoRecurso(texto, recurso)`: `DeletionPolicy` e `UpdateReplacePolicy` do recurso, `''`
  quando ausentes. `lerPoliticasDaZona` fica.
- Saem `ASPAS_EXTERNAS`, `semAspas`, `exigirParametro`, `recortar`, `lerParametros`, `resolver`.
  `normalizar` tira as aspas externas inline (Precisão 1). O comentário de topo deixa de dizer
  "sem parser YAML".

Em `zona.test.mjs`:

- Saem do import `lerParametros` e `resolver`; os testes "lê o Default de cada parâmetro",
  "resolve !Ref e !Sub" e "reprova parâmetro sem Default" passam a usar
  `lerTemplate(TEMPLATE).defaults` e `resolver(…, defaults, 'teste')` de `./lib/template.mjs`,
  com as mesmas asserções.
- As fixtures de `lerRegistros` ficam (são guardas de regressão, inclusive a de `60dd2c2`); a
  mensagem `'RecordSet x.exemplo.cl. com campo desconhecido: Weight'` não muda. Acrescentar:
  `AliasTarget` com `Weight` lança `'AliasTarget de ensaio-corte.exemplo.cl. com campo desconhecido: Weight'`.
- "declara o certificado da zona…" deixa de recortar texto (`TEMPLATE.indexOf`/`TEMPLATE.slice`)
  e passa a ler `recurso(lerTemplate(TEMPLATE), 'Certificado')`: `Type` igual a
  `'AWS::CertificateManager::Certificate'`; `Properties.ValidationMethod` igual a `'DNS'`;
  `SubjectAlternativeNames` contém `"!Sub 'www.${NomeDaZona}'"`; os dois itens de
  `DomainValidationOptions` com `HostedZoneId` igual a `'!Ref Zona'`;
  `JSON.stringify(recurso)` sem `*`.
- "exporta o ARN do certificado…" passa a `expect(lerTemplate(TEMPLATE).saidas).toHaveProperty('ArnDoCertificado')`.

- [ ] **Step 7: `distribuicao.mjs` sobre `template.mjs`**

- Import de `./zona.mjs` fica só com `mesmoConjunto`; `resolver` e `lerTemplate` vêm de
  `./template.mjs`. Saem `semAspas` e `recortarRecurso`.
- `lerDistribuicao`: navega `Distribuicao.Properties.DistributionConfig`; `Aliases`,
  `PriceClass` (vazio se ausente), `ViewerCertificate` (mapa de escalares), as
  `FunctionAssociations` de `DefaultCacheBehavior` e de cada item de `CacheBehaviors`. Item de
  associação conferido contra `['EventType', 'FunctionARN']` com `onde` = `'FunctionAssociations'`
  (mensagem de hoje); item sem um dos dois lança `FunctionAssociations com item incompleto: …`.
  Valores ficam crus (`'!Ref ArnDoCertificadoDoDominio'`, `ARN_DA_FUNCAO`), como hoje.
- `lerFuncao`: `Type`, `Properties.AutoPublish`, `Properties.FunctionConfig.Runtime` e
  `Properties.FunctionCode` do `lerYaml`; as mensagens `${nome} sem Type`, `sem AutoPublish`,
  `sem Runtime`, `sem FunctionCode` ficam. A exigência de "`FunctionCode` precisa ser a última
  propriedade" sai (era limite do leitor por coluna).
- `nomesDoCertificado`: `DomainName` primeiro, depois `SubjectAlternativeNames`, resolvidos;
  `Certificado sem DomainName` fica.
- `lerPadraoDoParametro`: `parametros[nome].AllowedPattern`; mensagens `template sem o parâmetro`
  e `sem AllowedPattern` ficam.

Em `distribuicao.test.mjs`: o `MODELO` continua; se o `lerYaml` recusar algo da fixture
(comentário no fim de linha, por exemplo), corrigir a fixture, nunca o leitor. Teste que só
existia por causa do recorte por coluna sai, com o nome registrado no relatório da execução.

- [ ] **Step 8: `politica-de-cabecalhos.mjs` e `cabecalhos.mjs`**

- Mover para `scripts/infra/lib/politica-de-cabecalhos.mjs`: `SECOES`, `CAMPOS_DO_GRUPO`,
  `exigirCampo`, `renderizarGrupo` e `lerPoliticaDoTemplate(texto)`, este reescrito sobre
  `recurso(lerTemplate(texto), 'PoliticaDeCabecalhos')` com `conferirChaves` em cada nível
  (recurso: `Type`, `Properties`; `Properties`: `ResponseHeadersPolicyConfig`; config: `SECOES`;
  grupo: `CAMPOS_DO_GRUPO[grupo]`; item de `CustomHeadersConfig.Items`: `Header`, `Value`,
  `Override`; item de `RemoveHeadersConfig.Items`: `Header`). As mensagens de erro de hoje
  ficam iguais.
- `cabecalhos.mjs` fica com `DIRETIVAS_CSP`, `CABECALHOS`, `REMOVIDOS`; o comentário de topo
  aponta o leitor para `politica-de-cabecalhos.mjs`.
- `cabecalhos.test.mjs` importa `lerPoliticaDoTemplate` do módulo novo; o `MODELO` ganha a linha
  `Resources:` antes de `  PoliticaDeCabecalhos:`.

- [ ] **Step 9: Infra verde e saída idêntica**

Run:

```bash
pnpm exec vitest run scripts/infra
node "$SP/leitores.mjs" "$SP/depois.json" && diff "$SP/antes.json" "$SP/depois.json" && echo IGUAL
```

Expected: todos os testes de `scripts/infra` PASS; `IGUAL`. Qualquer diferença é defeito do
leitor novo, não da fotografia.

- [ ] **Step 10: Aceite do 01 (spec §8)**

```bash
grep -rnE "semAspas|recortar|ASPAS_EXTERNAS|\^ \{[0-9]" scripts/infra/lib/ ; echo "grep: $?"
grep -n "TEMPLATE\.\(slice\|indexOf\)" scripts/infra/*.test.mjs ; echo "grep: $?"
git diff --quiet HEAD -- vite.config.ts scripts/infra/lib/yaml.mjs scripts/infra/yaml.test.mjs; echo "intocados: $?"
pnpm typecheck && pnpm lint
```

Expected: `grep: 1`, `grep: 1`, `intocados: 0`, typecheck e lint sem erro.

- [ ] **Step 11: Commit**

```bash
pnpm exec prettier --write scripts/infra
git add scripts/infra
git commit -m "refactor(revisao-arquitetura): ler os templates de infra por um módulo só"
```

---

### Task 2: A zona declarada só no template (candidato 02, spec D7, D8, D9, D13)

**Files:**

- Modify: `scripts/infra/lib/zona.mjs:16-148,200-226,440-470`, `scripts/infra/zona.test.mjs`,
  `scripts/infra/conferir-zona.mjs`, `docs/infra/runbook-aws.md`,
  `docs/infra/zona-dns-lotusotec.md`
- Create: `docs/infra/conferencia-zona-<data>.md` (gerado pelo próprio `conferir-zona`)

**Interfaces:**

- Consumes: `lerRegistros(texto): RegistroLido[]` (Task 1).
- Produces, em `zona.mjs`:
  - `REGISTROS_DA_ZONA: readonly { nome: string, tipo: string }[]` — os 19 pares de hoje, na
    ordem do INVENTARIO atual, sem valor.
  - `MX_DO_GOOGLE: readonly string[]` — `'1 ASPMX.L.GOOGLE.COM.'`, `'5 ALT1.ASPMX.L.GOOGLE.COM.'`,
    `'5 ALT2.ASPMX.L.GOOGLE.COM.'`, `'10 ALT3.ASPMX.L.GOOGLE.COM.'`, `'10 ALT4.ASPMX.L.GOOGLE.COM.'`.
  - `conferirRegistrosDaZona(registros: readonly RegistroLido[]): string[]` — vazio quando o
    conjunto de `tipo nome` bate com `REGISTROS_DA_ZONA`; senão `ausente: ${tipo} ${nome}` e
    `fora da lista: ${tipo} ${nome}`, um por divergência.
  - `wildcardAusente(naAws: string[], servido: string[]): boolean` — os dois vazios.
  - `delegacaoEsperada(nomesDeServidor: string[]): string[]` — cada nome com ponto final.
- Saem: `INVENTARIO`, `NS_DA_STACKDNS` e o parâmetro `posDelegacao`.

- [ ] **Step 1: Reescrever os testes de `zona.test.mjs`**

- Import: sai `INVENTARIO`; entram `REGISTROS_DA_ZONA`, `MX_DO_GOOGLE`, `conferirRegistrosDaZona`.
- "acha exatamente um RecordSet por linha do inventário" vira:

```js
it('o template declara exatamente os registros da lista', () => {
  expect(conferirRegistrosDaZona(registros)).toEqual([])
})
it('leitura vazia e registro sumido reprovam', () => {
  expect(conferirRegistrosDaZona([])).toHaveLength(19)
  const semFtp = registros.filter((r) => r.nome !== 'ftp.lotusotec.cl.')
  expect(conferirRegistrosDaZona(semFtp)).toEqual([
    'ausente: CNAME ftp.lotusotec.cl.',
  ])
  const comExtra = [
    ...registros,
    {
      nome: 'x.lotusotec.cl.',
      tipo: 'A',
      ttl: 3600,
      valores: [],
      alias: false,
    },
  ]
  expect(conferirRegistrosDaZona(comExtra)).toEqual([
    'fora da lista: A x.lotusotec.cl.',
  ])
})
```

- O `describe` "contra o inventário medido" perde o laço por linha do INVENTARIO e passa a se
  chamar `'infra/lotus-dns.yaml contra as regras da zona'`.
- MX: `expect(mx?.valores.map(normalizar).sort()).toEqual(MX_DO_GOOGLE.map(normalizar).sort())`.
- "sistema saiu…": só a parte de `registros`.
- TTL: todo registro com `alias === false` tem `ttl` 3600, e há 15 deles (19 menos os 4 do corte).
- `describe('vereditos que a delegação inverte')` vira `describe('vereditos depois da delegação')`
  com: `wildcardAusente([], [])` true; `wildcardAusente([], ['185.146.167.195'])` false;
  `wildcardAusente(['185.146.167.195'], [])` false; e
  `delegacaoEsperada(['ns-31.awsdns-03.com', 'ns-904.awsdns-49.net.'])` igual a
  `['ns-31.awsdns-03.com.', 'ns-904.awsdns-49.net.']`. Os dois testes "antes da troca" saem.

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run scripts/infra/zona.test.mjs`
Expected: FAIL nos imports novos.

- [ ] **Step 3: `zona.mjs`**

Implementar o bloco **Produces**; apagar o que sai. O docstring de `REGISTROS_DA_ZONA` registra
que o INVENTARIO nasceu da medição do painel em 2026-09-20 e que, desde a delegação de
2026-09-26, o template é a fonte: a lista guarda nome e tipo para reprovar leitura vazia e
registro apagado sem querer, e o `conferir-zona` confere o valor contra a zona no ar. O docstring
de `NOMES_INVENTADOS` perde o "modo padrão (antes da troca)". `linhaConfere` e
`respostaDosNameservers` passam a citar "a linha do template" no lugar de "linha do `INVENTARIO`".

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run scripts/infra` — Expected: PASS.

- [ ] **Step 5: `conferir-zona.mjs` em modo único**

- Lê `lerRegistros(readFileSync('infra/lotus-dns.yaml', 'utf8'))` e itera esses registros no
  lugar do INVENTARIO.
- Sai a flag `--pos-delegacao` e a linha dela no comentário de uso. Em cada ternário
  `posDelegacao ? A : B`, fica `A`. `wildcardAusente(naAws, servido)` e
  `delegacaoEsperada(nomesDeServidor)` sem o terceiro argumento.
- O typedef `Linha` troca `inventario` por `template`. Cabeçalho da tabela:
  `'| Nome | Tipo | Template | AWS | DoH (\`dns.google\`) | Confere? |'`. A variável `naStack`vira`servido`.
- O comentário de topo descreve o que o script faz hoje: confere o template contra os
  nameservers da AWS (consulta direta, sem cache) e contra o DoH público, e grava a evidência.
- `--nameservers` e `--saida` ficam.

- [ ] **Step 6: Documentos**

- `runbook-aws.md`:
  - `:228-229` — o `conferir-zona` compara a zona no ar com o template;
  - §6.3 (`:266-292`) — um comando só, `pnpm infra:conferir-zona`, sem flag. Os parágrafos
    sobre o modo padrão e o bloco do `--pos-delegacao` saem. Uma frase de história: até
    2026-10-17 o script tinha um modo de antes da delegação, que saiu no `B9`;
  - `:403-404` e `:587-588` — subdomínio novo e os registros do SES são **uma** entrada em
    `RecordSets` mais o par nome e tipo em `REGISTROS_DA_ZONA`;
  - `:604`, `:809` — sem `--pos-delegacao`;
  - `:697` — remover do template e de `REGISTROS_DA_ZONA`.
- `zona-dns-lotusotec.md`:
  - `:211-214` — o comentário do bloco diz "conferir o template contra a zona no ar";
  - `:252-253` — "a lista de `scripts/infra/lib/zona.mjs`" no lugar de "o inventário…", e apex e
    `www` com `AliasTarget` no template;
  - `:156-157` fica: descreve um arquivo de 2026-09-26, gerado com a flag de então.

- [ ] **Step 7: Gates locais da task**

Run: `pnpm typecheck && pnpm lint && pnpm exec vitest run scripts/infra`
Expected: sem erro.

- [ ] **Step 8: Aceite ao vivo (spec D13)**

```bash
pnpm infra:conferir-zona; echo "conferir-zona: $?"
```

Expected: `conferir-zona: 0`, `Nenhuma divergência fora das esperadas.` no fim do relatório, e
`docs/infra/conferencia-zona-<data de hoje>.md` gravado. Exit `1` ou erro de credencial: parar e
reportar a João com a saída; não editar o relatório à mão nem trocar o critério.

- [ ] **Step 9: Aceite do 02 (spec §8)**

```bash
grep -rn "INVENTARIO\|pos-delegacao\|NS_DA_STACKDNS" scripts/ ; echo "grep: $?"
grep -n "conferir-zona --pos-delegacao" docs/infra/runbook-aws.md docs/infra/zona-dns-lotusotec.md ; echo "grep: $?"
```

Expected: `grep: 1` nos dois.

- [ ] **Step 10: Commit**

```bash
pnpm exec prettier --write scripts/infra docs/infra
git add scripts/infra docs/infra
git commit -m "refactor(revisao-arquitetura): declarar a zona DNS só no template"
```

---

### Task 3: O honeypot dentro do intake (candidato 03, spec D10, D11, §5.3)

**Files:**

- Modify: `src/lib/contact-fields.ts`, `src/lib/contact-schema.ts:5-10,12-19,29,49-59,61-78,84-103`,
  `src/integrations/contact/intake.ts:45-83`, `src/components/sections/ContactForm.tsx:130-141,218-228`,
  `lambda/contato/handler.ts:76-102`, `docs/adr/ADR-SITE-005.md`
- Test: `src/lib/contact-schema.test.ts`, `src/integrations/contact/intake.test.ts`,
  `src/components/sections/ContactForm.test.tsx`, `lambda/contato/handler.test.ts`

**Interfaces:**

- Produces: `export const CONTACT_HONEYPOT_FIELD = 'botcheck'` em `src/lib/contact-fields.ts`.
- `ContactFormInput` passa a `{ nombre, email, empresa, mensaje, captcha }`;
  `ContactFieldErrors` deriva dela e perde `botcheck`. `ContactMessage` não muda.

- [ ] **Step 1: Testes do intake**

Em `intake.test.ts`, a fixture `VALID` usa `[CONTACT_HONEYPOT_FIELD]: ''`. Substituir
"rejeita o bot antes da rede…" por:

```ts
it('armadilha preenchida é failed antes da rede: a porta não é chamada', async () => {
  const send = fakeSender()
  const result = await createContactIntake(send)(
    formDataOf({ ...VALID, [CONTACT_HONEYPOT_FIELD]: 'http://spam.example' }),
  )
  expect(result).toEqual({ status: 'failed' })
  expect(send).not.toHaveBeenCalled()
})
it('armadilha preenchida vence campo inválido: failed, não invalid', async () => {
  const send = fakeSender()
  const result = await createContactIntake(send)(
    formDataOf({ ...VALID, nombre: 'A', [CONTACT_HONEYPOT_FIELD]: 'x' }),
  )
  expect(result).toEqual({ status: 'failed' })
})
it('armadilha só com espaço conta como vazia', async () => {
  const send = fakeSender()
  await createContactIntake(send)(
    formDataOf({ ...VALID, [CONTACT_HONEYPOT_FIELD]: '   ' }),
  )
  expect(send).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Testes do schema, da view e da função**

- `contact-schema.test.ts`: `botcheck` sai das fixtures (`:17`, `:30`); o teste "rejeita quando o
  honeypot vem preenchido" (`:112-120`) sai; em "aceita entrada válida…", a asserção
  `'botcheck' in result.value` sai e o nome do teste perde ", sem o honeypot".
- `ContactForm.test.tsx`: sai "não fala em campos marcados quando só o honeypot falha"
  (`:247-263`). Os testes do input oculto (`:92-101`, `:125`) ficam, com
  `input[name="${CONTACT_HONEYPOT_FIELD}"]`.
- `handler.test.ts`, no lugar de "honeypot preenchido também é 400" (`:185-194`):

```ts
it('a função não conhece a armadilha: POST com botcheck vai ao captcha', async () => {
  const d = deps()
  d.verifyCaptcha.mockResolvedValue('rejected')
  const resposta = await createHandler(d)(
    evento({
      body: JSON.stringify({ ...MENSAGEM, botcheck: 'http://spam.example' }),
    }),
  )
  expect(resposta.statusCode).toBe(403)
  expect(d.verifyCaptcha).toHaveBeenCalledWith('token-de-teste')
  expect(d.log).toHaveBeenCalledWith({
    requestId: 'req-1',
    desfecho: 'captcha-recusado',
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run src/lib src/integrations/contact src/components/sections/ContactForm.test.tsx lambda/contato`
Expected: FAIL no import de `CONTACT_HONEYPOT_FIELD` e nos novos testes do intake e do handler.

- [ ] **Step 4: Implementar**

- `contact-fields.ts`: a constante, com docstring dizendo que é o nome do campo-armadilha, lido
  só pelo intake e escrito só pela view.
- `contact-schema.ts`: `botcheck` sai de `ContactFormInput`, do schema, de
  `normalizeContactInput`, de `isFieldName` e de `MESSAGES.honeypot`. O docstring `:5-10` diz que
  o honeypot é do intake, no navegador, e que a função não o conhece.
- `intake.ts`: dentro de `createContactIntake`, antes de `parseContactMessage`, lê
  `formData.get(CONTACT_HONEYPOT_FIELD)`; string com `trim()` não vazio devolve
  `{ status: 'failed' }`. `readContactFormData` não lê mais o campo. O docstring do intake cita a
  Emenda E2.
- `ContactForm.tsx`: `name={CONTACT_HONEYPOT_FIELD}`; o comentário `:134-136` sai, a allowlist
  `hasFieldErrors` e o comentário dela sobre o captcha ficam.
- `handler.ts`: `readInput` não lê `botcheck`; o comentário `:81-85` perde a frase sobre o campo.

- [ ] **Step 5: Rodar e ver passar**

Run: o comando do Step 3, mais `pnpm typecheck`. Expected: PASS e typecheck sem erro.

- [ ] **Step 6: Emenda E2 na `ADR-SITE-005`**

Depois da E1, no mesmo formato:

```markdown
## Emenda E2 — 2026-10-17, bloco `revisao-arquitetura-2026-09`

O corpo e a E1 não são reescritos. Detalhe na spec
[`2026-10-17-revisao-arquitetura-design.md`](../superpowers/specs/2026-10-17-revisao-arquitetura-design.md)
(D10, D11):

- **O honeypot saiu do schema compartilhado, revogando "O honeypot `botcheck` já existe no schema
  e continua" (linha 96).** O campo continua no formulário; quem o lê é o Contact intake, antes do
  schema, e armadilha preenchida vira `failed` sem rede. A tela é a mesma de antes.
- **A função não conhece o campo.** É o que a E1 D5 já dizia; agora o código também. POST direto
  com `botcheck` passa pelo schema e para no siteverify, com `403`. `D-54` continua aberto.
```

- [ ] **Step 7: Aceite do 03 (spec §8)**

```bash
grep -n "botcheck" src/lib/contact-schema.ts lambda/contato/handler.ts ; echo "grep: $?"
```

Expected: `grep: 1`.

- [ ] **Step 8: Commit**

```bash
pnpm exec prettier --write src/lib src/integrations/contact src/components/sections lambda/contato docs/adr/ADR-SITE-005.md
git add src lambda docs/adr/ADR-SITE-005.md
git commit -m "refactor(revisao-arquitetura): tirar o honeypot da interface do Contact intake"
```

---

### Task 4: Teste de contrato entre adapter e função (candidato 04, spec D12, §5.4)

**Files:**

- Create: `lambda/contato/contrato.test.ts`
- Modify: `lambda/contato/handler.ts:86-101`, `src/integrations/contact/intake.ts:45-60`

**Interfaces:**

- Consumes: `createApiContactoSender(): ContactSender` (`api-contacto.ts`);
  `createHandler(deps: ContactHandlerDeps)` e `FunctionUrlEvent` (`handler.ts`);
  `ContactMessage`, `ContactFieldName` (`src/lib/`).

- [ ] **Step 1: Escrever o teste de contrato**

`// @vitest-environment node`. Os dois testes montam o handler real (`log` vazio) e trocam o
`fetch` global (`vi.stubGlobal`, desfeito em `afterEach` com `vi.unstubAllGlobals()`) por um que
transforma o pedido do adapter em `FunctionUrlEvent` e a resposta do handler em `Response`:

```ts
const MENSAGEM: ContactMessage = {
  nombre: 'Ana Pérez',
  email: 'ana@lotusotec.cl',
  empresa: 'Lotus',
  mensaje: 'Necesito información sobre el curso de alta tensión.',
  captcha: 'token-de-teste',
}

function ligarAoHandler(handler: ReturnType<typeof createHandler>) {
  const fetchFalso = vi.fn<typeof fetch>(async (_url, init) => {
    const body = String(init?.body)
    const resultado = await handler({
      requestContext: {
        requestId: 'contrato',
        http: { method: init?.method ?? 'GET' },
      },
      body,
    })
    return new Response(resultado.body, {
      status: resultado.statusCode,
      headers: resultado.headers,
    })
  })
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

it('o corpo do adapter passa no handler, chega ao e-mail e volta como sent', async () => {
  const sendEmail = vi.fn<ContactHandlerDeps['sendEmail']>(() =>
    Promise.resolve(),
  )
  const fetchFalso = ligarAoHandler(
    createHandler({
      verifyCaptcha: () => Promise.resolve('ok'),
      sendEmail,
      log: () => {},
    }),
  )
  expect(await createApiContactoSender()(MENSAGEM)).toEqual({ status: 'sent' })
  expect(sendEmail).toHaveBeenCalledWith(MENSAGEM)
  const init = fetchFalso.mock.calls[0]?.[1]
  expect(new Headers(init?.headers).get('x-amz-content-sha256')).toBe(
    createHash('sha256').update(String(init?.body)).digest('hex'),
  )
})

it('a recusa da função volta ao adapter como failed', async () => {
  const sendEmail = vi.fn<ContactHandlerDeps['sendEmail']>(() =>
    Promise.resolve(),
  )
  ligarAoHandler(
    createHandler({
      verifyCaptcha: () => Promise.resolve('rejected'),
      sendEmail,
      log: () => {},
    }),
  )
  expect(await createApiContactoSender()(MENSAGEM)).toEqual({
    status: 'failed',
  })
  expect(sendEmail).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Provar o typecheck antes de seguir (spec §11)**

Run: `pnpm typecheck; echo "typecheck: $?"`
Expected: `typecheck: 0`. Se `tsconfig.lambda.json` recusar `api-contacto.ts` ou `intake.ts`
(tipo de DOM, `FormData`, `Response`), **parar**: apagar o arquivo novo, não contornar com cast
nem com `lib` nova, e devolver a decisão a João com a mensagem do `tsc`.

- [ ] **Step 3: Rodar o teste**

Run: `pnpm exec vitest run lambda/contato/contrato.test.ts` — Expected: PASS nos dois. Ele passa
de primeira porque o contrato já vale hoje; a prova de que ele morde é o Step 5.

- [ ] **Step 4: Tipar os dois leitores crus**

- `handler.ts`: `const read = (name: keyof ContactMessage): string`.
- `intake.ts`: `const read = (name: ContactFieldName | 'cf-turnstile-response'): string`
  (`ContactFieldName` de `src/lib/contact-fields.ts`; o nome do Turnstile segue literal, o 07
  está fora).

Run: `pnpm typecheck && pnpm exec vitest run src/integrations/contact lambda/contato`
Expected: sem erro.

- [ ] **Step 5: Mutação manual, revertida**

Em `api-contacto.ts`, trocar temporariamente `JSON.stringify(message)` por
`JSON.stringify({ ...message, nombre: undefined, nome: message.nombre })`.
Run: `pnpm exec vitest run lambda/contato/contrato.test.ts` — Expected: FAIL no primeiro teste
(`failed` no lugar de `sent`). Reverter com `git checkout -- src/integrations/contact/api-contacto.ts`
e rodar de novo: PASS. Registrar as duas saídas no relatório da execução.

- [ ] **Step 6: Commit**

```bash
pnpm exec prettier --write lambda/contato src/integrations/contact
git add lambda/contato src/integrations/contact/intake.ts
git commit -m "test(revisao-arquitetura): provar o contrato entre o adapter e a função do contato"
```

---

### Task 5: Gates (spec §8)

**Files:** nenhum.

- [ ] **Step 1: Critério específico primeiro**

Reler os Steps de aceite das Tasks 1 a 4 (Task 1 Step 9 e 10, Task 2 Step 8 e 9, Task 3 Step 7,
Task 4 Step 5) no relatório da execução. Faltou algum: voltar à task dona.

- [ ] **Step 2: `pnpm check` e `pnpm e2e`**

```bash
pnpm check; echo "check: $?"
pnpm e2e; echo "e2e: $?"
git status --short e2e/regressao-visual.spec.ts-snapshots ; echo "snapshots intocados"
```

Expected: `check: 0`, `e2e: 0`, nenhuma linha antes de "snapshots intocados". Registrar a
contagem de arquivos e testes de cada um.

- [ ] **Step 3: Árvore espelhada (`D-62`)**

```bash
D="$SP/espelho-$(date +%s)"; mkdir "$D"
mapfile -t EX < <(grep -vE '^\s*(#|$)' .espelho-exclusoes | sed -E 's#/$##; s#^#:(exclude)#')
git archive HEAD -- . "${EX[@]}" | tar -x -C "$D"
(cd "$D" && pnpm install --frozen-lockfile --offline && pnpm check); echo "espelho: $?"
```

Expected: `espelho: 0` (o `agent:check` se pula sozinho lá). Nenhum commit nesta task.

---

## Handoff de execução

executor: claude
reviewer: claude
paths_autorizados:

- não se aplica (executor = claude)

Exceção declarada: Codex sem cota em 2026-10-17; João autorizou Claude nos dois papéis.
`reviewer_exception` no estado e débito `D-77` entram na transição para `ready_for_execution`
(spec D14). A review de `/revisar-site` acontece, mas não vale como lente independente.
