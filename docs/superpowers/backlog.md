# Backlog — Lotus Site

> Fila operacional local. Não é fase e não autoriza execução: item só fica ativo por seleção
> explícita do João em `docs/superpowers/state.md`. Notion é o roadmap externo; este arquivo é o
> recorte ainda relevante. Item fechado sai daqui e o rastro fica em
> `docs/superpowers/historico/progress.md`.
>
> Este arquivo nunca promove item, nunca define fase e nunca replica todas as tasks do Notion.

## Fluxo

```text
Notion → backlog.md → state.md → context packet → brainstorm/spec/plan → execução → review →
closure → progress.md
```

`seleção explícita → context_required (quando indicado) → /planejar-site → /executar-site →
/revisar-site → /fechar-site`

---

# AGORA

Nada ativo. `docs/superpowers/state.md` está em `idle`: o próximo item entra por seleção explícita
do João, nunca por promoção automática deste arquivo.

O bloco `3.1.1`–`3.2.11` (Clone estático — Sprint 2) fechou em 2026-08-26 no PR
https://github.com/Andred21/lotus-site/pull/6; o rastro está em
`docs/superpowers/historico/progress.md`. **Pendência aberta com João:** a conferência humana de
paridade visual contra os cinco PNG de `docs/inventario/baseline/` é parte do aceite e não foi feita
— nenhum gate a substitui.

---

# DEPOIS

Tema, sem replicar EAP. Contagem medida contra o Notion em 2026-08-24.

- **Formulário e integrações** — Sprint 3 (10).
- **SEO e acessibilidade** — Sprint 4 (10).
- **QA visual e performance** — Sprint 5 (8).
- **Deploy e go-live** — Sprint 6 (12).
- **Evolução pós-clone** — Sprint 7 (7).
- **Workflow IA** — Sprint 8 (3): `9.1.1`–`9.1.3`, ver `D-03`.

---

# DÉBITOS

- **D-01 · Notion descreve Next.js onde o repositório é Vite** — `4.1.2`, `4.1.3`, `5.1.1`, `5.1.2`,
  `5.2.2` e `7.1.1` citam Server Action, App Router, `next/image` ou sitemap via Next.js. A task
  `1.2.1` entregou Vite + React + TypeScript e está Concluída. Essas tasks são stale até
  reconciliação; não atualizar Notion sem autorização explícita do João.
  **Gatilho:** antes de planejar Sprint 3.
- **D-02 · 1.1.6 e 1.3.5 tocam a mesma fronteira** — `1.1.6` escreve as regras de camada e a catraca
  de import; `1.3.5` cria as pastas com consumidor real. Nenhum diretório nasce em `1.1.6`.
  **Gatilho:** ao planejar `1.3.5`.
- **D-03 · Sprint 8 pressupõe harness criado após a estabilização** — `9.1.2` prevê definir
  `AGENTS.md`/`CLAUDE.md` a partir da arquitetura consolidada, mas os dois existem desde o bootstrap
  e `1.1.6` os endurece. Reconciliar o escopo de `9.1.1`–`9.1.3`.
  **Gatilho:** ao planejar Sprint 8.
- **D-04 · Limite numérico de tamanho/complexidade adiado** — sem amostra do clone não há como
  calibrar `max-lines`, `max-lines-per-function` ou `complexity`; hoje a regra é textual.
  **Gatilho:** após Sprint 2.
- **D-06 · `scripts/*.mjs` fora de qualquer projeto TypeScript** — `tsconfig.node.json` tem
  `"include": ["vite.config.ts"]`, então `scripts/validate-agent-workflow.mjs` não é typechecked por
  `tsc -b` nem coberto pelo `strict` ligado em `1.2.3`. Levantado na review de `1.2.2+1.2.3` como
  suggestion e deixado fora do escopo.
  **Gatilho:** ao planejar `1.3.6` (scripts de qualidade) ou `1.3.7` (CI).
  **Fechado por este bloco** (`1.2.4`–`1.3.9`) em 2026-08-24.
- **D-07 · `engineStrict` exige Node 24 no CI** — com `engineStrict: true`, qualquer script pnpm
  morre com `ERR_PNPM_UNSUPPORTED_ENGINE` fora da faixa de `engines`. O runner precisa ler `.nvmrc`.
  **Gatilho:** ao planejar `1.3.7`.
  **Fechado por este bloco** (`1.2.4`–`1.3.9`) em 2026-08-24.
- **D-05 · Cobertura de gate incompleta** — `agent:check` não roda em CI até `1.3.7`; review visual
  não tem Playwright até `1.3.3`. A limitação é registrada no relatório de review, nunca simulada.
  **Gatilho:** ao fechar `1.3.3` e `1.3.7`.
  **Parcialmente fechado por este bloco** (`1.2.4`–`1.3.9`) em 2026-08-24 — `agent:check` passou a
  rodar em CI e o Playwright passou a existir.
