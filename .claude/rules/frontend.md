---
paths:
  - 'src/**/*.ts'
  - 'src/**/*.tsx'
  - 'src/**/*.css'
---

# Frontend — Lotus Site

## Responsabilidade

- Um componente responde por uma pergunta: o que ele renderiza. Se o nome precisa de "e" para
  descrever o que faz, são dois componentes.
- Extrair quando: o trecho é usado em dois lugares, tem estado próprio, ou tem teste próprio.
- Não extrair quando: o trecho é usado uma vez, não tem estado e só existe para encurtar o arquivo.
  Seção grande e linear de landing page é legítima.

## Estado e hooks

- Estado derivável de props/estado existente é calculado no render, nunca guardado em `useState`.
- `useEffect` só para sincronizar com sistema externo (DOM, rede, timer). Nunca para derivar dado.
- Hook customizado nasce quando a mesma lógica com estado aparece em dois componentes.

## Props e tipagem

- Props tipadas explicitamente; sem `any` e sem cast para contornar erro do compilador.
- `verbatimModuleSyntax` está ligado: import/export somente-tipo usa a palavra `type`.
- Prop booleana sem consumidor é removida, não deixada "para depois".
- Estado impossível não é representável: prefira união discriminada a booleanos independentes.

## Conteúdo e tokens

- String institucional repetida vive em `src/content/`, não espalhada por JSX.
- Cor, fonte e espaçamento novos viram token no bloco `:root` de `src/index.css`; componente não fixa
  valor cru.

## Acessibilidade e responsividade

- Elemento interativo é elemento nativo ou tem papel, nome acessível e foco visível.
- Imagem com conteúdo tem `alt`; imagem decorativa tem `alt=""`.
- A UI é verificada nas larguras que o clone exige antes de a task ser dada como pronta.

## Imports e efeitos colaterais

- Módulo que exporta componente não exporta helper/constante quando isso viola
  `react-refresh/only-export-components`.
- Componente não chama `fetch` nem `XMLHttpRequest`; integração vive em `src/integrations/` e entra
  por prop/callback.
- Import respeita a direção declarada em `architecture.md`.

## Clone versus evolução

- Durante o clone, fidelidade aprovada vence preferência estética do agente.
- Durante a evolução, mudança visual relevante exige design aprovado antes do código.
