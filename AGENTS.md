# AGENTS.md — Lotus Site

> Entrada do Codex. Claude Code + Superpowers orquestram o workflow; este arquivo não redefine produto, arquitetura ou estado.

## Papel

Codex é agente auxiliar de leitura, Context Packet, execução mecânica explicitamente delegada e revisão independente.

Contratos de delegação vivem em `.agents/skills/<nome>/SKILL.md`.

## Bootstrap

Leia nesta ordem:
1. `CLAUDE.md`;
2. `docs/superpowers/state.md`;
3. packet/spec/plano apontados pelo estado, ignorando `null`;
4. somente as rules aplicáveis aos paths do trabalho.

## Fonte de tasks

Notion canônico: `collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2`.
Use IDs estáveis; nome de exibição não basta como proveniência.

## Limites

- Não altere `docs/superpowers/state.md`.
- Não modifique `CLAUDE.md`, `AGENTS.md`, `.claude/**` nem `.agents/**`; mudança no harness é executada por Claude.
- Não replaneje nem aumente escopo recebido.
- Não escreva em Notion, Drive ou Figma.
- Não execute commit, push, PR, merge, rebase destrutivo ou exclusão de branch; o histórico é escrito por Claude.
- Não crie nem troque de branch; trabalhe na branch que Claude já deixou ativa.
- Execução delegada toca somente `paths_autorizados`.
- Preserve WIP.
- Nunca declare comando/teste como executado sem saída real.

Quando uma skill definir contrato de saída mais estrito, ele prevalece.