- **D-08 · Tailwind entrou sem EAP própria** — nenhuma task do roadmap instala `tailwindcss`,
  mas `1.2.5` pede `tailwind-merge` e `1.3.1` pede `prettier-plugin-tailwindcss`. Tailwind foi
  absorvido por `1.2.5` por decisão de João em 2026-08-24. Reconciliar com o Notion quando
  houver autorização de escrita.
  **Gatilho:** junto de `D-01`, antes de planejar o Sprint 3.
- **D-09 · Estrutura de `1.3.5` divergiu do Notion** — a EAP pedia `features/contact`, `config`,
  `tests` e `docs`; `.claude/rules/architecture.md` venceu e esses diretórios não nasceram, por
  decisão de João em 2026-08-24. `components/`, `app/` e `integrations/` nascem com consumidor
  real.
  **Gatilho:** ao planejar o Sprint 3.
- **D-10 · Playwright cobre só Chromium** — WebKit e Firefox ficaram de fora do baseline por
  não haver clone a comparar. Paridade visual em outro motor não é verificada hoje.
  **Gatilho:** ao planejar o Sprint 5.
- **D-11 · axe reporta mas não reprova** — a auditoria de `1.3.4` executa e anexa
  `axe-home.json`, sem transformar violação em falha, porque o alvo é a home do scaffold Vite.
  **Gatilho:** ao planejar o Sprint 4.
- **D-12 · `3.1.4` manda os assets para `public/`, a rule manda para `src/assets/`** — o título da EAP
  é "Migrar assets para public", mas `.claude/rules/architecture.md:12` e `CLAUDE.md:92` reservam
  `public/` para arquivo que precisa de URL estável. João decidiu em 2026-08-25 que a regra do
  repositório vence: as imagens de conteúdo ficam em `src/assets/` (fingerprint do Vite) e só os 4
  ícones de `<head>` vão para `public/`. Foram 6 imagens, não 7: `background-texture.jpg` não
  pinta pixel visível no baseline e ficou de fora como divergência intencional. O Notion fica
  stale até reconciliação autorizada.
  **Gatilho:** junto de `D-01`, `D-08` e `D-09`, antes de planejar o Sprint 3.
- **D-13 · `3.1.1` usa vocabulário de Next.js** — o critério de aceite diz "sem Client Component
  desnecessário"; o repositório é Vite + React, onde esse conceito não existe. Lido como "não
  introduzir estado/interatividade sem necessidade". Terceira instância do mesmo problema de `D-01`,
  agora dentro do Sprint 2.
  **Gatilho:** junto de `D-01`, antes de planejar o Sprint 3.
- **D-14 · breakpoints exatos não medidos** — `05-layout.md` só prova que a virada do menu
  desktop/mobile e a do container `1080px` ficam entre `768` e `1440`; `1350px` é derivação da regra
  dos 80%, não largura medida. A EAP `3.2.10` precisa dos quatro viewports-alvo, não do valor exato,
  então o bloco não fica bloqueado — mas o clone escolhe um breakpoint sem medição que o confirme.
  **Fechado por este bloco** (`3.1.1`–`3.2.11`) em 2026-08-26 — o commit `chore(3.1.2)` mediu
  `900`–`1400` e `05-layout.md:64-76` registra as duas viradas; o clone usa `1000px`, medido.
- **D-15 · rule de ícones ficou órfã** — `.claude/rules/architecture.md:13` manda ícone novo entrar
  como `<symbol id>` em `public/icons.svg`; o sprite era do scaffold Vite, morreu no commit
  `feat(3.1.1)` junto do `App.tsx` que o consumia, e os ícones deste bloco vêm de `lucide-react`.
  `public/` hoje só tem os quatro `cropped-Logo-*.png`. `.claude/rules/**` não está em
  `paths_autorizados` do bloco, então a rule não foi corrigida aqui.
  **Gatilho:** task própria de manutenção das rules, antes de planejar o Sprint 3.
- **D-16 · `extract-styles.mjs` ainda mede o nó-eco escondido do Divi** — `extract-styles.mjs:68` usa
  `section.querySelector(selector)`, que pega o primeiro nó do seletor na seção e alcança o eco
  duplicado pelo Divi (`hero.title_subtitle_echo`). O commit `chore(3.1.2)` corrigiu a **cor**
  (`cssColor` preserva o alpha) e documentou os quatro casos conhecidos em `04-tipografia.md`, mas
  não corrigiu a seleção do nó: regerar `styles.json` sem tratar isso reintroduz o erro em qualquer
  seção nova.
  **Gatilho:** antes de qualquer regeração de `styles.json` ou de inventário de página nova.
- **D-17 · envio real do formulário não provado** — não existe conta nem access key do Web3Forms
  nesta rodada (decisão de João em 2026-08-27, D6 da spec do bloco `4.1.1-4.1.10`). O adapter
  `src/integrations/contact/web3forms.ts` está provado contra a API documentada — `fetch` duplicado
  no teste unitário e `page.route` interceptando `api.web3forms.com` no E2E —, mas nenhuma mensagem
  chegou a uma caixa de entrada real, e o aceite da `4.1.7` fecha como **parcial declarado**.
  **Gatilho:** quando João criar a conta, antes de `7.1.4` e do go-live.
